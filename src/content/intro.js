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
<p>Every column has a <strong>data type</strong>, which decides what it can hold:</p>
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
<tr><td>Data definition (DDL)</td><td><code>CREATE</code>, <code>ALTER</code>, <code>DROP</code></td><td>Build and change the structure: tables, columns, keys</td></tr>
<tr><td>Data manipulation (DML)</td><td><code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td><td>Read and change the data itself</td></tr></table>
<p>The four things you do with data are often called <strong>CRUD</strong>: Create (<code>INSERT</code>), Read (<code>SELECT</code>), Update (<code>UPDATE</code>) and Delete (<code>DELETE</code>). Most of this course is about reading data with <code>SELECT</code>.</p>`;

const DATABASES_CHECK = [
  {q:'What is a DBMS?', a:['The data stored in a database','Software that stores, manages and protects a database','A diagram of a database\'s tables'], c:1, why:'MySQL, SQL Server and SQLite are DBMSs. The database is the data they manage; a diagram of the tables is an ERD.'},
  {q:'In the Customers table, what is one row?', a:['Every customer\'s City','The whole table','One customer, with all of their details'], c:2, why:'A row (record) is one item: one customer. A column (field) is one fact about every customer, such as City.'},
  {q:'Which SQL statement reads data without changing it?', a:['SELECT','UPDATE','INSERT'], c:0, why:'SELECT reads. INSERT, UPDATE and DELETE change the data, and CREATE, ALTER and DROP change the structure.'}
];
