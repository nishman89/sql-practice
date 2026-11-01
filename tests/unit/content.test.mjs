// The course content: every lesson, exercise, example, quiz question and guide is complete and consistent.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSite } from './helpers.mjs';

const s = await loadSite();
const nw = s.northwind();
const lessonIds = Object.keys(s.LESSONS);

describe('the learning path', () => {
  test('every lesson in a unit exists, and appears only once', () => {
    const inUnits = s.UNITS.flatMap(u => u.lessons);
    assert.equal(new Set(inUnits).size, inUnits.length, 'a lesson is listed twice');
    for (const id of inUnits) assert.ok(s.LESSONS[id], `unit lists missing lesson "${id}"`);
  });
  test('every lesson is in a unit', () => {
    const inUnits = new Set(s.UNITS.flatMap(u => u.lessons));
    for (const id of lessonIds) assert.ok(inUnits.has(id), `lesson "${id}" isn't in any unit`);
  });
  test('there are 50 lessons in 8 units', () => { assert.equal(lessonIds.length, 50); assert.equal(s.UNITS.length, 8); });
  test('every lesson has a title and a one-line summary', () => {
    for (const [id, L] of Object.entries(s.LESSONS)){ assert.ok(L.title && L.title.length < 60, `${id} title`); assert.ok(L.summary, `${id} summary`); }
  });
});

describe('exercises', () => {
  for (const [id, L] of Object.entries(s.LESSONS)) (L.ex||[]).forEach((e, i) => {
    test(`${id}, exercise ${i+1}: has a task, a hint and a working model answer`, () => {
      assert.ok(e.p && /[.?)]$/.test(e.p.trim()), 'the task should be a full sentence');
      assert.ok(e.hint, 'needs a hint');
      if (L.db === 'mydb'){ const d = s.mydb(); const r = s.runScript(d, e.sol, 'mydb'); assert.equal(r.error, null, r.error && r.error.message); }
      else { const r = s.runScript(nw, e.sol, 'nw'); assert.equal(r.error, null, r.error && r.error.message); assert.ok(r.results.length, 'should return a result'); }
    });
  });
});

describe('quizzes', () => {
  test('the pass mark is 65%', () => assert.equal(s.QUIZ_SETTINGS.passMark, 65));
  test('quiz ids are unique', () => { const ids = s.QUIZZES.map(q => q.id); assert.equal(new Set(ids).size, ids.length); });
  for (const q of s.QUIZZES) q.questions.forEach((t, i) => {
    test(`${q.id}, question ${i+1}`, () => {
      if (t.options){
        assert.equal(t.options.length, 4, 'four options'); assert.equal(new Set(t.options).size, 4, 'options must differ');
        assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && t.answer <= 3, 'answer is a, b, c or d'); assert.ok(t.why, 'needs an explanation');
      } else {
        assert.ok(t.p && t.sol, 'a query question needs a task and a model answer');
        const r = s.runScript(nw, t.sol, 'nw'); assert.equal(r.error, null, r.error && r.error.message);
      }
    });
  });
});

describe('other guides and checks', () => {
  test('every dialect comparison row has all three dialects (SQLite is stored as "lab")', () => { for (const r of s.DIALECTS) for (const k of ['lab','mysql','tsql']) assert.ok(r[k] !== undefined, `${r.task}: ${k}`); });
  test('every "Try it" example in the dialect table runs', () => { for (const r of s.DIALECTS.filter(r => r.try)){ const res = s.runScript(nw, r.try, 'nw'); assert.equal(res.error, null, `${r.task}: ${res.error && res.error.message}`); } });
  test('every multiple-choice check has a valid answer and an explanation', () => {
    for (const q of [...s.FLAVOURS_CHECK, ...s.DATABASES_CHECK, ...Object.values(s.LESSONS).flatMap(L => L.check||[])]){ assert.ok(q.a[q.c] !== undefined, q.q); assert.ok(q.why, q.q); }
  });
  test('there are six install guides, each with steps', () => { assert.equal(s.INSTALL_OPTIONS.length, 6); for (const o of s.INSTALL_OPTIONS) assert.ok(o.body && o.body.length > 200, o.id); });
  test('the capstone has a checklist', () => assert.ok(s.CAPSTONE_TASKS.length >= 10));
});

describe('house style', () => {
  const text = JSON.stringify([s.LESSONS, s.QUIZZES, s.DIALECTS, s.INSTALL_OPTIONS]);
  test('British spellings', () => { const m = text.match(/\b(color|colors|organize[ds]?|behavior|favorite|center|analyze[ds]?|summarize[ds]?|normalize[ds]?)\b/gi); assert.equal(m, null, `American spellings: ${m}`); });
  test('no leftover "lab" wording', () => assert.equal(/\b(this|the) lab\b/i.test(text), false));
  test('the Institute is never called the Academy in the course text', () => assert.equal(/Sparta Academy/.test(text), false));
});
