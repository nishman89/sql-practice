// The build output: it exists, holds what it should, and stays within size budgets. Run `npm run build` first.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';

const dist = path.join(root, 'dist');
const built = fs.existsSync(path.join(dist, 'index.html'));
const size = (p) => fs.statSync(path.join(dist, p)).size;

describe('the built site', { skip: !built && 'run npm run build first' }, () => {
  test('the site, the game and the downloads are all there', () => {
    for (const f of ['index.html','game/index.html','downloads/northwind.db','downloads/MySQLNorthwindDatabase.sql']) assert.ok(fs.existsSync(path.join(dist, f)), f);
  });
  test('the site is under 3 MB', () => assert.ok(size('index.html') < 3_000_000, `${size('index.html')} bytes`));
  test('the game page is under 400 KB', () => assert.ok(size('game/index.html') < 400_000, `${size('game/index.html')} bytes`));
  test('everything is inlined: no left-over build placeholders', () => assert.equal(/\/\*__[A-Z]+__\*\//.test(fs.readFileSync(path.join(dist,'index.html'),'utf8')), false));
  test('the game loads exact, pinned library versions', () => {
    const g = fs.readFileSync(path.join(dist,'game/index.html'),'utf8');
    assert.match(g, /three@0\.149\.0\/build\/three\.min\.js/); assert.match(g, /sql\.js@1\.8\.0\/dist\/sql-asm\.js/);
  });
});
