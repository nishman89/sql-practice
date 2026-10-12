/* ---------- SQL flavours ----------
   DIALECTS feeds the comparison on the "SQL flavours" lesson and the "SQL dialects" page.
   Each row: group, task, mysql, tsql, lab (the SQLite column; HTML, use K() for code) and optionally try (runnable SQLite for the SQLite tab). */
const K = s => `<code>${esc(s)}</code>`;

const DIALECT_INFO = {
  mysql:{name:'MySQL', who:'Open source, owned by Oracle. Very common behind websites and web apps.', tool:'MySQL Workbench'},
  tsql:{name:'T-SQL', who:'Transact-SQL: Microsoft\'s dialect, used by SQL Server and Azure SQL.', tool:'SQL Server Management Studio (SSMS)'},
  lab:{name:'This dialect: SQLite', who:'SQLite, a small database engine built into phones, apps and browsers. It\'s the dialect this course uses, and it runs right here in your browser.', tool:'This website'}
};

const DIALECTS = [
  {group:'Returning rows', task:'Return the first 10 rows', mysql:K('SELECT … LIMIT 10'), tsql:K('SELECT TOP 10 …'), lab:K('SELECT … LIMIT 10'), try:'SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC\nLIMIT 5;'},
  {group:'Returning rows', task:'Skip rows (paging)', mysql:K('LIMIT 10 OFFSET 20'), tsql:K('ORDER BY … OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY'), lab:K('LIMIT 10 OFFSET 20'), try:'SELECT ProductName\nFROM Products\nORDER BY ProductName\nLIMIT 5 OFFSET 10;'},

  {group:'Wildcards and patterns', task:'Any number of characters', mysql:K("LIKE 'Ch%'"), tsql:K("LIKE 'Ch%'"), lab:K("LIKE 'Ch%'")+', or '+K("GLOB 'Ch*'"), try:"SELECT ProductName\nFROM Products\nWHERE ProductName LIKE 'Ch%';"},
  {group:'Wildcards and patterns', task:'Exactly one character', mysql:K("LIKE '_A'"), tsql:K("LIKE '_A'"), lab:K("LIKE '_A'")+', or '+K("GLOB '?A'"), try:"SELECT CompanyName, Region\nFROM Customers\nWHERE Region LIKE '_A';"},
  {group:'Wildcards and patterns', task:'One character from a set', mysql:K("REGEXP '^[BS]'"), tsql:K("LIKE '[BS]%'"), lab:K("GLOB '[BS]*'"), try:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName GLOB '[BS]*';"},
  {group:'Wildcards and patterns', task:'Any character not in a set', mysql:K("REGEXP '^[^BS]'"), tsql:K("LIKE '[^BS]%'"), lab:K("GLOB '[^BS]*'"), try:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName GLOB '[^BS]*';"},
  {group:'Wildcards and patterns', task:'Regular expressions', mysql:K('REGEXP')+' (or '+K('RLIKE')+')', tsql:'None: only '+K('LIKE')+' patterns', lab:'None built in: use '+K('LIKE')+' or '+K('GLOB')},
  {group:'Wildcards and patterns', task:'Upper and lower case', mysql:'Ignored by the default collation', tsql:'Ignored by the default collation', lab:K('LIKE')+' ignores case; '+K('=')+' and '+K('GLOB')+' don\'t, unless the column is '+K('COLLATE NOCASE')+' (Northwind\'s are)', try:"SELECT COUNT(*)\nFROM Employees\nWHERE City = 'london';"},

  {group:'Names and values', task:'Table names with spaces', mysql:K('`Order Details`'), tsql:K('[Order Details]'), lab:K('"Order Details"'), try:'SELECT *\nFROM "Order Details"\nLIMIT 3;'},
  {group:'Names and values', task:'An apostrophe in text', mysql:K("'Sir Rodney''s'")+' or '+K("'Sir Rodney\\'s'"), tsql:K("'Sir Rodney''s'"), lab:K("'Sir Rodney''s'"), try:"SELECT ProductName\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Scones';"},
  {group:'Names and values', task:'True and false', mysql:K('BOOLEAN')+', '+K('TRUE')+' / '+K('FALSE'), tsql:K('BIT')+', '+K('1')+' / '+K('0'), lab:K('INTEGER')+' '+K('1')+' / '+K('0')+' ('+K('TRUE')+' and '+K('FALSE')+' also work)'},
  {group:'Names and values', task:'Column types', mysql:K('INT')+', '+K('DECIMAL')+', '+K('VARCHAR(n)')+', '+K('DATE')+' and many more', tsql:K('INT')+', '+K('DECIMAL')+', '+K('NVARCHAR(n)')+', '+K('DATE')+' and many more', lab:K('INTEGER')+', '+K('REAL')+', '+K('TEXT')+', '+K('BLOB')+'; dates are '+K('TEXT'), try:"PRAGMA table_info('Orders');"},
  {group:'Names and values', task:'Auto-numbered IDs', mysql:K('AUTO_INCREMENT'), tsql:K('IDENTITY(1,1)'), lab:K('INTEGER PRIMARY KEY AUTOINCREMENT')},

  {group:'Functions', task:'Join text', mysql:K('CONCAT(a, b)'), tsql:K('CONCAT(a, b)')+' or '+K('a + b'), lab:K('CONCAT(a, b)')+' or '+K('a || b'), try:"SELECT FirstName || ' ' || LastName AS 'Name'\nFROM Employees;"},
  {group:'Functions', task:'Length of text', mysql:K('LENGTH(s)'), tsql:K('LEN(s)'), lab:K('length(s)'), try:'SELECT ProductName, length(ProductName)\nFROM Products;'},
  {group:'Functions', task:'Find text inside text', mysql:K("LOCATE(' ', s)"), tsql:K("CHARINDEX(' ', s)"), lab:K("instr(s, ' ')"), try:"SELECT PostalCode, instr(PostalCode, ' ')\nFROM Customers\nWHERE Country = 'UK';"},
  {group:'Functions', task:'First or last characters', mysql:K('LEFT(s, 3)')+', '+K('RIGHT(s, 3)'), tsql:K('LEFT(s, 3)')+', '+K('RIGHT(s, 3)'), lab:K('substr(s, 1, 3)')+', '+K('substr(s, -3)'), try:'SELECT CompanyName, substr(CompanyName, 1, 3), substr(CompanyName, -3)\nFROM Customers;'},
  {group:'Functions', task:'Today\'s date', mysql:K('NOW()')+', '+K('CURDATE()'), tsql:K('GETDATE()'), lab:K("datetime('now')")+', '+K("date('now')"), try:"SELECT datetime('now'), date('now');"},
  {group:'Functions', task:'Part of a date', mysql:K('YEAR(d)')+', '+K('MONTH(d)'), tsql:K('YEAR(d)')+', '+K('MONTH(d)'), lab:K("strftime('%Y', d)")+', '+K("strftime('%m', d)"), try:"SELECT OrderDate, strftime('%Y', OrderDate), strftime('%m', OrderDate)\nFROM Orders;"},
  {group:'Functions', task:'Days between two dates', mysql:K('DATEDIFF(end, start)'), tsql:K('DATEDIFF(day, start, end)'), lab:K('julianday(end) - julianday(start)'), try:'SELECT OrderID, julianday(ShippedDate) - julianday(OrderDate) AS ShipDays\nFROM Orders;'},
  {group:'Functions', task:'Add to a date', mysql:K('DATE_ADD(d, INTERVAL 5 DAY)'), tsql:K('DATEADD(day, 5, d)'), lab:K("date(d, '+5 days')"), try:"SELECT OrderDate, date(OrderDate, '+5 days') AS DueDate\nFROM Orders;"},
  {group:'Functions', task:'Format a date', mysql:K("DATE_FORMAT(d, '%d/%m/%Y')"), tsql:K("FORMAT(d, 'dd/MM/yyyy')"), lab:K("strftime('%d/%m/%Y', d)"), try:"SELECT strftime('%d/%m/%Y', OrderDate)\nFROM Orders;"},
  {group:'Functions', task:'Replace NULL with a value', mysql:K('IFNULL(x, y)')+' or '+K('COALESCE(x, y)'), tsql:K('ISNULL(x, y)')+' or '+K('COALESCE(x, y)'), lab:K('IFNULL(x, y)')+' or '+K('COALESCE(x, y)'), try:"SELECT CompanyName, COALESCE(Region, 'No region')\nFROM Customers;"},

  {group:'Tables and procedures', task:'Save a query as a new table', mysql:K('CREATE TABLE t AS SELECT …'), tsql:K('SELECT … INTO t FROM …'), lab:K('CREATE TABLE t AS SELECT …')},
  {group:'Tables and procedures', task:'Temporary tables', mysql:K('CREATE TEMPORARY TABLE t …'), tsql:K('#t')+' (or '+K('##t')+' for global)', lab:K('CREATE TEMP TABLE t AS SELECT …'), try:'DROP TABLE IF EXISTS Cats;\nCREATE TEMP TABLE Cats AS SELECT CategoryID, CategoryName FROM Categories;\nSELECT * FROM Cats;'},
  {group:'Tables and procedures', task:'Add columns', mysql:K('ALTER TABLE t ADD a INT, ADD b INT'), tsql:K('ALTER TABLE t ADD a INT, b INT'), lab:'One per statement: '+K('ALTER TABLE t ADD COLUMN a INTEGER')},
  {group:'Tables and procedures', task:'List the tables', mysql:K('SHOW TABLES'), tsql:K('SELECT name FROM sys.tables'), lab:K("SELECT name FROM sqlite_master WHERE type = 'table'"), try:"SELECT name FROM sqlite_master WHERE type = 'table';"},
  {group:'Tables and procedures', task:'Describe a table', mysql:K('DESCRIBE t'), tsql:K("EXEC sp_help 't'"), lab:K("PRAGMA table_info('t')"), try:"PRAGMA table_info('Products');"},
  {group:'Tables and procedures', task:'Databases', mysql:K('CREATE DATABASE')+', '+K('USE'), tsql:K('CREATE DATABASE')+', '+K('USE'), lab:'One database per file, so neither is needed'},
  {group:'Tables and procedures', task:'Stored procedures', mysql:K('CREATE PROCEDURE')+' with '+K('DELIMITER')+'; run with '+K('CALL'), tsql:K('CREATE PROCEDURE … AS')+'; run with '+K('EXEC'), lab:'None: save reusable queries as views'},

  {group:'Advanced', task:'Window functions', mysql:'MySQL 8 and later', tsql:'SQL Server 2012 and later', lab:'SQLite 3.25 and later', try:'SELECT ProductName, UnitPrice,\n       RANK() OVER (ORDER BY UnitPrice DESC) AS PriceRank\nFROM Products;'},
  {group:'Advanced', task:'Percentiles', mysql:'None', tsql:K('PERCENTILE_CONT')+', '+K('PERCENTILE_DISC'), lab:'None: use '+K('CUME_DIST()')},
  {group:'Advanced', task:'Pivot and unpivot', mysql:K('CASE')+' with '+K('GROUP BY')+'; '+K('UNION ALL'), tsql:K('PIVOT')+' / '+K('UNPIVOT'), lab:K('CASE')+' with '+K('GROUP BY')+'; '+K('UNION ALL')},
  {group:'Advanced', task:'See the query plan', mysql:K('EXPLAIN SELECT …'), tsql:'Execution plan in SSMS', lab:K('EXPLAIN QUERY PLAN SELECT …'), try:"EXPLAIN QUERY PLAN SELECT * FROM Customers WHERE City = 'London';"},
  {group:'Advanced', task:'List indexes', mysql:K('SHOW INDEX FROM t'), tsql:K("EXEC sp_helpindex 't'"), lab:K("PRAGMA index_list('t')"), try:"PRAGMA index_list('Customers');"}
];

const FLAVOURS_LEARN = `
<p class="lede">SQL is one language with several <strong>flavours</strong>, called dialects. The core is the same everywhere; the details depend on which database you're using.</p>
<p>SQL is an international standard (ISO/ANSI). Each database product implements that standard, then adds its own extras: extra functions, its own way of limiting rows, its own procedural code. A query you write for one database will usually run on another, but not always.</p>
<h3>Three flavours you'll meet</h3>
<div class="flavour-cards">
  <div class="flavour"><b>MySQL</b><span>Open source, owned by Oracle. Very common behind websites. Used with MySQL Workbench.</span></div>
  <div class="flavour"><b>T-SQL</b><span>Transact-SQL, Microsoft's dialect for SQL Server and Azure SQL. Used with SSMS.</span></div>
  <div class="flavour this"><b>SQLite</b><span>A small engine built into phones, apps and browsers. <strong>This course uses SQLite</strong>, and it runs right here.</span></div>
</div>
<p>There are others, too: PostgreSQL is popular for newer applications, and Oracle Database has its own dialect, PL/SQL. Once you know one flavour well, picking up another is mostly a matter of looking up the differences.</p>
<div class="two-col">
  <div><h3>The same everywhere</h3><ul class="plain"><li><code>SELECT</code>, <code>FROM</code>, <code>WHERE</code></li><li><code>JOIN</code>, <code>GROUP BY</code>, <code>HAVING</code>, <code>ORDER BY</code></li><li><code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code></li><li>The <code>%</code> and <code>_</code> wildcards</li><li><code>CASE</code>, subqueries and <code>WITH</code></li></ul></div>
  <div><h3>Different between dialects</h3><ul class="plain"><li>Returning the first few rows (<code>LIMIT</code> or <code>TOP</code>)</li><li>Matching a set of characters</li><li>Date and text function names</li><li>Column types, auto-numbered IDs and temporary tables</li><li>Stored procedures and other procedural code</li></ul></div>
</div>
<h3>This course uses SQLite</h3>
<p>Every lesson, example, exercise and quiz is written in SQLite, and everything runs in your browser, so there's nothing to install. If you type MySQL or T-SQL out of habit, such as <code>TOP 10</code> or <code>YEAR(OrderDate)</code>, you'll get a message showing the SQLite way to write it.</p>
<p>The table below compares MySQL, T-SQL and SQLite. Use the tabs to see one dialect at a time; on the <strong>This dialect: SQLite</strong> tab, <strong>Try it</strong> opens an example in Free practice. The same table is always available from <strong>SQL dialects</strong> in the header.</p>`;

const FLAVOURS_CHECK = [
  {q:'Which of these works the same in MySQL, T-SQL and SQLite?', a:['SELECT … FROM … WHERE …','SELECT TOP 10 …','LIKE \'[BS]%\''], c:0, why:'The core of SELECT, FROM and WHERE is part of the standard. TOP is T-SQL only, and so is LIKE with [ ].'},
  {q:'You\'re using SQLite. How do you return only the first 10 rows?', a:['SELECT TOP 10 …','… LIMIT 10','… FETCH 10'], c:1, why:'SQLite, like MySQL, puts LIMIT at the end. TOP is the T-SQL way.'},
  {q:'In T-SQL you\'d write WHERE CategoryName LIKE \'[BS]%\'. What does SQLite use instead?', a:['WHERE CategoryName LIKE \'B%S%\'','WHERE CategoryName IN (\'B\', \'S\')','WHERE CategoryName GLOB \'[BS]*\''], c:2, why:'SQLite\'s LIKE has no [ ] character sets, but GLOB does. In GLOB, * means any characters.'}
];
