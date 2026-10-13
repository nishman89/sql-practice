/* ---------- What's a database (first lesson) ---------- */
const DATABASES_LEARN = `
<p class="lede">A database is an organised collection of data, stored so it can be searched, updated and shared easily. Almost every app you use sits on one.</p>
<p>A shop's orders, a bank's accounts, a hospital's patient records, a music app's playlists: each is a database. The data is kept in one place, in a fixed structure, so many people and programs can use it at the same time without getting in each other's way.</p>

<h3>The database and the DBMS</h3>
<p>The <strong>database</strong> is the data itself. The <strong>database management system</strong> (DBMS) is the software that stores it, answers questions about it and keeps it safe. MySQL, SQL Server, PostgreSQL, Oracle and SQLite are all DBMSs. When people say "a MySQL database", they mean a database managed by MySQL.</p>
<div class="dbms-grid">
  <div><b>Stores</b><span>Keeps the data on disk and finds it again quickly.</span></div>
  <div><b>Shares</b><span>Lets many users read and change data at once without clashing.</span></div>
  <div><b>Protects</b><span>Controls who can see or change what, and supports backups.</span></div>
  <div><b>Checks</b><span>Enforces rules, such as "every order must belong to a real customer".</span></div>
</div>

<h3>Why not just use a spreadsheet?</h3>
<table class="mini"><tr><th></th><th>Spreadsheet</th><th>Database</th></tr>
<tr><td>Size</td><td>Slows down with hundreds of thousands of rows</td><td>Handles millions of rows</td></tr>
<tr><td>Many users</td><td>Easy to overwrite each other's changes</td><td>Built for many users at once</td></tr>
<tr><td>Rules</td><td>Any cell can hold anything</td><td>Each column has a data type and can have rules</td></tr>
<tr><td>Linking data</td><td>Copy and paste, or lookups that break</td><td>Tables linked by keys</td></tr>
<tr><td>Asking questions</td><td>Filters and formulas</td><td>SQL queries</td></tr></table>

<h3>Relational databases: tables, rows and columns</h3>
<p>Most business databases are <strong>relational</strong>: the data is split into <strong>tables</strong>, one for each kind of thing (customers, orders, products), and the tables are linked together. This course is about relational databases.</p>
<p>These rows come from <strong>Northwind</strong>, the sample database you'll query from Unit 2:</p>
<div class="anatomy">
  <table class="mini anatomy-table">
    <tr><th class="hl-pk">CustomerID</th><th>CompanyName</th><th class="hl-col">City</th><th>Country</th></tr>
    <tr><td class="hl-pk">ALFKI</td><td>Alfreds Futterkiste</td><td class="hl-col">Berlin</td><td>Germany</td></tr>
    <tr class="hl-row"><td class="hl-pk">AROUT</td><td>Around the Horn</td><td class="hl-col">London</td><td>UK</td></tr>
    <tr><td class="hl-pk">BERGS</td><td>Berglunds snabbköp</td><td class="hl-col">Luleå</td><td>Sweden</td></tr>
  </table>
  <ul class="anatomy-key">
    <li><span class="sw sw-table"></span><span><b>Table</b> (entity): all the customers. Each table holds one kind of thing.</span></li>
    <li><span class="sw sw-row"></span><span><b>Row</b> (record): one customer, Around the Horn.</span></li>
    <li><span class="sw sw-col"></span><span><b>Column</b> (field or attribute): one fact about every customer, their City.</span></li>
    <li><span class="sw sw-pk"></span><span><b>Primary key</b>: CustomerID. Unique for every row and never empty, so each customer can be identified.</span></li>
  </ul>
</div>
<p>Every column has a <strong>data type</strong>, which decides what it can hold. The <a href="#/lesson/datatypes">Data types</a> lesson covers them properly; here are the main ones:</p>
<table class="mini"><tr><th>Data type</th><th>Holds</th><th>Example</th></tr>
<tr><td><code>INT</code></td><td>Whole numbers</td><td><code>42</code></td></tr>
<tr><td><code>DECIMAL(10,2)</code></td><td>Exact numbers with decimals, such as money</td><td><code>18.99</code></td></tr>
<tr><td><code>VARCHAR(40)</code></td><td>Text, up to a maximum length</td><td><code>'London'</code></td></tr>
<tr><td><code>DATE</code></td><td>A date</td><td><code>'1997-03-15'</code></td></tr>
<tr><td><code>BOOLEAN</code> / <code>BIT</code></td><td>True or false</td><td><code>TRUE</code> / <code>1</code></td></tr></table>
<p>Tables are linked by storing one table's primary key in another. An order stores the CustomerID of the customer who placed it; that column is a <strong>foreign key</strong>. A diagram of the tables and their links is an ERD, which is the lesson after next.</p>

<h3>Other kinds of database</h3>
<p>Some databases don't use tables. <strong>NoSQL</strong> databases store documents (MongoDB), key-value pairs (Redis) or graphs of connected items (Neo4j). They suit some jobs well, but relational databases and SQL are still the most widely used, and they're what this course teaches.</p>

<h3>What SQL does</h3>
<p><strong>SQL</strong> (Structured Query Language) is how you talk to a relational database. Its statements fall into two groups:</p>
<table class="mini"><tr><th>Group</th><th>Statements</th><th>Used to</th></tr>
<tr><td>Data definition (DDL)</td><td><code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>, <code>TRUNCATE</code></td><td>Build and change the structure: tables, columns, keys</td></tr>
<tr><td>Data manipulation (DML)</td><td><code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td><td>Read and change the data itself</td></tr>
<tr><td>Data control (DCL) and transaction control (TCL)</td><td><code>GRANT</code>, <code>REVOKE</code>; <code>COMMIT</code>, <code>ROLLBACK</code>, <code>SAVEPOINT</code></td><td>Control who can do what, and group changes together</td></tr></table>
<p>The four things you do with data are often called <strong>CRUD</strong>: Create (<code>INSERT</code>), Read (<code>SELECT</code>), Update (<code>UPDATE</code>) and Delete (<code>DELETE</code>). Most of this course is about reading data with <code>SELECT</code>. The <a href="#/lesson/sqlcommands">Types of SQL command</a> lesson covers all the groups, including why <code>TRUNCATE</code> is DDL but <code>DELETE</code> is DML.</p>`;

const DATABASES_CHECK = [
  {q:'What is a DBMS?', a:['The data stored in a database','Software that stores, manages and protects a database','A diagram of a database\'s tables'], c:1, why:'MySQL, SQL Server and SQLite are DBMSs. The database is the data they manage; a diagram of the tables is an ERD.'},
  {q:'In the Customers table, what is one row?', a:['Every customer\'s City','The whole table','One customer, with all of their details'], c:2, why:'A row (record) is one item: one customer. A column (field) is one fact about every customer, such as City.'},
  {q:'Which SQL statement reads data without changing it?', a:['SELECT','UPDATE','INSERT'], c:0, why:'SELECT reads. INSERT, UPDATE and DELETE change the data, and CREATE, ALTER and DROP change the structure.'}
];

/* ---------- Introduction: how to use the site ---------- */
const SITE_INTRO = `
<p class="lede">This site teaches SQL by doing it. You read a short explanation, run worked examples, then write your own queries against a real database, and they're checked straight away. Everything runs in your browser, so there's nothing to install.</p>

<h2 class="dot">How it's organised</h2>
<div class="intro-cards">
  <a class="intro-card" href="#/path" data-testid="intro-card-path"><b>Learning path</b><span>Eight units, from what a database is to window functions and performance tuning, finishing with a capstone project. Work through them in order, or jump to any lesson.</span></a>
  <a class="intro-card" href="#/dialects" data-testid="intro-card-dialects"><b>SQL dialects</b><span>How MySQL, T-SQL and SQLite write the same things, side by side.</span></a>
  <a class="intro-card" href="#/quiz" data-testid="intro-card-quizzes"><b>Quizzes</b><span>A short quiz for each unit, plus two final quizzes. Choose to be marked at the end, like a real test, or straight away, after each answer.</span></a>
  <a class="intro-card" href="#/erd-maker" data-testid="intro-card-erd-maker"><b>ERD maker</b><span>Write <code>CREATE TABLE</code> statements and get an entity relationship diagram you can arrange and download.</span></a>
  <a class="intro-card" href="#/free" data-testid="intro-card-free"><b>Free practice</b><span>Run any query you like against the Northwind database. Nothing is marked.</span></a>
</div>

<h2 class="dot">Inside a lesson</h2>
<ol class="steps-list">
  <li><b>The title and what it's for.</b> Every lesson starts with these, so you can see at a glance what it covers. The bar above them takes you to the previous or next lesson.</li>
  <li><b>Learn.</b> A short explanation with worked examples. Press <strong>Run this</strong> on any example to load it into the editor and run it, then change it and run it again.</li>
  <li><b>Exercises.</b> A task to solve with a query. Press <strong>Run</strong> (or <kbd>Ctrl</kbd> + <kbd>Enter</kbd>) and your result is checked at once. If it isn't right yet, you're told what's different. <strong>Show a hint</strong> and <strong>Show the answer</strong> are there if you're stuck.</li>
  <li><b>Lesson complete.</b> Solve every exercise (or, in a few lessons, answer the check questions) and the lesson is ticked off on the learning path. You can also tick a lesson off yourself with <strong>Mark lesson as complete</strong> at the bottom, for example if you've covered it in class.</li>
</ol>
<p>Answers are marked on what your query <em>returns</em>, not how it's written. Column names and aliases don't matter, extra columns are fine, and the order of rows only matters when the task asks for it.</p>

<h2 class="dot">The Northwind ERD</h2>
<p>From Unit 2 onwards, the exercises use Northwind, a sample database for a small food trading company. When you can't remember a table or column name, press the <strong>Show Northwind ERD</strong> button. It's above every editor and on every quiz question:</p>
<p data-intro-erd></p>
<p>It opens a diagram of every table and how they link. Select a table to see its columns, then press <kbd>Esc</kbd> or <strong>Close</strong> to carry on where you were. In a quiz, your answers and the timer are kept while it's open.</p>

<h2 class="dot">Which SQL this uses</h2>
<p>The lessons use <strong>SQLite</strong>, which runs here in your browser. SQL comes in several flavours, and where MySQL or T-SQL write something differently, the lessons show all three, marked with these icons:</p>
<div class="focus-note" data-testid="intro-focus"><b>Focus on your trainer's flavour.</b> This course shows you three flavours of SQL, but you don't need to learn all three. Concentrate on the one your trainer has asked you to use: it's the one you'll use on your course and for the capstone project. Where the dialects differ, read the line for yours and just skim the others.</div>
<ul class="dialect-legend">
  <li><span class="ddiff-tag sqlite"><span aria-hidden="true">🪶</span> SQLite</span> runs here. This is the version to practise.</li>
  <li><span class="ddiff-tag mysql"><span aria-hidden="true">🐬</span> MySQL</span> for comparison: you'd run it in MySQL Workbench.</li>
  <li><span class="ddiff-tag tsql"><span aria-hidden="true">🪟</span> T-SQL</span> for comparison: you'd run it in SQL Server Management Studio.</li>
</ul>
<p>If you type MySQL or T-SQL out of habit, such as <code>TOP 10</code> or <code>YEAR(OrderDate)</code>, you'll get a message showing the SQLite way.</p>

<section class="install-callout" data-testid="intro-install">
  <h2>Practising on your own computer</h2>
  <p>You don't need to install anything for the lessons. You <strong>will</strong> need SQL on your own computer for the <a href="#/lesson/capstone">capstone project</a> at the end, and it's good practice for using SQL at work. There are step-by-step guides for Windows and Mac:</p>
  <ul class="plain"><li><strong>🪟 SQL Server</strong> (T-SQL), with Docker and VS Code, or SSMS on Windows</li><li><strong>🐬 MySQL</strong> with MySQL Workbench, or in Docker</li><li><strong>🪶 SQLite</strong> with DB Browser for SQLite: the quickest, using the same Northwind as this site</li></ul>
  <p><a class="btn primary" href="#/install" data-testid="intro-install-link">Install on your computer</a></p>
</section>

<h2 class="dot">Your progress</h2>
<p>Your solved exercises, your drafts, the tables you build and your quiz scores are saved in <strong>this browser on this device</strong>. Nothing is sent anywhere. Another browser, or a private window, starts fresh. <strong>Reset my progress</strong> at the bottom of the learning path clears everything.</p>
`;
