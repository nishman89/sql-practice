# Sparta Global – SQL Practice Lab

**Live site: https://nishman89.github.io/sql-practice/**

A practice website for the **SQL** module. It turns the Sparta Global SQL lesson into a learning path of short
lessons, each with worked examples and exercises, and adds query quizzes that mark learners' SQL automatically against
the **Northwind** sample database.

It is a static website, hosted free on **GitHub Pages**. There is no server and no database to install: a real SQL
engine runs inside the learner's browser. Learners' progress is saved in their own browser. It works on desktops,
tablets and phones.

> **Developers:** see **[ARCHITECTURE.md](ARCHITECTURE.md)** for how the code is structured: the SQL engine, the dialect
> layer, answer checking, the quiz engine, the ERD renderer, progress storage, and how to make common changes.

---

## What's on the site

| Page | What it does |
|---|---|
| **Learning path** (home) | Every unit and lesson as a route. Finished lessons are ticked, the next lesson is highlighted and checkpoints are shown as diamonds. The **Continue** card shows the next unfinished lesson and a trail of progress across the whole path. |
| **What's an ERD** | Entities, attributes, primary and foreign keys, crow's foot notation and the three kinds of relationship, with an interactive diagram and three **Check yourself** questions. |
| **Create tables and connect them** | Six guided steps that build a `Customers` and an `Orders` table, insert data, join them, trigger a foreign key error and add columns. The ERD beside the editor redraws itself from the learner's tables after every run. |
| **Meet Northwind** | The full Northwind ERD. Select a table to see its columns, its keys, what it links to and its first five rows. |
| **Lessons** (24) | A **Learn** tab with a short explanation and worked examples, each with a **Run this** button, then one tab per exercise. The editor and results sit alongside. |
| **Checkpoints** | The last lesson in units 2–5. No new teaching: mixed exercises on the whole unit. |
| **Query quiz** | **Quiz A** and **Quiz B** (10 query tasks each) and **Mixed practice** (10 exercises picked at random from the lessons). Nothing is marked until you submit. Optional 30- or 45-minute timer, a score for each unit and a full review. |
| **Free practice** | Run any query against Northwind. Nothing is marked. |

### The learning path

| Unit | Lessons |
|---|---|
| **1. Foundations** | What's an ERD · Create tables and connect them · Meet Northwind |
| **2. Querying one table** | SELECT and WHERE · Operators: AND, OR, IN, BETWEEN · Sorting with ORDER BY · DISTINCT and LIMIT · Searching text with LIKE · Joining text and naming columns · Calculations · *Checkpoint* |
| **3. Summarising data** | Aggregate functions · GROUP BY · Filtering groups with HAVING · Working with NULL · *Checkpoint* |
| **4. Combining tables** | INNER JOIN · LEFT JOIN · Aliases and multiple joins · *Checkpoint* |
| **5. Subqueries** | Subqueries in WHERE · Subqueries in FROM and SELECT · EXISTS and NOT EXISTS · *Checkpoint* |
| **6. Going further** | CASE expressions · Dates and text functions · Views |

27 lessons, 82 exercises and 61 runnable examples in total.

### How the exercises work

1. Read the **Learn** tab. Press **Run this** on any example to load it into the editor and run it. Change it and run it again.
2. Press **Start the exercises**. Write your query in the editor and press **Run** (or **Ctrl + Enter**, **Cmd + Enter** on a Mac).
3. Your result is checked straight away:
   - **Correct** – the exercise is ticked and a button takes you to the next one.
   - **Not yet** – you're told what's different, for example *"Expected 28 rows, your query returned 77"* or
     *"Right rows, wrong order"*, with a tip on where to look.
4. Stuck? Press **Show a hint**, then **Show the answer** if you need it. **Copy into the editor** puts the answer in
   the editor so you can run it and study it.
5. Solve every exercise to complete the lesson. The footer of each lesson shows what's left and links to the next one.

Answers are marked on what they **return**, not how they're written. Column names and aliases don't matter, extra
columns are fine, and row order only matters when the exercise asks for it (for example "most expensive first").

### How the query quiz works

1. Choose **Quiz A**, **Quiz B** or **Mixed practice**, then a time limit: **30 minutes**, **45 minutes** or **no limit**.
2. Press **Start the quiz**. Questions are shown one at a time; the numbered buttons at the top jump between them and fill in once a question has an answer.
3. Write a query for each task. You can **Run** it as often as you like to see its results, but you **won't be told whether it's right** until you submit.
4. Press **Submit answers**. If time runs out, the quiz is submitted automatically. A countdown sits in the bar at the bottom and turns pink in the last five minutes.
5. You get your score and whether you passed (the pass mark is **65%**), the time taken and a **score for each unit**, with a link to revise each one.
6. Every question then shows your query, a model answer, and why yours was marked right or wrong.
7. Tick **Show only questions I got wrong** to focus on mistakes, or press **Retake quiz** to try again.

Your answer to each question is whatever is in its editor when you submit. Queries run during a quiz can't change the
data: each one is rolled back as soon as it finishes.

### Which SQL does it run?

The site runs **SQLite**, but the course teaches MySQL and T-SQL, so it accepts the syntax from the course notes and
translates it. A note appears whenever it does.

| You write | The site runs |
|---|---|
| `INT NOT NULL AUTO_INCREMENT PRIMARY KEY` or `IDENTITY(1,1)` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `CREATE DATABASE`, `USE` | Skipped: there's already a database |
| `DROP DATABASE` | Drops all your tables (Create tables lesson only) |
| `ALTER TABLE t ADD a INT, b INT` | One `ADD COLUMN` per column |
| `SELECT TOP 10 …` | `SELECT … LIMIT 10` |
| `SHOW TABLES`, `DESCRIBE t` | Equivalent queries on the schema |
| `DATE_ADD(d, INTERVAL 5 DAY)`, `TIMESTAMPDIFF(YEAR, a, b)` | Built-in equivalents |
| T-SQL `DATEDIFF(d, start, end)`, `DATEADD(d, 5, x)` | Built-in equivalents |

These functions work as they do in MySQL or T-SQL: `CONCAT`, `YEAR`, `MONTH`, `DAY`, `DATEDIFF(end, start)`,
`DATE_FORMAT`, `CURDATE`, `NOW`, `GETDATE`, `LEFT`, `RIGHT`, `LOCATE`, `CHARINDEX`, `LEN`, `REGEXP`. Text comparisons in
Northwind ignore case, as they do with MySQL's default settings, so `'london'` matches `'London'`.

**Not available:** stored procedures (`CREATE PROCEDURE`, `CALL`, `EXEC`), adding a foreign key with `ALTER TABLE`, the
T-SQL `LIKE '[ABC]%'` character list and T-SQL `FORMAT`. Practise these in MySQL Workbench or SQL Server Management Studio.

### Finding your way around

- **Header** – the same header as the ISTQB study site: the Sparta Global logo and **Learning path**, **Query quiz** and **Free practice** on every page. On phones they move into a **Menu** button.
- **Back to top** – a button appears once you scroll down.
- **Continue where you left off** – the home page's **Continue** button opens the next lesson you haven't finished.
- **Breadcrumb** – the top of each lesson shows its unit and its position ("Lesson 17 of 27").
- **Next lesson** – the footer of every lesson links to the previous and next lessons.
- **Tables** – the buttons above the editor insert a table name at the cursor (`Order Details` comes with the backticks it needs).
- **Errors** – an error message comes with advice, for example a reminder that text needs single quotes.

### Progress

The site remembers which exercises a learner has solved, their drafts, the tables they built, and their **last and best
score** for every quiz. This is stored in the browser's `localStorage`:

- It stays until the learner clears their browser data or presses **Reset my progress** on the home page.
- It belongs to **one browser on one device**. It won't follow someone from their laptop to their phone, and private/incognito windows forget it.
- Nothing is sent anywhere. There are no cookies, no tracking, and trainers can't see learners' scores.
- Changes a learner makes to Northwind (for example a view, or an `UPDATE` in Free practice) last until the page is
  reloaded. **Restore Northwind** in Free practice resets it straight away.

---

## Opening the website

### The live site

Once it's published (see [Publishing on GitHub Pages](#publishing-on-github-pages)), open:

```
https://<your-github-username-or-organisation>.github.io/<repository-name>/
```

This repository (`nishman89/sql-practice`) is published at **https://nishman89.github.io/sql-practice/**.

Each page has its own address after the `#`, so you can link straight to it:

| Page | Address |
|---|---|
| Learning path | `…/#/path` |
| A lesson | `…/#/lesson/<id>`, e.g. `#/lesson/innerjoin` (ids are in `src/content/lessons.js`) |
| Query quiz list | `…/#/quiz` |
| A quiz | `…/#/quiz/a`, `…/#/quiz/b`, `…/#/quiz/mix` |
| Free practice | `…/#/free` |

### On your own computer (step by step)

You only need to do steps 1-4 once.

**1. Install the tools**

| Tool | Why | Where to get it |
|---|---|---|
| **Visual Studio Code** | The editor you'll open the project in | https://code.visualstudio.com - download and install with the default options |
| **Node.js (LTS, version 20 or newer)** | Runs the build and the content checks (includes `npm`) | https://nodejs.org - choose the **LTS** button |
| **Git** | Downloads the project from GitHub and publishes changes | https://git-scm.com/downloads |

Check they installed: open a terminal (Windows: *Command Prompt* or *PowerShell*; Mac: *Terminal*) and run
`node -v`, `npm -v` and `git --version`. Each should print a version number. If not, restart your computer and try again.

**2. Get the project**

Either clone it from GitHub:

```bash
git clone https://github.com/nishman89/sql-practice.git
```

…or unzip the project zip somewhere sensible (e.g. `Documents/sql-practice`).

Then in VS Code choose **File → Open Folder…** and pick the `sql-practice` folder.

**3. Install the project's packages**

Open VS Code's built-in terminal (**Terminal → New Terminal**, or `` Ctrl+` ``) and run:

```bash
npm install
```

This downloads the one package the project needs, **sql.js** (the SQL engine), into a `node_modules` folder. It only
needs doing again if `package.json` changes.

**4. Build the site**

```bash
npm run build
```

This checks every lesson and quiz question, then writes the finished site to **`dist/index.html`**.

**5. Open it**

Double-click **`dist/index.html`**, or drag it into a browser window. Unlike most websites, this one is a single
self-contained file, so it works straight from your computer without a web server.

**6. Work on it**

```bash
npm run dev
```

This rebuilds `dist/index.html` every time you save a file in `src/`. Refresh the browser to see the change. Press
`Ctrl + C` in the terminal to stop. (`npm run dev` skips the content checks to stay fast, so run `npm run check`
before you publish.)

**7. Publish your changes**

```bash
git add .
git commit -m "Describe what you changed"
git push
```

GitHub Actions checks, rebuilds and publishes the site in a couple of minutes (see [Publishing on GitHub Pages](#publishing-on-github-pages)).

**Troubleshooting**

| Problem | Fix |
|---|---|
| `npm` or `node` "is not recognised" | Node.js isn't installed or the terminal was open before you installed it - close and reopen VS Code |
| `npm install` fails | Check you're in the project folder (the one containing `package.json`), then try again |
| `Cannot find module …sql.js…` | Run `npm install` first |
| The build stops with ✗ lines | Read the message - it names the lesson or quiz question and what's wrong (see [Editing the content](#editing-the-content)) |
| The page says "The database engine didn't start" | The file was cut short. Run `npm run build` again |
| Fonts look plain | You're offline. The page uses Google Fonts but falls back to system fonts and works without them |

### Commands

| Command | What it does |
|---|---|
| `npm install` | Installs the packages (first time only). |
| `npm run check` | Runs every model answer and every example against Northwind and checks the content is set up correctly. |
| `npm run build` | Runs the checks, then builds the finished site into `dist/index.html`. |
| `npm run dev` | Rebuilds `dist/index.html` whenever you save a file in `src/` or `data/`. |

---

## Publishing on GitHub Pages

This only needs setting up once. After that, the site republishes itself every time you push to `main`.

1. Create a new repository on GitHub and push this folder to its `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push a change, or go to the **Actions** tab and run **Deploy to GitHub Pages** manually.
5. When the workflow shows a green tick, the site is live at the address shown on the **Settings → Pages** screen.

The workflow is in `.github/workflows/deploy.yml`. Because every link inside the site starts with `#`, it works at any
address, so there's no base path to set.

> **Note:** on GitHub's free plans a Pages site is **public**, even if the repository is private. Nothing in the site
> is confidential: the Northwind data is a Microsoft sample released under the MIT licence (see [Credits](#credits)).

### Other places to put it

`dist/index.html` is one file with everything inside it, so it also works on SharePoint, in a learning platform that
accepts HTML files, or in the ISTQB study site's `public/` folder (e.g. as `public/sql/index.html`).

---

## Editing the content

You don't need to touch any app code to change the lessons or quiz questions.

### Lessons – `src/content/lessons.js`

The file has two parts. `UNITS` sets the order of the path:

```js
const UNITS = [
  { id:'u2', title:'Querying one table', blurb:'Choose the columns and rows you need…',
    lessons:['select', 'operators', 'sorting', 'distinct', 'wildcards', 'concat', 'arithmetic', 'cp1'] },
  …
];
```

`LESSONS` holds each lesson, keyed by its id:

```js
select: {
  title: 'SELECT and WHERE',
  summary: 'Pick columns with SELECT and filter rows with WHERE.',   // shown on the path
  learn: `
    <p>Every query answers two questions…</p>
    ${C("SELECT * FROM Customers;")}                  ← an example with a Run this button
    ${C("SELECT … FROM student …", false)}            ← a read-only example (tables not in Northwind)
    ${TIP('<code>SELECT</code> filters columns…')}    ← a pink tip box
    <h3>Apostrophes inside text</h3>                  ← a sub-heading
  `,
  ex: [
    { p:    'How many employees have a home city of London?',      // the task
      hint: 'COUNT(*) with a WHERE clause on City.',
      sol:  "SELECT COUNT(*)\nFROM Employees\nWHERE City = 'London';" },
    { p: '…', hint: '…', sol: '…', ordered: [1] },    ← the order of column 2 must match
  ]
},
```

The `learn` text is HTML, so `<p>`, `<code>`, `<strong>`, `<h3>`, `<ul class="plain">` and `<table class="mini">` all
work. A checkpoint is a lesson with `checkpoint: true` and no `learn`.

### Exercises

Each exercise is marked by running its `sol` and comparing results, so `sol` must be a query that works here (MySQL
syntax is fine; see [Which SQL does it run?](#which-sql-does-it-run)).

- Add `ordered: [columns]` when the task asks for an order, listing the column positions (from 0) that are sorted on.
  `ordered: [1]` means "the second column must come back in the same order". Listing only the sort columns means rows
  that tie can come back in any order.
- Write the task so the expected columns are clear ("Show the name and price…"). Learners can add extra columns and
  still pass, but they can't miss one.
- Avoid tasks whose answer is **no rows**: any query returning nothing would be marked correct. The checks warn about this.

### Quiz questions – `src/content/quizzes.js`

```js
const QUIZ_SETTINGS = { passMark: 65, timeLimits: [30, 45, 0], defaultLimit: 30, mixSize: 10 };

const QUIZZES = [
  { id:'a', title:'Quiz A', blurb:'Ten queries covering every unit…', questions:[
    { unit: 2,                                           // which unit it counts towards in "Score by unit"
      p:    'List the CompanyName and City of every supplier based in the USA.',
      sol:  "SELECT CompanyName, City\nFROM Suppliers\nWHERE Country = 'USA';",
      why:  'A single WHERE condition on Country…' },   // shown in the review after submitting
    …
  ]},
];
```

To add a quiz, add another `{ id, title, blurb, questions }` to `QUIZZES`. It appears on the Query quiz page and gets
its own address (`#/quiz/<id>`). **Mixed practice** builds itself from the lesson exercises, so it needs no editing.

**Safety net:** `npm run build` refuses to build if the content is broken. It runs every model answer and every
**Run this** example against Northwind, and fails if one gives an error, if a lesson in `UNITS` doesn't exist, if an
exercise is missing its task, hint or answer, if `ordered` points at a column that isn't there, or if a quiz id is
used twice. It also warns when a model answer returns no rows. Run `npm run check` after editing.

### Other things you might change

| To change… | Edit… |
|---|---|
| Colours and fonts | `src/styles.css` (the variables at the top) |
| Pass mark, time limits, Mixed practice size | `QUIZ_SETTINGS` in `src/content/quizzes.js` |
| The What's an ERD page and its questions | The `v-erd` section of `src/index.html`, and `drawLesson()` in `src/app.js` |
| The Create tables steps | `BUILD_STEPS` in `src/app.js` |
| The Northwind table notes and diagram layout | `NW_NOTES` and `NW_POS` in `src/app.js` |
| MySQL/T-SQL syntax the site accepts | `transform()`, `rewriteFns()` and `addFns()` in `src/engine.js` |
| Advice shown with error messages | `friendlyError()` in `src/engine.js` |
| Header, home hero and footer | `src/index.html` (styles under "Header", "Home hero" and "Footer" in `src/styles.css`) |

---

## How it's built

*For the full picture, read **[ARCHITECTURE.md](ARCHITECTURE.md)**.*

The site is plain HTML, CSS and JavaScript with no framework. A small build script (`scripts/build.mjs`) stitches the
source files, the SQL engine and the Northwind database into **one file**, `dist/index.html`. In the browser,
**[sql.js](https://sql.js.org)** (SQLite compiled to JavaScript) runs every query, so there's nothing to install and
nothing to host except that one file.

```
├── .github/workflows/deploy.yml   Checks, builds and publishes to GitHub Pages
├── data/northwind.db              The Northwind sample database (SQLite, ~250 KB)
├── scripts/
│   ├── build.mjs                  Builds dist/index.html
│   ├── check.mjs                  Runs every model answer and example; stops the build if one fails
│   └── build-northwind.py         How data/northwind.db was made from Microsoft's script (only needed to rebuild it)
└── src/
    ├── index.html                 The page shell: header, the static pages, and placeholders filled by the build
    ├── styles.css                 Sparta Global theme
    ├── engine.js                  The SQL layer: dialect translation, running scripts, friendly errors, answer checking
    ├── app.js                     Pages and UI: path, lessons, Foundations pages, ERDs, Free practice, progress
    ├── quiz.js                    The query quiz
    ├── assets/                    Sparta Global logos and favicon (inlined into the page by the build)
    └── content/
        ├── lessons.js             Units, lessons, examples and exercises
        └── quizzes.js             Quiz A, Quiz B and the quiz settings
```

The lessons were written from the Sparta Global SQL lesson notes (`SQL Querying` and `Creating Tables and Connecting
Them`) and are now edited directly in `src/content/`.

---

## Testing this site (for trainees)

The site is built to be tested with automated web test frameworks such as **Selenium**, **Playwright** or **Cypress**.
Every important element has a stable hook:

- **`data-testid`** on everything you'd interact with or check. Prefer these: they don't change when the styling or
  text changes. (Selenium: `By.cssSelector("[data-testid='score']")` · Playwright: `page.getByTestId('score')`)
- **`id`** on elements that appear once per page (e.g. `#submit-answers`, `#score`, `#timer`, `#lesson-editor-input`)
- **`name`** on every form control (each SQL editor, the time-limit picker, the quiz toggle, the ERD question options)

### Hook reference

| Page / area | Hooks |
|---|---|
| **Header** (every page) | `site-header` · `home-logo` · `main-nav` · `nav-path` · `nav-quiz` · `nav-free` · `back-to-top` · `site-footer` |
| **Header on phones** | `mobile-menu` · `mobile-nav-path` · `mobile-nav-quiz` · `mobile-nav-free` |
| **Home hero** | `hero` · `hero-start` · `hero-quiz` · `hero-free` |
| **Learning path** | `continue-card` · `overall-progress` (with `data-lessons-done` and `data-exercises-done`) · `continue` · `reset-progress` · `unit-1` … `unit-6` · `lesson-<id>` (with `data-status`: `done`, `next`, `started` or `todo`) · `lesson-link-<id>` · `lesson-status-<id>` |
| **Any lesson** | `breadcrumb` · `breadcrumb-path` · `breadcrumb-unit` · `lesson-position` · `lesson-footer` · `lesson-status` (with `data-done`) · `previous-lesson` · `next-lesson` |
| **Lesson tabs** | `lesson-title` · `lesson-tabs` · `tab-learn` · `tab-exercise-1` … (with `data-done`) · `lesson-body` |
| **Learn tab** | `example-1` … · `run-example-1` … · `start-exercises` |
| **Exercise tab** | `exercise-number` · `exercise-prompt` · `solved` · `show-hint` · `hint` · `show-answer` · `answer` · `copy-answer` · `verdict` (with `data-correct`) · `verdict-next` |
| **SQL editors** | Lessons `lesson-editor-input` / `lesson-run` · Free practice `free-editor-input` / `free-run` · Create tables `build-editor-input` / `build-run` · table buttons `lesson-insert-table-customers`, `free-insert-table-order-details` … |
| **Query results** | Each results area (`lesson-results`, `free-results`, `build-results`, and `question-N-results` in a quiz) prefixes its hooks with its own name. For lessons: `lesson-query-log` · `lesson-query-error` · `lesson-query-error-message` · `lesson-query-error-hint` · `lesson-result-1` … · `lesson-row-count` (with `data-rows`) · `lesson-result-table`. A second result set adds `-2` (`lesson-result-table-2`). |
| **What's an ERD** | `check-yourself` · `check-question-1` … `check-question-3` (with `data-answer`) · options `check-question-N-option-a` (the label) and `check-question-N-option-a-input` (the radio) · `check-question-N-feedback` |
| **Create tables** | `build-step-1` … `build-step-6` (with `data-done`) · `step-checklist` · `step-check-1` … (with `data-done`) · `use-lesson-code` · `build-start-again` · `build-erd` · each table in the diagram `build-table-customers`, `build-table-orders` |
| **Meet Northwind** | `northwind-erd` · each table `northwind-table-customers`, `northwind-table-order-details` … · `table-detail` · `query-table` |
| **Free practice** | `free-open-erd` · `restore-northwind` |
| **Query quiz list** | `quizzes-title` · `quiz-card-a` / `quiz-card-b` / `quiz-card-mix` · `quiz-card-a-count` · `quiz-card-a-last` · `quiz-card-a-best` · `open-quiz-a` / `open-quiz-b` / `open-quiz-mix` |
| **Quiz start** | `back-to-quizzes` · `quiz-title` · `quiz-start` · `question-count` · `pass-mark` · `last-attempt` · `time-limit` (`<select name="time-limit">`: `30`, `45`, `0`) · `start-quiz` |
| **Quiz question** (N = 1, 2, 3…) | `question-nav` · `question-nav-N` · `question-N` (with `data-solution` and `data-unit`) · `question-N-number` · `question-N-unit` · `question-N-prompt` · `question-N-input` · `question-N-run` · `question-N-results` |
| **Submit bar** | `submit-bar` · `answered-count` · `previous-question` · `question-position` · `next-question` · `timer` · `submit-answers` |
| **Quiz results** | `results` · `quiz-verdict` · `score` · `score-total` · `score-percent` · `time-taken` · `unit-breakdown` · `breakdown-unit-N` / `breakdown-unit-N-score` · `only-wrong-toggle` · `retake` · `all-quizzes` · per question `question-N-review` (with `data-state`: `right`, `wrong` or `blank`) · `question-N-verdict` · `question-N-your-answer` · `question-N-model-answer` · `question-N-explanation` |

### Things worth knowing when you write tests

- **Below 48rem wide the header links move into `mobile-menu`.** Click its `<summary>` first, then `mobile-nav-…`.
- **Pages are addresses after `#`.** Go straight to `#/quiz/a` or `#/lesson/select` rather than clicking through.
- **The quiz shows one question at a time.** Only the current question's `question-N` elements exist; use
  `next-question` / `previous-question` or `question-nav-N` to move. Your typing is kept when you move.
- **The editors are `<textarea>` elements** under a syntax-highlighting layer. Selenium's `sendKeys` and Playwright's
  `fill` both work on them. Clear the starter comment first, or use `fill`, which replaces it.
- **Submitting with unanswered questions** opens a browser `confirm()` dialog - your test must accept or dismiss it.
  So do **Start again** (Create tables), **Restore Northwind** and **Reset my progress**.
- **Answers are checked by result, not by text.** Any query that returns the right rows passes.
- **The model answers are in the page** as `data-solution` on `question-N` (quizzes) and on `lesson-body` (lesson
  exercises) - handy for writing a test that scores 100%. On the ERD page, `data-answer` on `check-question-N` holds
  the right option.
- **Mixed practice picks different questions every time.** Use Quiz A or B for tests that need to be repeatable.
- **The timer submits automatically at 0:00.** Pick `0` (no limit) in `time-limit` unless you're testing the timer.
- **Progress is saved in `localStorage`** under the key `sqlPracticeLab.v1`. Clear it (or click `reset-progress`)
  between tests so they start from a clean state.
- **Northwind is fresh on every page load**, and queries run during a quiz are always rolled back, so tests can't
  break each other's data.

### Example: Selenium (Java)

```java
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class QuizATest {
    WebDriver driver;

    static By testId(String id) {
        return By.cssSelector("[data-testid='" + id + "']");
    }

    @BeforeEach void setUp()    { driver = new ChromeDriver(); }
    @AfterEach  void tearDown() { driver.quit(); }

    @Test
    void scoresFullMarksWhenEveryModelAnswerIsSubmitted() {
        driver.get("https://nishman89.github.io/sql-practice/#/quiz/a");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        new Select(wait.until(ExpectedConditions.elementToBeClickable(testId("time-limit")))).selectByValue("0");
        driver.findElement(testId("start-quiz")).click();

        int total = 10;
        for (int i = 1; i <= total; i++) {
            String sql = driver.findElement(testId("question-" + i)).getAttribute("data-solution");
            WebElement editor = driver.findElement(testId("question-" + i + "-input"));
            editor.clear();
            editor.sendKeys(sql);
            if (i < total) driver.findElement(By.id("next-question")).click();
        }
        assertEquals(String.valueOf(total), driver.findElement(By.id("answered-count")).getText());

        driver.findElement(By.id("submit-answers")).click();   // all answered, so no confirm() dialog

        assertEquals(String.valueOf(total), driver.findElement(By.id("score")).getText());
        assertEquals("100%", driver.findElement(testId("score-percent")).getText());
        assertEquals("Passed", driver.findElement(testId("quiz-verdict")).getText());
    }
}
```

### Example: Playwright (TypeScript)

```ts
import { test, expect } from '@playwright/test';

test('scores 100% when every model answer is submitted', async ({ page }) => {
  await page.goto('https://nishman89.github.io/sql-practice/#/quiz/a');
  await page.getByTestId('time-limit').selectOption('0');
  await page.getByTestId('start-quiz').click();

  for (let i = 1; i <= 10; i++) {
    const sql = await page.getByTestId(`question-${i}`).getAttribute('data-solution');
    await page.getByTestId(`question-${i}-input`).fill(sql!);
    if (i < 10) await page.getByTestId('next-question').click();
  }
  await page.getByTestId('submit-answers').click();
  await expect(page.getByTestId('score-percent')).toHaveText('100%');
});

test('a wrong answer explains what is different', async ({ page }) => {
  await page.goto('https://nishman89.github.io/sql-practice/#/lesson/select');
  await page.getByTestId('tab-exercise-1').click();
  await page.getByTestId('lesson-editor-input').fill('SELECT COUNT(*) FROM Employees;');
  await page.getByTestId('lesson-run').click();
  await expect(page.getByTestId('verdict')).toHaveAttribute('data-correct', 'false');
  await expect(page.getByTestId('verdict')).toContainText('some values don\'t match');
});
```

---

## To do: planned features

These features need a **back end**: a server-side database and user accounts. Today the site is fully static and
progress lives only in each learner's browser, so none of the items below can be built on GitHub Pages alone.

### 1. Trainee accounts and sign-in
- [ ] Trainees can **sign up and sign in** (e.g. with their Sparta Global email).
- [ ] Each trainee's **profile** stores their name, email, **stream** (e.g. `TECH 615`) and **course type**.
- [ ] Progress (lessons, exercises, drafts and quiz scores) is saved to the account, so it follows the trainee across devices.

### 2. History of marks
- [ ] Keep a **full history of every quiz attempt**: date, score, percentage, pass/fail, time taken, score per unit,
      and the queries submitted.
- [ ] Show the history on the trainee's Account page, e.g. as a list and a simple trend chart.

### 3. Trainer dashboard
- [ ] A **trainer-only dashboard** to see trainees' progress, filterable by stream and course type:
  - [ ] Lessons completed and latest and best quiz scores per trainee
  - [ ] The exercises and units trainees find hardest across a stream

### Implementation notes
- **Back end:** a hosted service such as **Supabase** (Postgres database, authentication and row-level security) fits
  well, and matches the approach suggested for the ISTQB study site. The site can stay on GitHub Pages and talk to
  Supabase from the browser.
- **Existing code to build on:** all progress is read and written through `store` and the `P` object in `src/app.js`,
  and quiz attempts are recorded in `submitQuiz()` in `src/quiz.js`. Swapping those `localStorage` calls for database
  calls, keeping `localStorage` as an offline fallback, is the natural starting point.
- **Secure marking:** model answers are in the page today. If quizzes ever count towards an assessment, marking needs
  to move to the server.

---

## Credits

- **Course notes** © Sparta Global.
- **Northwind** sample database © Microsoft, from the
  [sql-server-samples](https://github.com/microsoft/sql-server-samples) repository, used under the MIT licence.
  It was converted to SQLite by `scripts/build-northwind.py` (text columns compare case-insensitively, dates are
  stored as `YYYY-MM-DD`, and the picture columns are left out).
- **[sql.js](https://github.com/sql-js/sql.js)** (SQLite compiled to JavaScript) is used under the MIT licence.
  SQLite itself is in the public domain.
