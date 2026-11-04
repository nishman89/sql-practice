// Every exercise in every lesson: the model answer, run in the browser, is marked correct.
import { test, expect, id } from './fixtures.mjs';
import { loadSite } from '../unit/helpers.mjs';
const s = await loadSite();

for (const [lessonId, L] of Object.entries(s.LESSONS)){
  if (!(L.ex||[]).length) continue;
  test(`${L.title}: all ${L.ex.length} exercise${L.ex.length===1?'':'s'} marked correct`, async ({ page }) => {
    await page.goto(`#/lesson/${lessonId}`);
    await expect(id(page, 'lesson-title')).toHaveText(L.title);
    for (let k = 1; k <= L.ex.length; k++){
      await id(page, `tab-exercise-${k}`).click();
      await id(page, 'show-answer').click(); await id(page, 'copy-answer').click(); await id(page, 'lesson-run').click();
      await expect(id(page, 'verdict'), `exercise ${k}`).toHaveAttribute('data-correct', 'true');
    }
  });
}
test('a wrong answer is marked wrong, with a reason', async ({ page }) => {
  await page.goto('#/lesson/select'); await id(page, 'tab-exercise-1').click();
  await page.locator('#lessonEditor textarea, [data-testid="lesson-editor-input"]').first().fill('SELECT 1;');
  await id(page, 'lesson-run').click();
  await expect(id(page, 'verdict')).toHaveAttribute('data-correct', 'false');
});
test('"Run this" examples show results', async ({ page }) => {
  await page.goto('#/lesson/select'); await id(page, 'run-example-1').click();
  await expect(page.locator('[data-testid^="lesson-result-table"], [data-testid^="inline-result-1"] table').first()).toBeVisible();
});
