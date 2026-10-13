/* ---------- Small helpers ---------- */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const h = (tag, attrs={}, ...kids) => { const e=document.createElement(tag); for (const [k,v] of Object.entries(attrs)) { if (k==='class') e.className=v; else if (k==='html') e.innerHTML=v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v!==false && v!=null) e.setAttribute(k, v===true?'':v); } for (const k of kids.flat()) if (k!=null) e.append(k.nodeType?k:document.createTextNode(k)); return e; };
let toastT; const toast = msg => { const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2200); };

const store = {
  key:'sqlPracticeLab.v1',
  read(){ try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch(e){ return {}; } },
  write(d){ try { localStorage.setItem(this.key, JSON.stringify(d)); } catch(e){} }
};
const P = Object.assign({ buildStep:0, buildDone:{}, exDone:{}, drafts:{}, tab:{}, quiz:{}, quizzes:{}, mapTables:[], sandbox:null, theme:null }, store.read());
const save = () => store.write(P);

/* ---------- Header, footer and back-to-top (shared look with the ISTQB study site) ---------- */
$('#footer-year').textContent=String(new Date().getFullYear());
(()=>{ const b=$('#back-to-top'); const t=()=>{ b.hidden=window.scrollY<900; }; addEventListener('scroll',t,{passive:true}); t();
  b.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})); })();
document.addEventListener('click',e=>{ const m=$('#mobile-menu'); if (m.open && (!m.contains(e.target) || e.target.closest('a'))) m.open=false; });

/* ---------- Databases ---------- */
let SQL, nw, sb;
function freshNorthwind(){ if (nw) nw.close(); nw=new SQL.Database(b64ToBytes(NW_B64)); addFns(nw); }
/* The Customers and Orders tables from Creating tables, for the lessons that build on them (db:'mydb'). Runs are always rolled back. */
let my;
function freshMyDb(){ if (my) my.close(); my=new SQL.Database(); addFns(my); my.exec(MYDB_SEED); }
const lessonDb = () => LESSONS[curLesson].db==='mydb' ? my : nw;
function freshSandbox(bytes){ if (sb) sb.close(); sb = bytes ? new SQL.Database(bytes) : new SQL.Database(); addFns(sb); }
function persistSandbox(){ try { P.sandbox = bytesToB64(sb.export()); addFns(sb); save(); } catch(e){} }

/* ---------- Rendering results ---------- */
function renderReport(el, rep, opts={}){
  el.innerHTML='';
  const tp=(el.dataset.testid||'sample').replace(/-results$/,'');
  if (rep.items.length){
    const ul=h('ul',{class:'log','data-testid':`${tp}-query-log`});
    for (const it of rep.items) ul.append(h('li',{class:it.note?'note':''}, it.note||it.ok));
    el.append(ul);
  }
  if (rep.error){
    el.append(h('div',{class:'err',role:'alert','data-testid':`${tp}-query-error`}, h('b',{},'Error'), h('code',{'data-testid':`${tp}-query-error-message`},rep.error.message), rep.error.hint?h('p',{'data-testid':`${tp}-query-error-hint`},rep.error.hint):null));
  }
  rep.results.forEach((r,i)=>{
    const box=h('div',{class:'rs','data-testid':`${tp}-result-${i+1}`});
    const label = rep.results.length>1 ? `Result ${i+1}` : 'Result';
    box.append(h('div',{class:'rs-h'}, h('span',{'data-testid':i?`${tp}-row-count-${i+1}`:`${tp}-row-count`,'data-rows':String(r.values.length)}, `${label}: ${r.values.length} row${r.values.length===1?'':'s'}`), r.values.length>500?h('span',{},'Showing the first 500'):null));
    if (!r.columns.length){ box.append(h('div',{class:'placeholder'},'The query ran but returned no rows.')); el.append(box); return; }
    const wrap=h('div',{class:'tbl-wrap',tabindex:'0','aria-label':label});
    const t=h('table',{class:'grid','data-testid':i?`${tp}-result-table-${i+1}`:`${tp}-result-table`});
    const numCol=r.columns.map((_,j)=>r.values.length>0 && r.values.slice(0,20).every(row=>row[j]==null||typeof row[j]==='number'));
    t.append(h('thead',{},h('tr',{},r.columns.map((c,j)=>h('th',{scope:'col',style:numCol[j]?'text-align:right':null},c)))));
    const tb=h('tbody');
    for (const row of r.values.slice(0,500)){
      const tr=h('tr');
      for (const v of row){
        if (v==null) tr.append(h('td',{class:'null'},'NULL'));
        else if (typeof v==='number') tr.append(h('td',{class:'num'}, Number.isInteger(v)?String(v):String(Math.round(v*10000)/10000)));
        else if (v instanceof Uint8Array) tr.append(h('td',{class:'null'},'(binary)'));
        else tr.append(h('td',{title:String(v).length>40?String(v):null}, String(v)));
      }
      tb.append(tr);
    }
    t.append(tb); wrap.append(t); box.append(wrap); el.append(box);
  });
  if (!rep.items.length && !rep.error && !rep.results.length) el.append(h('div',{class:'placeholder'}, opts.empty||'Results appear here.'));
}

/* ---------- Editor with highlighting ---------- */
const KW = new Set(('select from where and or not in is null like between as on join inner left right full outer cross group by having order asc desc limit offset distinct insert into values update set delete create table view index drop alter add column primary key foreign references constraint unique default check if exists auto_increment autoincrement identity union all case when then else end with top use database show describe integer int varchar char text real decimal numeric boolean bit date datetime smallint true false cascade natural using').split(' '));
const FN = new Set('count sum avg min max concat coalesce ifnull upper lower length len substr substring replace trim ltrim rtrim round abs year month day datediff now curdate getdate locate charindex left right date strftime instr cast'.split(' '));
function highlight(src){
  let out='', i=0; const n=src.length;
  while (i<n){
    const c=src[i];
    if (c==='-'&&src[i+1]==='-'){ let j=src.indexOf('\n',i); if(j<0)j=n; out+=`<span class="tk-com">${esc(src.slice(i,j))}</span>`; i=j; continue; }
    if (c==='/'&&src[i+1]==='*'){ let j=src.indexOf('*/',i+2); j=j<0?n:j+2; out+=`<span class="tk-com">${esc(src.slice(i,j))}</span>`; i=j; continue; }
    if (c==="'"){ let j=i+1; while(j<n){ if(src[j]==="'"){ if(src[j+1]==="'"){j+=2;continue;} break;} j++; } out+=`<span class="tk-str">${esc(src.slice(i,j+1))}</span>`; i=j+1; continue; }
    if (/[0-9]/.test(c) && !/[\w]/.test(src[i-1]||'')){ const m=src.slice(i).match(/^\d+(\.\d+)?/); out+=`<span class="tk-num">${m[0]}</span>`; i+=m[0].length; continue; }
    if (/[A-Za-z_]/.test(c)){ const m=src.slice(i).match(/^[A-Za-z_][\w]*/); const w=m[0], lw=w.toLowerCase();
      if (KW.has(lw)) out+=`<span class="tk-kw">${w}</span>`;
      else if (FN.has(lw) && /^\s*\(/.test(src.slice(i+w.length))) out+=`<span class="tk-fn">${w}</span>`;
      else out+=esc(w);
      i+=w.length; continue; }
    out+=esc(c); i++;
  }
  return out+'\n';
}
function makeEditor(host, {onRun, onChange, label, extraButtons=[], id='sql'}){
  const pre=h('pre',{'aria-hidden':'true'});
  const ta=h('textarea',{spellcheck:'false',autocapitalize:'off',autocomplete:'off','aria-label':'SQL editor',placeholder:'Write your SQL here…',id:`${id}-editor-input`,name:`${id}-sql`,'data-testid':`${id}-editor-input`});
  const runBtn=h('button',{class:'btn primary small',type:'button',id:`${id}-run`,'data-testid':`${id}-run`},'Run');
  const bar=h('div',{class:'editor-bar'}, h('span',{class:'label'}, label||'SQL'), ...extraButtons, runBtn);
  const ed=h('div',{class:'ed'}, pre, ta);
  host.innerHTML=''; host.append(bar, ed);
  const sync=()=>{ pre.innerHTML=highlight(ta.value); ta.style.height='auto'; ta.style.height=Math.max(220, ta.scrollHeight+4)+'px'; };
  ta.addEventListener('input', ()=>{ sync(); onChange&&onChange(ta.value); });
  new ResizeObserver(()=>{ if (ta.offsetWidth) sync(); }).observe(ed);
  ta.addEventListener('keydown', e=>{
    if ((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); onRun(); }
    else if (e.key==='Tab' && !e.shiftKey){ e.preventDefault(); const s=ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); sync(); onChange&&onChange(ta.value); }
  });
  runBtn.addEventListener('click', onRun);
  runBtn.title='Run (Ctrl+Enter)';
  return { get value(){ return ta.value; }, set value(v){ ta.value=v; sync(); }, focus(){ ta.focus(); }, ta, runBtn, sync, setLabel(t){ bar.querySelector('.label').textContent=t; } };
}

/* ---------- ERD rendering ---------- */
const SVGNS='http://www.w3.org/2000/svg';
const sv=(tag, attrs={}, ...kids)=>{ const e=document.createElementNS(SVGNS, tag); for (const [k,v] of Object.entries(attrs)) if (v!=null) e.setAttribute(k,v); for (const k of kids) if (k!=null) e.append(k.nodeType?k:document.createTextNode(k)); return e; };
function introspect(db){
  const res=db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
  const names=res.length?res[0].values.map(r=>r[0]):[];
  const tables=names.map(name=>{
    const ti=db.exec(`SELECT name, type, "notnull", pk FROM pragma_table_info('${name.replace(/'/g,"''")}') ORDER BY cid`);
    const cols=ti.length?ti[0].values.map(([n,t,nn,pk])=>({name:n,type:(t||'').toUpperCase(),notnull:!!nn,pk:pk>0})):[];
    const fl=db.exec(`SELECT "table","from","to" FROM pragma_foreign_key_list('${name.replace(/'/g,"''")}')`);
    const fks=fl.length?fl[0].values.map(([t,f,to])=>({table:t,from:f,to})):[];
    for (const fk of fks){ const c=cols.find(c=>c.name.toLowerCase()===fk.from.toLowerCase()); if (c) c.fk=fk; }
    return {name, cols, fks};
  });
  for (const t of tables) for (const fk of t.fks){
    const p=tables.find(x=>x.name.toLowerCase()===fk.table.toLowerCase());
    fk.parent=p?p.name:fk.table;
    if (!fk.to && p){ const pk=p.cols.find(c=>c.pk); fk.to=pk?pk.name:null; }
  }
  return tables;
}
const ROW=21, HEAD=32, CW=7.25, TW=6.7;
const badgeW = t => t.cols.some(c=>c.pk&&c.fk) ? 58 : 30;
function measure(t){
  const nameW=Math.max(...t.cols.map(c=>c.name.length),4)*CW;
  const typeW=Math.max(...t.cols.map(c=>c.type.length),0)*TW;
  const w=Math.max(176, Math.ceil(12+badgeW(t)+nameW+18+typeW+12), Math.ceil(t.name.length*8.6+28));
  return {w, h:HEAD+Math.max(1,t.cols.length)*ROW+4, nameW};
}
function autoLayout(tables){
  const lvl={}; const byName=Object.fromEntries(tables.map(t=>[t.name.toLowerCase(),t]));
  const depth=(t,seen=new Set())=>{ const k=t.name.toLowerCase(); if (lvl[k]!=null) return lvl[k]; if (seen.has(k)) return 0; seen.add(k);
    let d=0; for (const fk of t.fks){ const p=byName[fk.table.toLowerCase()]; if (p && p!==t) d=Math.max(d, depth(p,seen)+1); } return lvl[k]=d; };
  tables.forEach(t=>depth(t));
  const cols={}; tables.forEach(t=>{ (cols[lvl[t.name.toLowerCase()]] ||= []).push(t); });
  const pos={}; let x=0;
  Object.keys(cols).sort((a,b)=>a-b).forEach(k=>{
    let y=0, maxW=0;
    for (const t of cols[k]){ const m=measure(t); pos[t.name]={x,y}; y+=m.h+36; maxW=Math.max(maxW,m.w); }
    x+=maxW+96;
  });
  return pos;
}
function drawEnd(g, x, y, d, kind){
  // d = direction pointing away from the box (+1 right, -1 left)
  if (kind==='many0'||kind==='many1'){
    g.append(sv('line',{x1:x+d*13,y1:y,x2:x,y2:y-7}), sv('line',{x1:x+d*13,y1:y,x2:x,y2:y+7}), sv('line',{x1:x+d*13,y1:y,x2:x,y2:y}));
    if (kind==='many0') g.append(sv('circle',{cx:x+d*20,cy:y,r:4}));
    else g.append(sv('line',{x1:x+d*18,y1:y-7,x2:x+d*18,y2:y+7}));
  } else {
    g.append(sv('line',{x1:x+d*8,y1:y-7,x2:x+d*8,y2:y+7}));
    if (kind==='one1') g.append(sv('line',{x1:x+d*14,y1:y-7,x2:x+d*14,y2:y+7}));
    else g.append(sv('circle',{cx:x+d*18,cy:y,r:4}));
  }
}
function renderERD(host, tables, {testPrefix='erd', positions, selected, onSelect, newTables, label='Entity relationship diagram', minWidth, maxScale=1.05}={}){
  host.innerHTML='';
  if (!tables.length) return;
  const pos=positions?Object.assign(autoLayout(tables), positions):autoLayout(tables);
  const box={};
  let maxX=0, maxY=0;
  for (const t of tables){ const m=measure(t); const p=pos[t.name]||{x:0,y:0}; box[t.name]={...p, ...m}; maxX=Math.max(maxX,p.x+m.w); maxY=Math.max(maxY,p.y+m.h); }
  const pad=34, loops={};
  const left = tables.some(t=>t.fks.some(f=>f.parent===t.name)) ? 50 : 0;
  const svg=sv('svg',{class:'erd',role:'img','aria-label':label, viewBox:`${-pad-left} ${-pad} ${maxX+pad*2+60+left} ${maxY+pad*2}`, width:'100%'});
  if (minWidth) svg.style.minWidth=minWidth+'px';
  else svg.style.maxWidth=Math.round((maxX+pad*2+60+left)*maxScale)+'px';
  const relLayer=sv('g'), tblLayer=sv('g');
  svg.append(relLayer, tblLayer);
  const rowY=(t,colName)=>{ const b=box[t.name]; const i=t.cols.findIndex(c=>c.name.toLowerCase()===String(colName||'').toLowerCase()); return b.y+HEAD+(i<0?0:i)*ROW+ROW/2+2; };
  const rels=[];
  for (const t of tables) for (const fk of t.fks){
    const p=tables.find(x=>x.name===fk.parent); if (!p) continue;
    const A=box[t.name], B=box[p.name]; const fromCol=t.cols.find(c=>c.name.toLowerCase()===fk.from.toLowerCase());
    const sy=rowY(t,fk.from), ey=rowY(p,fk.to);
    let sx,ex,d1,d2,path;
    if (A.x+A.w+40<=B.x){ sx=A.x+A.w; d1=1; ex=B.x; d2=-1; const off=Math.max(36,(ex-sx)/2); path=`M${sx},${sy} C${sx+off},${sy} ${ex-off},${ey} ${ex},${ey}`; }
    else if (B.x+B.w+40<=A.x){ sx=A.x; d1=-1; ex=B.x+B.w; d2=1; const off=Math.max(36,(sx-ex)/2); path=`M${sx},${sy} C${sx-off},${sy} ${ex+off},${ey} ${ex},${ey}`; }
    else if (t===p){ sx=A.x; d1=-1; ex=A.x; d2=-1; const lx=A.x-60; path=`M${sx},${sy} C${lx},${sy} ${lx},${ey} ${ex},${ey}`; }
    else { const k=(loops[t.name]=(loops[t.name]||0)+1); sx=A.x+A.w; d1=1; ex=B.x+B.w; d2=1; const rx=Math.max(sx,ex)+30+k*14; path=`M${sx},${sy} C${rx},${sy} ${rx},${ey} ${ex},${ey}`; }
    const g=sv('g',{class:'rel','data-a':t.name,'data-b':p.name});
    g.append(sv('title',{},`${t.name}.${fk.from} references ${p.name}.${fk.to}`));
    g.append(sv('path',{d:path}));
    drawEnd(g, sx, sy, d1, 'many0');
    drawEnd(g, ex, ey, d2, fromCol&&fromCol.notnull?'one1':'one0');
    relLayer.append(g); rels.push(g);
  }
  for (const t of tables){
    const b=box[t.name];
    const g=sv('g',{class:'tbl'+(selected===t.name?' sel':'')+(newTables&&newTables.has(t.name)?' newbox':''),'data-t':t.name,'data-testid':`${testPrefix}-table-${t.name.toLowerCase().replace(/\s+/g,'-')}`,transform:`translate(${b.x},${b.y})`,tabindex:onSelect?'0':null,role:onSelect?'button':null,'aria-label':`${t.name} table, ${t.cols.length} columns`});
    g.append(sv('rect',{class:'tbl-box',x:0,y:0,width:b.w,height:b.h,rx:5}));
    g.append(sv('path',{class:'tbl-head',d:`M0,5 a5,5 0 0 1 5,-5 h${b.w-10} a5,5 0 0 1 5,5 v${HEAD-5} h${-b.w}z`}));
    g.append(sv('text',{class:'tbl-name',x:12,y:21},t.name));
    t.cols.forEach((c,i)=>{
      const y=HEAD+i*ROW+2;
      if (i>0) g.append(sv('line',{class:'rowline',x1:8,x2:b.w-8,y1:y,y2:y}));
      const cy=y+ROW/2;
      let bx=10;
      if (c.pk){ g.append(sv('rect',{class:'k-pk',x:bx,y:cy-7,width:24,height:14,rx:3})); g.append(sv('text',{class:'k-pk-t',x:bx+12,y:cy+3.3,'text-anchor':'middle'},'PK')); bx+=28; }
      if (c.fk){ g.append(sv('rect',{class:'k-fk',x:bx+.5,y:cy-6.5,width:23,height:13,rx:3})); g.append(sv('text',{class:'k-fk-t',x:bx+12,y:cy+3.3,'text-anchor':'middle'},'FK')); }
      g.append(sv('text',{class:'col',x:12+badgeW(t),y:cy+4},c.name));
      g.append(sv('text',{class:'typ',x:b.w-12,y:cy+4,'text-anchor':'end'},c.type));
    });
    g.append(sv('title',{},`${t.name}: ${t.cols.length} columns`));
    tblLayer.append(g);
    const focus=on=>{
      svg.classList.toggle('focusing',on);
      if (!on){ $$('.hot',svg).forEach(x=>x.classList.remove('hot')); return; }
      g.classList.add('hot');
      for (const r of rels) if (r.dataset.a===t.name||r.dataset.b===t.name){ r.classList.add('hot'); const o=r.dataset.a===t.name?r.dataset.b:r.dataset.a; const og=tblLayer.querySelector(`[data-t="${CSS.escape(o)}"]`); og&&og.classList.add('hot'); }
    };
    g.addEventListener('mouseenter',()=>focus(true)); g.addEventListener('mouseleave',()=>focus(false));
    g.addEventListener('focus',()=>focus(true)); g.addEventListener('blur',()=>focus(false));
    if (onSelect){ g.addEventListener('click',()=>onSelect(t.name)); g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onSelect(t.name); } }); }
  }
  host.append(svg);
  return svg;
}

/* ---------- Path progress ---------- */
const FOUND = {
  intro:{need:'Read through, then press Got it, start learning (or Mark lesson as complete).', prog:()=>[P.introDone?1:0,1], label:'Read'},
  capstone:{need:'Tick every task in the checklist when it\'s done (exercise 3 is optional).', prog:()=>{ const req=CAPSTONE_TASKS.filter(t=>!t[2]); return [req.filter(t=>(P.capstone||{})[t[0]]).length, req.length]; }, label:'Project'},
  databases:{need:'Answer all three questions in Check yourself correctly.', prog:()=>[P.dbDone?1:0,1], label:'Intro and quiz'},
  flavours:{need:'Answer all three questions in Check yourself correctly.', prog:()=>[P.flavDone?1:0,1], label:'Intro and quiz'},
  erd:{need:'Answer all three questions in Check yourself correctly.', prog:()=>[P.quizDone?1:0,1], label:'Diagram and quiz'},
  build:{need:'Complete all six steps.', prog:()=>[BUILD_STEPS.filter((s,i)=>P.buildDone[i]).length, BUILD_STEPS.length], label:'6 guided steps'},
  map:{need:'Select at least three tables in the diagram to look inside them.', prog:()=>[Math.min(3,(P.mapTables||[]).length),3], label:'Explore the diagram'}
};
function lessonProg(id){ if (FOUND[id]) return FOUND[id].prog(); const L=LESSONS[id];
  if (!L.ex) return [(P.checkDone||{})[id]?1:0, 1];
  return [L.ex.filter((_,i)=>P.exDone[id+'.'+i]).length, L.ex.length]; }
const markedDone = id => !!(P.markedDone||{})[id];
function autoDone(id){ const [a,b]=lessonProg(id); return a>=b; }
function lessonDone(id){ return autoDone(id) || markedDone(id); }
function nextLesson(){ return PATH.find(x=>!lessonDone(x.id)); }

/* ---------- Routing ---------- */
const VIEWS=['path','intro','install','capstone','databases','flavours','dialects','erd','build','map','lesson','free','quizzes','quiz'];
let current={view:'path',lesson:null};
function route(){
  const parts=location.hash.replace(/^#\/?/,'').split('/');
  let view='path', lid=null;
  if (parts[0]==='lesson' && LESSONS[parts[1]]){ lid=parts[1]; view=LESSONS[lid].kind||'lesson'; }
  else if (parts[0]==='free') view='free';
  else if (parts[0]==='dialects') view='dialects';
  else if (parts[0]==='intro'){ location.replace('#/lesson/intro'); return; }
  else if (parts[0]==='install') view='install';
  else if (parts[0]==='quiz') view = parts[1] ? 'quiz' : 'quizzes';
  if (view!=='quiz') stopTimer();
  current={view,lesson:lid};
  VIEWS.forEach(v=>$('#v-'+v).classList.toggle('on', v===view));
  const section = view==='free'?'free' : view==='dialects'?'dialects' : view==='intro'?'intro' : view==='install'?'install' : (view==='quiz'||view==='quizzes')?'quiz' : 'path';
  $$('[data-nav]').forEach(b=>{ if (b.dataset.nav===section) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  $('#pathHero').hidden = view!=='path'; $('#main').classList.toggle('on-path', view==='path');
  if (lid){ P.last=lid; save(); }
  if (view==='path') renderPath();
  if (view==='map') drawMap();
  if (view==='databases') drawDatabases();
  if (view==='intro') drawIntro();
  if (view==='install') drawInstall();
  if (view==='capstone') drawCapstone();
  if (view==='flavours') drawFlavours();
  if (view==='dialects') renderDialectTabs($('#dialectsTabs'), 'dialects');
  if (view==='build'){ buildEd.sync(); drawBuildDiff(); }
  if (view==='lesson') openLesson(lid);
  if (view==='free') fEd.sync();
  if (view==='quizzes') renderQuizList();
  if (view==='quiz') openQuiz(parts[1]);
  renderChrome();
  window.scrollTo({top:0});
  const h1=view==='path'?$('#h-path'):$('#v-'+view+' h1'); if (h1){ h1.setAttribute('tabindex','-1'); h1.focus({preventScroll:true}); }
}
addEventListener('hashchange', route);
function goto(to){ const hs = (to==='path'||to==='free'||to==='dialects'||to==='install'||to==='quiz'||to.startsWith('quiz/')) ? '#/'+to : '#/lesson/'+to; if (location.hash===hs) route(); else location.hash=hs; }
document.addEventListener('click', e=>{ const b=e.target.closest('[data-go]'); if (b){ e.preventDefault(); goto(b.dataset.go); } });

function renderChrome(){
  const cr=$('#crumbs'), foot=$('#lessonFoot');
  const id=current.lesson;
  const topNav=$('#lessonNav'); topNav.innerHTML=''; topNav.hidden=true;
  if (!id){
    foot.innerHTML='';
    const PAGE={install:'Install on your computer',dialects:'SQL dialects',quizzes:'Quizzes',free:'Free practice'}[current.view];
    if (!PAGE){ cr.hidden=true; return; }
    cr.hidden=false; cr.innerHTML='';
    cr.append(h('a',{href:'#/path','data-testid':'breadcrumb-home'},'Home'), h('span',{class:'sep','aria-hidden':'true'},'/'), h('span',{'data-testid':'breadcrumb-page'},PAGE));
    return;
  }
  const k=PATH.findIndex(x=>x.id===id), item=PATH[k], L=LESSONS[id], un=UNITS.indexOf(item.unit)+1;
  cr.hidden=false; cr.innerHTML='';
  cr.append(h('a',{href:'#/path','data-testid':'breadcrumb-home'},'Home'), h('span',{class:'sep','aria-hidden':'true'},'/'), h('span',{'data-testid':'breadcrumb-unit'},`Unit ${un}: ${item.unit.title}`), h('span',{class:'pos','data-testid':'lesson-position'}, `Lesson ${k+1} of ${PATH.length}`));
  topNav.hidden=false;
  const prevL=k>0?PATH[k-1].id:null, nextL=k<PATH.length-1?PATH[k+1].id:null;
  topNav.append(
    prevL ? h('button',{class:'ln-prev',type:'button','data-go':prevL,'data-testid':'top-previous-lesson',title:LESSONS[prevL].title}, h('span',{class:'arr','aria-hidden':'true'},'← '), h('span',{class:'lbl'},'Previous'), h('span',{class:'ttl'},': '+LESSONS[prevL].title)) : h('span',{class:'ln-gap'}),
    h('button',{class:'ln-home',type:'button','data-go':'path','data-testid':'top-home'}, h('span',{'aria-hidden':'true'},'⌂ '), 'Home'),
    nextL ? h('button',{class:'ln-next',type:'button','data-go':nextL,'data-testid':'top-next-lesson',title:LESSONS[nextL].title}, h('span',{class:'lbl'},'Next'), h('span',{class:'ttl'},': '+LESSONS[nextL].title), h('span',{class:'arr','aria-hidden':'true'},' →')) : h('span',{class:'ln-gap'}));
  foot.innerHTML='';
  const done=lessonDone(id), [a,b]=lessonProg(id), auto=autoDone(id), manual=markedDone(id);
  const setMark = v => { P.markedDone=P.markedDone||{}; if (v) P.markedDone[id]=true; else delete P.markedDone[id]; save(); refreshChrome(); toast(v?'Marked as complete':'No longer marked as complete'); };
  const mark = auto ? null : manual
    ? h('button',{class:'btn small ghost',type:'button','data-testid':'unmark-complete',onclick:()=>setMark(false)},'Undo: mark as not complete')
    : h('button',{class:'btn small mark',type:'button','data-testid':'mark-complete',onclick:()=>setMark(true)},'✓ Mark lesson as complete');
  const state = done ? h('div',{class:'state ok','data-testid':'lesson-status','data-done':'true','data-manual':String(manual&&!auto)}, manual&&!auto ? 'Marked as complete.' : 'Lesson complete.', mark?' ':'', mark||'') :
    h('div',{class:'state','data-testid':'lesson-status','data-done':'false'}, FOUND[id] ? `To complete this lesson: ${FOUND[id].need}` : `Solve all ${b} exercises to complete this lesson (${a} done).`, h('span',{class:'or'},' Or '), mark);
  const nexts=h('div',{class:'nexts'});
  if (k>0) nexts.append(h('button',{class:'btn ghost',type:'button','data-go':PATH[k-1].id,'data-testid':'previous-lesson'},'Previous lesson'));
  if (k<PATH.length-1) nexts.append(h('button',{class:'btn'+(done?' primary':''),type:'button','data-go':PATH[k+1].id,'data-testid':'next-lesson'}, `Next: ${LESSONS[PATH[k+1].id].title}`));
  else nexts.append(h('button',{class:'btn primary',type:'button','data-go':'path','data-testid':'next-lesson'},'Back to home'));
  nexts.prepend(h('button',{class:'btn ghost',type:'button','data-go':'path','data-testid':'back-home'},'Home'));
  foot.append(h('div',{class:'lfoot','data-testid':'lesson-footer'}, state, nexts));
}
function refreshChrome(){ renderChrome(); if (current.view==='lesson') renderLessonTabs(); }

/* ---------- Path page ---------- */
function renderPath(){
  const v=$('#v-path'); v.innerHTML='';
  const doneL=PATH.filter(x=>lessonDone(x.id)).length;
  const exTotal=PATH.reduce((n,x)=>n+(LESSONS[x.id].ex?LESSONS[x.id].ex.length:0),0);
  const exDone=PATH.reduce((n,x)=>n+(LESSONS[x.id].ex?lessonProg(x.id)[0]:0),0);
  const nxt=nextLesson();
  const card=h('div',{class:'hero-card','data-testid':'continue-card'});
  if (nxt){
    card.append(h('div',{class:'k'}, doneL? 'Continue with' : 'Start with'), h('div',{class:'next'}, LESSONS[nxt.id].title));
  } else card.append(h('div',{class:'k'},'Path complete'), h('div',{class:'next'},'You\'ve finished every lesson. Keep going in Free practice.'));
  const trail=h('div',{class:'trail','aria-hidden':'true'});
  UNITS.forEach((u,ui)=>{ if (ui) trail.append(h('b')); u.lessons.forEach(id=>trail.append(h('i',{class:(lessonDone(id)?'d ':'')+(nxt&&nxt.id===id?'n ':'')+(LESSONS[id].checkpoint?'cp':''),title:LESSONS[id].title}))); });
  card.append(trail, h('div',{class:'hero-stats','data-testid':'overall-progress','data-lessons-done':String(doneL),'data-exercises-done':String(exDone)}, `${doneL} of ${PATH.length} lessons complete. ${exDone} of ${exTotal} exercises solved.`));
  card.append(h('div',{style:'display:flex;gap:10px;flex-wrap:wrap;align-items:center'},
    nxt ? h('button',{class:'btn primary',type:'button','data-go':nxt.id,'data-testid':'continue'}, doneL?'Continue':'Start the path') : h('button',{class:'btn primary',type:'button','data-go':'free'},'Free practice')));
  v.append(h('div',{class:'path-hero'}, card));
  const ha=$('#heroActions'); ha.innerHTML='';
  ha.append(h('button',{class:'btn primary',type:'button','data-go':nxt?nxt.id:'free','data-testid':'hero-start'}, nxt?(doneL?'Continue learning':'Start the learning path'):'Free practice'),
    h('button',{class:'btn light',type:'button','data-go':'intro','data-testid':'hero-intro'},'How this site works'),
    h('button',{class:'btn light',type:'button','data-go':'install','data-testid':'hero-install'},'Install on your computer'),
    h('button',{class:'btn light',type:'button','data-go':'quiz','data-testid':'hero-quiz'},'Take a quiz'),
    h('button',{class:'btn light',type:'button','data-go':'free','data-testid':'hero-free'},'Free practice'));
  let num=0;
  UNITS.forEach((u,ui)=>{
    const done=u.lessons.filter(lessonDone).length;
    const ol=h('ol',{class:'route'});
    u.lessons.forEach(id=>{
      const L=LESSONS[id]; num++;
      const isDone=lessonDone(id), isNext=nxt&&nxt.id===id; const [a,b]=lessonProg(id);
      const status = isDone?'Done' : isNext?'Up next' : a>0 ? (FOUND[id]?'Started':`${a} of ${b} solved`) : (FOUND[id]?FOUND[id].label: L.ex?`${b} exercises`:`Read and ${L.check.length} questions`);
      const node=h('span',{class:'node','aria-hidden':'true'}, isDone?h('span',{class:'tick'}):h('span',{}, L.checkpoint?'':String(num)));
      ol.append(h('li',{class:(isDone?'done ':'')+(isNext?'next ':'')+(L.checkpoint?'cp':''),'data-testid':`lesson-${id}`,'data-status':isDone?'done':isNext?'next':a>0?'started':'todo'},
        h('a',{href:'#/lesson/'+id,'data-testid':`lesson-link-${id}`}, node, h('span',{class:'t'}, L.title, h('small',{},L.summary)), h('span',{class:'s','data-testid':`lesson-status-${id}`},status))));
    });
    v.append(h('section',{class:'unit','aria-label':`Unit ${ui+1}: ${u.title}`,'data-testid':`unit-${ui+1}`},
      h('div',{class:'unit-h'}, h('div',{class:'n'},`Unit ${ui+1}`), h('h2',{},u.title), h('p',{},u.blurb), h('div',{class:'meta'}, `${done} of ${u.lessons.length} lessons complete`),
        (()=>{ const uq=QUIZZES.find(q=>q.unitQuiz===ui+1); if (!uq) return null; const rec=(P.quizzes||{})[uq.id];
          return h('div',{class:'unit-quiz'}, h('button',{class:'btn small',type:'button','data-go':'quiz/'+uq.id,'data-testid':`unit-quiz-${ui+1}`}, `Unit ${ui+1} quiz`), h('span',{class:'small','data-testid':`unit-quiz-${ui+1}-score`}, rec?`Best ${rec.best.percent}%`:`${uq.questions.length} questions`)); })()),
      ol));
  });
  v.append(h('p',{class:'progress-note'}, 'Your progress is saved in this browser only. ', (doneL||exDone)?h('button',{class:'linklike',type:'button',onclick:resetAll,'data-testid':'reset-progress'},'Reset my progress'):null));
}
function resetAll(){
  if (!confirm('Reset all your progress, drafts and the tables you built? This can\'t be undone.')) return;
  const theme=P.theme; for (const k of Object.keys(P)) delete P[k];
  Object.assign(P,{buildStep:0,buildDone:{},exDone:{},drafts:{},quiz:{},theme});
  save(); freshSandbox(); persistSandbox(); prevTables=new Set(); drawBuildErd(); drawLesson(); renderBuild(); loadStepDraft(); curLesson=null; route(); toast('Progress reset');
}

/* ---------- SQL flavours lesson and the SQL dialects page ---------- */
const DTABS=[['side','Side by side'],['mysql','🐬 MySQL'],['tsql','🪟 T-SQL'],['lab','🪶 SQLite']];
function renderDialectTabs(host, tp){
  let cur=host.dataset.tab||'side';
  const draw=()=>{
    host.innerHTML=''; host.dataset.tab=cur;
    const list=h('div',{class:'dtabs',role:'tablist','aria-label':'Dialect','data-testid':`${tp}-tabs`});
    DTABS.forEach(([id,label])=>{
      const b=h('button',{type:'button',role:'tab',id:`${tp}-tab-${id}`,'aria-selected':String(cur===id),'aria-controls':`${tp}-panel`,tabindex:cur===id?'0':'-1','data-testid':`${tp}-tab-${id}`},label);
      b.addEventListener('click',()=>{ cur=id; draw(); $(`#${tp}-tab-${id}`).focus(); });
      b.addEventListener('keydown',e=>{ const k=DTABS.findIndex(t=>t[0]===cur); if (e.key==='ArrowRight'||e.key==='ArrowLeft'){ e.preventDefault(); cur=DTABS[(k+(e.key==='ArrowRight'?1:DTABS.length-1))%DTABS.length][0]; draw(); $(`#${tp}-tab-${cur}`).focus(); } });
      list.append(b);
    });
    const panel=h('div',{class:'dpanel',role:'tabpanel',id:`${tp}-panel`,'aria-labelledby':`${tp}-tab-${cur}`,'data-testid':`${tp}-panel`,'data-tab':cur});
    const tb=h('tbody'); let group=null;
    if (cur==='side'){
      DIALECTS.forEach((r,i)=>{
        if (r.group!==group){ group=r.group; tb.append(h('tr',{class:'grp'}, h('th',{colspan:'4',scope:'colgroup'}, group))); }
        tb.append(h('tr',{'data-testid':`${tp}-row-${i+1}`}, h('td',{},r.task), h('td',{html:r.mysql}), h('td',{html:r.tsql}), h('td',{class:'this-col',html:r.lab})));
      });
      panel.append(h('div',{class:'tbl-wrap'}, h('table',{class:'mini dialect-table'}, h('thead',{},h('tr',{},h('th',{},'Task'),h('th',{},'🐬 MySQL'),h('th',{},'🪟 T-SQL'),h('th',{class:'this-col'},'🪶 SQLite'))), tb)));
    } else {
      const info=DIALECT_INFO[cur];
      panel.append(h('p',{class:'dinfo'}, h('b',{},info.name+'. '), info.who+' ', h('span',{class:'muted'},`Tool: ${info.tool}.`)));
      DIALECTS.forEach((r,i)=>{
        if (r.group!==group){ group=r.group; tb.append(h('tr',{class:'grp'}, h('th',{colspan:cur==='lab'?'3':'2',scope:'colgroup'}, group))); }
        const tr=h('tr',{'data-testid':`${tp}-row-${i+1}`}, h('td',{},r.task), h('td',{html:r[cur]}));
        if (cur==='lab') tr.append(h('td',{}, r.try ? h('button',{class:'btn small',type:'button','data-testid':`${tp}-try-${i+1}`,onclick:()=>openFree(r.try)},'Try it') : ''));
        tb.append(tr);
      });
      const head=h('tr',{},h('th',{},'Task'),h('th',{},info.name)); if (cur==='lab') head.append(h('th',{},''));
      panel.append(h('div',{class:'tbl-wrap'}, h('table',{class:'mini dialect-table'}, h('thead',{},head), tb)));
    }
    host.append(list, panel);
  };
  draw();
}
function renderCheck(form, Q, tp, saved, onAnswer){
  form.innerHTML='';
  Q.forEach((item,qi)=>{
    const fs=h('fieldset',{class:'q','data-testid':`${tp}-question-${qi+1}`,'data-answer':'abc'[item.c]}, h('legend',{},`${qi+1}. ${item.q}`));
    const fb=h('div',{class:'fb','aria-live':'polite','data-testid':`${tp}-question-${qi+1}-feedback`});
    const mark=(ai, silent)=>{
      $$('label',fs).forEach((l,i)=>{ l.classList.remove('right','wrong'); if (i===ai) l.classList.add(ai===item.c?'right':'wrong'); });
      $$('input',fs)[ai].checked=true;
      fb.className='fb '+(ai===item.c?'good':'bad');
      fb.textContent=ai===item.c?'Correct. '+item.why:'Not quite. Try another answer.';
      if (!silent) onAnswer(qi, ai);
    };
    item.a.forEach((txt,ai)=>{
      const inp=h('input',{type:'radio',name:`${tp}-q${qi}`,value:ai,'data-testid':`${tp}-question-${qi+1}-option-${'abc'[ai]}-input`});
      inp.addEventListener('change',()=>mark(ai));
      fs.append(h('label',{'data-testid':`${tp}-question-${qi+1}-option-${'abc'[ai]}`}, inp, h('span',{},txt)));
    });
    fs.append(fb); form.append(fs);
    if (saved[qi]!=null) mark(saved[qi], true);
  });
}
const drawBuildDiff = () => { const el=$('#buildDiff'); if (el && !el.childElementCount) el.innerHTML=BUILD_DIFF(); };
/* Install on your computer: one tab per setup guide, with a Copy button on every command */
let installTab = INSTALL_OPTIONS[0].id;
function addCopyButtons(root){
  $$('pre.cmd',root).forEach(pre=>{
    if (pre.parentElement.classList.contains('cmd-wrap')) return;
    const wrap=h('div',{class:'cmd-wrap'}); pre.replaceWith(wrap); wrap.append(pre);
    const b=h('button',{class:'btn small copy',type:'button','data-testid':'copy-command'},'Copy');
    b.addEventListener('click',async()=>{ try { await navigator.clipboard.writeText(pre.textContent); b.textContent='Copied'; } catch(e){ const r=document.createRange(); r.selectNodeContents(pre); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent='Selected: press Ctrl+C'; } setTimeout(()=>b.textContent='Copy',1800); });
    wrap.append(b);
  });
}
function drawInstall(){
  const intro=$('#installIntro');
  if (!intro.childElementCount){
    intro.innerHTML=INSTALL_INTRO;
    // Option names in the chooser open that guide's tab
    intro.addEventListener('click',e=>{ const b=e.target.closest('[data-install-tab]'); if (!b) return; installTab=b.dataset.installTab; drawInstall(); $('#installTabs').scrollIntoView({behavior:'smooth',block:'start'}); $(`#install-tab-${installTab}`).focus({preventScroll:true}); });
  }
  const host=$('#installTabs'); host.innerHTML='';
  const list=h('div',{class:'install-menu',role:'tablist','aria-label':'Setup guides','aria-orientation':'vertical'});
  const GROUP={'docker-sqlserver':'🪟 T-SQL (SQL Server)','windows-sqlserver':'🪟 T-SQL (SQL Server)','windows-mysql':'🐬 MySQL','mac-mysql':'🐬 MySQL','docker-mysql':'🐬 MySQL','sqlite':'🪶 SQLite'};
  let lastGroup=null;
  INSTALL_OPTIONS.forEach(o=>{
    if (GROUP[o.id]!==lastGroup){ lastGroup=GROUP[o.id]; list.append(h('div',{class:'install-group',role:'presentation'},lastGroup)); }
    const b=h('button',{type:'button',role:'tab',id:`install-tab-${o.id}`,'aria-selected':String(o.id===installTab),'aria-controls':'install-panel',tabindex:o.id===installTab?'0':'-1','data-testid':`install-tab-${o.id}`}, h('span',{class:'im-name'},o.tab.replace(/^\S+\s/,'')), h('span',{class:'im-os',html:o.os}));
    b.addEventListener('click',()=>{ installTab=o.id; drawInstall(); $(`#install-tab-${o.id}`).focus(); });
    b.addEventListener('keydown',e=>{ const k=INSTALL_OPTIONS.findIndex(x=>x.id===installTab); if (['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)){ e.preventDefault(); const fwd=e.key==='ArrowRight'||e.key==='ArrowDown'; installTab=INSTALL_OPTIONS[(k+(fwd?1:INSTALL_OPTIONS.length-1))%INSTALL_OPTIONS.length].id; drawInstall(); $(`#install-tab-${installTab}`).focus(); } });
    list.append(b);
  });
  const o=INSTALL_OPTIONS.find(x=>x.id===installTab);
  const panel=h('section',{class:'install-panel',role:'tabpanel',id:'install-panel','aria-labelledby':`install-tab-${o.id}`,'data-testid':'install-panel','data-guide':o.id});
  panel.innerHTML=`<div class="install-head"><h2>${o.title}</h2><div class="os-tags">${o.os}</div></div><p class="install-summary">${o.summary}</p>${o.body}`;
  host.append(h('div',{class:'install-layout'}, list, panel));
  addCopyButtons(panel);
}
function drawCapstone(){
  const b=$('#capstoneBody'); if (!b.childElementCount) b.innerHTML=CAPSTONE_HTML;
  P.capstone=P.capstone||{};
  const ul=$('#capChecklist'); ul.innerHTML='';
  CAPSTONE_TASKS.forEach(([id,label,optional])=>{
    const cb=h('input',{type:'checkbox',id:`cap-${id}`,name:`capstone-${id}`,'data-testid':`capstone-task-${id.replace('.','-')}`,checked:!!P.capstone[id]});
    cb.addEventListener('change',()=>{ P.capstone[id]=cb.checked; save(); refreshChrome(); });
    ul.append(h('li',{class:optional?'optional':''}, h('label',{for:`cap-${id}`}, cb, h('span',{},label), optional?h('em',{class:'opt'},'optional'):'')));
  });
}
$('#capPrint').addEventListener('click',()=>window.print());
function drawIntro(){
  const b=$('#introBody'); b.innerHTML=SITE_INTRO;
  const go=$('#introStart'); go.onclick=()=>{ P.introDone=true; save(); goto('databases'); };
  const slot=$('[data-intro-erd]',b); if (slot) slot.append(erdButton('intro-open-erd'));
}
function drawDatabases(){
  $('#databasesBody').innerHTML=DATABASES_LEARN;
  P.dbQuiz=P.dbQuiz||{};
  renderCheck($('#databasesCheck'), DATABASES_CHECK, 'databases-check', P.dbQuiz, (qi,ai)=>{
    P.dbQuiz[qi]=ai; P.dbDone=DATABASES_CHECK.every((x,i)=>P.dbQuiz[i]===x.c); save(); refreshChrome();
  });
}
$('#databasesPeek').addEventListener('click',()=>openFree('SELECT *\nFROM Customers\nLIMIT 10;'));
function drawFlavours(){
  $('#flavoursBody').innerHTML=FLAVOURS_LEARN;
  renderDialectTabs($('#flavoursTabs'), 'flavours');
  P.flavQuiz=P.flavQuiz||{};
  renderCheck($('#flavoursCheck'), FLAVOURS_CHECK, 'flavours-check', P.flavQuiz, (qi,ai)=>{
    P.flavQuiz[qi]=ai; P.flavDone=FLAVOURS_CHECK.every((x,i)=>P.flavQuiz[i]===x.c); save(); refreshChrome();
  });
}

/* ---------- 1. ERD lesson ---------- */
const LESSON_MODEL = [
  {name:'Customers', cols:[{name:'customer_id',type:'INTEGER',pk:true,notnull:true},{name:'customer_name',type:'TEXT',notnull:true},{name:'height',type:'REAL'},{name:'is_happy',type:'INTEGER'}], fks:[]},
  {name:'Orders', cols:[{name:'order_id',type:'INTEGER',pk:true,notnull:true},{name:'order_number',type:'INTEGER',notnull:true},{name:'customer_id',type:'INTEGER',fk:{}}], fks:[{table:'Customers',parent:'Customers',from:'customer_id',to:'customer_id'}]}
];
function drawLesson(){
  renderERD($('#erdLessonFig'), LESSON_MODEL, {testPrefix:'example', maxScale:1.35, label:'ERD of Customers and Orders, joined on customer_id'});
  const items=[['one1','Exactly one','one and only one'],['one0','Zero or one','optional'],['many1','One or many','at least one'],['many0','Zero or many','optional, any number']];
  const lg=$('#legend'); lg.innerHTML='';
  for (const [k,t,s] of items){
    const svg=sv('svg',{class:'erd',width:120,height:34,viewBox:'0 0 120 34','aria-hidden':'true'});
    const g=sv('g',{class:'rel'}); g.append(sv('path',{d:'M8,17 H102'})); drawEnd(g, 102, 17, -1, k);
    svg.append(sv('rect',{x:102,y:4,width:14,height:26,rx:2,fill:'var(--erd-head)'}), g);
    lg.append(h('div',{}, svg, h('b',{},t), h('span',{},s)));
  }
  const Q=[
    {q:'Which table holds the foreign key?', a:['Customers','Orders','Both of them'], c:1, why:'The foreign key always sits on the "many" side. Orders.customer_id points at Customers.'},
    {q:'How many orders can one customer have?', a:['Exactly one','Zero or one','Zero or many'], c:2, why:'The crow\'s foot with a circle, next to Orders, means zero or many.'},
    {q:'Why can no two customers share a customer_id?', a:['It\'s the primary key','It\'s a foreign key','It\'s an INT column'], c:0, why:'Primary keys must be unique and can\'t be NULL, so every row is identifiable.'}
  ];
  const f=$('#erdQuiz'); f.innerHTML='';
  P.quiz=P.quiz||{};
  Q.forEach((item,qi)=>{
    const fs=h('fieldset',{class:'q','data-testid':`check-question-${qi+1}`,'data-answer':'abc'[item.c]}, h('legend',{},`${qi+1}. ${item.q}`));
    const fb=h('div',{class:'fb','aria-live':'polite','data-testid':`check-question-${qi+1}-feedback`});
    item.a.forEach((txt,ai)=>{
      const inp=h('input',{type:'radio',name:'q'+qi,value:ai,'data-testid':`check-question-${qi+1}-option-${'abc'[ai]}-input`});
      const lab=h('label',{'data-testid':`check-question-${qi+1}-option-${'abc'[ai]}`}, inp, h('span',{},txt));
      inp.addEventListener('change',()=>mark(ai));
      fs.append(lab);
    });
    fs.append(fb); f.append(fs);
    function mark(ai, silent){
      $$('label',fs).forEach((l,i)=>{ l.classList.remove('right','wrong'); if (i===ai) l.classList.add(ai===item.c?'right':'wrong'); });
      $$('input',fs)[ai].checked=true;
      fb.className='fb '+(ai===item.c?'good':'bad');
      fb.textContent=(ai===item.c?'Correct. ':'Not quite. ')+(ai===item.c?item.why:'Look at the diagram again and try another answer.');
      if (!silent){ P.quiz[qi]=ai; P.quizDone = Q.every((x,i)=>P.quiz[i]===x.c); save(); refreshChrome(); }
    }
    if (P.quiz[qi]!=null) mark(P.quiz[qi], true);
  });
}

/* ---------- 2. Build ---------- */
const findT=(tables,n)=>tables.find(t=>t.name.toLowerCase()===n);
const findC=(t,n)=>t&&t.cols.find(c=>c.name.toLowerCase()===n);
const count=(n)=>{ try { return sb.exec(`SELECT COUNT(*) FROM "${n}"`)[0].values[0][0]; } catch(e){ return 0; } };
const tName=(tables,n)=>{ const t=findT(tables,n); return t?t.name:n; };
let buildLast={rep:null};
const BUILD_STEPS=[
  { short:'Customers', title:'Create the Customers table',
    why:'Every table needs a name, its columns, and a type for each column. SQLite\'s main types are INTEGER, REAL (decimals) and TEXT. customer_id is the primary key, and AUTOINCREMENT makes the database fill it in for you.',
    starter:'-- Create a Customers table with:\n--   customer_id    a whole number, primary key, auto-incrementing\n--   customer_name  text, required\n--   height         a decimal number\n--   is_happy       true or false (1 or 0)\n\n',
    mysql:`DROP DATABASE IF EXISTS my_db;\nCREATE DATABASE my_db;\nUSE my_db;\n\nCREATE TABLE Customers (\n    customer_id    INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,\n    customer_name  VARCHAR(255) NOT NULL,\n    height         DECIMAL(7,3),\n    is_happy       BOOLEAN\n);`,
    tsql:`CREATE DATABASE my_db;\nUSE my_db;\n\nCREATE TABLE Customers (\n    customer_id    INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,\n    customer_name  VARCHAR(255) NOT NULL,\n    height         DECIMAL(7,3),\n    is_happy       BIT\n);`,
    diffNote:'SQLite needs no <code>CREATE DATABASE</code> or <code>USE</code>: the database is a single file, and you\'re already in it.',
    example:`DROP TABLE IF EXISTS Orders;\nDROP TABLE IF EXISTS Customers;\n\nCREATE TABLE Customers (\n    customer_id    INTEGER PRIMARY KEY AUTOINCREMENT,\n    customer_name  TEXT NOT NULL,\n    height         REAL,\n    is_happy       INTEGER\n);`,
    checks:T=>{ const c=findT(T,'customers'); return [
      ['A table called Customers exists', !!c],
      ['customer_id is the primary key', !!(findC(c,'customer_id')||{}).pk],
      ['customer_name is NOT NULL', !!(findC(c,'customer_name')||{}).notnull],
      ['It has height and is_happy columns', !!(findC(c,'height')&&findC(c,'is_happy'))]
    ]; } },
  { short:'Orders and FK', title:'Create Orders with a foreign key',
    why:'The FOREIGN KEY line is what draws the relationship. It tells the database that Orders.customer_id must match a customer_id that exists in Customers.',
    starter:'-- Create an Orders table with:\n--   order_id      primary key, auto-incrementing\n--   order_number  a whole number, required\n--   customer_id   a whole number that links to Customers\n\n',
    mysql:`CREATE TABLE Orders (\n    order_id     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,\n    order_number INT NOT NULL,\n    customer_id  INT,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n);`,
    tsql:`CREATE TABLE Orders (\n    order_id     INT NOT NULL IDENTITY(1,1) PRIMARY KEY,\n    order_number INT NOT NULL,\n    customer_id  INT,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n);`,
    diffNote:'The <code>FOREIGN KEY … REFERENCES</code> line is the same in all three.',
    example:`CREATE TABLE Orders (\n    order_id     INTEGER PRIMARY KEY AUTOINCREMENT,\n    order_number INTEGER NOT NULL,\n    customer_id  INTEGER,\n    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)\n);`,
    checks:T=>{ const o=findT(T,'orders'); const fk=o&&o.fks.find(f=>f.from.toLowerCase()==='customer_id'&&f.table.toLowerCase()==='customers'); return [
      ['A table called Orders exists', !!o],
      ['order_id is the primary key', !!(findC(o,'order_id')||{}).pk],
      ['order_number is NOT NULL', !!(findC(o,'order_number')||{}).notnull],
      ['customer_id is a foreign key to Customers', !!fk]
    ]; } },
  { short:'Insert data', title:'Insert some data',
    why:'Leave customer_id out of the Customers insert: the database generates it. Each order then uses a customer_id that already exists.',
    starter:'-- Add three customers, then six orders that belong to them\n\n',
    mysql:`INSERT INTO Customers (customer_name, height, is_happy) VALUES\n('Nish Mandal',    1.85, TRUE),\n('Cathy French',   1.70, FALSE),\n('Rich Gurney',    1.80, TRUE);\n\nINSERT INTO Orders (order_number, customer_id) VALUES\n(1001, 1), (1002, 2), (1003, 3),\n(1004, 1), (1005, 2), (1006, 3);`,
    tsql:`INSERT INTO Customers (customer_name, height, is_happy) VALUES\n('Nish Mandal',    1.85, 1),\n('Cathy French',   1.70, 0),\n('Rich Gurney',    1.80, 1);\n\nINSERT INTO Orders (order_number, customer_id) VALUES\n(1001, 1), (1002, 2), (1003, 3),\n(1004, 1), (1005, 2), (1006, 3);`,
    diffNote:'A <code>BIT</code> column in T-SQL takes <code>1</code> and <code>0</code>, not <code>TRUE</code> and <code>FALSE</code>.',
    example:`INSERT INTO Customers (customer_name, height, is_happy) VALUES\n('Nish Mandal',    1.85, TRUE),\n('Cathy French',   1.70, FALSE),\n('Rich Gurney',    1.80, TRUE);\n\nINSERT INTO Orders (order_number, customer_id) VALUES\n(1001, 1),\n(1002, 2),\n(1003, 3),\n(1004, 1),\n(1005, 2),\n(1006, 3);\n\nSELECT * FROM Customers;`,
    checks:T=>{ const c=findT(T,'customers'), o=findT(T,'orders'); const nc=c?count(c.name):0, no=o?count(o.name):0; return [
      [`Customers has at least 3 rows (now ${nc})`, nc>=3],
      [`Orders has at least 6 rows (now ${no})`, no>=6]
    ]; } },
  { short:'Join', title:'Query across both tables',
    why:'A JOIN matches rows where Orders.customer_id equals Customers.customer_id, so you can see each order next to its customer\'s name.',
    starter:'-- Find all orders placed by Nish Mandal,\n-- showing order_id, order_number and customer_name\n\n',
    same:true, diffNote:'Joins are written the same way in all three.',
    example:`SELECT Orders.order_id, Orders.order_number, Customers.customer_name\nFROM Orders\nJOIN Customers ON Orders.customer_id = Customers.customer_id\nWHERE Customers.customer_name = 'Nish Mandal';`,
    checks:()=>{ const r=buildLast.rep; const sqlRan=(r&&r.ran.join(' '))||''; const last=r&&r.results[r.results.length-1];
      const hasNish=!!(last&&last.values.length&&last.values.every(row=>row.some(v=>v==='Nish Mandal')));
      return [
      ['Your last run used a JOIN', /\bJOIN\b/i.test(sqlRan)],
      ['It returned only Nish Mandal\'s orders', hasNish]
    ]; } },
  { short:'FK in action', title:'See the foreign key protect you',
    why:'Try to add an order for customer 99, who doesn\'t exist. The foreign key constraint should reject it, which is exactly the point: no orphaned orders.',
    starter:'-- Insert an order for a customer_id that doesn\'t exist\n\n',
    same:true, diffNote:'The statement is the same in all three, and all three refuse it. Only the wording of the error message differs.',
    example:`INSERT INTO Orders (order_number, customer_id) VALUES (1007, 99);`,
    checks:()=>[
      ['The database rejected an order for a customer that doesn\'t exist', !!P.fkSeen]
    ] },
  { short:'ALTER TABLE', title:'Add columns with ALTER TABLE',
    why:'ALTER TABLE changes an existing table. SQLite adds one column per statement. Re-running your CREATE TABLE script is usually better practice, but ALTER is handy for quick changes. Watch the new columns appear on the diagram.',
    starter:'-- Add an email column (text) and an age column (whole number) to Customers\n\n',
    mysql:`ALTER TABLE Customers\n    ADD COLUMN email VARCHAR(255),\n    ADD COLUMN age   INT;`,
    tsql:`ALTER TABLE Customers\n    ADD email VARCHAR(255), age INT;`,
    diffNote:'SQLite adds one column per <code>ALTER TABLE</code>; MySQL and T-SQL can add several at once.',
    example:`ALTER TABLE Customers ADD COLUMN email TEXT;\nALTER TABLE Customers ADD COLUMN age INTEGER;`,
    checks:T=>{ const c=findT(T,'customers'); return [
      ['Customers has an email column', !!findC(c,'email')],
      ['Customers has an age column', !!findC(c,'age')]
    ]; } }
];
let buildEd, prevTables=new Set();
function stepChecks(i){ return BUILD_STEPS[i].checks(introspect(sb)); }
function renderBuild(){
  const tabs=$('#buildTabs'); tabs.innerHTML='';
  BUILD_STEPS.forEach((s,i)=>{
    const b=h('button',{type:'button',class:P.buildDone[i]?'done':'','aria-current':P.buildStep===i?'step':null,title:s.title,'data-testid':`build-step-${i+1}`,'data-done':String(!!P.buildDone[i])}, h('span',{class:'n'},String(i+1)), s.short);
    b.addEventListener('click',()=>{ P.buildStep=i; save(); renderBuild(); loadStepDraft(); });
    tabs.append(h('li',{},b));
  });
  const i=P.buildStep, s=BUILD_STEPS[i];
  const card=$('#stepCard'); card.innerHTML='';
  card.append(h('h2',{}, `${i+1}. ${s.title}`), h('p',{class:'why'}, s.why));
  const checks=stepChecks(i); const allOk=checks.every(c=>c[1]);
  if (allOk && !P.buildDone[i]){ P.buildDone[i]=true; save(); refreshChrome(); setTimeout(renderBuild); }
  const ul=h('ul',{class:'checks','aria-label':'Step checklist','data-testid':'step-checklist'});
  checks.forEach(([t,ok],ci)=>ul.append(h('li',{class:ok?'ok':'','data-testid':`step-check-${ci+1}`,'data-done':String(ok)}, h('span',{class:'ic','aria-hidden':'true'}), h('span',{}, t, h('span',{class:'sr'}, ok?' (done)':' (not yet)')))));
  card.append(ul);
  card.append(h('details',{class:'step-answers','data-testid':'step-dialect-answers'}, h('summary',{},'Sample answer in each dialect'),
    h('div',{html: DIFF({sqlite:s.example, mysql:s.same?s.example:s.mysql, tsql:s.same?s.example:s.tsql, note:s.diffNote}) })));
  if (P.buildDone[i]){
    const nxt=i<BUILD_STEPS.length-1;
    card.append(h('div',{class:'step-done'}, 'Step complete.', nxt?h('button',{class:'btn small primary',type:'button',onclick:()=>{ P.buildStep=i+1; save(); renderBuild(); loadStepDraft(); }},'Next step'):h('button',{class:'btn small primary',type:'button','data-go':'keys'},'Next: Primary and foreign keys')));
  }
}
function loadStepDraft(){
  const k='build'+P.buildStep; buildEd.value = P.drafts[k]!=null ? P.drafts[k] : BUILD_STEPS[P.buildStep].starter;
  buildEd.setLabel(`Step ${P.buildStep+1}: your SQL`);
  renderReport($('#buildOut'), {items:[],results:[],notes:[],error:null}, {empty:'Run your SQL to see what happened.'});
}
function drawBuildErd(){
  const T=introspect(sb); const host=$('#buildErd');
  if (!T.length){ host.innerHTML=`<div class="erd-empty"><svg width="56" height="44" viewBox="0 0 56 44" aria-hidden="true"><rect x="1" y="1" width="54" height="42" rx="4" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/></svg><p>No tables yet. Run a CREATE TABLE statement and it'll appear here.</p></div>`; prevTables=new Set(); return; }
  const now=new Set(T.map(t=>t.name)); const fresh=new Set([...now].filter(n=>!prevTables.has(n)));
  renderERD(host, T, {testPrefix:'build', newTables:fresh, label:'ERD of the tables you have created'});
  prevTables=now;
}
function runBuild(){
  const src=buildEd.value;
  const rep=runScript(sb, src, 'sandbox', {onReset:()=>{ freshSandbox(); return sb; }});
  buildLast.rep=rep;
  if (rep.error && /FOREIGN KEY constraint failed/i.test(rep.error.message) && /^INSERT/i.test((rep.error.sql||'').trim())) { P.fkSeen=true; }
  renderReport($('#buildOut'), rep);
  if (rep.error && /FOREIGN KEY constraint failed/i.test(rep.error.message) && P.buildStep===4) {
    $('#buildOut .err p') && ($('#buildOut .err p').textContent='This error is what you want to see. Customer 99 doesn\'t exist, so the foreign key refused the order. Without the constraint, you\'d have an order that belongs to nobody.');
  }
  persistSandbox(); drawBuildErd(); renderBuild();
}
$('#resetSandbox').addEventListener('click',()=>{
  if (!confirm('Delete all the tables you\'ve created and start again? Your step progress is kept.')) return;
  freshSandbox(); persistSandbox(); prevTables=new Set(); drawBuildErd(); renderBuild(); toast('Database cleared');
});

/* ---------- 3. Northwind map ---------- */
const NW_POS = {
  'Customers':{x:0,y:0}, 'Employees':{x:0,y:300},
  'Orders':{x:300,y:96}, 'Shippers':{x:300,y:470},
  'Categories':{x:650,y:0}, 'Order Details':{x:650,y:150}, 'Suppliers':{x:650,y:340},
  'Products':{x:970,y:110}
};
const NW_NOTES = {
  'Customers':'Companies that buy from Northwind. The key is a five-letter code such as ALFKI, not a number.',
  'Employees':'Sales staff. ReportsTo points back at this same table: a self-referencing key showing who manages whom.',
  'Orders':'One row per order: who bought, who sold, when, and which shipper carried it (ShipVia).',
  'Order Details':'The junction table between Orders and Products. Its primary key is two columns together: OrderID + ProductID.',
  'Products':'Everything Northwind sells, with its price, stock levels and whether it\'s discontinued.',
  'Categories':'Product groups such as Beverages and Seafood.',
  'Suppliers':'The companies Northwind buys its products from.',
  'Shippers':'Delivery firms. Orders.ShipVia holds a ShipperID.'
};
let nwModel=null, mapSel='Order Details';
function drawMap(scroll){
  P.mapTables=P.mapTables||[]; if (!P.mapTables.includes(mapSel)) { P.mapTables.push(mapSel); save(); refreshChrome(); }
  nwModel=nwModel||introspect(nw);
  renderERD($('#mapErd'), nwModel, {testPrefix:'northwind', positions:NW_POS, selected:mapSel, onSelect:n=>{ mapSel=n; drawMap(true); }, minWidth:1000, label:'Northwind entity relationship diagram'});
  const t=nwModel.find(x=>x.name===mapSel); const d=$('#mapDetail'); d.innerHTML='';
  const rows=nw.exec(`SELECT COUNT(*) FROM "${t.name}"`)[0].values[0][0];
  const left=h('div',{});
  left.append(h('h3',{class:'dot'},t.name), h('div',{class:'meta'}, `${rows} rows, ${t.cols.length} columns`), h('p',{},NW_NOTES[t.name]||''));
  const ul=h('ul',{class:'collist'});
  for (const c of t.cols){
    const li=h('li',{});
    if (c.pk) li.append(h('span',{class:'badge pk'},'PK'));
    if (c.fk) li.append(h('span',{class:'badge fk'},'FK'));
    if (!c.pk&&!c.fk) li.append(h('span',{class:'badge none'},'–'));
    li.append(h('span',{class:'nm'},c.name));
    if (c.fk && c.fk.parent!==t.name) li.append(h('span',{class:'fklink'},'→ ', h('button',{type:'button',onclick:()=>{ mapSel=c.fk.parent; drawMap(); }}, c.fk.parent)));
    if (c.fk && c.fk.parent===t.name) li.append(h('span',{class:'fklink'},'→ this table'));
    li.append(h('span',{class:'ty'},c.type));
    ul.append(li);
  }
  left.append(ul);
  const refs=nwModel.filter(o=>o.name!==t.name && o.fks.some(f=>f.parent===t.name));
  if (refs.length) left.append(h('p',{style:'font-size:.95rem;color:var(--ink-2)'}, 'Referenced by ', ...refs.flatMap((r,i)=>[i?(i===refs.length-1?' and ':', '):'', h('button',{type:'button',class:'linkish',onclick:()=>{ mapSel=r.name; drawMap(); }}, r.name)]), '.'));
  const tq = /\s/.test(t.name) ? '"'+t.name+'"' : t.name;
  left.append(h('button',{class:'btn primary small',type:'button','data-testid':'query-table',onclick:()=>{ openFree(`SELECT *\nFROM ${tq}\nLIMIT 10;`); }}, `Query ${t.name}`));
  const right=h('div',{}, h('div',{class:'sample-h'},'First five rows'));
  const sample=h('div'); right.append(sample);
  const r=nw.exec(`SELECT * FROM "${t.name}" LIMIT 5`);
  renderReport(sample, {items:[],notes:[],error:null,results:r.length?[{columns:r[0].columns,values:r[0].values}]:[]});
  const hd=$('.rs-h',sample); hd&&hd.remove();
  d.append(h('div',{class:'detail-grid'}, left, right));
  if (scroll){ const top=d.getBoundingClientRect().top; if (top>innerHeight-120) d.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block:'start'}); }
}

/* ---------- Query lessons ---------- */
let lEd, fEd, curLesson=null, curTab='learn', reveal={hint:false,sol:false};
const emptyRep=()=>({items:[],results:[],notes:[],error:null,ran:[]});
const fmtPrompt=t=>t.split(/(`[^`]+`)/).map(p=>p.startsWith('`')?h('code',{},p):p);
function openLesson(id){
  const L=LESSONS[id];
  // Arriving at a lesson always starts on Learn (checkpoints, which have no Learn tab, start on question 1)
  if (curLesson!==id){ curLesson=id; curTab = L.checkpoint ? 0 : 'learn'; }
  $('#lTitle').textContent=L.title; $('#lSummary').textContent=L.summary;
  // The Northwind table buttons and ERD only appear once Northwind has been introduced (Meet Northwind, Unit 2)
  const beforeNorthwind = PATH.findIndex(x=>x.id===id) < PATH.findIndex(x=>x.id==='map');
  $('#lStrip').hidden = L.db==='mydb' || beforeNorthwind; $('#lMyDb').hidden = L.db!=='mydb';
  const mw=$('[data-mydb-when]'); if (mw) mw.textContent = PATH.findIndex(x=>x.id===id) < PATH.findIndex(x=>x.id==='build') ? "you'll build in" : 'from';
  
  renderLessonTabs(); renderLessonBody();
}
function renderLessonTabs(){
  const L=LESSONS[curLesson]; const t=$('#lTabs'); t.innerHTML='';
  const tabs=(L.checkpoint?[]:['learn']).concat((L.ex||[]).map((_,i)=>i));
  for (const k of tabs){
    const done = k!=='learn' && P.exDone[curLesson+'.'+k];
    const b=h('button',{type:'button',role:'tab','aria-selected':String(curTab===k),class:done?'done':'','data-testid':k==='learn'?'tab-learn':`tab-exercise-${k+1}`,'data-done':k==='learn'?null:String(!!done)},
      k==='learn'?'Learn':[h('span',{class:'dotc','aria-hidden':'true'}), `Exercise ${k+1}`, done?h('span',{class:'sr'},' (solved)'):null]);
    b.addEventListener('click',()=>setTab(k));
    t.append(b);
  }
}
function setTab(k){ curTab=k; (P.tab||(P.tab={}))[curLesson]=k; save(); renderLessonTabs(); renderLessonBody(); if (innerWidth<1020) $('#lTabs').scrollIntoView({block:'start'}); }
const draftKey=()=>curLesson+':'+curTab;
/* Tabs inside lesson text (TABS() in lessons.js) */
function wireTabs(root){
  $$('[data-ltabs]',root).forEach(box=>{
    const tabs=$$('[role=tab]',box), panels=$$('[role=tabpanel]',box);
    const pick=k=>{ tabs.forEach((t,i)=>{ t.setAttribute('aria-selected',String(i===k)); t.tabIndex=i===k?0:-1; panels[i].hidden=i!==k; }); };
    tabs.forEach((t,i)=>{ t.addEventListener('click',()=>pick(i)); t.addEventListener('keydown',e=>{ if (e.key==='ArrowRight'||e.key==='ArrowLeft'){ e.preventDefault(); const k=(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length; pick(k); tabs[k].focus(); } }); });
  });
}
function renderLessonBody(){
  const L=LESSONS[curLesson]; const body=$('#lBody'); body.innerHTML=''; reveal={hint:false,sol:false};
  if (curTab==='learn'){
    body.innerHTML=L.learn; wireTabs(body);
    $$('pre.ex',body).forEach((pre,n)=>{
      const sql=pre.textContent; const wrap=h('div',{class:'example','data-testid':`example-${n+1}`}); pre.replaceWith(wrap); wrap.append(pre);
      if (pre.hasAttribute('data-norun')){ wrap.classList.add('readonly'); wrap.prepend(h('span',{class:'tag'}, pre.dataset.label || 'Try this in your own database')); }
      else { wrap.classList.add('has-run'); wrap.append(h('button',{class:'btn small run',type:'button','data-testid':`run-example-${n+1}`,onclick:()=>{ lEd.value=sql; P.drafts[draftKey()]=sql; save(); runLesson(); if (innerWidth<1020) $('#lEditor').scrollIntoView({block:'start'}); }},'Run this')); }
    });
    if (L.ex) body.append(h('p',{style:'margin-top:26px'}, h('button',{class:'btn primary',type:'button','data-testid':'start-exercises',onclick:()=>setTab(0)}, `Start the exercises (${L.ex.length})`)));
    else if (L.check){
      const form=h('form',{class:'quiz',onsubmit:e=>e.preventDefault(),'data-testid':'lesson-check'});
      body.append(h('div',{class:'rule'}), h('h2',{class:'dot'},'Check yourself'), form);
      P.checks=P.checks||{}; const saved=(P.checks[curLesson]=P.checks[curLesson]||{}); const id=curLesson;
      renderCheck(form, L.check, 'lesson-check', saved, (qi,ai)=>{ saved[qi]=ai; (P.checkDone=P.checkDone||{})[id]=L.check.every((x,i)=>saved[i]===x.c); save(); refreshChrome(); });
    }
    const first=$('pre.ex:not([data-norun])',body);
    lEd.value = P.drafts[draftKey()] ?? (first?first.textContent:'');
    lEd.setLabel('Try it here');
    renderReport($('#lOut'), emptyRep(), {empty:'Press Run this on any example, or edit it and press Run.'});
    return;
  }
  const i=curTab, ex=L.ex[i];
  body.setAttribute('data-solution', ex.sol);
  body.append(h('div',{class:'ex-num','data-testid':'exercise-number'}, L.checkpoint?`Checkpoint question ${i+1} of ${L.ex.length}`:`Exercise ${i+1} of ${L.ex.length}`));
  if (P.exDone[curLesson+'.'+i]) body.append(h('div',{class:'solved','data-testid':'solved'},'Solved'));
  body.append(h('p',{class:'ex-prompt','data-testid':'exercise-prompt'}, ...fmtPrompt(ex.p)));
  body.append(h('div',{class:'ex-actions'},
    h('button',{class:'btn small',type:'button',id:'bHint','data-testid':'show-hint',onclick:()=>{ reveal.hint=!reveal.hint; drawReveal(); }},'Show a hint'),
    h('button',{class:'btn small',type:'button',id:'bSol','data-testid':'show-answer',onclick:()=>{ reveal.sol=!reveal.sol; drawReveal(); }},'Show the answer')));
  body.append(h('div',{id:'lReveal'}));
  if (!L.checkpoint && i===0) body.append(h('p',{class:'small'}, 'Stuck? The ', h('button',{type:'button',class:'linkish',onclick:()=>setTab('learn')},'Learn tab'), ' has worked examples. The ', h('button',{type:'button',class:'linkish','data-testid':'exercise-open-erd',onclick:openErd},'Show the Northwind ERD'), ' to see every table and column.'));
  lEd.value = P.drafts[draftKey()] ?? (ex.starter || `-- ${L.checkpoint?'Checkpoint question':'Exercise'} ${i+1}\n\n`);
  lEd.setLabel(`Your answer to ${L.checkpoint?'question':'exercise'} ${i+1}`);
  renderReport($('#lOut'), emptyRep(), {empty:'Run your query. It\'s checked against the expected result automatically.'});
}
function drawReveal(){
  const ex=LESSONS[curLesson].ex[curTab]; const r=$('#lReveal'); r.innerHTML='';
  $('#bHint').textContent=reveal.hint?'Hide the hint':'Show a hint'; $('#bSol').textContent=reveal.sol?'Hide the answer':'Show the answer';
  if (reveal.hint) r.append(h('div',{class:'reveal','data-testid':'hint'}, h('b',{},'Hint: '), ex.hint));
  if (reveal.sol) r.append(h('div',{class:'reveal','data-testid':'answer'}, h('b',{},'One possible answer'), h('pre',{},ex.sol), h('button',{class:'btn small',type:'button','data-testid':'copy-answer',onclick:()=>{ lEd.value=ex.sol; P.drafts[draftKey()]=ex.sol; save(); lEd.focus(); }},'Copy into the editor')));
}
function nextUnsolved(after){ const L=LESSONS[curLesson]; for (let k=1;k<=L.ex.length;k++){ const j=(after+k)%L.ex.length; if (!P.exDone[curLesson+'.'+j]) return j; } return null; }
function runLesson(){
  // Lessons that change data (INSERT, UPDATE, DELETE) undo every run, so Northwind stays as it was
  const rep = LESSONS[curLesson].rollback ? runSafe(lEd.value, lessonDb()) : runScript(nw, lEd.value, 'nw'); const out=$('#lOut'); renderReport(out, rep);
  if (rep.ran.some(s=>/^(CREATE|DROP|ALTER)\s+TABLE\b/i.test(s))) nwModel=null;
  if (curTab==='learn' || rep.error) return;
  const L=LESSONS[curLesson], i=curTab, ex=L.ex[i];
  const last=rep.results[rep.results.length-1];
  let v;
  if (!last) v={ok:false,msg:'Run a SELECT query so there\'s a result to check.'};
  else { try { v=compare(lessonDb(),ex,last); } catch(e){ v={ok:false,msg:'Couldn\'t check this answer.',tip:e.message}; } }
  const box=h('div',{class:'verdict '+(v.ok?'good':'bad'),role:'status','data-testid':'verdict','data-correct':String(v.ok)});
  if (v.ok){
    const was=lessonDone(curLesson);
    if (!P.exDone[curLesson+'.'+i]){ P.exDone[curLesson+'.'+i]=true; save(); }
    const nowDone=lessonDone(curLesson);
    const k=PATH.findIndex(x=>x.id===curLesson);
    let btn=null, sub;
    if (nowDone && !was){
      sub='That\'s the last one. Lesson complete.';
      btn = k<PATH.length-1 ? h('button',{class:'btn small primary',type:'button','data-go':PATH[k+1].id},'Next lesson') : h('button',{class:'btn small primary',type:'button','data-go':'path'},'Back to home');
      toast('Lesson complete');
    } else {
      sub = v.extra?'You returned some extra columns too, which is fine.':'Your result matches the expected answer.';
      const j=nextUnsolved(i);
      if (j!=null) btn=h('button',{class:'btn small primary',type:'button',onclick:()=>setTab(j)}, `Exercise ${j+1}`);
      else if (k<PATH.length-1) btn=h('button',{class:'btn small primary',type:'button','data-go':PATH[k+1].id},'Next lesson');
    }
    box.append(h('div',{}, 'Correct.', h('span',{},sub)));
    if (btn){ btn.setAttribute('data-testid','verdict-next'); btn.style.marginLeft='auto'; box.append(btn); box.style.alignItems='center'; }
    if (!$('.solved',$('#lBody'))) $('.ex-num',$('#lBody')).after(h('div',{class:'solved','data-testid':'solved'},'Solved'));
    refreshChrome();
  } else box.append(h('div',{}, 'Not yet. '+v.msg, v.tip?h('span',{},v.tip):null));
  out.prepend(box);
}

/* ---------- Northwind ERD pop-up (lessons, quizzes and Free practice) ---------- */
const ERD_ICON='<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1.5" width="6" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9.5" width="6" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 4h2.5a1.5 1.5 0 0 1 1.5 1.5V9.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
function erdButton(tid){ return h('button',{class:'btn small erd-btn',type:'button','data-testid':tid,title:'Opens a diagram of every Northwind table and how they link',onclick:openErd,html:ERD_ICON+'<span>Show Northwind ERD</span>'}); }
let dlgSel='Orders';
function openErd(){
  const d=$('#erdDialog'); drawDialog();
  if (!d.open) d.showModal();
}
function closeErd(){ const d=$('#erdDialog'); if (d.open) d.close(); }
function drawDialog(){
  nwModel=nwModel||introspect(nw);
  renderERD($('#dialogErd'), nwModel, {testPrefix:'dialog', positions:NW_POS, selected:dlgSel, minWidth:1000, label:'Northwind entity relationship diagram', onSelect:n=>{ dlgSel=n; drawDialog(); }});
  const t=nwModel.find(x=>x.name===dlgSel)||nwModel[0]; const box=$('#dialogDetail'); box.innerHTML='';
  const rows=nw.exec(`SELECT COUNT(*) FROM "${t.name}"`)[0].values[0][0];
  const ul=h('ul',{class:'collist'});
  for (const c of t.cols){
    const li=h('li',{});
    if (c.pk) li.append(h('span',{class:'badge pk'},'PK'));
    if (c.fk) li.append(h('span',{class:'badge fk'},'FK'));
    if (!c.pk&&!c.fk) li.append(h('span',{class:'badge none'},'–'));
    li.append(h('span',{class:'nm'},c.name));
    if (c.fk && c.fk.parent!==t.name) li.append(h('span',{class:'fklink'},'→ ', h('button',{type:'button',onclick:()=>{ dlgSel=c.fk.parent; drawDialog(); }}, c.fk.parent)));
    li.append(h('span',{class:'ty'},c.type));
    ul.append(li);
  }
  const tq=/\s/.test(t.name)?'"'+t.name+'"':t.name;
  box.append(h('h3',{class:'dot','data-testid':'erd-dialog-table'},t.name), h('div',{class:'meta'},`${rows} rows, ${t.cols.length} columns. Write it as ${tq} in a query.`), h('p',{},NW_NOTES[t.name]||''), ul);
}
$('#erd-dialog-close').addEventListener('click',closeErd);
$('#erdDialog').addEventListener('click',e=>{ if (e.target===$('#erdDialog')) closeErd(); });

/* ---------- Free practice ---------- */
function openFree(sql){ P.drafts.free=sql; save(); fEd.value=sql; goto('free'); }
function runFree(){ const rep=runScript(nw, fEd.value, 'nw'); if (rep.ran.some(s=>/^(CREATE|DROP|ALTER)\s+TABLE\b/i.test(s))) nwModel=null; renderReport($('#fOut'), rep); }
function makeStrip(host, getEd, key, tp){
  host.append(erdButton(`${tp}-open-erd`), ' Tables: ');
  for (const t of ['Customers','Orders','Order Details','Products','Categories','Suppliers','Employees','Shippers']){
    host.append(h('button',{class:'chip',type:'button','data-testid':`${tp}-insert-table-${t.toLowerCase().replace(/\s+/g,'-')}`,title:`Insert ${t} at the cursor`,onclick:()=>{ const ed=getEd(), ta=ed.ta; const txt=/\s/.test(t)?'"'+t+'"':t; ta.focus(); ta.setRangeText(txt, ta.selectionStart, ta.selectionEnd, 'end'); ed.sync(); P.drafts[key()]=ta.value; save(); }}, t));
  }
  host.append(h('span',{style:'margin-left:auto'}, h('kbd',{},'Ctrl'),' + ',h('kbd',{},'Enter'),' runs'));
}

/* ---------- Boot ---------- */
const setMast=()=>document.documentElement.style.setProperty('--mast-h', $('.mast').offsetHeight+'px');
new ResizeObserver(setMast).observe($('.mast'));
async function boot(){
  try { SQL = await initSqlJs({}); }
  catch(e){ $('#boot').innerHTML='<div><p><strong>The database engine didn\'t start.</strong></p><p>Reload the page to try again.</p></div>'; return; }
  freshNorthwind(); freshMyDb();
  if (P.sandbox){ try { freshSandbox(b64ToBytes(P.sandbox)); } catch(e){ freshSandbox(); } } else freshSandbox();
  $('#boot').remove();
  drawLesson();
  buildEd=makeEditor($('#buildEditor'), { id:'build', onRun:runBuild, onChange:v=>{ P.drafts['build'+P.buildStep]=v; save(); },
    extraButtons:[ h('button',{class:'btn small',type:'button',onclick:()=>{ buildEd.value=BUILD_STEPS[P.buildStep].example; P.drafts['build'+P.buildStep]=buildEd.value; save(); buildEd.focus(); }},'Use the lesson\'s code') ] });
  buildEd.runBtn.previousElementSibling.setAttribute('data-testid','use-lesson-code');
  lEd=makeEditor($('#lEditor'), { id:'lesson', onRun:runLesson, onChange:v=>{ P.drafts[draftKey()]=v; save(); } });
  fEd=makeEditor($('#fEditor'), { id:'free', onRun:runFree, onChange:v=>{ P.drafts.free=v; save(); } });
  fEd.value = P.drafts.free ?? 'SELECT *\nFROM Customers\nLIMIT 10;';
  renderReport($('#fOut'), emptyRep(), {empty:'Results appear here.'});
  makeStrip($('#lStrip'), ()=>lEd, draftKey, 'lesson'); makeStrip($('#fStrip'), ()=>fEd, ()=>'free', 'free');
  $('#freeRestore').addEventListener('click',()=>{ if (confirm('Restore Northwind to its original data?')){ freshNorthwind(); nwModel=null; toast('Northwind restored'); } });
  renderBuild(); loadStepDraft(); prevTables=new Set(introspect(sb).map(t=>t.name)); drawBuildErd();
  if (!location.hash) history.replaceState(null,'','#/path');
  route();
}

