// Every link inside the site goes somewhere real.
import { test, expect } from './fixtures.mjs';
test('every in-site link opens a page', async ({ page }) => {
  test.setTimeout(180_000);
  await page.route('**/game/index.html', r => r.fulfill({ body:'<!doctype html><title>game</title>', contentType:'text/html' }));
  const seen = new Set(), queue = ['#/path','#/intro','#/dialects','#/install','#/quiz','#/free','#/lesson/capstone'];
  while (queue.length){
    const r = queue.shift(); if (seen.has(r)) continue; seen.add(r);
    await page.goto(r); await page.waitForTimeout(150);
    await expect(page.locator('.view.on'), r).toHaveCount(1);
    if (r !== '#/path') await expect(page.getByTestId('hero'), `${r} shouldn't fall back to the home page`).toBeHidden();
    if (seen.size < 12) for (const h of await page.locator('a[href^="#/"]').evaluateAll(as => as.map(a => a.getAttribute('href')))) if (!seen.has(h) && !h.startsWith('#/quiz/')) queue.push(h);
  }
  expect(seen.size).toBeGreaterThan(40);
});
test('the downloads exist', async ({ request }) => {
  for (const f of ['downloads/northwind.db','downloads/MySQLNorthwindDatabase.sql']) expect((await request.get(f)).ok(), f).toBe(true);
});
