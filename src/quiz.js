/* ---------- Query quiz ----------
   A quiz is a list of query tasks. Learners can run their queries while they work, but nothing is
   marked until they submit. Every query runs inside a SAVEPOINT that is rolled back, so a quiz can't
   change the data. */
let QZ=null, qEd=null;
const fmtTime = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const unitTitle = n => UNITS[n-1] ? UNITS[n-1].title : `Unit ${n}`;
const isAnswered = sql => !!stripComments(sql||'').trim();

function mixQuiz(){
  const pool=[];
  for (const u of UNITS.slice(1)) for (const id of u.lessons){ const L=LESSONS[id]; if (!L.ex) continue;
    L.ex.forEach(ex=>pool.push({unit:UNITS.indexOf(u)+1, p:ex.p, sol:ex.sol, ordered:ex.ordered, why:ex.hint})); }
  for (let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  return pool.slice(0, QUIZ_SETTINGS.mixSize).sort((a,b)=>a.unit-b.unit);
}
function quizDef(id){
  if (id==='mix') return {id:'mix', title:'Mixed practice', blurb:`${QUIZ_SETTINGS.mixSize} exercises picked at random from the lessons. Different every time.`, questions:null};
  return QUIZZES.find(q=>q.id===id);
}
const quizRecord = id => (P.quizzes||{})[id];
const attemptText = a => `${a.score} of ${a.total} (${a.percent}%), ${a.passed?'passed':'not passed'}`;

/* ----- Quiz list ----- */
function renderQuizList(){
  const v=$('#v-quizzes'); v.innerHTML='';
  v.append(h('h1',{class:'dot',id:'h-quizzes','data-testid':'quizzes-title'},'Query quiz'),
    h('p',{class:'lede'},`Test yourself without the hints. Each quiz is a set of query tasks across the whole path. You can run your queries as you go, but you won't see whether they're right until you submit. The pass mark is ${QUIZ_SETTINGS.passMark}%.`));
  const grid=h('div',{class:'quiz-cards'});
  for (const q of [...QUIZZES, quizDef('mix')]){
    const rec=quizRecord(q.id); const n=q.questions?q.questions.length:QUIZ_SETTINGS.mixSize;
    const units=q.questions?[...new Set(q.questions.map(x=>x.unit))].map(unitTitle):['Any unit from 2 to 6'];
    grid.append(h('article',{class:'quiz-card','data-testid':`quiz-card-${q.id}`},
      h('h2',{},q.title), h('p',{},q.blurb),
      h('dl',{}, h('dt',{},'Questions'), h('dd',{'data-testid':`quiz-card-${q.id}-count`},String(n)), h('dt',{},'Covers'), h('dd',{},units.join(', ')),
        h('dt',{},'Last attempt'), h('dd',{'data-testid':`quiz-card-${q.id}-last`}, rec?attemptText(rec.last):'Not tried yet'),
        rec ? h('dt',{},'Best') : null, rec ? h('dd',{'data-testid':`quiz-card-${q.id}-best`}, `${rec.best.percent}%`) : null),
      h('button',{class:'btn primary',type:'button','data-go':'quiz/'+q.id,'data-testid':`open-quiz-${q.id}`}, rec?'Try again':'Start')));
  }
  v.append(grid);
}

/* ----- One quiz ----- */
function openQuiz(id){
  stopTimer();
  const def=quizDef(id); if (!def){ goto('quiz'); return; }
  QZ={id, def, questions:null, answers:[], i:0, started:0, limit:0, phase:'start', results:null, onlyWrong:false};
  renderQuiz();
}
function renderQuiz(){
  const v=$('#v-quiz'); v.innerHTML='';
  const d=QZ.def, n=d.questions?d.questions.length:QUIZ_SETTINGS.mixSize;
  v.append(h('nav',{class:'crumbs','aria-label':'Breadcrumb'}, h('a',{href:'#/quiz','data-testid':'back-to-quizzes'},'Query quiz'), h('span',{class:'sep','aria-hidden':'true'},'/'), h('span',{},d.title)));
  v.append(h('h1',{class:'dot',id:'h-quiz','data-testid':'quiz-title'}, d.title));
  if (QZ.phase==='start') return renderQuizStart(v, n);
  if (QZ.phase==='doing') return renderQuizDoing(v);
  renderQuizResults(v);
}
function renderQuizStart(v, n){
  const rec=quizRecord(QZ.id);
  const sel=h('select',{name:'time-limit',id:'time-limit','data-testid':'time-limit'},
    QUIZ_SETTINGS.timeLimits.map(m=>h('option',{value:String(m),selected:m===QUIZ_SETTINGS.defaultLimit}, m?`${m} minutes`:'No time limit')));
  v.append(h('p',{class:'lede'},QZ.def.blurb));
  v.append(h('section',{class:'quiz-start','data-testid':'quiz-start'},
    h('ul',{class:'facts'},
      h('li',{}, h('b',{'data-testid':'question-count'},String(n)), ' questions'),
      h('li',{}, 'Pass mark ', h('b',{'data-testid':'pass-mark'},`${QUIZ_SETTINGS.passMark}%`)),
      h('li',{}, 'Your answer to each question is the last query in its editor when you submit.'),
      h('li',{}, 'Leaving this page ends the attempt without saving it.')),
    rec ? h('p',{'data-testid':'last-attempt'}, `Last attempt: ${attemptText(rec.last)}. Best: ${rec.best.percent}%.`) : null,
    h('label',{class:'field'}, h('span',{},'Time limit'), sel),
    h('button',{class:'btn primary',type:'button',id:'start-quiz','data-testid':'start-quiz',onclick:()=>startQuiz(+sel.value)},'Start the quiz')));
}
function startQuiz(limit){
  QZ.questions = QZ.def.questions ? QZ.def.questions : mixQuiz();
  QZ.answers = QZ.questions.map(()=> '');
  QZ.runs = QZ.questions.map(()=>null);
  QZ.phase='doing'; QZ.i=0; QZ.limit=limit*60; QZ.started=Date.now();
  renderQuiz();
  if (QZ.limit) QZ.timer=setInterval(tick, 1000);
  tick();
}
function stopTimer(){ if (QZ && QZ.timer){ clearInterval(QZ.timer); QZ.timer=null; } }
function elapsed(){ return Math.round((Date.now()-QZ.started)/1000); }
function tick(){
  const t=$('#timer'); if (!t) return;
  if (!QZ.limit){ t.textContent=fmtTime(elapsed()); return; }
  const left=QZ.limit-elapsed();
  t.textContent=fmtTime(Math.max(0,left)); t.classList.toggle('low', left<=300);
  if (left<=0){ stopTimer(); toast('Time\'s up. Your answers have been submitted.'); submitQuiz(true); }
}
function saveCurrent(){ if (qEd && QZ && QZ.phase==='doing') QZ.answers[QZ.i]=qEd.value; }
function renderQuizDoing(v){
  const q=QZ.questions[QZ.i], n=QZ.questions.length;
  const navq=h('ol',{class:'qnav','aria-label':'Questions','data-testid':'question-nav'});
  QZ.questions.forEach((_,k)=>navq.append(h('li',{}, h('button',{type:'button',class:(isAnswered(QZ.answers[k])?'ans ':'')+(k===QZ.i?'cur':''),'aria-current':k===QZ.i?'step':null,'data-testid':`question-nav-${k+1}`,'aria-label':`Question ${k+1}${isAnswered(QZ.answers[k])?', answered':''}`,onclick:()=>goQ(k)}, String(k+1)))));
  v.append(navq);
  const card=h('section',{class:'qcard','data-testid':`question-${QZ.i+1}`,'data-solution':q.sol,'data-unit':String(q.unit)},
    h('div',{class:'ex-num'}, h('span',{'data-testid':`question-${QZ.i+1}-number`},`Question ${QZ.i+1} of ${n}`), h('span',{class:'qunit','data-testid':`question-${QZ.i+1}-unit`}, unitTitle(q.unit))),
    h('p',{class:'ex-prompt','data-testid':`question-${QZ.i+1}-prompt`}, ...fmtPrompt(q.p)));
  v.append(card);
  const edHost=h('div',{class:'editor-wrap'}); const out=h('div',{class:'out',id:'quiz-results','data-testid':`question-${QZ.i+1}-results`});
  v.append(edHost, out);
  qEd=makeEditor(edHost,{ label:`Your answer to question ${QZ.i+1}`, onRun:()=>{ saveCurrent(); const rep=runSafe(qEd.value); QZ.runs[QZ.i]=rep; renderReport(out, rep); refreshAnswered(); }, onChange:()=>{ saveCurrent(); refreshAnswered(); }, id:'quiz' });
  qEd.ta.setAttribute('data-testid',`question-${QZ.i+1}-input`); qEd.runBtn.setAttribute('data-testid',`question-${QZ.i+1}-run`);
  qEd.value=QZ.answers[QZ.i] || `-- Question ${QZ.i+1}\n\n`;
  if (QZ.runs[QZ.i]) renderReport(out, QZ.runs[QZ.i]); else renderReport(out, emptyRep(), {empty:'Run your query to check it does what you expect. It won\'t be marked until you submit.'});
  const bar=h('div',{class:'submit-bar','data-testid':'submit-bar'},
    h('span',{class:'answered'}, h('b',{id:'answered-count','data-testid':'answered-count'},'0'), ` of ${n} answered`),
    h('div',{class:'mid'},
      h('button',{class:'btn small',type:'button',id:'previous-question','data-testid':'previous-question',disabled:QZ.i===0,onclick:()=>goQ(QZ.i-1)},'Previous'),
      h('span',{id:'question-position','data-testid':'question-position'},`${QZ.i+1} / ${n}`),
      h('button',{class:'btn small',type:'button',id:'next-question','data-testid':'next-question',disabled:QZ.i===n-1,onclick:()=>goQ(QZ.i+1)},'Next')),
    h('span',{class:'timer-wrap'}, QZ.limit?'Time left ':'Time ', h('b',{id:'timer','data-testid':'timer'},'')),
    h('button',{class:'btn primary',type:'button',id:'submit-answers','data-testid':'submit-answers',onclick:()=>submitQuiz(false)},'Submit answers'));
  v.append(bar);
  refreshAnswered(); tick();
}
function refreshAnswered(){
  const c=QZ.answers.filter(isAnswered).length; const el=$('#answered-count'); if (el) el.textContent=String(c);
  $$('.qnav button').forEach((b,k)=>b.classList.toggle('ans', isAnswered(QZ.answers[k])));
}
function goQ(k){ if (k<0||k>=QZ.questions.length) return; saveCurrent(); QZ.i=k; renderQuiz(); $('.qnav').scrollIntoView({block:'nearest'}); }
function runSafe(sql){
  nw.run('SAVEPOINT quiz_run');
  try { return runScript(nw, sql, 'nw'); }
  finally { nw.run('ROLLBACK TO quiz_run'); nw.run('RELEASE quiz_run'); }
}
function submitQuiz(timeUp){
  saveCurrent();
  const missing=QZ.answers.filter(a=>!isAnswered(a)).length;
  if (!timeUp && missing && !confirm(`You haven't answered ${missing} question${missing===1?'':'s'}. Submit anyway?`)) return;
  stopTimer();
  const marks=QZ.questions.map((q,k)=>{
    const sql=QZ.answers[k];
    if (!isAnswered(sql)) return {state:'blank', msg:'Not answered.'};
    const rep=runSafe(sql);
    if (rep.error) return {state:'wrong', msg:`Your query gave an error: ${rep.error.message}`};
    const last=rep.results[rep.results.length-1];
    if (!last) return {state:'wrong', msg:'Your query didn\'t return a result to mark.'};
    try { const v=compare(nw, q, last); return v.ok?{state:'right', msg:v.extra?'Correct. You returned some extra columns too, which is fine.':'Correct.'}:{state:'wrong', msg:v.msg+(v.tip?' '+v.tip:'')}; }
    catch(e){ return {state:'wrong', msg:'Couldn\'t mark this answer: '+e.message}; }
  });
  const score=marks.filter(m=>m.state==='right').length, total=marks.length, percent=Math.round(score/total*100);
  const attempt={score,total,percent,passed:percent>=QUIZ_SETTINGS.passMark,seconds:elapsed(),date:new Date().toISOString(),units:{}};
  QZ.questions.forEach((q,k)=>{ const u=attempt.units[q.unit]||(attempt.units[q.unit]=[0,0]); u[1]++; if (marks[k].state==='right') u[0]++; });
  P.quizzes=P.quizzes||{}; const rec=P.quizzes[QZ.id]||{attempts:0,best:attempt};
  rec.attempts++; rec.last=attempt; if (attempt.percent>=rec.best.percent) rec.best=attempt; P.quizzes[QZ.id]=rec; save();
  QZ.results={marks, attempt}; QZ.phase='done'; renderQuiz(); window.scrollTo({top:0});
}
function renderQuizResults(v){
  const {marks, attempt}=QZ.results;
  v.append(h('section',{class:'results '+(attempt.passed?'pass':'fail'),'data-testid':'results'},
    h('div',{class:'verdict-big','data-testid':'quiz-verdict'}, attempt.passed?'Passed':'Not passed yet'),
    h('div',{class:'score-line'}, 'You scored ', h('b',{id:'score','data-testid':'score'},String(attempt.score)), ' out of ', h('b',{'data-testid':'score-total'},String(attempt.total)), ' (', h('span',{'data-testid':'score-percent'},`${attempt.percent}%`), `). The pass mark is ${QUIZ_SETTINGS.passMark}%.`),
    h('div',{class:'small'}, 'Time taken: ', h('span',{'data-testid':'time-taken'}, fmtTime(attempt.seconds)))));
  const tb=h('tbody');
  Object.keys(attempt.units).sort().forEach(u=>{ const [a,b]=attempt.units[u];
    tb.append(h('tr',{'data-testid':`breakdown-unit-${u}`}, h('td',{},`Unit ${u}: ${unitTitle(+u)}`), h('td',{'data-testid':`breakdown-unit-${u}-score`},`${a} of ${b}`), h('td',{}, h('a',{href:'#/lesson/'+UNITS[u-1].lessons[0]},'Revise this unit')))); });
  v.append(h('h2',{class:'dot',style:'margin-top:28px'},'Score by unit'), h('div',{class:'tbl-wrap'}, h('table',{class:'grid breakdown','data-testid':'unit-breakdown'}, h('thead',{},h('tr',{},h('th',{},'Unit'),h('th',{},'Score'),h('th',{},''))), tb)));
  const toggle=h('input',{type:'checkbox',name:'only-wrong',id:'only-wrong','data-testid':'only-wrong-toggle',checked:QZ.onlyWrong});
  toggle.addEventListener('change',()=>{ QZ.onlyWrong=toggle.checked; $$('.review',v).forEach(r=>r.hidden=QZ.onlyWrong&&r.dataset.state==='right'); });
  v.append(h('div',{class:'review-tools'}, h('h2',{class:'dot'},'Review'), h('label',{class:'toggle'}, toggle, ' Show only questions I got wrong'),
    h('div',{style:'margin-left:auto;display:flex;gap:8px;flex-wrap:wrap'}, h('button',{class:'btn primary',type:'button','data-testid':'retake',onclick:()=>openQuiz(QZ.id)},'Retake quiz'), h('button',{class:'btn',type:'button','data-go':'quiz','data-testid':'all-quizzes'},'All quizzes'))));
  QZ.questions.forEach((q,k)=>{
    const m=marks[k]; const label={right:'Correct',wrong:'Incorrect',blank:'Not answered'}[m.state];
    const r=h('article',{class:'review '+m.state,'data-state':m.state,'data-testid':`question-${k+1}-review`,hidden:QZ.onlyWrong&&m.state==='right'},
      h('div',{class:'ex-num'}, `Question ${k+1}`, h('span',{class:'qunit'}, unitTitle(q.unit))),
      h('p',{class:'ex-prompt'}, ...fmtPrompt(q.p)),
      h('div',{class:'rv-verdict','data-testid':`question-${k+1}-verdict`}, h('b',{},label+'.'), m.state==='wrong'?' '+m.msg:''),
      h('div',{class:'rv-cols'},
        h('div',{}, h('div',{class:'rv-h'},'Your query'), h('pre',{'data-testid':`question-${k+1}-your-answer`}, isAnswered(QZ.answers[k])?QZ.answers[k].trim():'(blank)')),
        h('div',{}, h('div',{class:'rv-h'},'One possible answer'), h('pre',{'data-testid':`question-${k+1}-model-answer`}, q.sol))),
      h('p',{class:'rv-why','data-testid':`question-${k+1}-explanation`}, q.why||''),
      h('button',{class:'btn small',type:'button',onclick:()=>openFree(isAnswered(QZ.answers[k])?QZ.answers[k]:q.sol)},'Open in Free practice'));
    v.append(r);
  });
}
