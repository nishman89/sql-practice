// The SQL engine: running queries, marking answers, and friendly messages.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from './helpers.mjs';

const s = await loadSite();
const db = s.northwind();
const run = (sql, mode='nw') => s.runScript(db, sql, mode);
const last = (r) => r.results[r.results.length-1];

describe('running SQL', () => {
  test('a SELECT returns its rows and columns', () => {
    const r = run('SELECT ProductName, UnitPrice FROM Products ORDER BY ProductID LIMIT 3;');
    assert.equal(r.error, null); assert.deepEqual(last(r).columns, ['ProductName','UnitPrice']); assert.equal(last(r).values.length, 3);
  });
  test('every statement in a script runs, and each SELECT gives a result', () => {
    const r = run('SELECT 1; SELECT 2;'); assert.equal(r.results.length, 2);
  });
  test('comments are ignored', () => { assert.equal(last(run('-- a comment\nSELECT 1 /* inline */;')).values[0][0], 1); });
  test('an empty editor asks for a statement', () => { const r = run('   '); assert.match(r.error.message, /Nothing to run/); });
  test('a SELECT with no matches is an empty result, not an error', () => {
    const r = run("SELECT * FROM Customers WHERE Country = 'Atlantis';"); assert.equal(r.error, null); assert.equal(last(r).values.length, 0);
  });
  test('writes report what changed', () => {
    const d = s.mydb(); const r = s.runScript(d, "INSERT INTO Customers (customer_name) VALUES ('Test');", 'mydb');
    assert.equal(r.error, null); assert.ok(r.items.some(i => i.ok));
  });
  test('foreign keys are switched on', () => {
    const d = s.mydb(); const r = s.runScript(d, 'INSERT INTO Orders (order_id, customer_id) VALUES (999, 424242);', 'mydb');
    assert.ok(r.error, 'an order for a customer who does not exist should fail');
  });
  test('Northwind has the full set of tables and views', () => {
    const t = last(run("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table';")).values[0][0];
    const v = last(run("SELECT COUNT(*) FROM sqlite_master WHERE type = 'view';")).values[0][0];
    assert.equal(t, 13); assert.equal(v, 16);
  });
  test('Northwind has its well-known row counts', () => {
    for (const [table, n] of [['Customers',91],['Orders',830],['"Order Details"',2155],['Products',77],['Employees',9],['Territories',53]])
      assert.equal(last(run(`SELECT COUNT(*) FROM ${table};`)).values[0][0], n, table);
  });
});

describe('friendly messages for MySQL and T-SQL habits', () => {
  const cases = [
    ['SELECT TOP 5 ProductName FROM Products;', /TOP is T-SQL/, /LIMIT/],
    ['SELECT ISNULL(Fax, 0) FROM Customers;', /ISNULL\(\) is T-SQL/, /IFNULL|COALESCE/],
    ['CREATE TABLE t (id INT IDENTITY(1,1) PRIMARY KEY);', /IDENTITY is T-SQL/, /AUTOINCREMENT/],
    ['CREATE TABLE t (id INT AUTO_INCREMENT PRIMARY KEY);', /AUTO_INCREMENT is MySQL/, /AUTOINCREMENT/],
    ['SHOW TABLES;', /SHOW TABLES is MySQL/, /sqlite_master/],
    ['DESCRIBE Products;', /DESCRIBE is MySQL/, /table_info/],
    ['CREATE DATABASE shop;', /CREATE DATABASE/, /single file/],
    ['SELECT DATEPART(year, OrderDate) FROM Orders;', /DATEPART\(\) is T-SQL/, /strftime/],
    ['SELECT DATEADD(day, 7, OrderDate) FROM Orders;', /DATEADD\(\) is T-SQL/, /date\(/],
    ['SELECT DATEDIFF(day, OrderDate, ShippedDate) FROM Orders;', /DATEDIFF\(\)/, /julianday/],
    ['SELECT GETDATE();', /GETDATE/, /datetime\('now'\)/],
    ['SELECT NOW();', /NOW/, /datetime\('now'\)/],
  ];
  for (const [sql, msg, hint] of cases) test(sql, () => {
    const r = run(sql); assert.ok(r.error, 'should be refused'); assert.match(r.error.message, msg); assert.match(String(r.error.hint), hint);
  });
  test('a misspelt table lists Northwind\u2019s real tables', () => {
    const r = run('SELECT * FROM Customer;'); assert.match(r.error.hint, /no table called Customer/); assert.match(r.error.hint, /Customers/);
  });
  test('the things SQLite does accept still run', () => {
    for (const sql of ['SELECT ProductName FROM Products LIMIT 5;', "SELECT CONCAT(FirstName, ' ', LastName) FROM Employees;", 'SELECT IFNULL(Fax, 0) FROM Customers;', 'SELECT `ProductName` FROM Products LIMIT 1;'])
      assert.equal(run(sql).error, null, sql);
  });
});

describe('marking answers', () => {
  const ex = { sol: "SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > 50;" };
  const mark = (sql) => s.compare(db, ex, last(run(sql)));
  test('the model answer is correct', () => assert.equal(mark(ex.sol).ok, true));
  test('row order doesn\u2019t matter (unless the task asks for it)', () => assert.equal(mark('SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > 50 ORDER BY UnitPrice;').ok, true));
  test('column order and aliases don\u2019t matter', () => assert.equal(mark('SELECT UnitPrice AS Price, ProductName AS Name FROM Products WHERE UnitPrice > 50;').ok, true));
  test('extra columns are fine as long as the answer is there', () => assert.equal(mark('SELECT ProductID, ProductName, UnitPrice FROM Products WHERE UnitPrice > 50;').ok, true));
  test('too many rows is wrong, with a hint about the filter', () => { const v = mark('SELECT ProductName, UnitPrice FROM Products;'); assert.equal(v.ok, false); assert.match(v.msg, /Expected 7 rows/); });
  test('a missing column is wrong', () => assert.equal(mark('SELECT ProductName FROM Products WHERE UnitPrice > 50;').ok, false));
  test('the right rows with wrong values are wrong', () => assert.equal(mark('SELECT ProductName, UnitsInStock FROM Products WHERE UnitPrice > 50;').ok, false));
});
