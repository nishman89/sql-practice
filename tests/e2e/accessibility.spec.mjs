// Automated accessibility checks (axe): no serious or critical problems on the main pages.
import { test, expect } from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
fs.mkdirSync('reports/a11y', { recursive: true });
const PAGES = [['home','#/path'],['a lesson','#/lesson/joinsintro'],['an exercise','#/lesson/select'],['quizzes','#/quiz'],['free practice','#/free'],['install guides','#/install'],['SQL dialects','#/dialects'],['the Game page','#/game']];
PAGES.forEach(([name, route], order) => {
  test(`${name} has no serious accessibility problems`, async ({ page }) => {
    await page.route('**/game/index.html', r => r.fulfill({ body:'<!doctype html><html lang="en"><title>game</title></html>', contentType:'text/html' }));
    await page.goto(route); await page.waitForTimeout(400);
    if (route === '#/lesson/select') await page.getByTestId('tab-exercise-1').click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    // everything axe found, for the Accessibility section of the test report
    const slim = v => ({ id:v.id, impact:v.impact, help:v.help, description:v.description, helpUrl:v.helpUrl, tags:v.tags, nodes:v.nodes.map(n=>({ target:n.target.join(' '), html:n.html })) });
    fs.writeFileSync(`reports/a11y/${order}.json`, JSON.stringify({ order, name: name[0].toUpperCase()+name.slice(1), route, violations:r.violations.map(slim), passes:r.passes.map(v=>({ id:v.id, help:v.help, tags:v.tags })), incomplete:r.incomplete.map(v=>({ id:v.id, help:v.help, helpUrl:v.helpUrl, nodes:v.nodes.length })) }));
    const bad = r.violations.filter(v => ['serious','critical'].includes(v.impact)).map(v => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0].target.join(' ')}`);
    expect(bad).toEqual([]);
  });
});
