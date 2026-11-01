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

## Contents

- [What's on the site](#whats-on-the-site)
  - [The learning path](#the-learning-path)
  - [How the exercises work](#how-the-exercises-work)
  - [How the quizzes work](#how-the-quizzes-work)
  - [The Northwind ERD while you work](#the-northwind-erd-while-you-work)
  - [Which SQL does it run?](#which-sql-does-it-run)
  - [Finding your way around](#finding-your-way-around)
  - [Progress](#progress)
- [Opening the website](#opening-the-website)
  - [The live site](#the-live-site)
  - [On your own computer (step by step)](#on-your-own-computer-step-by-step)
  - [Commands](#commands)
- [Publishing on GitHub Pages](#publishing-on-github-pages)
  - [Other places to put it](#other-places-to-put-it)
- [Updating the site](#updating-the-site)
  - [The quickest way: edit on GitHub (nothing to install)](#the-quickest-way-edit-on-github-nothing-to-install)
  - [On your own computer](#on-your-own-computer)
  - [Where everything lives](#where-everything-lives)
  - [Recipes](#recipes)
  - [Rules that keep things working](#rules-that-keep-things-working)
  - [If the build fails](#if-the-build-fails)
  - [Reference: everything a lesson can have](#reference-everything-a-lesson-can-have)
- [Testing](#testing)
  - [What's tested](#whats-tested)
  - [Setting it up](#setting-it-up)
  - [Running the tests](#running-the-tests)
  - [How it works](#how-it-works)
  - [Adding a test](#adding-a-test)
  - [On GitHub: test, then publish](#on-github-test-then-publish)
  - [Reading the report](#reading-the-report)
  - [Troubleshooting](#troubleshooting)
- [How it's built](#how-its-built)
- [Testing this site (for trainees)](#testing-this-site-for-trainees)
  - [Hook reference](#hook-reference)
  - [Things worth knowing when you write tests](#things-worth-knowing-when-you-write-tests)
  - [Example: Selenium (Java)](#example-selenium-java)
  - [Example: Playwright (TypeScript)](#example-playwright-typescript)
- [To do: planned features](#to-do-planned-features)
  - [1. Trainee accounts and sign-in](#1-trainee-accounts-and-sign-in)
  - [2. History of marks](#2-history-of-marks)
  - [3. Trainer dashboard](#3-trainer-dashboard)
  - [Implementation notes](#implementation-notes)
- [Credits](#credits)

---

## What's on the site

| Page | What it does |
|---|---|
| **Learning path** (home) | Every unit and lesson as a route. Finished lessons are ticked, the next lesson is highlighted and checkpoints are shown as diamonds. The **Continue** card shows the next unfinished lesson and a trail of progress across the whole path. |
| **Capstone project** | The last lesson on the path, from the Sparta Global SQL project brief: create Course and Spartan tables, add data, draw an ERD of an improved design, then answer ten Northwind questions (including creating an index), plus an **optional** Exercise 3 of five advanced questions (window functions, `WITH`, temporary tables, pivoting), in the learner's **own** SQL Server, MySQL or SQLite (it links to the install guides first; in SQLite, question 2.9 uses a view instead of a stored procedure). Each question shows the result to check against and the lesson to revise, with 🐬 / 🪟 reminders, a tick-off checklist that completes the lesson, and a Print or save as PDF button. Model answers stay with trainers. |
| **Game** | *The Lost Ledger – Chapter 1: The Royal Archive*, a 3D SQL adventure in a toy-diorama style (about 20–30 minutes). A new Spartan from the Sparta Institute restores the kingdom's corrupted Royal Ledger: explore the village (the Institute, Village West, the Square and the East Gate) and the six-room Royal Archive, talk to Trainer Ada, Margaret, Bram (shop), Odo, Rex, Elin and Wisp (who give SQL advice, quests and items), read the SQL tips on the bookshelves and signs, fight bugs and NULL ghosts with the Debugger, and open rune doors by writing **real SQL** against the world's own database (Villagers, Houses, Items, Monsters). Nine puzzles from `SELECT` to `HAVING`, two side quests, chests (the Index Map, the Primary Key, heart containers), the Lantern and a hidden vault, and the two-headed Deadlock boss. Keyboard, point and click, or the on-screen D-pad with A and B on touch screens; 16-bit style sound effects and three original tunes; autosave, Ledger Stones, a menu with quests, items and the Archive map, and full screen. It's its own page, `public/game/index.html` (built into `dist/game/`), shown on the Game tab in a frame; it uses three.js 0.149 and sql.js 1.8 (asm build) from jsDelivr. The hero, **Nish the Great**, is modelled on Nish (his name is set once, as `HERO_NAME`, in the game's code). |
| **ERD maker** | Write `CREATE TABLE` statements (SQLite, MySQL or T-SQL) and get an entity relationship diagram: drag tables to arrange them, then download it as a PNG or SVG. Linked from Free practice, Creating tables, How this site works and capstone question 1.3. |
| **Install on your computer** | Step-by-step guides for practising outside the browser, linked from the home page and the Introduction: 🪟 SQL Server with Docker and VS Code (Windows and Mac, using the `kcornwall/sqlnorthwind` image), 🪟 SQL Server on Windows with SSMS, 🐬 MySQL on Windows, 🐬 MySQL on Mac, 🐬 MySQL with Docker, and 🪶 SQLite with DB Browser for SQLite (using the same Northwind file as this site). Every command has a Copy button, and both the MySQL Northwind script and the SQLite `northwind.db` are downloadable from the page. |
| **How this site works** (lesson 1, and the header's Introduction link) | How the site works: how it's organised, what's inside a lesson, how answers are marked, the **Show Northwind ERD** button, the dialect icons and where progress is saved. |
| **What's a database** | The first lesson: what a database and a DBMS are, why not a spreadsheet, tables, rows, columns, primary and foreign keys, data types, NoSQL, and what SQL does (DDL, DML and CRUD), with a labelled example table and three **Check yourself** questions. |
| **SQL flavours** | The second lesson: what SQL dialects are, the flavours learners will meet (MySQL, T-SQL, PostgreSQL, Oracle, SQLite), what's the same and what changes, that the course uses SQLite, a tabbed MySQL / T-SQL / SQLite comparison and three **Check yourself** questions. |
| **SQL dialects** (header tab) | The same comparison on its own page: **Side by side**, **MySQL**, **T-SQL** and **SQLite** tabs covering returning rows, wildcards, names and values, functions, tables and procedures, and advanced features. On the **SQLite** tab, **Try it** opens an example in Free practice. |
| **What's an ERD** | Entities, attributes, primary and foreign keys, crow's foot notation and the three kinds of relationship, with an interactive diagram and three **Check yourself** questions. |
| **Create tables and connect them** | Six guided steps that build a `Customers` and an `Orders` table, insert data, join them, trigger a foreign key error and add columns. The ERD beside the editor redraws itself from the learner's tables after every run. |
| **Meet Northwind** | The full Northwind ERD. Select a table to see its columns, its keys, what it links to and its first five rows. |
| **Lessons** (39) | A **Learn** tab with a short explanation and worked examples, each with a **Run this** button, then one tab per exercise. The editor and results sit alongside. |
| **Checkpoints** | The last lesson in units 2–5 and 7. No new teaching: mixed exercises on the whole unit. |
| **Quizzes** | An **end-of-unit quiz** for units 1 to 7 (8 to 12 questions each: multiple choice, plus 3 queries to write from unit 2 on), and two final quizzes: the **Query quiz** (28 query-writing tasks covering units 2 to 7, including the advanced topics) and the **Multiple-choice quiz** (40 questions on ERDs, how queries run, filtering, grouping, joins, subqueries, advanced topics and MySQL vs T-SQL). Learners choose to be marked at the end or straight away, after each answer. Optional timer, a score for each unit and a full review. |
| **Free practice** | Run any query against Northwind. Nothing is marked. |

### The learning path

| Unit | Lessons |
|---|---|
| **1. Foundations** | How this site works · What's a database · SQL flavours · Entity relationship diagrams · Data types · Types of SQL command · Creating tables · Primary and foreign keys · Inserting, updating and deleting data · Normalisation: 1NF to 3NF |
| **2. Introduction to querying** | Meet Northwind · Simple queries · Operators · Sorting data · Removing duplicates and limiting results · Wildcards · Concatenation · Arithmetic operators · *Checkpoint* |
| **3. Summarising data** | Aggregate functions · GROUP BY · HAVING · Working with NULL values · *Checkpoint* |
| **4. Combining tables** | Introduction to joins · Inner joins · Left joins · Table aliases and multiple joins · *Checkpoint* |
| **5. Subqueries** | Introduction to subqueries · Subqueries in WHERE · Subqueries in FROM and SELECT · EXISTS and NOT EXISTS · *Checkpoint* |
| **6. Going further** | CASE statements · Date and string functions · Indexes · Views · Stored procedures |
| **7. Advanced topics** | Window functions · Ranking functions · Comparing rows · Window frames · Statistical functions · Common table expressions · Temporary tables · Pivoting · Performance tuning · *Checkpoint* |
| **8. Capstone project** | Capstone project (in the learner's own SQL Server or MySQL) |

50 lessons, 142 exercises and 154 runnable examples in total. Unit 7 follows the *Advanced SQL* slides. **Stored procedures**
can't run in SQLite, so that lesson explains them with MySQL and T-SQL examples and ends with check questions instead of
exercises. **Data types**, **Types of SQL command** (DML, DDL, DCL and TCL as in the course slides, `DELETE` vs `TRUNCATE` vs `DROP`, and which groups the course covers) and
**Inserting, updating and deleting data** build on the `Customers` and `Orders` tables from Creating tables (the same names
as the course notes; customers Nish Mandal, Cathy French and Rich Gurney, with Phil Windridge added and Rich deleted in
Inserting data). Data types starts with the script that creates and fills them, and every run starts from a fresh copy, so learners can't break anything. **Normalisation: 1NF to 3NF** ends Unit 1, taking an order sheet from one big table to 3NF, with the update, insert
and delete anomalies it fixes. **Introduction to joins** uses Venn diagrams and two small made-up tables (students and courses, built with
`WITH` so they run here) to show inner, left, right, full outer and cross joins, and why to avoid `RIGHT JOIN`. **Introduction to subqueries** does the same for subqueries with a small made-up café
(products and sales): an inside-out diagram, what a subquery can return (one value, a list or a table), where it can
go, correlated subqueries and `EXISTS`.

Every lesson says how the dialects compare: either a 🪶 🐬 🪟 callout showing the difference, or a short
**Same in SQLite, MySQL and T-SQL** note. Creating tables ends with a full comparison of the three.

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

### How the quizzes work

| Quiz | Questions | Time limits | You answer by |
|---|---|---|---|
| **Unit 1 quiz** | 13 multiple-choice | 15 min, 20 min or none | Selecting ONE option |
| **Unit 2–7 quizzes** | 8 to 10 each: multiple-choice plus 3 queries | 20 min, 30 min or none | Both |
| **Query quiz** | 28, covering units 2 to 7 | 60 min, 75 min or none | Writing a query |
| **Multiple-choice quiz** | 40, across all six units | 60 min, 75 min or none | Selecting ONE option |

1. Choose a quiz on the **Quizzes** page, and whether to be marked **at the end** (like a real test) or **straight
   away** (each answer is marked as soon as you answer it, then locks) (or the **Unit N quiz** button under each unit on the learning path), then a time limit.
2. Press **Start the quiz**. Questions are shown one at a time; the numbered buttons at the top jump between them and fill in once a question has an answer.
3. Answer each question. You can **Run** a query as often as you like to see its results. Marked **at the end**, you aren't told
   whether it's right until you submit; marked **straight away**, **Check answer** marks it there and then.
4. Every question has a **Northwind ERD** button. It opens the diagram over the question, so you can check table and column names without leaving the quiz (the timer keeps running). Press **Esc** or **Close** to go back.
5. Press **Submit answers**. If time runs out, the quiz is submitted automatically. A countdown sits in the bar at the bottom and turns pink in the last five minutes.
6. You get your score and whether you passed (the pass mark is **65%**), the time taken and a **score for each unit**, with a link to revise each one.
7. Every question then shows your answer and the right one with an explanation: for the Query quiz, your query next to a model answer; for the Multiple-choice quiz, every option with the correct one marked.
8. Tick **Show only questions I got wrong** to focus on mistakes, or press **Retake quiz** to try again.

In the Query quiz, your answer to each task is whatever is in its editor when you submit. Queries run during a quiz
can't change the data: each one is rolled back as soon as it finishes.

### The Northwind ERD while you work

The **Northwind ERD** button opens the full diagram in a pop-up from every lesson (next to the editor and in each
exercise), from Free practice, and from every quiz question. Select a table to see its columns, keys and the tables it
links to.

### Which SQL does it run?

**SQLite.** Every lesson, example, exercise and quiz is written in SQLite, and it runs inside the learner's browser, so
there's nothing to install. Northwind uses SQLite's own column types (`INTEGER`, `REAL` and `TEXT`, with dates stored as
`'YYYY-MM-DD'` text), and its text columns are `COLLATE NOCASE`, so `'london'` matches `'London'`.

Where MySQL or T-SQL write something differently, the lessons show all three side by side, marked with the same icons as
the course notes: **🪶 SQLite** (runs here), **🐬 MySQL** and **🪟 T-SQL** (for comparison). The **SQL flavours** lesson
and the **SQL dialects** tab compare them in full. If someone types MySQL or T-SQL out of habit, they get a message
showing the SQLite way:

| You type | You're told |
|---|---|
| `SELECT TOP 10 …` | TOP is T-SQL; put `LIMIT 10` at the end |
| `YEAR(OrderDate)`, `MONTH(…)` | Use `strftime('%Y', OrderDate)` / `strftime('%m', …)` |
| `DATEDIFF(…)` | Use `julianday(end) - julianday(start)` |
| `DATE_ADD(d, INTERVAL 5 DAY)`, `DATEADD(…)` | Use `date(d, '+5 days')` |
| `LEFT(s, 3)`, `RIGHT(s, 3)` | Use `substr(s, 1, 3)` / `substr(s, -3)` |
| `LOCATE`, `CHARINDEX`, `LEN`, `DATE_FORMAT`, `NOW()`, `GETDATE()` | The SQLite function to use instead |
| `REGEXP` | Use `GLOB '[BS]*'` or `LIKE` |
| `AUTO_INCREMENT`, `IDENTITY(1,1)` | Use `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `SELECT … INTO #name`, `#name` | Use `CREATE TEMP TABLE name AS SELECT …` |
| `SHOW TABLES`, `DESCRIBE t`, `SHOW INDEX FROM t` | Use `sqlite_master`, `PRAGMA table_info('t')`, `PRAGMA index_list('t')` |
| `CREATE DATABASE`, `USE` | Not needed: a SQLite database is one file |
| `PIVOT`, `PERCENTILE_CONT`, stored procedures | Not in SQLite, with the alternative (CASE pivots, `CUME_DIST`, views) |

### Finding your way around

- **Header** – the same header as the ISTQB study site: the Sparta Global logo and **Home** (the learning path), **Introduction**, **SQL dialects**, **Install**, **Quizzes**, **Free practice** and **Game** on every page. On phones they move into a **Menu** button.
- **Back to top** – a button appears once you scroll down.
- **Continue where you left off** – the home page's **Continue** button opens the next lesson you haven't finished.
- **Breadcrumb** – the top of each lesson shows its unit and its position ("Lesson 17 of 50").
- **SQL dialects** – the header tab with the MySQL / T-SQL / SQLite comparison, available from every page.
- **Home** – the header's first link, the logo, the breadcrumb on every page and a button in every lesson's footer all go
  back to the home page (the learning path).
- **Mark lesson as complete** – every lesson's footer has this button for learners who want to tick a lesson off
  themselves (for example after doing it in class). It counts as complete on the path and can be undone.
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
| How this site works | `…/#/lesson/intro` (old `…/#/intro` links still work) |
| Install on your computer | `…/#/install` |
| ERD maker | `…/#/erd-maker` |
| Game | `…/#/game` |
| SQL dialects | `…/#/dialects` |
| A lesson | `…/#/lesson/<id>`, e.g. `#/lesson/innerjoin` (ids are in `src/content/lessons.js`) |
| Quizzes | `…/#/quiz` |
| A quiz | `…/#/quiz/queries`, `…/#/quiz/mcq` |
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
| The build stops with ✗ lines | Read the message - it names the lesson or quiz question and what's wrong (see [Editing the content](#updating-the-site)) |
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

This only needs setting up once. After that, every push to `main` is **tested, then published**: the new site goes live only if all the tests pass (otherwise the last version that passed stays live), and the test report is published either way at `/test-report/`. See [Testing](#testing).

1. Create a new repository on GitHub and push this folder to its `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push a change, or go to the **Actions** tab and run **Test and deploy to GitHub Pages** manually.
5. When the workflow shows a green tick, the site is live at the address shown on the **Settings → Pages** screen. A red cross means a test failed: open the test report to see which.

The workflow is in `.github/workflows/deploy.yml`. Because every link inside the site starts with `#`, it works at any
address, so there's no base path to set.

> **Note:** on GitHub's free plans a Pages site is **public**, even if the repository is private. Nothing in the site
> is confidential: the Northwind data is a Microsoft sample released under the MIT licence (see [Credits](#credits)).

### Other places to put it

`dist/index.html` is one file with everything inside it, so it also works on SharePoint, in a learning platform that
accepts HTML files, or in the ISTQB study site's `public/` folder (e.g. as `public/sql/index.html`).

---

## Updating the site

All the content (lessons, exercises, quiz questions, the capstone and the install guides) lives in plain text files in
`src/content/`. You don't need to touch any app code to change it, and every change is **checked automatically**
before it goes live, so a mistake can't break the live site.

### The quickest way: edit on GitHub (nothing to install)

1. Go to the repository on GitHub and open the file you want to change (see [Where everything lives](#where-everything-lives)).
2. Click the **pencil** icon (Edit this file) and make your change.
3. Click **Commit changes…**, write a short description (for example *Fix typo in Sorting data*), and commit to `main`.
4. Open the **Actions** tab. Within a minute or two you'll see your change being checked and published:
   - **Green tick**: it's live. Hard refresh the site (Ctrl + Shift + R, or Cmd + Shift + R on a Mac) to see it.
   - **Red cross**: something in the change is broken, so it **wasn't published** and the site still shows the
     previous version. Click into the run and open **Build site** to see the message (see
     [If the build fails](#if-the-build-fails)), fix the file, and commit again.

### On your own computer

```bash
git clone https://github.com/nishman89/sql-practice.git
cd sql-practice
npm ci                 # once, to install the tools
# …edit files in src/content/…
npm run build          # checks everything, then builds dist/index.html
```

Open `dist/index.html` in your browser to try your change, then commit and push. GitHub publishes it automatically.

### Where everything lives

| To change… | Edit… |
|---|---|
| A lesson's text, examples or exercises | `LESSONS` in `src/content/lessons.js` (find the lesson by its title) |
| The order of lessons, or a unit's name and description | `UNITS` at the top of `src/content/lessons.js` |
| Quiz questions, pass mark and time limits | `src/content/quizzes.js` |
| How this site works, and What's a database | `SITE_INTRO`, `DATABASES_LEARN` and `DATABASES_CHECK` in `src/content/intro.js` |
| SQL flavours, and the SQL dialects page | `FLAVOURS_LEARN`, `FLAVOURS_CHECK` and `DIALECTS` in `src/content/dialects.js` |
| The capstone project | `CAPSTONE_HTML` and `CAPSTONE_TASKS` in `src/content/capstone.js` |
| The install guides | `INSTALL_INTRO` and `INSTALL_OPTIONS` in `src/content/install.js` |
| The Creating tables steps | `BUILD_STEPS` in `src/app.js` |
| The ERD lesson page, header, home banner and footer | `src/index.html` |
| The ERD maker's starting example | `ERDM_EXAMPLE` in `src/app.js` |
| The Northwind table notes and diagram layout | `NW_NOTES` and `NW_POS` in `src/app.js` |
| Messages shown when someone types MySQL or T-SQL | `OTHER_DIALECTS` and `FN_HINTS` in `src/engine.js` |
| Colours and fonts | The variables at the top of `src/styles.css` |

### Recipes

Copy a template, paste it in the right place and change the words. Each one is a single entry in a list, so remember
the **comma** between entries.

#### Change a lesson's wording

Find the lesson's `learn:` text in `src/content/lessons.js` and edit the words between the HTML tags. `<p>` is a
paragraph, `<code>` is code inside a sentence, `<strong>` is bold, and `<h3>` is a sub-heading.

#### Add an example to a lesson

Inside a lesson's `learn:` text:

```js
${C("SELECT CompanyName, City\nFROM Customers\nWHERE Country = 'UK';")}
```

`\n` starts a new line in the SQL. Other kinds of example and box:

```js
${CERR("DELETE FROM Customers;")}                                  // an example that's meant to fail
${C("SELECT TOP 5 …", false, READ_ONLY('tsql', 'SQL Server Management Studio'))}   // T-SQL: no Run button
${C("SELECT … REGEXP …", false, READ_ONLY('mysql', 'MySQL Workbench'))}            // MySQL: no Run button
${TIP('A pink tip box. <code>Code</code> and <strong>bold</strong> work here.')}
${HD('all', 'A heading for something that works in all three')}
${HD(['sqlite', 'mysql'], 'A heading for something in SQLite and MySQL only')}
${HD(['tsql'], 'A heading for something only in T-SQL')}
```

#### Add a dialect note (🪶 🐬 🪟)

```js
${DIFF({ title: 'Replacing NULLs in each dialect',
         common: "COALESCE(Fax, 'No fax')",          // the way that works in all three (shown first, in green)
         sqlite: "IFNULL(Fax, 'No fax')",
         mysql:  "IFNULL(Fax, 'No fax')",
         tsql:   "ISNULL(Fax, 'No fax')",
         note:   'An optional sentence underneath.' })}
```

Leave out `common` if there's no shared way. Add `all: true` to show every dialect's row even when it matches the
shared way. Start a value with `~` to show plain text instead of code (for example `mysql: '~Not supported'`).
Where nothing differs, use `${SAME()}` instead.

#### Add an exercise

Add an entry to the lesson's `ex:` list:

```js
{ p:    'Show the name and price of every product that costs more than 50.',
  hint: 'WHERE UnitPrice > 50',
  sol:  "SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice > 50;" },
```

The learner's answer is marked by **comparing its results with your `sol`**, so `sol` must run on this site (SQLite).
If the task asks for an order, add `ordered: [1]`: the position of the sorted column, counting from 0.

#### Add a whole lesson

1. Add the lesson to `LESSONS`, giving it a short id:

   ```js
   mylesson: { title: 'My lesson', summary: 'One line saying what it covers.',
     learn: `<p>…</p>`,
     ex: [ … ] },
   ```

2. Add its id to the right unit's `lessons: [ … ]` list in `UNITS`, where you want it to appear.

#### Add a multiple-choice question

Add an entry to the quiz's `questions:` list in `src/content/quizzes.js`:

```js
{ unit: 3,
  q: 'Which clause filters groups?',
  options: ['WHERE', 'HAVING', 'ORDER BY', 'GROUP BY'],
  answer: 1,                 // 0 = a, 1 = b, 2 = c, 3 = d
  why: 'HAVING runs after GROUP BY, so it can filter the groups.' },
```

There must be exactly four different options. Spread the right answers across a to d: the build prints how often each
letter is used.

#### Add a query question

```js
{ lesson: 'groupby',         // the lesson it tests
  p:   'Show how many products are in each category.',
  sol: "SELECT CategoryID, COUNT(*)\nFROM Products\nGROUP BY CategoryID;",
  why: 'GROUP BY makes one row per category, and COUNT(*) counts its products.' },
```

#### Change the capstone, install guides, pass mark or time limits

- **Capstone:** each question is a `CAP_Q('2.3', 'The task', 'What to check', 'Lessons to revise')` line in
  `src/content/capstone.js`, and the checklist is `CAPSTONE_TASKS` (add `true` as a third item to mark a task optional).
- **Install guides:** one entry per guide in `INSTALL_OPTIONS`; `CMD('…')` makes a command with a Copy button.
- **Pass mark:** `QUIZ_SETTINGS = { passMark: 65 }` at the top of `src/content/quizzes.js`.
- **Time limits:** `timeLimits` (minutes; `0` means no limit) and `defaultLimit` on each quiz.

### Rules that keep things working

- **Quotes.** Most lesson text is between backticks (`` ` ``), so you can use `'` and `"` freely. Inside a `'…'`
  string (such as a hint, a TIP or a question), write an apostrophe as `\'`: `'It\'s optional'`.
- **New lines in SQL** are `\n` inside the quotes, not a real line break.
- **Answers must run in SQLite**, because that's what the site runs. Show MySQL and T-SQL with `READ_ONLY` examples or
  a `DIFF` note instead.
- **Lead with the way all three dialects share** (for example `CONCAT` before `||`), and label anything dialect-only
  with `HD()`.
- **Avoid exercises whose answer is no rows**: any empty result would then be marked correct.

### If the build fails

The build runs every model answer and example before publishing. The message names the lesson or quiz and what's
wrong, for example:

| Message | What it means |
|---|---|
| `✗ sorting, exercise 2: the model answer gives an error: no such column: Price` | The `sol` has a mistake in it (here the column is `UnitPrice`) |
| `✗ wildcards, example 3: gives an error …` | A **Run this** example doesn't run. If it's meant to fail, use `CERR` |
| `✗ quiz unit-3, question 5: needs exactly 4 options` (or `has two identical options`) | A multiple-choice question has the wrong number of options, or two the same |
| `✗ unit u2: lesson "mylesson" isn't defined in LESSONS` | A lesson id in `UNITS` doesn't match one in `LESSONS` |
| `SyntaxError: Unexpected identifier` | Usually a missing comma between entries, or an apostrophe that needs `\'` |

### Reference: everything a lesson can have


The templates above cover most changes. For everything else, here's the full detail.

#### Lessons – `src/content/lessons.js`

The file has two parts. `UNITS` sets the order of the path:

```js
const UNITS = [
  { id:'u2', title:'Introduction to querying', blurb:'Meet Northwind, then choose the columns and rows you need…',
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
    ${C("…", false, 'Your own label')}               ← a read-only example with a custom label
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

Each lesson also has `cmds`: the commands it uses. It's kept as data for reference but isn't currently shown on the
page. A lesson that can't have runnable exercises (such as Stored procedures) has `check` questions instead of `ex`, in
the same `{ q, a, c, why }` shape as the Foundations questions.

To show how the dialects differ, use `DIFF` inside `learn`:

```js
${DIFF({ title:'Limiting rows in each dialect',
         sqlite:'SELECT … LIMIT 5', mysql:'SELECT … LIMIT 5', tsql:'SELECT TOP 5 …',
         note:'Optional explanation underneath.' })}
```

Each value is shown as code (start it with `~` for plain text). Add `common:` for the way that works in all three: it's shown first, in green, and any dialect row
that just repeats it is left out (`otherTitle` names the rows below it). Where nothing differs, add `${SAME()}` (or
`${SAME('an extra sentence')}`) for the green **Same in SQLite, MySQL and T-SQL** note. For joins, `VENN(['a','ab','b'], 'label')`
draws a Venn diagram (`a` = only the left table, `ab` = both, `b` = only the right), and an exercise can have a `starter`:
text that's in the editor when the learner first opens it (the join exercises use it for the made-up tables).
`CERR(sql)` is an example that's meant to fail (the build checks it does), and a lesson with `rollback: true` undoes
every run, for lessons that change data. Add `db: 'mydb'` as well to run the lesson on the Creating tables example
(`MYDB_SEED`) instead of Northwind; `${MYDB_TABLES}` shows those two tables. `C(sql, false, READ_ONLY('mysql', 'MySQL Workbench'))`
shows a read-only MySQL or T-SQL example with its icon.

#### Exercises

Each exercise is marked by running its `sol` and comparing results, so `sol` must be a query that runs in SQLite (see
[Which SQL does it run?](#which-sql-does-it-run)).

- Add `ordered: [columns]` when the task asks for an order, listing the column positions (from 0) that are sorted on.
  `ordered: [1]` means "the second column must come back in the same order". Listing only the sort columns means rows
  that tie can come back in any order.
- Write the task so the expected columns are clear ("Show the name and price…"). Learners can add extra columns and
  still pass, but they can't miss one.
- Avoid tasks whose answer is **no rows**: any query returning nothing would be marked correct. The checks warn about this.

#### Quiz questions – `src/content/quizzes.js`

```js
const QUIZ_SETTINGS = { passMark: 65 };

const QUIZZES = [
  { id:'queries', type:'query', title:'Query quiz', timeLimits:[45, 60, 0], defaultLimit:45, blurb:'…', questions:[
    { lesson: 'select',                                  // the lesson it tests (also sets its unit in "Score by unit")
      p:    'List the CompanyName and City of every supplier based in the USA.',
      sol:  "SELECT CompanyName, City\nFROM Suppliers\nWHERE Country = 'USA';",
      why:  'A single WHERE condition on Country…' },   // shown in the review after submitting
    …
  ]},
  { id:'mcq', type:'mcq', title:'Multiple-choice quiz', timeLimits:[60, 75, 0], defaultLimit:60, blurb:'…', questions:[
    { unit: 3,                                           // 1-7, for "Score by unit"
      q:    'Which condition finds customers who have no Region?',
      code: 'SELECT …',                                  // optional: a query shown under the question
      options: ["WHERE Region = ''", 'WHERE Region = NULL', "WHERE Region IS 'NULL'", 'WHERE Region IS NULL'],
      answer: 3,                                         // index of the right option: 0 = a … 3 = d
      why:  'NULL means "unknown"…' },
    …
  ]},
];
```

An end-of-unit quiz has `unitQuiz: N` (it gets a button under unit N on the learning path) and `type:'mixed'`, so its
questions can be either kind: an object with `options` is multiple choice, one with `lesson` and `sol` is a query task.

`timeLimits` are minutes, and `0` means no limit. To add a quiz, add another object to `QUIZZES` with a new `id`; it
gets a card on the Quizzes page and its own address (`#/quiz/<id>`). Spread the right answers across a–d: the checks
print how often each letter is used.

**Safety net:** `npm run build` refuses to build if the content is broken. It runs every model answer and every
**Run this** example against Northwind, and fails if one gives an error, if a lesson in `UNITS` doesn't exist, if an
exercise is missing its task, hint or answer, if a dialect comparison **Try it** example errors, if `ordered` points at a column that isn't there, if a quiz id is
used twice, or if a multiple-choice question doesn't have exactly four different options and a valid `answer`. It also warns when a model answer returns no rows. Run `npm run check` after editing.

---

## Testing

The site has an automated test suite, and GitHub runs all of it on every push to `main` **before anything is published**.

- **The test report:** https://nishman89.github.io/sql-practice/test-report/ (the latest run, whether it passed or failed)
- **The unit test results:** https://nishman89.github.io/sql-practice/test-report/unit-tests.txt
- **Every run, with its own downloadable report:** the repository's **Actions** tab

### What's tested

| Layer | Tool | Files | What it checks |
|---|---|---|---|
| **Content checks** | `scripts/check.mjs` (runs inside `npm run build`) | — | Every model answer and "Run this" example runs against Northwind; quiz questions are well formed |
| **Unit tests** (~380) | Node's built-in test runner (`node:test`), no extra tools | `tests/unit/` | **The SQL engine:** running queries, marking answers (row order, column order, aliases and extra columns don't matter), friendly messages for 12 MySQL and T-SQL habits. **The course:** every lesson, exercise, quiz question, dialect example, install guide and the capstone is complete and its SQL runs. **The game:** its world database, all nine puzzles (including that tapping their pieces in order builds a correct answer), its marking, the hints for capitals and quotes, and that every map, terminal, chest and door link adds up. **The build:** everything's there, within size budgets, with pinned library versions. **House style:** British spellings, no leftover wording |
| **Browser tests** (~60) | Playwright, in Chromium at desktop size | `tests/e2e/*.spec.mjs` | Navigation and saved progress; **every lesson's exercises marked correct in a real browser**; quizzes passing and failing; free practice; the Creating tables builder (including a past bug in step 2); the ERD maker; install guides; the Northwind diagram; the game end to end (title, Ada and the sealed door, terminals and their hints, the story, saving and Continue, the Game tab); every in-site link |
| **Phone tests** | Playwright, as a Pixel 7 | `tests/e2e/mobile.spec.mjs` | The phone menu, answering an exercise, no sideways scrolling, and the game's full screen with a way back out |
| **Accessibility** | axe (`@axe-core/playwright`) | `tests/e2e/accessibility.spec.mjs` | No serious or critical WCAG 2 A / AA problems on the main pages |

### Setting it up

You need **Node.js 20 or later**. Then, in the project folder:

```bash
npm ci                              # installs everything, including Playwright and axe (they're in devDependencies)
npx playwright install chromium     # downloads the test browser, once (on Linux, add --with-deps)
npm run build                       # builds dist/: the browser tests run against the built site
```

### Running the tests

| Command | What it does | Time |
|---|---|---|
| `npm test` | Unit tests, then browser tests | a few minutes |
| `npm run test:unit` | Just the unit tests | a few seconds |
| `npm run test:e2e` | Just the browser tests (it starts a local server for you) | a few minutes |
| `npx playwright test tests/e2e/quizzes.spec.mjs` | One test file | |
| `npx playwright test -g "Creating tables"` | Tests whose name matches | |
| `npx playwright test --ui` | Pick tests and watch them run, step by step | |
| `npx playwright show-report` | Open the last browser test report | |
| `npm run serve` | Serve `dist/` at http://localhost:4173/sql-practice/ to look around yourself | |

Rebuild (`npm run build`) after changing anything in `src/`, `public/` or `data/`, because the browser tests use `dist/`.

### How it works

- **Unit tests** load the same `src/engine.js` and `src/content/*.js` the browser uses, into a Node `vm` sandbox with SQLite (sql.js) and `data/northwind.db` (see `tests/unit/helpers.mjs`). For the game, the helper pulls its pure logic (the maps, links, puzzles, world database and marking functions) straight out of `public/game/index.html` by name, so the tests always check the real game code. Those names must stay top-level `const` or `function` definitions.
- **Browser tests** run against `dist/`, served at `/sql-practice/` by `scripts/serve.mjs`, just like GitHub Pages. Playwright starts the server itself (`playwright.config.mjs`).
- **The shared fixture** (`tests/e2e/fixtures.mjs`) does two things for every browser test: it **fails the test if the page throws any JavaScript error**, and it serves the game's three.js and sql.js from `node_modules`, so a CDN outage can't break the tests. Google Fonts are blocked to keep tests fast and offline-friendly.
- **Finding things on the page:** tests use `data-testid` attributes (listed in the "Test IDs" section of this README) rather than text or styling, so wording and design changes don't break them.
- **The game** draws with WebGL, which is slow without a graphics card. Its tests open it with **`?lowfx`** (fewer pixels, no shadows, no tilt-shift blur: the same game, much less drawing), run one at a time, and use the game's test handle, `window.PROTO`, to move around: `warp(place, x, y, facing)`, `use()`, `talking()`, `pos()`, `G()` (hearts, keywords, items, flags, solved puzzles), `openPuzzle(id)`, `defeat(i)` and `ended()`.
- **Retries:** on GitHub, a failed browser test is retried once, to rule out a one-off slow moment. Locally there are no retries.

### Adding a test

A unit test (`tests/unit/something.test.mjs`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from './helpers.mjs';
const s = await loadSite();

test('every customer has a company name', () => {
  const r = s.runScript(s.northwind(), 'SELECT COUNT(*) FROM Customers WHERE CompanyName IS NULL;', 'nw');
  assert.equal(r.results[0].values[0][0], 0);
});
```

A browser test (`tests/e2e/something.spec.mjs`); import `test` from the fixture, not from Playwright directly, so you get the error checks:

```js
import { test, expect, id } from './fixtures.mjs';

test('free practice counts the products', async ({ page }) => {
  await page.goto('#/free');
  await id(page, 'free-editor-input').fill('SELECT COUNT(*) FROM Products;');
  await id(page, 'free-run').click();
  await expect(id(page, 'free-result-table')).toContainText('77');
});
```

If a test needs to find something new on the page, give it a `data-testid` in the HTML, and add it to the "Test IDs" table.

### On GitHub: test, then publish

The workflow is `.github/workflows/deploy.yml`. On every push to `main` it:

1. **Builds the site**, which runs the content checks.
2. **Runs the unit tests**, then installs Chromium and **runs the browser tests**.
3. **Keeps the report** with the run (download it from the run's page, under *Artifacts*, for 30 days).
4. **Publishes**, whatever the result:
   - **If everything passed:** the new site, with the report at `/test-report/`.
   - **If anything failed:** the **last version that passed** (rebuilt from that commit), so nothing broken goes live, with the **new** report at `/test-report/`. The run is then marked as failed (a red ❌), so you know.

Each run's summary page shows a table of the results and the report link. Pull requests are tested but never published.

Changing the workflow file needs a GitHub token with the **Workflows** permission, or an edit on github.com.

### Reading the report

- **The browser test report** (`/test-report/`) lists every test, grouped by file, with filters for failed, flaky and passed. Click a failed test to see the error, a **screenshot** of the page at that moment, and a **trace**: a step-by-step replay you can open at https://trace.playwright.dev.
- **The unit test results** (`/test-report/unit-tests.txt`) list every unit test and show any failure's expected and actual values.

### Troubleshooting

| Problem | Fix |
|---|---|
| `Executable doesn't exist` | Run `npx playwright install chromium` |
| `Error: browserType.launch` on Linux | Install the browser's system libraries: `npx playwright install --with-deps chromium` |
| `port 4173 is already in use` | Stop the other server, or run with `PORT=4180` (and update `playwright.config.mjs`) |
| A test fails only after you changed `src/` | Rebuild first: `npm run build` |
| Game tests time out on a slow machine | Run them on their own: `npx playwright test tests/e2e/game.spec.mjs --workers=1` |
| An accessibility test fails | The message names the rule (for example `color-contrast`) and an element; look the rule up at https://dequeuniversity.com/rules/axe |

## How it's built

*For the full picture, read **[ARCHITECTURE.md](ARCHITECTURE.md)**.*

The site is plain HTML, CSS and JavaScript with no framework. A small build script (`scripts/build.mjs`) stitches the
source files, the SQL engine and the Northwind database into **one file**, `dist/index.html`. In the browser,
**[sql.js](https://sql.js.org)** (SQLite compiled to JavaScript) runs every query, so there's nothing to install and
nothing to host except that one file.

```
├── .github/workflows/deploy.yml   Checks, builds and publishes to GitHub Pages
├── data/northwind.db              The full Northwind sample database (SQLite, ~300 KB): all 13 tables and 16 views
├── public/downloads/              Files learners download, copied into the site as they are (the MySQL Northwind script,
│                                  and northwind.db, a copy of data/northwind.db for the SQLite guide)
├── scripts/
│   ├── build.mjs                  Builds dist/index.html
│   ├── check.mjs                  Runs every model answer and example; stops the build if one fails
│   └── build-northwind.py         Builds data/northwind.db from Microsoft's instnwnd.sql: all 13 tables (photo columns kept but
│                                  empty) and the 16 views translated into SQLite (only needed to rebuild it)
└── src/
    ├── index.html                 The page shell: header, the static pages, and placeholders filled by the build
    ├── styles.css                 Sparta Global theme
    ├── engine.js                  The SQL layer: running scripts, SQLite guidance for other dialects, friendly errors, answer checking
    ├── app.js                     Pages and UI: path, lessons, Foundations pages, ERDs, Free practice, progress
    ├── quiz.js                    The query quiz
    ├── assets/                    Sparta Global logos and favicon (inlined into the page by the build)
    └── content/
        ├── lessons.js             Units, lessons, examples and exercises
        ├── intro.js               The What's a database lesson, the Introduction page, and their questions
        ├── install.js             The Install on your computer guides
        ├── capstone.js            The capstone project brief, expected results and checklist
        ├── dialects.js            The SQL flavours lesson text and the MySQL / T-SQL / SQLite comparison
        └── quizzes.js             The end-of-unit quizzes, the Query quiz, the Multiple-choice quiz and the pass mark
```

The lessons were written from the Sparta Global SQL lesson notes (`SQL Querying` and `Creating Tables and Connecting
Them`) and the *Advanced SQL* slides, and are now edited directly in `src/content/`.

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
| **Header** (every page) | `site-header` · `home-logo` · `main-nav` · `nav-path` (labelled Home) · `nav-intro` · `nav-dialects` · `nav-install` · `nav-quiz` · `nav-free` · `back-to-top` · `site-footer` |
| **Other pages** (Introduction, Install, SQL dialects, Quizzes, Free practice) | `breadcrumb` · `breadcrumb-home` · `breadcrumb-page` |
| **Header on phones** | `mobile-menu` · `mobile-nav-path` · `mobile-nav-intro` · `mobile-nav-dialects` · `mobile-nav-install` · `mobile-nav-quiz` · `mobile-nav-free` |
| **Home hero** | `hero` · `hero-start` · `hero-intro` · `hero-install` · `hero-quiz` · `hero-free` |
| **Capstone project** | `capstone-title` · `capstone-print` · `capstone-body` · `capstone-before` · `capstone-install-link` · `capstone-q-1-1` … `capstone-q-2-9` · `capstone-checklist` · `capstone-task-setup`, `capstone-task-1-1` … `capstone-task-2-9`, `capstone-task-submit` |
| **Game** | `nav-game` · `mobile-nav-game` · `game-title` · `game-stage` · `game-frame` (the game's page in a frame) · `game-fullscreen` · `game-exit-fullscreen`. Inside the game page, `window.PROTO` gives tests a handle: `pos()`, `G()` (hearts, keywords, items, flags, solved puzzles), `warp(place, x, y, facing)`, `use()`, `talking()`, `hint()`, `openPuzzle(id)` and `ended()` |
| **ERD maker** | `erdmaker-title` · `erdmaker-editor-input` · `erdmaker-run` (Draw ERD) · `erdmaker-example` · `erdmaker-tidy` · `erdmaker-download-png` · `erdmaker-download-svg` · `erdmaker-message` · `erdmaker-diagram` · each table `erdmaker-table-<name>` · links: `free-erd-maker`, `build-erd-maker`, `capstone-erd-maker`, `intro-card-erd-maker` |
| **Install on your computer** | `install-title` · `install-intro` · `install-guides` · `install-tab-docker-sqlserver` / `-windows-sqlserver` / `-windows-mysql` / `-mac-mysql` / `-docker-mysql` / `-sqlite` · `install-panel` (with `data-guide`) · `copy-command` · `download-mysql-northwind` · `download-sqlite-northwind` · the chooser grid's option names: `choose-docker-sqlserver`, `choose-windows-sqlserver`, `choose-windows-mysql`, `choose-mac-mysql`, `choose-docker-mysql`, `choose-sqlite` (each opens that guide) |
| **How this site works** (lesson 1) | `intro-title` · `intro-body` · `intro-install-link` · `intro-card-path` / `-dialects` / `-quizzes` / `-free` · `intro-open-erd` · `intro-start` |
| **Learning path** | `continue-card` · `overall-progress` (with `data-lessons-done` and `data-exercises-done`) · `continue` · `reset-progress` · `unit-1` … `unit-7` · `unit-quiz-1` … `unit-quiz-7` (each unit's quiz button) · `unit-quiz-N-score` · `lesson-<id>` (with `data-status`: `done`, `next`, `started` or `todo`) · `lesson-link-<id>` · `lesson-status-<id>` |
| **Any lesson** | `breadcrumb` · `breadcrumb-home` · `breadcrumb-unit` · `lesson-position` · `lesson-footer` · `lesson-status` (with `data-done`, and `data-manual="true"` when marked complete by hand) · `mark-complete` · `unmark-complete` · `back-home` · `previous-lesson` · `next-lesson` |
| **What's a database lesson** | `databases-title` · `databases-body` · `databases-see-table` · `databases-check` · `databases-check-question-1` … `-3` (with `data-answer`) · options `databases-check-question-N-option-a` and `…-option-a-input` · `databases-check-question-N-feedback` |
| **SQL flavours lesson** | `flavours-title` · `flavours-body` · the comparison (prefix `flavours-`, see next row) · `flavours-check` · `flavours-check-question-1` … `-3` (with `data-answer`) · options `flavours-check-question-N-option-a` and `…-option-a-input` · `flavours-check-question-N-feedback` |
| **Dialect comparison** | On the SQL dialects page the prefix is `dialects-` (`dialects-title`, `dialects-flavours-link`); in the lesson it's `flavours-`. `<prefix>-tabs` · tabs `<prefix>-tab-side`, `-tab-mysql`, `-tab-tsql`, `-tab-lab` (the SQLite tab; with `aria-selected`; Left/Right arrows move between them) · `<prefix>-panel` (with `data-tab`) · rows `<prefix>-row-1` … · on the SQLite tab `<prefix>-try-N` |
| **Northwind ERD pop-up** | Open buttons: `lesson-open-erd` · `exercise-open-erd` · `free-open-erd` · `question-N-open-erd` (quizzes) · the pop-up: `erd-dialog` · `erd-dialog-close` · `erd-dialog-diagram` · each table `dialog-table-customers`, `dialog-table-order-details` … · `erd-dialog-detail` · `erd-dialog-table` (the selected table's name) |
| **On phones** (up to 700px wide) | Run this shows the result under the example: `inline-result-N`, with `edit-in-editor-N` to jump to the editor |
| **Lesson navigation bar** (top of every lesson) | `lesson-nav` · `top-previous-lesson` · `top-next-lesson` |
| **Lesson tabs** | `lesson-title` · `lesson-summary` · `lesson-mydb-note` (lessons using the Creating tables example) · `lesson-tabs` · `tab-learn` · `tab-exercise-1` … (with `data-done`) · `lesson-body` |
| **Learn tab** | `example-1` … · `run-example-1` … (numbered with the read-only examples) · `start-exercises` · on Stored procedures: `lesson-check` · `lesson-check-question-1` … · options `lesson-check-question-N-option-a` and `…-input` |
| **Exercise tab** | `exercise-number` · `exercise-prompt` · `solved` · `show-hint` · `hint` · `show-answer` · `answer` · `copy-answer` · `verdict` (with `data-correct`) · `verdict-next` |
| **SQL editors** | Lessons `lesson-editor-input` / `lesson-run` · Free practice `free-editor-input` / `free-run` · Create tables `build-editor-input` / `build-run` · table buttons `lesson-insert-table-customers`, `free-insert-table-order-details` … |
| **Query results** | Each results area (`lesson-results`, `free-results`, `build-results`, and `question-N-results` in a quiz) prefixes its hooks with its own name. For lessons: `lesson-query-log` · `lesson-query-error` · `lesson-query-error-message` · `lesson-query-error-hint` · `lesson-result-1` … · `lesson-row-count` (with `data-rows`) · `lesson-result-table`. A second result set adds `-2` (`lesson-result-table-2`). |
| **What's an ERD** | `check-yourself` · `check-question-1` … `check-question-3` (with `data-answer`) · options `check-question-N-option-a` (the label) and `check-question-N-option-a-input` (the radio) · `check-question-N-feedback` |
| **Create tables** | `build-dialects` (the MySQL / T-SQL / SQLite comparison) · `step-dialect-answers` (each step's sample answer in all three dialects) · `build-step-1` … `build-step-6` (with `data-done`) · `step-checklist` · `step-check-1` … (with `data-done`) · `use-lesson-code` · `build-start-again` · `build-erd` · each table in the diagram `build-table-customers`, `build-table-orders` |
| **Meet Northwind** | `northwind-erd` · each table `northwind-table-customers`, `northwind-table-order-details` … · `table-detail` · `query-table` |
| **Free practice** | `restore-northwind` |
| **Quizzes page** | `quizzes-title` · `unit-quizzes` · `final-quizzes` · `quiz-card-unit-1` … `quiz-card-unit-7` · `quiz-card-queries` / `quiz-card-mcq` · `quiz-card-<id>-count` · `quiz-card-<id>-last` · `quiz-card-<id>-best` · `open-quiz-unit-1` … `open-quiz-unit-7` · `open-quiz-queries` / `open-quiz-mcq` |
| **Quiz start** | `back-to-quizzes` · `quiz-title` · `quiz-start` · `question-count` · `pass-mark` · `last-attempt` · `mark-mode` · `mark-at-end` / `mark-straight-away` (instant marking: then `question-N-check` for query tasks and `question-N-feedback`, with `data-correct`, on each answered question) · `time-limit` (`<select name="time-limit">`: unit 1 `15`, `20`, `0`; units 2–7 `20`, `30`, `0`; final quizzes `60`, `75`, `0`) · `start-quiz` |
| **Quiz question** (N = 1, 2, 3…) | `question-nav` · `question-nav-N` · `question-N` (with `data-unit`) · `question-N-number` · `question-N-unit` · `question-N-prompt` · `question-N-open-erd` |
| **Query quiz question** | `question-N` has `data-solution` · `question-N-input` · `question-N-run` · `question-N-results` |
| **Multiple-choice question** | `question-N` has `data-answer` (`a`–`d`) · `question-N-code` (when there's a query) · `question-N-instruction` ("Select ONE") · options `question-N-option-a` (the label) and `question-N-option-a-input` (the radio, `name="question-N"`, with `data-option`) |
| **Submit bar** | `submit-bar` · `answered-count` · `previous-question` · `question-position` · `next-question` · `timer` · `submit-answers` |
| **Quiz results** | `results` · `revise-unit` (unit quizzes, instead of the unit table) · `quiz-verdict` · `score` · `score-total` · `score-percent` · `time-taken` · `unit-breakdown` · `breakdown-unit-N` / `breakdown-unit-N-score` · `only-wrong-toggle` · `retake` · `all-quizzes` · per question `question-N-review` (with `data-state`: `right`, `wrong` or `blank`) · `question-N-verdict` · `question-N-explanation` · Query quiz: `question-N-your-answer` · `question-N-model-answer` · Multiple-choice: `question-N-review-option-a` … |

### Things worth knowing when you write tests

- **Below 48rem wide the header links move into `mobile-menu`.** Click its `<summary>` first, then `mobile-nav-…`.
- **Pages are addresses after `#`.** Go straight to `#/quiz/queries` or `#/lesson/select` rather than clicking through.
- **The quiz shows one question at a time.** Only the current question's `question-N` elements exist; use
  `next-question` / `previous-question` or `question-nav-N` to move. Your typing is kept when you move.
- **The editors are `<textarea>` elements** under a syntax-highlighting layer. Selenium's `sendKeys` and Playwright's
  `fill` both work on them. Clear the starter comment first, or use `fill`, which replaces it.
- **Submitting with unanswered questions** opens a browser `confirm()` dialog - your test must accept or dismiss it.
  So do **Start again** (Create tables), **Restore Northwind** and **Reset my progress**.
- **Answers are checked by result, not by text.** Any query that returns the right rows passes.
- **The answers are in the page**: `data-solution` on `question-N` in the Query quiz and on `lesson-body` for lesson
  exercises, and `data-answer` on `question-N` in the Multiple-choice quiz (and on `check-question-N` on the ERD
  page) - handy for writing a test that scores 100%.
- **The ERD pop-up is a `<dialog>`.** While it's open the page behind can't be clicked, so close it (`erd-dialog-close`
  or Esc) before carrying on.
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

class QueryQuizTest {
    WebDriver driver;

    static By testId(String id) {
        return By.cssSelector("[data-testid='" + id + "']");
    }

    @BeforeEach void setUp()    { driver = new ChromeDriver(); }
    @AfterEach  void tearDown() { driver.quit(); }

    @Test
    void scoresFullMarksWhenEveryModelAnswerIsSubmitted() {
        driver.get("https://nishman89.github.io/sql-practice/#/quiz/queries");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        new Select(wait.until(ExpectedConditions.elementToBeClickable(testId("time-limit")))).selectByValue("0");

        int total = Integer.parseInt(driver.findElement(testId("question-count")).getText());   // 28
        driver.findElement(testId("start-quiz")).click();
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

test('scores 100% on the multiple-choice quiz', async ({ page }) => {
  await page.goto('https://nishman89.github.io/sql-practice/#/quiz/mcq');
  await page.getByTestId('time-limit').selectOption('0');
  await page.getByTestId('start-quiz').click();

  for (let i = 1; i <= 40; i++) {
    const answer = await page.getByTestId(`question-${i}`).getAttribute('data-answer');   // 'a'-'d'
    await page.getByTestId(`question-${i}-option-${answer}`).click();
    if (i < 40) await page.getByTestId('next-question').click();
  }
  await page.getByTestId('submit-answers').click();
  await expect(page.getByTestId('score-percent')).toHaveText('100%');
});

test('the ERD can be opened during a quiz without losing the answer', async ({ page }) => {
  await page.goto('https://nishman89.github.io/sql-practice/#/quiz/queries');
  await page.getByTestId('start-quiz').click();
  await page.getByTestId('question-1-input').fill('SELECT * FROM Suppliers;');
  await page.getByTestId('question-1-open-erd').click();
  await page.getByTestId('dialog-table-suppliers').click();
  await expect(page.getByTestId('erd-dialog-table')).toHaveText('Suppliers');
  await page.getByTestId('erd-dialog-close').click();
  await expect(page.getByTestId('question-1-input')).toHaveValue('SELECT * FROM Suppliers;');
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
