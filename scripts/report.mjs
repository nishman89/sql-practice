// Builds the test dashboard: playwright-report/index.html (published at /test-report/).
// It reads the browser test results (reports/e2e.json), the accessibility findings (reports/a11y/*.json),
// runs the unit tests file by file for their results, measures the build, and adds this run to the history.
// Playwright's own report is kept beside it as details.html.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (...p) => path.join(root, ...p);
const out = R('playwright-report'); fs.mkdirSync(path.join(out, 'shots'), { recursive: true }); fs.mkdirSync(R('reports'), { recursive: true });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const strip = s => String(s ?? '').replace(/\x1b\[[0-9;]*m/g, '');
const secs = ms => ms >= 60000 ? `${Math.floor(ms/60000)} min ${Math.round(ms%60000/1000)} s` : ms >= 1000 ? `${(ms/1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
const kb = b => b >= 1e6 ? `${(b/1e6).toFixed(2)} MB` : `${Math.round(b/1024)} KB`;

// ---- Playwright's own report becomes details.html
if (fs.existsSync(path.join(out, 'index.html')) && !fs.readFileSync(path.join(out, 'index.html'), 'utf8').includes('data-dashboard')) fs.renameSync(path.join(out, 'index.html'), path.join(out, 'details.html'));
const hasDetails = fs.existsSync(path.join(out, 'details.html'));

// ---- Unit tests: run each file for its results
const UNIT = [
  ['content.test.mjs', 'Course content', 'Every lesson, exercise, quiz question, dialect example, install guide and the capstone is complete, and all of its SQL runs. Also checks house style: British spellings and consistent naming.'],
  ['engine.test.mjs', 'The SQL engine', 'How learners\u2019 queries are run and marked: rows and columns in any order, with aliases and extra columns allowed, and friendly explanations when someone uses MySQL or T-SQL syntax that SQLite doesn\u2019t support.'],
  ['game.test.mjs', 'The game\u2019s logic', 'The Lost Ledger\u2019s world database and all nine puzzles (including that tapping their pieces builds a correct answer), how answers are marked and hinted, and that every map, terminal, chest and door link adds up.'],
  ['build.test.mjs', 'The build', 'The published files are all there, everything is inlined, the game loads pinned library versions, and pages stay within their size budgets.'],
];
const unit = UNIT.map(([file, title, desc]) => {
  const xml = R('reports', `unit-${file.replace('.test.mjs','')}.xml`);
  const t0 = Date.now();
  spawnSync(process.execPath, ['--test', '--test-reporter=junit', `--test-reporter-destination=${xml}`, R('tests/unit', file)], { cwd: root, encoding: 'utf8' });
  const text = fs.existsSync(xml) ? fs.readFileSync(xml, 'utf8') : '';
  const groups = [];
  for (const m of text.matchAll(/<testsuite name="([^"]*)"[^>]*>([\s\S]*?)<\/testsuite>/g)){
    const cases = [...m[2].matchAll(/<testcase name="([^"]*)" time="([^"]*)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g)].map(c => {
      const fail = c[4] && /<failure/.test(c[4]) ? strip((c[4].match(/<failure[^>]*message="([^"]*)"/)||[])[1] || 'failed') : null;
      return { name: unXml(c[1]), ms: Number(c[2])*1000, fail, skip: c[4] && /<skipped/.test(c[4]) };
    });
    groups.push({ name: unXml(m[1]), cases });
  }
  const all = groups.flatMap(g => g.cases);
  return { file, title, desc, groups, total: all.length, failed: all.filter(c => c.fail).length, skipped: all.filter(c => c.skip).length, ms: Date.now()-t0 };
});
function unXml(s){ return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'); }

// ---- Browser tests
const SPECS = {
  'navigation.spec.mjs': ['Getting around', 'Every page in the menu opens, lessons link to each other, the back button works, unknown addresses fall back to the home page, and progress is remembered after a reload.'],
  'lessons.spec.mjs': ['Every lesson\u2019s exercises', 'Each exercise\u2019s model answer is put into the real page, run, and must be marked correct; a wrong answer must be marked wrong; "Run this" examples show results.'],
  'quizzes.spec.mjs': ['Quizzes', 'The quizzes page lists every quiz; all right answers score 100%; all wrong answers fail with explanations; "straight away" marking gives feedback after each answer.'],
  'practice.spec.mjs': ['Practice tools and reference pages', 'Free practice, the step-by-step table builder (including a past bug in step 2), the ERD maker, the install guides, the Northwind diagram and the capstone.'],
  'game.spec.mjs': ['The Lost Ledger, played', 'The game played in a real browser: the title screen, Ada and the sealed door, terminals marking right and wrong answers, hints, the story\u2019s key moments, saving and Continue, and the Game page.'],
  'mobile.spec.mjs': ['On a phone', 'As a Pixel 7: the phone menu, answering an exercise, no sideways scrolling on any page, and full screen with a way back out.'],
  'links.spec.mjs': ['Links and downloads', 'Every link inside the site leads to a real page, and the downloadable databases are there.'],
  'accessibility.spec.mjs': ['Accessibility checks', 'Each page is scanned for WCAG 2 A and AA problems; serious or critical ones fail the test. Full findings are in the Accessibility section.'],
};
const e2eFile = R('reports', 'e2e.json'); const e2e = fs.existsSync(e2eFile) ? JSON.parse(fs.readFileSync(e2eFile, 'utf8')) : null;
const browser = {};
let shotN = 0;
function walk(suite, file){
  for (const sp of suite.specs || []) for (const t of sp.tests || []){
    const last = t.results[t.results.length-1] || {};
    const shots = [];
    for (const r of t.results) for (const a of r.attachments || []) if (/^image\//.test(a.contentType) && (a.body || (a.path && fs.existsSync(a.path)))){
      const name = `shot-${++shotN}.png`; fs.writeFileSync(path.join(out, 'shots', name), a.body ? Buffer.from(a.body, 'base64') : fs.readFileSync(a.path)); shots.push({ name, label: a.name === 'screenshot' ? 'At the moment it failed' : a.name });
    }
    (browser[file] ||= []).push({ title: sp.title, project: t.projectName, status: t.status, ms: t.results.reduce((s,r)=>s+(r.duration||0),0), retries: t.results.length-1,
      error: last.error ? strip(last.error.message).split('\n').slice(0,6).join('\n') : null,
      steps: (last.steps || []).filter(s => !/^(Before|After) Hooks$/.test(s.title)).map(s => ({ title: s.title, ms: s.duration, error: !!s.error })), shots });
  }
  for (const s of suite.suites || []) walk(s, file);
}
for (const s of e2e?.suites || []) walk(s, path.basename(s.file || s.title));
const btests = Object.values(browser).flat();
const bstat = { total: btests.length, passed: btests.filter(t=>t.status==='expected').length, flaky: btests.filter(t=>t.status==='flaky').length, failed: btests.filter(t=>t.status==='unexpected').length, skipped: btests.filter(t=>t.status==='skipped').length };

// ---- Accessibility findings
const A11Y_DIR = R('reports', 'a11y');
const a11y = fs.existsSync(A11Y_DIR) ? fs.readdirSync(A11Y_DIR).filter(f=>f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(A11Y_DIR, f), 'utf8'))).sort((a,b)=>a.order-b.order) : [];
const wcag = tags => [...new Set(tags.map(t => (t.match(/^wcag(\d)(\d)(\d+)$/)||[]).slice(1).join('.')).filter(Boolean))];
const level = tags => tags.includes('wcag2aaa') ? 'AAA' : tags.some(t=>/^wcag2(1|2)?aa$/.test(t)) ? 'AA' : tags.some(t=>/^wcag2(1|2)?a$/.test(t)) ? 'A' : tags.includes('best-practice') ? 'Best practice' : '';
const IMPACT = ['critical','serious','moderate','minor'];
const a11yIssues = a11y.reduce((n,p)=>n+p.violations.length, 0), a11ySerious = a11y.reduce((n,p)=>n+p.violations.filter(v=>['critical','serious'].includes(v.impact)).length, 0);

// ---- The build
const sizes = [['The website (dist/index.html)','index.html',3_000_000],['The game (dist/game/index.html)','game/index.html',400_000],['Northwind for SQLite (download)','downloads/northwind.db',null],['Northwind for MySQL (download)','downloads/MySQLNorthwindDatabase.sql',null]]
  .map(([label, f, budget]) => { const p = R('dist', f); return { label, size: fs.existsSync(p) ? fs.statSync(p).size : null, budget }; });
let stats = null;
try {
  const { loadSite, loadGame } = await import('../tests/unit/helpers.mjs'); const s = await loadSite(), g = await loadGame();
  const L = Object.values(s.LESSONS);
  stats = [['Units', s.UNITS.length], ['Lessons', L.length], ['Exercises', L.reduce((n,l)=>n+(l.ex||[]).length,0)], ['Quizzes', s.QUIZZES.length], ['Quiz questions', s.QUIZZES.reduce((n,q)=>n+q.questions.length,0)], ['Dialect comparisons', s.DIALECTS.length], ['Install guides', s.INSTALL_OPTIONS.length], ['Game places', Object.keys(g.MAPS).length], ['Game puzzles', Object.keys(g.PUZZLES).length]];
} catch(e){}

// ---- This run, and the history
const git = (cmd, env) => process.env[env] || (()=>{ try { return execSync(cmd, { cwd: root, encoding:'utf8' }).trim(); } catch { return ''; } })();
const sha = git('git rev-parse HEAD', 'GITHUB_SHA'), msg = (()=>{ try { return execSync('git log -1 --pretty=%s', { cwd: root, encoding:'utf8' }).trim(); } catch { return ''; } })();
const repo = process.env.GITHUB_REPOSITORY || 'nishman89/sql-practice', runUrl = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}` : '';
const ustat = { total: unit.reduce((n,u)=>n+u.total,0), failed: unit.reduce((n,u)=>n+u.failed,0) };
const passed = ustat.failed === 0 && ustat.total > 0 && bstat.failed === 0 && bstat.total > 0;
const now = new Date();
let history = [];
if (process.env.CI){ try { const r = await fetch(`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/test-report/history.json`); if (r.ok) history = await r.json(); } catch(e){} }
else if (fs.existsSync(path.join(out, 'history.json'))) { try { history = JSON.parse(fs.readFileSync(path.join(out, 'history.json'), 'utf8')); } catch(e){} }
history = [...history.filter(h => h.sha !== sha || !process.env.CI), { date: now.toISOString(), sha: sha.slice(0,7), passed, unit: [ustat.total-ustat.failed, ustat.total], browser: [bstat.passed+bstat.flaky, bstat.total], a11y: a11yIssues, serious: a11ySerious }].slice(-30);
fs.writeFileSync(path.join(out, 'history.json'), JSON.stringify(history, null, 1));

// ---- The page
const icon = ok => ok === 'skip' ? '<span class="st skip" aria-label="Skipped">\u2013</span>' : ok ? '<span class="st ok" aria-label="Passed">\u2713</span>' : '<span class="st bad" aria-label="Failed">\u2717</span>';
const pill = (ok, text) => `<span class="pill ${ok ? 'ok' : 'bad'}">${esc(text)}</span>`;
function chart(){
  if (history.length < 2) return '<p class="muted">The chart appears once there are a few runs to compare.</p>';
  const W = 640, H = 150, n = history.length, bw = Math.min(28, (W-40)/n - 4), maxA = Math.max(1, ...history.map(h=>h.a11y));
  const x = i => 30 + i*((W-40)/n) + 2;
  const bars = history.map((h,i)=>{ const rate = (h.unit[0]+h.browser[0])/Math.max(1,h.unit[1]+h.browser[1]); const bh = Math.max(2, rate*(H-40));
    return `<rect x="${x(i)}" y="${H-20-bh}" width="${bw}" height="${bh}" rx="3" class="${h.passed?'b-ok':'b-bad'}"><title>${esc(new Date(h.date).toLocaleString('en-GB'))} \u00b7 ${h.sha}: ${h.passed?'passed':'failed'} \u00b7 unit ${h.unit[0]}/${h.unit[1]} \u00b7 browser ${h.browser[0]}/${h.browser[1]} \u00b7 accessibility issues ${h.a11y}</title></rect>`; }).join('');
  const pts = history.map((h,i)=>`${x(i)+bw/2},${H-20-(h.a11y/maxA)*(H-40)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Results of the last ${n} runs: bars show the share of tests passing (green passed, red failed); the line shows accessibility issues found.">
    <line x1="28" y1="${H-20}" x2="${W-6}" y2="${H-20}" class="axis"/>${bars}<polyline points="${pts}" class="a11y-line"/>${history.map((h,i)=>`<circle cx="${x(i)+bw/2}" cy="${H-20-(h.a11y/maxA)*(H-40)}" r="3" class="a11y-dot"/>`).join('')}
    <text x="30" y="${H-4}" class="lbl">${esc(new Date(history[0].date).toLocaleDateString('en-GB'))}</text><text x="${W-8}" y="${H-4}" text-anchor="end" class="lbl">latest</text></svg>
    <p class="legend"><span class="key k-ok"></span>Tests passing (passed run) <span class="key k-bad"></span>Failed run <span class="key k-line"></span>Accessibility issues found</p>`;
}
const unitSection = u => `<section class="area" id="${esc(u.file)}"><h3>${icon(u.failed===0 && u.total>0)} ${esc(u.title)} <span class="count">${u.total-u.failed} / ${u.total} passed</span></h3><p>${esc(u.desc)}</p>
  ${u.groups.map(g => `<details${g.cases.some(c=>c.fail)?' open':''}><summary>${esc(g.name)} <span class="count">${g.cases.filter(c=>!c.fail).length} / ${g.cases.length}</span></summary><ul class="tests">${g.cases.map(c => `<li>${icon(c.skip?'skip':!c.fail)} ${esc(c.name)}${c.fail?`<pre class="err">${esc(c.fail)}</pre>`:''}</li>`).join('')}</ul></details>`).join('')}</section>`;
const browserSection = (file) => { const [title, desc] = SPECS[file] || [file, '']; const ts = browser[file] || []; const okN = ts.filter(t=>['expected','flaky'].includes(t.status)).length;
  return `<section class="area" id="${esc(file)}"><h3>${icon(ts.length && ts.every(t=>t.status!=='unexpected'))} ${esc(title)} <span class="count">${okN} / ${ts.length} passed</span></h3><p>${esc(desc)}</p><ul class="tests">${ts.map(t => `<li>${icon(t.status==='skipped'?'skip':t.status!=='unexpected')} ${esc(t.title)} <span class="muted">\u00b7 ${secs(t.ms)}${t.project==='mobile'?' \u00b7 phone':''}${t.status==='flaky'?' \u00b7 passed on a retry':''}</span>
    ${t.steps.length>1 ? `<details class="steps"><summary>${t.steps.length} steps</summary><ol>${t.steps.map(s=>`<li class="${s.error?'bad':''}">${esc(s.title)} <span class="muted">${secs(s.ms)}</span></li>`).join('')}</ol></details>` : ''}
    ${t.error ? `<pre class="err">${esc(t.error)}</pre>` : ''}${t.shots.length ? `<div class="shots">${t.shots.map(s=>`<figure><a href="shots/${s.name}"><img src="shots/${s.name}" alt="${esc(s.label)}" loading="lazy"></a><figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</div>` : ''}</li>`).join('')}</ul></section>`; };
const a11ySection = a11y.length ? a11y.map(p => {
  const bad = p.violations.filter(v=>['critical','serious'].includes(v.impact)).length;
  return `<section class="area"><h3>${icon(bad===0)} ${esc(p.name)} <span class="count">${p.passes.length} checks passed \u00b7 ${p.violations.length} issue${p.violations.length===1?'':'s'}${p.incomplete.length?` \u00b7 ${p.incomplete.length} to review by hand`:''}</span></h3>
    <p class="muted">Address: <code>${esc(p.route)}</code></p>
    ${p.violations.length ? `<table><thead><tr><th>Severity</th><th>Issue</th><th>Guideline</th><th>Where</th></tr></thead><tbody>${p.violations.sort((a,b)=>IMPACT.indexOf(a.impact)-IMPACT.indexOf(b.impact)).map(v => `<tr><td><span class="imp ${v.impact}">${esc(v.impact)}</span></td><td><b>${esc(v.help)}</b><br><span class="muted">${esc(v.description)}</span><br><a href="${esc(v.helpUrl)}">How to fix it</a></td><td>${esc(['WCAG '+level(v.tags), ...wcag(v.tags)].filter(x=>x!=='WCAG ').join(' \u00b7 ') || '\u2013')}</td><td>${v.nodes.length} element${v.nodes.length===1?'':'s'}, e.g. <code>${esc(v.nodes[0]?.target)}</code>${v.nodes[0]?.html?`<pre class="snip">${esc(v.nodes[0].html.slice(0,180))}</pre>`:''}</td></tr>`).join('')}</tbody></table>` : '<p class="good">No issues found.</p>'}
    ${p.incomplete.length ? `<details><summary>${p.incomplete.length} thing${p.incomplete.length===1?'':'s'} to check by hand</summary><p class="muted">The scanner couldn\u2019t decide these automatically, for example text over a background image.</p><ul>${p.incomplete.map(v=>`<li>${esc(v.help)} <span class="muted">(${v.nodes} element${v.nodes===1?'':'s'})</span> <a href="${esc(v.helpUrl)}">more</a></li>`).join('')}</ul></details>` : ''}
    <details><summary>Everything that passed (${p.passes.length} checks)</summary><ul class="cols">${p.passes.map(v=>`<li>${icon(true)} ${esc(v.help)} <span class="muted">${esc(wcag(v.tags).join(', '))}</span></li>`).join('')}</ul></details></section>`; }).join('') : '<p class="muted">The accessibility checks didn\u2019t run in this report.</p>';
const order = ['navigation.spec.mjs','lessons.spec.mjs','quizzes.spec.mjs','practice.spec.mjs','game.spec.mjs','links.spec.mjs','accessibility.spec.mjs'];
const html = `<!doctype html><html lang="en" data-dashboard><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test report \u00b7 SQL Practice Lab</title><style>
:root{ --ink:#2a2230; --muted:#6b6070; --line:#e6dfe3; --pink:#b8234b; --ok:#1e7a46; --bad:#b42318; --bg:#faf7f8; color-scheme:light }
*{ box-sizing:border-box } body{ margin:0; font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color:var(--ink); background:var(--bg) }
main{ max-width:1100px; margin:0 auto; padding:24px 18px 60px } h1{ margin:0; font-size:1.9rem } h2{ margin:36px 0 10px; font-size:1.35rem; border-bottom:2px solid var(--line); padding-bottom:6px } h3{ margin:0 0 4px; font-size:1.08rem; display:flex; gap:8px; align-items:center; flex-wrap:wrap }
a{ color:var(--pink) } code{ background:#f1eaee; padding:1px 5px; border-radius:5px; font-size:.88em } .muted{ color:var(--muted); font-size:.9em } .count{ margin-left:auto; font-weight:500; color:var(--muted); font-size:.9rem }
.banner{ border-radius:16px; padding:20px 22px; color:#fff; background:${passed?'#1e7a46':'#b42318'}; margin:14px 0 18px } .banner p{ margin:4px 0 0 } .banner a{ color:#fff }
.cards{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px } .card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px } .card b{ display:block; font-size:1.6rem; line-height:1.2 } .card span{ color:var(--muted); font-size:.92rem }
.area{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin:12px 0 } .area p{ margin:2px 0 8px }
.st{ display:inline-grid; place-items:center; width:20px; height:20px; border-radius:50%; font-size:.78rem; font-weight:700; color:#fff; flex:none } .st.ok{ background:var(--ok) } .st.bad{ background:var(--bad) } .st.skip{ background:#8a8090 }
.pill{ border-radius:999px; padding:2px 10px; font-size:.85rem; font-weight:600; color:#fff } .pill.ok{ background:var(--ok) } .pill.bad{ background:var(--bad) }
ul.tests{ list-style:none; padding:0; margin:6px 0 0 } ul.tests>li{ padding:6px 0; border-top:1px solid var(--line) } ul.tests>li:first-child{ border-top:0 }
details{ margin:6px 0 } summary{ cursor:pointer; font-weight:600 } details.steps{ margin:2px 0 0 28px } details.steps summary{ font-weight:500; color:var(--muted); font-size:.9rem } details.steps li.bad{ color:var(--bad); font-weight:600 }
pre.err{ white-space:pre-wrap; background:#fdecea; color:#7a1a12; border-radius:8px; padding:8px 10px; margin:6px 0 0 28px; font-size:.85rem } pre.snip{ white-space:pre-wrap; background:#f6f2f4; border-radius:6px; padding:4px 6px; margin:4px 0 0; font-size:.78rem }
.shots{ display:flex; gap:10px; flex-wrap:wrap; margin:8px 0 0 28px } .shots figure{ margin:0; width:220px } .shots img{ width:100%; border:1px solid var(--line); border-radius:8px; display:block } figcaption{ font-size:.8rem; color:var(--muted) }
table{ width:100%; border-collapse:collapse; font-size:.92rem } th,td{ text-align:left; vertical-align:top; padding:8px; border-top:1px solid var(--line) } th{ background:#f6f2f4 }
.imp{ border-radius:999px; padding:1px 8px; font-weight:700; font-size:.8rem; color:#fff; text-transform:capitalize } .imp.critical{ background:#7a1a12 } .imp.serious{ background:var(--bad) } .imp.moderate{ background:#9a5b00 } .imp.minor{ background:#5c6577 }
.good{ color:var(--ok); font-weight:600 } ul.cols{ columns:2 280px; padding-left:0; list-style:none } ul.cols li{ break-inside:avoid; padding:2px 0; font-size:.9rem }
svg{ width:100%; height:auto; background:#fff; border:1px solid var(--line); border-radius:14px } .b-ok{ fill:#3a9a63 } .b-bad{ fill:#d0453a } .axis{ stroke:#cfc6cc } .a11y-line{ fill:none; stroke:var(--pink); stroke-width:2 } .a11y-dot{ fill:var(--pink) } .lbl{ font-size:11px; fill:var(--muted) }
.legend{ font-size:.85rem; color:var(--muted); display:flex; gap:14px; flex-wrap:wrap; align-items:center } .key{ display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:4px; vertical-align:-1px } .k-ok{ background:#3a9a63 } .k-bad{ background:#d0453a } .k-line{ background:var(--pink); height:3px }
nav.toc{ display:flex; gap:12px; flex-wrap:wrap; font-size:.92rem; margin:8px 0 0 } .stats{ display:flex; gap:8px; flex-wrap:wrap; margin:6px 0 0 } .stats span{ background:#f1eaee; border-radius:999px; padding:2px 10px; font-size:.88rem }
</style></head><body><main>
<p class="muted"><a href="../">SQL Practice Lab</a> \u203a Test report</p>
<h1>Test report</h1>
<div class="banner" role="status"><b style="font-size:1.25rem">${passed ? 'Everything passed' : 'Something failed'}</b>
  <p>${passed ? 'This version is the one live on the site.' : 'The last version that passed is still live on the site; the details below show what failed.'}</p>
  <p>${esc(now.toLocaleString('en-GB', { dateStyle:'full', timeStyle:'short', timeZone:'Europe/London' }))} \u00b7 commit <code style="background:rgba(255,255,255,.2);color:#fff">${esc(sha.slice(0,7))}</code>${msg?` \u201c${esc(msg)}\u201d`:''}${runUrl?` \u00b7 <a href="${runUrl}">this run on GitHub</a>`:''}</p></div>
<div class="cards">
  <div class="card"><b>${ustat.total-ustat.failed} / ${ustat.total}</b><span>unit tests passed</span></div>
  <div class="card"><b>${bstat.passed+bstat.flaky} / ${bstat.total}</b><span>browser tests passed${bstat.flaky?` (${bstat.flaky} on a retry)`:''}${e2e?` \u00b7 ${secs(e2e.stats?.duration||0)}`:''}</span></div>
  <div class="card"><b>${a11ySerious ? a11ySerious+' serious' : a11y.length ? 'No serious issues' : '\u2013'}</b><span>accessibility: ${a11y.length} pages scanned, ${a11yIssues} issue${a11yIssues===1?'':'s'} in total</span></div>
  <div class="card"><b>${sizes[0].size ? kb(sizes[0].size) : '\u2013'}</b><span>website size (budget ${kb(3_000_000)})</span></div>
</div>
<nav class="toc" aria-label="On this page"><a href="#history">History</a><a href="#unit">Unit tests</a><a href="#browser">In the browser</a><a href="#phone">On a phone</a><a href="#a11y">Accessibility</a><a href="#build">Size</a>${hasDetails?'<a href="details.html">Full technical report</a>':''}<a href="unit-tests.txt">Unit test log</a></nav>
<h2 id="history">History</h2>${chart()}
<h2 id="unit">Unit tests</h2><p>Fast checks of the site\u2019s code and content, run without a browser.${stats?'':''}</p>${stats?`<div class="stats">${stats.map(([k,v])=>`<span><b>${v}</b> ${esc(k.toLowerCase())}</span>`).join('')}</div>`:''}${unit.map(unitSection).join('')}
<h2 id="browser">In the browser</h2><p>The built site, opened in a real browser (Chromium) at desktop size, and used the way a learner would.${hasDetails?' Every test has a step-by-step replay in the <a href="details.html">full technical report</a>.':''}</p>${order.filter(f=>browser[f]).map(browserSection).join('')}${Object.keys(browser).filter(f=>!order.includes(f)&&f!=='mobile.spec.mjs').map(browserSection).join('')}
<h2 id="phone">On a phone</h2>${browser['mobile.spec.mjs'] ? browserSection('mobile.spec.mjs') : '<p class="muted">The phone tests didn\u2019t run in this report.</p>'}
<h2 id="a11y">Accessibility</h2><p>Each page was scanned with <a href="https://github.com/dequelabs/axe-core">axe</a> against WCAG 2 levels A and AA. <b>Serious</b> and <b>critical</b> issues fail the tests; <b>moderate</b> and <b>minor</b> ones are listed here so they can be improved over time. Automated checks find around half of accessibility problems, so they don\u2019t replace testing with a keyboard and a screen reader.</p>${a11ySection}
<h2 id="build">Size</h2><table><thead><tr><th>File</th><th>Size</th><th>Budget</th></tr></thead><tbody>${sizes.map(s=>`<tr><td>${esc(s.label)}</td><td>${s.size?kb(s.size):'\u2013'}</td><td>${s.budget?`${pill(s.size && s.size<s.budget, s.size && s.size<s.budget ? 'within' : 'over')} ${kb(s.budget)}`:'<span class="muted">no budget</span>'}</td></tr>`).join('')}</tbody></table>
<p class="muted" style="margin-top:30px">This page is made by <code>scripts/report.mjs</code>. ${hasDetails?'<a href="details.html">Playwright\u2019s full report</a> \u00b7 ':''}<a href="history.json">history.json</a></p>
</main></body></html>`;
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`Test report: ${path.relative(root, path.join(out, 'index.html'))} (unit ${ustat.total-ustat.failed}/${ustat.total}, browser ${bstat.passed+bstat.flaky}/${bstat.total}, accessibility issues ${a11yIssues})`);
