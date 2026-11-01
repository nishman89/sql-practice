import { test, expect, id } from './fixtures.mjs';

test.describe('navigation', () => {
  test('the home page shows the learning path, with all eight units', async ({ page }) => {
    await page.goto('#/path');
    await expect(id(page, 'hero')).toBeVisible();
    for (let u = 1; u <= 8; u++) await expect(id(page, `unit-${u}`)).toBeVisible();
    await expect(id(page, 'lesson-link-select')).toBeVisible();
  });
  for (const [nav, view, heading] of [['nav-intro','intro','intro-title'],['nav-dialects','dialects','dialects-title'],['nav-install','install','install-title'],['nav-quiz','quizzes','quizzes-title'],['nav-free','free',null],['nav-game','game','game-title']]){
    test(`the ${nav.replace('nav-','')} link opens its page`, async ({ page }) => {
      await page.goto('#/path'); await id(page, nav).click();
      await expect(page.locator(`#v-${view}`)).toHaveClass(/\bon\b/);
      if (heading) await expect(id(page, heading)).toBeVisible();
      await expect(id(page, 'breadcrumb')).toContainText('Home');
    });
  }
  test('lessons link to the previous and next lesson', async ({ page }) => {
    await page.goto('#/lesson/sorting');
    await expect(id(page, 'lesson-title')).toHaveText(/Sorting/);
    await id(page, 'top-next-lesson').click(); await expect(id(page, 'lesson-title')).not.toHaveText(/Sorting/);
    await id(page, 'top-previous-lesson').click(); await expect(id(page, 'lesson-title')).toHaveText(/Sorting/);
  });
  test('the browser back button works between pages', async ({ page }) => {
    await page.goto('#/path'); await id(page, 'nav-quiz').click(); await expect(page.locator('#v-quizzes')).toHaveClass(/\bon\b/);
    await page.goBack(); await expect(page.locator('#v-path')).toHaveClass(/\bon\b/);
  });
  test('an unknown address falls back to the home page', async ({ page }) => {
    await page.goto('#/no-such-page'); await expect(id(page, 'hero')).toBeVisible();
  });
  test('marking a lesson complete is remembered after a reload', async ({ page }) => {
    await page.goto('#/lesson/erd'); await id(page, 'mark-complete').click(); await expect(id(page, 'unmark-complete')).toBeVisible();
    await page.reload(); await expect(id(page, 'unmark-complete')).toBeVisible();
  });
});
