/* ---------- Game: The Lost Ledger – Chapter 1: The Royal Archive ----------
   An original top-down adventure. The kingdom's Royal Ledger (a database) is corrupted; a new Spartan from
   Sparta Academy restores it by exploring, talking to people and answering SQL puzzles at rune terminals.
   Everything is drawn in code. The world has its own database, so every puzzle is about the world you're in. */
const GAME = (() => {
  const T = 16, COLS = 16, ROWS = 11, HUD = 16, VW = COLS*T, VH = ROWS*T + HUD;
  const SAVE_KEY = 'sqlPracticeLab.quest.v1';
  // The canvas can be bigger than the room (full screen): CW x CH, with the room drawn at (OX, RY)
  let CW = VW, CH = VH, OX = 0, RY = HUD, SC = 3;   // SC: how many real pixels per game pixel

  /* ---------- The kingdom's database ---------- */
  const WORLD_SQL = `
CREATE TABLE Houses (house_id INTEGER PRIMARY KEY, street TEXT, colour TEXT);
INSERT INTO Houses VALUES (1,'Academy Row','pink'),(2,'Archive Lane','grey'),(3,'Mill Street','blue'),(4,'Market Square','green'),
 (5,'Mill Street','yellow'),(6,'Forge Way','red'),(7,'Meadow Road','green'),(8,'Gatehouse','grey'),(9,'Meadow Road','white');
CREATE TABLE Villagers (villager_id INTEGER PRIMARY KEY, name TEXT, job TEXT, house_id INTEGER, age INTEGER, coins INTEGER,
 FOREIGN KEY (house_id) REFERENCES Houses(house_id));
INSERT INTO Villagers VALUES (1,'Ada','Trainer',1,34,120),(2,'Margaret','Archivist',2,71,85),(3,'Rex','Apprentice',3,19,0),
 (4,'Bram','Shopkeeper',4,52,300),(5,'Elin','Baker',5,28,0),(6,'Tomas','Blacksmith',6,45,0),(7,'Nell','Farmer',7,39,60),
 (8,'Wisp',NULL,NULL,NULL,0),(9,'Odo','Guard',8,47,75),(10,'Wil','Guard',8,23,40),(11,'Sera','Scribe',2,26,55),(12,'Hob',NULL,9,63,0);
CREATE TABLE Items (item_id INTEGER PRIMARY KEY, name TEXT, owner_id INTEGER, FOREIGN KEY (owner_id) REFERENCES Villagers(villager_id));
INSERT INTO Items VALUES (1,'Training Sword',1),(2,'Old Map',2),(3,'Quill',11),(4,'Vault Rune',7),(5,'Bread Basket',5),(6,'Anvil',6),
 (7,'Lantern',4),(8,'Spare Key',9),(9,'Ledger Volume I',2),(10,'Ledger Volume II',2),(11,'Pitchfork',7),(12,'Broken Abacus',3);
CREATE TABLE Monsters (monster_id INTEGER PRIMARY KEY, kind TEXT, room TEXT, hp INTEGER);
INSERT INTO Monsters VALUES (1,'Bug','Reading Room',1),(2,'Bug','Reading Room',1),(3,'Bug','Reading Room',1),
 (4,'NULL ghost','North Hall',2),(5,'NULL ghost','North Hall',2),(6,'Bug','North Hall',1),
 (7,'NULL ghost','East Hall',2),(8,'NULL ghost','East Hall',2),(9,'NULL ghost','East Hall',2),(10,'Bug','East Hall',1),
 (11,'Bug','Antechamber',1),(12,'Bug','Antechamber',1);`;
  const TABLES = [
    ['Villagers', 'villager_id, name, job, house_id, age, coins'],
    ['Houses', 'house_id, street, colour'],
    ['Items', 'item_id, name, owner_id'],
    ['Monsters', 'monster_id, kind, room, hp'] ];

  /* ---------- Puzzles (rune terminals) ---------- */
  const PUZZLES = {
    T0: { title:'Training terminal', story:'Every terminal asks a question about the kingdom\'s data. Answer it with a query.',
      task:'Show the <b>name</b> and <b>job</b> of every villager.', sol:'SELECT name, job FROM Villagers;',
      pieces:['SELECT','name',',','job','FROM','Villagers',';'], hint:'SELECT the two columns, separated by a comma, FROM the Villagers table.', lesson:'select' },
    P1: { title:'The Guard Rune', story:'Carved into the door: <i>"I open only for those who keep the gate."</i>',
      task:'Show the <b>names</b> of all villagers whose job is <b>Guard</b>.', sol:"SELECT name FROM Villagers WHERE job = 'Guard';",
      pieces:['SELECT','name','FROM','Villagers','WHERE','job','=',"'Guard'",';'], hint:"Filter with WHERE job = 'Guard'. Text goes in single quotes.", lesson:'operators' },
    P2: { title:'The Elder Rune', story:'<i>"The eldest of the kingdom holds my seal."</i>',
      task:'Show the <b>name</b> of the <b>oldest</b> villager.', sol:'SELECT name FROM Villagers ORDER BY age DESC LIMIT 1;',
      pieces:['SELECT','name','FROM','Villagers','ORDER BY','age','DESC','LIMIT','1',';'], hint:'Sort by age, oldest first (DESC), and keep just one row with LIMIT 1.', lesson:'sorting' },
    P3: { title:'The Hoard Rune', story:'<i>"Count what each keeper holds, and the key is yours."</i>',
      task:'For each <b>owner_id</b> in Items, show how many items they own.', sol:'SELECT owner_id, COUNT(*) FROM Items GROUP BY owner_id;',
      pieces:['SELECT','owner_id',',','COUNT(*)','FROM','Items','GROUP BY','owner_id',';'], hint:'GROUP BY owner_id makes one row per owner, and COUNT(*) counts the rows in each group.', lesson:'groupby' },
    P4: { title:'The Bond Rune', story:'<i>"Join each treasure to its keeper."</i>',
      task:'Show every item\'s <b>name</b> next to the <b>name</b> of the villager who owns it.',
      sol:'SELECT Items.name, Villagers.name FROM Items JOIN Villagers ON Items.owner_id = Villagers.villager_id;',
      pieces:['SELECT','Items.name',',','Villagers.name','FROM','Items','JOIN','Villagers','ON','Items.owner_id','=','Villagers.villager_id',';'],
      hint:'JOIN Villagers ON Items.owner_id = Villagers.villager_id. Name the table before each column, because both have a name column.', lesson:'innerjoin' },
    R:  { title:'The coin records', story:'Rex ran <code>UPDATE Villagers SET coins = 0</code>… without a <code>WHERE</code>. Well, nearly: only some were hit.',
      task:'<b>Count</b> how many villagers now have <b>0 coins</b>.', sol:'SELECT COUNT(*) FROM Villagers WHERE coins = 0;',
      pieces:['SELECT','COUNT(*)','FROM','Villagers','WHERE','coins','=','0',';'], hint:'COUNT(*) counts rows; WHERE coins = 0 keeps only the ones Rex reset.', lesson:'aggregates' },
    G:  { title:'Who am I?', story:'Wisp\'s job in the Ledger is <code>NULL</code>: not zero, not blank, just unknown.',
      task:'Show every villager\'s <b>name</b> and their <b>job</b>, with <b>\'Unknown\'</b> where the job is missing.',
      sol:"SELECT name, COALESCE(job, 'Unknown') FROM Villagers;",
      pieces:['SELECT','name',',','COALESCE(','job',',',"'Unknown'",')','FROM','Villagers',';'], hint:"COALESCE(job, 'Unknown') gives the job, or 'Unknown' when it's NULL.", lesson:'nulls' },
    B1: { title:'The Deadlock: left lock', story:'The left head guards a rune: <i>"Where does the keeper of the Vault Rune live?"</i>',
      task:'Show the <b>street</b> where the owner of the <b>Vault Rune</b> lives.',
      sol:"SELECT Houses.street FROM Items JOIN Villagers ON Items.owner_id = Villagers.villager_id JOIN Houses ON Villagers.house_id = Houses.house_id WHERE Items.name = 'Vault Rune';",
      pieces:['SELECT','Houses.street','FROM','Items','JOIN','Villagers','ON','Items.owner_id','=','Villagers.villager_id','JOIN','Houses','ON','Villagers.house_id','=','Houses.house_id','WHERE','Items.name','=',"'Vault Rune'",';'],
      hint:'Items → Villagers → Houses: two JOINs, then WHERE Items.name = \'Vault Rune\'.', lesson:'multijoin' },
    B2: { title:'The Deadlock: right lock', story:'The right head hisses: <i>"Name the halls where we gathered in strength: more than two of us."</i>',
      task:'For each <b>room</b> in Monsters, show how many monsters are there, but only rooms with <b>more than 2</b>.',
      sol:'SELECT room, COUNT(*) FROM Monsters GROUP BY room HAVING COUNT(*) > 2;',
      pieces:['SELECT','room',',','COUNT(*)','FROM','Monsters','GROUP BY','room','HAVING','COUNT(*)','>','2',';'], hint:'Group by room, then filter the groups with HAVING COUNT(*) > 2.', lesson:'having' },
  };

  /* ---------- The world: rooms ---------- */
  // # wall  . floor  , grass  T tree  ~ water  = path  R roof  H house wall  D house door  A Academy door
  // B bookshelf  C counter  r rug  L Ledger Stone  P terminal  X chest  d rune door  K boss door  w cracked wall  g gate  e shortcut
  function archiveRoom(doors){
    const m = Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=> (x===0||y===0||x===COLS-1||y===ROWS-1)?'#':'.'));
    const put = (x,y,c)=>{ m[y][x]=c; };
    const door = (side, c) => {
      if (side==='n'){ put(7,0,c); put(8,0,c); } if (side==='s'){ put(7,ROWS-1,c); put(8,ROWS-1,c); }
      if (side==='w'){ put(0,5,c); } if (side==='e'){ put(COLS-1,5,c); }
    };
    Object.entries(doors).forEach(([s,c])=>door(s,c));
    for (let x=2;x<COLS-2;x+=3){ if (m[0][x]==='#' && m[0][x+1]==='#') put(x,1,'B'); }
    return m.map(r=>r.join(''));
  }
  const ROOMS = {
    'academy:0,0': { name:'Sparta Academy', inside:true, map:[
      '################',
      '#BBBB..L....BBB#',
      '#..............#',
      '#..P...........#',
      '#..............#',
      '#......rrrr....#',
      '#......rrrr....#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#######dd#######'], npcs:[{id:'ada',x:11,y:4}] },
    'village:0,0': { name:'Village: West', map:[
      'TTTTTTTTTTTTTTTT',
      'T,,,RRRRRR,,,,,T',
      'T,,,HHHAHH,,T,,T',
      'T,,,,,,=,,,,,,,T',
      'T,,RRR,=,,,,RRR,',
      'T,,HDH,=,,,,HDH,',
      'T,,,,,,=========',
      'T,,,,,,,,,,,,,,,',
      'T,~~~,,,,,T,,,,T',
      'T,~~~,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTT'], npcs:[{id:'elin',x:9,y:8}] },
    'village:1,0': { name:'Village: Square', map:[
      'TTTTTTTTTTTTTTTT',
      'T,,,RRRRR,,,,,,T',
      ',,,,HHDHH,,,,,,,',
      ',,,,,,,,,,,,,,,,',
      ',,,,,,,=====,,,,',
      '========L=======',
      ',,,,,,,=====,,,,',
      ',,CCC,,,,,,,,,,,',
      ',,,,,,,,,,,,,P,,',
      'T,,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTT'], npcs:[{id:'margaret',x:6,y:3},{id:'bram',x:3,y:6},{id:'wisp',x:12,y:2}] },
    'village:2,0': { name:'Village: East Gate', map:[
      'TTTTTTTggTTTTTTT',
      'T,,,,,,==,,,,,,T',
      ',,,,,,,==,,,,,,T',
      ',,,,,,,==,,,,,,T',
      ',,,,,,,==,,TT,,T',
      '=========,,TT,,T',
      ',,,,,,,,,,,P,,,T',
      ',,,~~~~,,,,,,,,T',
      ',,,~~~~,,,,,,,,T',
      'T,,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTT'], npcs:[{id:'odo',x:9,y:1},{id:'rex',x:4,y:3}] },
    'archive:1,1': { name:'Archive: Entrance', inside:true, map: archiveRoom({n:'d', s:'.', e:'e'}) },
    'archive:1,0': { name:'Archive: North Hall', inside:true, map: archiveRoom({s:'.', w:'.', e:'d'}), enemies:['ghost','ghost','bug'] },
    'archive:0,0': { name:'Archive: Reading Room', inside:true, map: archiveRoom({e:'.', s:'w'}), enemies:['bug','bug','bug'] },
    'archive:0,1': { name:'Archive: Hidden Vault', inside:true, dark:true, map: archiveRoom({n:'.'}) },
    'archive:2,0': { name:'Archive: East Hall', inside:true, map: archiveRoom({w:'.', s:'.'}), enemies:['ghost','ghost','ghost','bug'] },
    'archive:2,1': { name:'Archive: Antechamber', inside:true, map: archiveRoom({n:'.', w:'e', e:'K'}), enemies:['bug','bug'] },
    'archive:3,1': { name:"The Deadlock's Chamber", inside:true, boss:true, map: archiveRoom({w:'.'}) },
  };
  // features placed in rooms: [x, y, tile]
  const FEATURES = {
    'archive:1,1': [[5,4,'P'],[10,4,'L']],
    'archive:1,0': [[12,3,'P'],[3,8,'X']],
    'archive:0,0': [[13,8,'X']],
    'archive:0,1': [[7,5,'X']],
    'archive:2,0': [[3,3,'P'],[12,3,'X']],
    'archive:2,1': [[4,3,'P'],[11,7,'L']],
    'archive:3,1': [[3,8,'P'],[12,8,'P']],
  };
  Object.entries(FEATURES).forEach(([k,list])=>{ const m=ROOMS[k].map.map(r=>[...r]); list.forEach(([x,y,c])=>m[y][x]=c); ROOMS[k].map=m.map(r=>r.join('')); });
  const TERMINALS = { 'academy:0,0:3,3':'T0', 'archive:1,1:5,4':'P1', 'archive:1,0:12,3':'P2', 'archive:2,0:3,3':'P3', 'archive:2,1:4,3':'P4',
    'village:2,0:11,6':'R', 'village:1,0:13,8':'G', 'archive:3,1:3,8':'B1', 'archive:3,1:12,8':'B2' };
  const CHESTS = { 'archive:1,0:3,8':'map', 'archive:0,0:13,8':'kw10', 'archive:0,1:7,5':'heart', 'archive:2,0:12,3':'key' };
  const RUNE_DOOR = { 'academy:0,0':'T0', 'archive:1,1':'P1', 'archive:1,0':'P2' };   // which puzzle opens the room's rune door
  const WARPS_EDGE = { 'academy:0,0:S':['village:0,0',7,3], 'village:2,0:N':['archive:1,1',7,9], 'archive:1,1:S':['village:2,0',7,1] };

  /* ---------- Characters ---------- */
  const NPC_LOOK = { ada:['#2d2a2b','#d9295b','Trainer Ada'], margaret:['#6c5a8a','#e8e4ee','Margaret'], bram:['#7a5130','#3b2a1c','Bram'],
    odo:['#5c6577','#9aa3b5','Odo'], rex:['#3f7d4f','#e0a95a','Rex'], elin:['#c9893c','#f3e0b5','Elin'], wisp:['ghost','ghost','Wisp'] };

  /* ---------- State ---------- */
  let cv, ctx, raf=0, last=0, acc=0, running=false, bound=false, worldDb=null;
  const keys = { up:false, down:false, left:false, right:false, a:false, b:false };
  const pressedOnce = { a:0, b:0, menu:0 };
  let S = null;   // the saved game state
  let R = null;   // what's happening in the current room
  let mode = 'title', tick = 0, msg = null;
  function newGame(){
    return { room:'academy:0,0', x:7*T, y:8*T, dir:'up', hearts:3, maxHearts:3, keywords:0, flags:{}, items:{}, solved:{},
      stone:{room:'academy:0,0', x:7*T, y:2*T}, started:Date.now(), playMs:0, opened:{}, visited:{} };
  }
  const save = () => { try { S.playMs += Date.now() - (S._t||Date.now()); S._t = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch(e){} };
  const loadSave = () => { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); return s && s.room ? s : null; } catch(e){ return null; } };

  /* ---------- Sound (tiny beeps, made in code) ---------- */
  let actx=null, muted=false;
  try { muted = localStorage.getItem(SAVE_KEY+'.muted')==='1'; } catch(e){}
  function beep(f=440, d=0.08, type='square', v=0.04, slide=0){
    if (muted) return;
    try { actx = actx || new (window.AudioContext||window.webkitAudioContext)(); const o=actx.createOscillator(), g=actx.createGain();
      o.type=type; o.frequency.value=f; if (slide) o.frequency.linearRampToValueAtTime(f+slide, actx.currentTime+d);
      g.gain.value=v; g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime+d); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+d); } catch(e){}
  }
  const SFX = { talk:()=>beep(660,0.03,'square',0.02), hit:()=>beep(220,0.1,'sawtooth',0.05,-120), hurt:()=>beep(140,0.25,'sawtooth',0.06,-60),
    get:()=>{ beep(880,0.07); setTimeout(()=>beep(1320,0.09),70); }, solve:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'triangle',0.06),i*90)),
    door:()=>beep(110,0.3,'triangle',0.07,40), save:()=>[784,988,1175].forEach((f,i)=>setTimeout(()=>beep(f,0.1,'sine',0.05),i*80)), swing:()=>beep(500,0.05,'triangle',0.03,-200) };

  /* ---------- Controls for this device ---------- */
  const touch = () => matchMedia('(pointer: coarse)').matches;
  const KEY = { a:()=>touch()?'A':'Space', b:()=>touch()?'B':'J', move:()=>touch()?'the D-pad':'the arrow keys (or WASD)', menu:()=>touch()?'☰':'Esc' };

  /* ---------- Map helpers ---------- */
  const room = () => ROOMS[S.room];
  const isOpen = (c, x, y) => {
    const k=S.room;
    if (c==='d') return !!S.solved[RUNE_DOOR[k]];
    if (c==='g') return !!S.flags.gateOpen;
    if (c==='e') return !!S.flags.shortcut;
    if (c==='w') return !!S.flags.crack;
    if (c==='K') return !!S.flags.bossDoor;
    return false;
  };
  function tileAt(tx,ty){ if (tx<0||ty<0||tx>=COLS||ty>=ROWS) return ' '; return room().map[ty][tx]; }
  function solidTile(tx,ty){
    if (tx<0||ty<0||tx>=COLS||ty>=ROWS) return false;   // edges lead to other rooms
    const c=tileAt(tx,ty);
    if ('dgewK'.includes(c)) return !isOpen(c,tx,ty);
    return '#TRHDBCLPX~'.includes(c);
  }
  function boxHitsSolid(x,y,w,h){
    for (let ty=Math.floor(y/T); ty<=Math.floor((y+h-1)/T); ty++) for (let tx=Math.floor(x/T); tx<=Math.floor((x+w-1)/T); tx++) if (solidTile(tx,ty)) return true;
    for (const n of R.npcs){ if (x < n.x*T+15 && x+w > n.x*T+1 && y < n.y*T+15 && y+h > n.y*T+1) return true; }
    if (R.boss && R.boss.alive && x < 5*T+6*T && x+w > 5*T && y < 1*T+3*T && y+h > 1*T) return true;
    return false;
  }

  /* ---------- Entering rooms ---------- */
  function enterRoom(key, px, py){
    S.room = key; S.x = px; S.y = py; S.visited[key]=true;
    const r = room();
    R = { npcs:(r.npcs||[]).map(n=>({...n})), enemies:[], drops:[], fx:[], boss:null };
    if (key==='archive:2,1' && !S.flags.shortcut){ S.flags.shortcut=true; flash('A hidden door slides open to the west.'); SFX.door(); }
    (r.enemies||[]).forEach((kind,i)=>{
      const spots=[[3,3],[12,7],[4,8],[11,3],[7,7],[9,4]]; const [ex,ey]=spots[i%spots.length];
      R.enemies.push({ kind, x:ex*T, y:ey*T, w:12, h:12, hp:kind==='ghost'?2:1, vx:0, vy:0, t:0, hurt:0, phase:Math.random()*200 });
    });
    if (r.boss && !S.flags.bossBeaten){ R.boss = { alive:true, left:!!S.solved.B1, right:!!S.solved.B2, t:0, spawn:240 };
      if (!S.flags.bossMet){ S.flags.bossMet=true; setTimeout(()=>talk('deadlock'), 300); } }
    save();
  }
  function warp(key, tx, ty){ fade(()=>enterRoom(key, tx*T+2, ty*T+2)); }
  let fadeT=0, fadeFn=null;
  function fade(fn){ fadeT=20; fadeFn=fn; }

  /* ---------- Dialogue ---------- */
  const ui = {};
  let dq = [], dcur=null, dshown=0, dchoice=0, dafter=null;
  function say(lines, after){ dq = lines.map(l=>typeof l==='string'?{text:l}:l); dafter=after||null; nextLine(); }
  function nextLine(){
    if (!dq.length){ closeDialog(); return; }
    if (mode!=='dialog'){ keys.up=keys.down=keys.left=keys.right=false; }
    dcur = dq.shift(); dshown=0; dchoice=0; mode='dialog';
    const who = dcur.who || dcur._who || '';
    ui.dlg.hidden=false; ui.dname.textContent = who; ui.dtext.textContent=''; ui.dchoices.innerHTML='';
    drawPortrait(dcur.face);
  }
  function closeDialog(){ ui.dlg.hidden=true; dcur=null; mode='play'; const f=dafter; dafter=null; if (f) f(); }
  function showChoices(){
    ui.dchoices.innerHTML='';
    (dcur.choices||[]).forEach((c,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='q-choice'+(i===dchoice?' sel':''); b.textContent=c.label; b.dataset.testid=`dialog-choice-${i+1}`; b.setAttribute('data-testid',`dialog-choice-${i+1}`);
      b.onclick=e=>{ e.stopPropagation(); pick(i); }; ui.dchoices.append(b); });
  }
  function pick(i){ const c=dcur.choices[i]; dq=[]; ui.dlg.hidden=true; dcur=null; mode='play'; dafter=null; if (c.go) c.go(); }
  function advance(){
    if (!dcur) return;
    if (dshown < dcur.text.length){ dshown = dcur.text.length; ui.dtext.textContent=dcur.text; if (dcur.choices) showChoices(); return; }
    if (dcur.choices) { pick(dchoice); return; }
    nextLine();
  }
  const L = (who, face) => (text, extra={}) => ({ who, face, text, ...extra });

  function talk(id){
    const F=S.flags, sv=S.solved;
    const ada=L('Trainer Ada','ada'), mar=L('Margaret, the Archivist','margaret'), bram=L('Bram, the shopkeeper','bram'), odo=L('Odo, the gate guard','odo'),
      rex=L('Rex, the apprentice','rex'), wisp=L('Wisp','wisp'), elin=L('Elin, the baker','elin'), dl=L('The Deadlock','deadlock');
    if (id==='ada'){
      if (F.bossBeaten) return say([ada('You did it. The Ledger is whole again, and the whole Academy is talking about you.'), ada('Rest for now, Spartan. Something tells me this isn\'t over.')]);
      if (!F.metAda) return say([ada('Ah, you made it! Welcome to Sparta Academy. I\'m Ada, your trainer.'),
        ada('I\'m afraid your first day won\'t be a quiet one. This morning the Royal Ledger started to fall apart.'),
        ada('It\'s the book that records everything in the kingdom: every villager, every house, every coin. And it\'s a database.'),
        ada('Now people are forgetting their jobs, coins are vanishing, and doors that were in the records have simply sealed shut.'),
        ada('You\'re learning SQL, which makes you exactly who the kingdom needs.'),
        ada('Try the terminal over there. Every terminal asks a question about the kingdom\'s data. Answer it with a query and things happen.'),
        ada(`Move with ${KEY.move()}. Walk up to the terminal, face it and press ${KEY.a()}. That\'s also how you talk to people and open things.`),
        ada(`And if a bug comes at you, press ${KEY.b()} to swing your Debugger. ${KEY.menu()} opens the menu, with your quests, items and the controls.`)], ()=>{ F.metAda=true; save(); });
      if (!sv.T0) return say([ada(`The terminal is by the bookshelves. Walk up to it and press ${KEY.a()}.`, {choices:[
        {label:'How do terminals work?', go:()=>say([ada('Read the question, then write a query. You can type it, or tap the pieces to build it.'), ada('Press Run to see your result. If it matches what the rune wants, the door opens.'), ada('Stuck? There\'s a hint, and a link to the lesson that covers it.')])},
        {label:'Thanks, Ada', go:()=>{}} ]})]);
      return say([ada('The door\'s open! Head into the village and find Margaret, the Archivist. She\'ll know where the trouble started.'),
        ada('And touch any Ledger Stone you find. They save your progress and heal you.')]);
    }
    if (id==='margaret'){
      if (F.bossBeaten) return say([mar('Every page is whole again. Fifty years I\'ve kept this Ledger, and I\'ve never been so glad to read it.')]);
      if (!F.metMargaret){
        if (!sv.T0) return say([mar('A new Spartan! Ada will be wanting to see you at the Academy first.')]);
        return say([mar('Ada sent you? Thank goodness. I\'m Margaret. I\'ve kept the Royal Ledger for fifty years.'),
          mar('Whole pages are corrupted. Wisp over there has forgotten his own job, and Rex… well, Rex has been Rex.'),
          mar('The trouble started deep in the Royal Archive, past the old gate to the east.'),
          mar('Take this Archive Pass and show it to Odo, the guard. The Archive\'s doors are sealed with query runes, but you\'ll manage.')],
          ()=>{ F.metMargaret=true; S.items.pass=true; SFX.get(); flash('You got the Archive Pass!'); save(); });
      }
      return say([mar('The Archive is to the east, past Odo\'s gate.', {choices:[
        {label:'Tell me about the Ledger', go:()=>say([mar('The Ledger has four tables: Villagers, Houses, Items and Monsters.'), mar('Villagers: villager_id, name, job, house_id, age, coins. Houses: house_id, street, colour.'), mar('Items: item_id, name, owner_id. And Monsters: monster_id, kind, room, hp. Don\'t ask why we record monsters.')])},
        {label:'Any advice?', go:()=>say([mar('Bugs fall to your Debugger. NULL ghosts flicker: you can only hit them when they\'re solid.'), mar('And if a wall looks thin and dark, Bram sells a lantern that shows what\'s hidden.')])},
        {label:'Goodbye', go:()=>{}} ]})]);
    }
    if (id==='odo'){
      if (F.gateOpen) return say([odo('The gate\'s open. Mind the bugs in there, they\'ve been rattling the shelves all morning.')]);
      if (!S.items.pass) return say([odo('Halt! The Royal Archive is sealed. Nobody goes in without a pass from the Archivist.')]);
      return say([odo('An Archive Pass, signed by Margaret herself. Very well.'), odo('Stand back…')], ()=>{ F.gateOpen=true; SFX.door(); flash('The gate creaks open.'); save(); });
    }
    if (id==='rex'){
      if (sv.R) return say([rex('Five villagers! I\'ve written it on my hand: always, always use a WHERE.')]);
      if (!F.rexAsked) return say([rex('Oh no, oh no, oh no.'), rex('I\'m Rex, Margaret\'s apprentice. This morning I tried to fix the coin records and ran an UPDATE…'),
        rex('…and forgot the WHERE. Now some villagers have no coins at all, and I don\'t even know how many!'),
        rex('There\'s a terminal by the trees. Could you count them for me?', {choices:[{label:'I\'ll help', go:()=>{ F.rexAsked=true; save(); say([rex('You\'re a lifesaver! It\'s just there, to the east.')]); }},{label:'Not right now', go:()=>{}}]})]);
      return say([rex('The terminal\'s just to the east. Count the villagers with 0 coins. Please?')]);
    }
    if (id==='wisp'){
      if (sv.G) return say([wisp('Unknown. At least it\'s something. COALESCE, they call it. Thank you, Spartan.')]);
      if (!F.wispAsked) return say([wisp('Ooooh… who am I? The Ledger says my job is… NULL.'), wisp('Not zero. Not blank. Just… unknown. It\'s a lonely thing, being unknown.'),
        wisp('There\'s a terminal by the trees. Could you show everyone\'s job, and write \'Unknown\' where it\'s missing?', {choices:[{label:'Of course', go:()=>{ F.wispAsked=true; save(); say([wisp('Maybe then I\'ll feel like… something.')]); }},{label:'Maybe later', go:()=>{}}]})]);
      return say([wisp('The terminal is just south-east of here. Unknown is better than nothing…')]);
    }
    if (id==='elin'){
      return say([elin(sv.R ? 'My coins are back in the records! Rex came round to apologise. With a cake. That I baked.' : 'Rex reset my coins to zero! Zero! I bake every loaf in this village.'),
        elin('Did you know the Academy\'s terminals use the same SQL the whole kingdom runs on?')]);
    }
    if (id==='bram') return shop();
    if (id==='deadlock'){
      return say([dl('WHO DARES… wait. Who dares. Wait. WHO DA—'), dl('We are the Deadlock. Each of our heads holds a lock the other one needs.'),
        dl('Neither will let go first. And so nothing in your precious Ledger can ever change again!'),
        dl('Two terminals guard our locks. Answer both and we… no. You never will.')]);
    }
  }
  function shop(){
    const bram=L('Bram, the shopkeeper','bram');
    say([bram(`Welcome! I trade in keywords. You have ${S.keywords}.`, {choices:[
      {label:S.items.lantern?'Lantern of EXPLAIN (sold out)':'Lantern of EXPLAIN: 15 keywords', go:()=>{
        if (S.items.lantern) return say([bram('You\'ve already got the only one I had.')]);
        if (S.keywords<15) return say([bram('Fifteen keywords, friend. Bugs drop them, and so do chests and grateful villagers.')]);
        S.keywords-=15; S.items.lantern=true; SFX.get(); save();
        say([bram('The Lantern of EXPLAIN. It shows what\'s really there: hidden passages, thin walls, that sort of thing.')]); }},
      {label:'Healing tea: 3 keywords', go:()=>{
        if (S.keywords<3) return say([bram('Three keywords for the tea, I\'m afraid.')]);
        S.keywords-=3; S.hearts=S.maxHearts; SFX.get(); save(); say([bram('Drink up. Hearts full!')]); }},
      {label:'Just looking', go:()=>{}} ]})]);
  }

  /* ---------- Puzzles ---------- */
  let curPuzzle=null, wrongRuns=0;
  function releaseAll(){ Object.keys(keys).forEach(k=>keys[k]=false); pressedOnce.a=pressedOnce.b=pressedOnce.menu=0; document.querySelectorAll('.q-pad .gp.pressed').forEach(b=>b.classList.remove('pressed')); }
  function openPuzzle(id){
    releaseAll(); const p=PUZZLES[id]; curPuzzle=id; wrongRuns=0; mode='puzzle';
    if (!worldDb){ worldDb = new SQL.Database(); worldDb.exec(WORLD_SQL); }
    ui.pz.hidden=false;
    ui.pz.querySelector('[data-p=title]').textContent=p.title;
    ui.pz.querySelector('[data-p=story]').innerHTML=p.story;
    ui.pz.querySelector('[data-p=task]').innerHTML=p.task;
    ui.pz.querySelector('[data-p=tables]').innerHTML = TABLES.map(([t,c])=>`<li><b>${t}</b>: ${c}</li>`).join('');
    const ed=ui.pz.querySelector('textarea'); ed.value = S.drafts && S.drafts[id] || '';
    const pc=ui.pz.querySelector('[data-p=pieces]'); pc.innerHTML='';
    const shuffled=[...p.pieces]; for (let i=shuffled.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
    shuffled.forEach(t=>{ const b=document.createElement('button'); b.type='button'; b.className='q-piece'; b.textContent=t;
      b.onclick=()=>{ ed.value = (ed.value.trim() ? ed.value.replace(/\s*$/,'') + (t===','||t===';'||t===')'? '' : ' ') : '') + t; ed.dispatchEvent(new Event('input')); }; pc.append(b); });
    ui.pz.querySelector('[data-p=out]').innerHTML=''; ui.pz.querySelector('[data-p=verdict]').innerHTML='';
    ui.pz.querySelector('[data-p=hint]').hidden=true; ui.pz.querySelector('[data-p=hint]').textContent=p.hint;
    const lk=ui.pz.querySelector('[data-p=lesson]'); lk.href=`#/lesson/${p.lesson}`; lk.textContent = `Read the lesson: ${LESSONS[p.lesson]?LESSONS[p.lesson].title:'SQL'}`;
    ui.pz.querySelector('[data-p=solved]').hidden = !S.solved[id];
    updateDone();
    setTimeout(()=>{ if (!matchMedia('(pointer: coarse)').matches) ed.focus(); }, 50);
  }
  function runPuzzle(){
    const p=PUZZLES[curPuzzle], ed=ui.pz.querySelector('textarea'), out=ui.pz.querySelector('[data-p=out]'), v=ui.pz.querySelector('[data-p=verdict]');
    S.drafts = S.drafts || {}; S.drafts[curPuzzle]=ed.value;
    worldDb.run('SAVEPOINT q');
    let rep; try { rep = runScript(worldDb, ed.value, 'game'); } finally { worldDb.run('ROLLBACK TO q'); worldDb.run('RELEASE q'); }
    S.drafts[curPuzzle]=ed.value;
    renderReport(out, rep);
    const last = rep.results[rep.results.length-1];
    if (rep.error || !last){ v.className='q-verdict no'; v.textContent = rep.error ? 'The rune doesn\'t understand that query yet. Check the message above.' : 'Write a SELECT query, then press Run.'; return; }
    let res; try { res = compare(worldDb, {sol:p.sol}, last); } catch(e){ res={ok:false,msg:e.message}; }
    if (res.ok){ v.className='q-verdict yes'; v.innerHTML='<b>The rune glows!</b> That\'s exactly what it was asking for.'; SFX.solve();
      if (!S.solved[curPuzzle]){ S.solved[curPuzzle]=true; S.keywords+=3; save(); setTimeout(()=>solved(curPuzzle), 10); }
      ui.pz.querySelector('[data-p=solved]').hidden=false; updateDone(true); }
    else { wrongRuns++; v.className='q-verdict no'; v.innerHTML=`<b>Not quite.</b> ${res.msg||''} ${res.tip||''}`;
      if (wrongRuns>=2) ui.pz.querySelector('[data-p=hint]').hidden=false; }
  }
  // The button at the bottom: Leave until it's solved, then Complete
  function updateDone(justSolved){
    const b=ui.pz.querySelector('[data-p=done]'), done=!!S.solved[curPuzzle];
    b.textContent = done ? 'Complete ✓' : 'Leave';
    b.classList.toggle('is-done', done);
    b.setAttribute('aria-label', done ? 'Complete: close the terminal and carry on' : 'Leave the terminal (your query is kept)');
    if (justSolved) setTimeout(()=>{ b.scrollIntoView({block:'nearest', behavior:'smooth'}); b.focus({preventScroll:true}); }, 60);
  }
  function closePuzzle(){ ui.pz.hidden=true; mode='play'; const id=curPuzzle; curPuzzle=null; if (S.solved[id] && pendingAfter){ const f=pendingAfter; pendingAfter=null; f(); } save(); }
  let pendingAfter=null;
  function solved(id){
    const then = f => { pendingAfter = f; };
    if (id==='T0') then(()=>{ SFX.door(); flash('The Academy door unlocks!'); });
    if (id==='P1' || id==='P2') then(()=>{ SFX.door(); flash('The rune door grinds open.'); });
    if (id==='P3') then(()=>{ SFX.door(); flash('The great chest unlocks.'); });
    if (id==='P4') then(()=>{ flash(S.items.key ? 'The bond rune glows. The boss door can be opened now.' : 'The bond rune glows. The boss door still needs the Primary Key.'); });
    if (id==='R') then(()=>{ S.keywords+=10; SFX.get(); say([{who:'Rex, the apprentice', face:'rex', text:'Five? FIVE?! Thank you. Here, ten keywords. And I\'ll always write a WHERE from now on. Probably.'}]); });
    if (id==='G') then(()=>{ S.maxHearts+=1; S.hearts=S.maxHearts; SFX.get(); say([{who:'Wisp', face:'wisp', text:'Unknown… at least it\'s something! Take this. It was… I think it was mine. (Your heart container grows!)'}]); });
    if (id==='B1' || id==='B2'){ then(()=>{
      if (R.boss){ R.boss.left=!!S.solved.B1; R.boss.right=!!S.solved.B2; }
      if (S.solved.B1 && S.solved.B2) bossDefeated();
      else say([{who:'The Deadlock', face:'deadlock', text: id==='B1' ? 'Our left lock… released?! Impossible! The right one will hold!' : 'Our right lock… released?! The left one will hold!'}]); }); }
  }
  function bossDefeated(){
    S.flags.bossBeaten=true; if (R.boss) R.boss.dying=60; SFX.solve(); save();
    setTimeout(()=>say([{who:'The Deadlock', face:'deadlock', text:'You… you broke the cycle… we let go… at the same… time…'}], ()=>setTimeout(ending, 400)), 900);
  }

  /* ---------- Interacting ---------- */
  function facingPoint(){ const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[S.dir]; return [S.x+6+d[0]*12, S.y+6+d[1]*12, d]; }
  function interact(){
    S.uses = (S.uses||0) + 1;
    const [px,py,d]=facingPoint();
    let tx=Math.floor(px/T), ty=Math.floor(py/T);
    const npc = R.npcs.find(n=>n.x===tx && n.y===ty) || (tileAt(tx,ty)==='C' ? R.npcs.find(n=>n.x===tx+d[0] && n.y===ty+d[1]) : null);
    if (npc){ SFX.talk(); return talk(npc.id); }
    const c=tileAt(tx,ty), key=`${S.room}:${tx},${ty}`;
    if (c==='P' && TERMINALS[key]) return openPuzzle(TERMINALS[key]);
    if (c==='L'){ S.stone={room:S.room, x:S.x, y:S.y}; S.hearts=S.maxHearts; SFX.save(); save(); return flash('Progress saved. Hearts restored.'); }
    if (c==='X') return openChest(key);
    if (c==='w' && !S.flags.crack){ if (S.items.lantern){ S.flags.crack=true; SFX.door(); save(); return flash('The Lantern of EXPLAIN shows the way through the thin wall!'); }
      return flash('The wall looks thin, but it\'s too dark to see a way through. Bram might sell something that helps.'); }
    if (c==='K' && !S.flags.bossDoor){
      if (S.items.key && S.solved.P4){ S.flags.bossDoor=true; SFX.door(); save(); return flash('The Primary Key turns. The great door opens.'); }
      return flash(!S.items.key ? 'A huge lock. It needs the Primary Key.' : 'The key fits, but the Bond Rune must be solved first.');
    }
    if (c==='d' && !isOpen(c)) return flash('A rune door. Answer the terminal nearby to open it.');
    if (c==='g' && !S.flags.gateOpen) return flash('The Archive gate is locked. Odo, the guard, has the key.');
  }
  function openChest(key){
    if (S.opened[key]) return flash('It\'s empty.');
    const what=CHESTS[key];
    if (what==='key' && !S.solved.P3) return flash('The chest is sealed by the Hoard Rune. Solve the terminal in this room.');
    S.opened[key]=true; SFX.get();
    if (what==='map'){ S.items.map=true; flash('You found the Index Map! Open the menu to see the Archive.'); }
    if (what==='kw10'){ S.keywords+=10; flash('You found 10 keywords!'); }
    if (what==='heart'){ S.maxHearts+=1; S.hearts=S.maxHearts; flash('A heart container! A note inside reads: "Whoever did this had admin access. — M."'); }
    if (what==='key'){ S.items.key=true; flash('You got the Primary Key! It opens the great door in the Antechamber.'); }
    save();
  }
  function flash(text){ msg = { text, t: 200 }; }
  // What pressing A would do right now (for the little prompt above the player)
  function promptFor(){
    const [px,py,d]=facingPoint(); const tx=Math.floor(px/T), ty=Math.floor(py/T);
    if (R.npcs.find(n=>n.x===tx && n.y===ty) || (tileAt(tx,ty)==='C' && R.npcs.find(n=>n.x===tx+d[0] && n.y===ty+d[1]))) return 'Talk';
    const c=tileAt(tx,ty), key=`${S.room}:${tx},${ty}`;
    if (c==='P' && TERMINALS[key]) return S.solved[TERMINALS[key]] ? 'Use terminal' : 'Use terminal';
    if (c==='L') return 'Save';
    if (c==='X') return S.opened[key] ? '' : 'Open';
    if ((c==='w' && !S.flags.crack) || (c==='K' && !S.flags.bossDoor) || (c==='d' && !isOpen(c)) || (c==='g' && !S.flags.gateOpen)) return 'Look';
    return '';
  }

  /* ---------- Update ---------- */
  function update(){
    tick++;
    if (fadeT>0){ fadeT--; if (fadeT===10 && fadeFn){ const f=fadeFn; fadeFn=null; f(); } return; }
    if (msg && --msg.t<=0) msg=null;
    if (mode==='dialog'){
      if (dcur && dshown < dcur.text.length){ dshown=Math.min(dcur.text.length, dshown+1.5); ui.dtext.textContent=dcur.text.slice(0,Math.floor(dshown)); if (Math.floor(dshown)%4===0) SFX.talk(); if (dshown>=dcur.text.length && dcur.choices) showChoices(); }
      if (take('a')) advance();
      return;
    }
    if (mode!=='play') return;
    if (take('menu')) return openMenu();
    // move
    const sp = 1.35; let dx=(keys.right?1:0)-(keys.left?1:0), dy=(keys.down?1:0)-(keys.up?1:0);
    if (dx||dy){ if (dx&&dy){ dx*=0.72; dy*=0.72; } S.dir = Math.abs(dx)>=Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up'); R.walk=(R.walk||0)+0.15; }
    if (R.kb){ dx=R.kb[0]; dy=R.kb[1]; if (--R.kb[2]<=0) R.kb=null; }
    const nx=S.x+dx*sp, ny=S.y+dy*sp;
    if (!boxHitsSolid(nx, S.y, 12, 12)) S.x=nx;
    if (!boxHitsSolid(S.x, ny, 12, 12)) S.y=ny;
    if (R.inv>0) R.inv--;
    // stepping on the Academy door in the village
    if (tileAt(Math.floor((S.x+6)/T), Math.floor((S.y+6)/T))==='A') return warp('academy:0,0', 7, 9);
    // leaving the room
    const edge = S.x < -4 ? 'W' : S.x > VW-8 ? 'E' : S.y < -4 ? 'N' : S.y > ROWS*T-8 ? 'S' : null;
    if (edge){ const w = WARPS_EDGE[`${S.room}:${edge}`]; if (w) return warp(w[0], w[1], w[2]);
      const [a,pos]=S.room.split(':'); let [cx,cy]=pos.split(',').map(Number);
      cx += edge==='E'?1:edge==='W'?-1:0; cy += edge==='S'?1:edge==='N'?-1:0;
      const nk=`${a}:${cx},${cy}`;
      if (ROOMS[nk]){ const px = edge==='E'?2: edge==='W'? VW-14 : S.x, py = edge==='S'?2: edge==='N'? ROWS*T-14 : S.y; return fade(()=>enterRoom(nk, px, py)); }
      S.x=Math.max(0,Math.min(VW-12,S.x)); S.y=Math.max(0,Math.min(ROWS*T-12,S.y));
    }
    // act
    if (take('a')) interact();
    if (take('b') && !R.swing){ R.swing=14; SFX.swing(); S.swings=(S.swings||0)+1; }
    if (R.swing) R.swing--;
    // the Debugger's swing
    let hb=null; if (R.swing>4){ const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[S.dir]; hb=[S.x+6+d[0]*12-8, S.y+6+d[1]*12-8, 16, 16]; }
    // enemies
    R.enemies.forEach(e=>{
      if (e.dead) return;
      e.t++; e.phase++;
      if (e.kind==='bug'){ if (e.t%90===0 || (e.vx===0&&e.vy===0)){ const a=[[0.5,0],[-0.5,0],[0,0.5],[0,-0.5]][Math.floor(Math.random()*4)]; e.vx=a[0]; e.vy=a[1]; }
        if (!boxHitsSolid(e.x+e.vx,e.y,12,12)) e.x+=e.vx; else e.vx=-e.vx;
        if (!boxHitsSolid(e.x,e.y+e.vy,12,12)) e.y+=e.vy; else e.vy=-e.vy; }
      else { const ang=Math.atan2(S.y-e.y, S.x-e.x); e.x+=Math.cos(ang)*0.32; e.y+=Math.sin(ang)*0.32; e.x=Math.max(T,Math.min(VW-2*T,e.x)); e.y=Math.max(T,Math.min(ROWS*T-2*T,e.y)); }
      e.solid = e.kind!=='ghost' || (e.phase%210) < 130;
      if (e.hurt>0) e.hurt--;
      if (hb && e.solid && !e.hurt && hb[0]<e.x+12 && hb[0]+hb[2]>e.x && hb[1]<e.y+12 && hb[1]+hb[3]>e.y){
        e.hp--; e.hurt=20; SFX.hit(); const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[S.dir]; e.x+=d[0]*10; e.y+=d[1]*10;
        if (e.hp<=0){ e.dead=true; R.fx.push({x:e.x+6,y:e.y+6,t:20});
          const r=Math.random(); if (r<0.6) R.drops.push({x:e.x+2,y:e.y+2,kind:'kw',t:600}); else if (r<0.8) R.drops.push({x:e.x+2,y:e.y+2,kind:'heart',t:600}); } }
      if (e.solid && !R.inv && S.x<e.x+11 && S.x+11>e.x && S.y<e.y+11 && S.y+11>e.y) hurt(e.x, e.y);
    });
    // the boss sends bugs while its locks hold
    if (R.boss && R.boss.alive){
      R.boss.t++;
      if (R.boss.dying){ if (--R.boss.dying<=0){ R.boss.alive=false; R.enemies.forEach(e=>e.dead=true); } }
      else if (R.boss.t % R.boss.spawn === 0 && R.enemies.filter(e=>!e.dead).length < 3) R.enemies.push({ kind:'bug', x:7.5*T, y:5*T, w:12, h:12, hp:1, vx:0, vy:0, t:0, hurt:0, phase:0 });
    }
    // pick-ups
    R.drops.forEach(d=>{ d.t--; if (!d.got && S.x<d.x+10 && S.x+12>d.x && S.y<d.y+10 && S.y+12>d.y){ d.got=true; SFX.get();
      if (d.kind==='kw'){ S.keywords+=1; } else S.hearts=Math.min(S.maxHearts, S.hearts+1); } });
    R.drops = R.drops.filter(d=>!d.got && d.t>0);
    R.fx.forEach(f=>f.t--); R.fx=R.fx.filter(f=>f.t>0);
  }
  function hurt(ex,ey){
    S.hearts--; R.inv=70; SFX.hurt();
    const ang=Math.atan2(S.y-ey, S.x-ex); R.kb=[Math.cos(ang)*2.2, Math.sin(ang)*2.2, 10];
    if (S.hearts<=0){ S.hearts=S.maxHearts; flash('You were knocked out… You wake up at your last Ledger Stone.');
      const st=S.stone; fade(()=>enterRoom(st.room, st.x, st.y)); }
  }
  function take(k){ if (pressedOnce[k]){ pressedOnce[k]=0; return true; } return false; }

  /* ---------- Drawing: 16-bit style pixel art ----------
     Everything is drawn pixel by pixel into small off-screen canvases once, then scaled up crisply.
     Sprites are written as text: each character is one pixel, looked up in a palette ('.' is see-through). */
  const P = { ink:'#2d2a2b', pink:'#d9295b', white:'#fff', gold:'#f2b632' };
  const hash = (x,y,k=0) => { let n=(x*374761393 + y*668265263 + k*1442695041)|0; n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967295; };
  function mkCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; return [c,g]; }
  const dot=(g,x,y,col)=>{ g.fillStyle=col; g.fillRect(x,y,1,1); };
  function sprite(rows, pal, flip){
    const w=rows[0].length, h=rows.length, [c,g]=mkCanvas(w,h);
    rows.forEach((r,y)=>{ if (r.length!==w) console.warn(`Sprite row ${y} is ${r.length} pixels wide, not ${w}: ${r}`); });
    rows.forEach((r,y)=>[...r].forEach((ch,x)=>{ const col=pal[ch]; if (col) dot(g, flip ? w-1-x : x, y, col); }));
    return c;
  }
  const Rr=(x,y,w,h,c)=>{ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); };

  // ---- The hero: big curly black hair, navy blazer, open-collared pink shirt
  const HERO_PAL = { k:'#1b1418', h:'#1f1a24', H:'#463f55', s:'#c48a5f', S:'#a06a43', l:'#dba57a', w:'#ffffff', e:'#2a1a14',
    m:'#8e3b3b', p:'#f6bcd2', P:'#dc93ae', n:'#243566', N:'#17224a', b:'#3a5292', g:'#2c2c36', G:'#121218' };
  const HERO_HEAD = ['...kk.kkkk.kk...','..khhkhhhhkhhk..','.khhHhhhhhhHhhk.','khhhhhhHhhhhhhhk','khHhhhhhhhhhhHhk'];
  const HERO = {
    down: HERO_HEAD.concat(['khhhhshhhhshhhhk','khhhsssssssshhhk','khhhsHHssHHshhhk','khhhsseSSesshhhk','khhhsseSSesshhhk','khhhlsssssslhhhk',
      'khhhsmwwwwmshhhk','.khhSssssssShhk.','..khkSssssSkhk..','....kpsSSspk....','..knbppssppbnk..','.knnbnppppnbnnk.','.knNnnnppnnnNnk.',
      '.knNnnnnnnnnNnk.','.ksNnnnnnnnnNsk.','..kNNnnnnnnNNk..']),
    up: HERO_HEAD.concat(['khhHhhhhhhhhHhhk','khhhhhHhhHhhhhhk','khhhhhhhhhhhhhhk','khhHhhhhhhhhHhhk','khhhhhhhhhhhhhhk','.khhhhhhhhhhhhk.',
      '..khhhhhhhhhhk..','....knsSSsnk....','..knnnnnnnnnnk..','.knnbnnnnnnbnnk.','.knnnnnNNnnnnnk.','.knNnnnNNnnnNnk.','.knNnnnnnnnnNnk.',
      '.ksNnnnnnnnnNsk.','..kNNnnnnnnNNk..','...kggggggggk...']),
    right: ['....kk.kkkk.....','...khhkhhhhk....','..khHhhhhhhhk...','.khhhhhHhhhhhk..','.khHhhhhhhhhhhk.','khhhhhhhshssshk.','khhhhhhssssshhk.',
      'khhhhhhsssssesk.','khhhhhhsssssesSk','khhhhhhssslssssk','khhhhhSssswwmsk.','..khhhkSSsssk...','....knpsSspk....','...knnppppnnk...',
      '...knnnpppnnk...','...knbnnppnnk...','...knNnnnnnnk...','...knNnnnnnnk...','...knNnnnnnsk...','....kNNnnnnk....','....kggggggk....'],
  };
  const LEGS = {
    down:  [['...kggk..kggk...','...kggk..kggk...','...kGGk..kGGk...'], ['...kggk..kggk...','...kGGk..kggk...','.........kGGk...'], ['...kggk..kggk...','...kggk..kGGk...','...kGGk.........']],
    up:    [['...kggk..kggk...','...kggk..kggk...','...kGGk..kGGk...'], ['...kggk..kggk...','...kGGk..kggk...','.........kGGk...'], ['...kggk..kggk...','...kggk..kGGk...','...kGGk.........']],
    right: [['....kggggggk....','.....kggggk.....','.....kGGGGGk....'], ['...kggk.kggk....','..kggk...kggk...','..kGGk...kGGGk..'], ['....kggggggk....','.....kggggk.....','.....kGGGGGk....']],
  };
  const heroFrames = {};
  function heroSprite(dir, f){
    const key=dir+f; if (heroFrames[key]) return heroFrames[key];
    const base = dir==='left' ? 'right' : dir;
    return heroFrames[key] = sprite(HERO[base].concat(LEGS[base][f]), HERO_PAL, dir==='left');
  }

  // ---- Everyone else: one body template, with their own hair style, skin and clothes
  const NPC_BODY = ['................','.....kkkkkk.....','....khhhhhhk....','...khhhhhhhhk...','...khhhhhhhhk...',
    '...khsssssshk...','...kssssssssk...','...kswesswesk...','...kssssssssk...','...ksssmmsssk...',
    '....kssssssk....','.....kSSSSk.....','....kccaacck....','...kcccaaccck...','..kccccaacccck..','..kcCccccccCck..',
    '..kcCccccccCck..','..ksCccccccCsk..','...kCCccccCCk...','...kCCCCCCCCk...','...kggggggggk...','...kggk..kggk...',
    '...kggk..kggk...','...kGGk..kGGk...'];
  // Hair styles replace rows of the template (row number: new row)
  const NPC_STYLE = {
    short:  {},
    bun:    { 0:'......khhk......', 1:'.....khhhhk.....' },
    long:   { 5:'..khhsssssshhk..', 6:'..khsssssssshk..', 7:'..khswessweshk..', 8:'..khsssssssshk..', 9:'..khsssmmssshk..', 10:'..khhsssssshhk..', 11:'..khhkSSSSkhhk..' },
    helmet: { 1:'.....kkkkkk.....', 2:'....kHhhhhHk....', 3:'...kHhhhhhhHk...', 4:'...khhhhhhhhk...', 5:'...khsshhsshk...' },
    messy:  { 0:'....k.k..k.k....', 1:'...khkhkkhkhk...', 2:'...khhhhhhhhk...' },
    beard:  { 9:'...kshhmmhhsk...', 10:'....khhhhhhk....', 11:'.....khhhhk.....' },
  };
  const NPCS = {
    ada:      { style:'short',  pal:{ h:'#d9295b', s:'#e3ad86', S:'#c48d66', c:'#2d2a2b', C:'#1d1b1c', a:'#d9295b', g:'#2d2a2b', G:'#121212' } },
    margaret: { style:'bun',    pal:{ h:'#dcd8e4', s:'#f1cfb0', S:'#d6ad8c', c:'#6c5a8a', C:'#4f4068', a:'#e9e3f7', g:'#3d3352', G:'#221c2e' } },
    bram:     { style:'beard',  pal:{ h:'#5a3a22', s:'#c98a5e', S:'#a96a44', c:'#7a5130', C:'#5a3a22', a:'#f3ead8', g:'#3b2a1c', G:'#1e140c' } },
    odo:      { style:'helmet', pal:{ h:'#aab3c4', H:'#7f889a', s:'#d9a27a', S:'#b8825c', c:'#5c6577', C:'#434a59', a:'#c9a24a', g:'#2f3440', G:'#16191f' } },
    rex:      { style:'messy',  pal:{ h:'#e0a95a', s:'#f1c7a5', S:'#d6a785', c:'#3f7d4f', C:'#2b5937', a:'#f3ead8', g:'#2f3a33', G:'#141a16' } },
    elin:     { style:'long',   pal:{ h:'#f0d79a', s:'#a0694a', S:'#82522f', c:'#c9893c', C:'#9e6a2c', a:'#fff4e0', g:'#5a3a22', G:'#2e1d10' } },
  };
  const npcCache = {};
  function npcSprite(id){
    if (npcCache[id]) return npcCache[id];
    const d=NPCS[id], rows=NPC_BODY.slice();
    Object.entries(NPC_STYLE[d.style]||{}).forEach(([y,r])=>{ rows[+y]=r; });
    const pal={ k:'#1b1418', w:'#ffffff', e:'#2a1a14', m:'#8e3b3b', ...d.pal };
    return npcCache[id]=sprite(rows, pal);
  }
  // Wisp and the NULL ghosts
  const GHOST = ['....kkkkkkkk....','...kwwwwwwwwk...','..kwwwwwwwwwwk..','.kwwwwwwwwwwwwk.','.kwwkkwwwwkkwwk.','.kwwkkwwwwkkwwk.',
    '.kwwwwwwwwwwwwk.','.kwwwwwkkwwwwwk.','.kwwwwwwwwwwwwk.','.kWwwwwwwwwwwWk.','.kWWwwwwwwwwWWk.','.kWWWwwwwwwWWWk.','.kWkWWkWWkWWkWk.','.k.k..k..k..k.k.'];
  const ghostSprite = sprite(GHOST, { k:'#4f4068', w:'#f4f1fb', W:'#d9d1ee' });
  // The bugs, with two walking frames
  const BUG_TOP = ['................','....k......k....','.....k....k.....','....kkkkkkkk....','...kggggggggk...','..kgwwgGGgwwgk..',
    '..kgweggggewgk..','.kglgggGGggglgk.','.kgggggGGgggggk.','.kGggggGGggggGk.','.kGGgggGGgggGGk.','..kGGGGGGGGGGk..'];
  const BUG_PAL = { k:'#14261a', g:'#4f9c45', G:'#2f6a2e', l:'#8fd46e', w:'#ffffff', e:'#1b1418' };
  const bugSprites = [ sprite(BUG_TOP.concat(['..k.k.k..k.k.k..','.k..k.k..k.k..k.']), BUG_PAL), sprite(BUG_TOP.concat(['...k.k.kk.k.k...','..k.k..kk..k.k..']), BUG_PAL) ];

  // ---- Tiles, painted pixel by pixel into the room's background
  const C = { g0:'#3f8f3a', g1:'#57ab45', g2:'#76c45a', g3:'#a2dd74', p0:'#c4a066', p1:'#dbbd86', p2:'#ead3a2', pb:'#a8834f',
    w0:'#2b5fb0', w1:'#3a79d0', w2:'#5d9ee8', s0:'#2e2838', s1:'#4a4058', s2:'#625775', s3:'#82779a', mo:'#231d2b',
    f0:'#8a5c33', f1:'#a8733f', f2:'#bd8a52', fl:'#6e4626', a0:'#7f7d8e', a1:'#9997a8', a2:'#b2b0bf', a3:'#cfcdd8',
    r0:'#8a1838', r1:'#b8244e', r2:'#d9416a', r3:'#ef7495', hw:'#f2e6cf', hs:'#d9c7a6', tb:'#6b4526', gl:'#7fb8ea', gL:'#cce6fb',
    wd:'#7a4a28', wD:'#5a341a', bk:['#d9295b','#3d6fb5','#f2b632','#3f8f3a','#8a4fb0','#e07a2f'] };
  function paintTile(g, ch, ox, oy, tx, ty, kind, nb=()=>''){
    const P=(x,y,c)=>dot(g,ox+x,oy+y,c), F=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(ox+x,oy+y,w,h); };
    const n=(x,y,k=0)=>hash(tx*16+x, ty*16+y, k);
    const grass=()=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const v=n(x,y); P(x,y, v<0.07?C.g0 : v>0.93?C.g2 : C.g1); }
      for (let i=0;i<3;i++){ if (hash(tx,ty,i+7)>0.45){ const a=1+Math.floor(hash(tx,ty,i+11)*13), b=2+Math.floor(hash(tx,ty,i+13)*12);
        P(a,b,C.g3); P(a-1,b+1,C.g2); P(a+1,b+1,C.g2); P(a,b+1,C.g0); } }
      if (hash(tx,ty,21)>0.9){ const a=3+Math.floor(hash(tx,ty,22)*10), b=3+Math.floor(hash(tx,ty,23)*10); P(a,b,'#ff8fb0'); P(a+1,b,'#ffd1df'); P(a,b+1,'#ff8fb0'); } };
    const stoneFloor=()=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const edge=(x%8===0||y%8===0), lit=(x%8===1||y%8===1);
      P(x,y, edge?C.a0 : lit?C.a3 : (n(x,y)<0.08?C.a1:C.a2)); } };
    const woodFloor=()=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const row=Math.floor(y/4), seam=y%4===3, joint=((x+row*5)%16)===0;
      P(x,y, seam||joint ? C.fl : (n(x,y)<0.12?C.f0 : y%4===0?C.f2:C.f1)); } };
    const floor=()=> kind==='wood' ? woodFloor() : stoneFloor();
    const wall=()=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const row=Math.floor(y/4), bx=(x+(row%2)*4)%8;
        let c = (y%4===3||bx===7) ? C.mo : (y%4===0 ? C.s3 : (bx===0 ? C.s2 : (n(x,y)<0.15?C.s1:C.s2)));
        P(x,y,c); } };
    const water=()=>{ for (let y=0;y<16;y++) for (let x=0;x<16;x++) P(x,y, n(x,y)<0.1?C.w0:C.w1); };
    switch (ch){
      case ',': grass(); break;
      case '=': for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const v=n(x,y); P(x,y, v<0.08?C.p0 : v>0.9?C.p2 : C.p1); }
        for (let i=0;i<2;i++){ const a=2+Math.floor(hash(tx,ty,i+31)*12), b=2+Math.floor(hash(tx,ty,i+33)*12); P(a,b,C.pb); P(a+1,b,C.p0); } break;
      case '~': water(); break;
      case 'T': grass(); // a round, shaded tree with a shadow
        g.fillStyle='rgba(0,0,0,0.22)'; g.fillRect(ox+3,oy+13,11,2);
        F(7,10,3,5,'#5a3a1f'); F(7,10,1,5,'#7a5130');
        for (let y=0;y<13;y++) for (let x=0;x<16;x++){ const dx=x-7.5, dy=y-6, d=Math.sqrt(dx*dx+dy*dy*1.1);
          if (d<7.2){ const light=(-dx-dy)/9 + (n(x,y,5)-0.5)*0.5; P(x,y, d>6.3?'#1d4a24' : light>0.45?'#7ccf5a' : light>0.05?'#4f9c45' : light>-0.4?'#3a7d37':'#2a5f2c'); } }
        P(5,3,'#a2dd74'); P(6,2,'#a2dd74'); P(4,4,'#8fd46e'); break;
      case '#': case 'e': wall(); break;
      case '.': floor(); break;
      case 'r': { F(0,0,16,16,'#e9648c'); for (let y=0;y<16;y++) for (let x=0;x<16;x++) if ((x+y)%4===0 && n(x,y)<0.5) P(x,y,'#f08aab');
        const edge='#a51d45', trim='#ffd1df';
        if (nb(0,-1)!=='r'){ F(0,0,16,2,edge); F(0,2,16,1,trim); } if (nb(0,1)!=='r'){ F(0,14,16,2,edge); F(0,13,16,1,trim); }
        if (nb(-1,0)!=='r'){ F(0,0,2,16,edge); F(2,0,1,16,trim); } if (nb(1,0)!=='r'){ F(14,0,2,16,edge); F(13,0,1,16,trim); } } break;
      case 'R': for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const row=Math.floor(y/4), cx=(x+(row%2)*4)%8, yy=y%4;
          P(x,y, yy===3 ? C.r0 : (yy===0 && cx>1 && cx<6) ? C.r3 : (cx===0||cx===7) ? C.r1 : C.r2); } break;
      case 'H': F(0,0,16,16,C.hw); F(0,0,16,2,C.tb); F(0,14,16,2,C.tb); for (let y=2;y<14;y++) if (n(0,y)<0.3) P(Math.floor(n(1,y)*16),y,C.hs);
        F(4,4,8,7,C.wD); F(5,5,6,5,C.gl); F(5,5,2,2,C.gL); F(8,5,1,5,C.wD); F(5,7,6,1,C.wD); F(4,11,8,1,C.tb); break;
      case 'D': case 'A': F(0,0,16,16,C.hw); F(0,0,16,2,C.tb); F(3,2,10,14,C.wD);
        F(4,3,8,13, ch==='A' ? '#d9295b' : C.wd); F(4,3,8,1, ch==='A' ? '#ef7495' : '#9a6238');
        F(8,3,1,13, ch==='A' ? '#a51d45' : C.wD); P(10,9,'#f2b632'); P(10,10,'#c28a12');
        if (ch==='A'){ F(5,5,6,3,'#ffffff'); F(6,6,1,1,'#d9295b'); F(9,6,1,1,'#d9295b'); } break;
      case 'B': F(0,0,16,16,'#5a3a1f'); F(1,1,14,14,'#3a2412'); F(0,7,16,2,'#7a5130'); F(0,0,16,1,'#8a5a32');
        for (let s=0;s<2;s++){ let x=2; while (x<14){ const w=1+Math.floor(hash(tx*7+x,ty,s)*2), h=4+Math.floor(hash(tx,ty*5+x,s)*2), c=C.bk[Math.floor(hash(x,s,tx+ty)*6)];
          F(x, s*8+7-h, w, h, c); P(x, s*8+7-h, '#ffffff22'); x+=w+ (hash(x,tx,s)>0.8?1:0); } } break;
      case 'C': floor(); F(0,2,16,13,'#7a5130'); F(0,2,16,3,'#b07a46'); F(0,5,16,1,'#5a3a1f'); for (let x=2;x<16;x+=5) F(x,6,1,8,'#5a3a1f'); break;
      case 'L': floor(); g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(ox+2,oy+13,12,3); F(4,2,8,13,'#6f6a78'); F(5,1,6,2,'#8d8799'); F(4,2,2,13,'#8d8799'); F(10,2,2,13,'#55505e'); F(5,14,6,1,'#4a4552'); break;
      case 'P': floor(); g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(ox+3,oy+13,10,3); F(6,9,4,6,'#5a5560'); F(5,14,6,2,'#4a4552'); F(1,1,14,9,'#3b3641'); F(1,1,14,1,'#5a5466'); break;
      case 'X': floor(); g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(ox+1,oy+13,14,3); F(1,4,14,11,'#7a4a28'); F(1,4,14,4,'#9a6238'); F(1,8,14,1,'#5a341a');
        F(3,4,1,11,'#c9a24a'); F(12,4,1,11,'#c9a24a'); F(7,7,2,3,'#f2b632'); P(7,9,'#5a341a'); break;
      case 'd': F(0,0,16,16,C.s0); F(1,1,14,15,'#4a4058'); F(2,2,12,13,'#3a3248'); F(6,4,4,8,'#ff6f9a'); F(7,6,2,4,'#3a3248'); P(7,3,'#ffb3c8'); P(8,12,'#ffb3c8'); break;
      case 'K': F(0,0,16,16,'#3b2a1c'); F(1,1,14,15,'#6b4526'); for (let x=3;x<16;x+=4) F(x,1,1,15,'#55361d'); F(1,4,14,2,'#8d8799'); F(1,11,14,2,'#8d8799'); F(6,6,4,4,'#f2b632'); F(7,9,2,3,'#c28a12'); break;
      case 'w': wall(); [[4,1],[5,2],[7,3],[8,5],[7,7],[6,8],[7,10],[9,11],[10,13],[11,14]].forEach(([x,y])=>{ P(x,y,'#140f19'); P(x+1,y,'#3a3248'); }); break;
      case 'g': F(0,0,16,16,'#2a2433'); for (let x=1;x<16;x+=4){ F(x,0,2,16,'#8d8799'); P(x,0,'#cfcdd8'); } F(0,5,16,2,'#6f6a78'); F(0,11,16,2,'#6f6a78'); break;
      default: floor();
    }
  }
  // Tiles that change as you play are drawn as the state says: an opened door becomes floor or path
  function tileFor(c, inside){
    if ('dgewK'.includes(c) && isOpen(c)) return c==='g' ? '=' : '.';
    return c;
  }
  // The background: the room, plus scenery carrying on to the edges of the screen
  let sceneCanvas=null, sceneKey='';
  function sceneSignature(){ const F=S.flags; return [S.room,CW,CH,OX,RY,Object.keys(S.solved).length,Object.keys(S.opened).length,F.gateOpen,F.crack,F.bossDoor,F.shortcut,S.items.lantern].join('|'); }
  function buildScene(){
    const [c,g]=mkCanvas(CW,CH), r=room(), inside=!!r.inside, kind = S.room.startsWith('academy') ? 'wood' : 'stone';
    g.fillStyle='#000'; g.fillRect(0,0,CW,CH);
    for (let ty=Math.floor(-(RY-HUD)/T)-1; ty<=ROWS+Math.ceil((CH-RY-ROWS*T)/T)+1; ty++)
      for (let tx=Math.floor(-OX/T)-1; tx<=COLS+Math.ceil((CW-OX-COLS*T)/T)+1; tx++){
        const inRoom = tx>=0 && tx<COLS && ty>=0 && ty<ROWS;
        const ch = inRoom ? tileFor(r.map[ty][tx], inside) : (inside ? '#' : (((tx*7+ty*13)%5===0) || Math.abs(tx*3+ty*5)%11===0 ? 'T' : ','));
        paintTile(g, ch, tx*T+OX, ty*T+RY, tx, ty, kind, (dx,dy)=>{ const X=tx+dx, Y=ty+dy; return (X>=0&&X<COLS&&Y>=0&&Y<ROWS) ? r.map[Y][X] : ''; });
      }
    sceneCanvas=c; sceneKey=sceneSignature();
  }
  // Things that move or glow are drawn on top each frame
  function drawLive(){
    const r=room();
    for (let ty=0;ty<ROWS;ty++) for (let tx=0;tx<COLS;tx++){
      const c=r.map[ty][tx], x=tx*T+OX, y=ty*T+RY;
      if (c==='~'){ const o=Math.floor(tick/18+tx*3+ty)%8; Rr(x+o,y+4,4,1,'#8cc0f5'); Rr(x+(o+5)%12,y+10,3,1,'#8cc0f5');
        if (ty>0 && r.map[ty-1][tx]!=='~') Rr(x,y,16,1,'#d8ecff'); if (tx>0 && r.map[ty][tx-1]!=='~') Rr(x,y,1,16,'#d8ecff'); }
      if (c==='L'){ const a=0.55+0.45*Math.sin(tick/15); ctx.fillStyle=`rgba(255,111,154,${a})`; ctx.fillRect(x+7,y+4,2,8); ctx.fillRect(x+6,y+6,4,1); ctx.fillRect(x+6,y+9,4,1); }
      if (c==='P'){ const done=S.solved[TERMINALS[`${S.room}:${tx},${ty}`]]; Rr(x+2,y+2,12,7, done?'#47b86a':(Math.floor(tick/24)%2?'#ff6f9a':'#d9295b'));
        Rr(x+3,y+3,7,1,'#ffffff'); Rr(x+3,y+5,5,1,'#ffffffaa'); Rr(x+3,y+7,6,1,'#ffffff66'); }
      if (c==='X' && S.opened[`${S.room}:${tx},${ty}`]){ Rr(x+1,y+2,14,4,'#5a341a'); Rr(x+2,y+5,12,2,'#2a1a0e'); }
    }
  }
  function shadow(x,y,w){ ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x,y,w,2.5,0,0,7); ctx.fill(); }
  function drawPerson(x,y,id){
    if (id==='wisp'){ ctx.globalAlpha=0.75+0.2*Math.sin(tick/20); ctx.drawImage(ghostSprite, x, y-2+Math.sin(tick/15)*2); ctx.globalAlpha=1; return; }
    shadow(x+8, y+23, 6); ctx.drawImage(npcSprite(id), x, y);
  }
  function drawPlayer(){
    if (R.inv && Math.floor(R.inv/4)%2) return;
    const moving = keys.left||keys.right||keys.up||keys.down;
    const f = moving ? [0,1,0,2][Math.floor((R.walk||0)*1.4)%4] : 0;
    const x=Math.round(S.x)-2+OX, y=Math.round(S.y)-11+RY, dir=S.dir;
    shadow(x+8, y+23, 6);
    ctx.drawImage(heroSprite(dir, f), x, y);
    if (R.swing>4){ const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir]; const sx=x+8+d[0]*12, sy=y+15+d[1]*12;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(Math.atan2(d[1],d[0]));
      ctx.fillStyle='#1b1418'; ctx.fillRect(-1,-3,15,6); ctx.fillStyle='#e8eef5'; ctx.fillRect(0,-2,13,4); ctx.fillStyle='#ffffff'; ctx.fillRect(1,-2,11,1);
      ctx.fillStyle='#d9295b'; ctx.fillRect(-4,-4,4,8); ctx.fillStyle='#f2b632'; ctx.fillRect(-1,-4,1,8); ctx.restore(); }
  }
  function drawEnemy(e){
    const x=Math.round(e.x)-2+OX, y=Math.round(e.y)-4+RY;
    if (e.hurt && Math.floor(e.hurt/3)%2) return;
    if (e.kind==='bug'){ shadow(x+8, y+15, 6); ctx.drawImage(bugSprites[Math.floor(tick/8)%2], x, y); }
    else { ctx.globalAlpha = e.solid ? 0.95 : 0.25; ctx.drawImage(ghostSprite, x, y+Math.sin(e.phase/10)); ctx.globalAlpha=1;
      if (e.solid){ ctx.fillStyle='#4f4068'; ctx.font='700 5px system-ui, sans-serif'; ctx.textAlign='center'; ctx.fillText('NULL', x+8, y-2); } }
  }
  const bossCache={};
  function bossSprite(leftFree, rightFree){
    const key=`${leftFree?1:0}${rightFree?1:0}`; if (bossCache[key]) return bossCache[key];
    const W=96, H=60, [c,g]=mkCanvas(W,H), P=(x,y,col)=>dot(g,x,y,col);
    // the body: a hulking dark mass, lit from the top left, with a dark outline
    for (let y=14;y<56;y++) for (let x=12;x<84;x++){ const dx=(x-48)/36, dy=(y-36)/20, d=dx*dx+dy*dy;
      if (d<1){ const lit=-(dx+dy)*0.6 + (hash(x,y,9)-0.5)*0.35; P(x,y, d>0.86?'#140c1c' : lit>0.35?'#6a5488' : lit>0?'#52406a' : lit>-0.4?'#3a2a4a':'#2a1d36'); } }
    // a chain across the middle
    for (let x=24;x<73;x+=6){ g.fillStyle='#1b1418'; g.fillRect(x-1,33,6,5); g.fillStyle='#a9a4b4'; g.fillRect(x,34,4,3); g.fillStyle='#ffffff'; g.fillRect(x,34,2,1); g.fillStyle='#5f5a66'; g.fillRect(x+1,35,2,1); }
    // the big central lock
    g.fillStyle='#1b1418'; g.fillRect(41,38,14,12); g.fillStyle='#c9a24a'; g.fillRect(42,39,12,10); g.fillStyle='#f2d36a'; g.fillRect(42,39,12,2);
    g.fillStyle='#1b1418'; g.fillRect(43,33,10,7); g.fillStyle='#8d8799'; g.fillRect(44,34,8,5); g.fillStyle='#1b1418'; g.fillRect(46,36,4,4); g.fillRect(47,43,2,4);
    // the two heads
    [[0,leftFree],[64,rightFree]].forEach(([hx,free])=>{
      const base=free?'#9a95a3':'#7a3f8c', dark=free?'#6f6a78':'#552a63', light=free?'#c4bfcc':'#a05ab4', eye=free?'#e3dfe8':'#ff6f9a';
      for (let y=4;y<30;y++) for (let x=2;x<30;x++){ const dx=(x-16)/14, dy=(y-17)/13; if (dx*dx+dy*dy<1){ const lit=-(dx+dy)*0.6; P(hx+x,y, (dx*dx+dy*dy)>0.82?'#140c1c' : lit>0.3?light : lit>-0.3?base:dark); } }
      // horns
      for (let k=0;k<6;k++){ g.fillStyle='#1b1418'; g.fillRect(hx+4+k,6-k,3,2); g.fillRect(hx+25-k,6-k,3,2); g.fillStyle='#e8dcc4'; g.fillRect(hx+5+k,6-k,1,1); g.fillRect(hx+26-k,6-k,1,1); }
      // eyes and a toothy mouth
      g.fillStyle='#140c1c'; g.fillRect(hx+8,13,6,5); g.fillRect(hx+18,13,6,5); g.fillStyle=eye; g.fillRect(hx+9,14,4,3); g.fillRect(hx+19,14,4,3);
      if (!free){ g.fillStyle='#ffffff'; g.fillRect(hx+10,14,1,1); g.fillRect(hx+20,14,1,1); }
      g.fillStyle='#140c1c'; g.fillRect(hx+9,21,14,5); g.fillStyle='#ffffff'; for (let t=0;t<6;t++) g.fillRect(hx+10+t*2,21,1,2);
      // a padlock hanging from each head while it's locked
      if (!free){ g.fillStyle='#1b1418'; g.fillRect(hx+10,29,12,10); g.fillStyle='#c9a24a'; g.fillRect(hx+11,30,10,8); g.fillStyle='#f2d36a'; g.fillRect(hx+11,30,10,2);
        g.fillStyle='#1b1418'; g.fillRect(hx+15,33,2,3); }
    });
    return bossCache[key]=c;
  }
  function drawBoss(){
    const b=R.boss; if (!b || !b.alive) return;
    const shake=b.dying?(Math.random()*4-2):0, x=5*T+OX-8+shake, y=1*T+RY-10+Math.round(Math.sin(tick/20)*1.5);
    ctx.globalAlpha = b.dying ? Math.max(0.1, b.dying/60) : 1;
    shadow(x+48, y+58, 34);
    ctx.drawImage(bossSprite(b.left, b.right), x, y);
    ctx.globalAlpha=1;
  }
  function drawHud(){
    const hy=RY-HUD; ctx.save(); ctx.translate(OX, hy);
    Rr(-OX,0,CW,HUD,'#2d2a2b');
    for (let i=0;i<S.maxHearts;i++){ const x=4+i*11; ctx.fillStyle = i<S.hearts ? '#ff4d7a' : '#5a5560'; ctx.beginPath(); ctx.arc(x+3,6,3,0,7); ctx.arc(x+7,6,3,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x,7); ctx.lineTo(x+5,13); ctx.lineTo(x+10,7); ctx.fill(); }
    ctx.textAlign='right'; ctx.font='700 8px system-ui, sans-serif'; ctx.fillStyle='#ffb3c8'; ctx.fillText(`◆ ${S.keywords}`, VW-4, 11);
    ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='600 7.5px system-ui, sans-serif'; ctx.fillText(room().name, VW/2+10, 11);
    ctx.restore();
  }
  function draw(){
    ctx.setTransform(SC,0,0,SC,0,0); ctx.imageSmoothingEnabled=false;
    Rr(0,0,CW,CH,'#000');
    if (!S || mode==='title' || !R){ drawTitleScene(); return; }
    if (!sceneCanvas || sceneKey!==sceneSignature()) buildScene();
    ctx.drawImage(sceneCanvas, 0, 0);
    drawLive();
    R.drops.forEach(d=>{ const x=d.x+OX, y=d.y+RY+Math.sin(tick/8)*1.5; if (d.kind==='kw'){ Rr(x+2,y,4,8,P.pink); Rr(x,y+2,8,4,P.pink); } else { ctx.fillStyle='#ff4d7a'; ctx.beginPath(); ctx.arc(x+2,y+3,2.5,0,7); ctx.arc(x+6,y+3,2.5,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x-1,y+4); ctx.lineTo(x+4,y+9); ctx.lineTo(x+9,y+4); ctx.fill(); } });
    drawBoss();
    // draw everyone from the back of the room to the front, so nearer characters overlap
    const actors=[...R.npcs.map(n=>({y:n.y*T+12, f:()=>drawPerson(n.x*T+OX, n.y*T+RY-8, n.id)})), ...R.enemies.filter(e=>!e.dead).map(e=>({y:e.y+12, f:()=>drawEnemy(e)})), {y:S.y+12, f:drawPlayer}];
    actors.sort((a,b)=>a.y-b.y).forEach(a=>a.f());
    R.fx.forEach(f=>{ ctx.strokeStyle=`rgba(255,111,154,${f.t/20})`; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(f.x+OX, f.y+RY, 20-f.t, 0, 7); ctx.stroke(); });
    if (mode==='play' && !fadeT){
      const pr = (S.uses||0) < 8 ? promptFor() : '';
      const bugsHere = R.enemies.some(e=>!e.dead);
      const label = pr ? `${KEY.a()} · ${pr}` : (bugsHere && (S.swings||0) < 4 ? `${KEY.b()} · Swing your Debugger!` : '');
      if (label){ ctx.font='700 7px system-ui, sans-serif'; const w=ctx.measureText(label).width+10, x=Math.round(S.x+OX+6-w/2), y=Math.round(S.y+RY-24);
        Rr(x, y, w, 11, 'rgba(45,42,43,0.88)'); Rr(x+w/2-2, y+11, 4, 2, 'rgba(45,42,43,0.88)'); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(label, x+w/2, y+8); }
    }
    if (room().dark && !S.items.lantern){ ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,HUD,CW,CH-HUD); }
    drawHud();
    if (msg){ ctx.font='600 8.5px system-ui, sans-serif'; const lines=wrap(msg.text, 42); const h=lines.length*11+9; const my = RY + ROWS*T - h - 6; Rr(OX+8, my, VW-16, h, 'rgba(45,42,43,0.92)'); ctx.fillStyle='#fff'; ctx.textAlign='center'; lines.forEach((l,i)=>ctx.fillText(l, OX+VW/2, my+12+i*11)); }
    if (fadeT>0){ ctx.fillStyle=`rgba(0,0,0,${1-Math.abs(fadeT-10)/10})`; ctx.fillRect(0,0,CW,CH); }
  }
  function wrap(text, n){ const out=[]; let line=''; text.split(' ').forEach(w=>{ if ((line+' '+w).trim().length>n){ out.push(line.trim()); line=w; } else line+=' '+w; }); if (line.trim()) out.push(line.trim()); return out; }
  function drawTitleScene(){
    const g=ctx.createLinearGradient(0,0,0,CH); g.addColorStop(0,'#1d1a2b'); g.addColorStop(1,'#5a2340'); ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
    for (let i=0;i<50;i++){ const x=(i*53+tick*0.15)%CW, y=(i*37)%(CH-70); Rr(x,y,1,1, i%7===0?'#ffd1df':'rgba(255,255,255,0.7)'); }
    for (let x=-16;x<CW+16;x+=16) for (let y=CH-44;y<CH;y+=16){ if (!titleTiles){ titleTiles=mkCanvas(16,16); paintTile(titleTiles[1], ',', 0,0, 3,7, 'stone'); } ctx.drawImage(titleTiles[0], x, y); }
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(0,CH-44,CW,2);
    const s=3, hx=Math.round(CW/2-8*s), hy=CH-44-24*s+6;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(CW/2, CH-44+4, 18, 4, 0, 0, 7); ctx.fill();
    ctx.drawImage(heroSprite('down', 0), hx, hy, 16*s, 24*s);
  }
  let titleTiles=null;
  function drawPortrait(face){
    const c=ui.dface, g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,32,32);
    if (face==='deadlock'){ g.fillStyle='#2a1d36'; g.fillRect(0,0,32,32); g.drawImage(bossSprite(false,false), 0,0,32,40, 0,0,26,32); g.drawImage(bossSprite(false,false), 64,0,32,40, 14,0,26,32); }
    else if (face==='wisp'){ g.fillStyle='#e9e3f7'; g.fillRect(0,0,32,32); g.drawImage(ghostSprite, 0,0,16,16, 0,2,32,32); }
    else if (face && NPCS[face]){ g.fillStyle='#f3ead8'; g.fillRect(0,0,32,32); g.drawImage(npcSprite(face), 0,0,16,16, 0,2,32,32); }
    ui.dface.hidden=!face;
  }

  /* ---------- Menu, title and ending ---------- */
  function openMenu(){
    releaseAll(); mode='menu'; ui.menu.hidden=false;
    const it=S.items, q=[];
    q.push(`<li>${S.flags.bossBeaten?'✓':'•'} <b>Restore the Royal Ledger</b>${S.flags.bossBeaten?'':`: ${!S.solved.T0?'answer the terminal in the Academy':!S.flags.metMargaret?'find Margaret in the village square':!S.flags.gateOpen?'show the Archive Pass to Odo at the east gate':'explore the Royal Archive'}`}</li>`);
    if (S.flags.rexAsked) q.push(`<li>${S.solved.R?'✓':'•'} Help Rex count the villagers with no coins</li>`);
    if (S.flags.wispAsked) q.push(`<li>${S.solved.G?'✓':'•'} Help Wisp find out what he is</li>`);
    const items=[['Debugger','Your trusty sword, for bugs',true],['Archive Pass','Opens the gate',it.pass],['Lantern of EXPLAIN','Shows what\'s hidden',it.lantern],['Index Map','A map of the Archive',it.map],['🔑 Primary Key','Opens the great door',it.key]].filter(x=>x[2]);
    ui.menu.querySelector('[data-m=quests]').innerHTML=q.join('');
    ui.menu.querySelector('[data-m=items]').innerHTML=items.map(([n,d])=>`<li><b>${n}</b>: ${d}</li>`).join('');
    ui.menu.querySelector('[data-m=controls]').innerHTML = touch()
      ? '<li><b>D-pad</b>: move</li><li><b>A</b>: talk, use terminals, open chests, save at Ledger Stones</li><li><b>B</b>: swing the Debugger</li><li><b>☰</b>: this menu</li><li><b>⛶ Full screen</b>, above the game, fills your screen</li>'
      : '<li><b>Arrow keys</b> or <b>WASD</b>: move</li><li><b>Space</b> or <b>E</b>: talk, use terminals, open chests, save at Ledger Stones</li><li><b>J</b> or <b>X</b>: swing the Debugger</li><li><b>Esc</b> or <b>P</b>: this menu</li><li>At a terminal, <b>Ctrl + Enter</b> (⌘ + Enter on a Mac) runs your query</li>';
    ui.menu.querySelector('[data-m=stats]').textContent=`Hearts ${S.hearts}/${S.maxHearts} · Keywords ${S.keywords} · Puzzles solved ${Object.keys(S.solved).length}/9`;
    const mp=ui.menu.querySelector('[data-m=map]');
    if (it.map){ const cells=[]; for (let y=0;y<2;y++) for (let x=0;x<4;x++){ const k=`archive:${x},${y}`; const ex=ROOMS[k]; cells.push(`<span class="${!ex?'none':S.room===k?'here':S.visited[k]?'seen':'unseen'}" title="${ex?ex.name:''}"></span>`); }
      mp.innerHTML=`<p><b>The Royal Archive</b> (pink is you)</p><div class="q-map">${cells.join('')}</div>`; } else mp.innerHTML='';
    ui.menu.querySelector('[data-m=sound]').textContent = muted ? '🔇 Sound: off' : '🔊 Sound: on';
    ui.menu.querySelector('[data-m=exitfull]').hidden = !fullOn;
  }
  function closeMenu(){ ui.menu.hidden=true; mode='play'; }
  function howToPlay(){ return touch()
    ? '<b>How to play:</b> move with the <b>D-pad</b> · <b>A</b> to talk, use and open · <b>B</b> to swing your Debugger · <b>☰</b> for the menu'
    : '<b>How to play:</b> move with the <b>arrow keys</b> or <b>WASD</b> · <b>Space</b> to talk, use and open · <b>J</b> to swing your Debugger · <b>Esc</b> for the menu'; }
  function showTitle(){
    mode='title'; ui.title.hidden=false; ui.title.querySelector('[data-t=how]').innerHTML = howToPlay(); ui.end.hidden=true; ui.menu.hidden=true; ui.dlg.hidden=true; ui.pz.hidden=true;
    const sv=loadSave(); const c=ui.title.querySelector('[data-t=continue]'); c.hidden=!sv;
    if (sv) c.textContent = `Continue (${ROOMS[sv.room]?ROOMS[sv.room].name:'saved game'})`;
    setTimeout(()=>{ (sv ? c : ui.title.querySelector('[data-t=new]')).focus({preventScroll:true}); }, 50);
  }
  function begin(fresh){
    if (fresh){ if (loadSave() && !confirm('Start a new game? Your saved progress will be lost.')) return; S=newGame(); }
    else S=loadSave()||newGame();
    S._t=Date.now(); ui.title.hidden=true; releaseAll(); mode='play';
    enterRoom(S.room, S.x, S.y);
    if (fresh) setTimeout(()=>say([{text:'Your first morning at Sparta Academy. Trainer Ada is waiting for you…'}]), 300);
  }
  function ending(){
    save(); mode='ending'; ui.end.hidden=false;
    const mins=Math.max(1, Math.round(S.playMs/60000)), side=(S.solved.R?1:0)+(S.solved.G?1:0);
    ui.end.querySelector('[data-e=stats]').textContent=`Time ${mins} min · Puzzles ${Object.keys(S.solved).length}/9 · Side quests ${side}/2 · Keywords ${S.keywords}`;
  }

  /* ---------- Loop and controls ---------- */
  let stageEl=null;
  function frame(ts){ raf=requestAnimationFrame(frame);
    stageEl = stageEl || document.getElementById('gameStage'); if (stageEl){ stageEl.classList.toggle('ui-open', mode==='puzzle'||mode==='menu'||mode==='title'||mode==='ending'); stageEl.classList.toggle('ui-panel', mode==='puzzle'||mode==='menu'); } if (!last) last=ts; acc+=Math.min(100,ts-last); last=ts; while (acc>=1000/60){ update(); acc-=1000/60; } draw(); }
  const KEYMAP = { ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right',
    Space:'a', Enter:'a', KeyE:'a', KeyJ:'b', KeyX:'b', KeyK:'b', Escape:'menu', KeyP:'menu' };
  function onKey(e){
    if (!running) return;
    const k=KEYMAP[e.code]; if (!k) return;
    if (mode==='puzzle'){ if (e.code==='Escape' && e.type==='keydown'){ e.preventDefault(); closePuzzle(); } return; }
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (mode==='title' || mode==='ending') return;
    e.preventDefault();
    if (mode==='menu'){ if (e.type==='keydown' && (k==='menu')) closeMenu(); return; }
    if (mode==='dialog' && dcur && dcur.choices && dshown>=dcur.text.length && e.type==='keydown' && (k==='up'||k==='down')){ dchoice=(dchoice+(k==='down'?1:dcur.choices.length-1))%dcur.choices.length; showChoices(); return; }
    if (k==='menu'){ if (e.type==='keydown' && mode==='play') pressedOnce.menu=1; return; }
    keys[k]= e.type==='keydown'; if (e.type==='keydown' && !e.repeat && (k==='a'||k==='b')) pressedOnce[k]=1;
  }
  function bindPad(id,k){
    const b=document.getElementById(id); if (!b) return;
    const on=e=>{ e.preventDefault(); if (k==='menu'){ if (mode==='play') pressedOnce.menu=1; else if (mode==='menu') closeMenu(); return; }
      if (mode==='dialog' && dcur && dcur.choices && dshown>=dcur.text.length && (k==='up'||k==='down')){ dchoice=(dchoice+(k==='down'?1:dcur.choices.length-1))%dcur.choices.length; showChoices(); return; }
      keys[k]=true; if (k==='a'||k==='b') pressedOnce[k]=1; b.classList.add('pressed'); try{ b.setPointerCapture(e.pointerId); }catch(_){} };
    const off=e=>{ e.preventDefault(); if (k!=='menu') keys[k]=false; b.classList.remove('pressed'); };
    b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointercancel',off); b.addEventListener('lostpointercapture',off); b.addEventListener('contextmenu',e=>e.preventDefault());
    // iOS starts a text selection or a long-press menu from touch events, so stop those at the source too
    ['touchstart','touchmove','touchend'].forEach(ev=>b.addEventListener(ev, e=>{ if (e.cancelable) e.preventDefault(); }, {passive:false}));
    b.addEventListener('selectstart', e=>e.preventDefault());
  }
  function start(){
    cv=document.getElementById('gameCanvas'); ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false; fitCanvas(); setTimeout(fitCanvas, 50);
    if (!bound){
      bound=true;
      ['dlg','dname','dtext','dchoices','dface','pz','menu','title','end'].forEach(k=>ui[k]=document.getElementById('q_'+k));
      addEventListener('keydown',onKey); addEventListener('keyup',onKey);
      [['gUp','up'],['gDown','down'],['gLeft','left'],['gRight','right'],['gA','a'],['gB','b'],['gMenu','menu']].forEach(([id,k])=>bindPad(id,k));
      ui.dlg.addEventListener('pointerdown', e=>{ if (e.target.closest('button')) return; e.preventDefault(); advance(); });
      // no text selection from long presses anywhere on the game itself (puzzle text and the query box are still selectable)
      document.getElementById('gameStage').addEventListener('selectstart', e=>{ if (!e.target.closest || !e.target.closest('.q-panel')) e.preventDefault(); });
      cv.addEventListener('touchstart', e=>{ if (e.cancelable) e.preventDefault(); }, {passive:false});
      ui.pz.querySelector('[data-p=run]').onclick=runPuzzle;
      ui.pz.querySelector('[data-p=close]').onclick=closePuzzle;
      ui.pz.querySelector('[data-p=done]').onclick=closePuzzle;
      ui.pz.querySelector('[data-p=clear]').onclick=()=>{ ui.pz.querySelector('textarea').value=''; };
      ui.pz.querySelector('[data-p=back]').onclick=()=>{ const ed=ui.pz.querySelector('textarea'); ed.value=ed.value.replace(/\s*(\S+)\s*$/,''); };
      ui.pz.querySelector('[data-p=showhint]').onclick=()=>{ ui.pz.querySelector('[data-p=hint]').hidden=false; };
      // Desktop: say how to run a query from the keyboard (⌘ on a Mac)
      const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
      if (mac){ ui.pz.querySelector('[data-p=kbd]').innerHTML='<kbd>⌘</kbd> + <kbd>Enter</kbd> runs'; ui.pz.querySelector('[data-p=run]').title='Run your query (⌘ + Enter)'; }
      if (matchMedia('(pointer: fine)').matches) ui.pz.querySelector('textarea').placeholder = `Type your query, then press ${mac?'⌘':'Ctrl'} + Enter or Run`;
      ui.pz.querySelector('textarea').addEventListener('input', e=>{ if (curPuzzle){ S.drafts=S.drafts||{}; S.drafts[curPuzzle]=e.target.value; } });
      ui.pz.querySelector('textarea').addEventListener('keydown', e=>{ if ((e.ctrlKey||e.metaKey) && e.key==='Enter'){ e.preventDefault(); runPuzzle(); } });
      ui.pz.querySelector('[data-p=lesson]').addEventListener('click', ()=>{ save(); exitFull(); });
      ui.menu.querySelector('[data-m=resume]').onclick=closeMenu;
      ui.menu.querySelector('[data-m=sound]').onclick=()=>{ muted=!muted; try{ localStorage.setItem(SAVE_KEY+'.muted', muted?'1':'0'); }catch(e){} openMenu(); };
      ui.menu.querySelector('[data-m=quit]').onclick=()=>{ save(); showTitle(); };
      ui.menu.querySelector('[data-m=exitfull]').onclick=()=>{ exitFull(); closeMenu(); };
      ui.title.querySelector('[data-t=continue]').onclick=()=>begin(false);
      ui.title.querySelector('[data-t=new]').onclick=()=>begin(true);
      ui.end.querySelector('[data-e=title]').onclick=()=>showTitle();
      document.addEventListener('visibilitychange', ()=>{ if (document.hidden) Object.keys(keys).forEach(k=>keys[k]=false); });
      document.getElementById('gFull').addEventListener('click', enterFull);
      addEventListener('resize', fitCanvas); if (window.visualViewport) visualViewport.addEventListener('resize', fitCanvas);
      addEventListener('blur', ()=>Object.keys(keys).forEach(k=>keys[k]=false));
      document.getElementById('gExitFull').addEventListener('click', exitFull);
      // leaving the browser's full-screen mode (for example with Esc, or a swipe) also leaves ours
      ['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev, ()=>{ if (!(document.fullscreenElement||document.webkitFullscreenElement) && fullOn && document.getElementById('gameStage').dataset.realFull==='1') exitFull();
        document.getElementById('gameStage').dataset.realFull = (document.fullscreenElement||document.webkitFullscreenElement) ? '1' : '0'; }));
    }
    running=true; last=0; acc=0; cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
    if (!S || mode==='title') showTitle();
  }
  /* ---------- Full screen ----------
     Uses the browser's real full-screen mode where it exists (Android, desktop, iPad). iPhones don't allow it for web pages,
     so there the game simply fills the window instead. */
  let fullOn=false;
  function fitCanvas(){
    if (!cv) return;
    if (fullOn){
      const vw = (window.visualViewport ? visualViewport.width : innerWidth), vh = (window.visualViewport ? visualViewport.height : innerHeight);
      if (vw/vh > VW/VH){ CH = VH; CW = Math.round(VH*vw/vh); } else { CW = VW; CH = Math.round(VW*vh/vw); }
    } else { CW = VW; CH = VH; }
    OX = Math.floor((CW-VW)/2); RY = HUD + Math.floor((CH-VH)/2);
    SC = Math.min(4, Math.max(2, Math.ceil((cv.getBoundingClientRect().width || CW*3) * (window.devicePixelRatio||1) / CW)));
    if (cv.width!==CW*SC || cv.height!==CH*SC){ cv.width=CW*SC; cv.height=CH*SC; ctx.imageSmoothingEnabled=false; }
  }
  function enterFull(){
    const st=document.getElementById('gameStage'); fullOn=true; st.classList.add('full'); document.body.classList.add('game-full');
    const req = st.requestFullscreen || st.webkitRequestFullscreen;
    if (req){ try { const p=req.call(st); if (p && p.catch) p.catch(()=>{}); } catch(e){} }
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); } catch(e){}
    window.scrollTo(0,0); setTimeout(fitCanvas, 60); setTimeout(fitCanvas, 400);
  }
  function exitFull(){
    if (!fullOn) return; fullOn=false;
    const st=document.getElementById('gameStage'); st.classList.remove('full'); document.body.classList.remove('game-full');
    const fe = document.fullscreenElement || document.webkitFullscreenElement;
    if (fe){ const ex=document.exitFullscreen || document.webkitExitFullscreen; try { const p=ex.call(document); if (p && p.catch) p.catch(()=>{}); } catch(e){} }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(e){}
    fitCanvas();
  }
  function stop(){ exitFull(); if (S && mode==='play') save(); running=false; cancelAnimationFrame(raf); Object.keys(keys).forEach(k=>keys[k]=false); }
  // For tests
  const state = () => S && ({ mode, room:S.room, x:Math.round(S.x), y:Math.round(S.y), hearts:S.hearts, maxHearts:S.maxHearts, keywords:S.keywords,
    solved:Object.keys(S.solved).sort(), flags:Object.keys(S.flags).filter(k=>S.flags[k]).sort(), items:Object.keys(S.items).filter(k=>S.items[k]).sort(), enemies:R?R.enemies.filter(e=>!e.dead).length:0, prompt: (R && mode==='play') ? promptFor() : '' });
  const testWarp = (key, tx, ty) => { enterRoom(key, tx*T+2, ty*T+2); };
  const testGive = (what) => { if (what==='keywords') S.keywords+=50; else S.items[what]=true; };
  const testFace = d => { S.dir=d; };
  const testPress = k => { pressedOnce[k]=1; };
  // tests: every hero frame and character side by side, enlarged
  const testSheet = () => { const sc=6, [c,g]=mkCanvas(16*sc*12, 24*sc+10); g.fillStyle='#9bd96f'; g.fillRect(0,0,c.width,c.height); let i=0;
    ['down','left','right','up'].forEach(d=>[0,1,2].forEach(f=>{ g.drawImage(heroSprite(d,f), i*16*sc, 0, 16*sc, 24*sc); i++; })); return c.toDataURL(); };
  const testPeople = () => { const sc=5, ids=Object.keys(NPCS), [c,g]=mkCanvas(16*sc*(ids.length+3), 24*sc); g.fillStyle='#9bd96f'; g.fillRect(0,0,c.width,c.height);
    ids.forEach((id,i)=>g.drawImage(npcSprite(id), i*16*sc, 0, 16*sc, 24*sc)); g.drawImage(ghostSprite, ids.length*16*sc, 0, 16*sc, 14*sc);
    g.drawImage(bugSprites[0], (ids.length+1)*16*sc, 0, 16*sc, 14*sc); g.drawImage(bugSprites[1], (ids.length+2)*16*sc, 0, 16*sc, 14*sc); return c.toDataURL(); };
  return { start, stop, state, testWarp, testGive, testFace, testPress, testSheet, testPeople, enterFull, exitFull };
})();
window.GAME_STATE = () => GAME.state();                 // tests only
window.GAME_TEST = { warp:GAME.testWarp, give:GAME.testGive, face:GAME.testFace, press:GAME.testPress, sheet:GAME.testSheet, people:GAME.testPeople };
