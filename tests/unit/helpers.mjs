// Shared set-up for the unit tests: the real engine and content (as the browser loads them),
// SQLite (sql.js), Northwind, and the pure logic pulled out of the game's page.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const require = createRequire(import.meta.url);

let cache;
export async function loadSite(){
  if (cache) return cache;
  const ctx = vm.createContext({ console, atob, btoa });
  vm.runInContext(['src/engine.js','src/content/lessons.js','src/content/quizzes.js','src/content/dialects.js','src/content/intro.js','src/content/install.js','src/content/capstone.js'].map(read).join('\n') +
    '\nglobalThis.X = { UNITS, LESSONS, PATH, QUIZZES, QUIZ_SETTINGS, DIALECTS, FLAVOURS_CHECK, DATABASES_CHECK, MYDB_SEED, INSTALL_OPTIONS, CAPSTONE_TASKS, runScript, compare, expected, addFns, friendlyError, splitStatements, stripComments };', ctx, { filename:'site' });
  const SQL = await require('sql.js/dist/sql-asm-memory-growth.js')();
  const X = ctx.X;
  const northwind = () => { const d = new SQL.Database(fs.readFileSync(path.join(root, 'data/northwind.db'))); X.addFns(d); return d; };
  const mydb = () => { const d = new SQL.Database(); X.addFns(d); d.exec(X.MYDB_SEED); return d; };
  cache = { ...X, SQL, northwind, mydb };
  return cache;
}

// Pull a top-level `const NAME = …;` or `function NAME(…){…}` out of a script, respecting strings and template literals.
function grab(src, name){
  const re = new RegExp(`(^|\\n)(const ${name}\\s*=\\s*|function ${name}\\()`);
  const m = re.exec(src); if (!m) throw new Error(`${name} not found in the game`);
  const start = m.index + m[1].length; let i = start + m[2].length;
  const isFn = m[2].startsWith('function');
  if (isFn) i = src.indexOf('{', i);
  const open = src[i];
  if (open === '`'){ let j = i+1; while (src[j] !== '`') { if (src[j]==='\\') j++; j++; } return src.slice(start, j+1) + ';'; }
  // otherwise scan to the end of the statement: the closing brace of a block, or a ; outside any brackets
  let depth = 0, j = i, q = null;
  for (; j < src.length; j++){
    const c = src[j];
    if (q){ if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    if (c === '}' || c === ']' || c === ')') { depth--; if (depth === 0 && (isFn || open === '{' || open === '[')) break; }
    if (c === ';' && depth === 0) break;
  }
  return src.slice(start, j+1) + (src[j] === ';' || isFn ? '' : ';');
}

let gameCache;
export async function loadGame(){
  if (gameCache) return gameCache;
  const html = read('public/game/index.html');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const src = scripts[scripts.length-1];
  const parts = ['room','MAPS','LINKS','WORLD_SQL','TABLES','PUZZLES','TERMINALS','RUNE','CHESTS','normV','compareRes','SIGNS','SHELF_TIPS','ADVICE'].map(n => grab(src, n));
  const ctx = vm.createContext({});
  vm.runInContext(parts.join('\n') + '\nglobalThis.X = { room, MAPS, LINKS, WORLD_SQL, TABLES, PUZZLES, TERMINALS, RUNE, CHESTS, normV, compareRes, SIGNS, SHELF_TIPS, ADVICE };', ctx, { filename:'game' });
  const { SQL } = await loadSite();
  const world = () => { const d = new SQL.Database(); d.exec(ctx.X.WORLD_SQL); return d; };
  const run = (db, sql) => { const r = db.exec(sql); return r.length ? r[r.length-1] : { columns:[], values:[] }; };
  gameCache = { ...ctx.X, world, run, html, src };
  return gameCache;
}
