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
  read('src/engine.js') + '\n' + read('src/content/lessons.js') + '\n' + read('src/content/quizzes.js') + '\n' + read('src/content/dialects.js') + '\n' + read('src/content/intro.js') +
  '\nglobalThis.X = { UNITS, LESSONS, PATH, QUIZZES, QUIZ_SETTINGS, DIALECTS, FLAVOURS_CHECK, runScript, compare, expected, addFns };',
  ctx, { filename: 'content' });
const { UNITS, LESSONS, QUIZZES, QUIZ_SETTINGS, DIALECTS, FLAVOURS_CHECK, runScript, compare, expected, addFns } = ctx.X;

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
  if (!L.ex && Array.isArray(L.check)) {
    // A read-and-check lesson (such as Stored procedures): questions instead of exercises
    if (!L.learn) fail(id, 'needs "learn" content');
    L.check.forEach((q, i) => { if (!(q.q && Array.isArray(q.a) && q.a[q.c] != null && q.why)) fail(`${id}, check question ${i + 1}`, 'needs q, a (options), a valid c and why'); });
  } else if (!Array.isArray(L.ex) || !L.ex.length) { fail(id, 'needs at least one exercise in "ex" (or check questions in "check")'); continue; }
  if (!L.checkpoint && !L.learn) fail(id, 'needs "learn" content (or checkpoint: true)');
  (L.ex || []).forEach((ex, i) => { exercises += checkTask(`${id}, exercise ${i + 1}`, ex, ['p', 'hint', 'sol']); });
  // Run the lesson's examples in order, as a learner would (one can rely on an earlier one), then undo them all
  db.run('SAVEPOINT ex');
  let n = 0;
  for (const m of (L.learn || '').matchAll(/<pre class="ex"(?! data-norun)>([\s\S]*?)<\/pre>/g)) {
    examples++; n++;
    const rep = runScript(db, unescape(m[1]), 'nw');
    if (rep.error) fail(`${id}, example ${n}`, `gives an error: ${rep.error.message}`);
  }
  db.run('ROLLBACK TO ex'); db.run('RELEASE ex');
}
for (const id of Object.keys(LESSONS)) if (!seen.has(id)) warn(id, 'is in LESSONS but not in any unit, so learners can\'t reach it');

if (!(QUIZ_SETTINGS.passMark > 0 && QUIZ_SETTINGS.passMark <= 100)) fail('QUIZ_SETTINGS', 'passMark must be between 1 and 100');
const quizIds = new Set();
for (const q of QUIZZES) {
  const where = `quiz ${q.id}`;
  if (!q.id || quizIds.has(q.id)) fail(where, 'id must be set and unique');
  quizIds.add(q.id);
  if (!['query', 'mcq', 'mixed'].includes(q.type)) fail(where, 'type must be "query", "mcq" or "mixed"');
  if (q.unitQuiz != null && !(q.unitQuiz >= 1 && q.unitQuiz <= UNITS.length)) fail(where, `unitQuiz must be 1-${UNITS.length}`);
  if (!q.title || !q.blurb) fail(where, 'needs a title and a blurb');
  if (!Array.isArray(q.timeLimits) || !q.timeLimits.length || !q.timeLimits.includes(q.defaultLimit)) fail(where, 'timeLimits must be a list of minutes (0 = no limit) that includes defaultLimit');
  if (!Array.isArray(q.questions) || !q.questions.length) { fail(where, 'needs questions'); continue; }
  q.questions.forEach((t, i) => {
    const at = `${where}, question ${i + 1}`;
    const isMcq = Array.isArray(t.options);
    if (q.type === 'mcq' && !isMcq) fail(at, 'an "mcq" quiz can only have multiple-choice questions');
    if (q.type === 'query' && isMcq) fail(at, 'a "query" quiz can only have query tasks');
    if (!isMcq) {
      if (!LESSONS[t.lesson] || LESSONS[t.lesson].kind) fail(at, `lesson "${t.lesson}" must be the id of a lesson with exercises`);
      questions += checkTask(at, t, ['p', 'sol', 'why']);
    } else {
      for (const f of ['q', 'why']) if (typeof t[f] !== 'string' || !t[f].trim()) fail(at, `"${f}" is missing`);
      if (!(t.unit >= 1 && t.unit <= UNITS.length)) fail(at, `unit must be 1-${UNITS.length}`);
      if (!Array.isArray(t.options) || t.options.length !== 4) fail(at, 'needs exactly 4 options');
      else if (new Set(t.options).size !== 4) fail(at, 'has two identical options');
      if (!(Number.isInteger(t.answer) && t.answer >= 0 && t.answer <= 3)) fail(at, 'answer must be 0, 1, 2 or 3 (the index of the right option)');
      questions++;
    }
  });
}

let tries = 0;
DIALECTS.forEach((r, i) => {
  const where = `dialects row ${i + 1} (${r.task})`;
  for (const f of ['group', 'task', 'mysql', 'tsql', 'lab']) if (!r[f]) fail(where, `"${f}" is missing`);
  if (r.try) {
    tries++;
    db.run('SAVEPOINT tr');
    const rep = runScript(db, r.try, 'nw');
    db.run('ROLLBACK TO tr'); db.run('RELEASE tr');
    if (rep.error) fail(where, `its "Try it" example gives an error: ${rep.error.message}`);
  }
});
FLAVOURS_CHECK.forEach((q, i) => { if (!(q.a && q.a[q.c] && q.why)) fail(`flavours check ${i + 1}`, 'needs options, a valid c and why'); });

for (const w of warnings) console.warn('⚠ ' + w);
if (errors.length) {
  for (const e of errors) console.error('✗ ' + e);
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} found. Nothing was built.`);
  process.exit(1);
}
console.log(`✓ ${lessons} lessons, ${exercises} exercises, ${examples} examples, ${tries} dialect examples and ${QUIZZES.length} quizzes (${questions} questions) checked`);
for (const q of QUIZZES) { const m = q.questions.filter((t) => Array.isArray(t.options)); if (m.length) { const spread = [0, 1, 2, 3].map((k) => m.filter((t) => t.answer === k).length); console.log(`  ${q.title}: answers a-d used ${spread.join(' / ')} times`); } }
