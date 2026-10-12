/* ---------- SQL flavours ----------
   DIALECTS feeds the comparison on the "SQL flavours" lesson and the "SQL dialects" page.
   Each row: group, task, mysql, tsql, lab (HTML; use K() for code) and optionally try (runnable SQL for the lab tab). */
const K = s => `<code>${esc(s)}</code>`;

const DIALECT_INFO = {
  mysql:{name:'MySQL', who:'Open source, owned by Oracle. Very common behind websites and web apps.', tool:'MySQL Workbench'},
  tsql:{name:'T-SQL', who:'Transact-SQL: Microsoft\'s dialect, used by SQL Server and Azure SQL.', tool:'SQL Server Management Studio (SSMS)'},
  lab:{name:'This lab (SQLite)', who:'SQLite, a small database engine built into phones, apps and browsers. Here it runs inside your browser, so there\'s nothing to install.', tool:'This website'}
};

const DIALECTS = [
  {group:'Returning rows', task:'Return the first 10 rows', mysql:K('SELECT … LIMIT 10'), tsql:K('SELECT TOP 10 …'), lab:'Both. '+K('TOP')+' is translated to '+K('LIMIT')+'.', try:'SELECT TOP 5 ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;'},
  {group:'Returning rows', task:'Skip rows (paging)', mysql:K('LIMIT 10 OFFSET 20'), tsql:K('ORDER BY … OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY'), lab:'The MySQL form: '+K('LIMIT 10 OFFSET 20'), try:'SELECT ProductName\nFROM Products\nORDER BY ProductName\nLIMIT 5 OFFSET 10;'},

  {group:'Wildcards and patterns', task:'Any number of characters', mysql:K("LIKE 'Ch%'"), tsql:K("LIKE 'Ch%'"), lab:K("LIKE 'Ch%'")+': the same everywhere', try:"SELECT ProductName\nFROM Products\nWHERE ProductName LIKE 'Ch%';"},
  {group:'Wildcards and patterns', task:'Exactly one character', mysql:K("LIKE '_A'"), tsql:K("LIKE '_A'"), lab:K("LIKE '_A'")+': the same everywhere', try:"SELECT CompanyName, Region\nFROM Customers\nWHERE Region LIKE '_A';"},
  {group:'Wildcards and patterns', task:'One character from a set', mysql:K("REGEXP '^[BS]'"), tsql:K("LIKE '[BS]%'"), lab:K("REGEXP '^[BS]'")+'. T-SQL\'s '+K('[ ]')+' inside LIKE isn\'t supported.', try:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName REGEXP '^[BS]';"},
  {group:'Wildcards and patterns', task:'Any character not in a set', mysql:K("REGEXP '^[^BS]'"), tsql:K("LIKE '[^BS]%'"), lab:K("REGEXP '^[^BS]'"), try:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName REGEXP '^[^BS]';"},
  {group:'Wildcards and patterns', task:'Regular expressions', mysql:K('REGEXP')+' (or '+K('RLIKE')+')', tsql:'None: only '+K('LIKE')+' patterns', lab:K('REGEXP')},
  {group:'Wildcards and patterns', task:'Upper and lower case', mysql:'Ignored by the default collation', tsql:'Ignored by the default collation', lab:'Ignored in Northwind, like MySQL', try:"SELECT COUNT(*)\nFROM Employees\nWHERE City = 'london';"},

  {group:'Names and values', task:'Table names with spaces', mysql:K('`Order Details`'), tsql:K('[Order Details]'), lab:'Both', try:'SELECT *\nFROM [Order Details]\nLIMIT 3;'},
  {group:'Names and values', task:'An apostrophe in text', mysql:K("'Sir Rodney''s'")+' or '+K("'Sir Rodney\\'s'"), tsql:K("'Sir Rodney''s'"), lab:K("'Sir Rodney''s'"), try:"SELECT ProductName\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Scones';"},
  {group:'Names and values', task:'True and false', mysql:K('BOOLEAN')+', '+K('TRUE')+' / '+K('FALSE'), tsql:K('BIT')+', '+K('1')+' / '+K('0'), lab:'Both'},
  {group:'Names and values', task:'Auto-numbered IDs', mysql:K('AUTO_INCREMENT'), tsql:K('IDENTITY(1,1)'), lab:'Both, translated to '+K('AUTOINCREMENT')},

  {group:'Functions', task:'Join text', mysql:K('CONCAT(a, b)'), tsql:K('CONCAT(a, b)')+' or '+K('a + b'), lab:K('CONCAT(a, b)')+' or '+K('a || b'), try:"SELECT CONCAT(FirstName, ' ', LastName) AS 'Name'\nFROM Employees;"},
  {group:'Functions', task:'Length of text', mysql:K('LENGTH(s)'), tsql:K('LEN(s)'), lab:'Both', try:'SELECT ProductName, LENGTH(ProductName), LEN(ProductName)\nFROM Products;'},
  {group:'Functions', task:'Find text inside text', mysql:K("LOCATE(' ', s)"), tsql:K("CHARINDEX(' ', s)"), lab:'Both', try:"SELECT PostalCode, LOCATE(' ', PostalCode), CHARINDEX(' ', PostalCode)\nFROM Customers\nWHERE Country = 'UK';"},
  {group:'Functions', task:'Today\'s date', mysql:K('NOW()')+', '+K('CURDATE()'), tsql:K('GETDATE()'), lab:'All three', try:'SELECT NOW(), CURDATE(), GETDATE();'},
  {group:'Functions', task:'Days between two dates', mysql:K('DATEDIFF(end, start)'), tsql:K('DATEDIFF(day, start, end)'), lab:'Both', try:'SELECT OrderID,\n       DATEDIFF(ShippedDate, OrderDate)      AS MySQL_style,\n       DATEDIFF(day, OrderDate, ShippedDate) AS TSQL_style\nFROM Orders;'},
  {group:'Functions', task:'Add to a date', mysql:K('DATE_ADD(d, INTERVAL 5 DAY)'), tsql:K('DATEADD(day, 5, d)'), lab:'Both', try:'SELECT OrderDate,\n       DATE_ADD(OrderDate, INTERVAL 5 DAY) AS MySQL_style,\n       DATEADD(day, 5, OrderDate)          AS TSQL_style\nFROM Orders;'},
  {group:'Functions', task:'Format a date', mysql:K("DATE_FORMAT(d, '%d/%m/%Y')"), tsql:K("FORMAT(d, 'dd/MM/yyyy')"), lab:'The MySQL form: '+K('DATE_FORMAT'), try:"SELECT DATE_FORMAT(OrderDate, '%d/%m/%Y')\nFROM Orders;"},
  {group:'Functions', task:'Replace NULL with a value', mysql:K('IFNULL(x, y)')+' or '+K('COALESCE(x, y)'), tsql:K('ISNULL(x, y)')+' or '+K('COALESCE(x, y)'), lab:K('IFNULL')+' or '+K('COALESCE'), try:"SELECT CompanyName, COALESCE(Region, 'No region')\nFROM Customers;"},

  {group:'Tables and procedures', task:'Save a query as a new table', mysql:K('CREATE TABLE t AS SELECT …'), tsql:K('SELECT … INTO t FROM …'), lab:'Both'},
  {group:'Tables and procedures', task:'Temporary tables', mysql:K('CREATE TEMPORARY TABLE t …'), tsql:K('#t')+' (or '+K('##t')+' for global)', lab:'Both, until you reload the page', try:'SELECT CategoryID INTO #Cats FROM Categories;\nSELECT * FROM #Cats;'},
  {group:'Tables and procedures', task:'List the tables', mysql:K('SHOW TABLES'), tsql:K('SELECT name FROM sys.tables'), lab:K('SHOW TABLES'), try:'SHOW TABLES;'},
  {group:'Tables and procedures', task:'Describe a table', mysql:K('DESCRIBE t'), tsql:K("EXEC sp_help 't'"), lab:K('DESCRIBE t'), try:'DESCRIBE Products;'},
  {group:'Tables and procedures', task:'Stored procedures', mysql:K('CREATE PROCEDURE')+' with '+K('DELIMITER')+'; run with '+K('CALL'), tsql:K('CREATE PROCEDURE … AS')+'; run with '+K('EXEC'), lab:'Not available: practise in Workbench or SSMS'},

  {group:'Advanced', task:'Window functions', mysql:'MySQL 8 and later', tsql:'SQL Server 2012 and later', lab:'Yes', try:'SELECT ProductName, UnitPrice,\n       RANK() OVER (ORDER BY UnitPrice DESC) AS PriceRank\nFROM Products;'},
  {group:'Advanced', task:'Percentiles', mysql:'Not available', tsql:K('PERCENTILE_CONT')+', '+K('PERCENTILE_DISC'), lab:'Not available; use '+K('CUME_DIST')},
  {group:'Advanced', task:'Pivot and unpivot', mysql:K('CASE')+' with '+K('GROUP BY')+'; '+K('UNION ALL'), tsql:K('PIVOT')+' / '+K('UNPIVOT'), lab:'The MySQL way'},
  {group:'Advanced', task:'See the query plan', mysql:K('EXPLAIN SELECT …'), tsql:'Execution plan in SSMS', lab:K('EXPLAIN SELECT …'), try:"EXPLAIN SELECT * FROM Customers WHERE City = 'London';"}
];

const FLAVOURS_LEARN = `
<p class="lede">SQL is one language with several <strong>flavours</strong>, called dialects. The core is the same everywhere; the details depend on which database you're using.</p>
<p>SQL is an international standard (ISO/ANSI). Each database product implements that standard, then adds its own extras: extra functions, its own way of limiting rows, its own procedural code. A query you write for one database will usually run on another, but not always.</p>
<div class="flavour-cards">
  <div class="flavour"><b>MySQL</b><span>Open source, owned by Oracle. Very common behind websites. You'll use it in MySQL Workbench.</span></div>
  <div class="flavour"><b>T-SQL</b><span>Transact-SQL, Microsoft's dialect for SQL Server and Azure SQL. You'll use it in SSMS.</span></div>
  <div class="flavour"><b>PostgreSQL</b><span>Open source and feature-rich, popular for newer applications.</span></div>
  <div class="flavour"><b>Oracle (PL/SQL)</b><span>Oracle Database's dialect, common in large organisations.</span></div>
  <div class="flavour"><b>SQLite</b><span>A tiny engine built into phones, apps and browsers. <strong>This lab runs it.</strong></span></div>
</div>
<div class="two-col">
  <div><h3>The same everywhere</h3><ul class="plain"><li><code>SELECT</code>, <code>FROM</code>, <code>WHERE</code></li><li><code>JOIN</code>, <code>GROUP BY</code>, <code>HAVING</code>, <code>ORDER BY</code></li><li><code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code></li><li>The <code>%</code> and <code>_</code> wildcards</li><li><code>CASE</code>, subqueries and <code>WITH</code></li></ul></div>
  <div><h3>Different between dialects</h3><ul class="plain"><li>Returning the first few rows (<code>LIMIT</code> or <code>TOP</code>)</li><li>Matching a set of characters (<code>REGEXP</code> or <code>LIKE '[…]'</code>)</li><li>Date and text function names</li><li>Auto-numbered IDs, booleans, temporary tables</li><li>Stored procedures and other procedural code</li></ul></div>
</div>
<h3>Which SQL does this lab use?</h3>
<p>The course teaches <strong>MySQL</strong> and <strong>T-SQL</strong>. This lab runs <strong>SQLite</strong> in your browser, so there's nothing to install, and it accepts the MySQL and T-SQL syntax from the course notes. When it has to translate something (for example <code>TOP 10</code> into <code>LIMIT 10</code>), a note under your results tells you. When something only works in one dialect, the lessons label it.</p>
<p>The table below compares the three. Use the tabs to see one dialect at a time; on the <strong>This lab</strong> tab, <strong>Try it</strong> opens an example in Free practice. The same table is always available from <strong>SQL dialects</strong> in the header.</p>`;

const FLAVOURS_CHECK = [
  {q:'Which of these works the same in MySQL, T-SQL and this lab?', a:['SELECT … FROM … WHERE …','SELECT TOP 10 …','LIKE \'[BS]%\''], c:0, why:'The core of SELECT, FROM and WHERE is part of the standard. TOP is T-SQL only, and so is LIKE with [ ].'},
  {q:'You\'re using MySQL. How do you return only the first 10 rows?', a:['SELECT TOP 10 …','… LIMIT 10','… FETCH 10'], c:1, why:'MySQL puts LIMIT at the end. TOP is the T-SQL way.'},
  {q:'In T-SQL you\'d write WHERE CategoryName LIKE \'[BS]%\'. What does MySQL use instead?', a:['WHERE CategoryName LIKE \'B%S%\'','WHERE CategoryName IN (\'B\', \'S\')','WHERE CategoryName REGEXP \'^[BS]\''], c:2, why:'MySQL\'s LIKE has no [ ] character sets, so it uses a regular expression: ^ means "starts with" and [BS] means B or S.'}
];
