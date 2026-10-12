/* ---------- Capstone project ----------
   From the Sparta Global "SQL Project v3" brief. Done in the learner's own SQL Server or MySQL, not in this site.
   Expected results come from the project's answer sheet (checked against Northwind). Model answers stay with trainers. */
const CAP_Q = (n, task, check, revise) => `<li class="cap-q" data-testid="capstone-q-${n.replace('.','-')}"><div class="cap-n">${n}</div><div><p>${task}</p>${check?`<div class="cap-check"><b>Check your answer</b>${check}</div>`:''}${revise?`<p class="cap-revise">Revise: ${revise}</p>`:''}</div></li>`;
const REV = (id, title) => `<a href="#/lesson/${id}">${title}</a>`;

const CAPSTONE_HTML = `
<p class="lede">Bring everything together on a real database: design and build tables of your own, then answer business questions about Northwind. This project is done in <strong>your own copy of SQL Server or MySQL</strong>, not in this website.</p>

<section class="cap-before" data-testid="capstone-before">
  <h2>Before you start</h2>
  <p>You'll need SQL Server or MySQL installed on your computer, with the Northwind database loaded. If you haven't done that yet, follow one of the <a href="#/install" data-testid="capstone-install-link">Install on your computer</a> guides first:</p>
  <ul class="plain">
    <li><strong>🪟 SQL Server with Docker and VS Code</strong>: Windows or Mac, with Northwind ready to use</li>
    <li><strong>🪟 SQL Server on Windows</strong> with SSMS</li>
    <li><strong>🐬 MySQL</strong> on Windows or Mac with MySQL Workbench, or in Docker</li>
  </ul>
  <p>You're ready when this query returns ten customers in your own tool:</p>
  ${DIFF({sqlite:null, mysql:'USE northwind;\nSELECT CompanyName, City FROM Customers LIMIT 10;', tsql:'USE Northwind;\nSELECT TOP 10 CompanyName, City FROM Customers;'})}
  ${TIP('Ask your trainer whether your course uses SQL Server or MySQL. Either is fine for this project, but use the same one throughout.')}
</section>

<h2 class="dot">What you'll hand in</h2>
<table class="mini"><tr><th>File</th><th>Contains</th></tr>
<tr><td><code>exercise1.sql</code></td><td>Your <code>CREATE TABLE</code> and <code>INSERT</code> statements for exercise 1</td></tr>
<tr><td><code>exercise1-erd.png</code> (or PDF)</td><td>Your ERD for question 1.3, with a few sentences explaining your design</td></tr>
<tr><td><code>exercise2.sql</code></td><td>One query per question in exercise 2, each with a comment above it, such as <code>-- Question 2.1</code></td></tr></table>
<p>Your trainer will tell you how to submit them, for example in a GitHub repository. Make sure every script runs from top to bottom without errors.</p>

<h2 class="dot">Exercise 1: Spartans and courses</h2>
<p class="cap-when">Do this after <strong>Unit 1: Foundations</strong>.</p>
<ol class="cap-list">
${CAP_Q('1.1', 'Write the SQL statements to create two tables:<br><strong>Course</strong>: the courses at Sparta Global, with a course ID (for example <code>TECH 200</code>), course name (for example <em>C# Development</em>), trainer and start date. Add any other columns you think are useful.<br><strong>Spartan</strong>: fictional Spartans, with an ID, title, first name, middle name (optional) and last name, plus a <strong>foreign key</strong> to the Course table. Add any other columns you think are useful.', 'Each table has a primary key, sensible data types, <code>NOT NULL</code> on the columns that must have a value, and the foreign key from Spartan to Course.', `${REV('build','Creating tables')}, ${REV('datatypes','Data types')}`)}
${CAP_Q('1.2', 'Write the SQL statements to add some fictional Spartans and courses to your tables.', 'Add at least three courses and enough Spartans that every course has someone on it. Run <code>SELECT * FROM</code> each table to check, and try adding a Spartan on a course that doesn\'t exist: your foreign key should stop it.', REV('changedata','Inserting, updating and deleting data'))}
${CAP_Q('1.3', 'A real academy has many trainers and many courses, each course runs many times (an <em>instance</em> of a course, such as the October intake), and each instance can be taught by several trainers. How could your database be improved to model this? Draw an <strong>ERD</strong> of your design.', 'Use crow\'s foot notation. Where two things have a many-to-many relationship, such as course instances and trainers, you\'ll need a junction table in between. You can draw it in <a href="https://app.diagrams.net/" target="_blank" rel="noopener">draw.io</a>, Lucidchart, MySQL Workbench or on paper.', REV('erd','Entity relationship diagrams'))}
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
${CAP_Q('2.8', 'Create a view that lists every employee and who they report to. Then query the view.', '<strong>9 rows</strong>. Five people report to Andrew Fuller and three to Steven Buchanan. Andrew Fuller reports to nobody, so if he\'s missing, think about which kind of join keeps him.', `${REV('views','Views')}, ${REV('leftjoin','Left joins')}`)}
${CAP_Q('2.9', 'Create a stored procedure called <code>CustomerTotalFreightAmount</code> that takes a customer ID as a parameter and returns that customer\'s total freight amount (from the Orders table). Run it for customer <code>ALFKI</code>.', 'A total of <strong>225.58</strong>. To see your procedure afterwards: in SSMS, expand Northwind → Programmability → Stored Procedures; in VS Code, refresh the connection; in MySQL Workbench, expand northwind → Stored Procedures in the Schemas panel.', REV('procedures','Stored procedures'))}
</ol>

<h2 class="dot">MySQL and T-SQL reminders</h2>
<p>You'll be writing 🐬 MySQL or 🪟 T-SQL here, not SQLite. The differences that matter most for this project:</p>
${DIFF({title:'Joining text (2.5, 2.8)', mysql:"CONCAT(FirstName, ' ', LastName)", tsql:"FirstName + ' ' + LastName\n-- or CONCAT(FirstName, ' ', LastName)"})}
${DIFF({title:'Returning the top rows, including ties (2.7)', mysql:'ORDER BY … DESC\nLIMIT 2', tsql:'SELECT TOP 1 WITH TIES …\nORDER BY … DESC', note:'T-SQL\'s <code>WITH TIES</code> keeps every row that ties for last place, so you don\'t have to know there are two.'})}
${DIFF({title:'Table names with spaces (2.7)', mysql:'`Order Details`', tsql:'[Order Details]'})}
${DIFF({title:'Showing money (2.7)', mysql:"CONCAT('$', FORMAT(amount, 2))", tsql:"FORMAT(amount, 'C')"})}
${DIFF({title:'Creating and running a stored procedure (2.9)', mysql:'DELIMITER //\nCREATE PROCEDURE name(IN p_CustomerID CHAR(5))\nBEGIN\n    …\nEND //\nDELIMITER ;\n\nCALL name(\'ALFKI\');', tsql:'CREATE PROCEDURE name\n    @CustomerID NCHAR(5)\nAS\nBEGIN\n    …\nEND;\n\nEXEC name @CustomerID = \'ALFKI\';'})}
${TIP('A view can\'t contain <code>ORDER BY</code> in SQL Server. Put the <code>ORDER BY</code> in the query that selects from the view instead.')}
<p class="small">Model answers are held by your trainer.</p>`;

const CAPSTONE_TASKS = [
  ['setup','My SQL Server or MySQL runs, with Northwind loaded'],
  ['1.1','1.1 Course and Spartan tables created'],
  ['1.2','1.2 Courses and Spartans added'],
  ['1.3','1.3 ERD of the improved design drawn and explained'],
  ['2.1','2.1 Customers in Paris or London'],['2.2','2.2 Products in bottles'],['2.3','2.3 Bottles with supplier and country'],
  ['2.4','2.4 Products per category'],['2.5','2.5 UK employees'],['2.6','2.6 Orders over 100 to the USA or UK'],
  ['2.7','2.7 Highest discount amount'],['2.8','2.8 Employees view'],['2.9','2.9 CustomerTotalFreightAmount procedure'],
  ['submit','Scripts and ERD handed in']
];
