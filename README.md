# Hacktoberfest Weekend Challenge — Build for a Friend | AlgoAtlas

# AlgoAtlas

> **A focused DSA practice workspace that turns scattered problem lists into one structured practice flow.**

AlgoAtlas is a local-first coding practice platform built for learners who are tired of jumping between LeetCode, Codeforces, GeeksforGeeks, CodeChef, Striver A2Z, interview lists, and community discussions just to decide what to solve next.

The goal is simple:

> **Spend less time deciding what to practice. Spend more time getting better.**

---

## Why AlgoAtlas?

DSA preparation is rarely blocked by a lack of problems. It is often blocked by:

* Too many problem lists
* Repeated questions across platforms
* Difficulty choosing the next problem
* Weak topic coverage
* Scattered interview-preparation resources
* Switching between problem statement, editor, and compiler

**AlgoAtlas brings those pieces into a single workspace.**

---

## Features

### 1. Curated Problem Explorer

Browse a growing problem library with:

* Topic filters
* Difficulty filters
* Platform filters
* Collection filters
* Search
* Top 10 / 20 / 50 / 100 problem views
* Custom problem-set size

Problems are sourced from multiple public ecosystems, including:

* LeetCode
* Codeforces
* CodeChef
* GeeksforGeeks
* takeUforward / Striver A2Z
* NeetCode 150
* Blind 75 / Grind 75
* Community interview reports

Each problem keeps a link back to its original publisher/source.

---

### 2. Pattern-Based Recommendations

The overview page recommends a next problem using signals such as:

* Topic coverage
* Problem popularity
* Interview-oriented lists
* Recent community interview reports
* Difficulty and progression

The intention is not to randomly generate another question, but to answer:

> **"What should I practice next?"**

---

### 3. Structured Topic Roadmap

AlgoAtlas organizes preparation into learning paths covering areas such as:

* Arrays & Strings
* Hash Maps
* Sliding Window
* Trees
* Dynamic Programming
* Graphs
* Binary Search
* Greedy
* Backtracking
* Heaps
* Tries
* Design

The roadmap is designed around **patterns rather than an unstructured problem dump**.

---

### 4. Built-in Coding Workspace

Problems can be opened directly inside the AlgoAtlas IDE.

The editor provides:

* Problem statement
* Constraints
* Published sample cases
* Source link
* Language selection
* Local draft saving
* Sample execution

Supported languages include:

* JavaScript
* Python 3
* Java
* C++

---

### 5. Local Code Execution

The project includes a lightweight Node.js backend that creates temporary working directories and executes programs locally.

The runner supports:

* JavaScript
* Python
* Java
* C++

It also applies an execution timeout to prevent a runaway program from running indefinitely.

Problem-specific execution can build language-specific harnesses around imported sample tests.

---

### 6. Progress Tracking

Practice activity is stored locally in the browser and feeds:

* Solved count
* Recent practice history
* Topic coverage
* Streak/activity views
* Weekly focus
* Saved drafts

---

### 7. Local-First by Design

AlgoAtlas does not require a database or external account just to start practicing.

Drafts, preferences, and demo authentication state are stored locally in the browser.

Platform account connections are intentionally not presented as working integrations. The UI clearly communicates that authenticated judge submissions are **not connected yet**.

---

# Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Responsive UI
* Browser LocalStorage

## Backend

* Node.js
* Node `http`
* Node `fs`
* Node `child_process`

## Execution

* JavaScript via Node.js
* Python 3
* Java / `javac`
* C++17 / `g++`

No frontend framework is required.

No database is required.

No build step is required.

---

# Project Structure

The project intentionally stays small:

```text
AlgoAtlas/
├── index.html
├── server.js
└── README.md
```

### `index.html`

Contains the complete AlgoAtlas interface, problem catalog, roadmap, editor UI, filtering, recommendations, local persistence, and browser-side interactions.

### `server.js`

Provides:

* Static file serving
* `/api/run` execution endpoint
* Local program execution
* JavaScript / Python / Java / C++ support
* Problem-specific sample-test harnesses
* Syntax checking
* Temporary execution directories
* Execution timeout and input-size limits

---

# Running Locally

## Prerequisites

Install:

* Node.js
* Python 3 — for Python execution
* JDK — for Java execution
* `g++` — for C++ execution

## Start the Application

```bash
node server.js
```

Then open:

```text
http://127.0.0.1:4173
```

Keep the terminal running while using the editor.

---

# How Execution Works

For standalone programs, AlgoAtlas sends the code and selected language to the local Node server.

The server:

1. Validates the request
2. Creates a temporary directory
3. Writes the source file
4. Invokes the appropriate runtime/compiler
5. Captures stdout/stderr
6. Returns the result
7. Removes the temporary directory

For imported problem samples, the backend can construct a small Java or C++ harness around the user's `Solution` implementation and execute the published sample cases.

> **Important:** AlgoAtlas does not submit code to LeetCode, Codeforces, CodeChef, or another judge. The current implementation only runs local/public sample checks.

---

# Open Innovation

AlgoAtlas is built around open learning ecosystems rather than locking the learner into a single source.

Instead of treating one platform as the entire preparation universe, it brings together:

* Public problem collections
* Open interview-preparation resources
* Contest archives
* Structured roadmaps
* Community-reported interview experiences

This matters because the useful part of DSA preparation is often the **pattern connecting multiple sources**, not the platform where an individual problem happens to live.

AlgoAtlas preserves the original source links rather than hiding where problems came from.

---

# AI / Agent Note

The current two-file implementation does **not** contain a direct AI-model API integration or an embedded open-weight model.

The project therefore does not claim that an AI model generates the recommendations or problem statements.

If an AI/agent workflow was used during development, that should be described separately as **AI-assisted development**, not as an AI feature of AlgoAtlas.

This distinction is intentional: the project should be judged on what it actually implements.

---

# Current Limitations

This is an early local-first build. Some features are deliberately marked as future integrations:

* Authenticated platform account syncing
* Official judge submissions
* Hidden test execution
* Persistent cloud profiles
* Real-time platform statistics
* Production authentication/backend
* Live problem synchronization

The UI explicitly avoids pretending these integrations already exist.

---

# Roadmap

## Near Term

* Persistent user accounts
* Real platform profile connections
* Richer progress analytics
* Synchronized problem metadata
* Stronger recommendation signals

## Future

* Adaptive practice plans
* Personalized weak-topic detection
* Spaced repetition
* Contest-mode practice
* Collaborative practice rooms
* Optional AI-assisted explanations using an open-weight model

---

# Design Philosophy

AlgoAtlas follows three principles.

### Less Decision Fatigue

The learner should not need ten browser tabs to decide what to solve.

### Practice by Patterns

The objective is not simply to increase a solved count. It is to build transferable problem-solving patterns.

### Be Honest About Integrations

A local sample runner should be called a local sample runner.

A future API connection should be called a future API connection.

**AlgoAtlas keeps those boundaries visible.**

---

# Hacktoberfest Weekend Challenge

Built for the **Hacktoberfest Weekend Challenge — Build for a Friend**.

The project was designed around a practical problem faced by DSA learners:

> **Having access to hundreds of questions but lacking a clear, focused path through them.**

The goal of AlgoAtlas is simple:

> **One good problem at a time.**

---

# License

Add the license you choose for the repository before publishing.
