// On a phone (Pixel 7): the menu, lessons and the game's full screen.
import { test, expect, id, shot } from './fixtures.mjs';
test.describe('on a phone', () => {
  test('the menu button opens the site menu and navigates', async ({ page }) => {
    await page.goto('#/path'); await id(page, 'mobile-menu').locator('summary').click();
    await id(page, 'mobile-nav-quiz').click(); await expect(page.locator('#v-quizzes')).toHaveClass(/\bon\b/);
  });
  test('a lesson\u2019s exercise can be answered', async ({ page }) => {
    await page.goto('#/lesson/select'); await id(page, 'tab-exercise-1').click(); await id(page, 'show-answer').click();
    await id(page, 'copy-answer').click(); await id(page, 'lesson-run').click(); await expect(id(page, 'verdict')).toHaveAttribute('data-correct', 'true');
  });
  test('the page never scrolls sideways', async ({ page }) => {
    for (const r of ['#/path','#/lesson/joinsintro','#/quiz','#/free','#/install','#/game']){
      await page.goto(r); await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), r).toBe(true);
      if (['#/path','#/lesson/joinsintro','#/quiz'].includes(r)) await shot(page, `Phone: ${r.replace('#/','') || 'home'}`);
    }
  });
  test('full screen fills the screen, and the game offers a way back out', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('#/game'); await id(page, 'game-fullscreen').tap();
    const box = await id(page, 'game-frame').boundingBox(); const vp = page.viewportSize();
    expect(Math.round(box.width)).toBe(vp.width); expect(Math.round(box.height)).toBe(vp.height);
    const frame = page.frameLocator('[data-testid="game-frame"]'); await expect(frame.locator('#fsBtn')).toBeVisible({ timeout: 30_000 });
    await frame.locator('#fsBtn').click(); await expect(id(page, 'game-stage')).not.toHaveClass(/\bfull\b/);
  });
});
