// Automated accessibility checks (axe): no serious or critical problems on the main pages.
import { test, expect } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
for (const [name, route] of [['home','#/path'],['a lesson','#/lesson/joinsintro'],['an exercise','#/lesson/select'],['quizzes','#/quiz'],['free practice','#/free'],['install guides','#/install'],['SQL dialects','#/dialects'],['the Game page','#/game']]){
  test(`${name} has no serious accessibility problems`, async ({ page }) => {
    await page.route('**/game/index.html', r => r.fulfill({ body:'<!doctype html><html lang="en"><title>game</title></html>', contentType:'text/html' }));
    await page.goto(route); await page.waitForTimeout(400);
    if (route === '#/lesson/select') await page.getByTestId('tab-exercise-1').click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
    const bad = r.violations.filter(v => ['serious','critical'].includes(v.impact)).map(v => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0].target.join(' ')}`);
    expect(bad).toEqual([]);
  });
}
