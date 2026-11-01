// Shared set-up for the browser tests: fail on any JavaScript error, and serve the game's libraries locally
// (so a CDN outage can't break the tests; the live site still loads them from jsDelivr).
import { test as base, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const modules = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules');
const THREE = path.join(modules, 'three/build/three.min.js');
const SQLJS = path.join(modules, 'sql.js/dist/sql-asm.js');

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/three.min.js', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
    await page.route('**/sql-asm.js', r => r.fulfill({ path: SQLJS, contentType: 'text/javascript' }));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await use(page);
    expect(errors, 'no JavaScript errors on the page').toEqual([]);
  },
});
export { expect };
export const id = (page, testid) => page.getByTestId(testid);
