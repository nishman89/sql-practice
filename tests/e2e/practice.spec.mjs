import { test, expect, id, shot } from './fixtures.mjs';

test.describe('free practice', () => {
  test('a query shows its results', async ({ page }) => {
    await test.step('Type a query into free practice', async () => { await page.goto('#/free'); await id(page, 'free-editor-input').fill('SELECT ProductName, UnitPrice FROM Products WHERE UnitPrice > 50;'); });
    await test.step('Run it, and check the 7 products over 50 are shown', async () => { await id(page, 'free-run').click(); await expect(id(page, 'free-result-table').locator('tbody tr')).toHaveCount(7); await shot(page, 'The results'); });
  });
  test('a T-SQL habit gets a friendly explanation', async ({ page }) => {
    await page.goto('#/free'); await id(page, 'free-editor-input').fill('SELECT TOP 5 ProductName FROM Products;');
    await id(page, 'free-run').click(); await expect(id(page, 'free-query-error')).toContainText('LIMIT'); await shot(page, 'The explanation');
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
// Every code editor: the text you type must stand out from its background (a past bug left the ERD maker's names nearly invisible)
test.describe('code editors are readable', () => {
  for (const [name, route, sel] of [['free practice','#/free','#fEditor'],['a lesson','#/lesson/select','#lEditor'],['Creating tables','#/lesson/build','#buildEditor'],['the ERD maker','#/erd-maker','#erdmEditor']]){
    test(`${name}: plain text contrasts with the editor`, async ({ page }) => {
      await page.goto(route); if (route === '#/lesson/select') await id(page, 'tab-exercise-1').click();
      const ratio = await page.evaluate((sel) => {
        const host = document.querySelector(sel), ta = host.querySelector('textarea'); ta.value = 'Customers'; ta.dispatchEvent(new Event('input', { bubbles: true }));
        const code = host.querySelector('pre, code') || ta, rgb = c => c.match(/[\d.]+/g).slice(0,3).map(Number);
        let el = host, bg = 'rgba(0, 0, 0, 0)'; while (el && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { bg = getComputedStyle(el).backgroundColor; el = el.parentElement; }
        const lum = ([r,g,b]) => { const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
        const a = lum(rgb(getComputedStyle(code).color)), b = lum(rgb(bg)); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
      }, sel);
      expect(ratio, 'contrast between the editor\u2019s text and background').toBeGreaterThan(4.5);
    });
  }
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
