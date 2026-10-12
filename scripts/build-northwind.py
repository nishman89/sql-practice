"""Rebuilds data/northwind.db from Microsoft's Northwind script.

Only needed if you want to change the database. Download instnwnd.sql from
https://github.com/microsoft/sql-server-samples/tree/master/samples/databases/northwind-pubs,
save it as nw.sql in the folder you run this from, then: python3 scripts/build-northwind.py
It writes northwind.db to that folder; copy it to data/northwind.db and run npm run build.
"""
import re, sqlite3, os
s=open('nw.sql',encoding='utf-8').read()
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
  CategoryName VARCHAR(15) NOT NULL,
  Description TEXT
);
CREATE TABLE Suppliers (
  SupplierID INTEGER PRIMARY KEY,
  CompanyName VARCHAR(40) NOT NULL,
  ContactName VARCHAR(30), ContactTitle VARCHAR(30), Address VARCHAR(60), City VARCHAR(15),
  Region VARCHAR(15), PostalCode VARCHAR(10), Country VARCHAR(15), Phone VARCHAR(24), Fax VARCHAR(24), HomePage TEXT
);
CREATE TABLE Shippers (
  ShipperID INTEGER PRIMARY KEY,
  CompanyName VARCHAR(40) NOT NULL,
  Phone VARCHAR(24)
);
CREATE TABLE Customers (
  CustomerID CHAR(5) PRIMARY KEY,
  CompanyName VARCHAR(40) NOT NULL,
  ContactName VARCHAR(30), ContactTitle VARCHAR(30), Address VARCHAR(60), City VARCHAR(15),
  Region VARCHAR(15), PostalCode VARCHAR(10), Country VARCHAR(15), Phone VARCHAR(24), Fax VARCHAR(24)
);
CREATE TABLE Employees (
  EmployeeID INTEGER PRIMARY KEY,
  LastName VARCHAR(20) NOT NULL, FirstName VARCHAR(10) NOT NULL, Title VARCHAR(30), TitleOfCourtesy VARCHAR(25),
  BirthDate DATE, HireDate DATE, Address VARCHAR(60), City VARCHAR(15), Region VARCHAR(15), PostalCode VARCHAR(10),
  Country VARCHAR(15), HomePhone VARCHAR(24), Extension VARCHAR(4), Notes TEXT,
  ReportsTo INTEGER REFERENCES Employees(EmployeeID)
);
CREATE TABLE Products (
  ProductID INTEGER PRIMARY KEY,
  ProductName VARCHAR(40) NOT NULL,
  SupplierID INTEGER REFERENCES Suppliers(SupplierID),
  CategoryID INTEGER REFERENCES Categories(CategoryID),
  QuantityPerUnit VARCHAR(20), UnitPrice DECIMAL(10,4) DEFAULT 0, UnitsInStock SMALLINT DEFAULT 0,
  UnitsOnOrder SMALLINT DEFAULT 0, ReorderLevel SMALLINT DEFAULT 0, Discontinued BIT NOT NULL DEFAULT 0
);
CREATE TABLE Orders (
  OrderID INTEGER PRIMARY KEY,
  CustomerID CHAR(5) REFERENCES Customers(CustomerID),
  EmployeeID INTEGER REFERENCES Employees(EmployeeID),
  OrderDate DATE, RequiredDate DATE, ShippedDate DATE,
  ShipVia INTEGER REFERENCES Shippers(ShipperID),
  Freight DECIMAL(10,4) DEFAULT 0, ShipName VARCHAR(40), ShipAddress VARCHAR(60), ShipCity VARCHAR(15),
  ShipRegion VARCHAR(15), ShipPostalCode VARCHAR(10), ShipCountry VARCHAR(15)
);
CREATE TABLE "Order Details" (
  OrderID INTEGER NOT NULL REFERENCES Orders(OrderID),
  ProductID INTEGER NOT NULL REFERENCES Products(ProductID),
  UnitPrice DECIMAL(10,4) NOT NULL DEFAULT 0, Quantity SMALLINT NOT NULL DEFAULT 1, Discount REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (OrderID, ProductID)
);
'''
if os.path.exists('northwind.db'): os.remove('northwind.db')
import re as _re
schema=_re.sub(r'\b((?:VAR)?CHAR\(\d+\)|TEXT)', r'\1 COLLATE NOCASE', schema)
db=sqlite3.connect('northwind.db'); db.executescript(schema)
colsets={
 'Customers':['CustomerID','CompanyName','ContactName','ContactTitle','Address','City','Region','PostalCode','Country','Phone','Fax'],
 'Order Details':['OrderID','ProductID','UnitPrice','Quantity','Discount'],
}
target={t:[r[1] for r in db.execute(f'PRAGMA table_info("{t}")')] for t in ['Categories','Suppliers','Shippers','Customers','Employees','Products','Orders','Order Details']}
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
            if isinstance(v,float) and v.is_integer() and c not in('UnitPrice','Freight','Discount'): v=int(v)
            rec.append(v)
        pending.append(rec)
    if t=='Employees': pending.sort(key=lambda r:(r[-1] is not None, r[0]))
    db.executemany(f'INSERT INTO "{t}" VALUES ({",".join("?"*len(target[t]))})',pending)
db.commit()
for t in order: print(t, db.execute(f'select count(*) from "{t}"').fetchone())
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
