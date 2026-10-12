# Architecture

This document explains how the Sparta Global SQL Practice Lab is put together. It covers why it's built this way, how
the pieces fit, and how to make common changes safely. It's written for a developer picking the project up for the
first time. For setup and day-to-day editing, start with the [README](README.md).

---

## 1. The big picture

The site is a **single static HTML file** with a **SQL engine inside it**.

```
 Source (src/, data/)  ──►  npm run build  ──►  dist/index.html (one file, ~1.8 MB)  ──►  GitHub Pages
      you edit this       checks, then inlines       everything the site needs            what visitors download
                          every file into one
```

- **Everything runs in the browser.** [sql.js](https://sql.js.org), SQLite compiled to JavaScript, executes every query.
  The Northwind database is embedded in the page and loaded into memory when it opens.
- **There is no server and no backend database.** Queries never leave the learner's machine.
- **No framework.** The UI is plain JavaScript that builds DOM elements with a small `h()` helper.
- **Learner progress lives in the browser** (`localStorage`). Nothing is sent anywhere.

### Why these choices

| Decision | Why |
|---|---|
| **A real SQL engine in the browser** | Learners need to run real SQL and see real errors. Installing MySQL or SQL Server is the biggest barrier to practising, and a server-side sandbox would need hosting, security and money. sql.js gives a full engine with nothing to install. |
| **SQLite with a dialect layer** | The course teaches MySQL and T-SQL. Rather than teach a third dialect, the site accepts the course's syntax and translates it, telling the learner when it does. |
| **The asm.js build of sql.js** | It's plain JavaScript, so it runs under strict hosting rules that block WebAssembly or extra files. It costs ~1.3 MB, which loads in a second or two. |
| **One self-contained file** | It works from GitHub Pages, from a double-click on someone's desktop, from SharePoint or inside a learning platform, with no paths to configure. |
| **Marking by result, not by text** | There are many correct ways to write most queries. Comparing what a query *returns* with what the model answer returns accepts all of them. |
| **Content as JavaScript data** | Lessons and questions are data (titles, tasks, answers), so adding one needs no new code. `npm run check` runs every one before a build. |
| **Hash routing** (`#/lesson/select`) | Works in a single file and on any host, and the browser's back button works. |
| **localStorage for progress** | The only persistence available without a server. It's private to each learner and matches the ISTQB study site. |

---

## 2. How an address becomes a page

All pages are sections in `src/index.html` (or built into them by script). `route()` in `src/app.js` reads the address
after `#`, shows one section, and calls its render function.

| Address | View (section id) | Rendered by |
|---|---|---|
| `#/path` | `v-path` | `renderPath()` |
| `#/lesson/erd` | `v-erd` | static HTML + `drawLesson()` (diagram, legend, Check yourself) |
| `#/lesson/build` | `v-build` | `renderBuild()`, `runBuild()`, `drawBuildErd()` |
| `#/lesson/map` | `v-map` | `drawMap()` |
| `#/lesson/<id>` (any other lesson) | `v-lesson` | `openLesson()` → `renderLessonTabs()`, `renderLessonBody()` |
| `#/quiz` | `v-quizzes` | `renderQuizList()` |
| `#/quiz/<id>` | `v-quiz` | `openQuiz()` → `renderQuiz()` |
| `#/free` | `v-free` | `runFree()` |

After every route change, `renderChrome()` draws the breadcrumb and the lesson footer (previous / next lesson and what's
left to complete). Any element with a `data-go` attribute navigates when clicked: `data-go="select"` opens a lesson,
`data-go="path"`, `data-go="quiz"`, `data-go="quiz/a"` and `data-go="free"` open the other pages.

---

## 3. The content layer

Content lives in `src/content/` and is plain JavaScript, loaded before the app code.

### Units and lessons: `src/content/lessons.js`

```js
const UNITS   = [ { id, title, blurb, lessons: ['select', 'operators', …] }, … ];   // order of the path
const LESSONS = { select: { title, summary, learn, ex: [ { p, hint, sol, ordered? }, … ] }, … };
const PATH    = UNITS.flatMap(…);                                                      // every lesson, in order
```

| Lesson field | Meaning |
|---|---|
| `title`, `summary` | Shown on the path and at the top of the lesson |
| `learn` | HTML for the Learn tab. `C(sql)` makes a runnable example, `C(sql, false)` a read-only one, `TIP(html)` a tip box |
| `ex` | The exercises: `p` (the task), `hint`, `sol` (a model answer) and optionally `ordered` |
| `checkpoint: true` | A checkpoint: no Learn tab, shown as a diamond on the path |
| `kind: 'erd' \| 'build' \| 'map'` | A Foundations lesson with its own page (see section 7) |

### Quizzes: `src/content/quizzes.js`

```js
const QUIZ_SETTINGS = { passMark: 65, timeLimits: [30, 45, 0], defaultLimit: 30, mixSize: 10 };
const QUIZZES = [ { id: 'a', title, blurb, questions: [ { unit, p, sol, why, ordered? }, … ] }, … ];
```

`unit` is the path unit a question belongs to (2–6), used for the "Score by unit" table. `why` is shown in the review.
**Mixed practice** (`id: 'mix'`) isn't in the file: `mixQuiz()` in `src/quiz.js` builds it from the lesson exercises,
using each exercise's `hint` as its `why`.

### The rules the checks enforce

`scripts/check.mjs` runs before every build (section 10). It fails the build if:

- a lesson listed in `UNITS` isn't in `LESSONS`, or is listed twice
- a lesson has no `title` or `summary`, a non-checkpoint has no `learn`, or a lesson has no exercises
- an exercise has no `p`, `hint` or `sol`; a quiz question has no `p`, `sol` or `why`, or a `unit` outside 1–6
- a model answer or a runnable example gives an error against Northwind
- `ordered` refers to a column the model answer doesn't return
- a model answer doesn't pass when compared with itself
- two quizzes share an id, or one is called `mix`

It **warns** (but still builds) when a model answer returns no rows, because any query returning nothing would then be
marked correct, and when a lesson isn't in any unit.

---

## 4. The SQL engine (`src/engine.js`)

`engine.js` holds everything that touches SQL and nothing that touches the page, so `scripts/check.mjs` loads exactly
the same code in Node.

### Two databases

| Database | Variable | Used by | Lifetime |
|---|---|---|---|
| Northwind | `nw` | Lessons, quizzes, Free practice, Meet Northwind | Rebuilt from the embedded copy on every page load (`freshNorthwind()`) |
| Sandbox | `sb` | Create tables | Starts empty. Exported to `localStorage` after every run (`persistSandbox()`), so a learner's tables survive a reload |

Both have foreign keys switched on (`PRAGMA foreign_keys = ON`) and the extra functions registered by `addFns()`.

### Running a script: `runScript(db, sql, mode, opts)`

```
 learner's SQL
   │
   ├─ splitStatements()   split on ; outside quotes, backticks, [brackets] and comments
   │
   ├─ for each statement:
   │    transform()       dialect rules: CREATE/DROP DATABASE, USE, SHOW TABLES, DESCRIBE,
   │    │                 AUTO_INCREMENT / IDENTITY, multi-column ALTER TABLE ADD, TOP n,
   │    │                 stored procedures (refused with an explanation)
   │    └─ rewriteFns()   function rewrites: DATE_ADD/DATE_SUB … INTERVAL, TIMESTAMPDIFF(unit,…),
   │                      T-SQL DATEDIFF(part,…) and DATEADD(part,…)
   │
   ├─ db.exec()           SQLite runs it
   │
   └─ report             { items: log lines and translation notes, results: [{columns, values}],
                            error: {message, hint, sql}, ran: [the SQL that actually ran] }
```

- `describeStmt()` turns statements that return no rows into a log line ("Inserted 3 rows into Customers").
- `friendlyError()` adds advice to SQLite's error messages, for example *"no such column: France"* gets a reminder that
  text needs single quotes.
- `mode` is `'sandbox'` or `'nw'`. It changes a few rules: `DROP DATABASE` clears the sandbox (through `opts.onReset`)
  but is skipped on Northwind.

### Extra functions: `addFns(db)`

MySQL and T-SQL functions that SQLite doesn't have are registered as JavaScript functions: `YEAR`, `MONTH`, `DAY`,
`DATEDIFF`, `TIMESTAMPDIFF`, `DATE_FORMAT`, `NOW`, `CURDATE`, `GETDATE`, `LEN`, `LOCATE`, `CHARINDEX`, `LEFT`, `RIGHT`
and `REGEXP`, plus the internal targets of the rewrites (`DATE_ADD_I`, `TSQL_DATEDIFF`, `TSQL_DATEADD`). Dates are
stored as `YYYY-MM-DD` text, which is what these functions read and return.

---

## 5. Answer checking

`compare(db, task, result)` decides whether a learner's result is correct. `task` is a lesson exercise or quiz question.

1. **Get the expected result.** `expected(db, task)` runs the model answer inside a `SAVEPOINT` and rolls it back, so a
   model answer can create views or change data without leaving anything behind. It always runs fresh, so it stays
   right even if the learner has changed the data.
2. **Same number of rows?** If not: *"Expected 28 rows, your query returned 77."*
3. **Match columns by their values, not their names.** Each expected column is matched to a learner column holding the
   same values (sorted). This is why aliases, column order and extra columns don't matter.
4. **Same rows?** The learner's rows, cut down to the matched columns, are compared with the expected rows as a set.
5. **Same order?** Only if the task has `ordered`: the listed columns must come back in the same sequence. Listing just
   the sort columns lets tied rows come back in any order.

Values are normalised before comparing: numbers are rounded to 2 decimal places, text is trimmed, and `NULL` is a
distinct token. Each failure returns a message and a tip ("Check your ORDER BY, including ASC or DESC").

---

## 6. The quiz engine (`src/quiz.js`)

```
 Start screen                 In progress                          Results
 ────────────                 ───────────                          ───────
 question count, pass mark    one question at a time               score, pass/fail (65%), time taken
 last / best attempt          editor per question: Run shows       score by unit, with "Revise this unit"
 time limit: 30 / 45 / none   results, but nothing is marked       review: your query, model answer, why
        │                     answers kept in QZ.answers[]         "Show only questions I got wrong"
        └── startQuiz() ────► countdown; auto-submit at 0:00 ────► submitQuiz(): mark every answer with compare(),
                              Submit (confirm if any are blank)    save the attempt to localStorage
```

- All quiz state is in one object, `QZ`: the questions, the answers, the current question, the start time, the limit
  and, after submitting, the marks.
- **Queries can't change the data.** `runSafe()` wraps every quiz query, whether run by the learner or for marking, in
  `SAVEPOINT quiz_run` … `ROLLBACK TO quiz_run`.
- A question counts as answered when its editor holds anything other than comments.
- Leaving the quiz page (`route()` to any other view) stops the timer and drops the attempt.
- **The model answers are in the page** (`data-solution`). That's fine for practice; if a quiz ever counts towards an
  assessment, marking would have to move to a server.

---

## 7. The Foundations lessons and the ERD renderer

### What's an ERD, Create tables, Meet Northwind

| Lesson | Completes when | Code |
|---|---|---|
| What's an ERD | All three Check yourself questions are answered correctly (`P.quizDone`) | `drawLesson()` |
| Create tables | All six steps pass their checklist (`P.buildDone`) | `BUILD_STEPS`, `renderBuild()`, `runBuild()` |
| Meet Northwind | Three or more tables have been opened (`P.mapTables`) | `drawMap()` |

`FOUND` in `src/app.js` holds these rules, so the path, the footer and the Continue button treat Foundations lessons
like any other. Each Create tables step has a `checks(tables)` function that inspects the learner's real schema
(`introspect(sb)`) and returns a checklist; step 4 also looks at the last result, and step 5 at whether a foreign key
error has been seen (`P.fkSeen`).

### Drawing an ERD

```
 introspect(db)                         renderERD(host, tables, options)
 ──────────────                         ────────────────────────────────
 sqlite_master          → table names   measure()     box sizes from the longest column name and type
 pragma_table_info      → columns, PK   autoLayout()  parents on the left, children to the right
 pragma_foreign_key_list→ foreign keys      or        fixed positions (NW_POS for Northwind)
                                        relationship lines: cubic curves between the FK row and the PK row
                                        drawEnd():    crow's foot symbols
```

- The parent end shows **exactly one** if the foreign key column is `NOT NULL`, otherwise **zero or one**. The child end
  shows **zero or many**.
- Tables side by side are joined edge to edge; tables in the same column loop round the right; a table that refers to
  itself (`Employees.ReportsTo`) loops round the left.
- Hovering or focusing a table dims everything it isn't connected to. On Meet Northwind, tables can be selected with a
  click or the keyboard.
- The ERD redraws after every Create tables run, and tables that have just appeared fade in.

---

## 8. Progress storage

Everything is in one `localStorage` key, `sqlPracticeLab.v1`, read once into the `P` object at start-up and written
back by `save()` after each change:

| Field | Holds |
|---|---|
| `exDone` | Solved exercises, keyed `<lessonId>.<index>`, e.g. `select.0` |
| `drafts` | Editor text for every Learn tab and exercise (`<lessonId>:<tab>`), each Create tables step (`build<n>`) and Free practice (`free`) |
| `tab`, `last` | The tab last open in each lesson, and the last lesson visited |
| `quiz`, `quizDone` | Answers to the What's an ERD questions |
| `buildDone`, `buildStep`, `fkSeen` | Create tables progress |
| `sandbox` | The learner's own database, exported as base64 |
| `mapTables` | Tables opened on Meet Northwind |
| `quizzes` | Per quiz id: `{ attempts, best, last }`, each attempt `{ score, total, percent, passed, seconds, date, units }` |

- Every read and write is wrapped in `try/catch`, because storage can be blocked (some private-browsing modes). The site
  still works; it just doesn't remember.
- If the shape ever changes in a way old data would break, change the key to `sqlPracticeLab.v2` so old data is
  ignored rather than misread.

---

## 9. Styling

- **`src/styles.css`** holds the theme: CSS variables (colours, fonts, radius, shadow) at the top, then the styles for
  each page. The palette, grey page background, white cards, pill buttons and rule are the ISTQB study site's.
- **Header, home hero and footer are copied from the ISTQB study site** (`Header.astro`, the `index.astro` hero and
  `Footer.astro`), so the two sites look like one family: white header with the Sparta logo and a pink underline,
  pill-shaped links with the current page in charcoal, a **Menu** panel on phones, a charcoal hero on the home page,
  a charcoal footer with the white logo, and the round back-to-top button. Like the ISTQB site there's no dark mode.
- **Logos and favicon** live in `src/assets/` and are inlined as data URIs by `scripts/build.mjs`, so the site stays one file.
- **Brand:** charcoal `#2d2a2b`, pink `#d42a57`, the pink full stop after titles (`.dot`), and the rule with an end dot,
  matching the ISTQB study site. Headings use Zilla Slab, the body uses Source Sans 3, and code uses JetBrains Mono, all
  from Google Fonts with system fallbacks.
- **The SQL editor** is a transparent `<textarea>` over a `<pre>` that holds the syntax-highlighted copy
  (`highlight()`). The textarea grows with its content instead of scrolling, so the two always line up.
- **ERDs are inline SVG** with a `viewBox`, coloured from the same variables, so they follow the theme.

### Accessible colour

All text meets WCAG AA contrast (4.5:1, or 3:1 for large text) Keep to the variables when adding styles.
Status is never shown by colour alone: solved exercises and passed checks also get a tick and screen-reader text.

### Responsive design

The site is designed for desktop and tested at phone width (390 px):

| Area | Desktop | Phone (≤ 1020 px / 640 px) |
|---|---|---|
| Header | Logo, label and three pill links | Logo and a **Menu** button opening a full-width panel (≤ 48 rem) |
| Learning path | Unit description beside its route | Stacked |
| Lessons and Create tables | Explanation beside a sticky editor and results | Editor and results under the explanation |
| Query results | Scroll inside their own box | Same |
| Meet Northwind diagram | Full width | Scrolls sideways (minimum 1000 px wide) |
| Quiz review | Your query beside the model answer | Stacked |

Layout grids use `minmax(0, 1fr)` columns, so wide content (a big result table) can't push the page wider than the screen.

### Test hooks (`data-testid`, `id`, `name`)

The site doubles as practice material for automated testing, so interactive and checkable elements carry stable hooks
(see "Testing this site" in the README for the full list). When you add or change markup:

- give anything a test would click or check a **`data-testid`** in kebab-case (`submit-answers`, `question-3-run`)
- use an **`id`** only for elements that appear once per page, and a **`name`** on every form control
- elements that repeat get a number or key in the test id (`question-3`, `lesson-link-select`) - never duplicate one
- where state matters, expose it as a `data-` attribute too (`data-done`, `data-correct`, `data-state`, `data-rows`)
- `makeEditor(host, { id })` gives each editor `<id>-editor-input` and `<id>-run`, `renderReport()` prefixes result hooks with its container's name (`lesson-results` → `lesson-result-table`), and `renderERD(…, { testPrefix })` names each table (`northwind-table-orders`)

---

## 10. Build and deployment

```
npm run check    → scripts/check.mjs: run every model answer and example, check the content rules
npm run build    → check, then scripts/build.mjs → dist/index.html
npm run dev      → rebuild dist/index.html whenever src/ or data/ changes (no checks, for speed)
```

**`.github/workflows/deploy.yml`** runs on every push to `main`:

1. Installs Node 20 and the packages (`npm ci`).
2. Runs `npm run build`. **A broken lesson or question stops the deploy here.**
3. Publishes `dist/` to GitHub Pages.

Every link inside the site starts with `#`, so it works from any address and from a file on disk. There's no base path
to configure.

---

## 11. Common changes

| I want to… | Do this |
|---|---|
| Fix a typo in a lesson | Edit its `learn`, `p` or `hint` in `src/content/lessons.js`. |
| Add an exercise | Add `{ p, hint, sol }` to the lesson's `ex` array. Add `ordered: [...]` if order matters. |
| Add a lesson | Add it to `LESSONS` with a new id, then put the id in the right unit's `lessons` array. |
| Add a checkpoint | As a lesson, with `checkpoint: true` and no `learn`. |
| Add a unit | Add an entry to `UNITS`. The path, progress and quiz unit names update automatically. |
| Add a quiz question | Add `{ unit, p, sol, why }` to a quiz in `src/content/quizzes.js`. |
| Add a quiz | Add `{ id, title, blurb, questions }` to `QUIZZES`. It gets a card and the address `#/quiz/<id>`. |
| Change the pass mark or time limits | `QUIZ_SETTINGS` in `src/content/quizzes.js`. |
| Accept more MySQL/T-SQL syntax | A statement rewrite in `transform()`, a function rewrite in `rewriteFns()`, or a new function in `addFns()` (`src/engine.js`). |
| Explain a new kind of error | Add a pattern to `friendlyError()` in `src/engine.js`. |
| Change a Create tables step | `BUILD_STEPS` in `src/app.js` (`title`, `short`, `why`, `starter`, `example`, `checks`). |
| Change the Northwind diagram layout | The `x`/`y` positions in `NW_POS` in `src/app.js`. |
| Change colours or fonts | The variables at the top of `src/styles.css` (fonts are loaded in `src/index.html`). |
| Add a page | Add a `<section class="view" id="v-name">` to `src/index.html`, add `'name'` to `VIEWS` and a branch to `route()` in `src/app.js`, and a link with `data-go`. |
| Update sql.js | Change its version in `package.json`, run `npm install`, then `npm run build`. Pick a release at least two weeks old. |

---

## 12. Where the content came from

- **Lessons and exercises:** written from the Sparta Global SQL lesson notes (*SQL Querying* and *Creating Tables and
  Connecting Them*). The exercises from the notes are kept, with their answers checked against the data, and extra
  exercises, checkpoints and quizzes were added. They're now maintained directly in `src/content/`.
- **Northwind:** built once from Microsoft's `instnwnd.sql` script by `scripts/build-northwind.py` into
  `data/northwind.db`. The 8 core tables are kept (the territory and demographic tables and the picture columns are
  left out), dates are converted to `YYYY-MM-DD`, and text columns use `COLLATE NOCASE` so comparisons ignore case
  like MySQL. Only rerun the script if you need to change the database.

---

## 13. Build pipeline in detail

What happens when you run `npm run build` (or when GitHub Actions does it for you):

```
 1. scripts/check.mjs
    ├── loads src/engine.js + src/content/*.js into a Node sandbox (the same code the browser runs)
    ├── opens data/northwind.db with sql.js
    ├── for every lesson: checks its fields, runs every "Run this" example, runs every model answer
    ├── for every quiz question: checks its fields, runs its model answer
    └── any ✗ error → exit 1, nothing is built

 2. scripts/build.mjs
    ├── reads src/index.html
    ├── replaces each placeholder, in order:
    │     /*__CSS__*/      ← src/styles.css
    │     /*__ENGINE__*/   ← src/engine.js
    │     /*__CONTENT__*/  ← src/content/lessons.js + src/content/quizzes.js
    │     /*__APP__*/      ← src/app.js + src/quiz.js
    │     /*__SQLJS__*/    ← node_modules/sql.js/dist/sql-asm-memory-growth.js
    │     __NWDB__         ← data/northwind.db as base64
    ├── refuses to insert anything containing "</script" (it would end the script early)
    └── writes dist/index.html

 3. Output: dist/index.html - the whole site. This is what GitHub Pages serves.
```

## 14. Data flow at runtime

There is no server. Everything a visitor sees comes from the one file; the only things that change are in their browser.

```
 Visitor's browser
 ├── loads dist/index.html
 ├── boot():
 │     initSqlJs()          starts the SQL engine
 │     freshNorthwind()     loads Northwind from the embedded base64 into memory
 │     freshSandbox()       restores the learner's own tables from localStorage, or starts empty
 │     makeEditor() ×3      lesson, Free practice and Create tables editors
 │     route()              shows the page named after # (the path by default)
 ├── on every Run:  runScript() → renderReport() → compare() (lessons) → save progress
 ├── on quiz Submit: runSafe() + compare() for every answer → save the attempt
 └── reads/writes localStorage key "sqlPracticeLab.v1"
       { exDone: { "select.0": true }, drafts: { "select:0": "SELECT …" }, buildDone: { "0": true },
         sandbox: "<base64>", quizzes: { "a": { attempts: 2, best: {…}, last: {…} } }, … }
```

## 15. File-by-file reference

| File | Responsibility | Depends on |
|---|---|---|
| `package.json` | Scripts and the one dependency (sql.js) | - |
| `scripts/build.mjs` | Inlines everything into `dist/index.html` | all of `src/`, `data/`, sql.js |
| `scripts/check.mjs` | Runs and validates every lesson, example and quiz question | `engine.js`, content, sql.js |
| `scripts/build-northwind.py` | Converts Microsoft's Northwind script to `data/northwind.db` | Python 3 |
| `data/northwind.db` | The Northwind database | - |
| `src/index.html` | Page shell: header, static pages (What's an ERD, Create tables, Meet Northwind, lesson and Free practice frames) and the build placeholders | - |
| `src/styles.css` | Theme variables and all styles | - |
| `src/assets/` | Sparta Global logos (`sparta-logo.png`, `sparta-logo-white.png`) and `favicon.svg`, shared with the ISTQB site | - |
| `src/engine.js` | Dialect layer, `runScript()`, `friendlyError()`, extra SQL functions, `expected()` and `compare()` | - (no DOM) |
| `src/content/lessons.js` | `UNITS`, `LESSONS`, `PATH`, and the `C()` / `TIP()` helpers | `esc()` from `engine.js` |
| `src/content/quizzes.js` | `QUIZ_SETTINGS` and `QUIZZES` | - |
| `src/app.js` | Progress, header behaviour (back-to-top, menu), databases, results tables, editor, ERD renderer, routing, path, lessons, Foundations pages, Free practice, boot | engine, content |
| `src/quiz.js` | Quiz list, start screen, questions, timer, marking, results and review | engine, content, `app.js` helpers |
| `.github/workflows/deploy.yml` | Check, build and publish on every push to `main` | - |

## 16. Quality checks built in

| Check | Where | What it catches |
|---|---|---|
| Content checks | `scripts/check.mjs` | a model answer or example that errors, a missing field, a lesson missing from `LESSONS`, an `ordered` column that doesn't exist, duplicate quiz ids, answers that return no rows (warning) |
| Self-marking | `scripts/check.mjs` | a model answer that the checker wouldn't mark as correct |
| Safe inlining | `scripts/build.mjs` | a missing placeholder, or content that would break out of its `<script>` |
| Deploy gate | GitHub Actions | nothing is published unless the checks and the build pass |

Things that are **not** automated, so check them by eye after a big change: the layout on a phone (≈390 px wide), the
header and footer against the ISTQB site, the Meet Northwind diagram if you move tables, and colour contrast for any new colours (keep to the CSS
variables). The README's Playwright and Selenium examples make a good smoke test.

## 17. Design decisions and trade-offs

| Decision | Benefit | Trade-off |
|---|---|---|
| Static site, no backend | Free hosting, nothing to maintain or secure, works offline once loaded | No shared data - trainers can't see learners' scores |
| SQL engine in the browser | Real SQL with nothing to install | A 1.8 MB page; SQLite isn't MySQL, so some syntax needs translating and a few features (stored procedures) aren't possible |
| Translating MySQL/T-SQL | Learners use the syntax they're taught | The translations cover the course's syntax, not every MySQL feature |
| Marking by result | Any correct query passes | A query that's right by luck on this data also passes; avoid tasks whose answer is empty or trivially matched |
| Model answers in the page | Marking is instant and works offline | A determined learner could read them - fine for practice, not for assessment |
| Northwind reloaded on every visit | Learners can't permanently break it | Views and data changes in Free practice are lost on reload |
| localStorage for progress | Private, zero setup | Per browser and device; cleared with browser data |
| One file, no framework | Works anywhere, no build tooling beyond Node | The UI code is hand-written DOM building, so very large new features may justify a framework |

## 18. Extending the site - recipes

**A new kind of exercise check** - `compare()` returns `{ ok, msg, tip, extra }`. To check something other than the
result (for example that a query uses a JOIN), add an optional field to the task, such as `mustUse: /\bJOIN\b/i`,
test it against the learner's SQL in `runLesson()` (`src/app.js`) and `submitQuiz()` (`src/quiz.js`), and teach
`checkTask()` in `scripts/check.mjs` to validate the new field.

**A new MySQL function** - register it in `addFns()` with `f('NAME', (a, b) => …)`. If its arguments use keywords
SQLite can't parse (like `INTERVAL 5 DAY`), rewrite the call into a plain function call in `rewriteFns()` first, as
`DATE_ADD` does.

**A new Foundations-style page** - add a `<section class="view" id="v-name">` to `src/index.html`, a lesson with
`kind: 'name'` to `LESSONS`, a branch for it in `route()`, and an entry in `FOUND` saying when it's complete.

**A new kind of stored progress** - add a field to `P`'s defaults in `src/app.js` and call `save()` after changing it.
If the change isn't backwards compatible, change the storage key's version so old data is ignored rather than misread.
