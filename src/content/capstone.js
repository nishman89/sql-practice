/* ---------- Capstone project ----------
   From the Sparta Global "SQL Project v3" brief. Done in the learner's own SQL Server, MySQL or SQLite, not in this site.
   Expected results come from the project's answer sheet (checked against Northwind). Model answers stay with trainers. */
const CAP_Q = (n, task, check, revise) => `<li class="cap-q" data-testid="capstone-q-${n.replace('.','-')}"><div class="cap-n">${n}</div><div><p>${task}</p>${check?`<div class="cap-check"><b>Check your answer</b>${check}</div>`:''}${revise?`<p class="cap-revise">Revise: ${revise}</p>`:''}</div></li>`;
const REV = (id, title) => `<a href="#/lesson/${id}">${title}</a>`;

const CAPSTONE_HTML = `
<p class="lede">Bring everything together on a real database: design and build tables of your own, then answer business questions about Northwind. This project is done in <strong>your own copy of SQL Server, MySQL or SQLite</strong>, not in this website.</p>

<section class="cap-before" data-testid="capstone-before">
  <h2>Before you start</h2>
  <p>You'll need SQL Server, MySQL or SQLite on your computer, with the Northwind database loaded. If you haven't done that yet, follow one of the <a href="#/install" data-testid="capstone-install-link">Install on your computer</a> guides first:</p>
  <ul class="plain">
    <li><strong>🪟 SQL Server with Docker and VS Code</strong>: Windows or Mac, with Northwind ready to use</li>
    <li><strong>🪟 SQL Server on Windows</strong> with SSMS</li>
    <li><strong>🐬 MySQL</strong> on Windows or Mac with MySQL Workbench, or in Docker</li>
    <li><strong>🪶 SQLite</strong> with DB Browser for SQLite: the quickest set-up, using the same Northwind as this site</li>
  </ul>
  <p>You're ready when this query returns ten customers in your own tool:</p>
  ${DIFF({sqlite:'SELECT CompanyName, City FROM Customers LIMIT 10;', mysql:'USE northwind;\nSELECT CompanyName, City FROM Customers LIMIT 10;', tsql:'USE Northwind;\nSELECT TOP 10 CompanyName, City FROM Customers;'})}
  ${TIP('Ask your trainer whether your course uses SQL Server, MySQL or SQLite. Any of them is fine for this project, but use the same one throughout. In SQLite, one question (2.9) works a little differently, as it explains.')}
</section>

<h2 class="dot">What you'll hand in</h2>
<table class="mini"><tr><th>File</th><th>Contains</th></tr>
<tr><td><code>exercise1.sql</code></td><td>Your <code>CREATE TABLE</code> and <code>INSERT</code> statements for exercise 1</td></tr>
<tr><td><code>exercise1-erd.png</code> (or PDF)</td><td>Your ERD for question 1.3, with a few sentences explaining your design</td></tr>
<tr><td><code>exercise2.sql</code></td><td>One query per question in exercise 2, each with a comment above it, such as <code>-- Question 2.1</code></td></tr>
<tr><td><code>exercise3.sql</code> (optional)</td><td>Your answers to the optional exercise 3, in the same style</td></tr></table>
<p>Your trainer will tell you how to submit them, for example in a GitHub repository. Make sure every script runs from top to bottom without errors.</p>

<h2 class="dot">Exercise 1: Spartans and courses</h2>
<p class="cap-when">Do this after <strong>Unit 1: Foundations</strong>.</p>
<ol class="cap-list">
${CAP_Q('1.1', 'Write the SQL statements to create two tables:<br><strong>Course</strong>: the courses at Sparta Global, with a course ID (for example <code>TECH 200</code>), course name (for example <em>C# Development</em>), trainer and start date. Add any other columns you think are useful.<br><strong>Spartan</strong>: fictional Spartans, with an ID, title, first name, middle name (optional) and last name, plus a <strong>foreign key</strong> to the Course table. Add any other columns you think are useful.', 'Each table has a primary key, sensible data types, <code>NOT NULL</code> on the columns that must have a value, and the foreign key from Spartan to Course.', `${REV('build','Creating tables')}, ${REV('datatypes','Data types')}`)}
${CAP_Q('1.2', 'Write the SQL statements to add some fictional Spartans and courses to your tables.', 'Add at least three courses and enough Spartans that every course has someone on it. Run <code>SELECT * FROM</code> each table to check, and try adding a Spartan on a course that doesn\'t exist: your foreign key should stop it. (In SQLite, run <code>PRAGMA foreign_keys = ON;</code> first if it doesn\'t.)', REV('changedata','Inserting, updating and deleting data'))}
${CAP_Q('1.3', 'A real academy has many trainers and many courses, each course runs many times (an <em>instance</em> of a course, such as the October intake), and each instance can be taught by several trainers. How could your database be improved to model this? Draw an <strong>ERD</strong> of your design.', 'Use crow\'s foot notation. Where two things have a many-to-many relationship, such as course instances and trainers, you\'ll need a junction table in between. The easiest way is the <a href="#/erd-maker" data-testid="capstone-erd-maker">ERD maker</a> on this site: write the <code>CREATE TABLE</code> statements for your design, arrange the tables and download the diagram. You can also use <a href="https://app.diagrams.net/" target="_blank" rel="noopener">draw.io</a>, Lucidchart or paper.', REV('erd','Entity relationship diagrams'))}
</ol>

<h2 class="dot">Exercise 2: Northwind queries</h2>
<p class="cap-when">Do this after <strong>Unit 6: Going further</strong>.</p>
<ol class="cap-list">
${CAP_Q('2.1', 'List all customers in either Paris or London. Include the customer ID, company name and address fields (address, city, postal code and country).', '<strong>8 rows</strong>, from AROUT (Around the Horn, London) to SPECD (Spécialités du monde, Paris).', `${REV('operators','Operators')} (IN)`)}
${CAP_Q('2.2', 'List all products stored in bottles.', '<strong>12 rows</strong>, starting with Chang (24 - 12 oz bottles) and Aniseed Syrup (12 - 550 ml bottles). Look closely at Chartreuse verte: "750 cc per bottle".', REV('wildcards','Wildcards'))}
${CAP_Q('2.3', 'Repeat question 2.2, but add the supplier\'s name and country.', '<strong>12 rows</strong>. Chang and Aniseed Syrup are both from Exotic Liquids, UK.', REV('innerjoin','Inner joins'))}
${CAP_Q('2.4', 'Show how many products there are in each category. Include the category name, and list the category with the most products first.', '<strong>8 rows</strong>: Confections 13, then Beverages, Condiments and Seafood with 12 each, Dairy Products 10, Grains/Cereals 7, Meat/Poultry 6 and Produce 5.', `${REV('groupby','GROUP BY')}, ${REV('innerjoin','Inner joins')}`)}
${CAP_Q('2.5', 'List all UK employees, joining their title of courtesy, first name and last name into one column. Also include their city.', '<strong>4 rows</strong>: Mr. Steven Buchanan, Mr. Michael Suyama, Mr. Robert King and Ms. Anne Dodsworth, all in London.', REV('concat','Concatenation'))}
${CAP_Q('2.6', 'Count how many orders have a freight amount greater than 100.00 and either USA or UK as the ship country.', '<strong>49</strong>.', `${REV('aggregates','Aggregate functions')}, ${REV('operators','Operators')}`)}
${CAP_Q('2.7', 'Find the order line in Order Details with the highest discount <em>amount</em> (unit price × quantity × discount). Show the order ID of the order it belongs to, and the discount amount.', 'Two order lines tie on <strong>$2,108.00</strong>: orders <strong>10353</strong> and <strong>10372</strong>. Show both. (Don\'t sort by the discount <em>rate</em>: 154 lines tie at 25%.)', `${REV('arithmetic','Arithmetic operators')}, ${REV('distinct','Removing duplicates and limiting results')}`)}
${CAP_Q('2.8', 'Create a view that lists every employee and who they report to. Then query the view.', '<strong>9 rows</strong>. Five people report to Andrew Fuller and three to Steven Buchanan. Andrew Fuller reports to nobody, so if he\'s missing, think about which kind of join keeps him. Sort the rows in the query that reads the view: SQL Server doesn\'t allow <code>ORDER BY</code> inside a view.', `${REV('views','Views')}, ${REV('leftjoin','Left joins')}`)}
${CAP_Q('2.9', '<strong>🪟 SQL Server or 🐬 MySQL:</strong> create a stored procedure called <code>CustomerTotalFreightAmount</code> that takes a customer ID as a parameter and returns that customer\'s total freight amount (from the Orders table). Run it for customer <code>ALFKI</code>.<br><strong>🪶 SQLite</strong> has no stored procedures, so instead create a view called <code>CustomerTotalFreightAmount</code> that shows each customer ID with its total freight, then query it for <code>ALFKI</code>. Add a comment explaining how a stored procedure would do the same job differently.', 'A total of <strong>225.58</strong>. To see what you made: in SSMS, expand Northwind → Programmability → Stored Procedures; in VS Code, refresh the connection; in MySQL Workbench, expand northwind → Stored Procedures in the Schemas panel; in DB Browser for SQLite, look under Views on the Database Structure tab.', `${REV('procedures','Stored procedures')}, ${REV('views','Views')}`)}
${CAP_Q('2.10', 'Create an index called <code>idx_orders_shipcountry</code> on the ShipCountry column of Orders. Then show the query plan for <code>SELECT OrderID, ShipCountry FROM Orders WHERE ShipCountry = \'UK\'</code> and check the index is used.', 'The plan uses <strong>idx_orders_shipcountry</strong>. In 🪶 SQLite, <code>EXPLAIN QUERY PLAN</code> shows <em>SEARCH Orders USING COVERING INDEX idx_orders_shipcountry</em>; in 🐬 MySQL, <code>EXPLAIN</code> shows it in the <em>key</em> column; in 🪟 SQL Server, the execution plan shows an <em>Index Seek</em> on it. In a comment, say why searching with the index is faster than scanning the table.', REV('indexes','Indexes'))}
</ol>

<h2 class="dot">Exercise 3: Advanced topics (optional)</h2>
<p class="cap-when">Do this after <strong>Unit 7: Advanced topics</strong>.</p>
<div class="cap-optional" data-testid="capstone-optional"><b>Optional, but recommended</b> if you want to practise the advanced topics: window functions, <code>WITH</code>, temporary tables and pivoting. It isn't needed to complete the project. You'll need MySQL 8 or later, SQL Server 2012 or later, or SQLite 3.25 or later; every install guide gives you one of these. Revenue means <code>UnitPrice × Quantity × (1 − Discount)</code> from Order Details.</div>
<ol class="cap-list">
${CAP_Q('3.1', 'For each category, find its best-selling product by revenue. Show the category name, product name and revenue.', '<strong>8 rows</strong>, one per category. For example, Beverages: Côte de Blaye with <strong>141,396.73</strong>; Seafood: Carnarvon Tigers with 29,171.88.', `${REV('ranking','Ranking functions')}, ${REV('cte','Common table expressions')}`)}
${CAP_Q('3.2', 'Show the total sales for each month of 1997, with a running total.', '<strong>12 rows</strong>. January is <strong>61,258.07</strong>, February 38,483.64 (running total 99,741.71), and the running total reaches <strong>617,085.20</strong> in December.', `${REV('frames','Window frames')}, ${REV('datesstrings','Date and string functions')}`)}
${CAP_Q('3.3', 'Show the number of orders placed in each month of 1997, and the change from the month before.', '<strong>12 rows</strong>. January has 33 orders (no previous month), February 29 (<strong>−4</strong>), and December 48 (<strong>+14</strong>), the biggest jump.', REV('leadlag','Comparing rows'))}
${CAP_Q('3.4', 'Using a common table expression or a temporary table, list the customers whose total spend is above the average customer\'s total spend, highest first.', '<strong>30 customers</strong> (the average is 14,222.39). QUICK-Stop is first with <strong>110,277.30</strong>, then Ernst Handel and Save-a-lot Markets.', `${REV('cte','Common table expressions')}, ${REV('temptables','Temporary tables')}`)}
${CAP_Q('3.5', 'Pivot the number of orders each shipper carried into one column per year: shipper name, then 1996, 1997 and 1998.', '<strong>3 rows</strong>: Federal Shipping 58, 122, 75; Speedy Express 38, 133, 78; United Package 56, 153, 117.', REV('pivot','Pivoting'))}
</ol>

<h2 class="dot">MySQL and T-SQL reminders</h2>
<p>The differences between 🪶 SQLite, 🐬 MySQL and 🪟 T-SQL that matter most for this project:</p>
${DIFF({title:'Joining text (2.5, 2.8)', common:"CONCAT(FirstName, ' ', LastName)", otherTitle:'Each dialect\'s shortcut', sqlite:"FirstName || ' ' || LastName", mysql:'~None: use CONCAT()', tsql:"FirstName + ' ' + LastName"})}
${DIFF({title:'Returning the top rows, including ties (2.7)', sqlite:'ORDER BY … DESC\nLIMIT 2', mysql:'ORDER BY … DESC\nLIMIT 2', tsql:'SELECT TOP 1 WITH TIES …\nORDER BY … DESC', note:'T-SQL\'s <code>WITH TIES</code> keeps every row that ties for last place, so you don\'t have to know there are two.'})}
${DIFF({title:'Table names with spaces (2.7)', sqlite:'"Order Details"', mysql:'`Order Details`', tsql:'[Order Details]'})}
${DIFF({title:'Showing money (2.7)', sqlite:"printf('$%,.2f', amount)", mysql:"CONCAT('$', FORMAT(amount, 2))", tsql:"FORMAT(amount, 'C')"})}
${DIFF({title:'Creating and running a stored procedure (2.9)', sqlite:'-- No stored procedures: use a view\nCREATE VIEW name AS\nSELECT CustomerID, SUM(Freight) AS TotalFreight\nFROM Orders GROUP BY CustomerID;\n\nSELECT * FROM name WHERE CustomerID = \'ALFKI\';', mysql:'DELIMITER //\nCREATE PROCEDURE name(IN p_CustomerID CHAR(5))\nBEGIN\n    …\nEND //\nDELIMITER ;\n\nCALL name(\'ALFKI\');', tsql:'CREATE PROCEDURE name\n    @CustomerID NCHAR(5)\nAS\nBEGIN\n    …\nEND;\n\nEXEC name @CustomerID = \'ALFKI\';'})}
${DIFF({title:'Query plans (2.10)', sqlite:'EXPLAIN QUERY PLAN SELECT …;', mysql:'EXPLAIN SELECT …;', tsql:'-- Turn on the execution plan (SSMS: Ctrl + M), then run the query'})}
${DIFF({title:'Years and months (3.2, 3.3)', sqlite:"strftime('%Y', OrderDate) = '1997'\nstrftime('%m', OrderDate)", mysql:'YEAR(OrderDate) = 1997\nMONTH(OrderDate)', tsql:'YEAR(OrderDate) = 1997\nMONTH(OrderDate)'})}
${TIP('A view can\'t contain <code>ORDER BY</code> in SQL Server (SQLite and MySQL allow it). Put the <code>ORDER BY</code> in the query that selects from the view instead, and it works everywhere.')}
<p class="small">Model answers are held by your trainer.</p>`;

/* [id, label, optional?]. Optional tasks (exercise 3) don't count towards completing the project. */
const CAPSTONE_TASKS = [
  ['setup','My SQL Server, MySQL or SQLite runs, with Northwind loaded'],
  ['1.1','1.1 Course and Spartan tables created'],
  ['1.2','1.2 Courses and Spartans added'],
  ['1.3','1.3 ERD of the improved design drawn and explained'],
  ['2.1','2.1 Customers in Paris or London'],['2.2','2.2 Products in bottles'],['2.3','2.3 Bottles with supplier and country'],
  ['2.4','2.4 Products per category'],['2.5','2.5 UK employees'],['2.6','2.6 Orders over 100 to the USA or UK'],
  ['2.7','2.7 Highest discount amount'],['2.8','2.8 Employees view'],['2.9','2.9 CustomerTotalFreightAmount procedure'],
  ['2.10','2.10 Index on ShipCountry'],
  ['3.1','3.1 Best-selling product per category',true],['3.2','3.2 Monthly sales with a running total',true],['3.3','3.3 Orders per month and the change',true],
  ['3.4','3.4 Customers above average spend',true],['3.5','3.5 Orders per shipper per year',true],
  ['submit','Scripts and ERD handed in']
];
