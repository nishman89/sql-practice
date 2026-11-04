import { test, expect, id, shot } from './fixtures.mjs';
import { loadSite } from '../unit/helpers.mjs';
const s = await loadSite();
const quiz = s.QUIZZES.find(q => q.id === 'unit-1');

async function answerAll(page, pickRight){
  for (let n = 1; n <= quiz.questions.length; n++){
    const q = quiz.questions[n-1], want = pickRight ? q.options[q.answer] : q.options[(q.answer+1)%4];
    const opts = page.locator(`[data-testid^="question-${n}-option-"]:not([data-testid$="-input"])`);
    await opts.filter({ has: page.getByText(want, { exact: true }) }).first().click();
    if (n < quiz.questions.length) await id(page, 'next-question').click();
  }
}
test.describe('quizzes', () => {
  test('the quizzes page lists every quiz', async ({ page }) => {
    await page.goto('#/quiz');
    for (const q of s.QUIZZES) await expect(id(page, `quiz-card-${q.id}`)).toBeVisible();
  });
  test('all right answers pass, at 100%', async ({ page }) => {
    await test.step('Open the Foundations quiz and start it', async () => { await page.goto('#/quiz'); await id(page, `open-quiz-${quiz.id}`).click(); await id(page, 'start-quiz').click(); });
    await test.step(`Answer all ${quiz.questions.length} questions correctly`, () => answerAll(page, true));
    await test.step('Submit, and check the score is 100%', async () => { await id(page, 'submit-answers').click();
      await expect(id(page, 'score-percent')).toContainText('100'); await expect(id(page, 'quiz-verdict')).toBeVisible(); await shot(page, 'The result: 100%'); });
  });
  test('all wrong answers fail, with explanations to review', async ({ page }) => {
    await page.goto('#/quiz'); await id(page, `open-quiz-${quiz.id}`).click(); await id(page, 'start-quiz').click();
    await answerAll(page, false); await id(page, 'submit-answers').click();
    await expect(id(page, 'score-percent')).toContainText('0'); await expect(id(page, 'question-1-explanation')).toBeVisible();
  });
  test('"straight away" marking shows feedback after each answer', async ({ page }) => {
    await page.goto('#/quiz'); await id(page, `open-quiz-${quiz.id}`).click(); await id(page, 'mark-straight-away').click(); await id(page, 'start-quiz').click();
    const q = quiz.questions[0];
    await page.locator('[data-testid^="question-1-option-"]:not([data-testid$="-input"])').filter({ has: page.getByText(q.options[q.answer], { exact: true }) }).first().click();
    await expect(id(page, 'question-1-feedback')).toBeVisible();
  });
});
