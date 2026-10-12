/* ---------- Quizzes ----------
   Two kinds (see src/content/quizzes.js):
   - 'query': learners write a query per task. They can run it while they work, but nothing is marked until
     they submit. Every query runs inside a SAVEPOINT that is rolled back, so a quiz can't change the data.
   - 'mcq':   multiple choice, select ONE.
   Both show one question at a time, have an optional timer, a 65% pass mark, a score by unit and a review. */
let QZ=null, qEd=null;
const LETTERS='abcd';
const fmtTime = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const unitTitle = n => UNITS[n-1] ? UNITS[n-1].title : `Unit ${n}`;
const unitOfLesson = id => { const k=UNITS.findIndex(u=>u.lessons.includes(id)); return k+1; };
const qUnit = q => q.unit || unitOfLesson(q.lesson);
const quizDef = id => QUIZZES.find(q=>q.id===id);
const quizRecord = id => (P.quizzes||{})[id];
const attemptText = a => `${a.score} of ${a.total} (${a.percent}%), ${a.passed?'passed':'not passed'}`;
const isAnsweredFor = (type, a) => type==='mcq' ? a!=null : !!stripComments(a||'').trim();
const isMcq = q => Array.isArray(q.options);
const answered = k => isAnsweredFor(isMcq(QZ.questions[k])?'mcq':'query', QZ.answers[k]);
const typeLabel = q => q.type==='mcq' ? 'Multiple choice' : q.type==='query' ? 'Write a query' : 'MCQs and queries';

/* ----- Quiz list ----- */
function quizCard(q){
    const rec=quizRecord(q.id);
    const units=[...new Set(q.questions.map(qUnit))].sort().map(unitTitle);
    return h('article',{class:'quiz-card'+(q.unitQuiz?' unit-card':''),'data-testid':`quiz-card-${q.id}`},
      h('h2',{},q.title), h('p',{},q.blurb),
      h('dl',{}, h('dt',{},'Questions'), h('dd',{'data-testid':`quiz-card-${q.id}-count`},String(q.questions.length)),
        h('dt',{},'Type'), h('dd',{}, typeLabel(q)),
        q.unitQuiz ? null : h('dt',{},'Covers'), q.unitQuiz ? null : h('dd',{},units.join(', ')),
        h('dt',{},'Last attempt'), h('dd',{'data-testid':`quiz-card-${q.id}-last`}, rec?attemptText(rec.last):'Not tried yet'),
        rec ? h('dt',{},'Best') : null, rec ? h('dd',{'data-testid':`quiz-card-${q.id}-best`}, `${rec.best.percent}%`) : null),
      h('button',{class:'btn primary',type:'button','data-go':'quiz/'+q.id,'data-testid':`open-quiz-${q.id}`}, rec?'Try again':'Start'));
}
function renderQuizList(){
  const v=$('#v-quizzes'); v.innerHTML='';
  v.append(h('h1',{class:'dot',id:'h-quizzes','data-testid':'quizzes-title'},'Quizzes'),
    h('p',{class:'lede'},`Test yourself without the hints. You won't see whether your answers are right until you submit. The pass mark is ${QUIZ_SETTINGS.passMark}%.`));
  v.append(h('h2',{class:'dot quiz-group-h'},'End-of-unit quizzes'), h('p',{class:'muted'},'A short quiz for each unit of the learning path: multiple-choice questions plus, from unit 2, a few queries to write.'));
  v.append(h('div',{class:'quiz-cards unit-cards','data-testid':'unit-quizzes'}, QUIZZES.filter(q=>q.unitQuiz).map(quizCard)));
  v.append(h('h2',{class:'dot quiz-group-h'},'Final quizzes'), h('p',{class:'muted'},'Two longer quizzes across the whole path.'));
  v.append(h('div',{class:'quiz-cards','data-testid':'final-quizzes'}, QUIZZES.filter(q=>!q.unitQuiz).map(quizCard)));
}
/* ----- One quiz ----- */
function openQuiz(id){
  stopTimer();
  const def=quizDef(id); if (!def){ goto('quiz'); return; }
  QZ={id, def, questions:def.questions, answers:[], runs:[], i:0, started:0, limit:0, phase:'start', results:null, onlyWrong:false};
  renderQuiz();
}
function renderQuiz(){
  const v=$('#v-quiz'); v.innerHTML='';
  const d=QZ.def;
  v.append(h('nav',{class:'crumbs','aria-label':'Breadcrumb'}, h('a',{href:'#/quiz','data-testid':'back-to-quizzes'},'Quizzes'), h('span',{class:'sep','aria-hidden':'true'},'/'), h('span',{},d.title)));
  v.append(h('h1',{class:'dot',id:'h-quiz','data-testid':'quiz-title'}, d.title));
  if (QZ.phase==='start') return renderQuizStart(v);
  if (QZ.phase==='doing') return renderQuizDoing(v);
  renderQuizResults(v);
}
function renderQuizStart(v){
  const d=QZ.def, rec=quizRecord(QZ.id);
  const sel=h('select',{name:'time-limit',id:'time-limit','data-testid':'time-limit'},
    d.timeLimits.map(m=>h('option',{value:String(m),selected:m===d.defaultLimit}, m?`${m} minutes`:'No time limit')));
  v.append(h('p',{class:'lede'},d.blurb));
  v.append(h('section',{class:'quiz-start','data-testid':'quiz-start'},
    h('ul',{class:'facts'},
      h('li',{}, h('b',{'data-testid':'question-count'},String(d.questions.length)), (()=>{ const m=d.questions.filter(isMcq).length, n=d.questions.length-m; return m&&n?` questions: ${m} multiple-choice and ${n} queries to write`:m?' multiple-choice questions':' query tasks'; })()),
      h('li',{}, 'Pass mark ', h('b',{'data-testid':'pass-mark'},`${QUIZ_SETTINGS.passMark}%`)),
      d.questions.some(q=>!isMcq(q)) ? h('li',{}, 'Your answer to each query task is the last query in its editor when you submit.') : null,
      d.questions.some(isMcq) ? h('li',{}, 'Select one answer for each multiple-choice question.') : null,
      h('li',{}, 'The Northwind ERD is available on every question.'),
      h('li',{}, 'Leaving this page ends the attempt without saving it.')),
    rec ? h('p',{'data-testid':'last-attempt'}, `Last attempt: ${attemptText(rec.last)}. Best: ${rec.best.percent}%.`) : null,
    h('label',{class:'field'}, h('span',{},'Time limit'), sel),
    h('button',{class:'btn primary',type:'button',id:'start-quiz','data-testid':'start-quiz',onclick:()=>startQuiz(+sel.value)},'Start the quiz')));
}
function startQuiz(limit){
  QZ.answers = QZ.questions.map(q=> isMcq(q) ? null : '');
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
  if (left<=0){ stopTimer(); closeErd(); toast('Time\'s up. Your answers have been submitted.'); submitQuiz(true); }
}
function saveCurrent(){ if (QZ && QZ.phase==='doing' && !isMcq(QZ.questions[QZ.i]) && qEd) QZ.answers[QZ.i]=qEd.value; }
function renderQuizDoing(v){
  const q=QZ.questions[QZ.i], n=QZ.questions.length, N=QZ.i+1, type=isMcq(q)?'mcq':'query';
  const navq=h('ol',{class:'qnav','aria-label':'Questions','data-testid':'question-nav'});
  QZ.questions.forEach((_,k)=>navq.append(h('li',{}, h('button',{type:'button',class:(answered(k)?'ans ':'')+(k===QZ.i?'cur':''),'aria-current':k===QZ.i?'step':null,'data-testid':`question-nav-${k+1}`,'aria-label':`Question ${k+1}${answered(k)?', answered':''}`,onclick:()=>goQ(k)}, String(k+1)))));
  v.append(navq);
  const card=h('section',{class:'qcard','data-testid':`question-${N}`,'data-unit':String(qUnit(q))});
  if (type==='mcq') card.setAttribute('data-answer', LETTERS[q.answer]); else card.setAttribute('data-solution', q.sol);
  card.append(h('div',{class:'ex-num'}, h('span',{'data-testid':`question-${N}-number`},`Question ${N} of ${n}`), h('span',{class:'qunit','data-testid':`question-${N}-unit`}, unitTitle(qUnit(q))),
      h('button',{class:'btn small erd-btn',type:'button','data-testid':`question-${N}-open-erd`,onclick:openErd},'Northwind ERD')));
  card.append(h('p',{class:'ex-prompt','data-testid':`question-${N}-prompt`}, ...fmtPrompt(type==='mcq'?q.q:q.p)));
  v.append(card);
  if (type==='mcq'){
    if (q.code) card.append(h('pre',{class:'qcode','data-testid':`question-${N}-code`}, q.code));
    card.append(h('div',{class:'q-instr','data-testid':`question-${N}-instruction`},'Select ONE'));
    const opts=h('div',{class:'mcq-opts',role:'radiogroup','aria-label':`Question ${N} options`});
    q.options.forEach((text,k)=>{
      const inp=h('input',{type:'radio',name:`question-${N}`,id:`question-${N}-option-${LETTERS[k]}`,value:LETTERS[k],'data-option':LETTERS[k],'data-testid':`question-${N}-option-${LETTERS[k]}-input`,checked:QZ.answers[QZ.i]===k});
      inp.addEventListener('change',()=>{ QZ.answers[QZ.i]=k; refreshAnswered(); });
      opts.append(h('label',{class:'mcq-opt',for:`question-${N}-option-${LETTERS[k]}`,'data-testid':`question-${N}-option-${LETTERS[k]}`}, inp, h('span',{class:'key'},LETTERS[k]+')'), h('span',{}, ...fmtPrompt(text))));
    });
    card.append(opts);
  } else {
    const edHost=h('div',{class:'editor-wrap'}); const out=h('div',{class:'out',id:'quiz-results','data-testid':`question-${N}-results`});
    v.append(edHost, out);
    qEd=makeEditor(edHost,{ label:`Your answer to question ${N}`, onRun:()=>{ saveCurrent(); const rep=runSafe(qEd.value); QZ.runs[QZ.i]=rep; renderReport(out, rep); refreshAnswered(); }, onChange:()=>{ saveCurrent(); refreshAnswered(); }, id:'quiz' });
    qEd.ta.setAttribute('data-testid',`question-${N}-input`); qEd.runBtn.setAttribute('data-testid',`question-${N}-run`);
    qEd.value=QZ.answers[QZ.i] || `-- Question ${N}\n\n`;
    if (QZ.runs[QZ.i]) renderReport(out, QZ.runs[QZ.i]); else renderReport(out, emptyRep(), {empty:'Run your query to check it does what you expect. It won\'t be marked until you submit.'});
  }
  const bar=h('div',{class:'submit-bar','data-testid':'submit-bar'},
    h('span',{class:'answered'}, h('b',{id:'answered-count','data-testid':'answered-count'},'0'), ` of ${n} answered`),
    h('div',{class:'mid'},
      h('button',{class:'btn small',type:'button',id:'previous-question','data-testid':'previous-question',disabled:QZ.i===0,onclick:()=>goQ(QZ.i-1)},'Previous'),
      h('span',{id:'question-position','data-testid':'question-position'},`${N} / ${n}`),
      h('button',{class:'btn small',type:'button',id:'next-question','data-testid':'next-question',disabled:QZ.i===n-1,onclick:()=>goQ(QZ.i+1)},'Next')),
    h('span',{class:'timer-wrap'}, QZ.limit?'Time left ':'Time ', h('b',{id:'timer','data-testid':'timer'},'')),
    h('button',{class:'btn primary',type:'button',id:'submit-answers','data-testid':'submit-answers',onclick:()=>submitQuiz(false)},'Submit answers'));
  v.append(bar);
  refreshAnswered(); tick();
}
function refreshAnswered(){
  const c=QZ.answers.filter((_,k)=>answered(k)).length; const el=$('#answered-count'); if (el) el.textContent=String(c);
  $$('.qnav button').forEach((b,k)=>b.classList.toggle('ans', answered(k)));
}
function goQ(k){ if (k<0||k>=QZ.questions.length) return; saveCurrent(); QZ.i=k; renderQuiz(); $('.qnav').scrollIntoView({block:'nearest'}); }
function runSafe(sql){
  nw.run('SAVEPOINT quiz_run');
  try { return runScript(nw, sql, 'nw'); }
  finally { nw.run('ROLLBACK TO quiz_run'); nw.run('RELEASE quiz_run'); }
}
function markQuery(q, sql){
  if (!isAnsweredFor('query', sql)) return {state:'blank', msg:'Not answered.'};
  const rep=runSafe(sql);
  if (rep.error) return {state:'wrong', msg:`Your query gave an error: ${rep.error.message}`};
  const last=rep.results[rep.results.length-1];
  if (!last) return {state:'wrong', msg:'Your query didn\'t return a result to mark.'};
  try { const v=compare(nw, q, last); return v.ok?{state:'right', msg:v.extra?'You returned some extra columns too, which is fine.':''}:{state:'wrong', msg:v.msg+(v.tip?' '+v.tip:'')}; }
  catch(e){ return {state:'wrong', msg:'Couldn\'t mark this answer: '+e.message}; }
}
function submitQuiz(timeUp){
  saveCurrent();
  const missing=QZ.answers.filter((_,k)=>!answered(k)).length;
  if (!timeUp && missing && !confirm(`You haven't answered ${missing} question${missing===1?'':'s'}. Submit anyway?`)) return;
  stopTimer();
  const marks=QZ.questions.map((q,k)=>{
    const a=QZ.answers[k];
    if (isMcq(q)) return a==null ? {state:'blank',msg:''} : {state:a===q.answer?'right':'wrong',msg:''};
    return markQuery(q, a);
  });
  const score=marks.filter(m=>m.state==='right').length, total=marks.length, percent=Math.round(score/total*100);
  const attempt={score,total,percent,passed:percent>=QUIZ_SETTINGS.passMark,seconds:elapsed(),date:new Date().toISOString(),units:{}};
  QZ.questions.forEach((q,k)=>{ const u=attempt.units[qUnit(q)]||(attempt.units[qUnit(q)]=[0,0]); u[1]++; if (marks[k].state==='right') u[0]++; });
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
  if (Object.keys(attempt.units).length>1)
    v.append(h('h2',{class:'dot',style:'margin-top:28px'},'Score by unit'), h('div',{class:'tbl-wrap'}, h('table',{class:'grid breakdown','data-testid':'unit-breakdown'}, h('thead',{},h('tr',{},h('th',{},'Unit'),h('th',{},'Score'),h('th',{},''))), tb)));
  else { const u=+Object.keys(attempt.units)[0]; $('[data-testid="results"]',v).append(h('p',{class:'small',style:'margin-top:8px'}, h('a',{href:'#/lesson/'+UNITS[u-1].lessons[0],'data-testid':'revise-unit'},`Revise unit ${u}: ${unitTitle(u)}`))); }
  const toggle=h('input',{type:'checkbox',name:'only-wrong',id:'only-wrong','data-testid':'only-wrong-toggle',checked:QZ.onlyWrong});
  toggle.addEventListener('change',()=>{ QZ.onlyWrong=toggle.checked; $$('.review',v).forEach(r=>r.hidden=QZ.onlyWrong&&r.dataset.state==='right'); });
  v.append(h('div',{class:'review-tools'}, h('h2',{class:'dot'},'Review'), h('label',{class:'toggle'}, toggle, ' Show only questions I got wrong'),
    h('div',{style:'margin-left:auto;display:flex;gap:8px;flex-wrap:wrap'}, h('button',{class:'btn primary',type:'button','data-testid':'retake',onclick:()=>openQuiz(QZ.id)},'Retake quiz'), h('button',{class:'btn',type:'button','data-go':'quiz','data-testid':'all-quizzes'},'All quizzes'))));
  QZ.questions.forEach((q,k)=>{
    const m=marks[k], N=k+1, type=isMcq(q)?'mcq':'query'; const label={right:'Correct',wrong:'Incorrect',blank:'Not answered'}[m.state];
    const r=h('article',{class:'review '+m.state,'data-state':m.state,'data-testid':`question-${N}-review`,hidden:QZ.onlyWrong&&m.state==='right'},
      h('div',{class:'ex-num'}, `Question ${N}`, h('span',{class:'qunit'}, unitTitle(qUnit(q)))),
      h('p',{class:'ex-prompt'}, ...fmtPrompt(type==='mcq'?q.q:q.p)),
      h('div',{class:'rv-verdict','data-testid':`question-${N}-verdict`}, h('b',{},label+'.'), m.msg?' '+m.msg:''));
    if (type==='mcq'){
      if (q.code) r.append(h('pre',{class:'qcode'}, q.code));
      const ul=h('ul',{class:'rv-opts'});
      q.options.forEach((text,j)=>{
        const mine=QZ.answers[k]===j, right=q.answer===j;
        ul.append(h('li',{class:(right?'is-right ':'')+(mine&&!right?'is-wrong':''),'data-testid':`question-${N}-review-option-${LETTERS[j]}`},
          h('span',{class:'key'},LETTERS[j]+')'), h('span',{}, ...fmtPrompt(text)),
          h('span',{class:'flag'}, right?'Correct answer':mine?'Your answer':'' , right&&mine?' (your answer)':'')));
      });
      r.append(ul, h('p',{class:'rv-why','data-testid':`question-${N}-explanation`}, q.why));
    } else {
      r.append(h('div',{class:'rv-cols'},
          h('div',{}, h('div',{class:'rv-h'},'Your query'), h('pre',{'data-testid':`question-${N}-your-answer`}, isAnsweredFor('query',QZ.answers[k])?QZ.answers[k].trim():'(blank)')),
          h('div',{}, h('div',{class:'rv-h'},'One possible answer'), h('pre',{'data-testid':`question-${N}-model-answer`}, q.sol))),
        h('p',{class:'rv-why','data-testid':`question-${N}-explanation`}, q.why),
        h('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},
          h('button',{class:'btn small',type:'button',onclick:()=>openFree(isAnsweredFor('query',QZ.answers[k])?QZ.answers[k]:q.sol)},'Open in Free practice'),
          h('a',{class:'btn small',href:'#/lesson/'+q.lesson},`Revise: ${LESSONS[q.lesson].title}`)));
    }
    v.append(r);
  });
}
