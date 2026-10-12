// Checks every lesson, example, exercise and quiz question before a build.
// It loads the same engine the browser uses, runs every model answer and every "Run this" example
// against Northwind, and fails if anything errors or is set up wrongly.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js/dist/sql-asm-memory-growth.js');

const ctx = vm.createContext({ console, atob, btoa });
vm.runInContext(
  read('src/engine.js') + '\n' + read('src/content/lessons.js') + '\n' + read('src/content/quizzes.js') +
  '\nglobalThis.X = { UNITS, LESSONS, PATH, QUIZZES, QUIZ_SETTINGS, runScript, compare, expected, addFns };',
  ctx, { filename: 'content' });
const { UNITS, LESSONS, QUIZZES, QUIZ_SETTINGS, runScript, compare, expected, addFns } = ctx.X;

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync(path.join(root, 'data/northwind.db')));
addFns(db);

const errors = [], warnings = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function checkTask(where, t, fields) {
  for (const f of fields) if (typeof t[f] !== 'string' || !t[f].trim()) fail(where, `"${f}" is missing`);
  if (typeof t.sol !== 'string') return 0;
  let exp;
  try { exp = expected(db, t); } catch (e) { fail(where, `the model answer gives an error: ${e.message}`); return 0; }
  if (!exp.values.length) warn(where, 'the model answer returns no rows, so any query returning no rows would be marked correct');
  if (t.ordered && t.ordered.some((i) => i >= exp.columns.length)) fail(where, `"ordered" refers to a column that doesn't exist (the answer has ${exp.columns.length})`);
  const self = compare(db, t, exp);
  if (!self.ok) fail(where, `the model answer doesn't match itself: ${self.msg}`);
  return 1;
}

let lessons = 0, exercises = 0, examples = 0, questions = 0;
const seen = new Set();
for (const u of UNITS) for (const id of u.lessons) {
  const L = LESSONS[id];
  if (!L) { fail(`unit ${u.id}`, `lesson "${id}" isn't defined in LESSONS`); continue; }
  if (seen.has(id)) fail(`unit ${u.id}`, `lesson "${id}" appears twice`);
  seen.add(id); lessons++;
  if (!L.title || !L.summary) fail(id, 'needs a title and a summary');
  if (L.kind) continue; // Foundations lessons have their own pages
  if (!Array.isArray(L.ex) || !L.ex.length) { fail(id, 'needs at least one exercise in "ex"'); continue; }
  if (!L.checkpoint && !L.learn) fail(id, 'needs "learn" content (or checkpoint: true)');
  L.ex.forEach((ex, i) => { exercises += checkTask(`${id}, exercise ${i + 1}`, ex, ['p', 'hint', 'sol']); });
  for (const m of (L.learn || '').matchAll(/<pre class="ex"(?! data-norun)>([\s\S]*?)<\/pre>/g)) {
    examples++;
    db.run('SAVEPOINT ex');
    const rep = runScript(db, unescape(m[1]), 'nw');
    db.run('ROLLBACK TO ex'); db.run('RELEASE ex');
    if (rep.error) fail(`${id}, example ${examples}`, `gives an error: ${rep.error.message}`);
  }
}
for (const id of Object.keys(LESSONS)) if (!seen.has(id)) warn(id, 'is in LESSONS but not in any unit, so learners can\'t reach it');

if (!(QUIZ_SETTINGS.passMark > 0 && QUIZ_SETTINGS.passMark <= 100)) fail('QUIZ_SETTINGS', 'passMark must be between 1 and 100');
const quizIds = new Set();
for (const q of QUIZZES) {
  if (quizIds.has(q.id) || q.id === 'mix') fail(`quiz ${q.id}`, 'id must be unique and not "mix"');
  quizIds.add(q.id);
  q.questions.forEach((t, i) => {
    if (!(t.unit >= 1 && t.unit <= UNITS.length)) fail(`quiz ${q.id}, question ${i + 1}`, `unit must be 1-${UNITS.length}`);
    questions += checkTask(`quiz ${q.id}, question ${i + 1}`, t, ['p', 'sol', 'why']);
  });
}

for (const w of warnings) console.warn('⚠ ' + w);
if (errors.length) {
  for (const e of errors) console.error('✗ ' + e);
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} found. Nothing was built.`);
  process.exit(1);
}
console.log(`✓ ${lessons} lessons, ${exercises} exercises, ${examples} examples and ${QUIZZES.length} quizzes (${questions} questions) checked`);
