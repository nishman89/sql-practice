/* ---------- Learning path content ---------- */
/* C(sql) is a runnable example. C(sql, false) is read-only; pass a label to say why (default: tables not in Northwind). */
const C = (sql, run=true, label) => `<pre class="ex"${run?'':' data-norun'}${label?` data-label="${esc(label)}"`:''}>${esc(sql)}</pre>`;
const TSQL_ONLY = 'T-SQL only: read it, but it won\'t run here';
const MYSQL_ONLY = 'MySQL only: read it, but it won\'t run here';
const TIP = t => `<div class="tip">${t}</div>`;

const UNITS = [
  {id:'u1', title:'Foundations', blurb:'Learn what a database is, meet the flavours of SQL, read a database diagram, build tables yourself, then meet the Northwind data you\'ll query.', lessons:['databases','flavours','erd','build','map']},
  {id:'u2', title:'Querying one table', blurb:'Choose the columns and rows you need, then sort, trim, search and calculate.', lessons:['select','operators','sorting','distinct','wildcards','concat','arithmetic','cp1']},
  {id:'u3', title:'Summarising data', blurb:'Turn hundreds of rows into totals, averages and counts, and deal with missing values.', lessons:['aggregates','groupby','having','nulls','cp2']},
  {id:'u4', title:'Combining tables', blurb:'Use the keys from the ERD to pull data from several tables at once.', lessons:['innerjoin','leftjoin','multijoin','cp3']},
  {id:'u5', title:'Subqueries', blurb:'Feed the result of one query into another.', lessons:['subwhere','subfrom','exists','cp4']},
  {id:'u6', title:'Going further', blurb:'Conditional logic, dates and text, and saving queries as views.', lessons:['case','datesstrings','views']},
  {id:'u7', title:'Advanced topics', blurb:'Window functions, statistics, WITH, temporary tables, pivoting and making queries fast.', lessons:['windows','ranking','leadlag','frames','stats','cte','temptables','pivot','performance','cp5']}
];

const LESSONS = {
  databases:{title:'What\'s a database', summary:'Databases, DBMSs, tables, rows, columns and keys, and what SQL is for.', kind:'databases'},
  flavours:{title:'SQL flavours', summary:'One language, several dialects: MySQL, T-SQL and the one this lab runs.', kind:'flavours'},
  erd:{title:'What\'s an ERD', summary:'Read a database diagram: tables, keys and relationships.', kind:'erd'},
  build:{title:'Create tables and connect them', summary:'Build two linked tables and watch the ERD draw itself.', kind:'build'},
  map:{title:'Meet Northwind', summary:'Explore the sample database every exercise from here on uses.', kind:'map'},

  /* ===== Unit 2 ===== */
  select:{title:'SELECT and WHERE', summary:'Pick columns with SELECT and filter rows with WHERE.',
    learn:`
<p>Every query answers two questions: which table, and which columns? <code>FROM</code> names the table and <code>SELECT</code> lists the columns. <code>*</code> means every column. It's handy for exploring, but in real code you should name the columns you need.</p>
${C('SELECT * FROM Customers;')}
${C('SELECT CompanyName, City, Country\nFROM Customers;')}
<p><code>WHERE</code> keeps only the rows that match a condition. Text values go in single quotes; numbers don't.</p>
${C("SELECT CompanyName, City\nFROM Customers\nWHERE City = 'Paris';")}
${C('SELECT ProductName, UnitsInStock\nFROM Products\nWHERE UnitsInStock > 100;')}
${TIP('<code>SELECT</code> filters <strong>columns</strong>. <code>WHERE</code> filters <strong>rows</strong>. They work independently.')}
<p>To count the matching rows, use <code>COUNT(*)</code>. <code>AS</code> gives the result column a readable name, called an alias.</p>
${C("SELECT COUNT(*) AS 'Number of Customers'\nFROM Customers\nWHERE City = 'Paris';")}
<h3>When to use quotes</h3>
<table class="mini"><tr><th>Data type</th><th>Quotes?</th></tr><tr><td><code>CHAR</code>, <code>VARCHAR</code>, <code>DATE</code>, <code>DATETIME</code></td><td>Yes: <code>'London'</code>, <code>'1997-01-01'</code></td></tr><tr><td><code>INT</code>, <code>DECIMAL</code>, <code>BIT</code></td><td>No: <code>5</code>, <code>29.99</code>, <code>1</code></td></tr></table>
<h3>Apostrophes inside text</h3>
<p>A single quote marks where text starts and ends, so a value that contains one needs it doubled: <code>''</code>.</p>
${C("SELECT ProductID, ProductName\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Scones';")}`,
    ex:[
      {p:'How many employees have a home city of London?', hint:'COUNT(*) with a WHERE clause on City. Text values go in single quotes.', sol:"SELECT COUNT(*)\nFROM Employees\nWHERE City = 'London';"},
      {p:'Which employee holds the title of Doctor? Return at least their first and last name.', hint:'Look at the TitleOfCourtesy column. Doctor is stored as Dr. with a full stop.', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE TitleOfCourtesy = 'Dr.';"},
      {p:'How many products are discontinued?', hint:'Discontinued is a BIT column: 1 means yes, 0 means no. No quotes needed.', sol:'SELECT COUNT(*)\nFROM Products\nWHERE Discontinued = 1;'},
      {p:'Show the ProductID and UnitPrice of Sir Rodney\'s Marmalade.', hint:"Double the apostrophe: 'Sir Rodney''s Marmalade'", sol:"SELECT ProductID, UnitPrice\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Marmalade';"}
    ]},

  operators:{title:'Operators: AND, OR, IN, BETWEEN', summary:'Combine conditions to ask more precise questions.',
    learn:`
<table class="mini"><tr><th>Operator</th><th>Meaning</th><th>Example</th></tr>
<tr><td><code>=</code> <code>&lt;&gt;</code></td><td>Equal, not equal</td><td><code>Country &lt;&gt; 'UK'</code></td></tr>
<tr><td><code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code></td><td>Comparisons</td><td><code>UnitPrice &gt;= 10</code></td></tr>
<tr><td><code>AND</code></td><td>Both must be true</td><td><code>City = 'London' AND Title = 'Sales Representative'</code></td></tr>
<tr><td><code>OR</code></td><td>Either can be true</td><td><code>City = 'London' OR City = 'Paris'</code></td></tr>
<tr><td><code>IN</code></td><td>Matches any value in a list</td><td><code>Region IN ('WA', 'SP')</code></td></tr>
<tr><td><code>BETWEEN</code></td><td>Inside a range, including both ends</td><td><code>UnitPrice BETWEEN 10 AND 20</code></td></tr>
<tr><td><code>NOT</code></td><td>Reverses a condition</td><td><code>Country NOT IN ('UK', 'USA')</code></td></tr></table>
${C('SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitsInStock > 0 AND UnitPrice > 29.99;')}
<p><code>IN</code> is shorthand for a chain of <code>OR</code>s on the same column. These two queries return the same rows:</p>
${C("SELECT CompanyName, Region FROM Customers\nWHERE Region = 'WA' OR Region = 'SP';")}
${C("SELECT CompanyName, Region FROM Customers\nWHERE Region IN ('WA', 'SP');")}
${TIP('If you write the same column name more than twice in a chain of <code>OR</code>s, use <code>IN</code> instead.')}
${C('SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice BETWEEN 10 AND 20;')}
<h3>Mixing AND with OR</h3>
<p><code>AND</code> is worked out before <code>OR</code>, like multiplication before addition. Use brackets to make your meaning clear:</p>
${C("SELECT CompanyName, Country, City\nFROM Customers\nWHERE (Country = 'UK' OR Country = 'France')\n  AND City <> 'London';")}`,
    ex:[
      {p:'How many orders are there in total for EmployeeIDs 5 and 7 combined?', hint:'IN (5, 7) is shorter than two OR conditions.', sol:'SELECT COUNT(OrderID)\nFROM Orders\nWHERE EmployeeID IN (5, 7);'},
      {p:'List the name and unit price of every product priced between 10 and 20, including both ends.', hint:'BETWEEN includes both boundary values.', sol:'SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice BETWEEN 10 AND 20;'},
      {p:'Which products are in stock and cost more than 50? Show the name, price and units in stock.', hint:'Two conditions joined with AND.', sol:'SELECT ProductName, UnitPrice, UnitsInStock\nFROM Products\nWHERE UnitsInStock > 0 AND UnitPrice > 50;'},
      {p:'How many customers are not based in the USA, the UK or Germany?', hint:"NOT IN ('USA', 'UK', 'Germany')", sol:"SELECT COUNT(*)\nFROM Customers\nWHERE Country NOT IN ('USA', 'UK', 'Germany');"},
      {p:'Find the employees who live in London and have the title Sales Representative. Show their first and last names.', hint:'City and Title, joined with AND.', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE City = 'London' AND Title = 'Sales Representative';"}
    ]},

  sorting:{title:'Sorting with ORDER BY', summary:'Control the order your results come back in.',
    learn:`
<p>Without <code>ORDER BY</code>, a database returns rows in no guaranteed order. Whenever order matters, say so.</p>
${C("SELECT CompanyName, ContactName\nFROM Customers\nWHERE Country = 'France'\nORDER BY CompanyName ASC;")}
<p><code>ASC</code> (A to Z, smallest first) is the default, so you can leave it out. <code>DESC</code> reverses it.</p>
${C('SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;')}
<p>Add more columns to break ties. Here customers are sorted by country, and alphabetically within each country:</p>
${C('SELECT Country, CompanyName\nFROM Customers\nORDER BY Country ASC, CompanyName ASC;')}
<h3>The order SQL runs in</h3>
<p>You write <code>SELECT</code> first, but the database runs it fifth:</p>
<ol class="order"><li><code>FROM</code></li><li><code>WHERE</code></li><li><code>GROUP BY</code></li><li><code>HAVING</code></li><li><code>SELECT</code></li><li><code>ORDER BY</code></li></ol>
<p>Because <code>ORDER BY</code> runs last, it can use an alias you created in <code>SELECT</code>:</p>
${C("SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nORDER BY `Stock Value` DESC;")}
${TIP('You can also write <code>ORDER BY 2</code> to sort by the second column, but avoid it. If someone reorders the columns later, it silently sorts the wrong one.')}`,
    ex:[
      {p:'List every product\'s name and unit price, most expensive first.', hint:'ORDER BY UnitPrice DESC', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;'},
      {p:'Show the City and CompanyName of every customer in Germany, sorted by city, then by company name.', hint:'Two columns in ORDER BY: the first sorts, the second breaks ties.', ordered:[0,1], sol:"SELECT City, CompanyName\nFROM Customers\nWHERE Country = 'Germany'\nORDER BY City, CompanyName;"},
      {p:'Show each employee\'s first name, last name and hire date, longest-serving first.', hint:'The earliest HireDate has served longest, so sort ascending.', ordered:[2], sol:'SELECT FirstName, LastName, HireDate\nFROM Employees\nORDER BY HireDate ASC;'}
    ]},

  distinct:{title:'DISTINCT and LIMIT', summary:'Remove duplicates and return only the top few rows.',
    learn:`
<p><code>DISTINCT</code> removes duplicate rows from your result. Many customers share a country, but each country appears once here:</p>
${C("SELECT DISTINCT Country\nFROM Customers\nWHERE ContactTitle = 'Owner';")}
${TIP('<code>DISTINCT</code> looks at all the selected columns together. A row is only a duplicate if <em>every</em> column matches, so more columns usually means fewer duplicates.')}
<p>Inside <code>COUNT</code>, it counts the different values:</p>
${C('SELECT COUNT(DISTINCT Country) AS \'Countries\'\nFROM Customers;')}
<h3>Returning only the first rows</h3>
<p>This is one of the biggest differences between MySQL and T-SQL. Both work in this lab.</p>
<p><strong>MySQL</strong> puts <code>LIMIT</code> at the end:</p>
${C("SELECT CompanyName, City\nFROM Customers\nWHERE Country = 'France'\nORDER BY CompanyName DESC\nLIMIT 3;")}
<p><strong>T-SQL</strong> puts <code>TOP</code> straight after <code>SELECT</code>:</p>
${C("SELECT TOP 3 CompanyName, City\nFROM Customers\nWHERE Country = 'France'\nORDER BY CompanyName DESC;")}
${TIP('<code>LIMIT</code> without <code>ORDER BY</code> gives you <em>some</em> rows, not the top ones. Sort first.')}`,
    ex:[
      {p:'List each country that has at least one supplier, once each.', hint:'SELECT DISTINCT Country FROM Suppliers', sol:'SELECT DISTINCT Country\nFROM Suppliers;'},
      {p:'How many different cities do employees live in?', hint:'COUNT(DISTINCT City)', sol:'SELECT COUNT(DISTINCT City)\nFROM Employees;'},
      {p:'Show the name and price of the five most expensive products, most expensive first.', hint:'ORDER BY UnitPrice DESC, then LIMIT 5 (or TOP 5).', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC\nLIMIT 5;'},
      {p:'Show each different combination of City and Country for customers in Brazil.', hint:'DISTINCT applies to both columns together.', sol:"SELECT DISTINCT City, Country\nFROM Customers\nWHERE Country = 'Brazil';"}
    ]},

  wildcards:{title:'Searching text with LIKE', summary:'Match patterns instead of exact values.',
    learn:`
<p><code>LIKE</code> compares text against a pattern. Two wildcards do the work:</p>
<table class="mini"><tr><th>Wildcard</th><th>Matches</th><th>Example</th></tr>
<tr><td><code>%</code></td><td>Any number of characters, including none</td><td><code>'Ch%'</code> matches Chai, Chang, Chartreuse verte</td></tr>
<tr><td><code>_</code></td><td>Exactly one character</td><td><code>'_A'</code> matches WA, CA, SA</td></tr></table>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName LIKE 'Ch%';")}
${C("SELECT CompanyName, Region\nFROM Customers\nWHERE Region LIKE '_A';")}
${C("SELECT ProductName\nFROM Products\nWHERE ProductName LIKE '%ale%';")}
<h3>More powerful patterns</h3>
<p>MySQL also has <code>REGEXP</code>, which uses regular expressions. This finds products starting with a vowel:</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName REGEXP '^[AEIOU]';")}
${TIP('T-SQL has no <code>REGEXP</code>. Instead it lets you use a character list inside <code>LIKE</code>: <code>LIKE \'[AEIOU]%\'</code>. That T-SQL form doesn\'t work in this lab, so use <code>REGEXP</code> or a few <code>OR</code>s here.')}`,
    ex:[
      {p:'Which categories have a category name beginning with B or S? Return the category name.', hint:"LIKE 'B%' OR LIKE 'S%'", sol:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName LIKE 'B%'\n   OR CategoryName LIKE 'S%';"},
      {p:'List the names of products that contain "choc" anywhere in their name.', hint:'Put % on both sides.', sol:"SELECT ProductName\nFROM Products\nWHERE ProductName LIKE '%choc%';"},
      {p:'Which customers have a company name whose second letter is "a"? Return CompanyName.', hint:'One _ for the first letter, then a, then %.', sol:"SELECT CompanyName\nFROM Customers\nWHERE CompanyName LIKE '_a%';"},
      {p:'List the products whose name starts with a vowel.', hint:"REGEXP '^[AEIOU]'", sol:"SELECT ProductName\nFROM Products\nWHERE ProductName REGEXP '^[AEIOU]';"}
    ]},

  concat:{title:'Joining text and naming columns', summary:'Build new text values with CONCAT and label them with AS.',
    learn:`
<p><code>CONCAT</code> joins values into one piece of text. Anything in quotes, such as <code>', '</code>, is added as written.</p>
${C("SELECT CompanyName AS 'Company Name',\n       CONCAT(City, ', ', Country) AS 'Location'\nFROM Customers;")}
<p>An alias (<code>AS</code>) is a temporary label for a column. It changes the column heading in your result, not anything in the database. Put it in quotes if it has spaces.</p>
${C("SELECT CONCAT(FirstName, ' ', LastName) AS 'Full Name', Title\nFROM Employees;")}
${TIP('Older T-SQL joins text with <code>+</code>: <code>FirstName + \' \' + LastName</code>. That doesn\'t work here, so use <code>CONCAT</code>, which works in MySQL, T-SQL and this lab.')}`,
    ex:[
      {p:'Join each employee\'s first name and last name, a colon and their home phone, like Nancy Davolio: (206) 555-9857. Alias the column Employee Name and Contact Number.', hint:"CONCAT(FirstName, ' ', LastName, ': ', HomePhone)", sol:"SELECT CONCAT(FirstName, ' ', LastName, ': ', HomePhone) AS 'Employee Name and Contact Number'\nFROM Employees;"},
      {p:'Label every supplier like Exotic Liquids (London, UK). Alias the column Supplier.', hint:"CONCAT(CompanyName, ' (', City, ', ', Country, ')')", sol:"SELECT CONCAT(CompanyName, ' (', City, ', ', Country, ')') AS 'Supplier'\nFROM Suppliers;"},
      {p:'For every customer, build a line like Maria Anders at Alfreds Futterkiste. Alias it Contact.', hint:"ContactName, then ' at ', then CompanyName.", sol:"SELECT CONCAT(ContactName, ' at ', CompanyName) AS 'Contact'\nFROM Customers;"}
    ]},

  arithmetic:{title:'Calculations', summary:'Do maths on your columns as the rows come back.',
    learn:`
<p>You can calculate in <code>SELECT</code> with <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code> and <code>%</code>. Always alias the result so the column has a readable name.</p>
${C("SELECT UnitPrice, Quantity, Discount,\n       UnitPrice * Quantity AS 'Gross Total'\nFROM `Order Details`;")}
${TIP('Table names with spaces need wrapping: <code>`Order Details`</code> in MySQL, <code>[Order Details]</code> in T-SQL. Both work here.')}
<p><code>%</code> (modulo) gives the remainder after dividing. Dividing by 2 leaves 0 for even numbers and 1 for odd ones:</p>
${C("SELECT OrderID,\n       OrderID % 2 AS 'Remainder'\nFROM Orders;")}
<p>You can use calculations in <code>WHERE</code> and <code>ORDER BY</code> too:</p>
${C("SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nWHERE UnitPrice * UnitsInStock > 2000\nORDER BY UnitPrice * UnitsInStock DESC;")}`,
    ex:[
      {p:'From `Order Details`, show UnitPrice, Quantity, Discount, a Gross Total (UnitPrice × Quantity) and a Net Total with the discount applied.', hint:'Discount is a fraction such as 0.15, so the net total is UnitPrice * Quantity * (1 - Discount).', sol:"SELECT UnitPrice, Quantity, Discount,\n       UnitPrice * Quantity                  AS 'Gross Total',\n       UnitPrice * Quantity * (1 - Discount) AS 'Net Total'\nFROM `Order Details`;"},
      {p:'Show each product\'s name and the value of its stock (UnitPrice × UnitsInStock) as Stock Value.', hint:"UnitPrice * UnitsInStock AS 'Stock Value'", sol:"SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products;"},
      {p:'Using `Order Details`, show the OrderID and Gross Total of the two order lines with the highest Gross Total, biggest first.', hint:'ORDER BY the gross total DESC, then LIMIT 2.', ordered:[1], sol:"SELECT OrderID, UnitPrice * Quantity AS 'Gross Total'\nFROM `Order Details`\nORDER BY UnitPrice * Quantity DESC\nLIMIT 2;"},
      {p:'How many orders have an even OrderID?', hint:'WHERE OrderID % 2 = 0', sol:'SELECT COUNT(*)\nFROM Orders\nWHERE OrderID % 2 = 0;'}
    ]},

  cp1:{title:'Checkpoint: one table', summary:'Mix everything from this unit. No new lesson, just practice.', checkpoint:true,
    ex:[
      {p:'Show the CompanyName and Phone of every customer in the UK, in alphabetical order of company name.', hint:'WHERE, then ORDER BY.', ordered:[0], sol:"SELECT CompanyName, Phone\nFROM Customers\nWHERE Country = 'UK'\nORDER BY CompanyName;"},
      {p:'How many products cost between 20 and 50 and are not discontinued?', hint:'BETWEEN and Discontinued = 0, joined with AND.', sol:'SELECT COUNT(*)\nFROM Products\nWHERE UnitPrice BETWEEN 20 AND 50\n  AND Discontinued = 0;'},
      {p:'Which three products have the highest stock value (UnitPrice × UnitsInStock)? Show the name and value, highest first.', hint:'Calculate, sort descending, limit.', ordered:[1], sol:"SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nORDER BY UnitPrice * UnitsInStock DESC\nLIMIT 3;"},
      {p:'List the distinct cities in France where Northwind has customers, in alphabetical order.', hint:'DISTINCT, WHERE and ORDER BY together.', ordered:[0], sol:"SELECT DISTINCT City\nFROM Customers\nWHERE Country = 'France'\nORDER BY City;"}
    ]},

  /* ===== Unit 3 ===== */
  aggregates:{title:'Aggregate functions', summary:'Collapse many rows into a single answer.',
    learn:`
<p>An aggregate function works across a set of rows and returns one value.</p>
<table class="mini"><tr><th>Function</th><th>Returns</th></tr>
<tr><td><code>COUNT(*)</code></td><td>The number of rows</td></tr>
<tr><td><code>COUNT(column)</code></td><td>The number of rows where that column isn't NULL</td></tr>
<tr><td><code>SUM(column)</code></td><td>The total</td></tr>
<tr><td><code>AVG(column)</code></td><td>The average</td></tr>
<tr><td><code>MIN(column)</code> / <code>MAX(column)</code></td><td>The smallest / largest value</td></tr></table>
${C("SELECT COUNT(*)          AS 'Total Products',\n       SUM(UnitsOnOrder) AS 'Total On Order',\n       AVG(UnitsOnOrder) AS 'Avg On Order',\n       MIN(UnitsOnOrder) AS 'Min On Order',\n       MAX(UnitsOnOrder) AS 'Max On Order'\nFROM Products;")}
<p>Combine aggregates with <code>WHERE</code> to summarise only some rows:</p>
${C("SELECT AVG(UnitPrice) AS 'Average Seafood Price'\nFROM Products\nWHERE CategoryID = 8;")}
${TIP('<code>COUNT(*)</code> counts rows. <code>COUNT(Region)</code> counts only rows where Region has a value. Try both on Customers and compare.')}`,
    ex:[
      {p:'Find the cheapest and the most expensive unit price in one query.', hint:'MIN(UnitPrice) and MAX(UnitPrice) in the same SELECT.', sol:'SELECT MIN(UnitPrice), MAX(UnitPrice)\nFROM Products;'},
      {p:'What is the total freight across all orders?', hint:'SUM(Freight)', sol:'SELECT SUM(Freight)\nFROM Orders;'},
      {p:'How many customers have a fax number? Use COUNT on the Fax column.', hint:'COUNT(Fax) skips the NULLs.', sol:'SELECT COUNT(Fax)\nFROM Customers;'},
      {p:'What is the average unit price of products in category 1 (Beverages)?', hint:'AVG with a WHERE on CategoryID.', sol:'SELECT AVG(UnitPrice)\nFROM Products\nWHERE CategoryID = 1;'}
    ]},

  groupby:{title:'GROUP BY', summary:'Calculate a total for each group instead of one for everything.',
    learn:`
<p><code>GROUP BY</code> splits the rows into groups and runs the aggregate once per group. Instead of one total for all products, you get one per supplier:</p>
${C("SELECT SupplierID,\n       SUM(UnitsOnOrder) AS 'Total On Order',\n       AVG(UnitsOnOrder) AS 'Avg On Order',\n       MAX(UnitsOnOrder) AS 'Max On Order'\nFROM Products\nGROUP BY SupplierID;")}
${TIP('<strong>The rule:</strong> every column in <code>SELECT</code> must be either inside an aggregate or listed in <code>GROUP BY</code>. MySQL and T-SQL both enforce this. (This lab\'s engine is more forgiving, but write it the strict way.)')}
${C("SELECT Country, COUNT(*) AS 'Customers'\nFROM Customers\nGROUP BY Country\nORDER BY COUNT(*) DESC;")}
<p>Rows are filtered by <code>WHERE</code> before they're grouped, so this counts only discontinued products in each category:</p>
${C("SELECT CategoryID, COUNT(*) AS 'Discontinued'\nFROM Products\nWHERE Discontinued = 1\nGROUP BY CategoryID;")}`,
    ex:[
      {p:'How many products are there in each category? Show CategoryID and the count.', hint:'GROUP BY CategoryID with COUNT(*).', sol:'SELECT CategoryID, COUNT(*)\nFROM Products\nGROUP BY CategoryID;'},
      {p:'Calculate the average reorder level of products for each CategoryID. Order by the average, highest first.', hint:'GROUP BY CategoryID, and ORDER BY AVG(ReorderLevel) DESC.', ordered:[1], sol:"SELECT CategoryID, AVG(ReorderLevel) AS 'Average Reorder Level'\nFROM Products\nGROUP BY CategoryID\nORDER BY AVG(ReorderLevel) DESC;"},
      {p:'How many orders were shipped to each country (ShipCountry)? Show the busiest country first.', hint:'GROUP BY ShipCountry, ORDER BY the count DESC.', ordered:[1], sol:'SELECT ShipCountry, COUNT(*)\nFROM Orders\nGROUP BY ShipCountry\nORDER BY COUNT(*) DESC;'},
      {p:'Using `Order Details`, find the five products (ProductID) with the highest total quantity sold, highest first.', hint:'SUM(Quantity) per ProductID, sorted, LIMIT 5.', ordered:[1], sol:"SELECT ProductID, SUM(Quantity) AS 'Total Sold'\nFROM `Order Details`\nGROUP BY ProductID\nORDER BY SUM(Quantity) DESC\nLIMIT 5;"}
    ]},

  having:{title:'Filtering groups with HAVING', summary:'Keep only the groups that pass a test.',
    learn:`
<p><code>WHERE</code> filters rows before grouping. <code>HAVING</code> filters the groups afterwards, so it's the one to use when your condition involves an aggregate.</p>
${C("SELECT SupplierID,\n       SUM(UnitsOnOrder) AS 'Total On Order',\n       AVG(UnitsOnOrder) AS 'Avg On Order'\nFROM Products\nGROUP BY SupplierID\nHAVING AVG(UnitsOnOrder) > 5;")}
<p>Try moving that condition into <code>WHERE</code>: it fails, because when <code>WHERE</code> runs the groups don't exist yet.</p>
<ol class="order"><li><code>FROM</code></li><li><code>WHERE</code> filters rows</li><li><code>GROUP BY</code></li><li><code>HAVING</code> filters groups</li><li><code>SELECT</code></li><li><code>ORDER BY</code></li></ol>
${TIP('In MySQL and T-SQL, repeat the full expression in <code>HAVING</code> (<code>HAVING AVG(UnitsOnOrder) &gt; 5</code>) rather than using the alias from <code>SELECT</code>.')}
<p>You can use both in one query: <code>WHERE</code> to pick rows, <code>HAVING</code> to pick groups.</p>
${C("SELECT Country, COUNT(*) AS 'Customers'\nFROM Customers\nWHERE ContactTitle LIKE '%Sales%'\nGROUP BY Country\nHAVING COUNT(*) >= 3;")}`,
    ex:[
      {p:'For each SupplierID, show the total UnitsInStock across their products. Only include suppliers with more than 100 units in total.', hint:'HAVING SUM(UnitsInStock) > 100', sol:"SELECT SupplierID, SUM(UnitsInStock) AS 'Total In Stock'\nFROM Products\nGROUP BY SupplierID\nHAVING SUM(UnitsInStock) > 100;"},
      {p:'Which employees (EmployeeID) handled more than 100 orders? Show the EmployeeID and their number of orders.', hint:'GROUP BY EmployeeID on Orders, HAVING COUNT(*) > 100.', sol:'SELECT EmployeeID, COUNT(*)\nFROM Orders\nGROUP BY EmployeeID\nHAVING COUNT(*) > 100;'},
      {p:'Which countries have more than 5 customers? Show the country and the number of customers.', hint:'GROUP BY Country, HAVING COUNT(*) > 5.', sol:'SELECT Country, COUNT(*)\nFROM Customers\nGROUP BY Country\nHAVING COUNT(*) > 5;'}
    ]},

  nulls:{title:'Working with NULL', summary:'Find, exclude and replace missing values.',
    learn:`
<p><code>NULL</code> means "no value". It isn't zero and it isn't empty text: it's unknown. That's why <code>= NULL</code> never matches anything. Use <code>IS NULL</code> and <code>IS NOT NULL</code>.</p>
${C('SELECT CompanyName, Region\nFROM Customers\nWHERE Region IS NULL;')}
${C('SELECT CompanyName, Region\nFROM Customers\nWHERE Region IS NOT NULL;')}
<p>Run this one and notice it returns nothing, even though many regions are missing:</p>
${C('SELECT CompanyName\nFROM Customers\nWHERE Region = NULL;')}
<h3>Replacing NULLs</h3>
<p><code>COALESCE</code> returns the first value that isn't NULL, so it's a neat way to show a placeholder. MySQL's <code>IFNULL</code> and T-SQL's <code>ISNULL</code> do the same with two values.</p>
${C("SELECT CompanyName, COALESCE(Fax, 'No fax') AS 'Fax'\nFROM Customers;")}`,
    ex:[
      {p:'List the countries that have region codes in the Customers table, with a count of customers per country.', hint:'WHERE Region IS NOT NULL, then GROUP BY Country.', sol:"SELECT Country, COUNT(*) AS 'No. of Customers'\nFROM Customers\nWHERE Region IS NOT NULL\nGROUP BY Country\nORDER BY COUNT(*) DESC;"},
      {p:'Which orders haven\'t been shipped yet? Show the OrderID and OrderDate.', hint:'An unshipped order has no ShippedDate.', sol:'SELECT OrderID, OrderDate\nFROM Orders\nWHERE ShippedDate IS NULL;'},
      {p:'List every customer\'s CompanyName and Region, showing No region when Region is NULL.', hint:"COALESCE(Region, 'No region')", sol:"SELECT CompanyName, COALESCE(Region, 'No region') AS 'Region'\nFROM Customers;"}
    ]},

  cp2:{title:'Checkpoint: summarising', summary:'Mix aggregates, groups and NULLs.', checkpoint:true,
    ex:[
      {p:'What is the average freight per shipper (ShipVia)? Show the highest average first.', hint:'GROUP BY ShipVia, ORDER BY AVG(Freight) DESC.', ordered:[1], sol:'SELECT ShipVia, AVG(Freight)\nFROM Orders\nGROUP BY ShipVia\nORDER BY AVG(Freight) DESC;'},
      {p:'Which categories (CategoryID) have an average unit price above 30? Show the CategoryID and the average.', hint:'A condition on an aggregate needs HAVING.', sol:'SELECT CategoryID, AVG(UnitPrice)\nFROM Products\nGROUP BY CategoryID\nHAVING AVG(UnitPrice) > 30;'},
      {p:'How many orders shipped to Germany had a freight cost above 100?', hint:'Two conditions in WHERE, then COUNT(*).', sol:"SELECT COUNT(*)\nFROM Orders\nWHERE ShipCountry = 'Germany' AND Freight > 100;"},
      {p:'For each employee (EmployeeID), show the date of their first and their most recent order.', hint:'MIN(OrderDate) and MAX(OrderDate), grouped by EmployeeID.', sol:'SELECT EmployeeID, MIN(OrderDate), MAX(OrderDate)\nFROM Orders\nGROUP BY EmployeeID;'}
    ]},

  /* ===== Unit 4 ===== */
  innerjoin:{title:'INNER JOIN', summary:'Combine rows from two tables where their keys match.',
    learn:`
<p>The ERD shows <code>Products.SupplierID</code> pointing at <code>Suppliers.SupplierID</code>. A join follows that line. The <code>ON</code> clause says which columns must match:</p>
${C('SELECT Products.ProductName, Suppliers.CompanyName\nFROM Products\nINNER JOIN Suppliers ON Products.SupplierID = Suppliers.SupplierID;')}
<p>An <code>INNER JOIN</code> returns only rows that have a match on both sides. Picture a student table and a course table:</p>
${C("-- Not in Northwind: read it and predict the output\nSELECT student.name, course.name\nFROM student\nINNER JOIN course ON student.course = course.id;", false)}
<p>A student whose <code>course</code> is NULL has no match, so they disappear from the result entirely. That's the key thing to remember about inner joins.</p>
${TIP('When both tables have a column with the same name, such as <code>CompanyName</code> in Customers and Suppliers, prefix it with the table name. Otherwise you get an "ambiguous column" error.')}
${C("SELECT Orders.OrderID, Orders.OrderDate, Customers.CompanyName\nFROM Orders\nINNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID\nWHERE Customers.Country = 'Spain';")}`,
    ex:[
      {p:'Show every product\'s name next to the name of its category.', hint:'Join Products to Categories on CategoryID.', sol:'SELECT Products.ProductName, Categories.CategoryName\nFROM Products\nINNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;'},
      {p:'List the OrderID and customer CompanyName of every order placed by a customer in Mexico.', hint:"Join Orders to Customers, then WHERE Customers.Country = 'Mexico'.", sol:"SELECT Orders.OrderID, Customers.CompanyName\nFROM Orders\nINNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID\nWHERE Customers.Country = 'Mexico';"},
      {p:'What was in order 10248? Show each ProductName and Quantity.', hint:'Join `Order Details` to Products, filter on OrderID.', sol:'SELECT Products.ProductName, `Order Details`.Quantity\nFROM `Order Details`\nINNER JOIN Products ON `Order Details`.ProductID = Products.ProductID\nWHERE `Order Details`.OrderID = 10248;'}
    ]},

  leftjoin:{title:'LEFT JOIN', summary:'Keep every row from the first table, matched or not.',
    learn:`
<p>A <code>LEFT JOIN</code> returns every row from the left table (the one in <code>FROM</code>). Where there's no match on the right, those columns come back as NULL.</p>
${C("-- The student example again\nSELECT student.name, course.name\nFROM student\nLEFT JOIN course ON student.course = course.id;", false)}
<p>This time the student with no course still appears, with NULL for the course name.</p>
<p>In Northwind, some customers have never ordered. An inner join hides them; a left join keeps them:</p>
${C('SELECT Customers.CompanyName, Orders.OrderID\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nORDER BY Orders.OrderID;')}
<h3>Finding what's missing</h3>
<p>Add <code>WHERE right_table.key IS NULL</code> to keep only the unmatched rows. This is a common data quality check.</p>
${C('SELECT Customers.CompanyName\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nWHERE Orders.OrderID IS NULL;')}
${TIP('Avoid <code>RIGHT JOIN</code>. Any right join can be written as a left join by swapping the tables, and keeping the main table on the left makes queries easier to read.')}`,
    ex:[
      {p:'Using a LEFT JOIN, find the CompanyName of every customer who has never placed an order.', hint:'LEFT JOIN Orders, then WHERE Orders.OrderID IS NULL.', sol:'SELECT Customers.CompanyName\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nWHERE Orders.OrderID IS NULL;'},
      {p:'List every customer\'s CompanyName with their number of orders, including customers with zero.', hint:'COUNT(Orders.OrderID) counts only matched rows, so unmatched customers get 0. COUNT(*) would give them 1.', sol:"SELECT Customers.CompanyName, COUNT(Orders.OrderID) AS 'Orders'\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nGROUP BY Customers.CustomerID, Customers.CompanyName;"},
      {p:'Show every employee\'s first and last name next to their manager\'s last name. Include the employee who has no manager.', hint:'Join Employees to itself: Employees e LEFT JOIN Employees m ON e.ReportsTo = m.EmployeeID.', sol:"SELECT e.FirstName, e.LastName, m.LastName AS 'Manager'\nFROM Employees e\nLEFT JOIN Employees m ON e.ReportsTo = m.EmployeeID;"}
    ]},

  multijoin:{title:'Aliases and multiple joins', summary:'Short table names, and joining three or more tables.',
    learn:`
<p>Writing <code>Products.ProductName</code> in full gets tiring. A table alias is a short name you give a table in <code>FROM</code> or <code>JOIN</code>, then use everywhere else in the query:</p>
${C('SELECT p.ProductName, s.CompanyName\nFROM Products p\nLEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID;')}
<p>You can chain as many joins as you need. Each one adds a table and needs its own <code>ON</code> condition. Follow the lines on the ERD to see which keys to use.</p>
${C("SELECT p.ProductName  AS 'Product',\n       s.CompanyName  AS 'Supplier',\n       c.CategoryName AS 'Category'\nFROM Products p\nINNER JOIN Suppliers  s ON p.SupplierID = s.SupplierID\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID;")}
${TIP('If you leave out an <code>ON</code> clause or use the wrong columns, every row of one table gets matched with every row of the other. That\'s a cartesian product, and it can be enormous. Check each condition as you add a join.')}
<p>Joins combine well with grouping:</p>
${C("SELECT c.CategoryName, COUNT(*) AS 'Products'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;")}`,
    ex:[
      {p:'List every order with its OrderID, OrderDate and Freight, the customer\'s CompanyName, and the employee\'s first and last name as one column.', hint:'Join Orders to Employees on EmployeeID and to Customers on CustomerID.', sol:"SELECT o.OrderID,\n       o.OrderDate,\n       o.Freight,\n       CONCAT(e.FirstName, ' ', e.LastName) AS 'Sales Person',\n       c.CompanyName AS 'Customer'\nFROM Orders o\nINNER JOIN Employees e ON o.EmployeeID = e.EmployeeID\nINNER JOIN Customers c ON o.CustomerID = c.CustomerID;"},
      {p:'List every product in the Seafood category with its supplier\'s CompanyName.', hint:'Three tables: Products, Categories and Suppliers. Filter on CategoryName.', sol:"SELECT p.ProductName, s.CompanyName\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nINNER JOIN Suppliers  s ON p.SupplierID = s.SupplierID\nWHERE c.CategoryName = 'Seafood';"},
      {p:'Show each customer\'s CustomerID, CompanyName and total Freight. Only return customers whose total freight exceeds 500.', hint:'Join, GROUP BY the customer, then HAVING SUM(o.Freight) > 500.', sol:"SELECT c.CustomerID,\n       c.CompanyName  AS 'Customer',\n       SUM(o.Freight) AS 'Total Freight'\nFROM Orders o\nINNER JOIN Customers c ON o.CustomerID = c.CustomerID\nGROUP BY c.CustomerID, c.CompanyName\nHAVING SUM(o.Freight) > 500;"}
    ]},

  cp3:{title:'Checkpoint: joins', summary:'Follow the ERD across several tables.', checkpoint:true,
    ex:[
      {p:'What is the total sales value (UnitPrice × Quantity × (1 − Discount)) for each category name? Show the highest first.', hint:'`Order Details` → Products → Categories, then GROUP BY CategoryName.', ordered:[1], sol:"SELECT c.CategoryName,\n       SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS 'Sales'\nFROM `Order Details` od\nINNER JOIN Products   p ON od.ProductID = p.ProductID\nINNER JOIN Categories c ON p.CategoryID  = c.CategoryID\nGROUP BY c.CategoryName\nORDER BY Sales DESC;"},
      {p:'Which products come from suppliers in Japan? Show ProductName and the supplier\'s CompanyName.', hint:"Join Products to Suppliers, WHERE s.Country = 'Japan'.", sol:"SELECT p.ProductName, s.CompanyName\nFROM Products p\nINNER JOIN Suppliers s ON p.SupplierID = s.SupplierID\nWHERE s.Country = 'Japan';"},
      {p:'How many orders did each shipper carry? Show the shipper\'s CompanyName and the count, most first.', hint:'Orders.ShipVia links to Shippers.ShipperID.', ordered:[1], sol:"SELECT sh.CompanyName, COUNT(*) AS 'Orders'\nFROM Orders o\nINNER JOIN Shippers sh ON o.ShipVia = sh.ShipperID\nGROUP BY sh.CompanyName\nORDER BY COUNT(*) DESC;"}
    ]},

  /* ===== Unit 5 ===== */
  subwhere:{title:'Subqueries in WHERE', summary:'Filter using a value or list worked out by another query.',
    learn:`
<p>A subquery is a <code>SELECT</code> inside brackets, nested in another statement. The inner query runs first, and its result is used by the outer one.</p>
${C('SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products);')}
<p>The subquery returns one number, the average price, which <code>&gt;</code> compares against. When a subquery returns a list, use <code>IN</code>:</p>
${C('SELECT CompanyName, Country\nFROM Customers\nWHERE CustomerID IN (SELECT DISTINCT CustomerID FROM Orders);')}
<table class="mini"><tr><th>The subquery returns</th><th>Use</th></tr><tr><td>Exactly one value</td><td><code>=</code>, <code>&gt;</code>, <code>&lt;</code>…</td></tr><tr><td>A list of values</td><td><code>IN</code> or <code>NOT IN</code></td></tr></table>
${TIP('<strong>Watch out with NOT IN.</strong> If the subquery returns even one NULL, <code>NOT IN</code> matches nothing at all. Add <code>WHERE column IS NOT NULL</code> inside the subquery, or use <code>NOT EXISTS</code> (two lessons on).')}`,
    ex:[
      {p:'Using a subquery in WHERE, find all products priced above the average unit price. Show the name and price, most expensive first.', hint:'WHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)\nORDER BY UnitPrice DESC;'},
      {p:'Which orders have a freight cost above the average freight? Show the OrderID and Freight.', hint:'Same pattern as the example, on Orders.', sol:'SELECT OrderID, Freight\nFROM Orders\nWHERE Freight > (SELECT AVG(Freight) FROM Orders);'},
      {p:'Using IN, list the CompanyName of every customer who has had at least one order shipped by shipper 3 (ShipVia = 3).', hint:'WHERE CustomerID IN (SELECT CustomerID FROM Orders WHERE ShipVia = 3)', sol:'SELECT CompanyName\nFROM Customers\nWHERE CustomerID IN (SELECT CustomerID FROM Orders WHERE ShipVia = 3);'}
    ]},

  subfrom:{title:'Subqueries in FROM and SELECT', summary:'Use a query as a temporary table, or as a calculated column.',
    learn:`
<h3>In FROM: derived tables</h3>
<p>A subquery in <code>FROM</code> acts as a temporary table that exists only for this query. It must have an alias. It's useful when you need to summarise first, then join:</p>
${C("SELECT s.CompanyName AS 'Supplier',\n       avg_prices.AvgPrice AS 'Average Price'\nFROM Suppliers s\nINNER JOIN (\n    SELECT SupplierID, AVG(UnitPrice) AS AvgPrice\n    FROM Products\n    GROUP BY SupplierID\n) AS avg_prices ON s.SupplierID = avg_prices.SupplierID\nWHERE avg_prices.AvgPrice > 20\nORDER BY avg_prices.AvgPrice DESC;")}
<h3>In SELECT: scalar subqueries</h3>
<p>A subquery in <code>SELECT</code> must return exactly one value. It runs for every row, adding that value as a column:</p>
${C("SELECT ProductName,\n       UnitPrice,\n       (SELECT AVG(UnitPrice) FROM Products) AS 'Average Price'\nFROM Products;")}
<p>When the subquery refers to the outer row, it's called a correlated subquery. This one counts the lines in each order:</p>
${C("SELECT o.OrderID,\n       (SELECT COUNT(*)\n        FROM `Order Details` od\n        WHERE od.OrderID = o.OrderID) AS 'Number of Items'\nFROM Orders o;")}
${TIP('If you keep writing the same derived table, save it as a view. That\'s the last lesson on the path.')}`,
    ex:[
      {p:'Using a subquery in FROM, total the Freight per customer and join it to Customers to show CompanyName next to the total. Order by total freight, highest first.', hint:'Give the derived table an alias, for example ) AS freight_totals ON …', ordered:[1], sol:"SELECT c.CompanyName AS 'Customer',\n       freight_totals.TotalFreight AS 'Total Freight'\nFROM Customers c\nINNER JOIN (\n    SELECT CustomerID, SUM(Freight) AS TotalFreight\n    FROM Orders\n    GROUP BY CustomerID\n) AS freight_totals ON c.CustomerID = freight_totals.CustomerID\nORDER BY freight_totals.TotalFreight DESC;"},
      {p:'Show each product\'s name, its unit price, and how far its price is from the average price.', hint:'UnitPrice - (SELECT AVG(UnitPrice) FROM Products)', sol:"SELECT ProductName,\n       UnitPrice,\n       UnitPrice - (SELECT AVG(UnitPrice) FROM Products) AS 'Difference from Average'\nFROM Products;"},
      {p:'Using a subquery in SELECT, show each CustomerID from Customers with how many orders they\'ve placed.', hint:'(SELECT COUNT(*) FROM Orders o WHERE o.CustomerID = c.CustomerID)', sol:"SELECT c.CustomerID,\n       (SELECT COUNT(*) FROM Orders o WHERE o.CustomerID = c.CustomerID) AS 'Orders'\nFROM Customers c;"}
    ]},

  exists:{title:'EXISTS and NOT EXISTS', summary:'Check whether related rows exist, safely.',
    learn:`
<p><code>EXISTS</code> is true if its subquery returns at least one row. What the subquery selects doesn't matter, so <code>SELECT 1</code> is the convention.</p>
${C('SELECT CompanyName\nFROM Customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM Orders o\n    WHERE o.CustomerID = c.CustomerID\n);')}
<p><code>NOT EXISTS</code> finds rows with no match. Unlike <code>NOT IN</code>, it isn't tripped up by NULLs.</p>
<h3>Subquery or JOIN?</h3>
<p>These return the same customers. The join needs <code>DISTINCT</code>, because a customer with ten orders would appear ten times.</p>
${C('SELECT CompanyName\nFROM Customers\nWHERE CustomerID IN (SELECT CustomerID FROM Orders);')}
${C('SELECT DISTINCT c.CompanyName\nFROM Customers c\nINNER JOIN Orders o ON c.CustomerID = o.CustomerID;')}
<table class="mini"><tr><th>If you want to…</th><th>Prefer</th></tr><tr><td>Check related rows exist</td><td><code>EXISTS</code></td></tr><tr><td>Show columns from several tables</td><td><code>JOIN</code></td></tr><tr><td>Aggregate before joining</td><td>A derived table</td></tr></table>`,
    ex:[
      {p:'Using NOT EXISTS, find the CompanyName of every customer who has never placed an order.', hint:'Inside NOT EXISTS, select from Orders where o.CustomerID = c.CustomerID.', sol:'SELECT CompanyName\nFROM Customers c\nWHERE NOT EXISTS (\n    SELECT 1\n    FROM Orders o\n    WHERE o.CustomerID = c.CustomerID\n);'},
      {p:'Using EXISTS, list the CompanyName of every supplier that supplies at least one discontinued product.', hint:'EXISTS (SELECT 1 FROM Products p WHERE p.SupplierID = s.SupplierID AND p.Discontinued = 1)', sol:'SELECT CompanyName\nFROM Suppliers s\nWHERE EXISTS (\n    SELECT 1\n    FROM Products p\n    WHERE p.SupplierID = s.SupplierID\n      AND p.Discontinued = 1\n);'},
      {p:'Which products have appeared on an order line with a quantity over 100? Show the ProductName.', hint:'EXISTS on `Order Details` with od.ProductID = p.ProductID AND od.Quantity > 100.', sol:'SELECT ProductName\nFROM Products p\nWHERE EXISTS (\n    SELECT 1\n    FROM `Order Details` od\n    WHERE od.ProductID = p.ProductID\n      AND od.Quantity > 100\n);'}
    ]},

  cp4:{title:'Checkpoint: subqueries', summary:'Nested queries, all mixed together.', checkpoint:true,
    ex:[
      {p:'Find the most expensive product in each category. Show CategoryID, ProductName and UnitPrice.', hint:'A correlated subquery: WHERE p.UnitPrice = (SELECT MAX(UnitPrice) FROM Products WHERE CategoryID = p.CategoryID)', sol:'SELECT p.CategoryID, p.ProductName, p.UnitPrice\nFROM Products p\nWHERE p.UnitPrice = (\n    SELECT MAX(UnitPrice)\n    FROM Products\n    WHERE CategoryID = p.CategoryID\n);'},
      {p:'Which customers have spent more than 30,000 in total? Show CompanyName and total spend (UnitPrice × Quantity × (1 − Discount)).', hint:'Build a derived table of spend per CustomerID from Orders and `Order Details`, then join it to Customers.', sol:"SELECT c.CompanyName, t.TotalSpend\nFROM Customers c\nINNER JOIN (\n    SELECT o.CustomerID,\n           SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS TotalSpend\n    FROM Orders o\n    INNER JOIN `Order Details` od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n) AS t ON c.CustomerID = t.CustomerID\nWHERE t.TotalSpend > 30000;"},
      {p:'List the first and last names of employees who have taken an order from a customer in Brazil.', hint:'WHERE EmployeeID IN (SELECT EmployeeID FROM Orders WHERE CustomerID IN (…Brazilian customers…))', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE EmployeeID IN (\n    SELECT EmployeeID FROM Orders\n    WHERE CustomerID IN (SELECT CustomerID FROM Customers WHERE Country = 'Brazil')\n);"}
    ]},

  /* ===== Unit 6 ===== */
  case:{title:'CASE expressions', summary:'Choose a value row by row, like if/else.',
    learn:`
<p><code>CASE</code> checks conditions in order and returns the value for the first one that's true. <code>ELSE</code> covers everything else, and <code>END</code> closes it.</p>
${C("SELECT ProductName, UnitsInStock,\n       CASE\n           WHEN UnitsInStock = 0  THEN 'Out of stock'\n           WHEN UnitsInStock < 20 THEN 'Low'\n           ELSE 'OK'\n       END AS 'Stock Status'\nFROM Products;")}
${TIP('Order matters. If <code>&lt; 20</code> came first, products with 0 in stock would be labelled Low, because CASE stops at the first match.')}
<p>You can group by a <code>CASE</code> to count each label:</p>
${C("SELECT CASE WHEN Discontinued = 1 THEN 'Discontinued' ELSE 'Active' END AS 'Status',\n       COUNT(*) AS 'Products'\nFROM Products\nGROUP BY CASE WHEN Discontinued = 1 THEN 'Discontinued' ELSE 'Active' END;")}`,
    ex:[
      {p:'Show each OrderID with a Status column: On Time if it shipped less than 10 days after the order date, otherwise Overdue.', hint:"DATEDIFF(ShippedDate, OrderDate) gives the days between (MySQL). Wrap it in CASE WHEN … THEN 'On Time' ELSE 'Overdue' END.", sol:"SELECT OrderID,\n       CASE\n           WHEN DATEDIFF(ShippedDate, OrderDate) < 10 THEN 'On Time'\n           ELSE 'Overdue'\n       END AS 'Status'\nFROM Orders;"},
      {p:'Give each product a Price Band: Budget under 10, Standard under 30, otherwise Premium. Show ProductName, UnitPrice and the band.', hint:'Two WHENs, checked from cheapest up, then ELSE.', sol:"SELECT ProductName, UnitPrice,\n       CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END AS 'Price Band'\nFROM Products;"},
      {p:'Count how many products fall in each of those price bands.', hint:'GROUP BY the same CASE expression.', sol:"SELECT CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END AS 'Price Band',\n       COUNT(*) AS 'Products'\nFROM Products\nGROUP BY CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END;"}
    ]},

  datesstrings:{title:'Dates and text functions', summary:'Pull apart dates and text with built-in functions.',
    learn:`
<p>Function names differ between MySQL and T-SQL. This lab accepts both for the ones below.</p>
<table class="mini"><tr><th>Task</th><th>MySQL</th><th>T-SQL</th></tr>
<tr><td>Today</td><td><code>CURDATE()</code>, <code>NOW()</code></td><td><code>GETDATE()</code></td></tr>
<tr><td>Part of a date</td><td colspan="2"><code>YEAR(d)</code>, <code>MONTH(d)</code>, <code>DAY(d)</code></td></tr>
<tr><td>Days between</td><td><code>DATEDIFF(end, start)</code></td><td><code>DATEDIFF(d, start, end)</code></td></tr>
<tr><td>Add time</td><td><code>DATE_ADD(d, INTERVAL 5 DAY)</code></td><td><code>DATEADD(d, 5, d)</code></td></tr>
<tr><td>Format</td><td><code>DATE_FORMAT(d, '%d/%m/%Y')</code></td><td><code>FORMAT(d, 'dd/MM/yyyy')</code>*</td></tr>
<tr><td>Find text</td><td><code>LOCATE(' ', s)</code></td><td><code>CHARINDEX(' ', s)</code></td></tr>
<tr><td>Length</td><td><code>LENGTH(s)</code></td><td><code>LEN(s)</code></td></tr>
<tr><td>Cut text</td><td colspan="2"><code>LEFT(s, n)</code>, <code>RIGHT(s, n)</code>, <code>SUBSTRING(s, start, length)</code>, <code>UPPER(s)</code>, <code>REPLACE(s, a, b)</code></td></tr></table>
<p class="small">* T-SQL's <code>FORMAT</code> isn't available here.</p>
${C("SELECT OrderDate,\n       DATE_ADD(OrderDate, INTERVAL 5 DAY) AS 'Due Date',\n       DATEDIFF(ShippedDate, OrderDate)    AS 'Ship Days'\nFROM Orders;")}
${C("SELECT DATE_FORMAT(OrderDate, '%d/%m/%Y') AS 'Order Date'\nFROM Orders;")}
<p>Functions nest. This finds the space in a UK postcode and keeps everything before it:</p>
${C("SELECT PostalCode,\n       LEFT(PostalCode, LOCATE(' ', PostalCode) - 1) AS 'Post Code Region'\nFROM Customers\nWHERE Country = 'UK';")}`,
    ex:[
      {p:'How many orders were placed in each year? Show the year and the count.', hint:'GROUP BY YEAR(OrderDate).', sol:"SELECT YEAR(OrderDate) AS 'Year', COUNT(*) AS 'Orders'\nFROM Orders\nGROUP BY YEAR(OrderDate);"},
      {p:'List the ProductName of products that contain a single quote, with the position of the quote.', hint:"LOCATE('''', ProductName) finds it; keep rows where it's above 0.", sol:"SELECT ProductName,\n       LOCATE('''', ProductName) AS 'Quote Position'\nFROM Products\nWHERE LOCATE('''', ProductName) > 0;"},
      {p:'Show each employee\'s full name and their current age, calculated from BirthDate.', hint:'MySQL: TIMESTAMPDIFF(YEAR, BirthDate, CURDATE())', sol:"SELECT CONCAT(FirstName, ' ', LastName)          AS 'Full Name',\n       TIMESTAMPDIFF(YEAR, BirthDate, CURDATE()) AS 'Age'\nFROM Employees;"},
      {p:'Show each customer\'s CompanyName in capital letters, with the length of the name.', hint:'UPPER(CompanyName) and LENGTH(CompanyName).', sol:"SELECT UPPER(CompanyName) AS 'Company', LENGTH(CompanyName) AS 'Length'\nFROM Customers;"}
    ]},

  views:{title:'Views', summary:'Save a query under a name and use it like a table.',
    learn:`
<p>A view is a saved query. It stores no data of its own: each time you select from it, the query behind it runs.</p>
${C("CREATE VIEW ProductCategorySummary AS\nSELECT c.CategoryName AS 'Category Name',\n       COUNT(*)       AS 'Number of Products'\nFROM Categories c\nINNER JOIN Products p ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;\n\nSELECT * FROM ProductCategorySummary;")}
<p>Running that twice gives an "already exists" error. Drop it first if you want to redefine it:</p>
${C('DROP VIEW IF EXISTS ProductCategorySummary;')}
<ul class="plain"><li>Use views for complex queries you run often, or to give people a simpler way into joined data.</li><li>Views with joins or aggregates are read-only: you can't insert or update through them.</li><li>No spaces in view names. Some teams use a <code>vw_</code> prefix.</li></ul>
${TIP('Views you create here last until you reload the page.')}`,
    ex:[
      {p:'Create the ProductCategorySummary view from the lesson (Category Name and Number of Products), then select everything from it.', hint:'Copy the example. Start with DROP VIEW IF EXISTS if it already exists.', sol:"DROP VIEW IF EXISTS ProductCategorySummary;\nCREATE VIEW ProductCategorySummary AS\nSELECT c.CategoryName AS 'Category Name',\n       COUNT(*)       AS 'Number of Products'\nFROM Categories c\nINNER JOIN Products p ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;\nSELECT * FROM ProductCategorySummary;"},
      {p:'Create a view called vw_CustomerOrderCounts with each customer\'s CompanyName and number of orders (call it OrderCount). Then use the view to list the customers with more than 20 orders.', hint:'CREATE VIEW … AS SELECT … GROUP BY …; then SELECT * FROM vw_CustomerOrderCounts WHERE OrderCount > 20;', sol:"DROP VIEW IF EXISTS vw_CustomerOrderCounts;\nCREATE VIEW vw_CustomerOrderCounts AS\nSELECT c.CompanyName, COUNT(o.OrderID) AS OrderCount\nFROM Customers c\nLEFT JOIN Orders o ON o.CustomerID = c.CustomerID\nGROUP BY c.CustomerID, c.CompanyName;\nSELECT * FROM vw_CustomerOrderCounts WHERE OrderCount > 20;"}
    ]},
  /* ===== Unit 7: Advanced topics (from the Advanced SQL slides) ===== */
  windows:{title:'Window functions: OVER and PARTITION BY', summary:'Add a total, count or average to every row without losing any rows.',
    learn:`
<p>Aggregate functions such as <code>COUNT</code> and <code>AVG</code> squash rows together: one row per group. <strong>Analytic</strong> (or <strong>window</strong>) functions calculate across a set of rows but keep every row, so you can see the calculation next to the original data.</p>
<p>Say you want each order alongside how many orders that employee has handled. With what you know so far, that needs a join to a grouped subquery:</p>
${C("SELECT o.OrderID, o.CustomerID, o.EmployeeID,\n       c.EOCount AS 'Employee Order Count', o.OrderDate\nFROM Orders o\nINNER JOIN (\n    SELECT EmployeeID, COUNT(*) AS EOCount\n    FROM Orders\n    GROUP BY EmployeeID\n) c ON o.EmployeeID = c.EmployeeID;")}
<p>A window function does the same in one line. <code>OVER (PARTITION BY …)</code> splits the rows into partitions, like <code>GROUP BY</code>, but the function's answer is added to every row instead of collapsing them:</p>
${C("SELECT OrderID, EmployeeID,\n       COUNT(*) OVER (PARTITION BY EmployeeID) AS 'Employee Order Count'\nFROM Orders\nORDER BY OrderID;")}
${TIP('The pattern is <code>FUNCTION(…) OVER (PARTITION BY column) AS …</code>. The calculation starts again at every partition boundary.')}
<p>Leave out <code>PARTITION BY</code> to calculate across the whole result. The empty brackets are still needed:</p>
${C("SELECT ProductName, UnitPrice,\n       COUNT(*) OVER ()       AS 'Total Count',\n       AVG(UnitPrice) OVER () AS 'Average Price'\nFROM Products;")}
<p>The result is a number like any other, so you can do maths with it:</p>
${C("SELECT ProductName, CategoryID, UnitPrice,\n       UnitPrice - AVG(UnitPrice) OVER (PARTITION BY CategoryID) AS 'Difference from Category Average'\nFROM Products;")}
${TIP('Window functions run last, after <code>WHERE</code>, <code>GROUP BY</code> and <code>HAVING</code>, just before <code>ORDER BY</code>. They work in MySQL 8+, SQL Server 2012+ and this lab.')}`,
    ex:[
      {p:'Using an INNER JOIN (no window function), show OrderID, CustomerID, EmployeeID, the employee\'s total order count as Employee Order Count, and OrderDate.', hint:'Join Orders to a subquery that counts orders per EmployeeID.', sol:"SELECT o.OrderID, o.CustomerID, o.EmployeeID,\n       c.EOCount AS 'Employee Order Count', o.OrderDate\nFROM Orders o\nINNER JOIN (\n    SELECT EmployeeID, COUNT(*) AS EOCount\n    FROM Orders\n    GROUP BY EmployeeID\n) c ON o.EmployeeID = c.EmployeeID;"},
      {p:'Show each product\'s ProductID, ProductName, CategoryName, and how many other products are in the same category.', hint:'COUNT(*) OVER (PARTITION BY p.CategoryID) counts the product itself too, so subtract 1.', sol:"SELECT p.ProductID AS 'Product ID',\n       p.ProductName AS 'Product Name',\n       c.CategoryName AS 'Category Name',\n       COUNT(*) OVER (PARTITION BY p.CategoryID) - 1 AS 'Other Products in Category'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nORDER BY p.ProductID;"},
      {p:'Show each product\'s ProductID, ProductName, CategoryName and the total UnitsOnOrder for its whole category.', hint:'SUM(p.UnitsOnOrder) OVER (PARTITION BY p.CategoryID)', sol:"SELECT p.ProductID, p.ProductName, c.CategoryName,\n       SUM(p.UnitsOnOrder) OVER (PARTITION BY p.CategoryID) AS 'Total Category Units on Order'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nORDER BY p.ProductID;"},
      {p:'Show every order\'s OrderID and Freight next to the average freight across all orders.', hint:'AVG(Freight) OVER () - empty brackets mean the whole table.', sol:"SELECT OrderID, Freight, AVG(Freight) OVER () AS 'Average Freight'\nFROM Orders;"}
    ]},

  ranking:{title:'Ranking: ROW_NUMBER, RANK and DENSE_RANK', summary:'Number and rank rows, overall or within each group.',
    learn:`
<p><code>ORDER BY</code> inside <code>OVER ( )</code> tells the window function what order to work through the rows. It's most often used to number or rank them:</p>
${C("SELECT ProductName, UnitPrice,\n       ROW_NUMBER() OVER (ORDER BY UnitPrice DESC) AS 'Row Number'\nFROM Products;")}
<p>This <code>ORDER BY</code> is independent of the one at the end of the query. Add <code>ORDER BY ProductName</code> to the example above: the row numbers stay attached to the prices.</p>
<h3>When values tie</h3>
<table class="mini"><tr><th>Function</th><th>Ties</th><th>Example</th></tr>
<tr><td><code>ROW_NUMBER()</code></td><td>Every row gets a different number; tied rows are numbered in no guaranteed order</td><td>1, 2, 3, 4, 5</td></tr>
<tr><td><code>RANK()</code></td><td>Ties share a number, then numbers are skipped</td><td>1, 2, 3, 3, 3, 6</td></tr>
<tr><td><code>DENSE_RANK()</code></td><td>Ties share a number, nothing is skipped</td><td>1, 2, 3, 3, 3, 4</td></tr></table>
${C("SELECT ProductName, UnitPrice,\n       ROW_NUMBER() OVER (ORDER BY UnitPrice DESC) AS 'Row Number',\n       RANK()       OVER (ORDER BY UnitPrice DESC) AS 'Rank',\n       DENSE_RANK() OVER (ORDER BY UnitPrice DESC) AS 'Dense Rank'\nFROM Products;")}
${TIP('Because <code>ROW_NUMBER()</code> numbers ties in no guaranteed order, the same query can give different numbers each time. Use <code>RANK()</code> or <code>DENSE_RANK()</code> when ties must be treated equally.')}
<p>Combine <code>PARTITION BY</code> and <code>ORDER BY</code> to rank within each group. Numbering restarts at every new category:</p>
${C("SELECT ProductName, UnitPrice, CategoryID,\n       ROW_NUMBER() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS 'Row Number'\nFROM Products;")}`,
    ex:[
      {p:'Show each order\'s OrderID, CustomerID and OrderDate, with its rank by order date for that customer (their first order is 1). Order the result by OrderID.', hint:'RANK() OVER (PARTITION BY CustomerID ORDER BY OrderDate)', ordered:[0], sol:"SELECT OrderID, CustomerID, OrderDate,\n       RANK() OVER (PARTITION BY CustomerID ORDER BY OrderDate) AS 'Order Date Rank per Customer'\nFROM Orders\nORDER BY OrderID;"},
      {p:'Rank products within each category from most to least expensive, so tied prices share a rank and no numbers are skipped. Show CategoryID, ProductName, UnitPrice and the rank.', hint:'DENSE_RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC)', sol:"SELECT CategoryID, ProductName, UnitPrice,\n       DENSE_RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS 'Price Rank'\nFROM Products;"},
      {p:'List the three most expensive products in each category (CategoryID, ProductName, UnitPrice). If prices tie for third place, include them all.', hint:'Rank inside a subquery, then filter on the rank in the outer query: a window function can\'t go in WHERE.', sol:"SELECT CategoryID, ProductName, UnitPrice\nFROM (\n    SELECT CategoryID, ProductName, UnitPrice,\n           RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS PriceRank\n    FROM Products\n) ranked\nWHERE PriceRank <= 3;"}
    ]},

  leadlag:{title:'LEAD, LAG, FIRST_VALUE and LAST_VALUE', summary:'Look at other rows: the next, the previous, the first and the last.',
    learn:`
<p><code>LEAD()</code> looks ahead a number of rows; <code>LAG()</code> looks back. Both take three arguments: the column to return, how many rows to move, and a default for when there's no row to return.</p>
${C("SELECT ProductName, UnitPrice,\n       LEAD(ProductName, 1, NULL) OVER (ORDER BY UnitPrice) AS 'Next Product by Price',\n       LAG(UnitPrice, 1, 0)       OVER (ORDER BY UnitPrice) AS 'Previous Price'\nFROM Products;")}
<p><code>FIRST_VALUE()</code> returns a column from the first row of each partition, in the window's order:</p>
${C("SELECT ProductName, SupplierID, UnitsOnOrder,\n       FIRST_VALUE(UnitsOnOrder) OVER (PARTITION BY SupplierID ORDER BY UnitsOnOrder DESC)\n           AS 'Most Units on Order from Supplier'\nFROM Products;")}
<p>You can use the result inside other functions. Here, days since each customer's first order (T-SQL style <code>DATEDIFF</code>, which this lab accepts):</p>
${C("SELECT OrderID, CustomerID, OrderDate,\n       DATEDIFF(DAY, FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate), GETDATE())\n           AS 'Days Since First Order'\nFROM Orders\nORDER BY OrderID;")}
<h3>Spot the problem</h3>
<p>Run this. You'd expect each row to show the employee's last order, but every row just shows its own OrderID:</p>
${C("SELECT OrderID, EmployeeID,\n       LAST_VALUE(OrderID) OVER (PARTITION BY EmployeeID ORDER BY OrderID) AS 'Last Order for Employee'\nFROM Orders;")}
${TIP('Window functions have a hidden <strong>window frame</strong>. With an <code>ORDER BY</code>, the default frame runs from the start of the partition to the <em>current row</em>, so <code>LAST_VALUE</code> only ever sees up to itself. The next lesson fixes it.')}`,
    ex:[
      {p:'Show each order\'s OrderID, OrderDate and Freight, with the freight of the previous order (by OrderID). The first order has no previous one, so show NULL.', hint:'LAG(Freight, 1, NULL) OVER (ORDER BY OrderID)', sol:"SELECT OrderID, OrderDate, Freight,\n       LAG(Freight, 1, NULL) OVER (ORDER BY OrderID) AS 'Freight for Previous Order'\nFROM Orders;"},
      {p:'Show OrderID, CustomerID, EmployeeID, OrderDate and the number of days since that customer\'s first order up to today. Order by OrderID.', hint:'DATEDIFF(DAY, FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate), GETDATE())', ordered:[0], sol:"SELECT OrderID, CustomerID, EmployeeID, OrderDate,\n       DATEDIFF(DAY, FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate), GETDATE())\n           AS 'Days Since Customer First Order'\nFROM Orders\nORDER BY OrderID;"},
      {p:'Show each product\'s ProductName, CategoryID and UnitPrice, with the name of the cheapest product in its category.', hint:'FIRST_VALUE(ProductName) OVER (PARTITION BY CategoryID ORDER BY UnitPrice)', sol:"SELECT ProductName, CategoryID, UnitPrice,\n       FIRST_VALUE(ProductName) OVER (PARTITION BY CategoryID ORDER BY UnitPrice) AS 'Cheapest in Category'\nFROM Products;"}
    ]},

  frames:{title:'Window frames and moving averages', summary:'Control exactly which rows a window function looks at.',
    learn:`
<p>Alongside <code>PARTITION BY</code> and <code>ORDER BY</code>, a window has a third part: the <strong>frame</strong>, written with <code>ROWS</code> or <code>RANGE</code>.</p>
<table class="mini"><tr><th>Part</th><th>Options</th></tr>
<tr><td><code>ROWS</code> / <code>RANGE</code></td><td><code>ROWS</code> counts physical rows; <code>RANGE</code> includes every row with the same (or a nearby) <code>ORDER BY</code> value</td></tr>
<tr><td><code>BETWEEN</code> start</td><td><code>UNBOUNDED PRECEDING</code> (start of the partition), <code>n PRECEDING</code> or <code>CURRENT ROW</code></td></tr>
<tr><td><code>AND</code> end</td><td><code>CURRENT ROW</code>, <code>n FOLLOWING</code> or <code>UNBOUNDED FOLLOWING</code> (end of the partition)</td></tr></table>
<p>The default, when there's an <code>ORDER BY</code>, is <code>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code>. That's why <code>LAST_VALUE</code> returned the current row. Widen the frame to the whole partition:</p>
${C("SELECT OrderID, EmployeeID,\n       LAST_VALUE(OrderID) OVER (PARTITION BY EmployeeID ORDER BY OrderID\n           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS 'Last Order for Employee'\nFROM Orders;")}
${TIP('Another way: use <code>FIRST_VALUE</code> and reverse the <code>ORDER BY</code> (<code>ORDER BY OrderID DESC</code>).')}
<h3>Moving averages</h3>
<p>A frame of one row either side gives a 3-point moving average:</p>
${C("SELECT OrderID, OrderDate, Freight,\n       AVG(Freight) OVER (ORDER BY OrderID\n           ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS '3pt Moving Avg'\nFROM Orders;")}
<p><code>UNBOUNDED PRECEDING</code> to the current row gives a running total:</p>
${C("SELECT OrderID, Freight,\n       SUM(Freight) OVER (ORDER BY OrderID\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 'Running Total'\nFROM Orders;")}
<h3>RANGE over dates</h3>
<p>To average over <em>days</em> rather than rows (two orders on the same day both count), MySQL uses <code>RANGE</code> with <code>INTERVAL</code>:</p>
${C("SELECT OrderID, OrderDate, Freight,\n       AVG(Freight) OVER (ORDER BY OrderDate\n           RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND INTERVAL 1 DAY FOLLOWING) AS '3 day moving average'\nFROM Orders;", false, MYSQL_ONLY)}
<p>This lab does the same by ordering on the date as a day number with <code>julianday()</code>. Look at 1996-07-08, which has two orders:</p>
${C("SELECT OrderID, OrderDate, Freight,\n       AVG(Freight) OVER (ORDER BY julianday(OrderDate)\n           RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS '3 day moving average'\nFROM Orders;")}`,
    ex:[
      {p:'Fix the LAST_VALUE query: show each OrderID and EmployeeID with the last OrderID that employee handled.', hint:'Add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING inside OVER ( ).', sol:"SELECT OrderID, EmployeeID,\n       LAST_VALUE(OrderID) OVER (PARTITION BY EmployeeID ORDER BY OrderID\n           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS 'Last Order for Employee'\nFROM Orders;"},
      {p:'Total each order\'s price from `Order Details` (UnitPrice × Quantity × (1 − Discount)), join it to Orders, and show OrderID, OrderDate, the total price and a 5-point moving average of it, ordered by OrderDate then OrderID.', hint:'AVG(d.TotalPrice) OVER (ORDER BY o.OrderDate, o.OrderID ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING). The OrderID breaks ties between orders on the same day.', sol:"SELECT o.OrderID, o.OrderDate, d.TotalPrice,\n       AVG(d.TotalPrice) OVER (ORDER BY o.OrderDate, o.OrderID\n           ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING) AS '5pt Moving Average'\nFROM Orders o\nINNER JOIN (\n    SELECT OrderID, SUM(UnitPrice * Quantity * (1 - Discount)) AS TotalPrice\n    FROM [Order Details]\n    GROUP BY OrderID\n) d ON o.OrderID = d.OrderID;"},
      {p:'For orders shipped to Brazil, show OrderID, Freight and a running total of freight in OrderID order.', hint:'Filter with WHERE first: the window only sees the rows that are left.', sol:"SELECT OrderID, Freight,\n       SUM(Freight) OVER (ORDER BY OrderID ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 'Running Total'\nFROM Orders\nWHERE ShipCountry = 'Brazil';"}
    ]},

  stats:{title:'Statistical functions', summary:'Percentiles, distributions and splitting rows into bands.',
    learn:`
<p>Some window functions describe where a row sits in the whole distribution:</p>
<table class="mini"><tr><th>Function</th><th>Returns</th></tr>
<tr><td><code>CUME_DIST() OVER (ORDER BY x)</code></td><td>The fraction of rows with a value less than or equal to this one (0 to 1)</td></tr>
<tr><td><code>PERCENT_RANK() OVER (ORDER BY x)</code></td><td>The row's rank as a fraction: (rank − 1) ÷ (rows − 1), so the first row is 0 and the last is 1</td></tr>
<tr><td><code>NTILE(n) OVER (ORDER BY x)</code></td><td>Splits the rows into <em>n</em> roughly equal bands, numbered 1 to <em>n</em></td></tr></table>
${C("SELECT ProductName, UnitPrice,\n       CUME_DIST()    OVER (ORDER BY UnitPrice) AS 'Cume Dist',\n       PERCENT_RANK() OVER (ORDER BY UnitPrice) AS 'Percent Rank',\n       NTILE(4)       OVER (ORDER BY UnitPrice) AS 'Quartile'\nFROM Products;")}
${TIP('Look at how each one treats ties: tied prices get the same <code>CUME_DIST</code> and <code>PERCENT_RANK</code>, but <code>NTILE</code> can put them in different bands.')}
<h3>Percentiles in T-SQL</h3>
<p>SQL Server can also return the value <em>at</em> a percentile. <code>PERCENTILE_DISC</code> returns a value that exists in the data; <code>PERCENTILE_CONT</code> interpolates between values if it has to. <code>PERCENTILE_CONT(0.5)</code> is the median.</p>
${C("SELECT DISTINCT\n       PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY UnitPrice) OVER () AS 'Median (existing value)',\n       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY UnitPrice) OVER () AS 'Median (interpolated)'\nFROM Products;", false, TSQL_ONLY)}
<p>MySQL and this lab don't have them, but <code>CUME_DIST</code> gets you there: the median is the smallest value whose <code>CUME_DIST</code> reaches 0.5.</p>
${C("SELECT MIN(UnitPrice) AS 'Median (existing value)'\nFROM (SELECT UnitPrice, CUME_DIST() OVER (ORDER BY UnitPrice) AS cd FROM Products) t\nWHERE cd >= 0.5;")}`,
    ex:[
      {p:'Show each product\'s ProductName, UnitPrice and its PERCENT_RANK by price (cheapest is 0).', hint:'PERCENT_RANK() OVER (ORDER BY UnitPrice)', sol:"SELECT ProductName, UnitPrice,\n       PERCENT_RANK() OVER (ORDER BY UnitPrice) AS 'Percent Rank'\nFROM Products;"},
      {p:'Split products into 4 price bands with NTILE, cheapest first. Show ProductID, ProductName, UnitPrice and the band. Use ProductID to break ties.', hint:'NTILE(4) OVER (ORDER BY UnitPrice, ProductID)', sol:"SELECT ProductID, ProductName, UnitPrice,\n       NTILE(4) OVER (ORDER BY UnitPrice, ProductID) AS 'Price Band'\nFROM Products;"},
      {p:'Which orders are in the cheapest 10% by freight? Show OrderID and Freight for orders whose CUME_DIST by freight is 0.1 or less.', hint:'Work out CUME_DIST in a subquery, then filter it in the outer WHERE.', sol:"SELECT OrderID, Freight\nFROM (\n    SELECT OrderID, Freight, CUME_DIST() OVER (ORDER BY Freight) AS cd\n    FROM Orders\n) t\nWHERE cd <= 0.1;"}
    ]},

  cte:{title:'WITH (common table expressions)', summary:'Name a subquery once at the top, then use it like a table.',
    learn:`
<p><code>WITH</code> defines one or more named subqueries before the main query. SQL Server calls them <strong>common table expressions</strong> (CTEs); Oracle calls it the subquery factoring clause. They:</p>
<ul class="plain"><li>make long queries easier to read</li><li>let you define a subquery once and use it several times</li><li>disappear when the query finishes</li></ul>
<p>Here's a join to a subquery, then the same query with <code>WITH</code>:</p>
${C("SELECT ProductName\nFROM Products p\nINNER JOIN (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n) m ON p.CategoryID = m.CategoryID;")}
${C("WITH MeanAbove30 AS (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n)\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;")}
<p>Chain several with commas. Each one can use the ones before it:</p>
${C("WITH spend AS (\n    SELECT o.CustomerID, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Total\n    FROM Orders o INNER JOIN `Order Details` od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n),\naverage AS (\n    SELECT AVG(Total) AS AvgTotal FROM spend\n)\nSELECT s.CustomerID, s.Total\nFROM spend s, average a\nWHERE s.Total > a.AvgTotal\nORDER BY s.Total DESC;")}
${TIP('A CTE is a great place for a window function you want to filter on: rank in the CTE, then use <code>WHERE</code> in the main query.')}`,
    ex:[
      {p:'Using WITH, list the ProductName of every product in a category whose average unit price is above 30.', hint:'WITH MeanAbove30 AS (SELECT CategoryID FROM Products GROUP BY CategoryID HAVING AVG(UnitPrice) > 30) …', sol:"WITH MeanAbove30 AS (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n)\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;"},
      {p:'Using WITH, show the first and last name and order count of every employee who has handled more than 100 orders.', hint:'Count orders per EmployeeID in the CTE, then join it to Employees.', sol:"WITH counts AS (\n    SELECT EmployeeID, COUNT(*) AS OrderCount\n    FROM Orders\n    GROUP BY EmployeeID\n)\nSELECT e.FirstName, e.LastName, c.OrderCount\nFROM Employees e\nINNER JOIN counts c ON c.EmployeeID = e.EmployeeID\nWHERE c.OrderCount > 100;"},
      {p:'Using two chained CTEs, list each CustomerID whose total spend is above the average customer\'s total spend, with their total.', hint:'The first CTE totals spend per customer; the second averages the first.', sol:"WITH spend AS (\n    SELECT o.CustomerID, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Total\n    FROM Orders o INNER JOIN `Order Details` od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n),\naverage AS (\n    SELECT AVG(Total) AS AvgTotal FROM spend\n)\nSELECT s.CustomerID, s.Total\nFROM spend s, average a\nWHERE s.Total > a.AvgTotal;"}
    ]},

  temptables:{title:'Temporary tables', summary:'Store a result for later queries in the same session.',
    learn:`
<p>A CTE vanishes when its query ends. If you want to keep a result for <em>several</em> queries, use a temporary table. It's dropped automatically when you disconnect, or you can drop it yourself.</p>
<table class="mini"><tr><th></th><th>T-SQL</th><th>MySQL</th></tr>
<tr><td>Create from a query</td><td><code>SELECT … INTO #Name FROM …</code></td><td><code>CREATE TEMPORARY TABLE Name AS SELECT …</code></td></tr>
<tr><td>Name</td><td>Always starts with <code>#</code>; <code>##</code> makes it global</td><td>Any name</td></tr>
<tr><td>Stored in</td><td><code>tempdb</code></td><td>The session</td></tr>
<tr><td>Who can see it</td><td>Only your connection (unless <code>##</code>)</td><td>Only your session</td></tr></table>
<p>This lab accepts both. Here's the T-SQL way: the first statement stores the table, the second uses it.</p>
${C("DROP TABLE IF EXISTS #MeanAbove30;\n\nSELECT CategoryID INTO #MeanAbove30\nFROM Products\nGROUP BY CategoryID HAVING AVG(UnitPrice) > 30;\n\nSELECT ProductName\nFROM Products p\nINNER JOIN #MeanAbove30 m ON p.CategoryID = m.CategoryID;")}
<p>Now it exists, you can query it on its own:</p>
${C("SELECT * FROM #MeanAbove30;")}
<p>And the MySQL way:</p>
${C("DROP TABLE IF EXISTS OrderCounts;\n\nCREATE TEMPORARY TABLE OrderCounts AS\nSELECT CustomerID, COUNT(*) AS Orders\nFROM Orders GROUP BY CustomerID;\n\nSELECT * FROM OrderCounts ORDER BY Orders DESC;")}
${TIP('Creating a temporary table that already exists gives an error, so start with <code>DROP TABLE IF EXISTS</code>. In this lab, temporary tables last until you reload the page.')}`,
    ex:[
      {p:'Store the CategoryIDs whose average unit price is above 30 in a temporary table called #MeanAbove30, then use it to list the matching ProductNames.', hint:'SELECT CategoryID INTO #MeanAbove30 … then join Products to #MeanAbove30. Start with DROP TABLE IF EXISTS #MeanAbove30.', sol:"DROP TABLE IF EXISTS #MeanAbove30;\nSELECT CategoryID INTO #MeanAbove30\nFROM Products\nGROUP BY CategoryID HAVING AVG(UnitPrice) > 30;\nSELECT ProductName\nFROM Products p\nINNER JOIN #MeanAbove30 m ON p.CategoryID = m.CategoryID;"},
      {p:'Using CREATE TEMPORARY TABLE, store each CustomerID with its number of orders in a table called OrderCounts. Then list the customers with more than 20 orders.', hint:'CREATE TEMPORARY TABLE OrderCounts AS SELECT CustomerID, COUNT(*) AS Orders FROM Orders GROUP BY CustomerID;', sol:"DROP TABLE IF EXISTS OrderCounts;\nCREATE TEMPORARY TABLE OrderCounts AS\nSELECT CustomerID, COUNT(*) AS Orders\nFROM Orders GROUP BY CustomerID;\nSELECT CustomerID, Orders FROM OrderCounts WHERE Orders > 20;"}
    ]},

  pivot:{title:'Pivoting: long and wide data', summary:'Turn rows into columns, and columns back into rows.',
    learn:`
<p>To <strong>pivot</strong> is to move data from rows into columns: from <em>long</em> format to <em>wide</em>. <strong>Unpivoting</strong> goes the other way. Which you want depends on what the data is for.</p>
<div class="two-tables"><table class="mini"><tr><th>Student</th><th>Subject</th><th>Score</th></tr><tr><td>Alice</td><td>English</td><td>60</td></tr><tr><td>Alice</td><td>Maths</td><td>70</td></tr><tr><td>Bob</td><td>English</td><td>72</td></tr><tr><td>Bob</td><td>Maths</td><td>83</td></tr></table>
<table class="mini"><tr><th>Student</th><th>English</th><th>Maths</th></tr><tr><td>Alice</td><td>60</td><td>70</td></tr><tr><td>Bob</td><td>72</td><td>83</td></tr></table></div>
<h3>T-SQL: PIVOT and UNPIVOT</h3>
<p>SQL Server has operators for both. <code>PIVOT</code> needs an aggregate, in case more than one value lands in a cell:</p>
${C("SELECT CompanyName, ContactType, ContactNumber\nFROM Customers\nUNPIVOT (ContactNumber FOR ContactType IN (Phone, Fax)) u;", false, TSQL_ONLY)}
${C("SELECT CompanyName, Phone, Fax\nFROM #Contacts\nPIVOT (MAX(ContactNumber) FOR ContactType IN (Phone, Fax)) p;", false, TSQL_ONLY)}
<h3>Everywhere else: CASE and UNION ALL</h3>
<p>MySQL and this lab have no <code>PIVOT</code>, but the same results come from tools you know. Pivot with an aggregate around a <code>CASE</code>, one per new column:</p>
${C("WITH scores AS (\n    SELECT 'Alice' AS Student, 'English' AS Subject, 60 AS Score UNION ALL\n    SELECT 'Alice', 'Maths', 70 UNION ALL\n    SELECT 'Bob',   'English', 72 UNION ALL\n    SELECT 'Bob',   'Maths', 83\n)\nSELECT Student,\n       MAX(CASE WHEN Subject = 'English' THEN Score END) AS English,\n       MAX(CASE WHEN Subject = 'Maths'   THEN Score END) AS Maths\nFROM scores\nGROUP BY Student;")}
<p>Unpivot with one <code>SELECT</code> per column, stacked with <code>UNION ALL</code>:</p>
${C("SELECT CompanyName, 'Phone' AS ContactType, Phone AS ContactNumber FROM Customers\nUNION ALL\nSELECT CompanyName, 'Fax', Fax FROM Customers\nORDER BY CompanyName;")}
${TIP('This approach works in every dialect, including SQL Server, so it\'s worth knowing even if you use T-SQL.')}`,
    ex:[
      {p:'Unpivot the order dates: for every order show OrderID, a DateType (OrderDate, RequiredDate or ShippedDate) and the Date.', hint:'Three SELECTs, one per date column, joined with UNION ALL.', sol:"SELECT OrderID, 'OrderDate' AS DateType, OrderDate AS Date FROM Orders\nUNION ALL\nSELECT OrderID, 'RequiredDate', RequiredDate FROM Orders\nUNION ALL\nSELECT OrderID, 'ShippedDate', ShippedDate FROM Orders;"},
      {p:'Pivot the number of orders each shipper (ShipVia) carried into one column per year: ShipVia, 1996, 1997 and 1998.', hint:"SUM(CASE WHEN YEAR(OrderDate) = 1996 THEN 1 ELSE 0 END) AS '1996', and so on, grouped by ShipVia.", sol:"SELECT ShipVia,\n       SUM(CASE WHEN YEAR(OrderDate) = 1996 THEN 1 ELSE 0 END) AS '1996',\n       SUM(CASE WHEN YEAR(OrderDate) = 1997 THEN 1 ELSE 0 END) AS '1997',\n       SUM(CASE WHEN YEAR(OrderDate) = 1998 THEN 1 ELSE 0 END) AS '1998'\nFROM Orders\nGROUP BY ShipVia;"},
      {p:'For each CategoryName, show how many products are active and how many are discontinued, as two columns.', hint:'Join Products to Categories, group by CategoryName, and use SUM(CASE WHEN Discontinued = … THEN 1 ELSE 0 END) twice.', sol:"SELECT c.CategoryName,\n       SUM(CASE WHEN p.Discontinued = 0 THEN 1 ELSE 0 END) AS 'Active',\n       SUM(CASE WHEN p.Discontinued = 1 THEN 1 ELSE 0 END) AS 'Discontinued'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;"}
    ]},

  performance:{title:'Performance tuning and indexes', summary:'Find out why a query is slow, and use an index to fix it.',
    learn:`
<p>Tuning is less about tricks and more about a process. Like diagnosing a slow car, you find the cause before swapping parts:</p>
<ol class="order"><li>Identify the slow queries</li><li>Understand what the database is doing</li><li>Fix the root cause</li><li>Check it's actually faster</li></ol>
<h3>Indexes</h3>
<p>An index is like the index at the back of a book: instead of reading every page, the database jumps to the right one.</p>
<table class="mini"><tr><th>Index</th><th>What it is</th></tr>
<tr><td>Clustered</td><td>Sets the physical order of the table's rows, so there's only one. Usually the primary key.</td></tr>
<tr><td>Non-clustered / secondary</td><td>A separate structure holding the indexed values and a pointer to each row. A table can have many.</td></tr>
<tr><td>Unique</td><td>Also stops duplicate values.</td></tr>
<tr><td>Composite</td><td>Covers several columns. It helps queries that filter on the first (leftmost) column(s).</td></tr>
<tr><td>Full-text</td><td>For searching words in text; much faster than <code>LIKE '%word%'</code>.</td></tr>
<tr><td>Spatial</td><td>For geographic data such as coordinates.</td></tr></table>
<p>Indexes speed up reads but slow down inserts and updates, because every index must be kept up to date. Index the columns you filter, join and sort on, not everything.</p>
<h3>Scans and seeks</h3>
<table class="mini"><tr><th>How rows are found</th><th>MySQL <code>EXPLAIN</code> type</th><th>This lab's plan says</th><th>Good?</th></tr>
<tr><td>Table scan: read every row</td><td><code>ALL</code></td><td><code>SCAN Orders</code></td><td>Fine for small tables; bad for big ones</td></tr>
<tr><td>Index scan: read the whole index</td><td><code>index</code></td><td><code>SCAN Orders USING INDEX …</code></td><td>Better, but still reads everything</td></tr>
<tr><td>Index seek: jump to the right rows</td><td><code>ref</code>, <code>range</code>, <code>const</code>, <code>eq_ref</code></td><td><code>SEARCH Orders USING INDEX …</code></td><td>What you want</td></tr>
<tr><td>Sorting without an index</td><td><code>Using filesort</code> in Extra</td><td><code>USE TEMP B-TREE FOR ORDER BY</code></td><td>A warning sign on big tables</td></tr>
<tr><td>A temporary table for grouping</td><td><code>Using temporary</code> in Extra</td><td><code>USE TEMP B-TREE FOR GROUP BY</code></td><td>A warning sign on big tables</td></tr></table>
<h3>Reading a plan</h3>
<p>In MySQL, put <code>EXPLAIN</code> (or <code>EXPLAIN ANALYZE</code>) before a query, or use Workbench's execution-plan button. In SQL Server, turn on the actual execution plan in SSMS. This lab accepts <code>EXPLAIN</code> and shows SQLite's plan:</p>
${C("EXPLAIN SELECT * FROM Customers WHERE City = 'London';")}
<p>It scans the whole table. Add an index on <code>City</code>, then explain the same query again:</p>
${C("CREATE INDEX IF NOT EXISTS idx_customer_city ON Customers(City);\n\nEXPLAIN SELECT * FROM Customers WHERE City = 'London';")}
<p>List the indexes on a table with MySQL's <code>SHOW INDEX</code>:</p>
${C("SHOW INDEX FROM Customers;")}
${TIP('Indexes you create here last until you reload the page. In MySQL, the key columns to read in <code>EXPLAIN</code> are <code>type</code>, <code>key</code> (the index used, or NULL), <code>rows</code> (rows it expects to read) and <code>Extra</code>.')}`,
    ex:[
      {p:'Use EXPLAIN to see how the database finds the orders for customer ALFKI (SELECT * FROM Orders WHERE CustomerID = \'ALFKI\'). If you haven\'t created an index yet, it should scan the whole table.', hint:"EXPLAIN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';", sol:"EXPLAIN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';"},
      {p:'Create an index called idx_orders_customerid on Orders(CustomerID), then EXPLAIN the same query so it uses the index.', hint:'CREATE INDEX IF NOT EXISTS idx_orders_customerid ON Orders(CustomerID); then the EXPLAIN. The plan should say SEARCH … USING INDEX.', sol:"CREATE INDEX IF NOT EXISTS idx_orders_customerid ON Orders(CustomerID);\nEXPLAIN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';"},
      {p:'Investigate the indexes on the `Order Details` table with SHOW INDEX.', hint:'SHOW INDEX FROM `Order Details`;', sol:'SHOW INDEX FROM `Order Details`;'}
    ]},

  cp5:{title:'Checkpoint: advanced', summary:'Window functions, CTEs and pivots together.', checkpoint:true,
    ex:[
      {p:'For each category, show the CategoryName and the name and price of its most expensive product.', hint:'Rank products by price within each category in a CTE, then keep rank 1 and join to Categories.', sol:"WITH ranked AS (\n    SELECT CategoryID, ProductName, UnitPrice,\n           RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS r\n    FROM Products\n)\nSELECT c.CategoryName, ranked.ProductName, ranked.UnitPrice\nFROM ranked\nINNER JOIN Categories c ON c.CategoryID = ranked.CategoryID\nWHERE r = 1;"},
      {p:'For 1997, show each EmployeeID, month number and number of orders, with the change from that employee\'s previous month.', hint:'Count orders per employee per month in a CTE, then use LAG(Orders) OVER (PARTITION BY EmployeeID ORDER BY Month).', sol:"WITH monthly AS (\n    SELECT EmployeeID, MONTH(OrderDate) AS Month, COUNT(*) AS Orders\n    FROM Orders\n    WHERE YEAR(OrderDate) = 1997\n    GROUP BY EmployeeID, MONTH(OrderDate)\n)\nSELECT EmployeeID, Month, Orders,\n       Orders - LAG(Orders) OVER (PARTITION BY EmployeeID ORDER BY Month) AS 'Change'\nFROM monthly;"},
      {p:'Pivot each employee\'s total freight into one column per year: EmployeeID, 1996, 1997 and 1998.', hint:"SUM(CASE WHEN YEAR(OrderDate) = 1996 THEN Freight ELSE 0 END) AS '1996', and so on.", sol:"SELECT EmployeeID,\n       SUM(CASE WHEN YEAR(OrderDate) = 1996 THEN Freight ELSE 0 END) AS '1996',\n       SUM(CASE WHEN YEAR(OrderDate) = 1997 THEN Freight ELSE 0 END) AS '1997',\n       SUM(CASE WHEN YEAR(OrderDate) = 1998 THEN Freight ELSE 0 END) AS '1998'\nFROM Orders\nGROUP BY EmployeeID;"}
    ]}
};
const PATH = UNITS.flatMap(u=>u.lessons.map(id=>({id, unit:u})));
