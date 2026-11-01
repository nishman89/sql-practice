// The Lost Ledger. The game draws with WebGL, which is slow without a graphics card, so these tests
// use the game's test handle (window.PROTO) to move around, and allow plenty of time.
import { test, expect, id } from './fixtures.mjs';
test.setTimeout(120_000);
test.describe.configure({ mode: 'serial' });   // one game at a time: 3D without a graphics card is slow
const GAME = 'game/index.html?lowfx';
const P = (page, js) => page.evaluate(js);
async function newGame(page){
  await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload();
  await expect(page.locator('#title')).toBeVisible(); await page.locator('#tNew').click();
  await expect.poll(() => P(page, 'PROTO.talking()')).toBe(true);
  for (let i = 0; i < 6 && await P(page, 'PROTO.talking()'); i++){ await P(page, 'PROTO.use()'); await page.waitForTimeout(100); }
}
async function closeTalk(page){ for (let i = 0; i < 30 && await P(page, 'PROTO.talking()'); i++){ await P(page, 'PROTO.use()'); await page.waitForTimeout(120); } }
async function solveAt(page, place, x, y, face, sql){
  await closeTalk(page); await P(page, `PROTO.warp('${place}',${x},${y},'${face}')`); await page.waitForTimeout(300); await P(page, 'PROTO.use()');
  await expect(page.locator('#pz')).toBeVisible(); await expect(page.locator('#pzRun')).toBeEnabled({ timeout: 60_000 });
  await page.locator('#pzInput').fill(sql); await page.locator('#pzRun').click();
}

test.describe('the game', () => {
  test('starts on the title screen, with How to play', async ({ page }) => {
    await page.goto(GAME); await page.evaluate(() => localStorage.clear()); await page.reload();
    await expect(page.locator('#title h1')).toHaveText('The Lost Ledger'); await expect(page.locator('#tContinue')).toBeHidden();
    await page.locator('#tHow').click(); await expect(page.locator('#manual h2')).toHaveText('How to play'); await page.locator('#manClose').click();
    await expect(page.locator('#title')).toBeVisible();
  });
  test('Ada sends you to the training terminal, and the door stays sealed until it\u2019s solved', async ({ page }) => {
    await newGame(page);
    await P(page, "PROTO.warp('academy',10,4,'right')"); await page.waitForTimeout(300); await P(page, 'PROTO.use()');
    await expect(page.locator('#who')).toHaveText('Trainer Ada'); await closeTalk(page);
    expect(await P(page, 'PROTO.G().flags.metAda')).toBe(true);
    await P(page, "PROTO.warp('academy',7,9,'down')"); await page.waitForTimeout(300);
    await page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { code:'ArrowDown' }))); await page.waitForTimeout(3000);
    await page.evaluate(() => dispatchEvent(new KeyboardEvent('keyup', { code:'ArrowDown' })));
    expect((await P(page, 'PROTO.pos()')).place, 'the sealed door keeps you in').toBe('academy');
  });
  test('a terminal marks a wrong answer, then a right one, and opens the door', async ({ page }) => {
    await newGame(page);
    await solveAt(page, 'academy', 3, 4, 'up', 'SELECT name FROM Villagers;');
    await expect(page.locator('#pzVerdict')).toContainText('Not quite'); await expect(page.locator('#pzDone')).toHaveText('Leave');
    await page.locator('#pzInput').fill('SELECT name, job FROM Villagers;'); await page.locator('#pzRun').click();
    await expect(page.locator('#pzVerdict')).toContainText('The rune glows'); await expect(page.locator('#pzDone')).toHaveText(/Complete/);
    await expect(page.locator('#pzOut tr')).toHaveCount(13);
    await page.locator('#pzDone').click(); await expect(page.locator('#pz')).toBeHidden();
    expect(await P(page, 'PROTO.G().solved.T0')).toBe(true);
  });
  test('the hint unlocks after two wrong tries, or with a hint scroll', async ({ page }) => {
    await newGame(page); await solveAt(page, 'academy', 3, 4, 'up', 'SELECT 1;');
    await page.locator('#pzHint').click(); await expect(page.locator('#pzHintText')).toBeHidden();
    await page.locator('#pzRun').click(); await page.locator('#pzHint').click(); await expect(page.locator('#pzHintText')).toBeVisible();
  });
  test('a terminal explains wrong capitals and double quotes', async ({ page }) => {
    await newGame(page); await P(page, "Object.assign(PROTO.G().flags,{gateOpen:true}); PROTO.G().solved.T0=true");
    await solveAt(page, 'archive', 5, 5, 'up', 'SELECT name FROM Villagers where job = "guard"');
    await expect(page.locator('#pzVerdict')).toContainText("'Guard', not 'guard'"); await expect(page.locator('#pzVerdict')).toContainText('single quotes');
  });
  test('the story moves on: Margaret gives the pass, Odo opens the gate', async ({ page }) => {
    await newGame(page); await P(page, 'PROTO.G().solved.T0=true');
    await P(page, "PROTO.warp('square',6,4,'up')"); await page.waitForTimeout(300); await P(page, 'PROTO.use()'); await closeTalk(page);
    expect(await P(page, 'PROTO.G().items.pass')).toBe(true);
    await P(page, "PROTO.warp('gate',8,1,'right')"); await page.waitForTimeout(300); await P(page, 'PROTO.use()'); await closeTalk(page);
    expect(await P(page, 'PROTO.G().flags.gateOpen')).toBe(true);
  });
  test('progress is saved, and Continue picks it up after a reload', async ({ page }) => {
    await newGame(page); await P(page, "PROTO.G().keywords=12; PROTO.warp('square',8,7,'up')"); await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); await expect(page.locator('#menu')).toBeVisible(); await page.locator('#mQuit').click();
    await page.reload(); await expect(page.locator('#tContinue')).toContainText('Village: Square'); await page.locator('#tContinue').click();
    expect((await P(page, 'PROTO.pos()')).place).toBe('square'); expect(await P(page, 'PROTO.G().keywords')).toBe(12);
  });
  test('the Game tab shows the game in a frame, and leaving the tab unloads it', async ({ page }) => {
    await page.goto('#/game'); const frame = page.frameLocator('[data-testid="game-frame"]');
    await expect(frame.locator('#title h1')).toHaveText('The Lost Ledger');
    await id(page, 'nav-path').click(); await expect(id(page, 'game-frame')).not.toHaveAttribute('src', /game/);
  });
  test('the Game page has How to play and a spoiler-folded walkthrough', async ({ page }) => {
    await page.route('**/game/index.html', r => r.fulfill({ body:'<!doctype html><title>game</title>', contentType:'text/html' }));
    await page.goto('#/game');
    await expect(id(page, 'game-manual')).not.toHaveAttribute('open', ''); await expect(id(page, 'game-walkthrough')).not.toHaveAttribute('open', '');
    await id(page, 'game-walkthrough').locator('summary').first().click();
    await expect(page.locator('.guide-steps > li')).toHaveCount(10); await expect(page.locator('.ans code').first()).toBeHidden();
  });
});
