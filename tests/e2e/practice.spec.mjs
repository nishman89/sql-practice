import { test, expect, id } from './fixtures.mjs';

test.describe('free practice', () => {
  test('a query shows its results', async ({ page }) => {
    await page.goto('#/free'); await id(page, 'free-editor-input').fill('SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > 50;');
    await id(page, 'free-run').click(); await expect(id(page, 'free-result-table').locator('tbody tr')).toHaveCount(7);
  });
  test('a T-SQL habit gets a friendly explanation', async ({ page }) => {
    await page.goto('#/free'); await id(page, 'free-editor-input').fill('SELECT TOP 5 ProductName FROM Products;');
    await id(page, 'free-run').click(); await expect(id(page, 'free-query-error')).toContainText('LIMIT');
  });
  test('the table buttons cover all 13 Northwind tables', async ({ page }) => {
    await page.goto('#/free'); await expect(page.locator('[data-testid^="free-insert-table-"]')).toHaveCount(13);
  });
});
test.describe('Creating tables (the step-by-step builder)', () => {
  test('all six steps complete with the lesson\u2019s code', async ({ page }) => {
    await page.goto('#/lesson/build');
    for (let i = 1; i <= 6; i++){ await id(page, `build-step-${i}`).click(); await id(page, 'use-lesson-code').click(); await id(page, 'build-run').click();
      await expect(id(page, `build-step-${i}`)).toHaveAttribute('data-done', 'true'); }
  });
  test('step 2 still completes after a mistaken first attempt (a tester\u2019s bug)', async ({ page }) => {
    await page.goto('#/lesson/build'); await id(page, 'build-step-1').click(); await id(page, 'use-lesson-code').click(); await id(page, 'build-run').click();
    await id(page, 'build-step-2').click();
    await page.locator('#buildEditor textarea').fill('CREATE TABLE Orders (order_id INTEGER PRIMARY KEY AUTOINCREMENT, order_number INTEGER, customer_id INTEGER, FOREIGN KEY (customer_id) REFERENCES Customers(customer_id));');
    await id(page, 'build-run').click(); await id(page, 'use-lesson-code').click(); await id(page, 'build-run').click();
    await expect(id(page, 'build-step-2')).toHaveAttribute('data-done', 'true');
  });
});
test.describe('the ERD maker', () => {
  test('draws a diagram from CREATE TABLE statements', async ({ page }) => {
    await page.goto('#/erd-maker'); await expect(id(page, 'erdmaker-diagram').locator('svg')).toBeVisible();
    await expect(id(page, 'erdmaker-diagram').locator('g.tbl')).not.toHaveCount(0);
  });
});
test.describe('reference pages', () => {
  test('the install guides switch between the six options', async ({ page }) => {
    await page.goto('#/install'); const tabs = page.locator('[data-testid^="install-tab-"]'); await expect(tabs).toHaveCount(6);
    await tabs.nth(1).click(); await expect(id(page, 'install-panel')).toBeVisible();
  });
  test('Meet Northwind shows the full database diagram', async ({ page }) => {
    await page.goto('#/lesson/map'); await expect(page.locator('#mapErd g.tbl')).toHaveCount(13);
  });
  test('the capstone has its checklist', async ({ page }) => {
    await page.goto('#/lesson/capstone'); await expect(id(page, 'capstone-checklist')).toBeVisible();
  });
});
