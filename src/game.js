/* ---------- Game: Spartan SQL Run ----------
   An original platform level in the spirit of classic side-scrollers, with a Sparta Global and SQL theme.
   Run right, stomp the bugs, hit ? blocks for SQL keywords, grab the Primary Key and reach the COMMIT flag.
   Pixel art is drawn with rectangles, so there are no image files. */
const GAME = (() => {
  const T = 16, VW = 384, VH = 216, ROWS = 14;           // tile size, view size (pixels), level height (tiles)
  const KEYWORDS = ['SELECT','FROM','WHERE','JOIN','GROUP BY','HAVING','ORDER BY','INSERT','UPDATE','DELETE',
                    'CREATE','INDEX','VIEW','COUNT','SUM','AVG','DISTINCT','LIMIT','CASE','WITH','UNION','COMMIT'];
  const COL = { sky:'#eef1f5', hill:'#f7cad7', hill2:'#f2b3c6', cloud:'#ffffff', ground:'#2d2a2b', groundTop:'#d9295b',
                brick:'#3d393a', mortar:'#2a2627', q:'#d9295b', qDark:'#a51d45', used:'#8d8789', stair:'#58525a',
                db:'#5c6577', dbLight:'#7d8799', dbDark:'#424a59', pink:'#d9295b', ink:'#2d2a2b', white:'#ffffff',
                bug:'#3f7d4f', bugDark:'#2b5937', key:'#f2b632', keyDark:'#c28a12', skin:'#f1c7a5' };

  /* ---------- The level ---------- */
  let W = 0, map = [], flagX = 0, hqX = 0, enemyStarts = [], tokenStarts = [];
  function buildLevel(){
    W = 214; flagX = 197; hqX = 203;
    map = Array.from({length:ROWS}, () => Array(W).fill(' '));
    const set = (x,y,c) => { if (x>=0 && x<W && y>=0 && y<ROWS) map[y][x]=c; };
    for (let x=0; x<W; x++){ set(x,12,'#'); set(x,13,'#'); }
    const pit = (a,b) => { for (let x=a; x<=b; x++){ set(x,12,' '); set(x,13,' '); } };
    const db = (x,h) => { for (let y=12-h; y<12; y++){ set(x,y, y===12-h?'p':'P'); set(x+1,y, y===12-h?'q':'Q'); } };
    const stairs = (x0, heights) => heights.forEach((h,i)=>{ for (let y=12-h; y<12; y++) set(x0+i,y,'S'); });
    const row = (x,y,s) => [...s].forEach((c,i)=>{ if (c!=='.') set(x+i,y,c); });
    // Opening stretch
    row(15,8,'?');  row(20,8,'B?BMB'); row(22,4,'?');
    db(28,2); db(38,3); db(47,4); db(58,4);
    pit(69,70);
    row(76,8,'B?B'); row(79,4,'BBBBBBBB');
    pit(86,88);
    row(91,4,'BBB?'); row(94,8,'B');
    row(100,8,'BB');
    row(106,8,'?'); row(109,8,'?'); row(112,8,'?'); row(109,4,'?');
    row(118,8,'B'); row(121,4,'BBB');
    row(128,4,'B??B'); row(129,8,'BB');
    stairs(134,[1,2,3,4]); stairs(140,[4,3,2,1]);
    stairs(148,[1,2,3,4,4]); pit(153,154); stairs(155,[4,3,2,1]);
    db(163,2); row(168,8,'BB?B'); db(179,2);
    stairs(181,[1,2,3,4,5,6,7,8,8]);
    set(flagX,11,'S');
    enemyStarts = [22,40,51,53,81,97,99,107,109,115,117,124,126,173,175];
    tokenStarts = [[44,7],[45,7],[69,8],[70,8],[87,6],[88,6],[143,7],[144,7],[153,6],[154,6],[160,9],[161,9]];
  }
  const solid = c => c!==' ';
  const tileAt = (tx,ty) => (ty<0 || tx<0 || tx>=W) ? (tx<0||tx>=W ? '#' : ' ') : (ty>=ROWS ? ' ' : map[ty][tx]);

  /* ---------- State ---------- */
  let cv, ctx, wrap, raf=0, last=0, acc=0, running=false;
  const keys = { left:false, right:false, jump:false };
  let jumpWasDown=false, jumpBuf=0;
  let S;   // the game state
  function freshState(){
    buildLevel();
    return { phase:'title', score:0, lives:3, time:300, tick:0, camX:0, checkpoint:0, collected:[], kwIndex:0,
      player:null, enemies:[], items:[], tokens:[], popups:[], bumps:[], debris:[], flagY:0, winT:0, deadT:0 };
  }
  function spawnLevelThings(){
    S.player = { x:(S.checkpoint?S.checkpoint:3)*T, y:9*T, w:12, h:15, vx:0, vy:0, big:false, onGround:false, face:1, inv:0, coyote:0, anim:0, ctl:true };
    S.enemies = enemyStarts.filter(x=>x*T > S.player.x + 6*T).map(x=>({ x:x*T, y:10*T, w:14, h:12, vx:-0.55, vy:0, alive:true, squash:0, active:false }));
    S.tokens = tokenStarts.filter(([x])=>x*T > S.player.x).map(([x,y])=>({ x:x*T+3, y:y*T+3, w:10, h:10, got:false, kw:nextKeyword(true) }));
    S.items = []; S.popups = []; S.debris = []; S.camX = Math.max(0, S.player.x - 5*T); S.time = 300;
  }
  function nextKeyword(peek){ const k=KEYWORDS[S.kwIndex % KEYWORDS.length]; if (!peek) S.kwIndex++; return k; }

  /* ---------- Physics ---------- */
  function rectHitsSolid(x,y,w,h){
    for (let ty=Math.floor(y/T); ty<=Math.floor((y+h-1)/T); ty++)
      for (let tx=Math.floor(x/T); tx<=Math.floor((x+w-1)/T); tx++)
        if (solid(tileAt(tx,ty))) return { tx, ty };
    return null;
  }
  function moveBody(b, onHead){
    // horizontal
    b.x += b.vx;
    let hit = rectHitsSolid(b.x,b.y,b.w,b.h);
    if (hit){ if (b.vx>0) b.x = hit.tx*T - b.w; else if (b.vx<0) b.x = (hit.tx+1)*T; b.hitWall=true; b.vx = b.bounce ? -b.vx : 0; } else b.hitWall=false;
    // vertical
    b.y += b.vy; b.onGround=false;
    hit = rectHitsSolid(b.x,b.y,b.w,b.h);
    if (hit){
      if (b.vy>0){ b.y = hit.ty*T - b.h; b.onGround=true; }
      else if (b.vy<0){ b.y = (hit.ty+1)*T; if (onHead){
          // the block(s) above the head
          const cx = b.x + b.w/2, tx = Math.floor(cx/T); onHead(solid(tileAt(tx,hit.ty)) ? tx : hit.tx, hit.ty); } }
      b.vy = 0;
    }
  }
  function bumpBlock(tx,ty){
    const c = tileAt(tx,ty), p = S.player;
    if (c==='?' || c==='M'){
      map[ty][tx]='U'; S.bumps.push({tx,ty,t:8});
      if (c==='?'){ const kw=nextKeyword(); S.collected.push(kw); S.score+=200; popup(tx*T+8, ty*T-6, kw); }
      else S.items.push({ x:tx*T+2, y:ty*T-12, w:12, h:12, vx:0.8, vy:-1.5, bounce:true, kind:'key', rising:12 });
    } else if (c==='B'){
      if (p.big){ map[ty][tx]=' '; S.score+=50;
        for (const [dx,dy] of [[-1,-3],[1,-3],[-1.4,-2],[1.4,-2]]) S.debris.push({ x:tx*T+8, y:ty*T+8, vx:dx, vy:dy, t:60 }); }
      else S.bumps.push({tx,ty,t:8});
      // knock out any bug standing on it
      S.enemies.forEach(e=>{ if (e.alive && Math.abs(e.x+e.w/2-(tx*T+8))<12 && Math.abs(e.y+e.h-ty*T)<3) killEnemy(e,true); });
    }
  }
  function popup(x,y,text,color){ S.popups.push({ x, y, text, t:50, color:color||COL.pink }); }
  function killEnemy(e, flip){ e.alive=false; e.squash = flip ? -1 : 30; S.score+=100; popup(e.x+e.w/2, e.y-4, '+100', COL.ink); if (flip){ e.vy=-3; } }
  function hurt(){
    const p=S.player; if (p.inv>0 || S.phase!=='play') return;
    if (p.big){ p.big=false; p.y+=11; p.h=15; p.inv=100; popup(p.x+6,p.y-6,'Key lost!',COL.ink); }
    else die();
  }
  function die(){
    if (S.phase!=='play') return;
    S.phase='dead'; S.deadT=0; S.player.vy=-5; S.player.ctl=false;
  }

  function update(){
    S.tick++;
    const p=S.player;
    if (S.phase==='play'){
      if (S.tick%60===0){ S.time--; if (S.time<=0) die(); }
      // input
      const dir = (keys.right?1:0) - (keys.left?1:0);
      if (dir){ p.vx += dir*0.22; p.face=dir; } else { p.vx *= p.onGround ? 0.78 : 0.95; if (Math.abs(p.vx)<0.05) p.vx=0; }
      p.vx = Math.max(-2.1, Math.min(2.1, p.vx));
      if (p.onGround) p.coyote=6; else if (p.coyote>0) p.coyote--;
      if (keys.jump && !jumpWasDown) jumpBuf = Math.max(jumpBuf, 6); jumpWasDown = keys.jump;
      if (jumpBuf>0){ jumpBuf--; if (p.coyote>0){ p.vy = p.big ? -6.9 : -6.6; p.coyote=0; jumpBuf=0; } }
      p.vy += (keys.jump && p.vy<0) ? 0.24 : 0.48; if (p.vy>7) p.vy=7;
      moveBody(p, bumpBlock);
      if (p.x < S.camX) { p.x = S.camX; p.vx = Math.max(0,p.vx); }
      if (p.inv>0) p.inv--;
      p.anim += Math.abs(p.vx)*0.25;
      if (p.y > ROWS*T + 20) { S.player.vy=0; die(); }
      if (p.x > 100*T && S.checkpoint===0) { S.checkpoint=100; popup(p.x,p.y-10,'Checkpoint saved',COL.ink); }
      // reached the COMMIT flag
      if (p.x + p.w >= flagX*T - 1){ S.phase='win'; S.winT=0; p.x = flagX*T - p.w; p.vx=0; p.vy=0;
        const bonus = Math.max(0, Math.round((12 - p.y/T) * 400)); S.score += bonus + S.time*10; popup(p.x, p.y-12, `+${bonus}`, COL.ink); }
    } else if (S.phase==='dead'){
      S.deadT++; p.vy += 0.35; p.y += p.vy;
      if (S.deadT>110){ S.lives--; if (S.lives<=0){ S.phase='over'; } else { spawnLevelThings(); S.phase='play'; } }
    } else if (S.phase==='win'){
      S.winT++;
      if (S.flagY < 8*T) S.flagY += 2.2;
      if (p.y + p.h < 12*T - 1 && S.winT<200) p.y = Math.min(p.y+2, 12*T - p.h);
      else if (p.x < (hqX+2)*T){ p.x += 1.2; p.anim+=0.3; p.face=1; }
      else S.winDone = true;
    }
    // camera follows, never scrolling back
    const target = p.x - VW*0.4;
    S.camX = Math.max(S.camX, Math.min(target, W*T - VW)); if (S.camX<0) S.camX=0;

    // enemies
    S.enemies.forEach(e=>{
      if (!e.active && e.x < S.camX + VW + 2*T) e.active=true;
      if (!e.active) return;
      if (!e.alive){ if (e.squash>0) e.squash--; else if (e.squash<0){ e.vy+=0.35; e.y+=e.vy; } return; }
      e.vy = Math.min(e.vy+0.4, 6); e.bounce=true; moveBody(e);
      if (e.y > ROWS*T + 20) e.alive=false, e.squash=0;
      if (S.phase!=='play') return;
      // touching the player?
      if (p.x < e.x+e.w && p.x+p.w > e.x && p.y < e.y+e.h && p.y+p.h > e.y){
        if (p.vy > 0.5 && p.y + p.h - e.y < 9){ killEnemy(e,false); p.vy = keys.jump ? -6 : -4.2; }
        else hurt();
      }
    });
    // bugs turn round when they meet each other
    for (let i=0;i<S.enemies.length;i++) for (let j=i+1;j<S.enemies.length;j++){
      const a=S.enemies[i], b=S.enemies[j];
      if (a.alive && b.alive && a.active && b.active && Math.abs(a.x-b.x)<a.w && Math.abs(a.y-b.y)<a.h){ a.vx=-a.vx; b.vx=-b.vx; a.x += a.vx*2; b.x += b.vx*2; }
    }
    // items (the Primary Key power-up)
    S.items.forEach(it=>{
      if (it.got) return;
      if (it.rising>0){ it.y -= 1; it.rising--; return; }
      it.vy = Math.min(it.vy+0.35, 6); moveBody(it);
      if (S.phase==='play' && p.x < it.x+it.w && p.x+p.w > it.x && p.y < it.y+it.h && p.y+p.h > it.y){
        it.got=true;
        if (!p.big){ p.big=true; p.y-=11; p.h=26; popup(p.x+6,p.y-6,'PRIMARY KEY!',COL.pink); }
        else { S.score+=1000; popup(p.x+6,p.y-6,'+1000',COL.ink); }
      }
      if (it.y > ROWS*T+20) it.got=true;
    });
    // keyword tokens floating in the air
    S.tokens.forEach(tk=>{
      if (tk.got || S.phase!=='play') return;
      if (p.x < tk.x+tk.w && p.x+p.w > tk.x && p.y < tk.y+tk.h && p.y+p.h > tk.y){
        tk.got=true; const kw=nextKeyword(); S.collected.push(kw); S.score+=200; popup(tk.x+5, tk.y-4, kw);
      }
    });
    S.popups.forEach(q=>{ q.t--; q.y-=0.5; }); S.popups = S.popups.filter(q=>q.t>0);
    S.bumps.forEach(b=>b.t--); S.bumps = S.bumps.filter(b=>b.t>0);
    S.debris.forEach(d=>{ d.t--; d.vy+=0.3; d.x+=d.vx; d.y+=d.vy; }); S.debris = S.debris.filter(d=>d.t>0);
  }

  /* ---------- Drawing ---------- */
  const R = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function drawBackground(){
    R(0,0,VW,VH,COL.sky);
    // far hills and clouds move slowly
    const far = -S.camX*0.3, mid = -S.camX*0.55;
    for (let i=-1;i<20;i++){
      const hx = (i*260 + far) % (VW*6);
      ctx.fillStyle=COL.hill; ctx.beginPath(); ctx.ellipse(hx+80, 12*T, 90, 46, 0, Math.PI, 0); ctx.fill();
      const cx = (i*190 + 40 - S.camX*0.15);
      ctx.fillStyle=COL.cloud; ctx.beginPath(); ctx.ellipse(cx, 40+(i%3)*12, 22, 9, 0, 0, Math.PI*2); ctx.ellipse(cx+16, 36+(i%3)*12, 16, 9, 0, 0, Math.PI*2); ctx.fill();
      const bx = (i*150 + 60 + mid);
      ctx.fillStyle=COL.hill2; ctx.beginPath(); ctx.ellipse(bx, 12*T, 30, 18, 0, Math.PI, 0); ctx.fill();
    }
  }
  function drawTile(c,x,y,tx,ty){
    const bump = S.bumps.find(b=>b.tx===tx && b.ty===ty); if (bump) y -= Math.sin((8-bump.t)/8*Math.PI)*5;
    if (c==='#'){ R(x,y,T,T,COL.ground); if (tileAt(tx,ty-1)===' ' || ty===12) R(x,y,T,3,COL.groundTop); R(x+3,y+7,2,2,'#3a3637'); R(x+10,y+11,2,2,'#3a3637'); }
    else if (c==='B'){ R(x,y,T,T,COL.brick); R(x,y+7,T,1,COL.mortar); R(x,y+15,T,1,COL.mortar); R(x+7,y,1,7,COL.mortar); R(x+3,y+8,1,7,COL.mortar); R(x+12,y+8,1,7,COL.mortar); R(x,y,T,1,'#57524f'); }
    else if (c==='?' || c==='M'){ R(x,y,T,T,COL.q); R(x,y+T-2,T,2,COL.qDark); R(x+T-2,y,2,T,COL.qDark); R(x+1,y+1,2,2,'#ff8fb0');
      const k = (Math.floor(S.tick/12)%4===0)?'#ffd6e2':COL.white; R(x+5,y+3,6,2,k); R(x+9,y+5,2,3,k); R(x+7,y+7,3,2,k); R(x+7,y+9,2,2,k); R(x+7,y+12,2,2,k); }
    else if (c==='U'){ R(x,y,T,T,COL.used); R(x,y+T-2,T,2,'#6d686a'); R(x+2,y+2,2,2,'#a9a4a6'); R(x+12,y+2,2,2,'#a9a4a6'); R(x+2,y+12,2,2,'#a9a4a6'); R(x+12,y+12,2,2,'#a9a4a6'); }
    else if (c==='S'){ R(x,y,T,T,COL.stair); R(x,y,T,2,'#746d77'); R(x,y,2,T,'#746d77'); R(x+T-2,y,2,T,'#3f3a41'); R(x,y+T-2,T,2,'#3f3a41'); }
    else if (c==='p' || c==='P' || c==='q' || c==='Q'){
      // a database cylinder, drawn as two tiles side by side
      const left = (c==='p'||c==='P'), top=(c==='p'||c==='q');
      R(x,y,T,T,COL.db); R(left?x:x+T-3,y,3,T,left?COL.dbLight:COL.dbDark);
      if (top){ ctx.fillStyle=COL.dbLight; ctx.beginPath(); ctx.ellipse(left?x+T:x, y+3, T, 4, 0, left?Math.PI/2:-Math.PI/2, left?Math.PI*1.5:Math.PI/2, false); ctx.fill(); R(x,y+6,T,2,COL.dbDark); }
      else if (ty%2===0) R(x,y+8,T,2,COL.dbDark);
    }
  }
  function drawLevel(){
    const t0 = Math.floor(S.camX/T), t1 = Math.min(W-1, t0 + Math.ceil(VW/T)+1);
    for (let ty=0; ty<ROWS; ty++) for (let tx=t0; tx<=t1; tx++){ const c=map[ty][tx]; if (c!==' ') drawTile(c, tx*T - S.camX, ty*T, tx, ty); }
    // the COMMIT flag
    const fx = flagX*T - S.camX + 7;
    R(fx, 3*T, 2, 8*T, '#7d7779'); ctx.fillStyle=COL.pink; ctx.beginPath(); ctx.arc(fx+1, 3*T-2, 3, 0, Math.PI*2); ctx.fill();
    const fy = 3*T + 4 + S.flagY;
    R(fx-34, fy, 34, 14, COL.pink); ctx.fillStyle=COL.white; ctx.font='bold 7px monospace'; ctx.textAlign='center'; ctx.fillText('COMMIT', fx-17, fy+10);
    // Sparta HQ
    const hx = hqX*T - S.camX;
    R(hx, 6*T, 6*T, 6*T, COL.ink); R(hx, 6*T, 6*T, 4, COL.pink);
    for (let i=0;i<5;i++) for (let j=0;j<3;j++) R(hx+8+i*17, 6*T+12+j*18, 10, 10, (i+j)%2?'#4d494a':'#f7cad7');
    R(hx+2*T+4, 10*T, 3*T-8, 2*T, '#1b1919'); R(hx+2*T, 4*T+8, 2*T, 2*T-8, COL.pink);
    ctx.fillStyle=COL.white; ctx.font='bold 9px sans-serif'; ctx.fillText('SPARTA', hx+3*T, 5*T+6); ctx.font='bold 7px sans-serif'; ctx.fillText('HQ', hx+3*T, 5*T+15);
    // floating keyword tokens
    S.tokens.forEach(tk=>{ if (tk.got) return; const x=tk.x-S.camX, y=tk.y+Math.sin((S.tick+tk.x)/14)*2;
      R(x+2,y,6,10,COL.pink); R(x,y+2,10,6,COL.pink); R(x+3,y+2,4,6,'#ff8fb0'); });
  }
  function drawPlayer(){
    const p=S.player; if (p.inv>0 && Math.floor(p.inv/4)%2) return;
    const x=Math.round(p.x - S.camX), y=Math.round(p.y), f=p.face, big=p.big;
    const legPhase = p.onGround && Math.abs(p.vx)>0.2 ? Math.floor(p.anim)%2 : 0;
    const bodyH = big ? 13 : 6, headY = y, bodyY = y+8, legY = bodyY+bodyH;
    // helmet with crest
    R(x+1, headY, 10, 7, '#9a9295'); R(x+1, headY, 10, 2, '#b8b1b4');
    R(f>0?x+3:x-1, headY-3, 10, 3, COL.pink); R(f>0?x+1:x+7, headY-5, 4, 3, COL.pink);
    R(f>0?x+6:x+2, headY+3, 4, 3, COL.skin); R(f>0?x+8:x+3, headY+3, 1, 1, COL.ink);
    // body: charcoal tunic with a pink sash
    R(x+1, bodyY-1, 10, bodyH+1, COL.ink); R(x+1, bodyY+1, 10, 2, COL.pink);
    if (big){ R(x+3, bodyY+5, 6, 1, '#4d494a'); R(f>0?x+10:x-2, bodyY+2, 3, 8, '#b8b1b4'); }   // a shield when holding the key
    // legs
    R(x+2, legY, 3, 2+(legPhase?0:1), COL.ink); R(x+7, legY, 3, 2+(legPhase?1:0), COL.ink);
    R(x+1+(legPhase?1:0), y+p.h-1, 4, 1, '#1b1919'); R(x+7-(legPhase?1:0), y+p.h-1, 4, 1, '#1b1919');
  }
  function drawEnemies(){
    S.enemies.forEach(e=>{
      if (!e.active || (!e.alive && e.squash===0)) return;
      const x=Math.round(e.x-S.camX), y=Math.round(e.y);
      if (!e.alive && e.squash>0){ R(x,y+8,14,4,COL.bugDark); return; }
      const flip = !e.alive;  // knocked over
      const yy = flip ? y+2 : y, step = Math.floor(S.tick/10)%2;
      R(x+1,yy+3,12,7,COL.bug); R(x+3,yy+1,8,3,COL.bug); R(x+6,yy+3,1,7,COL.bugDark);
      R(x+3,yy+4,2,2,COL.white); R(x+9,yy+4,2,2,COL.white); R(x+3,yy+5,1,1,COL.ink); R(x+9,yy+5,1,1,COL.ink);
      R(x+2,yy+1,1,2,COL.ink); R(x+11,yy+1,1,2,COL.ink);   // antennae
      R(x+1+(step?1:0),yy+10,2,2,COL.ink); R(x+6,yy+10,2,2,COL.ink); R(x+11-(step?1:0),yy+10,2,2,COL.ink);
    });
  }
  function drawItems(){
    S.items.forEach(it=>{ if (it.got) return; const x=Math.round(it.x-S.camX), y=Math.round(it.y);
      ctx.strokeStyle=COL.keyDark; ctx.lineWidth=2; ctx.fillStyle=COL.key; ctx.beginPath(); ctx.arc(x+4,y+6,3.5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      R(x+7,y+5,6,2,COL.key); R(x+10,y+7,2,3,COL.key); R(x+12,y+7,1,2,COL.key); });
    S.debris.forEach(d=>R(d.x-S.camX, d.y, 4, 4, COL.brick));
  }
  function drawHud(){
    ctx.textAlign='left'; ctx.font='bold 9px monospace';
    R(0,0,VW,15,'rgba(45,42,43,0.88)');
    ctx.fillStyle=COL.white;
    ctx.fillText(`SCORE ${String(S.score).padStart(6,'0')}`, 6, 11);
    ctx.fillStyle='#ff8fb0'; ctx.fillText(`KEYWORDS ${S.collected.length}`, 112, 11);
    ctx.fillStyle=COL.white; ctx.fillText(`LIVES ${'♥'.repeat(Math.max(0,S.lives))}`, 210, 11);
    ctx.textAlign='right'; ctx.fillText(`TIME ${Math.max(0,S.time)}`, VW-6, 11);
    S.popups.forEach(q=>{ ctx.textAlign='center'; ctx.font='bold 8px monospace'; ctx.fillStyle=q.color; ctx.fillText(q.text, q.x-S.camX, q.y); });
  }
  function overlay(title, lines, foot){
    R(0,0,VW,VH,'rgba(45,42,43,0.78)');
    ctx.textAlign='center'; ctx.fillStyle=COL.white; ctx.font='bold 18px sans-serif'; ctx.fillText(title, VW/2, 62);
    ctx.font='10px sans-serif'; lines.forEach((l,i)=>{ ctx.fillStyle = i===0 ? '#ffb3c8' : COL.white; ctx.fillText(l, VW/2, 86+i*15); });
    if (foot){ ctx.font='bold 11px sans-serif'; ctx.fillStyle = Math.floor(S.tick/30)%2 ? '#ffb3c8' : COL.white; ctx.fillText(foot, VW/2, 186); }
  }
  function draw(){
    drawBackground(); drawLevel(); drawItems(); drawEnemies(); drawPlayer(); drawHud();
    const touch = matchMedia('(pointer: coarse)').matches;
    if (S.paused) overlay('PAUSED', ['You left the game, so it waited for you.'], touch?'Tap JUMP to carry on':'Press Space to carry on');
    else if (S.phase==='title') overlay('SPARTAN SQL RUN', ['Reach the COMMIT flag at Sparta HQ','Hit ? blocks for SQL keywords. Stomp on the bugs.','Find the 🔑 Primary Key to grow, survive a hit and break bricks.', touch?'Use the buttons below to move and jump.':'Arrow keys or A / D to move, Space or W to jump.'], touch?'Tap JUMP to start':'Press Space to start');
    else if (S.phase==='over') overlay('ROLLBACK!', ['Game over', `Score ${S.score}  ·  Keywords ${S.collected.length}`], touch?'Tap JUMP to play again':'Press Space to play again');
    else if (S.phase==='win' && S.winDone){
      const uniq=[...new Set(S.collected)];
      overlay('TRANSACTION COMMITTED!', [`Score ${S.score}`, `Keywords collected: ${S.collected.length}`, uniq.slice(0,8).join('  ·  '), uniq.slice(8,16).join('  ·  ')], touch?'Tap JUMP to play again':'Press Space to play again');
    }
  }

  /* ---------- Loop and controls ---------- */
  function frame(ts){
    raf = requestAnimationFrame(frame);
    if (!last) last=ts; acc += Math.min(100, ts-last); last=ts;
    while (acc >= 1000/60){ step(); acc -= 1000/60; }
    draw();
  }
  function step(){
    if (S.paused){ S.tick++; if (jumpBuf>0 || (keys.jump && !jumpWasDown)){ S.paused=false; jumpBuf=0; } jumpWasDown = keys.jump; return; }
    if (S.phase==='title' || S.phase==='over' || (S.phase==='win' && S.winDone)){
      S.tick++;
      const pressed = (keys.jump && !jumpWasDown) || jumpBuf>0; jumpWasDown = keys.jump; jumpBuf=0;
      if (pressed){ const fresh = S.phase!=='title'; if (fresh) S = freshState(); S.phase='play'; spawnLevelThings(); jumpBuf=0; }
      return;
    }
    update();
  }
  const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', Space:'jump', ArrowUp:'jump', KeyW:'jump', KeyZ:'jump' };
  function onKey(e){
    if (!running) return;
    const k = KEYMAP[e.code]; if (!k) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    e.preventDefault(); keys[k] = e.type==='keydown'; if (k==='jump' && e.type==='keydown' && !e.repeat) jumpBuf = 6;
  }
  function bindTouch(btn, k){
    const on = e=>{ e.preventDefault(); keys[k]=true; if (k==='jump') jumpBuf = 6; btn.classList.add('down'); try{ btn.setPointerCapture(e.pointerId); }catch(_){} };
    const off = e=>{ e.preventDefault(); keys[k]=false; btn.classList.remove('down'); };
    btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
    btn.addEventListener('contextmenu', e=>e.preventDefault());
  }
  let bound=false;
  function start(){
    cv = document.getElementById('gameCanvas'); ctx = cv.getContext('2d'); wrap = document.getElementById('gameWrap');
    cv.width = VW; cv.height = VH; ctx.imageSmoothingEnabled = false;
    if (!bound){
      bound = true;
      addEventListener('keydown', onKey); addEventListener('keyup', onKey);
      bindTouch(document.getElementById('gLeft'),'left'); bindTouch(document.getElementById('gRight'),'right'); bindTouch(document.getElementById('gJump'),'jump');
      cv.addEventListener('pointerdown', ()=>{ if (S.phase!=='play' && S.phase!=='dead') jumpBuf = 6; });
      document.addEventListener('visibilitychange', ()=>{ if (document.hidden) Object.keys(keys).forEach(k=>keys[k]=false); });
    }
    if (!S){ S = freshState(); spawnLevelThings(); }
    running = true; last = 0; acc = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function stop(){ if (S && S.phase==='play') S.paused = true; running = false; cancelAnimationFrame(raf); Object.keys(keys).forEach(k=>keys[k]=false); }
  // For tests: a peek at the state
  // For tests: move the player close to a given tile column
  const warp = tx => { if (S && S.player){ S.player.x = tx*T; S.player.y = 1*T; S.player.vy = 0; S.camX = Math.max(0, tx*T - VW*0.4); } };
  return { start, stop, warp, state: () => S && ({ phase:S.phase, score:S.score, lives:S.lives, keywords:S.collected.length, x:S.player?Math.round(S.player.x):0, big:S.player?S.player.big:false }) };
})();
window.GAME_STATE = () => GAME.state();   // read-only peek, for tests
window.GAME_WARP = tx => GAME.warp(tx);   // tests only: jump ahead in the level
