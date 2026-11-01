// The game's logic: the world database, the nine puzzles, answer marking, and that every map, terminal, chest and door adds up.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from './helpers.mjs';

const g = await loadGame();
const db = g.world();
const at = (key, x, y) => g.MAPS[key].rows[y][x];

describe('the maps', () => {
  test('there are 11 places: the Institute, three village screens and seven Archive rooms', () => assert.deepEqual(Object.keys(g.MAPS).sort(),
    ['academy','ante','archive','boss','east','gate','north','reading','square','vault','village']));
  for (const [key, M] of Object.entries(g.MAPS)) test(`${key} is 16 \u00d7 11 squares, with people standing on open ground`, () => {
    assert.equal(M.rows.length, 11); for (const r of M.rows) assert.equal(r.length, 16);
    for (const n of M.npcs||[]) assert.ok(!'#TRHDBCLPX~wdK'.includes(at(key, n.x, n.y)), `${n.id} stands on "${at(key, n.x, n.y)}"`);
    for (const [x,y] of [...(M.bugs||[]), ...(M.ghosts||[])]) assert.ok(!'#TRHDBCLPX~wdKI'.includes(at(key, x, y)), `an enemy at ${x},${y} stands on "${at(key,x,y)}"`);
  });
  test('the village has no enemies', () => { for (const k of ['academy','village','square','gate']) assert.equal((g.MAPS[k].bugs||[]).length + (g.MAPS[k].ghosts||[]).length, 0, k); });
  test('the Institute\u2019s front door is a rune door opened by the training terminal', () => { assert.equal(at('academy',7,10), 'd'); assert.equal(g.RUNE.academy, 'T0'); });
});

describe('terminals, chests and doors', () => {
  test('every terminal is on a terminal square, and every terminal square has a puzzle', () => {
    for (const k of Object.keys(g.TERMINALS)){ const [key, xy] = k.split(':'); const [x,y] = xy.split(',').map(Number); assert.equal(at(key,x,y), 'P', k); assert.ok(g.PUZZLES[g.TERMINALS[k]], k); }
    for (const [key, M] of Object.entries(g.MAPS)) M.rows.forEach((r,y)=>[...r].forEach((c,x)=>{ if (c==='P') assert.ok(g.TERMINALS[`${key}:${x},${y}`], `${key} ${x},${y} has no puzzle`); }));
  });
  test('all nine puzzles have a terminal', () => assert.deepEqual([...new Set(Object.values(g.TERMINALS))].sort(), Object.keys(g.PUZZLES).sort()));
  test('every chest is on a chest square', () => { for (const k of Object.keys(g.CHESTS)){ const [key, xy] = k.split(':'); const [x,y] = xy.split(',').map(Number); assert.equal(at(key,x,y), 'X', k); } });
  test('the rune doors\u2019 puzzles exist', () => { for (const id of Object.values(g.RUNE)) assert.ok(g.PUZZLES[id]); });
});

describe('the Archive\u2019s room links', () => {
  const opposite = { N:'S', S:'N', E:'W', W:'E' };
  for (const [from, links] of Object.entries(g.LINKS)) for (const [side, [to, tx, ty]] of Object.entries(links)) test(`${from} \u2192 ${side} \u2192 ${to}`, () => {
    assert.ok(g.MAPS[to], `${to} exists`);
    assert.ok(!'#T'.includes(at(to, tx, ty)), `arrive on open ground in ${to}, not "${at(to,tx,ty)}"`);
    const door = side==='N' ? at(from,7,0) : side==='S' ? at(from,7,10) : side==='E' ? at(from,15,5) : at(from,0,5);
    assert.notEqual(door, '#', `${from} needs a doorway on its ${side} side`);
    if (g.LINKS[to] && to !== 'gate') assert.equal(g.LINKS[to][opposite[side]]?.[0], from, `${to} should lead back to ${from}`);
  });
});

describe('the nine puzzles', () => {
  for (const [id, p] of Object.entries(g.PUZZLES)) test(`${id}: ${p.title}`, () => {
    const sol = g.run(db, p.sol);
    assert.ok(sol.values.length > 0, 'the model answer returns rows');
    assert.equal(g.compareRes(sol, sol).ok, true, 'the model answer marks itself correct');
    const built = p.pieces.join(' ').replace(/\s+([,;)])/g,'$1').replace(/\(\s+/g,'(');
    assert.equal(g.compareRes(sol, g.run(db, built)).ok, true, `tapping the pieces in order builds a correct answer: ${built}`);
    assert.ok(p.hint && p.task && p.story, 'has a story, a task and a hint');
  });
  test('the story\u2019s facts hold in the data', () => {
    assert.equal(g.run(db, g.PUZZLES.R.sol).values[0][0], 5, 'Rex reset five villagers\u2019 coins');
    assert.equal(g.run(db, g.PUZZLES.B1.sol).values[0][0], 'Meadow Road', 'the Vault Rune\u2019s keeper lives on Meadow Road');
    assert.deepEqual(g.run(db, g.PUZZLES.P2.sol).values, [['Margaret']], 'Margaret is the eldest');
    assert.equal(g.run(db, g.PUZZLES.B2.sol).values.length, 3, 'three halls have more than two monsters');
  });
});

describe('marking in the game', () => {
  const E = g.run(db, "SELECT name FROM Villagers WHERE job = 'Guard';");
  test('extra columns are fine', () => assert.equal(g.compareRes(E, g.run(db, "SELECT villager_id, name FROM Villagers WHERE job = 'Guard';")).ok, true));
  test('row order doesn\u2019t matter', () => assert.equal(g.compareRes(E, g.run(db, "SELECT name FROM Villagers WHERE job = 'Guard' ORDER BY name DESC;")).ok, true));
  test('too many rows is wrong, and says so', () => { const v = g.compareRes(E, g.run(db, 'SELECT name FROM Villagers;')); assert.equal(v.ok, false); assert.match(v.msg, /Expected 2 rows, your query returned 12/); });
  test('wrong values are wrong', () => assert.equal(g.compareRes(E, g.run(db, "SELECT name FROM Villagers WHERE job = 'Baker' OR job = 'Farmer';")).ok, false));
  test('NULLs are compared as NULLs', () => assert.equal(g.compareRes(g.run(db,'SELECT job FROM Villagers'), g.run(db,"SELECT job FROM Villagers")).ok, true));
});

describe('help with text in queries', () => {
  const sol = "SELECT name FROM Villagers WHERE job = 'Guard';";
  test('wrong capitals and double quotes', () => assert.match(g.textHint('SELECT name FROM Villagers where job = "guard"', sol), /'Guard', not 'guard'.*single quotes/));
  test('wrong capitals in single quotes', () => assert.match(g.textHint("SELECT name FROM Villagers WHERE job = 'GUARD'", sol), /'Guard', not 'GUARD'/));
  test('right text in double quotes', () => assert.match(g.textHint('SELECT name FROM Villagers WHERE job = "Guard"', sol), /single quotes, like 'Guard'/));
  test('nothing to say when the text is right', () => assert.equal(g.textHint("SELECT name FROM Villagers WHERE job = 'Guard'", sol), ''));
});

describe('words in the world', () => {
  test('every sign has something to say', () => { for (const list of Object.values(g.SIGNS)) for (const sg of list){ assert.ok(sg.lines.length); assert.ok(sg.tiles.length); } });
  test('seven bookshelf tips in the Institute and six in the Archive', () => { assert.equal(g.SHELF_TIPS.academy.length, 7); assert.equal(g.SHELF_TIPS.archive.length, 6); });
  test('Ada and Elin each have seven pieces of SQL advice', () => { assert.equal(g.ADVICE.ada.length, 7); assert.equal(g.ADVICE.elin.length, 7); });
  test('the Institute is called the Institute, never the Academy', () => assert.equal(/Sparta Academy/.test(g.html), false));
  test('the hero is Nish the Great: named once, and used throughout', () => {
    assert.match(g.src, /const HERO_NAME = 'Nish the Great';/);
    assert.ok((g.src.match(/\$\{HERO_NAME\}|' \+ HERO_NAME \+ '/g)||[]).length >= 8, 'the characters should use the name');
    assert.match(g.html, /starring <b class="star">Nish the Great<\/b>/, 'the title screen');
    assert.match(g.html, /released by <b>Nish the Great<\/b>/, 'the ending');
  });
});
