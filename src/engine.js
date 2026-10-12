/* ---------- Pure helpers (no DOM: also loaded by scripts/check.mjs) ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function b64ToBytes(b64){ const bin=atob(b64); const u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; }
function bytesToB64(u){ let s=''; const CH=0x8000; for (let i=0;i<u.length;i+=CH) s+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); return btoa(s); }
function datePart(v, a, b){ if (v==null) return null; const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? +m[a] : null; }
function toDay(v){ if (v==null) return null; const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Date.UTC(+m[1],+m[2]-1,+m[3])/864e5 : null; }
const today = () => new Date().toISOString().slice(0,10);
function toD(v){ if (v==null) return null; const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/); return m ? new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0))) : null; }
function unitOf(u){ u=String(u||'').toUpperCase(); if (/^(YY|YYYY|YEAR)$/.test(u)) return 'YEAR'; if (/^(M|MM|MONTH)$/.test(u)) return 'MONTH'; if (/^(WK|WW|WEEK)$/.test(u)) return 'WEEK'; return 'DAY'; }
function addTo(v,n,u){ const d=toD(v); if(!d||isNaN(n)) return null; if (u==='YEAR') d.setUTCFullYear(d.getUTCFullYear()+n); else if (u==='MONTH') d.setUTCMonth(d.getUTCMonth()+n); else d.setUTCDate(d.getUTCDate()+n*(u==='WEEK'?7:1)); return d.toISOString().slice(0,10); }
function addFns(db){
  const f=(n,fn)=>{ try{ db.create_function(n, fn); }catch(e){} };
  f('YEAR', v=>datePart(v,1)); f('MONTH', v=>datePart(v,2)); f('DAY', v=>datePart(v,3));
  f('DATEDIFF', (a,b)=>{ const x=toDay(a), y=toDay(b); return x==null||y==null?null:x-y; });
  f('TSQL_DATEDIFF', (part,a,b)=>{ const A=toD(a), B=toD(b); if(!A||!B) return null; const u=unitOf(part);
    if (u==='YEAR') return B.getUTCFullYear()-A.getUTCFullYear();
    if (u==='MONTH') return (B.getUTCFullYear()-A.getUTCFullYear())*12 + B.getUTCMonth()-A.getUTCMonth();
    if (u==='WEEK') return Math.floor((toDay(b)-toDay(a))/7);
    return toDay(b)-toDay(a); });
  f('TIMESTAMPDIFF', (part,a,b)=>{ const A=toD(a), B=toD(b); if(!A||!B) return null; const u=unitOf(part);
    let m=(B.getUTCFullYear()-A.getUTCFullYear())*12 + B.getUTCMonth()-A.getUTCMonth();
    if (B.getUTCDate()<A.getUTCDate()) m--;
    if (u==='YEAR') return Math.floor(m/12); if (u==='MONTH') return m;
    if (u==='WEEK') return Math.floor((toDay(b)-toDay(a))/7);
    return Math.floor(toDay(b)-toDay(a)); });
  f('DATE_ADD_I', (v,n,unit)=>addTo(v,+n,unitOf(unit)));
  f('TSQL_DATEADD', (part,n,v)=>addTo(v,+n,unitOf(part)));
  f('DATE_FORMAT', (v,fmt)=>{ const d=toD(v); if(!d||fmt==null) return null; const M=['January','February','March','April','May','June','July','August','September','October','November','December']; const W=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const p2=x=>String(x).padStart(2,'0');
    return String(fmt).replace(/%([a-zA-Z%])/g,(m,c)=>({Y:d.getUTCFullYear(),y:p2(d.getUTCFullYear()%100),m:p2(d.getUTCMonth()+1),c:d.getUTCMonth()+1,d:p2(d.getUTCDate()),e:d.getUTCDate(),M:M[d.getUTCMonth()],b:M[d.getUTCMonth()].slice(0,3),W:W[d.getUTCDay()],a:W[d.getUTCDay()].slice(0,3),H:p2(d.getUTCHours()),i:p2(d.getUTCMinutes()),s:p2(d.getUTCSeconds()),'%':'%'})[c] ?? m); });
  f('NOW', ()=>new Date().toISOString().slice(0,19).replace('T',' ')); f('CURDATE', today); f('GETDATE', ()=>new Date().toISOString().slice(0,19).replace('T',' '));
  f('LEN', s=>s==null?null:String(s).replace(/\s+$/,'').length);
  f('LOCATE', (sub,s)=>sub==null||s==null?null:String(s).indexOf(String(sub))+1);
  f('CHARINDEX', (sub,s)=>sub==null||s==null?null:String(s).indexOf(String(sub))+1);
  f('REGEXP', (re,s)=>{ if (re==null||s==null) return null; try { return new RegExp(re,'i').test(String(s))?1:0; } catch(e){ return 0; } });
  f('LEFT', (s,n)=>s==null?null:String(s).slice(0,Math.max(0,n)));
  f('RIGHT', (s,n)=>s==null?null:(n<=0?'':String(s).slice(-n)));
  db.run('PRAGMA foreign_keys = ON;');
}
/* ---------- SQL text utilities ---------- */
function stripComments(s){
  let out='', i=0; const n=s.length;
  while (i<n){
    const c=s[i];
    if (c==='-'&&s[i+1]==='-'){ while(i<n&&s[i]!=='\n') i++; continue; }
    if (c==='#' && !/[A-Za-z_#]/.test(s[i+1]||'')){ while(i<n&&s[i]!=='\n') i++; continue; }
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

function rewriteCreateTable(s, notes){
  const open=s.indexOf('('); const close=s.lastIndexOf(')');
  if (open<0||close<open) return s;
  const head=s.slice(0,open), body=s.slice(open+1,close), tail=s.slice(close+1);
  let parts=splitTopLevel(body); let auto=null, changed=false;
  parts=parts.map(p=>{
    if (/\bAUTO_INCREMENT\b|\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/i.test(p)){
      const name=p.match(/^(\S+)/)[1]; auto=unq(name).toLowerCase(); changed=true;
      return `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
    }
    return p;
  });
  if (auto) parts=parts.filter(p=>{ const m=p.match(/^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]*)\)\s*$/i); return !(m && unq(m[1].trim()).toLowerCase()===auto); });
  const tailClean = tail.replace(/\b(ENGINE|DEFAULT\s+CHARSET|CHARSET|COLLATE|AUTO_INCREMENT)\s*=\s*\S+/gi,'').trim();
  if (changed) notes.push('Translated AUTO_INCREMENT / IDENTITY to SQLite\'s INTEGER PRIMARY KEY AUTOINCREMENT.');
  return `${head}(\n  ${parts.join(',\n  ')}\n)${tailClean?' '+tailClean:''}`;
}

/* Apply fn only to the parts of s outside quotes, so values like 'Apt #2' are left alone */
function outsideStrings(s, fn){
  let out='', buf='', i=0;
  while (i<s.length){
    const c=s[i];
    if (c==="'"||c==='"'){ out+=fn(buf); buf=''; let j=i+1; while(j<s.length){ if(s[j]===c){ if(s[j+1]===c){j+=2;continue;} break;} j++; } out+=s.slice(i,j+1); i=j+1; continue; }
    buf+=c; i++;
  }
  return out+fn(buf);
}
function rewriteFns(s){
  return s
    .replace(/\bDATE_(ADD|SUB)\(\s*([^,]+?)\s*,\s*INTERVAL\s+(-?\d+)\s+(\w+)\s*\)/gi, (m,op,e,n,u)=>`DATE_ADD_I(${e}, ${op.toUpperCase()==='SUB'?-n:n}, '${u}')`)
    .replace(/\bTIMESTAMPDIFF\(\s*(\w+)\s*,/gi, "TIMESTAMPDIFF('$1',")
    .replace(/\bDATEDIFF\(\s*(d|dd|day|year|yy|yyyy|month|m|mm|week|wk|ww)\s*,/gi, "TSQL_DATEDIFF('$1',")
    .replace(/\bDATEADD\(\s*(\w+)\s*,/gi, "TSQL_DATEADD('$1',");
}
function transform(stmt, mode, notes){
  let s=rewriteFns(stmt.trim());
  if (/\bPIVOT\s*\(|\bUNPIVOT\s*\(/i.test(s))
    throw new LabError('PIVOT and UNPIVOT are T-SQL only.', 'MySQL and this lab don\'t have them. Pivot with conditional aggregation (MAX(CASE WHEN … THEN … END) with GROUP BY) and unpivot with UNION ALL, as the Pivoting lesson shows.');
  if (/\bWITHIN\s+GROUP\b/i.test(s))
    throw new LabError('PERCENTILE_CONT and PERCENTILE_DISC are T-SQL only.', 'MySQL and this lab don\'t have them. CUME_DIST(), PERCENT_RANK() and NTILE() work everywhere.');
  if (/\bRANGE\s+BETWEEN\s+INTERVAL\b/i.test(s))
    throw new LabError('RANGE … INTERVAL is MySQL only.', 'In this lab, order the window by julianday(OrderDate) and use numbers of days: RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING.');
  // T-SQL temporary tables: SELECT … INTO #name FROM …  →  CREATE TEMP TABLE name AS SELECT … FROM …
  let m0=s.match(/^SELECT\s+([\s\S]+?)\s+INTO\s+(#{0,2}[A-Za-z_]\w*)\s+(FROM\b[\s\S]*)$/i);
  if (m0 && !/^SELECT\s+[\s\S]*\bINTO\s+(OUTFILE|DUMPFILE)\b/i.test(s)){
    const temp=m0[2].startsWith('#');
    s=`CREATE ${temp?'TEMP ':''}TABLE ${m0[2]} AS SELECT ${m0[1]} ${m0[3]}`;
    notes.push(`Translated SELECT … INTO to CREATE ${temp?'TEMP ':''}TABLE … AS SELECT.`);
  }
  if (/#{1,2}[A-Za-z_]/.test(outsideStrings(s, x=>x))){
    const before=s; s=outsideStrings(s, x=>x.replace(/#{1,2}([A-Za-z_]\w*)/g,'$1'));
    if (s!==before) notes.push('Treated #name as a temporary table (it lasts until you reload the page).');
  }
  let mx=s.match(/^EXPLAIN\s+(?:ANALYZE\s+|ANALYSE\s+|FORMAT\s*=\s*\w+\s+)?((?:SELECT|WITH|UPDATE|DELETE|INSERT)\b[\s\S]*)$/i);
  if (mx){ notes.push('This lab shows its plan with EXPLAIN QUERY PLAN. SCAN means a full table scan; SEARCH … USING INDEX means the index was used.'); return [{sql:`EXPLAIN QUERY PLAN ${mx[1]}`}]; }
  mx=s.match(/^SHOW\s+(?:INDEX|INDEXES|KEYS)\s+(?:FROM|IN)\s+([`"\[][^`"\]]+[`"\]]|\S+)$/i);
  if (mx){ const t=unq(mx[1]).replace(/'/g,"''");
    return [{sql:`SELECT '${t}' AS "Table", name AS "Key_name", CASE WHEN "unique" THEN 0 ELSE 1 END AS "Non_unique", CASE origin WHEN 'pk' THEN 'Primary key' WHEN 'u' THEN 'Unique constraint' ELSE 'CREATE INDEX' END AS "Created_by" FROM pragma_index_list('${t}')`}]; }
  if (/^CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE\b|^DELIMITER\b|^(CALL|EXEC|EXECUTE)\b/i.test(s))
    throw new LabError('Stored procedures aren\'t available here.', 'This lab runs SQLite, which has no stored procedures. Practise CREATE PROCEDURE in MySQL Workbench or SQL Server Management Studio.');
  if (/^CREATE\s+(DATABASE|SCHEMA)\b/i.test(s)){ notes.push('Skipped CREATE DATABASE: the lab gives you one database already.'); return []; }
  if (/^DROP\s+(DATABASE|SCHEMA)\b/i.test(s)){
    if (mode==='sandbox'){ notes.push('DROP DATABASE: removed all your tables so you can start fresh.'); return [{reset:true}]; }
    notes.push('Skipped DROP DATABASE. Northwind is restored each time you reload the page.'); return [];
  }
  if (/^USE\s+\S+$/i.test(s)){ notes.push('Skipped USE: you\'re already connected.'); return []; }
  if (/^IF\s+EXISTS\b/i.test(s)){ notes.push('Skipped the T-SQL IF EXISTS block.'); return []; }
  if (/^SHOW\s+TABLES$/i.test(s)) return [{sql:"SELECT name AS \"Tables\" FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"}];
  let m=s.match(/^(?:DESCRIBE|DESC|EXPLAIN)\s+([`"\[]?[\w ]+?[`"\]]?)$/i);
  if (m && !/^EXPLAIN\s+(SELECT|QUERY)/i.test(s)){
    const t=unq(m[1].trim()).replace(/'/g,"''");
    return [{sql:`SELECT name AS "Field", type AS "Type", CASE WHEN "notnull" THEN 'NO' ELSE 'YES' END AS "Null", CASE WHEN pk>0 THEN 'PRI' ELSE '' END AS "Key", dflt_value AS "Default" FROM pragma_table_info('${t}')`, describe:t}];
  }
  if (/^CREATE\s+TABLE\b/i.test(s) && !/^CREATE\s+TABLE\s+\S+\s+AS\s+SELECT\b/i.test(s)) return [{sql:rewriteCreateTable(s, notes)}];
  m=s.match(/^ALTER\s+TABLE\s+([`"\[][^`"\]]+[`"\]]|\S+)\s+ADD\s+([\s\S]+)$/i);
  if (m){
    let rest=m[2].trim();
    if (/^(CONSTRAINT|FOREIGN\s+KEY|PRIMARY\s+KEY|UNIQUE|INDEX|KEY|CHECK)\b/i.test(rest))
      throw new LabError('SQLite can\'t add a key or constraint to an existing table.', 'As the lesson says, update your CREATE TABLE script and re-run it: DROP TABLE, then CREATE TABLE again with the constraint included.');
    rest=rest.replace(/^COLUMN\s+/i,'');
    if (/^\(/.test(rest) && /\)$/.test(rest)) rest=rest.slice(1,-1);
    const cols=splitTopLevel(rest).map(c=>c.replace(/^COLUMN\s+/i,''));
    if (cols.length>1) notes.push(`Split ALTER TABLE into ${cols.length} ADD COLUMN statements (SQLite adds one column at a time).`);
    return cols.map(c=>({sql:`ALTER TABLE ${m[1]} ADD COLUMN ${c}`}));
  }
  m=s.match(/^SELECT\s+TOP\s*\(?\s*(\d+)\s*\)?\s+(WITH\s+TIES\s+)?/i);
  if (m){
    let rest='SELECT '+s.slice(m[0].length);
    if (m[2]) notes.push('WITH TIES isn\'t supported in SQLite, so ties at the cut-off are dropped.');
    notes.push(`Translated TOP ${m[1]} to LIMIT ${m[1]}.`);
    return [{sql:`${rest} LIMIT ${m[1]}`}];
  }
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
  return 'Statement ran';
}

function friendlyError(msg, mode){
  const tables = mode==='nw' ? 'Customers, Orders, `Order Details`, Products, Categories, Suppliers, Employees, Shippers' : null;
  if (/no such table: (.+)/i.test(msg)){ const t=msg.match(/no such table: (.+)/i)[1];
    if (/order details/i.test(t)||/^order$/i.test(t)) return 'Table names with spaces need wrapping: `Order Details` (MySQL) or [Order Details] (T-SQL).';
    return tables ? `There's no table called ${t}. Northwind's tables are ${tables}.` : `There's no table called ${t} yet. Check the spelling, or create it first.`; }
  if (/no such column: (.+)/i.test(msg)){ const c=msg.match(/no such column: (.+)/i)[1];
    return `There's no column called ${c} in the tables you're selecting from. Check the spelling and the table in FROM. Text values need single quotes ('London'), otherwise SQL reads them as column names.`; }
  if (/ambiguous column name: (.+)/i.test(msg)) return `More than one table in your query has a column called ${msg.match(/ambiguous column name: (.+)/i)[1]}. Prefix it with the table name or alias, for example o.CustomerID.`;
  if (/FOREIGN KEY constraint failed/i.test(msg)) return 'The foreign key blocked this change. You referred to a row in the parent table that doesn\'t exist, or tried to delete a row that other rows still point to.';
  if (/UNIQUE constraint failed/i.test(msg)) return 'That primary key value already exists. Each row needs a unique key.';
  if (/NOT NULL constraint failed: (.+)/i.test(msg)) return `${msg.match(/NOT NULL constraint failed: (.+)/i)[1]} is NOT NULL, so you must give it a value.`;
  if (/table (.+) already exists/i.test(msg)) return 'That table already exists. Use DROP TABLE IF EXISTS first, or press Start again.';
  if (/misuse of aggregate|aggregate functions are not allowed in the GROUP BY/i.test(msg)) return 'Aggregates such as SUM() and AVG() can\'t go in WHERE. Filter groups with HAVING instead.';
  if (/near "(\w+)": syntax error/i.test(msg)){ const w=msg.match(/near "(\w+)"/)[1];
    if (/^(TOP)$/i.test(w)) return 'Use LIMIT at the end of the query instead of TOP.';
    return `SQL didn't expect "${w}" there. Check the clause order (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY) and for a missing comma or bracket.`; }
  if (/incomplete input/i.test(msg)) return 'The query ends too early. Look for an unclosed quote or bracket.';
  if (/wrong number of arguments to function (\w+)/i.test(msg)) return `Check how many values you passed to ${msg.match(/function (\w+)/i)[1]}().`;
  if (/no such function: (\w+)/i.test(msg)) return `${msg.match(/no such function: (\w+)/i)[1]}() isn't available in this lab's SQLite engine.`;
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
function norm(v){ if (v==null) return '∅'; if (typeof v==='number') return String(Math.round(v*100)/100); return String(v).trim(); }
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
