"""Rebuilds data/northwind.db, the full Northwind: all 13 tables and the 16 views, (SQLite types: INTEGER, REAL and TEXT; dates are TEXT as YYYY-MM-DD) from Microsoft's Northwind script.

Only needed if you want to change the database. Download instnwnd.sql from
https://github.com/microsoft/sql-server-samples/tree/master/samples/databases/northwind-pubs,
save it as nw.sql in the folder you run this from, then: python3 scripts/build-northwind.py
It writes northwind.db to that folder; copy it to data/northwind.db and run npm run build.
"""
import re, sqlite3, os
raw=open('nw.sql','rb').read()
s=raw.decode('utf-16') if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else raw.decode('utf-8', errors='replace')
def parse_values(s,i):
    # s[i]=='(' ; returns list, end index
    assert s[i]=='('; i+=1; vals=[]
    while True:
        while s[i] in ' \t\r\n,': i+=1
        if s[i]==')': return vals,i+1
        if s[i] in 'Nn' and s[i+1]=="'": i+=1
        if s[i]=="'":
            j=i+1; buf=[]
            while True:
                if s[j]=="'":
                    if s[j+1]=="'": buf.append("'"); j+=2; continue
                    break
                buf.append(s[j]); j+=1
            vals.append(''.join(buf)); i=j+1
        else:
            m=re.match(r'[^,)\s]+',s[i:]); tok=m.group(0); i+=len(tok)
            if tok.upper()=='NULL': vals.append(None)
            elif tok.lower().startswith('0x'): vals.append(b'')  # drop images
            else:
                vals.append(float(tok) if '.' in tok else int(tok))
rows={}
for m in re.finditer(r'(?i)INSERT\s+(?:INTO\s+)?"([^"]+)"\s*(\([^)]*\))?\s*VALUES\s*',s):
    t=m.group(1); cols=None
    if m.group(2): cols=re.findall(r'"([^"]+)"',m.group(2))
    vals,_=parse_values(s,m.end())
    rows.setdefault(t,[]).append((cols,vals))
print({k:len(v) for k,v in rows.items()})
def date(v):
    if v is None: return None
    v=v.split(' ')[0]; mth,d,y=v.split('/'); return f"{int(y):04d}-{int(mth):02d}-{int(d):02d}"
schema='''
PRAGMA foreign_keys=ON;
CREATE TABLE Categories (
  CategoryID INTEGER PRIMARY KEY,
  CategoryName TEXT NOT NULL,
  Description TEXT,
  Picture BLOB
);
CREATE TABLE Suppliers (
  SupplierID INTEGER PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  ContactName TEXT, ContactTitle TEXT, Address TEXT, City TEXT,
  Region TEXT, PostalCode TEXT, Country TEXT, Phone TEXT, Fax TEXT, HomePage TEXT
);
CREATE TABLE Shippers (
  ShipperID INTEGER PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  Phone TEXT
);
CREATE TABLE Customers (
  CustomerID TEXT PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  ContactName TEXT, ContactTitle TEXT, Address TEXT, City TEXT,
  Region TEXT, PostalCode TEXT, Country TEXT, Phone TEXT, Fax TEXT
);
CREATE TABLE Employees (
  EmployeeID INTEGER PRIMARY KEY,
  LastName TEXT NOT NULL, FirstName TEXT NOT NULL, Title TEXT, TitleOfCourtesy TEXT,
  BirthDate TEXT, HireDate TEXT, Address TEXT, City TEXT, Region TEXT, PostalCode TEXT,
  Country TEXT, HomePhone TEXT, Extension TEXT, Photo BLOB, Notes TEXT,
  ReportsTo INTEGER REFERENCES Employees(EmployeeID),
  PhotoPath TEXT
);
CREATE TABLE Products (
  ProductID INTEGER PRIMARY KEY,
  ProductName TEXT NOT NULL,
  SupplierID INTEGER REFERENCES Suppliers(SupplierID),
  CategoryID INTEGER REFERENCES Categories(CategoryID),
  QuantityPerUnit TEXT, UnitPrice REAL DEFAULT 0, UnitsInStock INTEGER DEFAULT 0,
  UnitsOnOrder INTEGER DEFAULT 0, ReorderLevel INTEGER DEFAULT 0, Discontinued INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE Orders (
  OrderID INTEGER PRIMARY KEY,
  CustomerID TEXT REFERENCES Customers(CustomerID),
  EmployeeID INTEGER REFERENCES Employees(EmployeeID),
  OrderDate TEXT, RequiredDate TEXT, ShippedDate TEXT,
  ShipVia INTEGER REFERENCES Shippers(ShipperID),
  Freight REAL DEFAULT 0, ShipName TEXT, ShipAddress TEXT, ShipCity TEXT,
  ShipRegion TEXT, ShipPostalCode TEXT, ShipCountry TEXT
);
CREATE TABLE Region (
  RegionID INTEGER PRIMARY KEY,
  RegionDescription TEXT NOT NULL
);
CREATE TABLE Territories (
  TerritoryID TEXT PRIMARY KEY,
  TerritoryDescription TEXT NOT NULL,
  RegionID INTEGER NOT NULL REFERENCES Region(RegionID)
);
CREATE TABLE EmployeeTerritories (
  EmployeeID INTEGER NOT NULL REFERENCES Employees(EmployeeID),
  TerritoryID TEXT NOT NULL REFERENCES Territories(TerritoryID),
  PRIMARY KEY (EmployeeID, TerritoryID)
);
CREATE TABLE CustomerDemographics (
  CustomerTypeID TEXT PRIMARY KEY,
  CustomerDesc TEXT
);
CREATE TABLE CustomerCustomerDemo (
  CustomerID TEXT NOT NULL REFERENCES Customers(CustomerID),
  CustomerTypeID TEXT NOT NULL REFERENCES CustomerDemographics(CustomerTypeID),
  PRIMARY KEY (CustomerID, CustomerTypeID)
);
CREATE TABLE "Order Details" (
  OrderID INTEGER NOT NULL REFERENCES Orders(OrderID),
  ProductID INTEGER NOT NULL REFERENCES Products(ProductID),
  UnitPrice REAL NOT NULL DEFAULT 0, Quantity INTEGER NOT NULL DEFAULT 1, Discount REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (OrderID, ProductID)
);
'''
if os.path.exists('northwind.db'): os.remove('northwind.db')
import re as _re
schema=_re.sub(r'\bTEXT\b', r'TEXT COLLATE NOCASE', schema)
db=sqlite3.connect('northwind.db'); db.executescript(schema)
colsets={
 'Customers':['CustomerID','CompanyName','ContactName','ContactTitle','Address','City','Region','PostalCode','Country','Phone','Fax'],
 'Order Details':['OrderID','ProductID','UnitPrice','Quantity','Discount'],
}
target={t:[r[1] for r in db.execute(f'PRAGMA table_info("{t}")')] for t in ['Categories','Suppliers','Shippers','Customers','Employees','Products','Orders','Order Details','Region','Territories','EmployeeTerritories','CustomerDemographics','CustomerCustomerDemo']}
datecols={'BirthDate','HireDate','OrderDate','RequiredDate','ShippedDate'}
order=['Categories','Suppliers','Shippers','Customers','Employees','Products','Orders','Order Details']
for t in order:
    pending=[]
    for cols,vals in rows[t]:
        cols=cols or colsets[t]
        d=dict(zip(cols,vals))
        rec=[]
        for c in target[t]:
            v=d.get(c)
            if c in datecols: v=date(v)
            if c in ('Picture','Photo'): v=None
            if isinstance(v,str) and c not in ('Notes','Description','CustomerDesc'): v=v.rstrip()
            if isinstance(v,float) and v.is_integer() and c not in('UnitPrice','Freight','Discount'): v=int(v)
            rec.append(v)
        pending.append(rec)
    if t=='Employees':   # managers first, so ReportsTo always points at someone already there
        rt=target[t].index('ReportsTo'); pending.sort(key=lambda r:(r[rt] is not None, r[0]))
    db.executemany(f'INSERT INTO "{t}" VALUES ({",".join("?"*len(target[t]))})',pending)
# The extra tables are added later in Microsoft's script with plain "Insert Into Region Values (...)" lines
for t in ['Region','Territories','EmployeeTerritories','CustomerDemographics','CustomerCustomerDemo']:
    recs=[]
    for m in re.finditer(r'(?i)Insert\s+Into\s+(?:\[dbo\]\.)?\[?"?'+t+r'"?\]?\s+Values\s*', s):
        vals,_=parse_values(s,m.end()); recs.append([v.rstrip() if isinstance(v,str) else v for v in vals])
    if recs: db.executemany(f'INSERT INTO "{t}" VALUES ({",".join("?"*len(recs[0]))})', recs)
order += ['Region','Territories','EmployeeTerritories','CustomerDemographics','CustomerCustomerDemo']
# The 16 views from Microsoft's script, translated into SQLite: + joins text becomes ||, CONVERT(money, …)
# becomes ROUND(…, 2), dates such as '19970101' become '1997-01-01', and the nested bracketed joins
# (written for Microsoft Access) become ordinary joins, which give the same rows and are easier to read.
MONEY = 'ROUND(od.UnitPrice * od.Quantity * (1 - od.Discount), 2)'
VIEWS = {
 'Customer and Suppliers by City': """SELECT City, CompanyName, ContactName, 'Customers' AS Relationship FROM Customers
UNION SELECT City, CompanyName, ContactName, 'Suppliers' FROM Suppliers""",
 'Alphabetical list of products': """SELECT Products.*, Categories.CategoryName
FROM Categories JOIN Products ON Categories.CategoryID = Products.CategoryID
WHERE Products.Discontinued = 0""",
 'Current Product List': """SELECT ProductID, ProductName FROM Products WHERE Discontinued = 0""",
 'Orders Qry': """SELECT o.OrderID, o.CustomerID, o.EmployeeID, o.OrderDate, o.RequiredDate, o.ShippedDate, o.ShipVia, o.Freight,
  o.ShipName, o.ShipAddress, o.ShipCity, o.ShipRegion, o.ShipPostalCode, o.ShipCountry,
  c.CompanyName, c.Address, c.City, c.Region, c.PostalCode, c.Country
FROM Customers c JOIN Orders o ON c.CustomerID = o.CustomerID""",
 'Products Above Average Price': """SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)""",
 'Products by Category': """SELECT Categories.CategoryName, Products.ProductName, Products.QuantityPerUnit, Products.UnitsInStock, Products.Discontinued
FROM Categories JOIN Products ON Categories.CategoryID = Products.CategoryID
WHERE Products.Discontinued <> 1""",
 'Quarterly Orders': """SELECT DISTINCT c.CustomerID, c.CompanyName, c.City, c.Country
FROM Orders o LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
WHERE o.OrderDate BETWEEN '1997-01-01' AND '1997-12-31'""",
 'Invoices': f"""SELECT o.ShipName, o.ShipAddress, o.ShipCity, o.ShipRegion, o.ShipPostalCode, o.ShipCountry, o.CustomerID,
  c.CompanyName AS CustomerName, c.Address, c.City, c.Region, c.PostalCode, c.Country,
  (e.FirstName || ' ' || e.LastName) AS Salesperson,
  o.OrderID, o.OrderDate, o.RequiredDate, o.ShippedDate, s.CompanyName AS ShipperName,
  od.ProductID, p.ProductName, od.UnitPrice, od.Quantity, od.Discount, {MONEY} AS ExtendedPrice, o.Freight
FROM Orders o
JOIN Customers c       ON c.CustomerID = o.CustomerID
JOIN Employees e       ON e.EmployeeID = o.EmployeeID
JOIN "Order Details" od ON od.OrderID = o.OrderID
JOIN Products p        ON p.ProductID = od.ProductID
JOIN Shippers s        ON s.ShipperID = o.ShipVia""",
 'Order Details Extended': f"""SELECT od.OrderID, od.ProductID, p.ProductName, od.UnitPrice, od.Quantity, od.Discount, {MONEY} AS ExtendedPrice
FROM Products p JOIN "Order Details" od ON p.ProductID = od.ProductID""",
 'Order Subtotals': f"""SELECT od.OrderID, SUM({MONEY}) AS Subtotal FROM "Order Details" od GROUP BY od.OrderID""",
 'Product Sales for 1997': f"""SELECT cat.CategoryName, p.ProductName, SUM({MONEY}) AS ProductSales
FROM Categories cat
JOIN Products p        ON cat.CategoryID = p.CategoryID
JOIN "Order Details" od ON p.ProductID = od.ProductID
JOIN Orders o          ON o.OrderID = od.OrderID
WHERE o.ShippedDate BETWEEN '1997-01-01' AND '1997-12-31'
GROUP BY cat.CategoryName, p.ProductName""",
 'Category Sales for 1997': """SELECT CategoryName, SUM(ProductSales) AS CategorySales FROM "Product Sales for 1997" GROUP BY CategoryName""",
 'Sales by Category': """SELECT cat.CategoryID, cat.CategoryName, p.ProductName, SUM(ode.ExtendedPrice) AS ProductSales
FROM Categories cat
JOIN Products p                   ON cat.CategoryID = p.CategoryID
JOIN "Order Details Extended" ode ON p.ProductID = ode.ProductID
JOIN Orders o                     ON o.OrderID = ode.OrderID
WHERE o.OrderDate BETWEEN '1997-01-01' AND '1997-12-31'
GROUP BY cat.CategoryID, cat.CategoryName, p.ProductName""",
 'Sales Totals by Amount': """SELECT os.Subtotal AS SaleAmount, o.OrderID, c.CompanyName, o.ShippedDate
FROM Customers c
JOIN Orders o             ON c.CustomerID = o.CustomerID
JOIN "Order Subtotals" os ON o.OrderID = os.OrderID
WHERE os.Subtotal > 2500 AND o.ShippedDate BETWEEN '1997-01-01' AND '1997-12-31'""",
 'Summary of Sales by Quarter': """SELECT o.ShippedDate, o.OrderID, os.Subtotal
FROM Orders o JOIN "Order Subtotals" os ON o.OrderID = os.OrderID
WHERE o.ShippedDate IS NOT NULL""",
 'Summary of Sales by Year': """SELECT o.ShippedDate, o.OrderID, os.Subtotal
FROM Orders o JOIN "Order Subtotals" os ON o.OrderID = os.OrderID
WHERE o.ShippedDate IS NOT NULL""",
}
for name, body in VIEWS.items(): db.execute(f'CREATE VIEW "{name}" AS\n{body}')
db.commit()
for t in order: print(t, db.execute(f'select count(*) from "{t}"').fetchone())
for (v,) in db.execute("select name from sqlite_master where type='view'"): print('view', v, db.execute(f'select count(*) from "{v}"').fetchone())
q=lambda x: db.execute(x).fetchall()
print(q("select count(*) from Employees where City='london'"))
print(q("select FirstName,LastName from Employees where TitleOfCourtesy='Dr.'"))
print(q("select count(*) from Products where Discontinued=1"))
print(q("select ProductName,ProductID from Products where UnitPrice<5"))
print(q("select count(OrderID) from Orders where EmployeeID in (5,7)"))
print(q("select CategoryID, avg(ReorderLevel) from Products group by CategoryID order by 2 desc limit 2"))
print(q("select * from Orders limit 1"))
print(q("PRAGMA foreign_key_check"))
db.execute('VACUUM'); db.close()
print(os.path.getsize('northwind.db'))
