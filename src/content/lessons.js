/* ---------- Learning path content ---------- */
/* CERR(sql) is a runnable example that is meant to fail (the checker makes sure it does).
   C(sql) is a runnable example. C(sql, false) is read-only; pass a label to say why (default: tables not in Northwind). */
const C = (sql, run=true, label) => `<pre class="ex"${run?'':' data-norun'}${label?` data-label="${esc(label)}"`:''}>${esc(sql)}</pre>`;
const CERR = sql => `<pre class="ex" data-expect-error>${esc(sql)}</pre>`;
/* The order you write a query (logical / syntax sequence) vs the order the database runs it (processing sequence),
   drawn like the course slides. highlight: clauses to pick out. */
const RUN_ORDER = (highlight=['SELECT','FROM']) => {
  const written=['SELECT','DISTINCT','FROM','WHERE','GROUP BY','HAVING','ORDER BY'];
  const runs   =['FROM','WHERE','GROUP BY','HAVING','SELECT','DISTINCT','ORDER BY'];
  const W=560, bw=190, bh=44, gap=8, top=74, lx=16, rx=W-16-bw;
  const y=i=>top+i*(bh+gap), mid=i=>y(i)+bh/2;
  const lines=written.map((c,i)=>{ const j=runs.indexOf(c), hl=highlight.includes(c);
    return `<path class="ro-link${hl?' hl':''}" d="M${lx+bw} ${mid(i)} C ${W/2} ${mid(i)}, ${W/2} ${mid(j)}, ${rx} ${mid(j)}"/>`; });
  // highlighted links on top
  lines.sort((a,b)=>a.includes(' hl')-b.includes(' hl'));
  const block=(c,i,x)=>`<g class="ro-block${highlight.includes(c)?' hl':''}"><rect x="${x}" y="${y(i)}" width="${bw}" height="${bh}" rx="9"/><text x="${x+18}" y="${mid(i)+5}" class="ro-n">${i+1}</text><text x="${x+bw/2+8}" y="${mid(i)+6}" text-anchor="middle">${c}</text></g>`;
  const label=`You write: ${written.join(', ')}. The database runs: ${runs.join(', ')}.`;
  return `<figure class="run-order"><svg viewBox="0 0 ${W} ${y(written.length)+4}" role="img" aria-label="${label}">
<text x="${lx+bw/2}" y="26" text-anchor="middle" class="ro-h">How you write it</text><text x="${lx+bw/2}" y="46" text-anchor="middle" class="ro-sub">logical (syntax) sequence</text>
<text x="${rx+bw/2}" y="26" text-anchor="middle" class="ro-h">How the database runs it</text><text x="${rx+bw/2}" y="46" text-anchor="middle" class="ro-sub">processing sequence</text>
${lines.join('')}${written.map((c,i)=>block(c,i,lx)).join('')}${runs.map((c,i)=>block(c,i,rx)).join('')}</svg></figure>`;
};
/* Tabs inside a lesson. TABS([{label, html}]) — the app wires up the buttons after the lesson is drawn. */
let TABS_N = 0;
const TABS = tabs => { const n=++TABS_N;
  return `<div class="ltabs" data-ltabs><div class="ltabs-list" role="tablist">${tabs.map((t,i)=>`<button type="button" role="tab" id="lt${n}-${i}" aria-controls="lp${n}-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-testid="dtype-tab-${i+1}">${t.label}</button>`).join('')}</div>${tabs.map((t,i)=>`<div class="ltabs-panel" role="tabpanel" id="lp${n}-${i}" aria-labelledby="lt${n}-${i}"${i===0?'':' hidden'}>${t.html}</div>`).join('')}</div>`; };
/* A section heading that says which dialects it applies to: HD('all' | ['sqlite','mysql',…], title, optional tag) */
const HD = (keys, title, tag) => {
  const ks = keys==='all' ? ['sqlite','mysql','tsql'] : keys;
  const names = ks.map(k=>DIALECT_LABEL[k]);
  const t = tag || (ks.length===3 ? 'All three' : ks.length===1 ? names[0]+' only' : names.join(' and '));
  return `<h3 class="h-dialect"><span class="h-icons" aria-hidden="true">${ks.map(k=>DIALECT_ICON[k]).join(' ')}</span> ${title} <span class="h-tag">${t}</span></h3>`;
};
const TIP = t => `<div class="tip">${t}</div>`;

/* Dialect callouts, marked with the same icons as the course notes. Each value is code;
   start it with ~ to show plain text instead (for example "~Not available"). */
const DIALECT_ICON = { sqlite:'🪶', mysql:'🐬', tsql:'🪟' };
const DIALECT_LABEL = { sqlite:'SQLite', mysql:'MySQL', tsql:'T-SQL' };
const DIFF = o => {
  const val = v => v.startsWith('~') ? `<span class="ddiff-text">${esc(v.slice(1))}</span>` : /\n/.test(v) ? `<pre>${esc(v)}</pre>` : `<code>${esc(v)}</code>`;
  // common: the way that works in all three, shown first. Dialect rows that only repeat it are left out.
  const rows=['sqlite','mysql','tsql'].filter(k=>o[k]!=null && (o.all || o[k]!==o.common));
  const common = o.common ? `<div class="ddiff-row common"><span class="ddiff-tag"><span aria-hidden="true">🪶 🐬 🪟</span> All three</span>${val(o.common)}</div>` : '';
  const sub = o.common && rows.length ? `<div class="ddiff-sub">${o.otherTitle||'Where they differ'}</div>` : '';
  return `<div class="ddiff">${o.title?`<div class="ddiff-h">${o.title}</div>`:''}${common}${sub}${rows.map(k=>`<div class="ddiff-row ${k}"><span class="ddiff-tag"><span aria-hidden="true">${DIALECT_ICON[k]}</span> ${DIALECT_LABEL[k]}</span>${val(o[k])}</div>`).join('')}${o.note?`<p class="ddiff-note">${o.note}</p>`:''}</div>`;
};
const READ_ONLY = (dialect, tool) => `${DIALECT_ICON[dialect]} ${DIALECT_LABEL[dialect]}: try this in ${tool}`;

/* "Same in all three" note, for lessons where the dialects don't differ */
const SAME = extra => `<div class="dsame"><span class="dsame-icons" aria-hidden="true">🪶 🐬 🪟</span><div><strong>Same in SQLite, MySQL and T-SQL.</strong> ${extra || 'Everything in this lesson works the same in all three.'}</div></div>`;

/* Venn diagrams for joins. regions: 'a' (only in the left table), 'ab' (in both), 'b' (only in the right table) */
let VENN_N = 0;
const VENN = (regions, label, a='student', b='course') => {
  const n=++VENN_N, has=r=>regions.includes(r);
  const desc=[has('a')&&`rows only in ${a}`, has('ab')&&'rows in both', has('b')&&`rows only in ${b}`].filter(Boolean).join(', ');
  return `<svg class="venn" viewBox="0 0 220 136" role="img" aria-label="${label}: keeps ${desc}"><defs>`+
    `<clipPath id="vA${n}"><circle cx="84" cy="80" r="50"/></clipPath>`+
    `<mask id="vNB${n}"><rect width="220" height="136" fill="#fff"/><circle cx="136" cy="80" r="50" fill="#000"/></mask>`+
    `<mask id="vNA${n}"><rect width="220" height="136" fill="#fff"/><circle cx="84" cy="80" r="50" fill="#000"/></mask></defs>`+
    (has('a')?`<circle cx="84" cy="80" r="50" class="vf" mask="url(#vNB${n})"/>`:'')+
    (has('b')?`<circle cx="136" cy="80" r="50" class="vf" mask="url(#vNA${n})"/>`:'')+
    (has('ab')?`<circle cx="136" cy="80" r="50" class="vf" clip-path="url(#vA${n})"/>`:'')+
    `<circle cx="84" cy="80" r="50" class="vo"/><circle cx="136" cy="80" r="50" class="vo"/>`+
    `<text x="62" y="18" class="vt" text-anchor="middle">${a}</text><text x="158" y="18" class="vt" text-anchor="middle">${b}</text></svg>`;
};
const VENN_CARD = (regions, title, sql) => `<figure class="venn-card">${VENN(regions, title)}<figcaption><b>${title}</b><code>${esc(sql)}</code></figcaption></figure>`;

/* The made-up tables used in the join examples, built with WITH so they run without changing Northwind */
const FAKE = "WITH student(name, course) AS (VALUES\n    ('Lee', 1), ('Barry', 1), ('David', 2),\n    ('Tim', 3), ('Nicole', NULL)\n),\ncourse(id, name) AS (VALUES\n    (1, 'Business'), (2, 'Test'), (3, 'Dev'), (4, 'Data')\n)\n";
const FAKE_START = FAKE + "-- Write your SELECT below, using student and course\n";

/* The Customers and Orders tables from Creating tables (same names and data as the course notes).
   Lessons with db:'mydb' run on a fresh copy of these, and every run is rolled back. */
const MYDB_SEED = "CREATE TABLE Customers (\n    customer_id    INTEGER PRIMARY KEY AUTOINCREMENT,\n    customer_name  TEXT NOT NULL,\n    height         REAL,\n    is_happy       INTEGER\n);\nCREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n);\nINSERT INTO Customers (customer_name, height, is_happy) VALUES\n    ('Nish Mandal', 1.85, 1), ('Cathy French', 1.70, 0), ('Rich Gurney', 1.80, 1);\nINSERT INTO Orders (order_number, customer_id) VALUES\n    (1001, 1), (1002, 2), (1003, 3), (1004, 1), (1005, 2), (1006, 3);";
const MYDB_TABLES = `<div class="two-tables">
<table class="mini"><tr><th colspan="4">Customers</th></tr><tr><th>customer_id</th><th>customer_name</th><th>height</th><th>is_happy</th></tr><tr><td>1</td><td>Nish Mandal</td><td>1.85</td><td>1</td></tr><tr><td>2</td><td>Cathy French</td><td>1.7</td><td>0</td></tr><tr><td>3</td><td>Rich Gurney</td><td>1.8</td><td>1</td></tr></table>
<table class="mini"><tr><th colspan="3">Orders</th></tr><tr><th>order_id</th><th>order_number</th><th>customer_id</th></tr><tr><td>1</td><td>1001</td><td>1</td></tr><tr><td>2</td><td>1002</td><td>2</td></tr><tr><td>3</td><td>1003</td><td>3</td></tr><tr><td>4</td><td>1004</td><td>1</td></tr><tr><td>5</td><td>1005</td><td>2</td></tr><tr><td>6</td><td>1006</td><td>3</td></tr></table>
</div>`;

/* The made-up café tables used in Introduction to subqueries */
const SHOP = "WITH product(name, category, price) AS (VALUES\n    ('Tea', 'Drinks', 3),    ('Coffee', 'Drinks', 4),\n    ('Juice', 'Drinks', 6),  ('Biscuits', 'Food', 2),\n    ('Cake', 'Food', 5),     ('Soup', 'Food', 7)\n),\nsale(product, qty) AS (VALUES\n    ('Tea', 10), ('Cake', 4),\n    ('Tea', 2),  ('Juice', 1)\n)\n";
const SHOP_START = SHOP + "-- Write your SELECT below, using product and sale\n";

/* Creating tables: how the dialects differ (shown on the Creating tables page) */
const BUILD_DIFF = () => [
  DIFF({title:'Auto-numbered primary keys', sqlite:'customer_id INTEGER PRIMARY KEY AUTOINCREMENT', mysql:'customer_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY', tsql:'customer_id INT NOT NULL IDENTITY(1,1) PRIMARY KEY'}),
  DIFF({title:'Column types', sqlite:'customer_name TEXT NOT NULL,\nheight        REAL,\nis_happy      INTEGER', mysql:'customer_name VARCHAR(255) NOT NULL,\nheight        DECIMAL(7,3),\nis_happy      BOOLEAN', tsql:'customer_name VARCHAR(255) NOT NULL,\nheight        DECIMAL(7,3),\nis_happy      BIT', note:'SQLite has a few simple types: <code>INTEGER</code>, <code>REAL</code>, <code>TEXT</code> and <code>BLOB</code>. It accepts names like <code>VARCHAR(255)</code> too, but stores them as <code>TEXT</code>.'}),
  DIFF({title:'Creating a database', sqlite:'~Not needed: a SQLite database is a single file, and you\'re already connected to it.', mysql:'CREATE DATABASE my_db;\nUSE my_db;', tsql:'CREATE DATABASE my_db;\nUSE my_db;'}),
  DIFF({title:'Adding two columns', sqlite:'ALTER TABLE Customers ADD COLUMN email TEXT;\nALTER TABLE Customers ADD COLUMN age INTEGER;', mysql:'ALTER TABLE Customers\n    ADD COLUMN email VARCHAR(255),\n    ADD COLUMN age INT;', tsql:'ALTER TABLE Customers\n    ADD email VARCHAR(255), age INT;'}),
  DIFF({title:'Foreign keys', sqlite:'PRAGMA foreign_keys = ON;', mysql:'~Checked automatically (InnoDB tables, the default)', tsql:'~Checked automatically', note:'SQLite only checks foreign keys once they\'re switched on. This lab switches them on for you.'})
].join('');

const UNITS = [
  {id:'u1', title:'Foundations', blurb:'How this site works, what a database is, the flavours of SQL, database diagrams, data types and the kinds of SQL command. Then build your own tables, add, change and remove data, and learn how to design tables well with normalisation.', lessons:['intro','databases','flavours','erd','datatypes','sqlcommands','build','keys','changedata','normal']},
  {id:'u2', title:'Introduction to querying', blurb:'Meet Northwind, the database the rest of the course uses, then choose the columns and rows you need, and sort, trim, search and calculate.', lessons:['map','select','operators','sorting','distinct','wildcards','concat','arithmetic','cp1']},
  {id:'u3', title:'Summarising data', blurb:'Turn hundreds of rows into totals, averages and counts, and deal with missing values.', lessons:['aggregates','groupby','having','nulls','cp2']},
  {id:'u4', title:'Combining tables', blurb:'Use the keys from the ERD to pull data from several tables at once.', lessons:['joinsintro','innerjoin','leftjoin','multijoin','cp3']},
  {id:'u5', title:'Subqueries', blurb:'Feed the result of one query into another.', lessons:['subintro','subwhere','subfrom','exists','cp4']},
  {id:'u6', title:'Going further', blurb:'Conditional logic, dates and text, indexes for faster searches, and saving SQL in the database as views and stored procedures.', lessons:['case','datesstrings','indexes','views','procedures']},
  {id:'u7', title:'Advanced topics', audience:'For data engineers', blurb:'Window functions, statistics, WITH, temporary tables, pivoting and making queries fast. These go beyond everyday querying and are aimed at data engineers; if that isn\'t your role, they\'re optional.', lessons:['windows','ranking','leadlag','frames','stats','cte','temptables','pivot','performance','cp5']},
  {id:'u8', title:'Capstone project', blurb:'Put it all together on your own SQL Server, MySQL or SQLite: build a database of Spartans and courses, then answer questions about Northwind.', lessons:['capstone']}
];

const LESSONS = {
  intro:{title:'How this site works', summary:'How the lessons, exercises, quizzes and dialect notes work, and how to install SQL on your own computer.', cmds:[], kind:'intro'},
  capstone:{title:'Capstone project', summary:'Design tables, draw an ERD and answer nine Northwind questions, in your own SQL Server, MySQL or SQLite.', cmds:['CREATE TABLE','INSERT','JOIN','GROUP BY','CREATE VIEW','CREATE PROCEDURE'], kind:'capstone'},
  databases:{title:'What\'s a database', summary:'What a database is, how it\'s organised into tables, rows and columns, and what SQL is for.', cmds:[], kind:'databases'},
  flavours:{title:'SQL flavours', summary:'The dialects of SQL: MySQL, T-SQL and SQLite, what\'s the same and what changes.', cmds:[], kind:'flavours'},
  erd:{title:'Entity relationship diagrams', summary:'How to read a diagram of a database\'s tables, keys and relationships.', cmds:[], kind:'erd'},
  datatypes:{title:'Data types', summary:'What a data type is, the main types, how each dialect names them, and choosing the right one.', cmds:['CREATE TABLE','INSERT INTO','INTEGER','REAL','TEXT','typeof()','CAST()'], db:'mydb', rollback:true,
    learn:`
<p>When you create a table, you give every column a <strong>data type</strong>. It tells the database what kind of "stuff" will go in that column: text, whole numbers, decimals, dates and so on.</p>
<p>Choosing the right type matters because it affects:</p>
<ul class="plain"><li><strong>What's allowed in:</strong> a date column won't accept "next Tuesday", and a number column won't accept letters.</li><li><strong>Maths:</strong> you can add up prices stored as numbers, but not names.</li><li><strong>Sorting:</strong> as text, <code>'10'</code> comes before <code>'9'</code>; as numbers, it comes after.</li><li><strong>Space:</strong> a whole number takes less room than the same digits stored as text.</li></ul>
<h3>The main data types</h3>
<p>There are many types, but these are the most important. Most databases use these names:</p>
<div class="tbl-wrap"><table class="mini dtypes"><tr><th>Type</th><th>Holds</th><th>Example</th></tr>
<tr class="grp"><th colspan="3">Text</th></tr>
<tr><td><code>VARCHAR(n)</code></td><td><strong>Variable</strong>-length text, up to <em>n</em> characters. It only uses the space it needs.</td><td><code>film_name VARCHAR(10)</code><br>'Jaws'</td></tr>
<tr><td><code>CHAR(n)</code></td><td><strong>Fixed</strong>-length text: always exactly <em>n</em> characters. Good for codes that are always the same length.</td><td><code>phone CHAR(11)</code><br>'07971781325'</td></tr>
<tr class="grp"><th colspan="3">Numbers</th></tr>
<tr><td><code>INT</code></td><td>Whole numbers, positive or negative. <code>BIGINT</code> holds bigger ones; <code>SMALLINT</code> and <code>TINYINT</code> hold smaller ones in less space.</td><td><code>quantity INT</code><br>42</td></tr>
<tr><td><code>DECIMAL(p,s)</code><br>or <code>NUMERIC</code></td><td><strong>Exact</strong> numbers with a fixed number of decimal places: <em>p</em> digits in total, <em>s</em> of them after the decimal point. Use it for money.</td><td><code>weight DECIMAL(6,4)</code><br>63.5029</td></tr>
<tr><td><code>FLOAT</code></td><td><strong>Approximate</strong> numbers, including very large or very small ones, for scientific use. Not for money: it can round slightly.</td><td><code>distance FLOAT</code><br>1.496e11</td></tr>
<tr class="grp"><th colspan="3">Dates and times</th></tr>
<tr><td><code>DATE</code>, <code>TIME</code>, <code>DATETIME</code></td><td>A date, a time, or both. Written in quotes, year first.</td><td><code>born DATE</code><br>'1980-01-31'</td></tr>
<tr class="grp"><th colspan="3">Other</th></tr>
<tr><td><code>BIT</code> or <code>BOOLEAN</code></td><td>True or false: <code>1</code>, <code>0</code> (or <code>NULL</code>).</td><td><code>is_happy BIT</code><br>1</td></tr>
<tr><td><code>BINARY</code></td><td>Raw data, such as an image or a file.</td><td><code>photo BINARY</code></td></tr></table></div>
${TIP('<strong>The numbers in brackets:</strong> <code>VARCHAR(10)</code> means at most 10 characters. <code>DECIMAL(6,4)</code> means 6 digits in total with 4 after the decimal point, so 2 before it: the biggest value is 99.9999.')}
<p>A missing value is <code>NULL</code>. It isn't a type of its own: any column can hold <code>NULL</code> unless you say <code>NOT NULL</code>.</p>
<h3>Data types in each dialect</h3>
<p>Each database has its own version of these types, and a few of its own. Pick a tab:</p>
${TABS([
 {label:'🪶 SQLite', html:`<p>SQLite keeps it simple. Every value is stored as one of five types: <code>INTEGER</code>, <code>REAL</code>, <code>TEXT</code>, <code>BLOB</code> or <code>NULL</code>. You can still write the usual names in <code>CREATE TABLE</code>: SQLite accepts them and stores each value as the closest of its own types.</p>
<div class="tbl-wrap"><table class="mini"><tr><th>Kind of data</th><th>You can write</th><th>SQLite stores it as</th></tr>
<tr><td>Text</td><td><code>VARCHAR(n)</code>, <code>CHAR(n)</code>, <code>TEXT</code></td><td><code>TEXT</code></td></tr>
<tr><td>Whole numbers</td><td><code>INT</code>, <code>INTEGER</code>, <code>BIGINT</code></td><td><code>INTEGER</code></td></tr>
<tr><td>Exact decimals</td><td><code>DECIMAL(p,s)</code>, <code>NUMERIC</code></td><td><code>INTEGER</code> or <code>REAL</code></td></tr>
<tr><td>Approximate decimals</td><td><code>REAL</code>, <code>FLOAT</code>, <code>DOUBLE</code></td><td><code>REAL</code></td></tr>
<tr><td>Dates and times</td><td><code>DATE</code>, <code>DATETIME</code>, <code>TEXT</code></td><td><code>TEXT</code>, as <code>'YYYY-MM-DD'</code></td></tr>
<tr><td>True or false</td><td><code>BOOLEAN</code>, <code>BIT</code>, <code>INTEGER</code></td><td><code>INTEGER</code>: <code>1</code> or <code>0</code></td></tr>
<tr><td>Files and images</td><td><code>BLOB</code></td><td><code>BLOB</code></td></tr></table></div>
<p class="small">SQLite doesn't enforce lengths: a <code>VARCHAR(10)</code> column will happily store 20 characters. MySQL and SQL Server won't.</p>
<p class="small"><strong>Money in SQLite:</strong> SQLite has no exact decimal type, so even a <code>DECIMAL(10,2)</code> column stores 21.35 as a <code>REAL</code>. That's why Northwind's prices are <code>REAL</code> on this site. In MySQL and SQL Server, use <code>DECIMAL</code> for money, as the table above says.</p>`},
 {label:'🐬 MySQL', html:`<div class="tbl-wrap"><table class="mini"><tr><th>Kind of data</th><th>MySQL types</th><th>Notes</th></tr>
<tr><td>Text</td><td><code>VARCHAR(n)</code>, <code>CHAR(n)</code></td><td><code>CHAR</code> holds up to 255 characters</td></tr>
<tr><td>Long text</td><td><code>TEXT</code>, <code>MEDIUMTEXT</code>, <code>LONGTEXT</code></td><td>For anything longer, such as comments</td></tr>
<tr><td>Whole numbers</td><td><code>TINYINT</code>, <code>SMALLINT</code>, <code>INT</code>, <code>BIGINT</code></td><td>Smallest to largest</td></tr>
<tr><td>Exact decimals</td><td><code>DECIMAL(p,s)</code></td><td><code>NUMERIC</code> means the same</td></tr>
<tr><td>Approximate decimals</td><td><code>FLOAT</code>, <code>DOUBLE</code></td><td><code>DOUBLE</code> is more precise</td></tr>
<tr><td>Dates and times</td><td><code>DATE</code>, <code>TIME</code>, <code>DATETIME</code>, <code>TIMESTAMP</code></td><td>Written <code>'YYYY-MM-DD'</code></td></tr>
<tr><td>True or false</td><td><code>BOOLEAN</code></td><td>Really a <code>TINYINT</code>: <code>TRUE</code> is 1, <code>FALSE</code> is 0</td></tr>
<tr><td>Files and images</td><td><code>BINARY(n)</code>, <code>VARBINARY(n)</code>, <code>BLOB</code></td><td></td></tr></table></div>
<p class="small">MySQL has no <code>VARCHAR(MAX)</code>: use <code>TEXT</code> for long text. Auto-numbered IDs use <code>INT AUTO_INCREMENT</code>.</p>`},
 {label:'🪟 T-SQL', html:`<div class="tbl-wrap"><table class="mini"><tr><th>Kind of data</th><th>SQL Server types</th><th>Notes</th></tr>
<tr><td>Text</td><td><code>VARCHAR(n)</code>, <code>CHAR(n)</code></td><td><code>NVARCHAR</code> and <code>NCHAR</code> for text in other alphabets</td></tr>
<tr><td>Long text</td><td><code>VARCHAR(MAX)</code></td><td><code>TEXT</code> is deprecated: use <code>VARCHAR(MAX)</code> instead</td></tr>
<tr><td>Whole numbers</td><td><code>TINYINT</code>, <code>SMALLINT</code>, <code>INT</code>, <code>BIGINT</code></td><td><code>TINYINT</code> is 0 to 255</td></tr>
<tr><td>Exact decimals</td><td><code>DECIMAL(p,s)</code>, <code>NUMERIC</code></td><td>Also <code>MONEY</code></td></tr>
<tr><td>Approximate decimals</td><td><code>FLOAT</code>, <code>REAL</code></td><td></td></tr>
<tr><td>Dates and times</td><td><code>DATE</code>, <code>TIME</code>, <code>DATETIME</code>, <code>DATETIME2</code></td><td><code>DATETIME2</code> is more precise; prefer it for new tables</td></tr>
<tr><td>True or false</td><td><code>BIT</code></td><td><code>1</code>, <code>0</code> or <code>NULL</code>. There's no <code>BOOLEAN</code></td></tr>
<tr><td>Files and images</td><td><code>BINARY(n)</code>, <code>VARBINARY(n)</code>, <code>VARBINARY(MAX)</code></td><td></td></tr></table></div>
<p class="small">To see a table's columns and types in SQL Server, run <code>EXEC sp_help 'film_table';</code>. Auto-numbered IDs use <code>INT IDENTITY(1,1)</code>.</p>`}
])}
<h3>Choose the data type</h3>
<p>Which type would you give each of these columns? Decide, then check:</p>
<div class="tbl-wrap"><table class="mini"><tr><th>Column</th><th>Description</th><th>Example</th></tr>
<tr><td>Post code</td><td>6 to 8 characters</td><td>WV1 8JD</td></tr>
<tr><td>Phone number</td><td>11 digits, no punctuation</td><td>07971781325</td></tr>
<tr><td>Birth date</td><td>A date</td><td>31/01/1980</td></tr>
<tr><td>Weight in kg</td><td>A number with 4 decimal places</td><td>63.5029</td></tr>
<tr><td>Comments</td><td>A long block of text</td><td>Lorem ipsum dolor sit amet…</td></tr></table></div>
<details class="answers" data-testid="dtype-answers"><summary>Show the answers</summary>
<div class="tbl-wrap"><table class="mini"><tr><th>Column</th><th>Data type</th><th>Why</th></tr>
<tr><td>Post code</td><td><code>VARCHAR(10)</code></td><td>The length varies, and it has letters and a space.</td></tr>
<tr><td>Phone number</td><td><code>CHAR(11)</code></td><td>Always 11 characters. Text, not a number: as a number, the leading 0 would disappear, and you never do maths on a phone number.</td></tr>
<tr><td>Birth date</td><td><code>DATE</code></td><td>Stored as <code>'1980-01-31'</code>, so dates sort and compare properly.</td></tr>
<tr><td>Weight in kg</td><td><code>DECIMAL(6,4)</code></td><td>Exact, with 4 places after the decimal point.</td></tr>
<tr><td>Comments</td><td><code>VARCHAR(MAX)</code> in T-SQL; <code>TEXT</code> in MySQL and SQLite</td><td>Long text with no sensible limit.</td></tr></table></div></details>
<h3>Trying it out</h3>
<p>Here's a script that creates two tables, choosing a type for every column, then adds some data. Run it and look at the log: each statement is listed as it runs. You'll build these same tables yourself, step by step, in <a href="#/lesson/build">Creating tables</a>.</p>
${C(MYDB_SEED.replace('CREATE TABLE Customers', 'DROP TABLE IF EXISTS Orders;\nDROP TABLE IF EXISTS Customers;\n\nCREATE TABLE Customers') + "\n\nSELECT * FROM Customers;")}
${TIP('The <code>PRIMARY KEY</code>, <code>AUTOINCREMENT</code> and <code>FOREIGN KEY … REFERENCES</code> lines are the <strong>keys</strong> you met in <a href="#/lesson/databases">What\'s a database</a> and on the <a href="#/lesson/erd">ERD</a>. They aren\'t data types, so don\'t worry about them here: you\'ll write your own in <a href="#/lesson/build">Creating tables</a>, and <a href="#/lesson/keys">Primary and foreign keys</a> explains the rules.')}
<p>In this lesson those tables are always there, with this data, and every run starts from a fresh copy:</p>
${MYDB_TABLES}
<p>Insert a row of your own. Each value has to suit its column: text in quotes, numbers without:</p>
${C("INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Ana Lopez', 1.62, 0);\n\nSELECT * FROM Customers;")}
<h3>Seeing a column's type</h3>
<p>Each dialect has its own way to list a table's columns and their types:</p>
${DIFF({title:'Seeing a table\'s columns and types in each dialect', sqlite:"PRAGMA table_info('Customers');", mysql:'DESCRIBE Customers;', tsql:"EXEC sp_help 'Customers';", note:'MySQL and SQL Server can also query <code>INFORMATION_SCHEMA.COLUMNS</code>, which works in both.'})}
<p>Here's the SQLite one:</p>
${C("PRAGMA table_info('Customers');")}
${HD(['sqlite'],'typeof(): how a value was stored')}
<p><code>typeof()</code> shows how SQLite actually stored a value. It's SQLite-only: MySQL and SQL Server enforce each column's type, so a value is always stored as its column's type and there's nothing to check.</p>
${C("SELECT typeof(42), typeof(1.85), typeof('Nish'), typeof(NULL);")}
${HD('all','Converting with CAST')}
<p><code>CAST(value AS type)</code> changes a value from one type to another. It works in all three dialects:</p>
${C("SELECT CAST('42' AS INTEGER)  AS 'Text to number',\n       CAST(1.85 AS INTEGER)  AS 'Decimals dropped',\n       CAST(42 AS TEXT)       AS 'Number to text';")}
<h3>The whole-number division trap</h3>
<p>Divide two whole numbers and SQLite gives a whole number, dropping anything after the decimal point. Make one of them a decimal to get the full answer:</p>
${C("SELECT 7 / 2   AS 'Whole numbers',\n       7 / 2.0 AS 'One decimal';")}
${DIFF({title:'7 / 2 in each dialect', common:'7 / 2.0       -- 3.5\n7 * 1.0 / 2   -- 3.5', sqlite:'7 / 2    -- 3', mysql:'7 / 2    -- 3.5000\n7 DIV 2  -- 3', tsql:'7 / 2    -- 3', note:'Making one side a decimal gives the full answer everywhere. Two whole numbers give a whole number in SQLite and T-SQL, but a decimal in MySQL. <code>CAST</code> works in all three too.'})}`,
    ex:[
      {p:'Insert a customer called Ana Lopez, 1.62 tall and not happy (0). Then show her customer_name with the storage type (typeof) of her customer_id, height and is_happy.', hint:"INSERT INTO Customers (customer_name, height, is_happy) VALUES ('Ana Lopez', 1.62, 0); then SELECT customer_name, typeof(customer_id), typeof(height), typeof(is_happy) … WHERE customer_name = 'Ana Lopez';", sol:"INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Ana Lopez', 1.62, 0);\nSELECT customer_name, typeof(customer_id), typeof(height), typeof(is_happy)\nFROM Customers\nWHERE customer_name = 'Ana Lopez';"},
      {p:'Insert Tom Brown, but write his height as text, in quotes: \'1.90\', and make him happy. Then show his name and typeof(height). What did SQLite store?', hint:"INSERT … VALUES ('Tom Brown', '1.90', 1); then SELECT customer_name, typeof(height) … WHERE customer_name = 'Tom Brown';  SQLite turns the text into a REAL because the column is REAL.", sol:"INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Tom Brown', '1.90', 1);\nSELECT customer_name, typeof(height)\nFROM Customers\nWHERE customer_name = 'Tom Brown';"},
      {p:'Show each customer\'s name and their height in centimetres as a whole number (1.85 becomes 185).', hint:'CAST(height * 100 AS INTEGER)', sol:"SELECT customer_name, CAST(height * 100 AS INTEGER) AS 'Height (cm)'\nFROM Customers;"},
      {p:'Which columns in the Orders table are declared as INTEGER? Show their names.', hint:"pragma_table_info('Orders') can be used like a table: SELECT name FROM pragma_table_info('Orders') WHERE type = 'INTEGER';", sol:"SELECT name\nFROM pragma_table_info('Orders')\nWHERE type = 'INTEGER';"}
    ]},

  sqlcommands:{title:'Types of SQL command', summary:'DML, DDL, DCL and TCL, why TRUNCATE isn\'t the same as DELETE, and which groups this course covers.', cmds:['SELECT','INSERT','UPDATE','DELETE','CREATE','ALTER','DROP','TRUNCATE','GRANT','REVOKE','COMMIT','ROLLBACK','SAVEPOINT'], db:'mydb', rollback:true,
    learn:`
<p>SQL commands are grouped by what they work on. Knowing the group tells you a lot about what a command does and how careful to be with it.</p>
<p>SQL has four groups of commands:</p>
<table class="mini cmd-groups"><tr><th>Group</th><th>Stands for</th><th>Works on</th><th>Commands</th></tr>
<tr class="dml"><td><strong>DML</strong></td><td>Data Manipulation Language</td><td>The <strong>data</strong>: reading and changing the rows inside tables</td><td><code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td></tr>
<tr class="ddl"><td><strong>DDL</strong></td><td>Data Definition Language</td><td>The <strong>structure</strong>: tables, columns, keys, views, indexes</td><td><code>CREATE</code>, <code>ALTER</code>, <code>DROP</code>, <code>TRUNCATE</code></td></tr>
<tr><td><strong>DCL</strong></td><td>Data Control Language</td><td><strong>Permissions</strong>: who's allowed to do what</td><td><code>GRANT</code>, <code>REVOKE</code></td></tr>
<tr><td><strong>TCL</strong></td><td>Transaction Control Language</td><td><strong>Transactions</strong>: grouping changes so they all happen, or none do</td><td><code>COMMIT</code>, <code>ROLLBACK</code>, <code>SAVEPOINT</code> (T-SQL writes <code>SAVE TRANSACTION</code>)</td></tr></table>
${TIP('Some books and websites give <code>SELECT</code> a group of its own, <strong>DQL</strong> (Data Query Language), because it only reads data. Either way, the important split is between changing the <em>data</em> (DML) and changing the <em>structure</em> (DDL).')}
<p>This lesson uses the tables from <a href="#/lesson/build">Creating tables</a>. Every run starts from a fresh copy:</p>
${MYDB_TABLES}
<h3>DELETE, TRUNCATE and DROP</h3>
<p>All three get rid of data, which is why they're easy to mix up. But <code>DELETE</code> is <strong>DML</strong>, while <code>TRUNCATE</code> and <code>DROP</code> are <strong>DDL</strong>, and that changes how they behave:</p>
<div class="tbl-wrap"><table class="mini compare-3"><tr><th></th><th class="dml">DELETE</th><th class="ddl">TRUNCATE</th><th class="ddl">DROP</th></tr>
<tr><td>Group</td><td class="dml"><strong>DML</strong>: works on rows</td><td class="ddl"><strong>DDL</strong>: works on the table</td><td class="ddl"><strong>DDL</strong>: works on the table</td></tr>
<tr><td>Removes</td><td>The rows you choose</td><td>Every row</td><td>The whole table: rows <em>and</em> structure</td></tr>
<tr><td>Table afterwards</td><td>Still there</td><td>Still there, empty</td><td>Gone</td></tr>
<tr><td>Can use <code>WHERE</code></td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>Speed on a big table</td><td>Slower: removes and logs each row</td><td>Fast: empties the table in one go</td><td>Fast</td></tr>
<tr><td>Auto-numbered IDs</td><td>Carry on from where they were</td><td>Start again from 1</td><td>Gone with the table</td></tr>
<tr><td>Can be undone with <code>ROLLBACK</code></td><td>Yes, inside a transaction</td><td>🪟 SQL Server: yes, inside a transaction. 🐬 MySQL: <strong>no</strong>, it commits straight away</td><td>🪟 SQL Server: yes, inside a transaction. 🐬 MySQL: <strong>no</strong></td></tr>
<tr><td>If other tables point at it with a foreign key</td><td>Only rows nobody points at can go</td><td>Refused</td><td>Refused</td></tr></table></div>
<p><code>DELETE</code> picks rows with <code>WHERE</code>:</p>
${C("DELETE FROM Orders\nWHERE customer_id = 3;\n\nSELECT * FROM Orders;")}
<p>Without <code>WHERE</code>, it deletes every row, but the table itself stays:</p>
${C("DELETE FROM Orders;\n\n-- COUNT(*) counts the rows\nSELECT COUNT(*) AS 'Orders left' FROM Orders;")}
<p><code>DROP</code> removes the table altogether, so the <code>SELECT</code> afterwards fails:</p>
${CERR("DROP TABLE Orders;\n\nSELECT * FROM Orders;")}
${DIFF({title:'Emptying a table in each dialect', common:'DELETE FROM Orders;', sqlite:'~No TRUNCATE: DELETE without WHERE does the same job, and SQLite speeds it up for you', mysql:'TRUNCATE TABLE Orders;', tsql:'TRUNCATE TABLE Orders;'})}
<h3>Undoing changes with transactions (TCL)</h3>
<p>A transaction groups changes so they all happen or none do. <code>ROLLBACK</code> undoes everything since the transaction started. This example uses a <strong>savepoint</strong>, a marker you can roll back to:</p>
${C("SAVEPOINT before_delete;\nDELETE FROM Orders;\nSELECT COUNT(*) AS 'Orders after DELETE' FROM Orders;\n\nROLLBACK TO before_delete;\nSELECT COUNT(*) AS 'Orders after ROLLBACK' FROM Orders;")}
${DIFF({title:'Transactions in each dialect', common:'COMMIT;     -- keep the changes\nROLLBACK;   -- undo them', otherTitle:'Starting a transaction, and savepoints', sqlite:'BEGIN;\nSAVEPOINT name;\nROLLBACK TO name;', mysql:'START TRANSACTION;\nSAVEPOINT name;\nROLLBACK TO name;', tsql:'BEGIN TRANSACTION;\nSAVE TRANSACTION name;\nROLLBACK TRANSACTION name;', note:'In MySQL, DDL such as <code>TRUNCATE</code>, <code>DROP</code> and <code>CREATE</code> commits automatically, so it can\'t be rolled back. SQL Server and SQLite can roll DDL back inside a transaction.'})}
<h3>What this course covers, and what it doesn't</h3>
<table class="mini"><tr><th>Group</th><th>In this course</th></tr>
<tr><td><strong>DML</strong></td><td><strong>Most of the course.</strong> <code>SELECT</code> from <a href="#/lesson/select">Simple queries</a> onwards, and <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> in <a href="#/lesson/changedata">Inserting, updating and deleting data</a>.</td></tr>
<tr><td><strong>DDL</strong></td><td><strong>Covered.</strong> <code>CREATE</code> and <code>ALTER</code> in <a href="#/lesson/build">Creating tables</a>, plus views, temporary tables and indexes later on. <code>TRUNCATE</code> and <code>DROP</code> here.</td></tr>
<tr><td><strong>TCL</strong></td><td><strong>Only this lesson's savepoint example.</strong> Transactions matter most in applications, where several changes must succeed or fail together, such as moving money between two accounts.</td></tr>
<tr><td><strong>DCL</strong></td><td><strong>Not covered.</strong> SQLite has no user accounts, so there's nothing to grant. In MySQL and SQL Server, a database administrator uses it to control who can read or change each table (see the example below).</td></tr></table>
${DIFF({title:'DCL: giving and taking away permission', sqlite:'~Not available: SQLite has no users or permissions', mysql:"GRANT SELECT ON northwind.Customers TO 'trainee'@'localhost';\nREVOKE SELECT ON northwind.Customers FROM 'trainee'@'localhost';", tsql:'GRANT SELECT ON Customers TO trainee;\nREVOKE SELECT ON Customers FROM trainee;'})}`,
    check:[
      {q:'In the four groups used here, which group does SELECT belong to?', a:['DDL','DML','DCL'], c:1, why:'SELECT works with the data in tables, so it\'s DML, alongside INSERT, UPDATE and DELETE. Some sources give it a group of its own, DQL.'},
      {q:'Which group does TRUNCATE belong to?', a:['DML, like DELETE','DDL, like DROP','TCL, like ROLLBACK'], c:1, why:'TRUNCATE works on the table as a whole rather than on chosen rows, so it\'s DDL, even though it removes data.'},
      {q:'You need to remove only Rich Gurney\'s orders. Which command?', a:['DELETE … WHERE customer_id = 3','TRUNCATE TABLE Orders','DROP TABLE Orders'], c:0, why:'Only DELETE can pick rows with WHERE. TRUNCATE empties the whole table and DROP removes it.'},
      {q:'In MySQL, which of these can be undone with ROLLBACK inside a transaction?', a:['TRUNCATE TABLE Orders','DROP TABLE Orders','DELETE FROM Orders'], c:2, why:'DELETE is DML, so it can be rolled back. In MySQL, DDL like TRUNCATE and DROP commits straight away.'},
      {q:'After TRUNCATE, what happens to an auto-numbered order_id?', a:['It starts again from 1','It carries on from the highest number used','The column is removed'], c:0, why:'TRUNCATE resets the counter. DELETE leaves it where it was, so the next new row carries on numbering.'}
    ]},

  build:{title:'Creating tables', summary:'Build two linked tables, add data and see the foreign key in action.', cmds:['CREATE TABLE','PRIMARY KEY','FOREIGN KEY','INSERT INTO','ALTER TABLE'], kind:'build'},
  map:{title:'Meet Northwind', summary:'The sample database every exercise from here on uses.', cmds:[], kind:'map'},

  /* ===== Unit 2 ===== */
  keys:{title:'Primary and foreign keys', summary:'The rules keys enforce, what happens when you delete a parent row, and how to name and add keys.', cmds:['PRIMARY KEY','FOREIGN KEY','REFERENCES','ON DELETE CASCADE','ON DELETE SET NULL','CONSTRAINT'], db:'mydb', rollback:true,
    learn:`
<p>Keys are what make a relational database hang together. You've already used them in <a href="#/lesson/build">Creating tables</a>; this lesson sets out the rules they enforce. It uses the same tables, and every run starts from a fresh copy:</p>
${MYDB_TABLES}
<h3>Primary keys</h3>
<p>A <strong>primary key</strong> identifies each row. Every table should have one, and its values must be:</p>
<ul class="plain"><li><strong>Unique:</strong> no two customers can share a <code>customer_id</code>.</li><li><strong>Never empty:</strong> a primary key can't be <code>NULL</code>.</li></ul>
<p>Try to add a second customer with ID 1, and the database refuses:</p>
${CERR("INSERT INTO Customers (customer_id, customer_name, height, is_happy)\nVALUES (1, 'Another Nish', 1.75, 1);")}
<p>A key can also be made of two columns together, called a <strong>composite key</strong>: each <em>pair</em> must be unique. You'll see one in the <a href="#/lesson/normal">Normalisation</a> lesson.</p>
<h3>Foreign keys</h3>
<p>A <strong>foreign key</strong> is a column that holds another table's primary key. <code>Orders.customer_id</code> holds a <code>Customers.customer_id</code>, so every order points at the customer who placed it. Here's how the Orders table was created:</p>
${C("SELECT sql FROM sqlite_master WHERE name = 'Orders';")}
<p>A foreign key enforces three rules:</p>
<ol class="why-steps">
<li><strong>It must point at a row that exists</strong>, or be <code>NULL</code>. There's no customer 99:</li>
</ol>
${CERR("INSERT INTO Orders (order_number, customer_id)\nVALUES (1007, 99);")}
<p>An order with no customer at all (<code>NULL</code>) is allowed, because it doesn't point at anything:</p>
${C("INSERT INTO Orders (order_number, customer_id)\nVALUES (1007, NULL);\n\nSELECT * FROM Orders;")}
<ol class="why-steps" start="2">
<li><strong>Parents come first.</strong> A customer has to exist before you can give them an order, so you create and fill <code>Customers</code> before <code>Orders</code>, and drop <code>Orders</code> before <code>Customers</code>.</li>
<li><strong>You can't delete a parent that still has children.</strong> Nish Mandal has orders, so deleting him is refused:</li>
</ol>
${CERR("DELETE FROM Customers\nWHERE customer_name = 'Nish Mandal';")}
<h3>What should happen when a parent is deleted?</h3>
<p>Refusing is the default, but you can choose what happens when the foreign key is created, with <code>ON DELETE</code>:</p>
<table class="mini"><tr><th>Option</th><th>When a customer is deleted, their orders are…</th></tr>
<tr><td>(nothing written)</td><td>Protected: the delete is refused while orders exist</td></tr>
<tr><td><code>ON DELETE CASCADE</code></td><td>Deleted too</td></tr>
<tr><td><code>ON DELETE SET NULL</code></td><td>Kept, with <code>customer_id</code> set to <code>NULL</code></td></tr></table>
<p>This script rebuilds <code>Orders</code> with <code>ON DELETE CASCADE</code>, then deletes Nish. His orders go with him:</p>
${C("DROP TABLE Orders;\nCREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n        ON DELETE CASCADE\n);\nINSERT INTO Orders (order_number, customer_id) VALUES\n    (1001, 1), (1002, 2), (1003, 3), (1004, 1);\n\nDELETE FROM Customers WHERE customer_name = 'Nish Mandal';\nSELECT * FROM Orders;")}
<p>And with <code>ON DELETE SET NULL</code>, his orders stay but no longer belong to anyone:</p>
${C("DROP TABLE Orders;\nCREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n        ON DELETE SET NULL\n);\nINSERT INTO Orders (order_number, customer_id) VALUES\n    (1001, 1), (1002, 2), (1003, 3), (1004, 1);\n\nDELETE FROM Customers WHERE customer_name = 'Nish Mandal';\nSELECT * FROM Orders;")}
${TIP('<code>CASCADE</code> is powerful but dangerous: one <code>DELETE</code> can quietly remove rows from several tables. The default, refusing, is the safest choice unless you\'re sure.')}
<h3>Naming a key</h3>
<p>You can give a key a name with <code>CONSTRAINT</code>. The name appears in error messages, and you need it if you ever want to remove the key:</p>
${C("DROP TABLE Orders;\nCREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    CONSTRAINT fk_orders_customers\n        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n);\nSELECT sql FROM sqlite_master WHERE name = 'Orders';")}
${DIFF({title:'Keys in each dialect', common:'FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n    ON DELETE CASCADE        -- or SET NULL\nCONSTRAINT fk_orders_customers FOREIGN KEY …', otherTitle:'Adding a foreign key to an existing table', sqlite:'~Not possible: create the table again with the key included', mysql:'ALTER TABLE Orders\n    ADD CONSTRAINT fk_orders_customers\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id);', tsql:'ALTER TABLE Orders\n    ADD CONSTRAINT fk_orders_customers\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id);', note:'Writing keys in <code>CREATE TABLE</code>, including <code>ON DELETE</code> and <code>CONSTRAINT</code>, is the same in all three. SQLite only checks foreign keys once <code>PRAGMA foreign_keys = ON;</code> has been run; this site does that for you, and MySQL and SQL Server always check.'})}
<p>Foreign keys are also the lines on an ERD, and they're what you join tables on in <a href="#/lesson/joinsintro">Unit 4</a>.</p>`,
    ex:[
      {p:'Add Phil Windridge as a customer (1.80 tall, happy), then give him order 1007. He\'ll be customer 4. Then show every order.', hint:'The customer has to exist first: INSERT into Customers, then INSERT INTO Orders (order_number, customer_id) VALUES (1007, 4).', sol:"INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Phil Windridge', 1.80, 1);\nINSERT INTO Orders (order_number, customer_id)\nVALUES (1007, 4);\nSELECT * FROM Orders;"},
      {p:'Remove Cathy French (customer 2) and her orders, in an order the foreign key allows, then show every customer.', hint:'Children before parents: DELETE her orders first, then the customer.', sol:"DELETE FROM Orders    WHERE customer_id = 2;\nDELETE FROM Customers WHERE customer_id = 2;\nSELECT * FROM Customers;"},
      {p:'Rebuild Orders so that deleting a customer also deletes their orders. Add orders 1001 for customer 1 and 1002 for customer 2, delete customer 1, and show what\'s left in Orders.', hint:'DROP TABLE Orders; then CREATE TABLE Orders with FOREIGN KEY … REFERENCES Customers(customer_id) ON DELETE CASCADE.', sol:"DROP TABLE Orders;\nCREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE CASCADE\n);\nINSERT INTO Orders (order_number, customer_id) VALUES (1001, 1), (1002, 2);\nDELETE FROM Customers WHERE customer_id = 1;\nSELECT * FROM Orders;"}
    ]},

  changedata:{title:'Inserting, updating and deleting data', summary:'Add rows to the tables you created, change them and remove them, safely.', cmds:['INSERT INTO','VALUES','UPDATE','SET','DELETE FROM'], db:'mydb', rollback:true,
    learn:`
<p>In <a href="#/lesson/build">Creating tables</a> you built two tables and added a few rows. This lesson carries on from there with the same tables and the same data:</p>
${MYDB_TABLES}
<p>These three statements change the data (they're all <a href="#/lesson/sqlcommands">DML</a>):</p>
<table class="mini"><tr><th>Statement</th><th>Does</th></tr>
<tr><td><code>INSERT INTO</code></td><td>Adds new rows</td></tr>
<tr><td><code>UPDATE</code></td><td>Changes values in rows that already exist</td></tr>
<tr><td><code>DELETE FROM</code></td><td>Removes rows</td></tr></table>
${TIP('<strong>Every run here starts from a fresh copy of the tables</strong>, so you can experiment as much as you like. That\'s why each example ends with a <code>SELECT</code>: to show the change.')}
<h3>INSERT: adding rows</h3>
<p>List the columns you're filling, then the values in the same order. Leave out <code>customer_id</code>: it's auto-numbered, so the database fills it in.</p>
${C("INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Phil Windridge', 1.80, 1);\n\nSELECT * FROM Customers;")}
<p>Add several rows at once by separating them with commas:</p>
${C("INSERT INTO Orders (order_number, customer_id) VALUES\n    (1007, 1),\n    (1008, 2);\n\nSELECT * FROM Orders;")}
<p>Or copy rows from a query with <code>INSERT INTO … SELECT</code>. This gives every happy customer a new order:</p>
${C("INSERT INTO Orders (order_number, customer_id)\nSELECT 2000 + customer_id, customer_id\nFROM Customers\nWHERE is_happy = 1;\n\nSELECT * FROM Orders;")}
<h3>UPDATE: changing rows</h3>
<p><code>SET</code> gives the new values; <code>WHERE</code> picks the rows. Cathy French is happy now:</p>
${C("UPDATE Customers\nSET is_happy = 1\nWHERE customer_name = 'Cathy French';\n\nSELECT * FROM Customers;")}
${TIP('<strong>Always check your WHERE.</strong> An <code>UPDATE</code> or <code>DELETE</code> without one changes <em>every row</em> in the table. A good habit: run a <code>SELECT</code> with the same <code>WHERE</code> first, and check it returns only the rows you mean.')}
<h3>DELETE: removing rows</h3>
${C("DELETE FROM Orders\nWHERE order_number = 1006;\n\nSELECT * FROM Orders;")}
<p>The foreign key protects related data. Rich Gurney still has orders, so deleting him would leave orders that belong to nobody. Run this and the database refuses:</p>
${CERR("DELETE FROM Customers\nWHERE customer_name = 'Rich Gurney';")}
<p>Delete his orders first, then him:</p>
${C("DELETE FROM Orders    WHERE customer_id = 3;\nDELETE FROM Customers WHERE customer_id = 3;\n\nSELECT * FROM Customers;")}
${DIFF({title:'Getting the ID of the row you just inserted', sqlite:'SELECT last_insert_rowid();', mysql:'SELECT LAST_INSERT_ID();', tsql:'SELECT SCOPE_IDENTITY();', note:'<code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> themselves work the same in all three. For emptying a whole table, see <a href="#/lesson/sqlcommands">Types of SQL command</a>.'})}`,
    ex:[
      {p:'Add a new customer called Phil Windridge, 1.80 tall and happy, then show every customer.', hint:"INSERT INTO Customers (customer_name, height, is_happy) VALUES ('Phil Windridge', 1.80, 1); then SELECT * FROM Customers;", sol:"INSERT INTO Customers (customer_name, height, is_happy)\nVALUES ('Phil Windridge', 1.80, 1);\nSELECT * FROM Customers;"},
      {p:'Add two new orders for Cathy French (customer 2), numbers 1007 and 1008, in one statement. Then show all of Cathy\'s orders.', hint:'One INSERT with two sets of brackets after VALUES, then SELECT … WHERE customer_id = 2.', sol:"INSERT INTO Orders (order_number, customer_id) VALUES\n    (1007, 2),\n    (1008, 2);\nSELECT * FROM Orders WHERE customer_id = 2;"},
      {p:'Nish Mandal has been measured again: he\'s 1.86. Update his height, then show his row.', hint:"UPDATE Customers SET height = 1.86 WHERE customer_name = 'Nish Mandal';", sol:"UPDATE Customers\nSET height = 1.86\nWHERE customer_name = 'Nish Mandal';\nSELECT * FROM Customers WHERE customer_name = 'Nish Mandal';"},
      {p:'Order 1002 was cancelled. Delete it, then show every order.', hint:'DELETE FROM Orders WHERE order_number = 1002;', sol:"DELETE FROM Orders\nWHERE order_number = 1002;\nSELECT * FROM Orders;"},
      {p:'Remove Rich Gurney completely: his orders first, then the customer. Then show every customer.', hint:'Two DELETEs: Orders WHERE customer_id = 3, then Customers WHERE customer_id = 3. The other way round, the foreign key stops you.', sol:"DELETE FROM Orders    WHERE customer_id = 3;\nDELETE FROM Customers WHERE customer_id = 3;\nSELECT * FROM Customers;"}
    ]},

  normal:{title:'Normalisation: 1NF to 3NF', summary:'Split data into well-designed tables so each fact is stored once: first, second and third normal form.', cmds:[],
    learn:`
<p><strong>Normalisation</strong> is a way of designing tables so that every fact is stored in exactly one place. You work through a series of rules called <strong>normal forms</strong>. Each one fixes a kind of problem, and most databases aim for the <strong>third normal form (3NF)</strong>.</p>
<h3>Why it matters</h3>
<p>Here's a list of films kept in one big table, the way it might start life in a spreadsheet. Notice the crossover (highlighted): Brad Pitt is in three of the films, Morgan Freeman is in two, and David Fincher directed two.</p>
<div class="tbl-wrap"><table class="mini"><tr><th>title</th><th>year</th><th>director</th><th>director_born</th><th>cast</th></tr>
<tr><td>The Shawshank Redemption</td><td>1994</td><td>Frank Darabont</td><td>1959</td><td>Tim Robbins (Andy Dufresne), Morgan Freeman (Red)</td></tr>
<tr><td>Se7en</td><td>1995</td><td><mark class="x">David Fincher</mark></td><td>1962</td><td><mark class="x">Brad Pitt</mark> (Detective Mills), Morgan Freeman (Detective Somerset)</td></tr>
<tr><td>Fight Club</td><td>1999</td><td><mark class="x">David Fincher</mark></td><td>1962</td><td><mark class="x">Brad Pitt</mark> (Tyler Durden), Edward Norton (The Narrator)</td></tr>
<tr><td>Ocean's Eleven</td><td>2001</td><td>Steven Soderbergh</td><td>1963</td><td>George Clooney (Danny Ocean), <mark class="x">Brad Pitt</mark> (Rusty Ryan), Julia Roberts (Tess Ocean)</td></tr></table></div>
<p>It holds the right information, but it causes three kinds of problem, called <strong>anomalies</strong>:</p>
<table class="mini"><tr><th>Anomaly</th><th>What goes wrong</th></tr>
<tr><td><strong>Update</strong></td><td>David Fincher's birth year is stored twice. Correct one copy and forget the other, and the data contradicts itself. Once every actor has their own details, Brad Pitt's would be repeated three times.</td></tr>
<tr><td><strong>Insert</strong></td><td>You can't record an actor, or a director, until they're in a film in the list.</td></tr>
<tr><td><strong>Delete</strong></td><td>Delete <em>The Shawshank Redemption</em> and you lose everything you knew about Tim Robbins and Frank Darabont.</td></tr></table>
<h3>First normal form (1NF): one value per cell</h3>
<ul class="plain"><li>Every cell holds a <strong>single value</strong>: no lists like the cast column.</li><li>There are <strong>no repeating groups</strong> of columns (actor1, actor2, actor3…).</li><li>Every row can be identified by a <strong>primary key</strong>.</li></ul>
<p>Give each actor in each film their own row, and add each actor's birth year while we're at it. No single column is unique any more, so the key is <strong>title + actor</strong> together:</p>
<div class="tbl-wrap"><table class="mini"><tr><th class="hl-key">title</th><th class="hl-key">actor</th><th>role</th><th>actor_born</th><th>year</th><th>director</th><th>director_born</th></tr>
<tr><td>The Shawshank Redemption</td><td>Tim Robbins</td><td>Andy Dufresne</td><td>1958</td><td>1994</td><td>Frank Darabont</td><td>1959</td></tr>
<tr><td>The Shawshank Redemption</td><td>Morgan Freeman</td><td>Red</td><td>1937</td><td>1994</td><td>Frank Darabont</td><td>1959</td></tr>
<tr><td>Se7en</td><td><mark class="x">Brad Pitt</mark></td><td>Detective Mills</td><td>1963</td><td>1995</td><td><mark class="x">David Fincher</mark></td><td>1962</td></tr>
<tr><td>Se7en</td><td>Morgan Freeman</td><td>Detective Somerset</td><td>1937</td><td>1995</td><td><mark class="x">David Fincher</mark></td><td>1962</td></tr>
<tr><td>Fight Club</td><td><mark class="x">Brad Pitt</mark></td><td>Tyler Durden</td><td>1963</td><td>1999</td><td><mark class="x">David Fincher</mark></td><td>1962</td></tr>
<tr><td>Fight Club</td><td>Edward Norton</td><td>The Narrator</td><td>1969</td><td>1999</td><td><mark class="x">David Fincher</mark></td><td>1962</td></tr>
<tr><td>Ocean's Eleven</td><td>George Clooney</td><td>Danny Ocean</td><td>1961</td><td>2001</td><td>Steven Soderbergh</td><td>1963</td></tr>
<tr><td>Ocean's Eleven</td><td><mark class="x">Brad Pitt</mark></td><td>Rusty Ryan</td><td>1963</td><td>2001</td><td>Steven Soderbergh</td><td>1963</td></tr>
<tr><td>Ocean's Eleven</td><td>Julia Roberts</td><td>Tess Ocean</td><td>1967</td><td>2001</td><td>Steven Soderbergh</td><td>1963</td></tr></table></div>
<p>Every cell holds one value now, but look how much repeats: Brad Pitt's birth year three times, each film's year and director on every one of its rows.</p>
<h3>Second normal form (2NF): depend on the whole key</h3>
<p>In 2NF, every column that isn't part of the key must depend on the <strong>whole</strong> key, not just part of it. That only matters when the key has more than one column, as it does here (title + actor):</p>
<ul class="plain"><li><code>role</code> depends on the film <em>and</em> the actor: Brad Pitt plays a different role in each film. Fine.</li><li><code>actor_born</code> depends only on the <code>actor</code>.</li><li><code>year</code>, <code>director</code> and <code>director_born</code> depend only on the <code>title</code>.</li></ul>
<p>Move each of those into a table where it depends on the whole key:</p>
<div class="two-tables">
<table class="mini"><tr><th colspan="4">Movies</th></tr><tr><th class="hl-key">title</th><th>year</th><th>director</th><th>director_born</th></tr><tr><td>The Shawshank Redemption</td><td>1994</td><td>Frank Darabont</td><td>1959</td></tr><tr><td>Se7en</td><td>1995</td><td>David Fincher</td><td>1962</td></tr><tr><td>Fight Club</td><td>1999</td><td>David Fincher</td><td>1962</td></tr><tr><td>Ocean's Eleven</td><td>2001</td><td>Steven Soderbergh</td><td>1963</td></tr></table>
<table class="mini"><tr><th colspan="2">Actors</th></tr><tr><th class="hl-key">actor</th><th>born</th></tr><tr><td>Tim Robbins</td><td>1958</td></tr><tr><td>Morgan Freeman</td><td>1937</td></tr><tr><td>Brad Pitt</td><td>1963</td></tr><tr><td>Edward Norton</td><td>1969</td></tr><tr><td>George Clooney</td><td>1961</td></tr><tr><td>Julia Roberts</td><td>1967</td></tr></table>
<table class="mini"><tr><th colspan="3">Roles</th></tr><tr><th class="hl-key">title</th><th class="hl-key">actor</th><th>role</th></tr><tr><td>The Shawshank Redemption</td><td>Tim Robbins</td><td>Andy Dufresne</td></tr><tr><td>The Shawshank Redemption</td><td>Morgan Freeman</td><td>Red</td></tr><tr><td>Se7en</td><td>Brad Pitt</td><td>Detective Mills</td></tr><tr><td>Se7en</td><td>Morgan Freeman</td><td>Detective Somerset</td></tr><tr><td>Fight Club</td><td>Brad Pitt</td><td>Tyler Durden</td></tr><tr><td>Fight Club</td><td>Edward Norton</td><td>The Narrator</td></tr><tr><td>Ocean's Eleven</td><td>George Clooney</td><td>Danny Ocean</td></tr><tr><td>Ocean's Eleven</td><td>Brad Pitt</td><td>Rusty Ryan</td></tr><tr><td>Ocean's Eleven</td><td>Julia Roberts</td><td>Tess Ocean</td></tr></table>
</div>
<p>Brad Pitt's birth year is now stored once, and an actor can be added before they're in any film. <code>Roles</code> is a <strong>junction table</strong>: a film has many actors and an actor is in many films, so this many-to-many relationship needs a table in between, just as, in the Northwind database you'll meet in Unit 2, <code>Order Details</code> sits between <code>Orders</code> and <code>Products</code>.</p>
<h3>Third normal form (3NF): nothing but the key</h3>
<p>In 3NF, no column may depend on another column that isn't the key. In <code>Movies</code>, <code>director_born</code> depends on the <code>director</code>, not on the film: this is called a <strong>transitive dependency</strong>, and it's why David Fincher's birth year is still stored twice. So directors get a table of their own, and each film just names its director as a <strong>foreign key</strong>:</p>
<div class="two-tables">
<table class="mini"><tr><th colspan="2">Directors</th></tr><tr><th class="hl-key">director</th><th>born</th></tr><tr><td>Frank Darabont</td><td>1959</td></tr><tr><td>David Fincher</td><td>1962</td></tr><tr><td>Steven Soderbergh</td><td>1963</td></tr></table>
<table class="mini"><tr><th colspan="3">Movies</th></tr><tr><th class="hl-key">title</th><th>year</th><th>director</th></tr><tr><td>The Shawshank Redemption</td><td>1994</td><td>Frank Darabont</td></tr><tr><td>Se7en</td><td>1995</td><td>David Fincher</td></tr><tr><td>Fight Club</td><td>1999</td><td>David Fincher</td></tr><tr><td>Ocean's Eleven</td><td>2001</td><td>Steven Soderbergh</td></tr></table>
</div>
<p>Now every fact is stored once: four tables, <code>Directors</code>, <code>Movies</code>, <code>Actors</code> and <code>Roles</code>, linked by keys. In a real database each would usually have a numeric ID as its primary key, such as <code>movie_id</code> and <code>actor_id</code>, because names aren't always unique and can change.</p>
${TIP('A way to remember the three rules: every column depends on <strong>the key</strong> (1NF), <strong>the whole key</strong> (2NF), and <strong>nothing but the key</strong> (3NF).')}
<h3>Nothing is lost</h3>
<p>Splitting tables doesn't lose anything: joins put the original list back together. This builds the 3NF tables with <code>WITH</code> and joins them, to list every film Brad Pitt is in. You'll learn both in later units, so just run it for now:</p>
${C("WITH Directors(director, born) AS (VALUES\n    ('Frank Darabont', 1959), ('David Fincher', 1962), ('Steven Soderbergh', 1963)),\nMovies(title, year, director) AS (VALUES\n    ('The Shawshank Redemption', 1994, 'Frank Darabont'), ('Se7en', 1995, 'David Fincher'),\n    ('Fight Club', 1999, 'David Fincher'), ('Ocean''s Eleven', 2001, 'Steven Soderbergh')),\nActors(actor, born) AS (VALUES\n    ('Tim Robbins', 1958), ('Morgan Freeman', 1937), ('Brad Pitt', 1963),\n    ('Edward Norton', 1969), ('George Clooney', 1961), ('Julia Roberts', 1967)),\nRoles(title, actor, role) AS (VALUES\n    ('The Shawshank Redemption', 'Tim Robbins', 'Andy Dufresne'), ('The Shawshank Redemption', 'Morgan Freeman', 'Red'),\n    ('Se7en', 'Brad Pitt', 'Detective Mills'), ('Se7en', 'Morgan Freeman', 'Detective Somerset'),\n    ('Fight Club', 'Brad Pitt', 'Tyler Durden'), ('Fight Club', 'Edward Norton', 'The Narrator'),\n    ('Ocean''s Eleven', 'George Clooney', 'Danny Ocean'), ('Ocean''s Eleven', 'Brad Pitt', 'Rusty Ryan'),\n    ('Ocean''s Eleven', 'Julia Roberts', 'Tess Ocean'))\nSELECT m.title, m.year, r.role, m.director, d.born AS director_born\nFROM Roles r\nJOIN Movies m    ON m.title = r.title\nJOIN Directors d ON d.director = m.director\nWHERE r.actor = 'Brad Pitt'\nORDER BY m.year;")}
<h3>What we're not covering</h3>
<p>There are stricter normal forms beyond 3NF, such as <strong>Boyce–Codd normal form (BCNF)</strong>, 4NF and 5NF. They deal with rarer problems, and 3NF is the standard most databases are designed to. Designers also sometimes <strong>denormalise</strong> on purpose, copying data back into fewer tables to make reports faster, but only once the normalised design is in place.</p>
${SAME('Normalisation is about table design, so it\'s the same whichever database you use.')}`,
    check:[
      {q:'The original table had a cast column holding "Brad Pitt (Tyler Durden), Edward Norton (The Narrator)". Which normal form does that break?', a:['1NF: a cell holds more than one value','2NF: a column depends on part of the key','3NF: a column depends on another non-key column'], c:0, why:'1NF needs one value per cell. Each actor in each film becomes its own row, and in the end its own row in the Roles table.'},
      {q:'In a table with the key (title, actor), there\'s an actor_born column. Which normal form does it break?', a:['1NF','2NF','3NF'], c:1, why:'actor_born depends on only part of the key, the actor, which 2NF forbids. It moves to the Actors table, so Brad Pitt\'s birth year is stored once.'},
      {q:'Movies has title (the key), year, director and director_born. Why isn\'t it in 3NF?', a:['It has no primary key','director_born depends on the director, not on the film','year should be text'], c:1, why:'That\'s a transitive dependency: the birth year belongs to the director. Store it once, in a Directors table.'},
      {q:'Why does the Roles table exist?', a:['To store each actor\'s birth year','Films and actors have a many-to-many relationship, and a junction table links them','To speed up searches'], c:1, why:'A film has many actors and an actor (like Brad Pitt) is in many films. Roles holds one row per actor per film, with the role they played.'}
    ]},

  select:{title:'Simple queries', summary:'Choose which columns to show and filter the rows you want.', cmds:['SELECT','FROM','WHERE','COUNT(*)','AS'],
    learn:`
<p>Every query answers two questions: which table, and which columns? <code>FROM</code> names the table and <code>SELECT</code> lists the columns. <code>*</code> means every column. It's handy for exploring, but in real code you should name the columns you need.</p>
${C('SELECT * FROM Customers;')}
${C('SELECT CompanyName, City, Country\nFROM Customers;')}
<p><code>WHERE</code> keeps only the rows that match a condition. Text values go in single quotes; numbers don't.</p>
${C("SELECT CompanyName, City\nFROM Customers\nWHERE City = 'Paris';")}
${C('SELECT ProductName, UnitsInStock\nFROM Products\nWHERE UnitsInStock > 100;')}
<h3>The order you write it vs the order it runs</h3>
<p>You write <code>SELECT</code> first, but the database doesn't run it first. It finds the table (<code>FROM</code>) and filters the rows (<code>WHERE</code>) before it works out the columns in <code>SELECT</code>:</p>
${RUN_ORDER(['SELECT','FROM'])}
<p>You'll meet the other clauses as you go: <code>ORDER BY</code> and <code>DISTINCT</code> later in this unit, and <code>GROUP BY</code> and <code>HAVING</code> in Unit 3. This order explains a lot of SQL's rules, so the diagram will come up again.</p>
${TIP('<code>SELECT</code> filters <strong>columns</strong>. <code>WHERE</code> filters <strong>rows</strong>. They work independently.')}
<p>To count the matching rows, use <code>COUNT(*)</code>. <code>AS</code> gives the result column a readable name, called an alias:</p>
${C("SELECT COUNT(*) AS 'Number of Customers'\nFROM Customers\nWHERE City = 'Paris';")}
<h3>Column aliases</h3>
<p>An <strong>alias</strong> renames a column in your result. It only changes the heading you see, never the table itself. Without one, a calculated column is headed with the calculation, such as <code>COUNT(*)</code>.</p>
${C("SELECT CompanyName AS Company, City AS Town\nFROM Customers;")}
<p>If the alias has a space, put it in quotes. <code>AS</code> itself is optional (<code>City Town</code> works too), but writing it makes the query easier to read:</p>
${C("SELECT CompanyName AS 'Company Name',\n       City Town\nFROM Customers;")}
<p><strong>Where can you use an alias?</strong> Look at the diagram above. <code>ORDER BY</code> runs after <code>SELECT</code>, so it can use an alias (you'll see this in <a href="#/lesson/sorting">Sorting data</a>). <code>WHERE</code> runs <em>before</em> <code>SELECT</code>, so in MySQL and SQL Server the alias doesn't exist yet and <code>WHERE</code> can't use it. SQLite is more relaxed and allows it, but don't rely on that: in <code>WHERE</code>, use the column itself.</p>
${C("SELECT CompanyName, Country AS Nation\nFROM Customers\nWHERE Country = 'UK';")}
${DIFF({title:'Column aliases in each dialect', common:"AS Company\nAS 'Company Name'\nAS \"Company Name\"", otherTitle:'Where they differ', sqlite:"WHERE Nation = 'UK'      -- SQLite lets WHERE use an alias", mysql:'AS `Company Name`\n-- WHERE can\'t use an alias', tsql:'AS [Company Name]\n-- WHERE can\'t use an alias', note:'To be safe in every dialect, use the column itself in <code>WHERE</code>, and save aliases for <code>SELECT</code> and <code>ORDER BY</code>.'})}
<h3>When to use quotes</h3>
<table class="mini"><tr><th>Column type</th><th>Quotes?</th></tr><tr><td><code>TEXT</code>, including dates (SQLite stores dates as text, <code>'YYYY-MM-DD'</code>)</td><td>Yes: <code>'London'</code>, <code>'1997-01-01'</code></td></tr><tr><td><code>INTEGER</code>, <code>REAL</code></td><td>No: <code>5</code>, <code>29.99</code>, <code>1</code></td></tr></table>
<h3>Apostrophes inside text</h3>
<p>A single quote marks where text starts and ends, so a value that contains one needs it doubled: <code>''</code>.</p>
${C("SELECT ProductID, ProductName\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Scones';")}
${DIFF({title:'Quotes in each dialect', common:"WHERE City = 'London'   -- single quotes for text", otherTitle:'Names with spaces', sqlite:'"Order Details"', mysql:'`Order Details`', tsql:'[Order Details]', note:'Single quotes for text work in all three, so stick to them. MySQL also accepts double quotes around text, but in SQLite and T-SQL double quotes mean a <em>name</em>. T-SQL puts <code>N</code> in front of text in other alphabets: <code>N\'London\'</code>.'})}`,
    ex:[
      {p:'How many employees have a home city of London?', hint:'COUNT(*) with a WHERE clause on City. Text values go in single quotes.', sol:"SELECT COUNT(*)\nFROM Employees\nWHERE City = 'London';"},
      {p:'Which employee holds the title of Doctor? Return at least their first and last name.', hint:'Look at the TitleOfCourtesy column. Doctor is stored as Dr. with a full stop.', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE TitleOfCourtesy = 'Dr.';"},
      {p:'How many products are discontinued?', hint:'Discontinued is an INTEGER column: 1 means yes, 0 means no. No quotes needed.', sol:'SELECT COUNT(*)\nFROM Products\nWHERE Discontinued = 1;'},
      {p:'Show the ProductID and UnitPrice of Sir Rodney\'s Marmalade.', hint:"Double the apostrophe: 'Sir Rodney''s Marmalade'", sol:"SELECT ProductID, UnitPrice\nFROM Products\nWHERE ProductName = 'Sir Rodney''s Marmalade';"}
      ,{p:'Show the CompanyName of every customer in Germany as Company, and their ContactName as Main Contact.', hint:"CompanyName AS Company, ContactName AS 'Main Contact' (quotes because of the space). Filter on Country in WHERE.", sol:"SELECT CompanyName AS Company, ContactName AS 'Main Contact'\nFROM Customers\nWHERE Country = 'Germany';"}
    ]},

  operators:{title:'Operators', summary:'Compare values and combine conditions to ask more precise questions.', cmds:['=','<>','>','<','AND','OR','IN','BETWEEN','NOT'],
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
${C("SELECT CompanyName, Country, City\nFROM Customers\nWHERE (Country = 'UK' OR Country = 'France')\n  AND City <> 'London';")}
${SAME('Both <code>&lt;&gt;</code> and <code>!=</code> mean "not equal" in all three.')}`,
    ex:[
      {p:'How many orders are there in total for EmployeeIDs 5 and 7 combined?', hint:'IN (5, 7) is shorter than two OR conditions.', sol:'SELECT COUNT(OrderID)\nFROM Orders\nWHERE EmployeeID IN (5, 7);'},
      {p:'List the name and unit price of every product priced between 10 and 20, including both ends.', hint:'BETWEEN includes both boundary values.', sol:'SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice BETWEEN 10 AND 20;'},
      {p:'Which products are in stock and cost more than 50? Show the name, price and units in stock.', hint:'Two conditions joined with AND.', sol:'SELECT ProductName, UnitPrice, UnitsInStock\nFROM Products\nWHERE UnitsInStock > 0 AND UnitPrice > 50;'},
      {p:'How many customers are not based in the USA, the UK or Germany?', hint:"NOT IN ('USA', 'UK', 'Germany')", sol:"SELECT COUNT(*)\nFROM Customers\nWHERE Country NOT IN ('USA', 'UK', 'Germany');"},
      {p:'Find the employees who live in London and have the title Sales Representative. Show their first and last names.', hint:'City and Title, joined with AND.', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE City = 'London' AND Title = 'Sales Representative';"}
    ]},

  sorting:{title:'Sorting data', summary:'Control the order your results come back in.', cmds:['ORDER BY','ASC','DESC'],
    learn:`
<p>Without <code>ORDER BY</code>, a database returns rows in no guaranteed order. Whenever order matters, say so.</p>
${C("SELECT CompanyName, ContactName\nFROM Customers\nWHERE Country = 'France'\nORDER BY CompanyName ASC;")}
<p><code>ASC</code> (A to Z, smallest first) is the default, so you can leave it out. <code>DESC</code> reverses it.</p>
${C('SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;')}
<p>Add more columns to break ties. Here customers are sorted by country, and alphabetically within each country:</p>
${C('SELECT Country, CompanyName\nFROM Customers\nORDER BY Country ASC, CompanyName ASC;')}
<h3>Why ORDER BY can use an alias</h3>
<p>Remember the diagram from <a href="#/lesson/select">Simple queries</a>: the database runs <code>ORDER BY</code> last, after <code>SELECT</code>. By then the alias exists, so <code>ORDER BY</code> can use it in every dialect. (<code>WHERE</code> runs before <code>SELECT</code>, which is why MySQL and SQL Server won't let <code>WHERE</code> use an alias.)</p>
${C("SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nORDER BY \"Stock Value\" DESC;")}
${TIP('You can also write <code>ORDER BY 2</code> to sort by the second column, but avoid it. If someone reorders the columns later, it silently sorts the wrong one.')}
${DIFF({title:'Sorting in each dialect', common:'ORDER BY Country, CompanyName DESC', sqlite:'ORDER BY Region NULLS LAST', note:'<code>ORDER BY</code>, <code>ASC</code> and <code>DESC</code> work the same in all three. One small extra: a missing value (NULL, see <a href="#/lesson/nulls">Working with NULL values</a>) sorts first in all three, and only SQLite lets you move NULLs to the end with <code>NULLS LAST</code>.'})}`,
    ex:[
      {p:'List every product\'s name and unit price, most expensive first.', hint:'ORDER BY UnitPrice DESC', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;'},
      {p:'Show the City and CompanyName of every customer in Germany, sorted by city, then by company name.', hint:'Two columns in ORDER BY: the first sorts, the second breaks ties.', ordered:[0,1], sol:"SELECT City, CompanyName\nFROM Customers\nWHERE Country = 'Germany'\nORDER BY City, CompanyName;"},
      {p:'Show each employee\'s first name, last name and hire date, longest-serving first.', hint:'The earliest HireDate has served longest, so sort ascending.', ordered:[2], sol:'SELECT FirstName, LastName, HireDate\nFROM Employees\nORDER BY HireDate ASC;'}
    ]},

  distinct:{title:'Removing duplicates and limiting results', summary:'Show each value only once, and return only the first few rows.', cmds:['DISTINCT','COUNT(DISTINCT …)','LIMIT','OFFSET'],
    learn:`
${HD('all','Removing duplicates with DISTINCT')}
<p><code>DISTINCT</code> removes duplicate rows from your result. Many customers share a country, but each country appears once here:</p>
${C("SELECT DISTINCT Country\nFROM Customers\nWHERE ContactTitle = 'Owner';")}
${TIP('<code>DISTINCT</code> looks at all the selected columns together. A row is only a duplicate if <em>every</em> column matches, so more columns usually means fewer duplicates.')}
<p>Why all the columns? Look back at the diagram in <a href="#/lesson/select">Simple queries</a>: <code>DISTINCT</code> runs at step 6, straight after <code>SELECT</code>. By then the columns have been chosen, so it compares the finished rows. Add a column and it compares that too:</p>
${C("SELECT DISTINCT Country, City\nFROM Customers\nWHERE ContactTitle = 'Owner';")}
<p>Inside <code>COUNT</code>, it counts the different values:</p>
${C('SELECT COUNT(DISTINCT Country) AS \'Countries\'\nFROM Customers;')}
${HD(['sqlite','mysql'],'Returning the first rows with LIMIT')}
<p><code>LIMIT</code> works in SQLite and MySQL, but <strong>not in SQL Server</strong>: T-SQL uses <code>TOP</code> instead, shown below. Put <code>LIMIT</code> at the end of the query to return only the first few rows:</p>
${C("SELECT CompanyName, City\nFROM Customers\nWHERE Country = 'France'\nORDER BY CompanyName DESC\nLIMIT 3;")}
<p>Add <code>OFFSET</code> to skip rows first, which is how pages of results work:</p>
${C("SELECT ProductName\nFROM Products\nORDER BY ProductName\nLIMIT 5 OFFSET 10;")}
${HD(['tsql'],'Returning the first rows with TOP')}
<p>T-SQL has no <code>LIMIT</code>. Instead, <code>TOP</code> goes straight after <code>SELECT</code>:</p>
${C("SELECT TOP 5 ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC;", false, READ_ONLY('tsql','SQL Server Management Studio'))}
<p>To skip rows first, T-SQL adds <code>OFFSET … FETCH</code> to the <code>ORDER BY</code>. This skips the 10 most expensive products and returns the next 5:</p>
${C("SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC\nOFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY;", false, READ_ONLY('tsql','SQL Server Management Studio'))}
${DIFF({title:'Limiting rows in each dialect', sqlite:'-- first 5 rows\nSELECT … ORDER BY UnitPrice DESC LIMIT 5\n-- skip 10, then 5\nSELECT … ORDER BY UnitPrice DESC LIMIT 5 OFFSET 10', mysql:'-- first 5 rows\nSELECT … ORDER BY UnitPrice DESC LIMIT 5\n-- skip 10, then 5\nSELECT … ORDER BY UnitPrice DESC LIMIT 5 OFFSET 10\nSELECT … ORDER BY UnitPrice DESC LIMIT 10, 5', tsql:'-- first 5 rows\nSELECT TOP 5 … ORDER BY UnitPrice DESC\n-- skip 10, then 5\nSELECT … ORDER BY UnitPrice DESC\n    OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY', note:'T-SQL puts <code>TOP</code> straight after <code>SELECT</code>, and paging needs an <code>ORDER BY</code>. MySQL\'s short form <code>LIMIT 10, 5</code> means skip 10, then take 5: the opposite order to how it reads.'})}
${TIP('<code>LIMIT</code> without <code>ORDER BY</code> gives you <em>some</em> rows, not the top ones. Sort first.')}`,
    ex:[
      {p:'List each country that has at least one supplier, once each.', hint:'SELECT DISTINCT Country FROM Suppliers', sol:'SELECT DISTINCT Country\nFROM Suppliers;'},
      {p:'How many different cities do employees live in?', hint:'COUNT(DISTINCT City)', sol:'SELECT COUNT(DISTINCT City)\nFROM Employees;'},
      {p:'Show the name and price of the five most expensive products, most expensive first.', hint:'ORDER BY UnitPrice DESC, then LIMIT 5.', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nORDER BY UnitPrice DESC\nLIMIT 5;'},
      {p:'Show each different combination of City and Country for customers in Brazil.', hint:'DISTINCT applies to both columns together.', sol:"SELECT DISTINCT City, Country\nFROM Customers\nWHERE Country = 'Brazil';"}
    ]},

  wildcards:{title:'Wildcards', summary:'Match patterns in text instead of exact values.', cmds:['LIKE','%','_','GLOB','REGEXP (MySQL)'],
    learn:`
<p>Wildcards let you match a <em>pattern</em> instead of an exact value. All three dialects have <code>LIKE</code> with <code>%</code> and <code>_</code>, but each has its own extras, so here's what works where:</p>
<div class="tbl-wrap"><table class="mini dialect-matrix"><tr><th>Pattern</th><th>Means</th><th>🪶 SQLite</th><th>🐬 MySQL</th><th>🪟 T-SQL</th></tr>
<tr><td><code>LIKE 'Ch%'</code></td><td><code>%</code>: any number of characters</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td><code>LIKE '_A'</code></td><td><code>_</code>: exactly one character</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td><code>LIKE '[BS]%'</code></td><td>One character from a set</td><td>✗ (SQLite matches the brackets literally; this site shows a hint to use <code>GLOB</code>)</td><td>✗</td><td>✓</td></tr>
<tr><td><code>GLOB '[BS]*'</code></td><td>Sets, with <code>*</code> and <code>?</code></td><td>✓</td><td>✗</td><td>✗</td></tr>
<tr><td><code>REGEXP '^[BS]'</code></td><td>Regular expressions</td><td>✗</td><td>✓</td><td>✗</td></tr></table></div>

${HD('all','LIKE with % and _')}
<p><code>LIKE</code> compares text against a pattern. Two wildcards do the work:</p>
<table class="mini"><tr><th>Wildcard</th><th>Matches</th><th>Example</th></tr>
<tr><td><code>%</code></td><td>Any number of characters, including none</td><td><code>'Ch%'</code> matches Chai, Chang, Chartreuse verte</td></tr>
<tr><td><code>_</code></td><td>Exactly one character</td><td><code>'_A'</code> matches WA, CA, SA</td></tr></table>
<p>Products whose name <strong>starts with</strong> Ch, followed by anything:</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName LIKE 'Ch%';")}
<p>Customers whose region is <strong>exactly two characters, ending in A</strong>, such as WA or CA. Each <code>_</code> stands for one character:</p>
${C("SELECT CompanyName, Region\nFROM Customers\nWHERE Region LIKE '_A';")}
<p>With <code>%</code> at both ends, the letters can be <strong>anywhere</strong> in the name. Products with "ale" in them:</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName LIKE '%ale%';")}
${DIFF({title:'LIKE in each dialect', all:true, otherTitle:'In each dialect', sqlite:"WHERE ProductName LIKE 'Ch%'\nWHERE Region LIKE '_A'", mysql:"WHERE ProductName LIKE 'Ch%'\nWHERE Region LIKE '_A'", tsql:"WHERE ProductName LIKE 'Ch%'\nWHERE Region LIKE '_A'", common:"WHERE ProductName LIKE 'Ch%'\nWHERE Region LIKE '_A'", note:'<code>LIKE</code>, <code>%</code> and <code>_</code> are standard SQL, so they work the same everywhere. Whether upper and lower case match depends on the database: SQLite\'s <code>LIKE</code> ignores case for A to Z, and MySQL and SQL Server usually ignore it too because of their default settings.'})}
${HD(['sqlite'],'Character sets with GLOB')}
<p>SQLite also has <code>GLOB</code>. It uses <code>*</code> for any characters and <code>?</code> for one character, and it understands <strong>sets</strong>: <code>[BS]</code> means B or S, and <code>[^BS]</code> means anything else.</p>
<p>Categories whose name <strong>starts with B or S</strong>, followed by anything:</p>
${C("SELECT CategoryName\nFROM Categories\nWHERE CategoryName GLOB '[BS]*';")}
<p>Products whose name <strong>starts with a vowel</strong>. <code>GLOB</code> cares about case, so this means a capital vowel:</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName GLOB '[AEIOU]*';")}
${TIP('<code>LIKE</code> ignores upper and lower case (for A to Z), but <code>GLOB</code> doesn\'t: <code>GLOB \'c*\'</code> won\'t match Chai.')}
${DIFF({title:'Matching a set of characters in each dialect', sqlite:"WHERE CategoryName GLOB '[BS]*'", mysql:"WHERE CategoryName REGEXP '^[BS]'", tsql:"WHERE CategoryName LIKE '[BS]%'", note:'T-SQL lets you put a set in square brackets inside <code>LIKE</code>. MySQL and SQLite don\'t: MySQL uses <code>REGEXP</code>, and SQLite uses <code>GLOB</code>.'})}
${HD(['tsql'],'Character sets inside LIKE')}
<p>In T-SQL, <code>LIKE</code> itself understands sets in square brackets: <code>[BS]</code> means B or S, and <code>[^BS]</code> means anything else. Categories whose name starts with B or S:</p>
${C("SELECT CategoryName\nFROM Categories\nWHERE CategoryName LIKE '[BS]%';", false, READ_ONLY('tsql','SQL Server Management Studio'))}
${HD(['mysql'],'Regular expressions with REGEXP')}
<p>MySQL has <code>REGEXP</code> (also written <code>RLIKE</code>). It uses <strong>regular expressions</strong>, often shortened to <em>regex</em>: a mini-language for <strong>pattern recognition</strong> in text. Regular expressions can describe far more than <code>LIKE</code> can, such as "starts with a vowel", "ends in a number" or "contains Ch or Ma". Unlike <code>LIKE</code>, a regular expression matches anywhere in the text unless you say otherwise. The basics:</p>
<table class="mini"><tr><th>Pattern</th><th>Means</th><th>Example</th></tr>
<tr><td><code>^</code></td><td>Starts with</td><td><code>'^Ch'</code>: Chai, Chang</td></tr>
<tr><td><code>$</code></td><td>Ends with</td><td><code>'ale$'</code>: names ending in "ale"</td></tr>
<tr><td><code>[ ]</code></td><td>Any one character in the set</td><td><code>'^[AEIOU]'</code>: starts with a vowel</td></tr>
<tr><td><code>|</code></td><td>Or</td><td><code>'Ch|Ma'</code>: contains Ch or Ma</td></tr></table>
<p>In MySQL, products whose name <strong>starts with a vowel</strong>: <code>^</code> means "starts with" and <code>[AEIOU]</code> means any one of those letters:</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName REGEXP '^[AEIOU]';", false, READ_ONLY('mysql','MySQL Workbench'))}
<p class="further">📖 <strong>Further reading on regular expressions</strong>, if you want to know more: <a href="https://regexone.com/" target="_blank" rel="noopener">RegexOne</a> teaches them step by step with interactive exercises, <a href="https://regex101.com/" target="_blank" rel="noopener">regex101</a> lets you test a pattern and explains each part of it, and the <a href="https://dev.mysql.com/doc/en/pattern-matching.html" target="_blank" rel="noopener">MySQL manual</a> covers <code>REGEXP</code> in MySQL itself. Regular expressions are used far beyond SQL, in programming languages, text editors and search tools, so they're well worth learning.</p>
<p>SQLite doesn't come with a regular expression engine, so try the <code>REGEXP</code> example above in MySQL Workbench. Here in SQLite, <code>GLOB</code> and <code>LIKE</code> get the same results. This finds products that start with a vowel, end in "ale", or contain "Ch":</p>
${C("SELECT ProductName\nFROM Products\nWHERE ProductName GLOB '[AEIOU]*'\n   OR ProductName LIKE '%ale'\n   OR ProductName LIKE '%Ch%';")}
${DIFF({title:'Regular expressions in each dialect', sqlite:'~No REGEXP built in: use GLOB or LIKE', mysql:"WHERE ProductName REGEXP '^[AEIOU]'", tsql:"~No REGEXP: use LIKE '[AEIOU]%'"})}`,
    ex:[
      {p:'Which categories have a category name beginning with B or S? Return the category name.', hint:"LIKE 'B%' OR LIKE 'S%', or GLOB '[BS]*'.", sol:"SELECT CategoryName\nFROM Categories\nWHERE CategoryName LIKE 'B%'\n   OR CategoryName LIKE 'S%';"},
      {p:'List the names of products that contain "choc" anywhere in their name.', hint:'Put % on both sides.', sol:"SELECT ProductName\nFROM Products\nWHERE ProductName LIKE '%choc%';"},
      {p:'Which customers have a company name whose second letter is "a"? Return CompanyName.', hint:'One _ for the first letter, then a, then %.', sol:"SELECT CompanyName\nFROM Customers\nWHERE CompanyName LIKE '_a%';"},
      {p:'List the products whose name starts with a vowel.', hint:"GLOB '[AEIOU]*'", sol:"SELECT ProductName\nFROM Products\nWHERE ProductName GLOB '[AEIOU]*';"}
    ]},

  concat:{title:'Concatenation', summary:'Join text together, cope with missing values, and give columns readable names.', cmds:['CONCAT()','CONCAT_WS()','||','AS'],
    learn:`
${HD('all','Joining text with CONCAT')}
<p><code>CONCAT</code> joins values into one piece of text. Anything in quotes, such as <code>', '</code>, is added as written.</p>
${C("SELECT CompanyName AS 'Company Name',\n       CONCAT(City, ', ', Country) AS 'Location'\nFROM Customers;")}
<p>An alias (<code>AS</code>) is a temporary label for a column. It changes the column heading in your result, not anything in the database. Put it in quotes if it has spaces.</p>
${C("SELECT CONCAT(FirstName, ' ', LastName) AS 'Full Name', Title\nFROM Employees;")}
${HD('all','One separator for everything: CONCAT_WS')}
<p><code>CONCAT_WS</code> ("with separator") puts the same separator between every value, so you only type it once. Like <code>CONCAT</code>, it works in all three dialects:</p>
${C("SELECT CONCAT_WS(', ', Address, City, Country) AS 'Address'\nFROM Customers;")}
${HD(['sqlite'],'The || operator')}
<p>Each dialect also has a shortcut for joining text. SQLite's is the <code>||</code> operator:</p>
${C("SELECT FirstName || ' ' || LastName AS 'Full Name'\nFROM Employees;")}
${HD(['tsql'],'The + operator')}
<p><strong>In T-SQL, you can join text with <code>+</code></strong>, which you'll see a lot in SQL Server code:</p>
${C("SELECT FirstName + ' ' + LastName AS 'Full Name'\nFROM Employees;", false, READ_ONLY('tsql','SQL Server Management Studio'))}
${HD(['mysql'],'No operator in MySQL')}
<p>MySQL has no operator for joining text at all, so there you always use <code>CONCAT</code>. Because the shortcuts differ, <code>CONCAT</code> is the one to learn: it works everywhere.</p>
${TIP('Don\'t use <code>+</code> to join text in SQLite or MySQL: there it adds numbers, so <code>\'Nancy\' + \'Davolio\'</code> gives 0. Only T-SQL joins text with <code>+</code>.')}
${HD('all','When a value is missing','All three, but they behave differently')}
<p>A missing value is <code>NULL</code> (more in <a href="#/lesson/nulls">Working with NULL values</a>). Customers in Germany have no <code>Region</code>, and the three ways of joining text treat that differently:</p>
${C("SELECT CompanyName || ', ' || Region          AS 'Using ||',\n       CONCAT(CompanyName, ', ', Region)      AS 'Using CONCAT',\n       CONCAT_WS(', ', CompanyName, Region)  AS 'Using CONCAT_WS'\nFROM Customers\nWHERE Country = 'Germany';")}
<p><code>||</code> gives NULL as soon as one value is missing. <code>CONCAT</code> treats the missing value as empty, leaving a stray comma. <code>CONCAT_WS</code> skips it, separator and all.</p>
<h3>In each dialect</h3>
${DIFF({title:'Joining text in each dialect', all:true, common:"CONCAT(FirstName, ' ', LastName)\nCONCAT_WS(' ', FirstName, LastName)", otherTitle:'Every way in each dialect', sqlite:"CONCAT(FirstName, ' ', LastName)\nCONCAT_WS(' ', FirstName, LastName)\nFirstName || ' ' || LastName      -- SQLite's operator", mysql:"CONCAT(FirstName, ' ', LastName)\nCONCAT_WS(' ', FirstName, LastName)\n-- no operator: || means OR, + adds numbers", tsql:"CONCAT(FirstName, ' ', LastName)\nCONCAT_WS(' ', FirstName, LastName)\nFirstName + ' ' + LastName        -- T-SQL's operator", note:'Learn <code>CONCAT()</code> and <code>CONCAT_WS()</code>: they work in all three (<code>CONCAT_WS</code> needs SQL Server 2017 or later). Watch out for NULLs, though: the table below shows how each one treats them.'})}
<div class="tbl-wrap"><table class="mini dialect-matrix"><tr><th>When one value is NULL…</th><th>🪶 SQLite</th><th>🐬 MySQL</th><th>🪟 T-SQL</th></tr>
<tr><td>The operator (<code>||</code> or <code>+</code>)</td><td><code>||</code> gives NULL</td><td>(no operator)</td><td><code>+</code> gives NULL</td></tr>
<tr><td><code>CONCAT()</code></td><td>Treats it as empty</td><td><strong>Gives NULL</strong></td><td>Treats it as empty</td></tr>
<tr><td><code>CONCAT_WS()</code></td><td>Skips it</td><td>Skips it</td><td>Skips it</td></tr></table></div>
${TIP('<code>CONCAT_WS</code> behaves the same everywhere, so it\'s the safest choice when some values might be missing.')}`,

    ex:[
      {p:'Join each employee\'s first name and last name, a colon and their home phone, like Nancy Davolio: (206) 555-9857. Alias the column Employee Name and Contact Number.', hint:"CONCAT(FirstName, ' ', LastName, ': ', HomePhone)", sol:"SELECT CONCAT(FirstName, ' ', LastName, ': ', HomePhone) AS 'Employee Name and Contact Number'\nFROM Employees;"},
      {p:'Label every supplier like Exotic Liquids (London, UK). Alias the column Supplier.', hint:"CONCAT(CompanyName, ' (', City, ', ', Country, ')')", sol:"SELECT CONCAT(CompanyName, ' (', City, ', ', Country, ')') AS 'Supplier'\nFROM Suppliers;"},
      {p:'For every customer, build a line like Maria Anders at Alfreds Futterkiste. Alias it Contact.', hint:"ContactName, then ' at ', then CompanyName.", sol:"SELECT CONCAT(ContactName, ' at ', CompanyName) AS 'Contact'\nFROM Customers;"}
      ,{p:'Show each customer\'s CompanyName and one Address line made of Address, City, Region and PostalCode, with \', \' between them, skipping any that are missing.', hint:"CONCAT_WS(', ', Address, City, Region, PostalCode) skips NULLs, separator and all.", sol:"SELECT CompanyName, CONCAT_WS(', ', Address, City, Region, PostalCode) AS 'Address'\nFROM Customers;"}
    ]},

  arithmetic:{title:'Arithmetic operators', summary:'Do maths on your columns as the rows come back: calculate, round and work out percentages.', cmds:['+','-','*','/','%','ROUND()','ABS()','CEIL()','FLOOR()'],
    learn:`
<p>SQL can do maths on every row as it comes back: totals, discounts, VAT, differences. It never changes the data in the table, only what the query shows.</p>
<h3>The operators</h3>
<table class="mini"><tr><th>Operator</th><th>Does</th><th>Example</th><th>Result</th></tr>
<tr><td><code>+</code></td><td>Add</td><td><code>UnitsInStock + UnitsOnOrder</code></td><td>Stock once the order arrives</td></tr>
<tr><td><code>-</code></td><td>Subtract</td><td><code>UnitsOnOrder - UnitsInStock</code></td><td>How many short you are</td></tr>
<tr><td><code>*</code></td><td>Multiply</td><td><code>UnitPrice * Quantity</code></td><td>The value of an order line</td></tr>
<tr><td><code>/</code></td><td>Divide</td><td><code>Freight / 2</code></td><td>Half the freight</td></tr>
<tr><td><code>%</code></td><td>Remainder (modulo)</td><td><code>OrderID % 2</code></td><td><code>0</code> for even numbers, <code>1</code> for odd</td></tr></table>
<p>You don't even need a table to try them. A <code>SELECT</code> on its own works like a calculator:</p>
${C("SELECT 10 + 5, 10 - 5, 10 * 5, 10 / 5, 10 % 3;")}
<p>With columns, it's worked out for every row. Always give the result an alias, so the column has a readable name:</p>
${C("SELECT ProductName, UnitsInStock, UnitsOnOrder,\n       UnitsInStock + UnitsOnOrder AS 'Stock After Delivery'\nFROM Products;")}
<h3>Order of operations: use brackets</h3>
<p>SQL follows the same rules as maths at school: <code>*</code>, <code>/</code> and <code>%</code> happen before <code>+</code> and <code>-</code>. So <code>2 + 3 * 4</code> is 14, not 20. Brackets go first:</p>
${C("SELECT 2 + 3 * 4   AS 'Without brackets',\n       (2 + 3) * 4 AS 'With brackets';")}
<p>This matters for real data. An order line's <code>Discount</code> is a fraction, such as <code>0.15</code> for 15% off, so the price after discount is <code>UnitPrice × Quantity × (1 − Discount)</code>. Forget the brackets and SQL multiplies by 1, then takes 0.15 away:</p>
${C("SELECT OrderID, UnitPrice, Quantity, Discount,\n       ROUND(UnitPrice * Quantity * 1 - Discount, 2)   AS 'Wrong',\n       ROUND(UnitPrice * Quantity * (1 - Discount), 2) AS 'Right'\nFROM \"Order Details\"\nWHERE OrderID = 10250 AND Discount > 0;")}
${TIP('Table and column names with spaces need double quotes: <code>\"Order Details\"</code>. Single quotes are for text values.')}
${DIFF({title:'Table names with spaces in each dialect', sqlite:'\"Order Details\"', mysql:'`Order Details`', tsql:'[Order Details]', note:'SQLite also accepts the MySQL and T-SQL forms, but double quotes are its own.'})}
<h3>Dividing, and percentages</h3>
<p>Dividing two whole numbers gives a whole number: <code>7 / 2</code> is <code>3</code>, not 3.5 (you met this in <a href="#/lesson/datatypes">Data types</a>). For a percentage, multiply by <code>100.0</code> first, with the <code>.0</code>, so SQLite keeps the decimals:</p>
${C("SELECT ProductName, UnitsInStock, UnitsOnOrder,\n       UnitsOnOrder * 100 / (UnitsInStock + UnitsOnOrder)   AS 'Whole number %',\n       UnitsOnOrder * 100.0 / (UnitsInStock + UnitsOnOrder) AS 'Exact %'\nFROM Products\nWHERE UnitsOnOrder > 0;")}
<h3>Rounding and other number functions</h3>
<table class="mini"><tr><th>Function</th><th>Does</th><th>Example</th></tr>
<tr><td><code>ROUND(x, 2)</code></td><td>Rounds to 2 decimal places (leave out the 2 for a whole number)</td><td><code>ROUND(18.456, 2)</code> → 18.46</td></tr>
<tr><td><code>CEIL(x)</code></td><td>Rounds up to the next whole number</td><td><code>CEIL(18.2)</code> → 19</td></tr>
<tr><td><code>FLOOR(x)</code></td><td>Rounds down</td><td><code>FLOOR(18.8)</code> → 18</td></tr>
<tr><td><code>ABS(x)</code></td><td>Removes the minus sign</td><td><code>ABS(-4)</code> → 4</td></tr></table>
<p>Prices with 20% VAT, rounded to pennies:</p>
${C("SELECT ProductName, UnitPrice,\n       ROUND(UnitPrice * 1.2, 2) AS 'Price inc VAT'\nFROM Products;")}
<p>How many boxes of 12 are needed for each order line? A part-full box still counts, so round up:</p>
${C("SELECT OrderID, ProductID, Quantity,\n       CEIL(Quantity / 12.0) AS 'Boxes of 12'\nFROM \"Order Details\"\nWHERE OrderID = 10248;")}
<h3>Calculating in WHERE and ORDER BY</h3>
<p>Calculations work anywhere a column does. Here, products whose stock is worth over 2,000, most valuable first:</p>
${C("SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nWHERE UnitPrice * UnitsInStock > 2000\nORDER BY UnitPrice * UnitsInStock DESC;")}
<h3>NULL in a calculation</h3>
<p>Anything worked out with a NULL is NULL: if a value is unknown, so is the answer. <a href="#/lesson/nulls">Working with NULL values</a> shows how to replace NULLs before calculating.</p>
${C("SELECT 5 + NULL, NULL * 2;")}
${DIFF({title:'Arithmetic in each dialect', common:'+   -   *   /   %\nROUND(x, 2)   FLOOR(x)   ABS(x)', otherTitle:'Where they differ', sqlite:'7 / 2         -- 3\nCEIL(18.2)    -- 19', mysql:'7 / 2         -- 3.5000 (always decimal)\n7 DIV 2       -- 3\nMOD(7, 2)     -- same as 7 % 2\nCEIL(18.2)', tsql:'7 / 2         -- 3\nCEILING(18.2) -- T-SQL has no CEIL'})}`,
    ex:[
      {p:'From `Order Details`, show UnitPrice, Quantity, Discount, a Gross Total (UnitPrice × Quantity) and a Net Total with the discount applied.', hint:'Discount is a fraction such as 0.15, so the net total is UnitPrice * Quantity * (1 - Discount). Don\'t forget the brackets.', sol:"SELECT UnitPrice, Quantity, Discount,\n       UnitPrice * Quantity                  AS 'Gross Total',\n       UnitPrice * Quantity * (1 - Discount) AS 'Net Total'\nFROM \"Order Details\";"},
      {p:'Show each product\'s name and the value of its stock (UnitPrice × UnitsInStock) as Stock Value.', hint:"UnitPrice * UnitsInStock AS 'Stock Value'", sol:"SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products;"},
      {p:'Show each product\'s name, UnitPrice, and its price with 20% VAT added, rounded to 2 decimal places.', hint:'ROUND(UnitPrice * 1.2, 2)', sol:"SELECT ProductName, UnitPrice, ROUND(UnitPrice * 1.2, 2) AS 'Price inc VAT'\nFROM Products;"},
      {p:'Which products have more units on order than in stock? Show ProductName, UnitsInStock, UnitsOnOrder and how many short they are, biggest shortfall first.', hint:'UnitsOnOrder - UnitsInStock, in SELECT, WHERE (> 0) and ORDER BY … DESC.', ordered:[3], sol:"SELECT ProductName, UnitsInStock, UnitsOnOrder,\n       UnitsOnOrder - UnitsInStock AS 'Shortfall'\nFROM Products\nWHERE UnitsOnOrder - UnitsInStock > 0\nORDER BY UnitsOnOrder - UnitsInStock DESC;"},
      {p:'Using `Order Details`, show the OrderID and Gross Total of the two order lines with the highest Gross Total, biggest first.', hint:'ORDER BY the gross total DESC, then LIMIT 2.', ordered:[1], sol:"SELECT OrderID, UnitPrice * Quantity AS 'Gross Total'\nFROM \"Order Details\"\nORDER BY UnitPrice * Quantity DESC\nLIMIT 2;"},
      {p:'How many orders have an even OrderID?', hint:'WHERE OrderID % 2 = 0', sol:'SELECT COUNT(*)\nFROM Orders\nWHERE OrderID % 2 = 0;'}
    ]},

  cp1:{title:'Checkpoint: querying one table', summary:'Mixed practice on everything in this unit.', cmds:[], checkpoint:true,
    ex:[
      {p:'Show the CompanyName and Phone of every customer in the UK, in alphabetical order of company name.', hint:'WHERE, then ORDER BY.', ordered:[0], sol:"SELECT CompanyName, Phone\nFROM Customers\nWHERE Country = 'UK'\nORDER BY CompanyName;"},
      {p:'How many products cost between 20 and 50 and are not discontinued?', hint:'BETWEEN and Discontinued = 0, joined with AND.', sol:'SELECT COUNT(*)\nFROM Products\nWHERE UnitPrice BETWEEN 20 AND 50\n  AND Discontinued = 0;'},
      {p:'Which three products have the highest stock value (UnitPrice × UnitsInStock)? Show the name and value, highest first.', hint:'Calculate, sort descending, limit.', ordered:[1], sol:"SELECT ProductName, UnitPrice * UnitsInStock AS 'Stock Value'\nFROM Products\nORDER BY UnitPrice * UnitsInStock DESC\nLIMIT 3;"},
      {p:'List the distinct cities in France where Northwind has customers, in alphabetical order.', hint:'DISTINCT, WHERE and ORDER BY together.', ordered:[0], sol:"SELECT DISTINCT City\nFROM Customers\nWHERE Country = 'France'\nORDER BY City;"}
    ]},

  /* ===== Unit 3 ===== */
  aggregates:{title:'Aggregate functions', summary:'Turn many rows into a single answer: a count, total, average, minimum or maximum.', cmds:['COUNT()','SUM()','AVG()','MIN()','MAX()'],
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
${TIP('<code>COUNT(*)</code> counts rows. <code>COUNT(Region)</code> counts only rows where Region has a value. Try both on Customers and compare.')}
${DIFF({title:'Averaging whole numbers in each dialect', common:'AVG(ReorderLevel * 1.0)   -- 12.4675… in all three', otherTitle:'Without the * 1.0', sqlite:'AVG(ReorderLevel)   -- 12.4675…', mysql:'AVG(ReorderLevel)   -- 12.4675', tsql:'AVG(ReorderLevel)   -- 12  (a whole number!)', note:'The aggregate functions are the same in all three, with one trap: T-SQL gives a whole number when you average a whole-number column. Multiplying by <code>1.0</code> first gives the decimals everywhere.'})}`,
    ex:[
      {p:'Find the cheapest and the most expensive unit price in one query.', hint:'MIN(UnitPrice) and MAX(UnitPrice) in the same SELECT.', sol:'SELECT MIN(UnitPrice), MAX(UnitPrice)\nFROM Products;'},
      {p:'What is the total freight across all orders?', hint:'SUM(Freight)', sol:'SELECT SUM(Freight)\nFROM Orders;'},
      {p:'How many customers have a fax number? Use COUNT on the Fax column.', hint:'COUNT(Fax) skips the NULLs.', sol:'SELECT COUNT(Fax)\nFROM Customers;'},
      {p:'What is the average unit price of products in category 1 (Beverages)?', hint:'AVG with a WHERE on CategoryID.', sol:'SELECT AVG(UnitPrice)\nFROM Products\nWHERE CategoryID = 1;'}
    ]},

  groupby:{title:'GROUP BY', summary:'Work out a total or average for each group instead of one for everything.', cmds:['GROUP BY'],
    learn:`
<p><code>GROUP BY</code> splits the rows into groups and runs the aggregate once per group. Instead of one total for all products, you get one per supplier:</p>
${C("SELECT SupplierID,\n       SUM(UnitsOnOrder) AS 'Total On Order',\n       AVG(UnitsOnOrder) AS 'Avg On Order',\n       MAX(UnitsOnOrder) AS 'Max On Order'\nFROM Products\nGROUP BY SupplierID;")}
${TIP('<strong>The rule:</strong> every column in <code>SELECT</code> should be either inside an aggregate or listed in <code>GROUP BY</code>. SQLite doesn\'t stop you breaking it: it quietly picks a value from any row in the group, which gives misleading results.')}
${C("SELECT Country, COUNT(*) AS 'Customers'\nFROM Customers\nGROUP BY Country\nORDER BY COUNT(*) DESC;")}
<p>Rows are filtered by <code>WHERE</code> before they're grouped, so this counts only discontinued products in each category:</p>
${C("SELECT CategoryID, COUNT(*) AS 'Discontinued'\nFROM Products\nWHERE Discontinued = 1\nGROUP BY CategoryID;")}
${HD(['sqlite'],'Joining a group\'s values into a list','Different in each dialect')}
<p>Instead of counting a group's rows, you can join their values into one piece of text, separated by commas. Here, every product in each category:</p>
${C("SELECT CategoryID, group_concat(ProductName, ', ') AS 'Products'\nFROM Products\nGROUP BY CategoryID;")}
${DIFF({title:'Joining a group\'s values in each dialect', sqlite:"group_concat(ProductName, ', ')\nstring_agg(ProductName, ', ')", mysql:"GROUP_CONCAT(ProductName SEPARATOR ', ')", tsql:"STRING_AGG(ProductName, ', ')   -- SQL Server 2017+", note:'This is one of the most different features between dialects: each has its own function name, and MySQL writes the separator with the word <code>SEPARATOR</code>.'})}
${DIFF({title:'Selecting a column that isn\'t grouped or aggregated', sqlite:'~Runs, but shows a value from any row in the group', mysql:'~Error by default (ONLY_FULL_GROUP_BY, MySQL 5.7 and later)', tsql:'~Error: the column is invalid in the select list', note:'<code>GROUP BY</code> itself works the same in all three. Following the rule above keeps your queries working in every dialect.'})}`,
    ex:[
      {p:'How many products are there in each category? Show CategoryID and the count.', hint:'GROUP BY CategoryID with COUNT(*).', sol:'SELECT CategoryID, COUNT(*)\nFROM Products\nGROUP BY CategoryID;'},
      {p:'Calculate the average reorder level of products for each CategoryID. Order by the average, highest first.', hint:'GROUP BY CategoryID, and ORDER BY AVG(ReorderLevel) DESC.', ordered:[1], sol:"SELECT CategoryID, AVG(ReorderLevel) AS 'Average Reorder Level'\nFROM Products\nGROUP BY CategoryID\nORDER BY AVG(ReorderLevel) DESC;"},
      {p:'How many orders were shipped to each country (ShipCountry)? Show the busiest country first.', hint:'GROUP BY ShipCountry, ORDER BY the count DESC.', ordered:[1], sol:'SELECT ShipCountry, COUNT(*)\nFROM Orders\nGROUP BY ShipCountry\nORDER BY COUNT(*) DESC;'},
      {p:'Using `Order Details`, find the five products (ProductID) with the highest total quantity sold, highest first.', hint:'SUM(Quantity) per ProductID, sorted, LIMIT 5.', ordered:[1], sol:"SELECT ProductID, SUM(Quantity) AS 'Total Sold'\nFROM \"Order Details\"\nGROUP BY ProductID\nORDER BY SUM(Quantity) DESC\nLIMIT 5;"}
    ]},

  having:{title:'HAVING', summary:'Keep only the groups that pass a test.', cmds:['HAVING'],
    learn:`
<p><code>WHERE</code> filters rows before grouping. <code>HAVING</code> filters the groups afterwards, so it's the one to use when your condition involves an aggregate.</p>
${C("SELECT SupplierID,\n       SUM(UnitsOnOrder) AS 'Total On Order',\n       AVG(UnitsOnOrder) AS 'Avg On Order'\nFROM Products\nGROUP BY SupplierID\nHAVING AVG(UnitsOnOrder) > 5;")}
<h3>Why not put it in WHERE?</h3>
<p>It seems natural to filter on the average with <code>WHERE</code>, like any other condition. Run it and the database refuses:</p>
${CERR("SELECT SupplierID, AVG(UnitsOnOrder) AS 'Avg On Order'\nFROM Products\nWHERE AVG(UnitsOnOrder) > 5\nGROUP BY SupplierID;")}
<p>The reason is the order the database runs a query in, from the diagram in <a href="#/lesson/select">Simple queries</a>. Look where <code>WHERE</code>, <code>GROUP BY</code> and <code>HAVING</code> come on the right:</p>
${RUN_ORDER(['WHERE','GROUP BY','HAVING'])}
<ol class="why-steps">
<li><strong><code>FROM</code> (1)</strong> fetches every row of Products.</li>
<li><strong><code>WHERE</code> (2)</strong> checks the rows <em>one at a time</em>. The groups haven't been made yet, so there's no average to compare with: <code>AVG()</code> has nothing to work on.</li>
<li><strong><code>GROUP BY</code> (3)</strong> puts the rows that are left into groups, one per supplier.</li>
<li><strong><code>HAVING</code> (4)</strong> checks <em>each group</em>. Now the average exists, so <code>HAVING AVG(UnitsOnOrder) &gt; 5</code> works.</li>
</ol>
${TIP('<strong>Rule of thumb:</strong> a condition about a <em>single row</em> (<code>Country = \'UK\'</code>, <code>UnitPrice &gt; 20</code>) goes in <code>WHERE</code>. A condition about a <em>group</em>, which means it uses <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code> or <code>MAX</code>, goes in <code>HAVING</code>.')}
${TIP('Repeating the full expression in <code>HAVING</code> (<code>HAVING AVG(UnitsOnOrder) &gt; 5</code>) is the clearest way to write it.')}
<p>You can use both in one query: <code>WHERE</code> to pick rows, <code>HAVING</code> to pick groups.</p>
${C("SELECT Country, COUNT(*) AS 'Customers'\nFROM Customers\nWHERE ContactTitle LIKE '%Sales%'\nGROUP BY Country\nHAVING COUNT(*) >= 3;")}
${DIFF({title:'Using a SELECT alias in HAVING', common:'HAVING AVG(UnitPrice) > 20   -- repeat the expression', otherTitle:'Using the alias instead', sqlite:'HAVING AvgPrice > 20', mysql:'HAVING AvgPrice > 20', tsql:'~Not allowed: repeat the expression', note:'Repeating the expression works in all three, so it\'s the safe habit.'})}`,
    ex:[
      {p:'For each SupplierID, show the total UnitsInStock across their products. Only include suppliers with more than 100 units in total.', hint:'HAVING SUM(UnitsInStock) > 100', sol:"SELECT SupplierID, SUM(UnitsInStock) AS 'Total In Stock'\nFROM Products\nGROUP BY SupplierID\nHAVING SUM(UnitsInStock) > 100;"},
      {p:'Which employees (EmployeeID) handled more than 100 orders? Show the EmployeeID and their number of orders.', hint:'GROUP BY EmployeeID on Orders, HAVING COUNT(*) > 100.', sol:'SELECT EmployeeID, COUNT(*)\nFROM Orders\nGROUP BY EmployeeID\nHAVING COUNT(*) > 100;'},
      {p:'Which countries have more than 5 customers? Show the country and the number of customers.', hint:'GROUP BY Country, HAVING COUNT(*) > 5.', sol:'SELECT Country, COUNT(*)\nFROM Customers\nGROUP BY Country\nHAVING COUNT(*) > 5;'}
    ]},

  nulls:{title:'Working with NULL values', summary:'Find, exclude and replace missing values.', cmds:['IS NULL','IS NOT NULL','COALESCE()','IFNULL()'],
    learn:`
<p><code>NULL</code> means "no value". It isn't zero and it isn't empty text: it's unknown. That's why <code>= NULL</code> never matches anything. Use <code>IS NULL</code> and <code>IS NOT NULL</code>.</p>
${C('SELECT CompanyName, Region\nFROM Customers\nWHERE Region IS NULL;')}
${C('SELECT CompanyName, Region\nFROM Customers\nWHERE Region IS NOT NULL;')}
<p>Run this one and notice it returns nothing, even though many regions are missing:</p>
${C('SELECT CompanyName\nFROM Customers\nWHERE Region = NULL;')}
<h3 class="h-dialect"><span class="h-icons" aria-hidden="true">🪶 🐬 🪟</span> Replacing NULLs with COALESCE <span class="h-tag">All three</span></h3>\n<p><code>COALESCE</code> returns the first value that isn\'t NULL, so it\'s a neat way to show a placeholder. It works in all three. For just two values there\'s also a shortcut: <code>IFNULL(x, y)</code> in SQLite and MySQL, and <code>ISNULL(x, y)</code> in T-SQL.</p>
${C("SELECT CompanyName, COALESCE(Fax, 'No fax') AS 'Fax'\nFROM Customers;")}
${DIFF({title:'Replacing NULLs in each dialect', common:"COALESCE(Fax, Phone, 'No number')", otherTitle:'Two-value shortcuts', sqlite:"IFNULL(Fax, 'No fax')", mysql:"IFNULL(Fax, 'No fax')", tsql:"ISNULL(Fax, 'No fax')", note:'<code>COALESCE()</code> works the same in all three and takes any number of values, so it\'s the one to learn.'})}`,
    ex:[
      {p:'List the countries that have region codes in the Customers table, with a count of customers per country.', hint:'WHERE Region IS NOT NULL, then GROUP BY Country.', sol:"SELECT Country, COUNT(*) AS 'No. of Customers'\nFROM Customers\nWHERE Region IS NOT NULL\nGROUP BY Country\nORDER BY COUNT(*) DESC;"},
      {p:'Which orders haven\'t been shipped yet? Show the OrderID and OrderDate.', hint:'An unshipped order has no ShippedDate.', sol:'SELECT OrderID, OrderDate\nFROM Orders\nWHERE ShippedDate IS NULL;'},
      {p:'List every customer\'s CompanyName and Region, showing No region when Region is NULL.', hint:"COALESCE(Region, 'No region')", sol:"SELECT CompanyName, COALESCE(Region, 'No region') AS 'Region'\nFROM Customers;"}
    ]},

  cp2:{title:'Checkpoint: summarising data', summary:'Mixed practice on aggregates, groups and NULLs.', cmds:[], checkpoint:true,
    ex:[
      {p:'What is the average freight per shipper (ShipVia)? Show the highest average first.', hint:'GROUP BY ShipVia, ORDER BY AVG(Freight) DESC.', ordered:[1], sol:'SELECT ShipVia, AVG(Freight)\nFROM Orders\nGROUP BY ShipVia\nORDER BY AVG(Freight) DESC;'},
      {p:'Which categories (CategoryID) have an average unit price above 30? Show the CategoryID and the average.', hint:'A condition on an aggregate needs HAVING.', sol:'SELECT CategoryID, AVG(UnitPrice)\nFROM Products\nGROUP BY CategoryID\nHAVING AVG(UnitPrice) > 30;'},
      {p:'How many orders shipped to Germany had a freight cost above 100?', hint:'Two conditions in WHERE, then COUNT(*).', sol:"SELECT COUNT(*)\nFROM Orders\nWHERE ShipCountry = 'Germany' AND Freight > 100;"},
      {p:'For each employee (EmployeeID), show the date of their first and their most recent order.', hint:'MIN(OrderDate) and MAX(OrderDate), grouped by EmployeeID.', sol:'SELECT EmployeeID, MIN(OrderDate), MAX(OrderDate)\nFROM Orders\nGROUP BY EmployeeID;'}
    ]},

  /* ===== Unit 4 ===== */
  joinsintro:{title:'Introduction to joins', summary:'What each kind of join keeps, shown with Venn diagrams and two small made-up tables.', cmds:['INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN','CROSS JOIN','ON'],
    learn:`
<p>A <strong>join</strong> combines rows from two tables by matching a column they share, usually a foreign key and the primary key it points at. The kind of join decides what happens to rows that <em>don't</em> have a match.</p>
<p>To see the difference, here are two tiny tables. Each student's <code>course</code> holds a course <code>id</code>. Nicole hasn't chosen a course yet, and nobody has chosen Data:</p>
<div class="two-tables">
<table class="mini"><tr><th colspan="2">student</th></tr><tr><th>name</th><th>course</th></tr><tr><td>Lee</td><td>1</td></tr><tr><td>Barry</td><td>1</td></tr><tr><td>David</td><td>2</td></tr><tr><td>Tim</td><td>3</td></tr><tr><td>Nicole</td><td><em>NULL</em></td></tr></table>
<table class="mini"><tr><th colspan="2">course</th></tr><tr><th>id</th><th>name</th></tr><tr><td>1</td><td>Business</td></tr><tr><td>2</td><td>Test</td></tr><tr><td>3</td><td>Dev</td></tr><tr><td>4</td><td>Data</td></tr></table>
</div>
<p>Every example below builds these two tables with <code>WITH</code> at the top, so you can run it here. Only the <code>SELECT</code> at the bottom changes.</p>
<h3>The join map</h3>
<p>Think of each table as a circle. Where they overlap are the rows that match. The shaded part is what each join keeps:</p>
<div class="venn-grid">
${VENN_CARD(['ab'],'INNER JOIN','student INNER JOIN course')}
${VENN_CARD(['a','ab'],'LEFT JOIN','student LEFT JOIN course')}
${VENN_CARD(['ab','b'],'RIGHT JOIN','student RIGHT JOIN course')}
${VENN_CARD(['a','ab','b'],'FULL OUTER JOIN','student FULL OUTER JOIN course')}
${VENN_CARD(['a'],'Students with no course','student LEFT JOIN course … WHERE course.id IS NULL')}
${VENN_CARD(['b'],'Courses with no students','course LEFT JOIN student … WHERE student.name IS NULL')}
${VENN_CARD(['a','b'],'No match on either side','student FULL OUTER JOIN course … WHERE student.name IS NULL OR course.id IS NULL')}
</div>
<h3>INNER JOIN: only the matches</h3>
<div class="venn-inline">${VENN(['ab'],'INNER JOIN')}<p>Keeps the rows that match on both sides. Nicole has no course and nobody takes Data, so both disappear: <strong>4 rows</strong>.</p></div>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nINNER JOIN course ON student.course = course.id;")}
<h3>LEFT JOIN: everything from the left</h3>
<div class="venn-inline">${VENN(['a','ab'],'LEFT JOIN')}<p>Keeps every row from the <strong>left</strong> table (the one in <code>FROM</code>), with NULLs where there's no match. Nicole now appears, with NULL for her course: <strong>5 rows</strong>.</p></div>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nLEFT JOIN course ON student.course = course.id;")}
<h3>RIGHT JOIN: everything from the right</h3>
<div class="venn-inline">${VENN(['ab','b'],'RIGHT JOIN')}<p>The mirror image: keeps every row from the <strong>right</strong> table. Data now appears with NULL for the student, and Nicole has gone again: <strong>5 rows</strong>.</p></div>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nRIGHT JOIN course ON student.course = course.id;")}
<p>Now swap the tables and use a <code>LEFT JOIN</code>. It's exactly the same result:</p>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM course\nLEFT JOIN student ON student.course = course.id;")}
${HD(['sqlite','tsql'],'FULL OUTER JOIN: everything from both')}
<div class="venn-inline">${VENN(['a','ab','b'],'FULL OUTER JOIN')}<p>Keeps every row from both tables, matched where possible. Nicole and Data both appear, each with a NULL on the other side: <strong>6 rows</strong>.</p></div>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nFULL OUTER JOIN course ON student.course = course.id;")}
<h3>Finding rows with no match</h3>
<div class="venn-inline">${VENN(['a'],'Left rows with no match')}<p>A <code>LEFT JOIN</code> followed by <code>WHERE right_table.key IS NULL</code> keeps only the left rows that found nothing. It's a common check for missing data: which students haven't chosen a course?</p></div>
${C(FAKE + "SELECT student.name\nFROM student\nLEFT JOIN course ON student.course = course.id\nWHERE course.id IS NULL;")}
<h3>CROSS JOIN: every combination</h3>
<p>A <code>CROSS JOIN</code> has no <code>ON</code>. It pairs every row of one table with every row of the other: 5 students × 4 courses = <strong>20 rows</strong>. It's occasionally useful, but you mostly see it by accident, when a join is missing its <code>ON</code> condition.</p>
${C(FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nCROSS JOIN course;")}
<h3>Why avoid RIGHT JOIN</h3>
<ul class="plain">
<li><strong>You never need it.</strong> Any right join can be written as a left join by swapping the two tables, as you saw above.</li>
<li><strong>It's easier to read.</strong> With left joins, the table whose rows you keep always comes first, in <code>FROM</code>. A query reads top to bottom: start with this table, then attach the others.</li>
<li><strong>Mixing them gets confusing.</strong> In a query with several joins, a mix of <code>LEFT</code> and <code>RIGHT</code> makes it very hard to tell which rows are kept.</li>
<li><strong>It's the convention.</strong> Most style guides and teams use left joins only, so it's what people expect to read.</li>
<li><strong>It's more portable.</strong> SQLite only added <code>RIGHT</code> and <code>FULL OUTER JOIN</code> in 2022 (version 3.39), so older versions reject them, and MySQL has no <code>FULL OUTER JOIN</code> at all.</li>
</ul>
${DIFF({title:'Join support in each dialect', common:'INNER JOIN   LEFT JOIN   CROSS JOIN', otherTitle:'RIGHT and FULL OUTER JOIN', sqlite:'RIGHT, FULL OUTER: version 3.39 (2022) and later', mysql:'RIGHT: yes\nFULL OUTER: not supported', tsql:'RIGHT, FULL OUTER: yes', note:'MySQL gets the effect of a full outer join by combining a <code>LEFT JOIN</code> and a <code>RIGHT JOIN</code> with <code>UNION</code>. The <code>JOIN … ON</code> syntax is otherwise the same in all three.'})}
${TIP('The next lessons use <code>INNER JOIN</code> and <code>LEFT JOIN</code> on the real Northwind tables. <code>JOIN</code> on its own means <code>INNER JOIN</code>.')}`,
    ex:[
      {p:'Show each student\'s name and their course name, for students who have a course.', hint:'INNER JOIN course ON student.course = course.id', starter:FAKE_START, sol:FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nINNER JOIN course ON student.course = course.id;"},
      {p:'Show every student\'s name with their course name, including students without a course.', hint:'A LEFT JOIN from student keeps every student.', starter:FAKE_START, sol:FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nLEFT JOIN course ON student.course = course.id;"},
      {p:'Which course has no students? Start FROM course and use a LEFT JOIN.', hint:'FROM course LEFT JOIN student …, then WHERE student.name IS NULL.', starter:FAKE_START, sol:FAKE + "SELECT course.name\nFROM course\nLEFT JOIN student ON student.course = course.id\nWHERE student.name IS NULL;"},
      {p:'This query uses a RIGHT JOIN: `SELECT student.name, course.name FROM student RIGHT JOIN course ON student.course = course.id`. Rewrite it as a LEFT JOIN that returns the same rows.', hint:'Swap the tables: FROM course LEFT JOIN student. (The checker compares results, so it can\'t see which join you used. Aim for LEFT JOIN.)', starter:FAKE_START, sol:FAKE + "SELECT student.name AS student, course.name AS course\nFROM course\nLEFT JOIN student ON student.course = course.id;"},
      {p:'Show every student and every course, matched up where possible, so both Nicole and Data appear.', hint:'FULL OUTER JOIN', starter:FAKE_START, sol:FAKE + "SELECT student.name AS student, course.name AS course\nFROM student\nFULL OUTER JOIN course ON student.course = course.id;"}
    ]},

  innerjoin:{title:'Inner joins', summary:'Combine rows from two tables where their keys match.', cmds:['INNER JOIN','ON'],
    learn:`
<p>The ERD shows <code>Products.SupplierID</code> pointing at <code>Suppliers.SupplierID</code>. A join follows that line. The <code>ON</code> clause says which columns must match:</p>
${C('SELECT Products.ProductName, Suppliers.CompanyName\nFROM Products\nINNER JOIN Suppliers ON Products.SupplierID = Suppliers.SupplierID;')}
<div class="venn-inline">${VENN(['ab'],'INNER JOIN','Products','Suppliers')}<p>As in the <a href="#/lesson/joinsintro">Introduction to joins</a>, an <code>INNER JOIN</code> keeps only the rows with a match on both sides. A product with no supplier, or a supplier with no products, would be left out.</p></div>
${TIP('When both tables have a column with the same name, such as <code>CompanyName</code> in Customers and Suppliers, prefix it with the table name. Otherwise you get an "ambiguous column" error.')}
${C("SELECT Orders.OrderID, Orders.OrderDate, Customers.CompanyName\nFROM Orders\nINNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID\nWHERE Customers.Country = 'Spain';")}
${SAME('<code>JOIN</code> on its own means <code>INNER JOIN</code> in all three.')}`,
    ex:[
      {p:'Show every product\'s name next to the name of its category.', hint:'Join Products to Categories on CategoryID.', sol:'SELECT Products.ProductName, Categories.CategoryName\nFROM Products\nINNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;'},
      {p:'List the OrderID and customer CompanyName of every order placed by a customer in Mexico.', hint:"Join Orders to Customers, then WHERE Customers.Country = 'Mexico'.", sol:"SELECT Orders.OrderID, Customers.CompanyName\nFROM Orders\nINNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID\nWHERE Customers.Country = 'Mexico';"},
      {p:'What was in order 10248? Show each ProductName and Quantity.', hint:'Join "Order Details" to Products, filter on OrderID.', sol:'SELECT Products.ProductName, "Order Details".Quantity\nFROM "Order Details"\nINNER JOIN Products ON "Order Details".ProductID = Products.ProductID\nWHERE "Order Details".OrderID = 10248;'}
    ]},

  leftjoin:{title:'Left joins', summary:'Keep every row from the first table, whether it has a match or not.', cmds:['LEFT JOIN','IS NULL'],
    learn:`
<p>A <code>LEFT JOIN</code> returns every row from the left table (the one in <code>FROM</code>). Where there's no match on the right, those columns come back as NULL.</p>
<div class="venn-inline">${VENN(['a','ab'],'LEFT JOIN','Customers','Orders')}<p>Remember Nicole from the <a href="#/lesson/joinsintro">Introduction to joins</a>: with a left join she stayed in the result even though she had no course.</p></div>
<p>In Northwind, some customers have never ordered. An inner join hides them; a left join keeps them:</p>
${C('SELECT Customers.CompanyName, Orders.OrderID\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nORDER BY Orders.OrderID;')}
<h3>Finding what's missing</h3>
<p>Add <code>WHERE right_table.key IS NULL</code> to keep only the unmatched rows. This is a common data quality check.</p>
${C('SELECT Customers.CompanyName\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nWHERE Orders.OrderID IS NULL;')}
${TIP('Avoid <code>RIGHT JOIN</code>: swap the tables and use a <code>LEFT JOIN</code> instead. The <a href="#/lesson/joinsintro">Introduction to joins</a> explains why.')}
${SAME('<code>LEFT JOIN</code> can also be written <code>LEFT OUTER JOIN</code> in all three.')}`,
    ex:[
      {p:'Using a LEFT JOIN, find the CompanyName of every customer who has never placed an order.', hint:'LEFT JOIN Orders, then WHERE Orders.OrderID IS NULL.', sol:'SELECT Customers.CompanyName\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nWHERE Orders.OrderID IS NULL;'},
      {p:'List every customer\'s CompanyName with their number of orders, including customers with zero.', hint:'COUNT(Orders.OrderID) counts only matched rows, so unmatched customers get 0. COUNT(*) would give them 1.', sol:"SELECT Customers.CompanyName, COUNT(Orders.OrderID) AS 'Orders'\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nGROUP BY Customers.CustomerID, Customers.CompanyName;"},
      {p:'Show every employee\'s first and last name next to their manager\'s last name. Include the employee who has no manager.', hint:'Join Employees to itself: Employees e LEFT JOIN Employees m ON e.ReportsTo = m.EmployeeID.', sol:"SELECT e.FirstName, e.LastName, m.LastName AS 'Manager'\nFROM Employees e\nLEFT JOIN Employees m ON e.ReportsTo = m.EmployeeID;"}
    ]},

  multijoin:{title:'Table aliases and multiple joins', summary:'Give tables short names and join three or more of them.', cmds:['FROM Products p','JOIN … JOIN'],
    learn:`
<p>Writing <code>Products.ProductName</code> in full gets tiring. A table alias is a short name you give a table in <code>FROM</code> or <code>JOIN</code>, then use everywhere else in the query:</p>
${C('SELECT p.ProductName, s.CompanyName\nFROM Products p\nLEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID;')}
<p>You can chain as many joins as you need. Each one adds a table and needs its own <code>ON</code> condition. Follow the lines on the ERD to see which keys to use.</p>
${C("SELECT p.ProductName  AS 'Product',\n       s.CompanyName  AS 'Supplier',\n       c.CategoryName AS 'Category'\nFROM Products p\nINNER JOIN Suppliers  s ON p.SupplierID = s.SupplierID\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID;")}
${TIP('If you leave out an <code>ON</code> clause or use the wrong columns, every row of one table gets matched with every row of the other. That\'s a cartesian product, and it can be enormous. Check each condition as you add a join.')}
<p>Joins combine well with grouping:</p>
${C("SELECT c.CategoryName, COUNT(*) AS 'Products'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;")}
${SAME('Table aliases can be written with or without <code>AS</code> (<code>Products AS p</code> or <code>Products p</code>).')}`,
    ex:[
      {p:'List every order with its OrderID, OrderDate and Freight, the customer\'s CompanyName, and the employee\'s first and last name as one column.', hint:'Join Orders to Employees on EmployeeID and to Customers on CustomerID.', sol:"SELECT o.OrderID,\n       o.OrderDate,\n       o.Freight,\n       CONCAT(e.FirstName, ' ', e.LastName) AS 'Sales Person',\n       c.CompanyName AS 'Customer'\nFROM Orders o\nINNER JOIN Employees e ON o.EmployeeID = e.EmployeeID\nINNER JOIN Customers c ON o.CustomerID = c.CustomerID;"},
      {p:'List every product in the Seafood category with its supplier\'s CompanyName.', hint:'Three tables: Products, Categories and Suppliers. Filter on CategoryName.', sol:"SELECT p.ProductName, s.CompanyName\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nINNER JOIN Suppliers  s ON p.SupplierID = s.SupplierID\nWHERE c.CategoryName = 'Seafood';"},
      {p:'Show each customer\'s CustomerID, CompanyName and total Freight. Only return customers whose total freight exceeds 500.', hint:'Join, GROUP BY the customer, then HAVING SUM(o.Freight) > 500.', sol:"SELECT c.CustomerID,\n       c.CompanyName  AS 'Customer',\n       SUM(o.Freight) AS 'Total Freight'\nFROM Orders o\nINNER JOIN Customers c ON o.CustomerID = c.CustomerID\nGROUP BY c.CustomerID, c.CompanyName\nHAVING SUM(o.Freight) > 500;"}
    ]},

  cp3:{title:'Checkpoint: joins', summary:'Mixed practice following the ERD across several tables.', cmds:[], checkpoint:true,
    ex:[
      {p:'What is the total sales value (UnitPrice × Quantity × (1 − Discount)) for each category name? Show the highest first.', hint:'"Order Details" → Products → Categories, then GROUP BY CategoryName.', ordered:[1], sol:"SELECT c.CategoryName,\n       SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS 'Sales'\nFROM \"Order Details\" od\nINNER JOIN Products   p ON od.ProductID = p.ProductID\nINNER JOIN Categories c ON p.CategoryID  = c.CategoryID\nGROUP BY c.CategoryName\nORDER BY Sales DESC;"},
      {p:'Which products come from suppliers in Japan? Show ProductName and the supplier\'s CompanyName.', hint:"Join Products to Suppliers, WHERE s.Country = 'Japan'.", sol:"SELECT p.ProductName, s.CompanyName\nFROM Products p\nINNER JOIN Suppliers s ON p.SupplierID = s.SupplierID\nWHERE s.Country = 'Japan';"},
      {p:'How many orders did each shipper carry? Show the shipper\'s CompanyName and the count, most first.', hint:'Orders.ShipVia links to Shippers.ShipperID.', ordered:[1], sol:"SELECT sh.CompanyName, COUNT(*) AS 'Orders'\nFROM Orders o\nINNER JOIN Shippers sh ON o.ShipVia = sh.ShipperID\nGROUP BY sh.CompanyName\nORDER BY COUNT(*) DESC;"}
    ]},

  /* ===== Unit 5 ===== */
  subintro:{title:'Introduction to subqueries', summary:'A query inside a query: what it returns, where it can go, and how the database works it out.', cmds:['(SELECT …)','IN','EXISTS','FROM (SELECT …) AS t'],
    learn:`
<p>A <strong>subquery</strong> is a <code>SELECT</code> written inside another statement, in brackets. It lets you use the answer to one question inside another, in one go, without writing the first answer down.</p>
<p>To see how they work, here's a tiny café. Every example below builds these two tables with <code>WITH</code>, so you can run it here:</p>
<div class="two-tables">
<table class="mini"><tr><th colspan="3">product</th></tr><tr><th>name</th><th>category</th><th>price</th></tr><tr><td>Tea</td><td>Drinks</td><td>3</td></tr><tr><td>Coffee</td><td>Drinks</td><td>4</td></tr><tr><td>Juice</td><td>Drinks</td><td>6</td></tr><tr><td>Biscuits</td><td>Food</td><td>2</td></tr><tr><td>Cake</td><td>Food</td><td>5</td></tr><tr><td>Soup</td><td>Food</td><td>7</td></tr></table>
<table class="mini"><tr><th colspan="2">sale</th></tr><tr><th>product</th><th>qty</th></tr><tr><td>Tea</td><td>10</td></tr><tr><td>Cake</td><td>4</td></tr><tr><td>Tea</td><td>2</td></tr><tr><td>Juice</td><td>1</td></tr></table>
</div>
<h3>Inside out</h3>
<p>Which products cost more than the average? You'd need the average first, then compare each price with it. A subquery does both:</p>
<div class="sq-flow" role="img" aria-label="Step 1: the inner query works out the average price, 4.5. Step 2: the outer query keeps the products priced above 4.5: Juice, Cake and Soup.">
  <div class="sq-box sq-inner"><span class="sq-n">1</span><div><b>The inner query runs first</b><code>SELECT AVG(price) FROM product</code></div></div>
  <div class="sq-arrow" aria-hidden="true">→</div>
  <div class="sq-value"><span>answer</span><b>4.5</b></div>
  <div class="sq-arrow" aria-hidden="true">→</div>
  <div class="sq-box sq-outer"><span class="sq-n">2</span><div><b>The outer query uses the answer</b><code>SELECT name FROM product WHERE price &gt; 4.5</code><em>Juice, Cake, Soup</em></div></div>
</div>
${C(SHOP + "SELECT name, price\nFROM product\nWHERE price > (SELECT AVG(price) FROM product);")}
${TIP('<strong>A good habit:</strong> when a subquery confuses you, run the inner query on its own first and look at what it returns. Here, that\'s <code>SELECT AVG(price) FROM product</code>, which gives 4.5.')}
<h3>What a subquery can return</h3>
<p>What you can do with a subquery depends on the shape of its answer:</p>
<table class="mini"><tr><th>It returns</th><th>Called</th><th>Use it</th><th>Example</th></tr>
<tr><td>One value (one row, one column)</td><td>A scalar subquery</td><td>With <code>=</code>, <code>&gt;</code>, <code>&lt;</code>, or as a column in <code>SELECT</code></td><td><code>(SELECT AVG(price) FROM product)</code></td></tr>
<tr><td>A list (one column, many rows)</td><td>A list subquery</td><td>With <code>IN</code> or <code>NOT IN</code></td><td><code>(SELECT product FROM sale)</code></td></tr>
<tr><td>A table (many columns and rows)</td><td>A derived table</td><td>In <code>FROM</code>, with a name</td><td><code>(SELECT category, AVG(price) …) AS c</code></td></tr></table>
<h3>Where a subquery can go</h3>
<div class="sq-places">
  <div class="sq-place"><b>In WHERE</b><span>To filter rows using an answer worked out from data</span><code>WHERE price &gt; (SELECT AVG(price) …)</code></div>
  <div class="sq-place"><b>In SELECT</b><span>To add a calculated column to every row</span><code>SELECT name, (SELECT MAX(price) …)</code></div>
  <div class="sq-place"><b>In FROM</b><span>To use a query's result as if it were a table</span><code>FROM (SELECT …) AS t</code></div>
</div>
<h3>A list, with IN</h3>
<p>Which products have sold at least once? The inner query lists every product in <code>sale</code>; <code>IN</code> keeps the products on that list:</p>
${C(SHOP + "SELECT name\nFROM product\nWHERE name IN (SELECT product FROM sale);")}
<p>Turn it round with <code>NOT IN</code> to find products that have never sold:</p>
${C(SHOP + "SELECT name\nFROM product\nWHERE name NOT IN (SELECT product FROM sale);")}
<h3>One value, as a column</h3>
<p>A scalar subquery in <code>SELECT</code> adds the same answer to every row, so you can compare each row with it:</p>
${C(SHOP + "SELECT name, price,\n       (SELECT MAX(price) FROM product) AS top_price,\n       (SELECT MAX(price) FROM product) - price AS cheaper_by\nFROM product;")}
<h3>A table, in FROM</h3>
<p>A subquery in <code>FROM</code> works like a temporary table. Here it works out each category's average, then the outer query filters those averages:</p>
${C(SHOP + "SELECT category, avg_price\nFROM (\n    SELECT category, AVG(price) AS avg_price\n    FROM product\n    GROUP BY category\n) AS averages\nWHERE avg_price > 4.5;")}
<h3>Correlated subqueries</h3>
<p>So far each inner query runs once. A <strong>correlated</strong> subquery refers to the outer row, so it's worked out again for every row. Which products cost more than the average <em>of their own category</em>?</p>
${C(SHOP + "SELECT p.name, p.category, p.price\nFROM product p\nWHERE p.price > (\n    SELECT AVG(price)\n    FROM product\n    WHERE category = p.category\n);")}
<p>For Tea, the inner query averages the Drinks (4.33); for Cake, the Food (4.67). The <code>p.category</code> inside the brackets is what links the two.</p>
<p><code>EXISTS</code> is the most common correlated subquery. It's true if the inner query finds at least one row:</p>
${C(SHOP + "SELECT p.name\nFROM product p\nWHERE EXISTS (\n    SELECT 1 FROM sale s WHERE s.product = p.name\n);")}
<h3>Subquery or join?</h3>
<p>Many questions can be answered either way. Use whichever reads more like the question: "products that appear in sales" reads naturally as <code>IN</code> or <code>EXISTS</code>; "each product with its sales" reads as a <code>JOIN</code>. The next three lessons look at each kind of subquery in detail, on Northwind.</p>
${SAME('Subqueries work the same in all three. The one difference: MySQL and T-SQL insist on a name for a subquery in <code>FROM</code> (<code>AS averages</code>), so always give one.')}`,
    ex:[
      {p:'Which products are cheaper than the average price? Show their name and price.', hint:'WHERE price < (SELECT AVG(price) FROM product)', starter:SHOP_START, sol:SHOP + "SELECT name, price\nFROM product\nWHERE price < (SELECT AVG(price) FROM product);"},
      {p:'Using IN, list the names of products that have sold at least once.', hint:'WHERE name IN (SELECT product FROM sale)', starter:SHOP_START, sol:SHOP + "SELECT name\nFROM product\nWHERE name IN (SELECT product FROM sale);"},
      {p:'Which products have never sold? Show their names.', hint:'NOT IN, or NOT EXISTS, with sale.', starter:SHOP_START, sol:SHOP + "SELECT name\nFROM product\nWHERE name NOT IN (SELECT product FROM sale);"},
      {p:'Show each product\'s name and price, with the lowest price in the café next to it as a column.', hint:'(SELECT MIN(price) FROM product) in the SELECT list.', starter:SHOP_START, sol:SHOP + "SELECT name, price, (SELECT MIN(price) FROM product) AS lowest_price\nFROM product;"},
      {p:'Using a subquery in FROM, work out each category\'s average price, then show only the categories whose average is above 4.5.', hint:'FROM (SELECT category, AVG(price) AS avg_price FROM product GROUP BY category) AS averages WHERE avg_price > 4.5', starter:SHOP_START, sol:SHOP + "SELECT category, avg_price\nFROM (\n    SELECT category, AVG(price) AS avg_price\n    FROM product\n    GROUP BY category\n) AS averages\nWHERE avg_price > 4.5;"},
      {p:'Which products cost more than the average price of their own category? Show the name, category and price.', hint:'A correlated subquery: WHERE p.price > (SELECT AVG(price) FROM product WHERE category = p.category)', starter:SHOP_START, sol:SHOP + "SELECT p.name, p.category, p.price\nFROM product p\nWHERE p.price > (\n    SELECT AVG(price) FROM product WHERE category = p.category\n);"}
    ]},

  subwhere:{title:'Subqueries in WHERE', summary:'Filter using a value or a list worked out by another query.', cmds:['(SELECT …)','IN','NOT IN'],
    learn:`
<p>As in the <a href="#/lesson/subintro">Introduction to subqueries</a>, the inner query runs first and its result is used by the outer one. Now on Northwind:</p>
${C('SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products);')}
<p>The subquery returns one number, the average price, which <code>&gt;</code> compares against. When a subquery returns a list, use <code>IN</code>:</p>
${C('SELECT CompanyName, Country\nFROM Customers\nWHERE CustomerID IN (SELECT DISTINCT CustomerID FROM Orders);')}
<table class="mini"><tr><th>The subquery returns</th><th>Use</th></tr><tr><td>Exactly one value</td><td><code>=</code>, <code>&gt;</code>, <code>&lt;</code>…</td></tr><tr><td>A list of values</td><td><code>IN</code> or <code>NOT IN</code></td></tr></table>
${TIP('<strong>Watch out with NOT IN.</strong> If the subquery returns even one NULL, <code>NOT IN</code> matches nothing at all. Add <code>WHERE column IS NOT NULL</code> inside the subquery, or use <code>NOT EXISTS</code> (two lessons on).')}
${SAME()}`,
    ex:[
      {p:'Using a subquery in WHERE, find all products priced above the average unit price. Show the name and price, most expensive first.', hint:'WHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)', ordered:[1], sol:'SELECT ProductName, UnitPrice\nFROM Products\nWHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products)\nORDER BY UnitPrice DESC;'},
      {p:'Which orders have a freight cost above the average freight? Show the OrderID and Freight.', hint:'Same pattern as the example, on Orders.', sol:'SELECT OrderID, Freight\nFROM Orders\nWHERE Freight > (SELECT AVG(Freight) FROM Orders);'},
      {p:'Using IN, list the CompanyName of every customer who has had at least one order shipped by shipper 3 (ShipVia = 3).', hint:'WHERE CustomerID IN (SELECT CustomerID FROM Orders WHERE ShipVia = 3)', sol:'SELECT CompanyName\nFROM Customers\nWHERE CustomerID IN (SELECT CustomerID FROM Orders WHERE ShipVia = 3);'}
    ]},

  subfrom:{title:'Subqueries in FROM and SELECT', summary:'Use a query as a temporary table, or as a calculated column.', cmds:['FROM (SELECT …) AS t','SELECT (SELECT …)'],
    learn:`
<h3>In FROM: derived tables</h3>
<p>A subquery in <code>FROM</code> acts as a temporary table that exists only for this query. It must have an alias. It's useful when you need to summarise first, then join:</p>
${C("SELECT s.CompanyName AS 'Supplier',\n       avg_prices.AvgPrice AS 'Average Price'\nFROM Suppliers s\nINNER JOIN (\n    SELECT SupplierID, AVG(UnitPrice) AS AvgPrice\n    FROM Products\n    GROUP BY SupplierID\n) AS avg_prices ON s.SupplierID = avg_prices.SupplierID\nWHERE avg_prices.AvgPrice > 20\nORDER BY avg_prices.AvgPrice DESC;")}
<h3>In SELECT: scalar subqueries</h3>
<p>A subquery in <code>SELECT</code> must return exactly one value. It runs for every row, adding that value as a column:</p>
${C("SELECT ProductName,\n       UnitPrice,\n       (SELECT AVG(UnitPrice) FROM Products) AS 'Average Price'\nFROM Products;")}
<p>When the subquery refers to the outer row, it's called a correlated subquery. This one counts the lines in each order:</p>
${C("SELECT o.OrderID,\n       (SELECT COUNT(*)\n        FROM \"Order Details\" od\n        WHERE od.OrderID = o.OrderID) AS 'Number of Items'\nFROM Orders o;")}
${TIP('If you keep writing the same derived table, save it as a view. That\'s the last lesson on the path.')}
${DIFF({title:'Naming a derived table in each dialect', common:'FROM (SELECT …) AS t   -- always give it a name', sqlite:'FROM (SELECT …)        -- a name is optional', note:'MySQL and T-SQL insist on the name, so always give one. Scalar subqueries in <code>SELECT</code> work the same in all three.'})}`,
    ex:[
      {p:'Using a subquery in FROM, total the Freight per customer and join it to Customers to show CompanyName next to the total. Order by total freight, highest first.', hint:'Give the derived table an alias, for example ) AS freight_totals ON …', ordered:[1], sol:"SELECT c.CompanyName AS 'Customer',\n       freight_totals.TotalFreight AS 'Total Freight'\nFROM Customers c\nINNER JOIN (\n    SELECT CustomerID, SUM(Freight) AS TotalFreight\n    FROM Orders\n    GROUP BY CustomerID\n) AS freight_totals ON c.CustomerID = freight_totals.CustomerID\nORDER BY freight_totals.TotalFreight DESC;"},
      {p:'Show each product\'s name, its unit price, and how far its price is from the average price.', hint:'UnitPrice - (SELECT AVG(UnitPrice) FROM Products)', sol:"SELECT ProductName,\n       UnitPrice,\n       UnitPrice - (SELECT AVG(UnitPrice) FROM Products) AS 'Difference from Average'\nFROM Products;"},
      {p:'Using a subquery in SELECT, show each CustomerID from Customers with how many orders they\'ve placed.', hint:'(SELECT COUNT(*) FROM Orders o WHERE o.CustomerID = c.CustomerID)', sol:"SELECT c.CustomerID,\n       (SELECT COUNT(*) FROM Orders o WHERE o.CustomerID = c.CustomerID) AS 'Orders'\nFROM Customers c;"}
    ]},

  exists:{title:'EXISTS and NOT EXISTS', summary:'Check whether related rows exist.', cmds:['EXISTS','NOT EXISTS'],
    learn:`
<p><code>EXISTS</code> is true if its subquery returns at least one row. What the subquery selects doesn't matter, so <code>SELECT 1</code> is the convention.</p>
${C('SELECT CompanyName\nFROM Customers c\nWHERE EXISTS (\n    SELECT 1\n    FROM Orders o\n    WHERE o.CustomerID = c.CustomerID\n);')}
<p><code>NOT EXISTS</code> finds rows with no match. Unlike <code>NOT IN</code>, it isn't tripped up by NULLs.</p>
<h3>Subquery or JOIN?</h3>
<p>These return the same customers. The join needs <code>DISTINCT</code>, because a customer with ten orders would appear ten times.</p>
${C('SELECT CompanyName\nFROM Customers\nWHERE CustomerID IN (SELECT CustomerID FROM Orders);')}
${C('SELECT DISTINCT c.CompanyName\nFROM Customers c\nINNER JOIN Orders o ON c.CustomerID = o.CustomerID;')}
<table class="mini"><tr><th>If you want to…</th><th>Prefer</th></tr><tr><td>Check related rows exist</td><td><code>EXISTS</code></td></tr><tr><td>Show columns from several tables</td><td><code>JOIN</code></td></tr><tr><td>Aggregate before joining</td><td>A derived table</td></tr></table>
${SAME()}`,
    ex:[
      {p:'Using NOT EXISTS, find the CompanyName of every customer who has never placed an order.', hint:'Inside NOT EXISTS, select from Orders where o.CustomerID = c.CustomerID.', sol:'SELECT CompanyName\nFROM Customers c\nWHERE NOT EXISTS (\n    SELECT 1\n    FROM Orders o\n    WHERE o.CustomerID = c.CustomerID\n);'},
      {p:'Using EXISTS, list the CompanyName of every supplier that supplies at least one discontinued product.', hint:'EXISTS (SELECT 1 FROM Products p WHERE p.SupplierID = s.SupplierID AND p.Discontinued = 1)', sol:'SELECT CompanyName\nFROM Suppliers s\nWHERE EXISTS (\n    SELECT 1\n    FROM Products p\n    WHERE p.SupplierID = s.SupplierID\n      AND p.Discontinued = 1\n);'},
      {p:'Which products have appeared on an order line with a quantity over 100? Show the ProductName.', hint:'EXISTS on "Order Details" with od.ProductID = p.ProductID AND od.Quantity > 100.', sol:'SELECT ProductName\nFROM Products p\nWHERE EXISTS (\n    SELECT 1\n    FROM "Order Details" od\n    WHERE od.ProductID = p.ProductID\n      AND od.Quantity > 100\n);'}
    ]},

  cp4:{title:'Checkpoint: subqueries', summary:'Mixed practice on nested queries.', cmds:[], checkpoint:true,
    ex:[
      {p:'Find the most expensive product in each category. Show CategoryID, ProductName and UnitPrice.', hint:'A correlated subquery: WHERE p.UnitPrice = (SELECT MAX(UnitPrice) FROM Products WHERE CategoryID = p.CategoryID)', sol:'SELECT p.CategoryID, p.ProductName, p.UnitPrice\nFROM Products p\nWHERE p.UnitPrice = (\n    SELECT MAX(UnitPrice)\n    FROM Products\n    WHERE CategoryID = p.CategoryID\n);'},
      {p:'Which customers have spent more than 30,000 in total? Show CompanyName and total spend (UnitPrice × Quantity × (1 − Discount)).', hint:'Build a derived table of spend per CustomerID from Orders and "Order Details", then join it to Customers.', sol:"SELECT c.CompanyName, t.TotalSpend\nFROM Customers c\nINNER JOIN (\n    SELECT o.CustomerID,\n           SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS TotalSpend\n    FROM Orders o\n    INNER JOIN \"Order Details\" od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n) AS t ON c.CustomerID = t.CustomerID\nWHERE t.TotalSpend > 30000;"},
      {p:'List the first and last names of employees who have taken an order from a customer in Brazil.', hint:'WHERE EmployeeID IN (SELECT EmployeeID FROM Orders WHERE CustomerID IN (…Brazilian customers…))', sol:"SELECT FirstName, LastName\nFROM Employees\nWHERE EmployeeID IN (\n    SELECT EmployeeID FROM Orders\n    WHERE CustomerID IN (SELECT CustomerID FROM Customers WHERE Country = 'Brazil')\n);"}
    ]},

  /* ===== Unit 6 ===== */
  case:{title:'CASE statements', summary:'Choose a value row by row, like if/else.', cmds:['CASE','WHEN','THEN','ELSE','END'],
    learn:`
<p><code>CASE</code> checks conditions in order and returns the value for the first one that's true. <code>ELSE</code> covers everything else, and <code>END</code> closes it.</p>
${C("SELECT ProductName, UnitsInStock,\n       CASE\n           WHEN UnitsInStock = 0  THEN 'Out of stock'\n           WHEN UnitsInStock < 20 THEN 'Low'\n           ELSE 'OK'\n       END AS 'Stock Status'\nFROM Products;")}
${TIP('Order matters. If <code>&lt; 20</code> came first, products with 0 in stock would be labelled Low, because CASE stops at the first match.')}
<p>You can group by a <code>CASE</code> to count each label:</p>
${C("SELECT CASE WHEN Discontinued = 1 THEN 'Discontinued' ELSE 'Active' END AS 'Status',\n       COUNT(*) AS 'Products'\nFROM Products\nGROUP BY CASE WHEN Discontinued = 1 THEN 'Discontinued' ELSE 'Active' END;")}
${DIFF({title:'Two-way choices in each dialect', common:"CASE WHEN UnitPrice < 10 THEN 'Budget' ELSE 'Other' END", otherTitle:'Each dialect\'s shortcut', sqlite:"iif(UnitPrice < 10, 'Budget', 'Other')", mysql:"IF(UnitPrice < 10, 'Budget', 'Other')", tsql:"IIF(UnitPrice < 10, 'Budget', 'Other')", note:'<code>CASE</code> works the same in all three, so it\'s the one to use. The shortcuts only handle a simple either/or.'})}`,
    ex:[
      {p:'Show each OrderID with a Status column: On Time if it shipped less than 10 days after the order date, otherwise Overdue.', hint:"julianday(ShippedDate) - julianday(OrderDate) gives the days between. Wrap it in CASE WHEN … THEN 'On Time' ELSE 'Overdue' END.", sol:"SELECT OrderID,\n       CASE\n           WHEN julianday(ShippedDate) - julianday(OrderDate) < 10 THEN 'On Time'\n           ELSE 'Overdue'\n       END AS 'Status'\nFROM Orders;"},
      {p:'Give each product a Price Band: Budget under 10, Standard under 30, otherwise Premium. Show ProductName, UnitPrice and the band.', hint:'Two WHENs, checked from cheapest up, then ELSE.', sol:"SELECT ProductName, UnitPrice,\n       CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END AS 'Price Band'\nFROM Products;"},
      {p:'Count how many products fall in each of those price bands.', hint:'GROUP BY the same CASE expression.', sol:"SELECT CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END AS 'Price Band',\n       COUNT(*) AS 'Products'\nFROM Products\nGROUP BY CASE\n           WHEN UnitPrice < 10 THEN 'Budget'\n           WHEN UnitPrice < 30 THEN 'Standard'\n           ELSE 'Premium'\n       END;"}
    ]},

  datesstrings:{title:'Date and string functions', summary:'Pull apart, change and format dates and text.', cmds:['date()','strftime()','julianday()','substr()','instr()','length()','upper()'],
    learn:`
${HD(['sqlite'],'Dates in SQLite')}
<p>Dates are where the dialects differ most, so this section shows SQLite's functions and the notes after it show MySQL's and T-SQL's. SQLite stores dates as text in the form <code>'YYYY-MM-DD'</code>, so dates sort and compare in the right order. A handful of functions work with them:</p>
<table class="mini"><tr><th>Task</th><th>SQLite</th><th>Example result</th></tr>
<tr><td>Today</td><td><code>date('now')</code>, <code>datetime('now')</code></td><td><code>'2026-10-12'</code></td></tr>
<tr><td>Part of a date</td><td><code>strftime('%Y', d)</code>, <code>strftime('%m', d)</code>, <code>strftime('%d', d)</code></td><td><code>'1997'</code>, <code>'03'</code>, <code>'15'</code></td></tr>
<tr><td>Days between</td><td><code>julianday(end) - julianday(start)</code></td><td><code>12.0</code></td></tr>
<tr><td>Add to a date</td><td><code>date(d, '+5 days')</code>, <code>date(d, '+1 month')</code></td><td><code>'1996-07-09'</code></td></tr>
<tr><td>Format a date</td><td><code>strftime('%d/%m/%Y', d)</code></td><td><code>'04/07/1996'</code></td></tr></table>
${TIP('<code>strftime</code> returns text, so compare it with text: <code>WHERE strftime(\'%Y\', OrderDate) = \'1997\'</code>.')}
${C("SELECT OrderDate,\n       date(OrderDate, '+5 days')                    AS 'Due Date',\n       julianday(ShippedDate) - julianday(OrderDate) AS 'Ship Days',\n       strftime('%d/%m/%Y', OrderDate)               AS 'UK Format'\nFROM Orders;")}
${DIFF({title:'The same date jobs in each dialect', common:'CURRENT_TIMESTAMP   -- the date and time now', otherTitle:'Where they differ', sqlite:"strftime('%Y', OrderDate)\njulianday(ShippedDate) - julianday(OrderDate)\ndate(OrderDate, '+5 days')\nstrftime('%d/%m/%Y', OrderDate)", mysql:"YEAR(OrderDate)\nDATEDIFF(ShippedDate, OrderDate)\nDATE_ADD(OrderDate, INTERVAL 5 DAY)\nDATE_FORMAT(OrderDate, '%d/%m/%Y')", tsql:"YEAR(OrderDate)\nDATEDIFF(day, OrderDate, ShippedDate)\nDATEADD(day, 5, OrderDate)\nFORMAT(OrderDate, 'dd/MM/yyyy')", note:'Dates are where the dialects differ most, so check the notes for your database. Watch the order of the dates: MySQL\'s <code>DATEDIFF</code> takes the end date first, T-SQL\'s takes the start date first. (In SQLite, <code>CURRENT_TIMESTAMP</code> is in UTC.)'})}
${HD('all','Text functions','Mostly all three: see the notes')}
<table class="mini"><tr><th>Task</th><th>SQLite</th></tr>
<tr><td>Length</td><td><code>length(s)</code></td></tr>
<tr><td>Find text</td><td><code>instr(s, ' ')</code>: the position of the first space, or 0</td></tr>
<tr><td>Cut text</td><td><code>SUBSTRING(s, start, length)</code>: works in all three. SQLite also has <code>substr</code>, and <code>substr(s, -3)</code> gives the last 3 characters</td></tr>
<tr><td>Change case</td><td><code>upper(s)</code>, <code>lower(s)</code></td></tr>
<tr><td>Replace and trim</td><td><code>replace(s, 'a', 'b')</code>, <code>trim(s)</code></td></tr></table>
${DIFF({title:'Text functions in each dialect', common:"SUBSTRING(s, 2, 3)   -- 3 characters from the 2nd\nUPPER(s)   LOWER(s)   TRIM(s)\nREPLACE(s, 'a', 'b')", sqlite:"length(s)\ninstr(s, ' ')\nsubstr(s, -3)        -- the last 3", mysql:"LENGTH(s)\nLOCATE(' ', s)\nLEFT(s, 3)   RIGHT(s, 3)", tsql:"LEN(s)\nCHARINDEX(' ', s)\nLEFT(s, 3)   RIGHT(s, 3)", note:'Watch the argument order when finding text: <code>instr</code> takes the text first; <code>LOCATE</code> and <code>CHARINDEX</code> take the thing to find first. Joining text is in <a href="#/lesson/concat">Concatenation</a>.'})}
<p>Functions nest. This finds the space in a UK postcode and keeps everything before it:</p>
${C("SELECT PostalCode,\n       SUBSTRING(PostalCode, 1, instr(PostalCode, ' ') - 1) AS 'Post Code Region'\nFROM Customers\nWHERE Country = 'UK';")}`,
    ex:[
      {p:'How many orders were placed in each year? Show the year and the count.', hint:"GROUP BY strftime('%Y', OrderDate).", sol:"SELECT strftime('%Y', OrderDate) AS 'Year', COUNT(*) AS 'Orders'\nFROM Orders\nGROUP BY strftime('%Y', OrderDate);"},
      {p:'List the ProductName of products that contain a single quote, with the position of the quote.', hint:"instr(ProductName, '''') finds it; keep rows where it's above 0.", sol:"SELECT ProductName,\n       instr(ProductName, '''') AS 'Quote Position'\nFROM Products\nWHERE instr(ProductName, '''') > 0;"},
      {p:'Show each employee\'s full name and the number of days between their birth date and their hire date.', hint:'julianday(HireDate) - julianday(BirthDate)', sol:"SELECT CONCAT(FirstName, ' ', LastName) AS 'Full Name',\n       julianday(HireDate) - julianday(BirthDate) AS 'Days Old When Hired'\nFROM Employees;"},
      {p:'Show each customer\'s CompanyName in capital letters, with the length of the name.', hint:'upper(CompanyName) and length(CompanyName).', sol:"SELECT upper(CompanyName) AS 'Company', length(CompanyName) AS 'Length'\nFROM Customers;"}
    ]},

  indexes:{title:'Indexes', summary:'Make searches faster by letting the database jump straight to the rows it needs.', cmds:['CREATE INDEX','CREATE UNIQUE INDEX','DROP INDEX'], rollback:true,
    learn:`
<p>An <strong>index</strong> works like the index at the back of a book. To find "Paris" in a book with no index, you'd read every page. With one, you look up "Paris" and go straight to the right pages.</p>
<p>A database is the same. Without an index, finding the customers in London means reading <em>every</em> row of Customers. With an index on <code>City</code>, the database looks up "London" and jumps straight to those rows. On a table of a few hundred rows you won't notice, but on millions of rows it's the difference between a blink and a long wait.</p>
${TIP('In this lesson, every run is undone straight afterwards, so the indexes you create don\'t stay. That way each example starts from Northwind as it was.')}
${HD('all','Creating an index')}
<p>Give the index a name, then say which table and column it's for. A common naming pattern is <code>idx_table_column</code>:</p>
${C("CREATE INDEX idx_customers_city ON Customers(City);\n\nSELECT CompanyName, City FROM Customers WHERE City = 'London';")}
<p>The query looks exactly the same: you never mention the index in a <code>SELECT</code>. The database decides for itself when to use it.</p>
${HD(['sqlite'],'Is it being used?')}
<p><code>EXPLAIN QUERY PLAN</code> shows how SQLite will find the rows (MySQL uses <code>EXPLAIN</code>, and SQL Server shows an execution plan). This script asks before and after creating the index:</p>
${C("EXPLAIN QUERY PLAN SELECT * FROM Customers WHERE City = 'London';\n\nCREATE INDEX idx_customers_city ON Customers(City);\n\nEXPLAIN QUERY PLAN SELECT * FROM Customers WHERE City = 'London';")}
<p>Before the index, the plan says <code>SCAN Customers</code>: it reads every row. After, it says <code>SEARCH Customers USING INDEX idx_customers_city</code>: it jumps straight to London. <a href="#/lesson/performance">Performance tuning</a> in Unit 7 goes into plans in more detail.</p>
${HD('all','Unique indexes')}
<p>A <strong>unique index</strong> also stops two rows having the same value, as a primary key does. No two shippers should share a phone number:</p>
${CERR("CREATE UNIQUE INDEX idx_shippers_phone ON Shippers(Phone);\n\nINSERT INTO Shippers (CompanyName, Phone)\nVALUES ('Copycat Couriers', '(503) 555-9831');")}
${TIP('Every primary key gets a unique index automatically, which is why looking a row up by its ID is always fast.')}
${HD('all','Indexes on more than one column')}
<p>An index can cover several columns, for searches that use them together. The order matters: this index helps searches on <code>CustomerID</code>, or on <code>CustomerID</code> and <code>OrderDate</code>, but not on <code>OrderDate</code> alone, just as a phone book sorted by surname then first name can't find everyone called "Ann".</p>
${C("CREATE INDEX idx_orders_customer_date ON Orders(CustomerID, OrderDate);\n\nEXPLAIN QUERY PLAN\nSELECT * FROM Orders WHERE CustomerID = 'ALFKI' AND OrderDate > '1998-01-01';")}
${HD(['sqlite'],'Seeing and removing indexes')}
${C("CREATE INDEX idx_customers_city ON Customers(City);\n\nPRAGMA index_list('Customers');")}
<p>Names starting <code>sqlite_autoindex</code> are the automatic ones for primary keys. To remove an index you no longer need:</p>
${C("CREATE INDEX idx_customers_city ON Customers(City);\nDROP INDEX idx_customers_city;\n\nPRAGMA index_list('Customers');")}
<h3>When to add an index</h3>
<p>Indexes aren't free. Each one takes space, and every <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> has to keep it up to date, which slows changes down. So don't index everything:</p>
<table class="mini"><tr><th>Index…</th><th>Don't bother indexing…</th></tr>
<tr><td>Columns you often search with <code>WHERE</code></td><td>Small tables: reading every row is already quick</td></tr>
<tr><td>Columns you join on (foreign keys)</td><td>Columns you rarely search on</td></tr>
<tr><td>Columns you often sort with <code>ORDER BY</code></td><td>Columns with only a few different values, such as true/false</td></tr></table>
${DIFF({title:'Indexes in each dialect', common:'CREATE INDEX idx_customers_city ON Customers(City);\nCREATE UNIQUE INDEX idx_shippers_phone ON Shippers(Phone);', otherTitle:'Removing and listing indexes', sqlite:"DROP INDEX idx_customers_city;\nPRAGMA index_list('Customers');", mysql:'DROP INDEX idx_customers_city ON Customers;\nSHOW INDEX FROM Customers;', tsql:"DROP INDEX idx_customers_city ON Customers;\nEXEC sp_helpindex 'Customers';", note:'Creating an index is written the same in all three. MySQL and SQL Server need the table name when you drop one.'})}`,
    ex:[
      {p:'Create an index called idx_products_supplier on the SupplierID column of Products, then list the indexes on Products.', hint:"CREATE INDEX idx_products_supplier ON Products(SupplierID); then PRAGMA index_list('Products');", sol:"CREATE INDEX idx_products_supplier ON Products(SupplierID);\nPRAGMA index_list('Products');"},
      {p:'Create a unique index called idx_categories_name on CategoryName in Categories. Then show the query plan for SELECT * FROM Categories WHERE CategoryName = \'Seafood\', and check it uses your index.', hint:"CREATE UNIQUE INDEX … ON Categories(CategoryName); then EXPLAIN QUERY PLAN SELECT * FROM Categories WHERE CategoryName = 'Seafood';", sol:"CREATE UNIQUE INDEX idx_categories_name ON Categories(CategoryName);\nEXPLAIN QUERY PLAN SELECT * FROM Categories WHERE CategoryName = 'Seafood';"},
      {p:'Orders are often searched by ShipCountry. Create an index called idx_orders_shipcountry for that, then show the query plan for SELECT * FROM Orders WHERE ShipCountry = \'France\'.', hint:"CREATE INDEX idx_orders_shipcountry ON Orders(ShipCountry); then EXPLAIN QUERY PLAN …", sol:"CREATE INDEX idx_orders_shipcountry ON Orders(ShipCountry);\nEXPLAIN QUERY PLAN SELECT * FROM Orders WHERE ShipCountry = 'France';"}
    ]},

  views:{title:'Views', summary:'Save a query under a name and use it like a table.', cmds:['CREATE VIEW','DROP VIEW'],
    learn:`
<p>A view is a saved query. It stores no data of its own: each time you select from it, the query behind it runs.</p>
${C("CREATE VIEW ProductCategorySummary AS\nSELECT c.CategoryName AS 'Category Name',\n       COUNT(*)       AS 'Number of Products'\nFROM Categories c\nINNER JOIN Products p ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;\n\nSELECT * FROM ProductCategorySummary;")}
<p>Running that twice gives an "already exists" error. Drop it first if you want to redefine it:</p>
${C('DROP VIEW IF EXISTS ProductCategorySummary;')}
${DIFF({title:'Changing a view in each dialect', common:'DROP VIEW IF EXISTS v;\nCREATE VIEW v AS SELECT …;', otherTitle:'One-step shortcuts', mysql:'CREATE OR REPLACE VIEW v AS SELECT …;', tsql:'CREATE OR ALTER VIEW v AS SELECT …;', note:'Creating, dropping and selecting from a view work the same in all three (<code>DROP … IF EXISTS</code> needs SQL Server 2016 or later).'})}
<ul class="plain"><li>Use views for complex queries you run often, or to give people a simpler way into joined data.</li><li>Views with joins or aggregates are read-only: you can't insert or update through them.</li><li>No spaces in view names. Some teams use a <code>vw_</code> prefix.</li></ul>
${TIP('Views you create here last until you reload the page. A view\'s close cousin is the stored procedure, which is the next lesson.')}`,
    ex:[
      {p:'Create the ProductCategorySummary view from the lesson (Category Name and Number of Products), then select everything from it.', hint:'Copy the example. Start with DROP VIEW IF EXISTS if it already exists.', sol:"DROP VIEW IF EXISTS ProductCategorySummary;\nCREATE VIEW ProductCategorySummary AS\nSELECT c.CategoryName AS 'Category Name',\n       COUNT(*)       AS 'Number of Products'\nFROM Categories c\nINNER JOIN Products p ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;\nSELECT * FROM ProductCategorySummary;"},
      {p:'Create a view called vw_CustomerOrderCounts with each customer\'s CompanyName and number of orders (call it OrderCount). Then use the view to list the customers with more than 20 orders.', hint:'CREATE VIEW … AS SELECT … GROUP BY …; then SELECT * FROM vw_CustomerOrderCounts WHERE OrderCount > 20;', sol:"DROP VIEW IF EXISTS vw_CustomerOrderCounts;\nCREATE VIEW vw_CustomerOrderCounts AS\nSELECT c.CompanyName, COUNT(o.OrderID) AS OrderCount\nFROM Customers c\nLEFT JOIN Orders o ON o.CustomerID = c.CustomerID\nGROUP BY c.CustomerID, c.CompanyName;\nSELECT * FROM vw_CustomerOrderCounts WHERE OrderCount > 20;"}
    ]},
  procedures:{title:'Stored procedures', summary:'Save a block of SQL in the database, with parameters, and run it by name.', cmds:['CREATE PROCEDURE','CALL','EXEC'],
    learn:`
<p>A <strong>stored procedure</strong> is a named, reusable block of SQL saved in the database. Instead of writing the same statements every time, you call the procedure by name and pass in values, called <strong>parameters</strong>.</p>
<ul class="plain"><li><strong>No duplication:</strong> every application and user calls the same logic instead of rewriting it.</li><li><strong>Consistency:</strong> a change to the logic is made in one place.</li><li><strong>Security:</strong> people can be allowed to run a procedure without being given direct access to its tables.</li></ul>
${TIP('<strong>SQLite has no stored procedures.</strong> It runs inside your application, so the application\'s own code does this job. The examples below are MySQL and T-SQL, so try them in MySQL Workbench or SQL Server Management Studio.')}
${HD(['mysql','tsql'],'Creating a procedure')}
<p>This procedure updates a customer's phone number. It takes two parameters: the customer's ID and the new number.</p>
${C("DELIMITER //\n\nCREATE PROCEDURE UpdateCustomerPhone(\n    IN p_CustomerID CHAR(5),\n    IN p_NewPhone   VARCHAR(24)\n)\nBEGIN\n    UPDATE Customers\n    SET Phone = p_NewPhone\n    WHERE CustomerID = p_CustomerID;\nEND //\n\nDELIMITER ;", false, READ_ONLY('mysql','MySQL Workbench'))}
<table class="mini"><tr><th>Part</th><th>What it does</th></tr>
<tr><td><code>DELIMITER //</code></td><td>Temporarily changes the end-of-statement marker, so MySQL doesn't stop at the semicolons inside the procedure</td></tr>
<tr><td><code>CREATE PROCEDURE UpdateCustomerPhone</code></td><td>Names the procedure</td></tr>
<tr><td><code>IN p_CustomerID CHAR(5)</code></td><td>An input parameter: which customer to update</td></tr>
<tr><td><code>BEGIN … END</code></td><td>Wraps the statements the procedure runs</td></tr>
<tr><td><code>DELIMITER ;</code></td><td>Puts the normal semicolon back</td></tr></table>
<p>The T-SQL version is similar. Parameters start with <code>@</code>, and there's no <code>DELIMITER</code>:</p>
${C("CREATE PROCEDURE UpdateCustomerPhone\n    @CustomerID CHAR(5),\n    @NewPhone   VARCHAR(24)\nAS\nBEGIN\n    UPDATE Customers\n    SET    Phone = @NewPhone\n    WHERE  CustomerID = @CustomerID;\nEND;", false, READ_ONLY('tsql','SQL Server Management Studio'))}
${HD(['mysql','tsql'],'Running a procedure')}
${DIFF({title:'Calling a procedure in each dialect', mysql:"CALL UpdateCustomerPhone('ALFKI', '0121-555-5555');", tsql:"EXEC UpdateCustomerPhone\n    @CustomerID = 'ALFKI',\n    @NewPhone   = '0121-555-5555';", sqlite:'~No stored procedures: use a view for saved queries, and your application for the rest.'})}
${HD(['mysql','tsql'],'A procedure that returns rows')}
<p>A procedure can also run a <code>SELECT</code> and hand back its result, such as a customer's contact name:</p>
${C("DELIMITER //\n\nCREATE PROCEDURE GetCustomerContactName(\n    IN p_CustomerID CHAR(5)\n)\nBEGIN\n    SELECT ContactName\n    FROM Customers\n    WHERE CustomerID = p_CustomerID;\nEND //\n\nDELIMITER ;\n\nCALL GetCustomerContactName('ALFKI');", false, READ_ONLY('mysql','MySQL Workbench'))}
${C("CREATE PROCEDURE GetCustomerContactName\n    @CustomerID CHAR(5)\nAS\nBEGIN\n    SELECT ContactName\n    FROM Customers\n    WHERE CustomerID = @CustomerID;\nEND;\n\nEXEC GetCustomerContactName @CustomerID = 'ALFKI';", false, READ_ONLY('tsql','SQL Server Management Studio'))}
<h3>Views or stored procedures?</h3>
<p>Both save SQL in the database so it can be reused. The difference is what they can do:</p>
<table class="mini"><tr><th></th><th>View</th><th>Stored procedure</th></tr>
<tr><td>Holds</td><td>One <code>SELECT</code></td><td>Any statements: <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>, logic</td></tr>
<tr><td>Parameters</td><td>No: filter it with <code>WHERE</code> instead</td><td>Yes</td></tr>
<tr><td>Used by</td><td>Selecting from it, like a table</td><td><code>CALL</code> (MySQL) or <code>EXEC</code> (T-SQL)</td></tr>
<tr><td>Changes data</td><td>No</td><td>Can</td></tr>
<tr><td>In SQLite</td><td>Yes</td><td>No</td></tr></table>
<p>In SQLite, the nearest thing to <code>GetCustomerContactName</code> is a view that you filter. This one does run here:</p>
${C("DROP VIEW IF EXISTS vw_CustomerContacts;\n\nCREATE VIEW vw_CustomerContacts AS\nSELECT CustomerID, ContactName FROM Customers;\n\nSELECT ContactName\nFROM vw_CustomerContacts\nWHERE CustomerID = 'ALFKI';")}`,
    check:[
      {q:'How do you run a stored procedure called GetCustomerContactName in MySQL?', a:["CALL GetCustomerContactName('ALFKI');","EXEC GetCustomerContactName 'ALFKI';","SELECT * FROM GetCustomerContactName;"], c:0, why:'MySQL uses CALL. T-SQL uses EXEC. A procedure isn\'t a table, so you can\'t SELECT from it.'},
      {q:'What can a stored procedure do that a view can\'t?', a:['Return rows','Take parameters and change data','Be saved in the database'], c:1, why:'Both are saved in the database and both can return rows, but only a procedure takes parameters and can INSERT, UPDATE or DELETE.'},
      {q:'Why does MySQL need DELIMITER // before CREATE PROCEDURE?', a:['To name the procedure','To mark the start of a parameter','So the semicolons inside the procedure don\'t end the CREATE statement early'], c:2, why:'The procedure body contains semicolons. Changing the delimiter lets MySQL read the whole procedure as one statement.'}
    ]},

  /* ===== Unit 7: Advanced topics (from the Advanced SQL slides) ===== */
  windows:{title:'Window functions', summary:'Add a total, count or average to every row without losing any rows.', cmds:['OVER ()','PARTITION BY'],
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
${TIP('Window functions run last, after <code>WHERE</code>, <code>GROUP BY</code> and <code>HAVING</code>, just before <code>ORDER BY</code>.')}
${DIFF({title:'Window functions in each dialect', common:'COUNT(*) OVER (PARTITION BY EmployeeID)', otherTitle:'Versions that have them', sqlite:'~SQLite 3.25 (2018) and later. This lab has them.', mysql:'~MySQL 8.0 and later', tsql:'~SQL Server 2005 for the ranking functions; 2012 for LAG, LEAD and frames', note:'The <code>OVER (PARTITION BY …)</code> syntax is the same in all three.'})}`,
    ex:[
      {p:'Using an INNER JOIN (no window function), show OrderID, CustomerID, EmployeeID, the employee\'s total order count as Employee Order Count, and OrderDate.', hint:'Join Orders to a subquery that counts orders per EmployeeID.', sol:"SELECT o.OrderID, o.CustomerID, o.EmployeeID,\n       c.EOCount AS 'Employee Order Count', o.OrderDate\nFROM Orders o\nINNER JOIN (\n    SELECT EmployeeID, COUNT(*) AS EOCount\n    FROM Orders\n    GROUP BY EmployeeID\n) c ON o.EmployeeID = c.EmployeeID;"},
      {p:'Show each product\'s ProductID, ProductName, CategoryName, and how many other products are in the same category.', hint:'COUNT(*) OVER (PARTITION BY p.CategoryID) counts the product itself too, so subtract 1.', sol:"SELECT p.ProductID AS 'Product ID',\n       p.ProductName AS 'Product Name',\n       c.CategoryName AS 'Category Name',\n       COUNT(*) OVER (PARTITION BY p.CategoryID) - 1 AS 'Other Products in Category'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nORDER BY p.ProductID;"},
      {p:'Show each product\'s ProductID, ProductName, CategoryName and the total UnitsOnOrder for its whole category.', hint:'SUM(p.UnitsOnOrder) OVER (PARTITION BY p.CategoryID)', sol:"SELECT p.ProductID, p.ProductName, c.CategoryName,\n       SUM(p.UnitsOnOrder) OVER (PARTITION BY p.CategoryID) AS 'Total Category Units on Order'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nORDER BY p.ProductID;"},
      {p:'Show every order\'s OrderID and Freight next to the average freight across all orders.', hint:'AVG(Freight) OVER () - empty brackets mean the whole table.', sol:"SELECT OrderID, Freight, AVG(Freight) OVER () AS 'Average Freight'\nFROM Orders;"}
    ]},

  ranking:{title:'Ranking functions', summary:'Number and rank rows, overall or within each group.', cmds:['ROW_NUMBER()','RANK()','DENSE_RANK()'],
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
${C("SELECT ProductName, UnitPrice, CategoryID,\n       ROW_NUMBER() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS 'Row Number'\nFROM Products;")}
${SAME()}`,
    ex:[
      {p:'Show each order\'s OrderID, CustomerID and OrderDate, with its rank by order date for that customer (their first order is 1). Order the result by OrderID.', hint:'RANK() OVER (PARTITION BY CustomerID ORDER BY OrderDate)', ordered:[0], sol:"SELECT OrderID, CustomerID, OrderDate,\n       RANK() OVER (PARTITION BY CustomerID ORDER BY OrderDate) AS 'Order Date Rank per Customer'\nFROM Orders\nORDER BY OrderID;"},
      {p:'Rank products within each category from most to least expensive, so tied prices share a rank and no numbers are skipped. Show CategoryID, ProductName, UnitPrice and the rank.', hint:'DENSE_RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC)', sol:"SELECT CategoryID, ProductName, UnitPrice,\n       DENSE_RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS 'Price Rank'\nFROM Products;"},
      {p:'List the three most expensive products in each category (CategoryID, ProductName, UnitPrice). If prices tie for third place, include them all.', hint:'Rank inside a subquery, then filter on the rank in the outer query: a window function can\'t go in WHERE.', sol:"SELECT CategoryID, ProductName, UnitPrice\nFROM (\n    SELECT CategoryID, ProductName, UnitPrice,\n           RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS PriceRank\n    FROM Products\n) ranked\nWHERE PriceRank <= 3;"}
    ]},

  leadlag:{title:'Comparing rows', summary:'Look at the next, previous, first or last row in a window.', cmds:['LEAD()','LAG()','FIRST_VALUE()','LAST_VALUE()'],
    learn:`
<p><code>LEAD()</code> looks ahead a number of rows; <code>LAG()</code> looks back. Both take three arguments: the column to return, how many rows to move, and a default for when there's no row to return.</p>
${C("SELECT ProductName, UnitPrice,\n       LEAD(ProductName, 1, NULL) OVER (ORDER BY UnitPrice) AS 'Next Product by Price',\n       LAG(UnitPrice, 1, 0)       OVER (ORDER BY UnitPrice) AS 'Previous Price'\nFROM Products;")}
<p><code>FIRST_VALUE()</code> returns a column from the first row of each partition, in the window's order:</p>
${C("SELECT ProductName, SupplierID, UnitsOnOrder,\n       FIRST_VALUE(UnitsOnOrder) OVER (PARTITION BY SupplierID ORDER BY UnitsOnOrder DESC)\n           AS 'Most Units on Order from Supplier'\nFROM Products;")}
<p>You can use the result inside other functions. Here, how many days after the customer's first order each order was placed:</p>
${C("SELECT OrderID, CustomerID, OrderDate,\n       julianday(OrderDate) - julianday(FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate))\n           AS 'Days Since First Order'\nFROM Orders\nORDER BY OrderID;")}
<h3>Spot the problem</h3>
<p>Run this. You'd expect each row to show the employee's last order, but every row just shows its own OrderID:</p>
${C("SELECT OrderID, EmployeeID,\n       LAST_VALUE(OrderID) OVER (PARTITION BY EmployeeID ORDER BY OrderID) AS 'Last Order for Employee'\nFROM Orders;")}
${TIP('Window functions have a hidden <strong>window frame</strong>. With an <code>ORDER BY</code>, the default frame runs from the start of the partition to the <em>current row</em>, so <code>LAST_VALUE</code> only ever sees up to itself. The next lesson fixes it.')}
${SAME()}`,
    ex:[
      {p:'Show each order\'s OrderID, OrderDate and Freight, with the freight of the previous order (by OrderID). The first order has no previous one, so show NULL.', hint:'LAG(Freight, 1, NULL) OVER (ORDER BY OrderID)', sol:"SELECT OrderID, OrderDate, Freight,\n       LAG(Freight, 1, NULL) OVER (ORDER BY OrderID) AS 'Freight for Previous Order'\nFROM Orders;"},
      {p:'Show OrderID, CustomerID, EmployeeID, OrderDate and the number of days since that customer\'s first order. Order by OrderID.', hint:'julianday(OrderDate) - julianday(FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate))', ordered:[0], sol:"SELECT OrderID, CustomerID, EmployeeID, OrderDate,\n       julianday(OrderDate) - julianday(FIRST_VALUE(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate))\n           AS 'Days Since First Order'\nFROM Orders\nORDER BY OrderID;"},
      {p:'Show each product\'s ProductName, CategoryID and UnitPrice, with the name of the cheapest product in its category.', hint:'FIRST_VALUE(ProductName) OVER (PARTITION BY CategoryID ORDER BY UnitPrice)', sol:"SELECT ProductName, CategoryID, UnitPrice,\n       FIRST_VALUE(ProductName) OVER (PARTITION BY CategoryID ORDER BY UnitPrice) AS 'Cheapest in Category'\nFROM Products;"}
    ]},

  frames:{title:'Window frames', summary:'Control exactly which rows a window function looks at, for running totals and moving averages.', cmds:['ROWS BETWEEN','RANGE','PRECEDING','FOLLOWING'],
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
${HD(['sqlite','mysql'],'RANGE over dates')}
<p>To average over <em>days</em> rather than rows, so two orders on the same day both count, use <code>RANGE</code>. Order by the date as a day number with <code>julianday()</code>, then give the range in days. Look at 1996-07-08, which has two orders:</p>
${C("SELECT OrderID, OrderDate, Freight,\n       AVG(Freight) OVER (ORDER BY julianday(OrderDate)\n           RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS '3 day moving average'\nFROM Orders;")}
${DIFF({title:'Moving averages in each dialect', common:'AVG(Freight) OVER (ORDER BY OrderID\n    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)', otherTitle:'Averaging over days instead of rows', sqlite:'AVG(Freight) OVER (ORDER BY julianday(OrderDate)\n    RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING)', mysql:'AVG(Freight) OVER (ORDER BY OrderDate\n    RANGE BETWEEN INTERVAL 1 DAY PRECEDING\n              AND INTERVAL 1 DAY FOLLOWING)', tsql:'~RANGE only allows UNBOUNDED and CURRENT ROW, so use ROWS, or join the table to itself on a date range.'})}`,
    ex:[
      {p:'Fix the LAST_VALUE query: show each OrderID and EmployeeID with the last OrderID that employee handled.', hint:'Add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING inside OVER ( ).', sol:"SELECT OrderID, EmployeeID,\n       LAST_VALUE(OrderID) OVER (PARTITION BY EmployeeID ORDER BY OrderID\n           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS 'Last Order for Employee'\nFROM Orders;"},
      {p:'Total each order\'s price from `Order Details` (UnitPrice × Quantity × (1 − Discount)), join it to Orders, and show OrderID, OrderDate, the total price and a 5-point moving average of it, ordered by OrderDate then OrderID.', hint:'AVG(d.TotalPrice) OVER (ORDER BY o.OrderDate, o.OrderID ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING). The OrderID breaks ties between orders on the same day.', sol:"SELECT o.OrderID, o.OrderDate, d.TotalPrice,\n       AVG(d.TotalPrice) OVER (ORDER BY o.OrderDate, o.OrderID\n           ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING) AS '5pt Moving Average'\nFROM Orders o\nINNER JOIN (\n    SELECT OrderID, SUM(UnitPrice * Quantity * (1 - Discount)) AS TotalPrice\n    FROM \"Order Details\"\n    GROUP BY OrderID\n) d ON o.OrderID = d.OrderID;"},
      {p:'For orders shipped to Brazil, show OrderID, Freight and a running total of freight in OrderID order.', hint:'Filter with WHERE first: the window only sees the rows that are left.', sol:"SELECT OrderID, Freight,\n       SUM(Freight) OVER (ORDER BY OrderID ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 'Running Total'\nFROM Orders\nWHERE ShipCountry = 'Brazil';"}
    ]},

  stats:{title:'Statistical functions', summary:'Find where a row sits in a distribution, and split rows into bands.', cmds:['CUME_DIST()','PERCENT_RANK()','NTILE()'],
    learn:`
<p>Some window functions describe where a row sits in the whole distribution:</p>
<table class="mini"><tr><th>Function</th><th>Returns</th></tr>
<tr><td><code>CUME_DIST() OVER (ORDER BY x)</code></td><td>The fraction of rows with a value less than or equal to this one (0 to 1)</td></tr>
<tr><td><code>PERCENT_RANK() OVER (ORDER BY x)</code></td><td>The row's rank as a fraction: (rank − 1) ÷ (rows − 1), so the first row is 0 and the last is 1</td></tr>
<tr><td><code>NTILE(n) OVER (ORDER BY x)</code></td><td>Splits the rows into <em>n</em> roughly equal bands, numbered 1 to <em>n</em></td></tr></table>
${C("SELECT ProductName, UnitPrice,\n       CUME_DIST()    OVER (ORDER BY UnitPrice) AS 'Cume Dist',\n       PERCENT_RANK() OVER (ORDER BY UnitPrice) AS 'Percent Rank',\n       NTILE(4)       OVER (ORDER BY UnitPrice) AS 'Quartile'\nFROM Products;")}
${TIP('Look at how each one treats ties: tied prices get the same <code>CUME_DIST</code> and <code>PERCENT_RANK</code>, but <code>NTILE</code> can put them in different bands.')}
${HD('all','Finding the median')}
<p>Standard SQLite and MySQL have no median function (this site's SQLite happens to include <code>median()</code>, but don't rely on it elsewhere). <code>CUME_DIST</code> works in all three and gets you there: the median is the smallest value whose <code>CUME_DIST</code> reaches 0.5.</p>
${C("SELECT MIN(UnitPrice) AS 'Median (existing value)'\nFROM (SELECT UnitPrice, CUME_DIST() OVER (ORDER BY UnitPrice) AS cd FROM Products) t\nWHERE cd >= 0.5;")}
${DIFF({title:'Distributions in each dialect', common:'CUME_DIST()   PERCENT_RANK()   NTILE(4)', otherTitle:'Percentiles', sqlite:'~Not built into standard SQLite: use CUME_DIST(), as above', mysql:'~None: use CUME_DIST()', tsql:'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY UnitPrice) OVER ()\nPERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY UnitPrice) OVER ()', note:'<code>PERCENTILE_CONT</code> works out a value in between if it has to; <code>PERCENTILE_DISC</code> always returns a value that exists in the data.'})}`,
    ex:[
      {p:'Show each product\'s ProductName, UnitPrice and its PERCENT_RANK by price (cheapest is 0).', hint:'PERCENT_RANK() OVER (ORDER BY UnitPrice)', sol:"SELECT ProductName, UnitPrice,\n       PERCENT_RANK() OVER (ORDER BY UnitPrice) AS 'Percent Rank'\nFROM Products;"},
      {p:'Split products into 4 price bands with NTILE, cheapest first. Show ProductID, ProductName, UnitPrice and the band. Use ProductID to break ties.', hint:'NTILE(4) OVER (ORDER BY UnitPrice, ProductID)', sol:"SELECT ProductID, ProductName, UnitPrice,\n       NTILE(4) OVER (ORDER BY UnitPrice, ProductID) AS 'Price Band'\nFROM Products;"},
      {p:'Which orders are in the cheapest 10% by freight? Show OrderID and Freight for orders whose CUME_DIST by freight is 0.1 or less.', hint:'Work out CUME_DIST in a subquery, then filter it in the outer WHERE.', sol:"SELECT OrderID, Freight\nFROM (\n    SELECT OrderID, Freight, CUME_DIST() OVER (ORDER BY Freight) AS cd\n    FROM Orders\n) t\nWHERE cd <= 0.1;"}
    ]},

  cte:{title:'Common table expressions', summary:'Name a subquery once at the top, then use it like a table.', cmds:['WITH … AS'],
    learn:`
<p><code>WITH</code> defines one or more named subqueries before the main query. They're usually called <strong>common table expressions</strong> (CTEs). They:</p>
<ul class="plain"><li>make long queries easier to read</li><li>let you define a subquery once and use it several times</li><li>disappear when the query finishes</li></ul>
<p>Here's a join to a subquery, then the same query with <code>WITH</code>:</p>
${C("SELECT ProductName\nFROM Products p\nINNER JOIN (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n) m ON p.CategoryID = m.CategoryID;")}
${C("WITH MeanAbove30 AS (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n)\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;")}
<p>Chain several with commas. Each one can use the ones before it:</p>
${C("WITH spend AS (\n    SELECT o.CustomerID, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Total\n    FROM Orders o INNER JOIN \"Order Details\" od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n),\naverage AS (\n    SELECT AVG(Total) AS AvgTotal FROM spend\n)\nSELECT s.CustomerID, s.Total\nFROM spend s, average a\nWHERE s.Total > a.AvgTotal\nORDER BY s.Total DESC;")}
${TIP('A CTE is a great place for a window function you want to filter on: rank in the CTE, then use <code>WHERE</code> in the main query.')}
${DIFF({title:'WITH in each dialect', common:'WITH name AS (…)', otherTitle:'Recursive CTEs', sqlite:'WITH RECURSIVE name AS (…)', mysql:'WITH RECURSIVE name AS (…)', tsql:'WITH name AS (…)   -- no RECURSIVE keyword', note:'Ordinary CTEs are the same in all three (MySQL 8.0 and later). Recursive ones, which refer to themselves (for example to walk a manager hierarchy), are beyond this course, but now you\'ll recognise them.'})}`,
    ex:[
      {p:'Using WITH, list the ProductName of every product in a category whose average unit price is above 30.', hint:'WITH MeanAbove30 AS (SELECT CategoryID FROM Products GROUP BY CategoryID HAVING AVG(UnitPrice) > 30) …', sol:"WITH MeanAbove30 AS (\n    SELECT CategoryID FROM Products\n    GROUP BY CategoryID HAVING AVG(UnitPrice) > 30\n)\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;"},
      {p:'Using WITH, show the first and last name and order count of every employee who has handled more than 100 orders.', hint:'Count orders per EmployeeID in the CTE, then join it to Employees.', sol:"WITH counts AS (\n    SELECT EmployeeID, COUNT(*) AS OrderCount\n    FROM Orders\n    GROUP BY EmployeeID\n)\nSELECT e.FirstName, e.LastName, c.OrderCount\nFROM Employees e\nINNER JOIN counts c ON c.EmployeeID = e.EmployeeID\nWHERE c.OrderCount > 100;"},
      {p:'Using two chained CTEs, list each CustomerID whose total spend is above the average customer\'s total spend, with their total.', hint:'The first CTE totals spend per customer; the second averages the first.', sol:"WITH spend AS (\n    SELECT o.CustomerID, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Total\n    FROM Orders o INNER JOIN \"Order Details\" od ON o.OrderID = od.OrderID\n    GROUP BY o.CustomerID\n),\naverage AS (\n    SELECT AVG(Total) AS AvgTotal FROM spend\n)\nSELECT s.CustomerID, s.Total\nFROM spend s, average a\nWHERE s.Total > a.AvgTotal;"}
    ]},

  temptables:{title:'Temporary tables', summary:'Store a result to use in later queries.', cmds:['CREATE TEMP TABLE','DROP TABLE IF EXISTS'],
    learn:`
<p>A CTE vanishes when its query ends. If you want to keep a result for <em>several</em> queries, store it in a temporary table. Only your connection can see it, and it's dropped automatically when you disconnect. In this lab, that's when you reload the page.</p>
${HD(['sqlite','mysql'],'CREATE TEMPORARY TABLE')}
<p>SQLite and MySQL both have <code>CREATE TEMPORARY TABLE</code>; SQL Server names temporary tables with a <code>#</code> instead (see the notes below). Create one from a query with <code>CREATE TEMP TABLE … AS SELECT</code> (<code>TEMP</code> is SQLite's short form). The first statement stores the table, the second uses it:</p>
${C("DROP TABLE IF EXISTS MeanAbove30;\n\nCREATE TEMP TABLE MeanAbove30 AS\nSELECT CategoryID\nFROM Products\nGROUP BY CategoryID HAVING AVG(UnitPrice) > 30;\n\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;")}
<p>Now it exists, you can query it on its own:</p>
${C("SELECT * FROM MeanAbove30;")}
<p><code>TEMPORARY</code> means the same as <code>TEMP</code>:</p>
${C("DROP TABLE IF EXISTS OrderCounts;\n\nCREATE TEMPORARY TABLE OrderCounts AS\nSELECT CustomerID, COUNT(*) AS Orders\nFROM Orders GROUP BY CustomerID;\n\nSELECT * FROM OrderCounts ORDER BY Orders DESC;")}
${DIFF({title:'Temporary tables in each dialect', sqlite:'CREATE TEMP TABLE MeanAbove30 AS\nSELECT CategoryID FROM Products …;', mysql:'CREATE TEMPORARY TABLE MeanAbove30 AS\nSELECT CategoryID FROM Products …;', tsql:'SELECT CategoryID INTO #MeanAbove30\nFROM Products …;', note:'In T-SQL the name starts with <code>#</code> (<code>##</code> makes it visible to every connection), and the table lives in <code>tempdb</code>.'})}
${TIP('Creating a temporary table that already exists gives an error, so start with <code>DROP TABLE IF EXISTS</code>.')}`,
    ex:[
      {p:'Store the CategoryIDs whose average unit price is above 30 in a temporary table called MeanAbove30, then use it to list the matching ProductNames.', hint:'CREATE TEMP TABLE MeanAbove30 AS SELECT … then join Products to MeanAbove30. Start with DROP TABLE IF EXISTS MeanAbove30.', sol:"DROP TABLE IF EXISTS MeanAbove30;\nCREATE TEMP TABLE MeanAbove30 AS\nSELECT CategoryID\nFROM Products\nGROUP BY CategoryID HAVING AVG(UnitPrice) > 30;\nSELECT ProductName\nFROM Products p\nINNER JOIN MeanAbove30 m ON p.CategoryID = m.CategoryID;"},
      {p:'Store each CustomerID with its number of orders in a temporary table called OrderCounts. Then list the customers with more than 20 orders.', hint:'CREATE TEMP TABLE OrderCounts AS SELECT CustomerID, COUNT(*) AS Orders FROM Orders GROUP BY CustomerID;', sol:"DROP TABLE IF EXISTS OrderCounts;\nCREATE TEMP TABLE OrderCounts AS\nSELECT CustomerID, COUNT(*) AS Orders\nFROM Orders GROUP BY CustomerID;\nSELECT CustomerID, Orders FROM OrderCounts WHERE Orders > 20;"}
    ]},

  pivot:{title:'Pivoting', summary:'Turn rows into columns, and columns back into rows.', cmds:['SUM(CASE …)','GROUP BY','UNION ALL'],
    learn:`
<p>To <strong>pivot</strong> is to move data from rows into columns: from <em>long</em> format to <em>wide</em>. <strong>Unpivoting</strong> goes the other way. Which you want depends on what the data is for.</p>
<div class="two-tables"><table class="mini"><tr><th>Student</th><th>Subject</th><th>Score</th></tr><tr><td>Alice</td><td>English</td><td>60</td></tr><tr><td>Alice</td><td>Maths</td><td>70</td></tr><tr><td>Bob</td><td>English</td><td>72</td></tr><tr><td>Bob</td><td>Maths</td><td>83</td></tr></table>
<table class="mini"><tr><th>Student</th><th>English</th><th>Maths</th></tr><tr><td>Alice</td><td>60</td><td>70</td></tr><tr><td>Bob</td><td>72</td><td>83</td></tr></table></div>
<h3>Pivoting with CASE</h3>
<p>Pivot with an aggregate around a <code>CASE</code>, one per new column, and <code>GROUP BY</code> the rows you want to keep:</p>
${C("WITH scores AS (\n    SELECT 'Alice' AS Student, 'English' AS Subject, 60 AS Score UNION ALL\n    SELECT 'Alice', 'Maths', 70 UNION ALL\n    SELECT 'Bob',   'English', 72 UNION ALL\n    SELECT 'Bob',   'Maths', 83\n)\nSELECT Student,\n       MAX(CASE WHEN Subject = 'English' THEN Score END) AS English,\n       MAX(CASE WHEN Subject = 'Maths'   THEN Score END) AS Maths\nFROM scores\nGROUP BY Student;")}
<p>Unpivot with one <code>SELECT</code> per column, stacked with <code>UNION ALL</code>:</p>
${C("SELECT CompanyName, 'Phone' AS ContactType, Phone AS ContactNumber FROM Customers\nUNION ALL\nSELECT CompanyName, 'Fax', Fax FROM Customers\nORDER BY CompanyName;")}
${DIFF({title:'Pivoting in each dialect', common:"MAX(CASE WHEN Subject = 'English' THEN Score END) AS English\n… GROUP BY Student", otherTitle:'A PIVOT operator', sqlite:'~None', mysql:'~None', tsql:'SELECT Student, English, Maths\nFROM scores\nPIVOT (MAX(Score) FOR Subject IN (English, Maths)) p;', note:'T-SQL also has <code>UNPIVOT</code>. The <code>CASE</code> and <code>UNION ALL</code> approach works in T-SQL too, so it\'s worth knowing whichever database you use.'})}`,
    ex:[
      {p:'Unpivot the order dates: for every order show OrderID, a DateType (OrderDate, RequiredDate or ShippedDate) and the Date.', hint:'Three SELECTs, one per date column, joined with UNION ALL.', sol:"SELECT OrderID, 'OrderDate' AS DateType, OrderDate AS Date FROM Orders\nUNION ALL\nSELECT OrderID, 'RequiredDate', RequiredDate FROM Orders\nUNION ALL\nSELECT OrderID, 'ShippedDate', ShippedDate FROM Orders;"},
      {p:'Pivot the number of orders each shipper (ShipVia) carried into one column per year: ShipVia, 1996, 1997 and 1998.', hint:"SUM(CASE WHEN strftime('%Y', OrderDate) = '1996' THEN 1 ELSE 0 END) AS '1996', and so on, grouped by ShipVia.", sol:"SELECT ShipVia,\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1996' THEN 1 ELSE 0 END) AS '1996',\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1997' THEN 1 ELSE 0 END) AS '1997',\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1998' THEN 1 ELSE 0 END) AS '1998'\nFROM Orders\nGROUP BY ShipVia;"},
      {p:'For each CategoryName, show how many products are active and how many are discontinued, as two columns.', hint:'Join Products to Categories, group by CategoryName, and use SUM(CASE WHEN Discontinued = … THEN 1 ELSE 0 END) twice.', sol:"SELECT c.CategoryName,\n       SUM(CASE WHEN p.Discontinued = 0 THEN 1 ELSE 0 END) AS 'Active',\n       SUM(CASE WHEN p.Discontinued = 1 THEN 1 ELSE 0 END) AS 'Discontinued'\nFROM Products p\nINNER JOIN Categories c ON p.CategoryID = c.CategoryID\nGROUP BY c.CategoryName;"}
    ]},

  performance:{title:'Performance tuning', summary:'Find out why a query is slow by reading its query plan, and fix it.', cmds:['EXPLAIN QUERY PLAN','CREATE INDEX','PRAGMA index_list'],
    learn:`
<p>Tuning is less about tricks and more about a process. Like diagnosing a slow car, you find the cause before swapping parts:</p>
<ol class="order"><li>Identify the slow queries</li><li>Understand what the database is doing</li><li>Fix the root cause, often with an index</li><li>Check it's actually faster</li></ol>
<p>You met indexes in <a href="#/lesson/indexes">Indexes</a> (Unit 6). This lesson is about step 2: reading what the database is doing, so you know which index will help.</p>
${HD(['sqlite'],'Reading a query plan')}
<p>Put <code>EXPLAIN QUERY PLAN</code> in front of a query to see how SQLite will find the rows, without running it:</p>
<table class="mini"><tr><th>The plan says</th><th>Meaning</th><th>Good?</th></tr>
<tr><td><code>SCAN Orders</code></td><td>Reads every row of the table</td><td>Fine for small tables; bad for big ones</td></tr>
<tr><td><code>SCAN Orders USING INDEX …</code></td><td>Reads the whole index in order</td><td>Better, but still reads everything</td></tr>
<tr><td><code>SEARCH Orders USING INDEX …</code></td><td>Jumps straight to the matching rows</td><td>What you want</td></tr>
<tr><td><code>… USING COVERING INDEX …</code></td><td>Everything needed is in the index</td><td>Even better</td></tr>
<tr><td><code>USE TEMP B-TREE FOR ORDER BY</code></td><td>Has to sort the rows itself</td><td>A warning sign on big tables</td></tr>
<tr><td><code>USE TEMP B-TREE FOR GROUP BY</code></td><td>Has to build a temporary structure to group</td><td>A warning sign on big tables</td></tr></table>
${C("EXPLAIN QUERY PLAN SELECT * FROM Customers WHERE City = 'London';")}
<p>It scans the whole table. Add an index on <code>City</code>, then look at the plan again:</p>
${C("CREATE INDEX IF NOT EXISTS idx_customer_city ON Customers(City);\n\nEXPLAIN QUERY PLAN SELECT * FROM Customers WHERE City = 'London';")}
${HD(['sqlite'],'Covering indexes in a SQLite plan')}
<p>If an index holds every column a query needs, SQLite never has to visit the table at all. Ask for just the indexed column and the plan changes to a <strong>covering index</strong>:</p>
${C("CREATE INDEX IF NOT EXISTS idx_customer_city ON Customers(City);\n\nEXPLAIN QUERY PLAN SELECT City FROM Customers WHERE City = 'London';")}
${HD(['sqlite'],'Sorting and grouping in a SQLite plan')}
<p>Sorting or grouping by a column with no index makes the database build a temporary structure first. Watch for <code>USE TEMP B-TREE</code>:</p>
${C("EXPLAIN QUERY PLAN\nSELECT CategoryID, AVG(UnitPrice)\nFROM Products\nGROUP BY CategoryID\nORDER BY AVG(UnitPrice);")}
<p>List the indexes on a table with <code>PRAGMA index_list</code>, or every index in the database from <code>sqlite_master</code>:</p>
${C("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index';")}
${TIP('Indexes you create in this lesson last until you reload the page.')}
${DIFF({title:'Indexes and query plans in each dialect', common:'CREATE INDEX idx_customer_city ON Customers(City);', otherTitle:'Seeing the plan and the indexes', sqlite:"EXPLAIN QUERY PLAN SELECT …;\nPRAGMA index_list('Customers');", mysql:'EXPLAIN SELECT …;\nSHOW INDEX FROM Customers;', tsql:"-- Turn on the execution plan in SSMS, then run the query\nEXEC sp_helpindex 'Customers';", note:'In MySQL\'s <code>EXPLAIN</code>, <code>type = ALL</code> is a full table scan (SQLite\'s <code>SCAN</code>), and <code>ref</code> or <code>range</code> is an index seek (SQLite\'s <code>SEARCH</code>).'})}
${TIP('Indexes you create here last until you reload the page. Names starting <code>sqlite_autoindex</code> are created automatically for primary keys and <code>UNIQUE</code> columns.')}`,
    ex:[
      {p:'Use EXPLAIN QUERY PLAN to see how SQLite finds the orders for customer ALFKI (SELECT * FROM Orders WHERE CustomerID = \'ALFKI\'). If you haven\'t created an index yet, it should scan the whole table.', hint:"EXPLAIN QUERY PLAN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';", sol:"EXPLAIN QUERY PLAN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';"},
      {p:'Create an index called idx_orders_customerid on Orders(CustomerID), then check the same query uses it by showing its plan.', hint:'CREATE INDEX IF NOT EXISTS idx_orders_customerid ON Orders(CustomerID); then the EXPLAIN QUERY PLAN. It should say SEARCH … USING INDEX.', sol:"CREATE INDEX IF NOT EXISTS idx_orders_customerid ON Orders(CustomerID);\nEXPLAIN QUERY PLAN SELECT * FROM Orders WHERE CustomerID = 'ALFKI';"},
      {p:'List the indexes on the "Order Details" table.', hint:"PRAGMA index_list('Order Details');", sol:"PRAGMA index_list('Order Details');"}
    ]},

  cp5:{title:'Checkpoint: advanced topics', summary:'Mixed practice on window functions, CTEs and pivots.', cmds:[], checkpoint:true,
    ex:[
      {p:'For each category, show the CategoryName and the name and price of its most expensive product.', hint:'Rank products by price within each category in a CTE, then keep rank 1 and join to Categories.', sol:"WITH ranked AS (\n    SELECT CategoryID, ProductName, UnitPrice,\n           RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS r\n    FROM Products\n)\nSELECT c.CategoryName, ranked.ProductName, ranked.UnitPrice\nFROM ranked\nINNER JOIN Categories c ON c.CategoryID = ranked.CategoryID\nWHERE r = 1;"},
      {p:'For 1997, show each EmployeeID, month (01 to 12) and number of orders, with the change from that employee\'s previous month.', hint:"Count orders per employee per strftime('%m', OrderDate) in a CTE, then use LAG(Orders) OVER (PARTITION BY EmployeeID ORDER BY Month).", sol:"WITH monthly AS (\n    SELECT EmployeeID, strftime('%m', OrderDate) AS Month, COUNT(*) AS Orders\n    FROM Orders\n    WHERE strftime('%Y', OrderDate) = '1997'\n    GROUP BY EmployeeID, strftime('%m', OrderDate)\n)\nSELECT EmployeeID, Month, Orders,\n       Orders - LAG(Orders) OVER (PARTITION BY EmployeeID ORDER BY Month) AS 'Change'\nFROM monthly;"},
      {p:'Pivot each employee\'s total freight into one column per year: EmployeeID, 1996, 1997 and 1998.', hint:"SUM(CASE WHEN strftime('%Y', OrderDate) = '1996' THEN Freight ELSE 0 END) AS '1996', and so on.", sol:"SELECT EmployeeID,\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1996' THEN Freight ELSE 0 END) AS '1996',\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1997' THEN Freight ELSE 0 END) AS '1997',\n       SUM(CASE WHEN strftime('%Y', OrderDate) = '1998' THEN Freight ELSE 0 END) AS '1998'\nFROM Orders\nGROUP BY EmployeeID;"}
    ]}
};
const PATH = UNITS.flatMap(u=>u.lessons.map(id=>({id, unit:u})));
