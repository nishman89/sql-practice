/* ---------- Pure helpers (no DOM: also loaded by scripts/check.mjs) ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function b64ToBytes(b64){ const bin=atob(b64); const u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; }
function bytesToB64(u){ let s=''; const CH=0x8000; for (let i=0;i<u.length;i+=CH) s+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); return btoa(s); }
/* The lab is plain SQLite: no extra functions are added. Foreign keys are switched on (SQLite leaves them off by default). */
function addFns(db){ db.run('PRAGMA foreign_keys = ON;'); }

/* ---------- SQL text utilities ---------- */
function stripComments(s){
  let out='', i=0; const n=s.length;
  while (i<n){
    const c=s[i];
    if (c==='-'&&s[i+1]==='-'){ while(i<n&&s[i]!=='\n') i++; continue; }
    if (c==='/'&&s[i+1]==='*'){ const j=s.indexOf('*/',i+2); i = j<0?n:j+2; out+=' '; continue; }
    if (c==="'"||c==='"'||c==='`'){ let j=i+1; while(j<n){ if(s[j]===c){ if(s[j+1]===c){j+=2;continue;} break;} j++; } out+=s.slice(i,j+1); i=j+1; continue; }
    if (c==='['){ const j=s.indexOf(']',i); const e=j<0?n:j+1; out+=s.slice(i,e); i=e; continue; }
    out+=c; i++;
  }
  return out;
}
function splitStatements(src){
  const s=stripComments(src); const out=[]; let cur='', i=0; const n=s.length;
  while (i<n){
    const c=s[i];
    if (c==="'"||c==='"'||c==='`'){ let j=i+1; while(j<n){ if(s[j]===c){ if(s[j+1]===c){j+=2;continue;} break;} j++; } cur+=s.slice(i,j+1); i=j+1; continue; }
    if (c==='['){ const j=s.indexOf(']',i); const e=j<0?n:j+1; cur+=s.slice(i,e); i=e; continue; }
    if (c===';'){ if(cur.trim()) out.push(cur.trim()); cur=''; i++; continue; }
    cur+=c; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function splitTopLevel(s){
  const parts=[]; let depth=0, cur='', i=0;
  while (i<s.length){
    const c=s[i];
    if (c==="'"||c==='"'||c==='`'){ let j=i+1; while(j<s.length){ if(s[j]===c){ if(s[j+1]===c){j+=2;continue;} break;} j++; } cur+=s.slice(i,j+1); i=j+1; continue; }
    if (c==='(') depth++; if (c===')') depth--;
    if (c===','&&depth===0){ parts.push(cur.trim()); cur=''; i++; continue; }
    cur+=c; i++;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
const unq = s => s.replace(/^[`"\[]|[`"\]]$/g,'');

class LabError extends Error { constructor(msg, hint){ super(msg); this.hint=hint; } }

/* Blank out quoted text so checks below don't trigger on values like 'TOP' or 'Apt #2' */
function outsideStrings(s, fn){
  let out='', buf='', i=0;
  while (i<s.length){
    const c=s[i];
    if (c==="'"||c==='"'){ out+=fn(buf); buf=''; let j=i+1; while(j<s.length){ if(s[j]===c){ if(s[j+1]===c){j+=2;continue;} break;} j++; } out+=s.slice(i,j+1); i=j+1; continue; }
    buf+=c; i++;
  }
  return out+fn(buf);
}
const codeOnly = s => outsideStrings(s, x=>x).replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"/g, "''");

/* Syntax from other dialects that SQLite doesn't have: [pattern, message, the SQLite way] */
const OTHER_DIALECTS = [
  [/^\s*SELECT\s+(DISTINCT\s+)?TOP\b/i, 'TOP is T-SQL, not SQLite.', 'Put LIMIT at the end instead: SELECT … ORDER BY … LIMIT 10;'],
  [/\bAUTO_INCREMENT\b/i, 'AUTO_INCREMENT is MySQL, not SQLite.', 'In SQLite write the column as: id INTEGER PRIMARY KEY AUTOINCREMENT'],
  [/\bIDENTITY\s*\(/i, 'IDENTITY is T-SQL, not SQLite.', 'In SQLite write the column as: id INTEGER PRIMARY KEY AUTOINCREMENT'],
  [/^\s*(CREATE|DROP)\s+(DATABASE|SCHEMA)\b/i, 'SQLite has no CREATE DATABASE or DROP DATABASE.', 'A SQLite database is a single file, and you\'re already connected to it. Just create or drop tables.'],
  [/^\s*USE\s+\S+\s*$/i, 'SQLite has no USE statement.', 'You\'re already connected to the database. Start with CREATE TABLE or SELECT.'],
  [/^\s*SHOW\s+TABLES\b/i, 'SHOW TABLES is MySQL, not SQLite.', "In SQLite: SELECT name FROM sqlite_master WHERE type = 'table';"],
  [/^\s*SHOW\s+(INDEX|INDEXES|KEYS)\b/i, 'SHOW INDEX is MySQL, not SQLite.', "In SQLite: PRAGMA index_list('Customers');"],
  [/^\s*(DESCRIBE|DESC)\s+\S/i, 'DESCRIBE is MySQL, not SQLite.', "In SQLite: PRAGMA table_info('Products');"],
  [/(^|[\s,(])#{1,2}[A-Za-z_]/, '#name temporary tables are T-SQL, not SQLite.', 'In SQLite: CREATE TEMP TABLE name AS SELECT …; then use it by name.'],
  [/^\s*SELECT\b[\s\S]*?\bINTO\s+[A-Za-z_]\w*\s+FROM\b/i, 'SELECT … INTO is T-SQL, not SQLite.', 'In SQLite: CREATE TABLE name AS SELECT … (or CREATE TEMP TABLE for a temporary one).'],
  [/^\s*CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\b|^\s*DELIMITER\b|^\s*(CALL|EXEC|EXECUTE)\b/i, 'SQLite has no stored procedures.', 'Save a query you reuse as a view instead: CREATE VIEW name AS SELECT …'],
  [/\bPIVOT\s*\(|\bUNPIVOT\s*\(/i, 'PIVOT and UNPIVOT are T-SQL, not SQLite.', 'Pivot with SUM(CASE WHEN … THEN … END) and GROUP BY; unpivot with UNION ALL. The Pivoting lesson shows both.'],
  [/\bWITHIN\s+GROUP\b/i, 'PERCENTILE_CONT and PERCENTILE_DISC are T-SQL, not SQLite.', 'Use CUME_DIST(), PERCENT_RANK() or NTILE() instead.'],
  [/\bRANGE\s+BETWEEN\s+INTERVAL\b/i, 'RANGE … INTERVAL is MySQL, not SQLite.', 'Order the window by julianday(OrderDate) and use numbers of days: RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING.'],
  [/\b(LEFT|RIGHT)\s*\(/i, 'SQLite has no LEFT() or RIGHT() function.', 'Use substr(s, 1, 3) for the first 3 characters and substr(s, -3) for the last 3.'],
  [/\bISNULL\s*\(/i, 'ISNULL() is T-SQL, not SQLite.', 'Use IFNULL(x, y) or COALESCE(x, y).'],
  [/''\s*\+(?!\s*\d)|[\w)\]]\s*\+\s*''/, 'In SQLite, + adds numbers: it doesn\'t join text (T-SQL uses + for that).', "Join text with || or CONCAT(): FirstName || ' ' || LastName"],
  [/\bLIKE\s+'[^']*\[[^']*\]/i, 'LIKE with [ ] character sets is T-SQL. In SQLite the brackets are matched literally.', "Use GLOB, which understands sets: CategoryName GLOB '[BS]*'", 'raw'],
  [/\bFORMAT\s*\([^)]*'[^']*(dd|MM|yyyy|C')/, 'FORMAT() with a date or currency pattern is T-SQL.', "In SQLite, format dates with strftime('%d/%m/%Y', OrderDate), and numbers with printf('%.2f', amount).", 'raw'],
  [/\bINTERVAL\s+-?\d+\s+(DAY|MONTH|YEAR|WEEK)S?\b/i, 'INTERVAL is MySQL, not SQLite.', "In SQLite, add to a date with date(OrderDate, '+5 days')."],
  [/^\s*ALTER\s+TABLE\s+\S+\s+ADD\s+(CONSTRAINT|FOREIGN\s+KEY|PRIMARY\s+KEY|UNIQUE|INDEX|KEY|CHECK)\b/i, 'SQLite can\'t add a key or constraint to an existing table.', 'Update your CREATE TABLE script and run it again: DROP TABLE, then CREATE TABLE with the constraint included.']
];
/* Functions from other dialects, with their SQLite equivalent (used when SQLite says "no such function") */
const FN_HINTS = {
  YEAR:"strftime('%Y', OrderDate) gives the year as text, such as '1997'.",
  MONTH:"strftime('%m', OrderDate) gives the month as text, '01' to '12'.",
  DAY:"strftime('%d', OrderDate) gives the day of the month as text.",
  NOW:"datetime('now') gives the current date and time; date('now') gives today's date.",
  GETDATE:"datetime('now') gives the current date and time; date('now') gives today's date.",
  CURDATE:"date('now') gives today's date.",
  SYSDATETIME:"datetime('now') gives the current date and time.",
  DATEDIFF:'julianday(end) - julianday(start) gives the number of days between two dates.',
  TIMESTAMPDIFF:'julianday(end) - julianday(start) gives the number of days between two dates.',
  DATE_ADD:"date(OrderDate, '+5 days') adds to a date ('+1 month', '-2 years' also work).",
  DATEADD:"date(OrderDate, '+5 days') adds to a date ('+1 month', '-2 years' also work).",
  DATE_SUB:"date(OrderDate, '-5 days') subtracts from a date.",
  DATE_FORMAT:"strftime('%d/%m/%Y', OrderDate) formats a date.",
  LEN:'length(s) gives the number of characters.',
  LOCATE:"instr(s, ' ') gives the position of ' ' in s. Note the order: the text first, then what to find.",
  CHARINDEX:"instr(s, ' ') gives the position of ' ' in s. Note the order: the text first, then what to find.",
  REGEXP:"SQLite has no regular expressions built in. Use GLOB, which understands character sets: CategoryName GLOB '[BS]*'.",
  GETUTCDATE:"datetime('now') gives the current UTC date and time.",
  CURTIME:"time('now') gives the current time.",
  CEILING:'SQLite calls it CEIL(): CEIL(18.2) gives 19.'
};

function transform(stmt, mode, notes){
  const s=stmt.trim(), code=codeOnly(s);
  for (const [re, msg, hint, raw] of OTHER_DIALECTS) if (re.test(raw ? s : code)) throw new LabError(msg, hint);
  if (/^\s*ALTER\s+TABLE\s+\S+\s+ADD\s+/i.test(code) && splitTopLevel(code.replace(/^\s*ALTER\s+TABLE\s+\S+\s+ADD\s+(COLUMN\s+)?/i,'')).length>1)
    throw new LabError('SQLite adds one column per ALTER TABLE statement.', 'Write one statement per column: ALTER TABLE Customers ADD COLUMN email TEXT; ALTER TABLE Customers ADD COLUMN age INTEGER;');
  if (/^\s*EXPLAIN\s+(?!QUERY\s+PLAN\b)/i.test(code)) notes.push('Plain EXPLAIN shows SQLite\'s internal steps. EXPLAIN QUERY PLAN shows how it finds the rows, which is usually what you want.');
  return [{sql:s}];
}

function describeStmt(sql, changes){
  const nm = x => unq((x||'').trim());
  let m;
  if ((m=sql.match(/^CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[][^`"\]]+[`"\]]|\S+)/i))) return `Created ${/^CREATE\s+TEMP/i.test(sql)?'temporary ':''}table ${nm(m[1])}`;
  if ((m=sql.match(/^CREATE\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i))) return `Created view ${nm(m[1])}`;
  if ((m=sql.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i))) return `Created index ${nm(m[1])} (if it didn't already exist)`;
  if ((m=sql.match(/^DROP\s+(TABLE|VIEW|INDEX)\s+(?:IF\s+EXISTS\s+)?([`"\[][^`"\]]+[`"\]]|\S+)/i))) return `Dropped ${m[1].toLowerCase()} ${nm(m[2])} (if it existed)`;
  if ((m=sql.match(/^INSERT\s+INTO\s+([`"\[][^`"\]]+[`"\]]|\S+)/i))) return `Inserted ${changes} row${changes===1?'':'s'} into ${nm(m[1]).replace(/\(.*/,'')}`;
  if ((m=sql.match(/^UPDATE\s+(\S+)/i))) return `Updated ${changes} row${changes===1?'':'s'} in ${nm(m[1])}`;
  if ((m=sql.match(/^DELETE\s+FROM\s+(\S+)/i))) return `Deleted ${changes} row${changes===1?'':'s'} from ${nm(m[1])}`;
  if ((m=sql.match(/^ALTER\s+TABLE\s+([`"\[][^`"\]]+[`"\]]|\S+)\s+ADD\s+COLUMN\s+(\S+)/i))) return `Added column ${nm(m[2])} to ${nm(m[1])}`;
  if ((m=sql.match(/^ALTER\s+TABLE\s+(\S+)/i))) return `Altered table ${nm(m[1])}`;
  if ((m=sql.match(/^SAVEPOINT\s+(\S+)/i))) return `Savepoint ${nm(m[1])} set`;
  if ((m=sql.match(/^ROLLBACK\s+(?:TRANSACTION\s+)?TO\s+(?:SAVEPOINT\s+)?(\S+)/i))) return `Rolled back to ${nm(m[1])}: the changes since then are undone`;
  if ((m=sql.match(/^RELEASE\s+(?:SAVEPOINT\s+)?(\S+)/i))) return `Savepoint ${nm(m[1])} released`;
  return 'Statement ran';
}

function friendlyError(msg, mode){
  const tables = mode==='nw' ? 'Customers, Orders, "Order Details", Products, Categories, Suppliers, Employees, Shippers' : null;
  if (/no such table: (.+)/i.test(msg)){ const t=msg.match(/no such table: (.+)/i)[1];
    if (/order details/i.test(t)||/^order$/i.test(t)) return 'Table names with spaces need double quotes: "Order Details".';
    return tables ? `There's no table called ${t}. Northwind's tables are ${tables}.` : `There's no table called ${t} yet. Check the spelling, or create it first.`; }
  if (/no such column: (.+)/i.test(msg)){ const c=msg.match(/no such column: (.+)/i)[1];
    return `There's no column called ${c} in the tables you're selecting from. Check the spelling and the table in FROM. Text values need single quotes ('London'), otherwise SQL reads them as column names.`; }
  if (/ambiguous column name: (.+)/i.test(msg)) return `More than one table in your query has a column called ${msg.match(/ambiguous column name: (.+)/i)[1]}. Prefix it with the table name or alias, for example o.CustomerID.`;
  if (/FOREIGN KEY constraint failed/i.test(msg)) return 'The foreign key blocked this change. You referred to a row in the parent table that doesn\'t exist, or tried to delete a row that other rows still point to.';
  if (/UNIQUE constraint failed/i.test(msg)) return 'That primary key value already exists. Each row needs a unique key.';
  if (/NOT NULL constraint failed: (.+)/i.test(msg)) return `${msg.match(/NOT NULL constraint failed: (.+)/i)[1]} is NOT NULL, so you must give it a value.`;
  if (/(table|view|index) (.+) already exists/i.test(msg)) return 'That already exists. Start your script with DROP TABLE IF EXISTS (or DROP VIEW IF EXISTS), or press Start again in the Create tables lesson.';
  if (/misuse of aggregate|aggregate functions are not allowed in the GROUP BY/i.test(msg)) return 'Aggregates such as SUM() and AVG() can\'t go in WHERE. Filter groups with HAVING instead.';
  if (/near "(\w+)": syntax error/i.test(msg)){ const w=msg.match(/near "(\w+)"/)[1];
    return `SQL didn't expect "${w}" there. Check the clause order (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY) and for a missing comma or bracket.`; }
  if (/incomplete input/i.test(msg)) return 'The query ends too early. Look for an unclosed quote or bracket.';
  if (/wrong number of arguments to function (\w+)/i.test(msg)) return `Check how many values you passed to ${msg.match(/function (\w+)/i)[1]}().`;
  if (/no such function: (\w+)/i.test(msg)){ const f=msg.match(/no such function: (\w+)/i)[1].toUpperCase(); return FN_HINTS[f] ? `${f}() isn't a SQLite function. ${FN_HINTS[f]}` : `${f}() isn't a SQLite function. The SQL dialects page lists the SQLite equivalents of common functions.`; }
  if (/unrecognized token: "#/i.test(msg)) return 'SQLite comments start with -- (or go between /* and */), and #name temporary tables are T-SQL. In SQLite use CREATE TEMP TABLE name AS SELECT …';
  return null;
}

function runScript(db, src, mode, opts={}){
  const report={ items:[], results:[], notes:[], error:null, ran:[] };
  if (!src.trim()){ report.error={message:'Nothing to run yet.', hint:'Type a SQL statement, then press Run.'}; return report; }
  let stmts;
  try { stmts=splitStatements(src); } catch(e){ report.error={message:e.message}; return report; }
  for (const st of stmts){
    let jobs; const notes=[];
    try { jobs=transform(st, mode, notes); }
    catch(e){ report.notes.push(...notes); report.error={message:e.message, hint:e.hint, sql:st}; break; }
    report.notes.push(...notes);
    for (const n of notes) report.items.push({note:n});
    for (const job of jobs){
      if (job.reset){ if (opts.onReset) db=opts.onReset(); continue; }
      try {
        const res=db.exec(job.sql);
        report.ran.push(job.sql);
        const isWrite=/^(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(job.sql);
        const changes=isWrite?db.getRowsModified():0;
        if (res.length){ for (const r of res) report.results.push({columns:r.columns, values:r.values, sql:job.sql, describe:job.describe}); }
        else if (/^(SELECT|WITH|PRAGMA)\b/i.test(job.sql)) report.results.push({columns:[], values:[], sql:job.sql, empty:true});
        else report.items.push({ok:describeStmt(job.sql, changes)});
      } catch(e){
        report.error={message:e.message, hint:friendlyError(e.message, mode), sql:st};
        break;
      }
    }
    if (report.error) break;
  }
  return report;
}

/* ---------- Answer checking ---------- */
function norm(v){ if (v==null) return '∅'; if (typeof v==='string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) v=Number(v); if (typeof v==='number') return String(Math.round(v*100)/100); return String(v).trim(); }
function expected(db, ex){
  db.run('SAVEPOINT chk');
  let rep;
  try { rep=runScript(db, ex.sol, 'nw'); } finally { db.run('ROLLBACK TO chk'); db.run('RELEASE chk'); }
  if (rep.error) throw new Error(rep.error.message);
  return rep.results[rep.results.length-1]||{columns:[],values:[]};
}
function compare(db, ex, got){
  const exp=expected(db, ex);
  const E=exp.values, U=got.values;
  if (U.length!==E.length) return {ok:false, msg:`Expected ${E.length} row${E.length===1?'':'s'}, your query returned ${U.length}.`, tip: U.length>E.length?'Check your WHERE, HAVING or LIMIT: something is letting extra rows through.':'Check your filter: it\'s excluding rows that should be there.'};
  if (!E.length) return {ok:true};
  const m=exp.columns.length;
  const colKey=(rows,j)=>rows.map(r=>norm(r[j])).sort().join('\u0001');
  const ek=[...Array(m)].map((_,j)=>colKey(E,j));
  const uk=got.columns.map((_,k)=>colKey(U,k));
  const map=[]; const used=new Set();
  const solve=j=>{ if (j===m) return true; for (let k=0;k<uk.length;k++){ if (!used.has(k)&&uk[k]===ek[j]){ used.add(k); map[j]=k; if (solve(j+1)) return true; used.delete(k); } } return false; };
  if (!solve(0)){
    const matched=ek.filter(k=>uk.includes(k)).length;
    return {ok:false, msg:'Right number of rows, but some values don\'t match.', tip: got.columns.length<m?`The answer has ${m} column${m===1?'':'s'}; you returned ${got.columns.length}.`:matched<m?'Check your calculation or which columns you selected.':'Check your calculation.'};
  }
  const proj=U.map(r=>map.map(k=>norm(r[k])).join('\u0001'));
  const want=E.map(r=>r.map(norm).join('\u0001'));
  if ([...proj].sort().join('\n')!==[...want].sort().join('\n')) return {ok:false, msg:'Each column has the right values, but they\'re paired up differently.', tip:'Check your JOIN or GROUP BY.'};
  if (ex.ordered){
    const key=(rows,cols)=>rows.map(r=>cols.map(c=>norm(r[c])).join('\u0001')).join('\n');
    if (key(U, ex.ordered.map(j=>map[j]))!==key(E, ex.ordered)) return {ok:false, msg:'Right rows, wrong order.', tip:'Check your ORDER BY, including ASC or DESC.'};
  }
  return {ok:true, extra:got.columns.length>m};
}
