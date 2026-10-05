const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY = 128 * 1024;
// Give compiler startup (especially javac and Python) time on slower machines,
// while still stopping accidental infinite loops in user programs.
const TIMEOUT_MS = 20_000;
const PYTHON = process.env.ALGOLATLAS_PYTHON || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe');

function run(command, args, cwd, stdin = '') {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(command, args, { cwd, windowsHide: true, shell: false });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Execution timed out after ${TIMEOUT_MS / 1000} seconds.`));
    }, TIMEOUT_MS);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdin.end(stdin);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error((stderr || stdout || `Process exited with code ${code}`).trim()));
    });
  });
}

async function executeProgram(payload) {
  const { code, language, stdin = '' } = payload;
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('Code is missing or exceeds 100 KB.');
  if (typeof stdin !== 'string' || stdin.length > MAX_BODY) throw new Error('Standard input is too large.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'algoatlas-program-'));
  try {
    let result;
    if (language === 'JavaScript') {
      fs.writeFileSync(path.join(dir, 'main.js'), code);
      result = await run(process.execPath, ['main.js'], dir, stdin);
    } else if (language === 'Python' || language === 'Python 3') {
      fs.writeFileSync(path.join(dir, 'main.py'), code);
      try { result = await run(PYTHON, ['main.py'], dir, stdin); }
      catch (error) {
        if (['ENOENT', 'EPERM', 'EACCES'].includes(error.code)) throw new Error('Python 3 could not be started. Set ALGOLATLAS_PYTHON to a working Python executable, then restart this runner.');
        throw error;
      }
    } else if (language === 'Java') {
      fs.writeFileSync(path.join(dir, 'Main.java'), code);
      await run('javac', ['Main.java'], dir);
      result = await run('java', ['Main'], dir, stdin);
    } else if (language === 'C++') {
      fs.writeFileSync(path.join(dir, 'main.cpp'), code);
      await run('g++', ['main.cpp', '-std=c++17', '-O0', '-o', 'main.exe'], dir);
      result = await run(path.join(dir, 'main.exe'), [], dir, stdin);
    } else throw new Error('Choose JavaScript, Python, Java, or C++.');
    return { stdout: result.stdout.trimEnd(), stderr: result.stderr.trimEnd() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function javaLiteral(value) {
  if (Array.isArray(value)) return `new int[]{${value.join(',')}}`;
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function cppLiteral(value) {
  if (Array.isArray(value)) return `vector<int>{${value.join(',')}}`;
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function makeJavaHarness(source, fn, tests) {
  const calls = tests.map(test => {
    const args = test.args.map(javaLiteral).join(', ');
    return `System.out.println(json(solution.${fn}(${args})));`;
  }).join('\n');
  return `import java.util.*;\n${source}\nclass Main {\n  static String json(Object value) {\n    if (value instanceof int[]) return Arrays.toString((int[]) value).replace(" ", "");\n    if (value instanceof boolean[]) return Arrays.toString((boolean[]) value);\n    return String.valueOf(value);\n  }\n  public static void main(String[] args) {\n    Solution solution = new Solution();\n    ${calls}\n  }\n}\n`;
}

function makeCppHarness(source, fn, tests) {
  const declarations = [];
  const calls = tests.map((test, caseIndex) => {
    const args = test.args.map((value, argIndex) => {
      if (Array.isArray(value)) {
        const name = `__arg_${caseIndex}_${argIndex}`;
        declarations.push(`vector<int> ${name}{${value.join(',')}};`);
        return name;
      }
      return cppLiteral(value);
    }).join(', ');
    return `printJson(solution.${fn}(${args}));`;
  }).join('\n');
  return `#include <bits/stdc++.h>\nusing namespace std;\n${source}\ntemplate<class T> void printJson(const T& value) { cout << value << '\\n'; }\nvoid printJson(const vector<int>& value) { cout << '['; for (size_t i=0;i<value.size();i++){if(i)cout<<',';cout<<value[i];} cout<<"]\\n"; }\nint main(){ Solution solution; ${declarations.join(' ')} ${calls} return 0; }\n`;
}

async function execute(payload) {
  const { code, language, problem } = payload;
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('Code is missing or exceeds 100 KB.');
  if (!problem || !Array.isArray(problem.tests) || !problem.tests.length) throw new Error('No imported sample cases are available for this problem.');
  if (!['Python 3', 'Java', 'C++'].includes(language)) throw new Error('This local compiler endpoint does not support that language.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'algoatlas-run-'));
  try {
    if (language === 'Python 3') {
      const main = `\nimport json\n_cases = ${JSON.stringify(problem.tests)}\nprint(json.dumps([${problem.tests.map((_, i) => `__run_case_${i}()`).join(', ')}]))\n`;
      const calls = problem.tests.map((test, i) => `def __run_case_${i}():\n    return ${problem.runnerFunction}(*${JSON.stringify(test.args)})`).join('\n');
      fs.writeFileSync(path.join(dir, 'main.py'), `${code}\n${calls}${main}`);
      let result;
      try {
        result = await run(PYTHON, ['main.py'], dir);
      } catch (error) {
        if (['ENOENT', 'EPERM', 'EACCES'].includes(error.code)) throw new Error('Python 3 could not be started. Set ALGOLATLAS_PYTHON to a working Python executable, then restart this runner.');
        throw error;
      }
      return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
    }
    if (language === 'Java') {
      fs.writeFileSync(path.join(dir, 'Main.java'), makeJavaHarness(code, problem.runnerFunction, problem.tests));
      await run('javac', ['Main.java'], dir);
      const result = await run('java', ['Main'], dir);
      return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
    }
    fs.writeFileSync(path.join(dir, 'main.cpp'), makeCppHarness(code, problem.runnerFunction, problem.tests));
    await run('g++', ['main.cpp', '-std=c++17', '-O0', '-o', 'main.exe'], dir);
    const result = await run(path.join(dir, 'main.exe'), [], dir);
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function executeCheck(payload) {
  const { code, language } = payload;
  if (typeof code !== 'string' || code.length > 100_000) throw new Error('Code is missing or exceeds 100 KB.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'algoatlas-check-'));
  try {
    let command, args, file;
    if (language === 'JavaScript') { file = 'main.js'; command = process.execPath; args = ['--check', file]; }
    else if (language === 'Python' || language === 'Python 3') { file = 'main.py'; command = PYTHON; args = ['-m', 'py_compile', file]; }
    else if (language === 'Java') { file = 'Main.java'; command = 'javac'; args = ['Main.java']; }
    else if (language === 'C++') { file = 'main.cpp'; command = 'g++'; args = ['-std=c++17', '-fsyntax-only', file]; }
    else throw new Error('Choose JavaScript, Python, Java, or C++.');
    fs.writeFileSync(path.join(dir, file), code);
    let result;
    try { result = await run(command, args, dir); }
    catch (error) {
      if (['ENOENT', 'EPERM', 'EACCES'].includes(error.code)) throw new Error(`${language} compiler could not be started. Check that its runtime is installed and accessible.`);
      throw error;
    }
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), checkOnly: true };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY) reject(new Error('Request body is too large.'));
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/run') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const payload = JSON.parse(await readBody(request));
      const result = payload.mode === 'program' ? await executeProgram(payload) : payload.mode === 'check' ? await executeCheck(payload) : await execute(payload);
      response.end(JSON.stringify(result));
    } catch (error) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: error.message || String(error) }));
    }
    return;
  }
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const file = path.resolve(ROOT, requested);
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
  fs.createReadStream(file).pipe(response);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`AlgoAtlas local runner: http://127.0.0.1:${PORT}`);
  console.log('Keep this terminal open while using Run. The server only listens on this computer.');
});
