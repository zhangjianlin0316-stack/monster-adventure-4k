'use strict';
// ================== 战斗更生动：灵兽说话（语音 + 气泡）、招牌动作、闪避 / 挑衅 / 受击姿态 ==================
const PT_STYLE = {
  ember: ['#ffb347', PK.ember], flame: ['#ff6a2a', PK.ember], bubble: ['#9fe3ff', PK.bubble], crystal: ['#bff4ff', PK.shard], leaf: ['#8fe36b', PK.leaf], sakura: ['#ffb6d0', PK.petal],
  spark: ['#ffe95a', PK.spark], bolt: ['#fff27a', PK.spark], heart: ['#ff8fb8', PK.star], feather: ['#ffffff', PK.petal], moon: ['#e8e4ff', PK.star], rainbow: ['#ff9be0', PK.star],
  star: ['#fff6a0', PK.star], spore: ['#d9ffa8', PK.glow], snow: ['#e8fbff', PK.snow], pebble: ['#c9a27a', PK.rock], firefly: ['#f6ff8a', PK.glow], wave: ['#7fd8ff', PK.drop],
  aurora: ['#9affd8', PK.glow], rune: ['#c79bff', PK.sym], ink: ['#2a2f45', PK.smoke], cloud: ['#ffffff', PK.smoke], gold: ['#ffd84a', PK.star],
};
// 某一方说话：语音 + 字幕气泡
function monTalk(side, kind, opts) {
  const B = G.battle; if (!B) return; opts = opts || {};
  const m = side === 'p' ? active() : B.enemy; if (!m) return;
  const now = B.t; B.lastTalk = B.lastTalk || { p: -9, e: -9, any: -9 };
  if (!opts.force && (now - B.lastTalk.any < 1.4)) return;
  if (!opts.force && opts.chance !== undefined && Math.random() > opts.chance) return;
  const text = Voice.mon(m.sp, kind); if (!text) return;
  B.lastTalk[side] = B.lastTalk.any = now;
  B.bubbles = (B.bubbles || []).filter(b => b.side !== side);
  B.bubbles.push({ side, text, t: 0, dur: Math.max(1.8, text.length * 0.2 + 1), kind });
}
function updateBubbles(B, dt) { if (!B.bubbles) return; for (const b of B.bubbles) b.t += dt; B.bubbles = B.bubbles.filter(b => b.t < b.dur); }
// 世界空间里记下气泡锚点（灵兽头顶），UI 层再画，避免被血条面板挡住
function drawBubbles(B, P) {
  const T = ctx.getTransform(); B._anchor = {
    e: T.transformPoint(new DOMPoint(P.EX, P.EY - 400)), p: T.transformPoint(new DOMPoint(P.PX + 120, P.PY - 520)) };
}
function drawBubblesUI(B) {
  if (!B.bubbles || !B._anchor) return; const A = B.anim; if (A && A.kind === 'move' && A.cut > 0 && A.t <= A.cut) return; const inv = ctx.getTransform().inverse();
  for (const b of B.bubbles) {
    const isE = b.side === 'e'; if (isE && !B.showE) continue; if (!isE && !B.showP) continue;
    const a = Math.min(1, b.t * 6, (b.dur - b.t) * 4), pop = easeBack(clamp(b.t * 5, 0, 1));
    ctx.font = '900 30px ' + FONT; const w = Math.min(600, ctx.measureText(b.text).width + 56), h = 66;
    const q = inv.transformPoint(B._anchor[b.side]);
    // 敌方气泡放在敌人左侧、星星面板下方；我方气泡放在敌方面板下方
    let x = isE ? q.x - 40 : q.x + w / 2 - 40, y = isE ? Math.max(210, q.y) : Math.max(260, q.y);
    if (isE) x = clamp(x, 820 + w / 2, 1580 - w / 2); else x = clamp(x, w / 2 + 20, 780 - w / 2);
    const big = b.kind === 'ult' || b.kind === 'win' || b.kind === 'sum';
    const col = big ? '#ffcf5a' : b.kind === 'hit' || b.kind === 'low' || b.kind === 'ko' ? '#ff8a8a' : '#8fd8ff';
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(pop, pop);
    const tx = isE ? w / 2 - 50 : -w / 2 + 50; // 尾巴指向灵兽
    rrect(-w / 2, -h / 2, w, h, 33, 'rgba(255,253,245,0.97)', col, 5);
    ctx.fillStyle = 'rgba(255,253,245,0.97)'; ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(tx - 18, h / 2 - 3); ctx.lineTo(tx + (isE ? 34 : -34), h / 2 + 30); ctx.lineTo(tx + 18, h / 2 - 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - 18, h / 2 + 1); ctx.lineTo(tx + (isE ? 34 : -34), h / 2 + 30); ctx.lineTo(tx + 18, h / 2 + 1); ctx.stroke();
    text(b.text, 0, 1, 30, '#24304f', 'center', '900');
    if (Voice.curTag === 'mon' && b.t < 3) for (let i = 0; i < 3; i++) { const hh = 6 + Math.abs(Math.sin(NOW * 10 + i)) * 12; rrect(w / 2 - 44 + i * 11, -h / 2 - 16 - hh / 2, 7, hh, 3, col); }
    ctx.restore();
  }
}
// 招牌动作 / 闪避 / 挑衅 等姿态
function lifePose(A, o, at, dirx, B, P) {
  const side = A.side, m = side === 'p' ? active() : B.enemy; if (!m) return;
  const X = side === 'p' ? P.PX : P.EX, Y = side === 'p' ? P.PY : P.EY, size = side === 'p' ? 500 : 380;
  const sn = Math.sin, PI = Math.PI, bell = sn(at * PI);
  if (A.kind === 'dodge') { // 侧闪：残影 + 后跳
    const k = at < 0.35 ? easeOut(at / 0.35) : 1 - easeInOut((at - 0.35) / 0.65);
    o.x = -dirx * 160 * k; o.y = -60 * sn(Math.min(1, at / 0.35) * PI); o.alpha = 0.55 + 0.45 * (1 - k * 0.6); o.rot = -dirx * 0.15 * k; o.blink = k; return;
  }
  if (A.kind === 'taunt') { o.x = sn(at * PI * 6) * 18; o.y = -Math.abs(sn(at * PI * 4)) * 40; o.rot = sn(at * PI * 4) * 0.12; return; }
  if (A.kind === 'dance') { o.x = sn(at * PI * 4) * 60; o.y = -Math.abs(sn(at * PI * 8)) * 70; o.rot = sn(at * PI * 4) * 0.25; o.sx = 1 + 0.08 * sn(at * PI * 8); if (Math.random() < 0.3) pSpawn({ x: X + o.x + rnd(-120, 120), y: Y - rnd(100, size), vx: rnd(-60, 60), vy: -rnd(80, 200), ay: 0, life: 0.9, s: 34, s1: 10, c: ['#ff8fb8', '#ffe95a', '#8fd8ff'][rint(0, 2)], k: PK.note, front: true }); return; }
  if (A.kind === 'cheer') { o.y = -Math.abs(sn(at * PI * 6)) * 50; o.sx = 1 + 0.06 * sn(at * PI * 12); return; }
  // 招牌动作
  const act = MON_ACT[m.sp] || { kind: 'hop', pt: 'star' }; const k = act.kind;
  switch (k) {
    case 'wag': o.rot = sn(at * PI * 8) * 0.12 * bell; o.sx = 1 + 0.05 * sn(at * PI * 8); break;
    case 'spin': case 'twirl': o.rot = k === 'spin' ? easeInOut(at) * PI * 2 : 0; if (k === 'twirl') o.sx = Math.cos(at * PI * 4); o.y = -bell * 40; break;
    case 'fan': case 'spread': case 'crown': o.sx = o.sy = 1 + 0.14 * bell; o.glow = bell * 0.9; o.y = -bell * 30; break;
    case 'roll': o.rot = easeInOut(at) * PI * 4 * dirx; o.x = sn(at * PI) * 80 * dirx; break;
    case 'guard': case 'meditate': o.sy = 1 - 0.12 * bell; o.sx = 1 + 0.08 * bell; o.glow = bell * 0.6; break;
    case 'stomp': case 'quake': o.y = at < 0.5 ? -sn(at * 2 * PI / 2) * 90 : 0; if (at > 0.5 && !A.stomped) { A.stomped = 1; B.shake = 26; addRing(B, X, Y, 300, '#ffffff', 0.5); } if (k === 'quake' && at > 0.5) o.x = sn(at * 120) * 8; break;
    case 'hop': case 'bounce': case 'cheer': o.y = -Math.abs(sn(at * PI * 3)) * 70; o.sy = 1 + 0.08 * sn(at * PI * 6); break;
    case 'sway': case 'wave': case 'flute': o.rot = sn(at * PI * 3) * 0.14; o.x = sn(at * PI * 3) * 20; if (k === 'flute' && Math.random() < 0.3) pSpawn({ x: X + rnd(-60, 60), y: Y - size * 0.7, vx: rnd(-40, 40), vy: -150, ay: 0, life: 1, s: 30, s1: 10, c: '#bfffb0', k: PK.note, front: true }); break;
    case 'float': case 'hover': case 'swim': o.y = -bell * 60 + sn(at * PI * 4) * 10; o.x = k === 'swim' ? sn(at * PI * 2) * 60 : 0; o.glow = bell * 0.5; break;
    case 'puff': case 'flex': o.sx = o.sy = 1 + 0.16 * Math.abs(sn(at * PI * 2)); break;
    case 'roar': case 'rear': o.sx = o.sy = 1 + 0.1 * bell; o.rot = k === 'rear' ? -0.22 * bell * dirx : 0; o.x = sn(at * 90) * 6 * bell; if (at > 0.3 && !A.roared) { A.roared = 1; B.shake = 20; addRing(B, X, Y - size * 0.5, 420, TYPES[SPECIES[m.sp].t].c, 0.6); } break;
    case 'flip': case 'leap': o.y = -sn(at * PI) * (k === 'leap' ? 180 : 130); o.rot = easeInOut(at) * PI * 2 * dirx; break;
    case 'flap': case 'flutter': o.y = -bell * 70 + sn(at * PI * 10) * 8; o.sy = 1 + 0.08 * sn(at * PI * 12); break;
    case 'circle': o.x = Math.cos(at * PI * 2) * 70 - 70; o.y = sn(at * PI * 2) * 40 - bell * 30; break;
    case 'pounce': case 'slash': o.x = (at < 0.3 ? -at / 0.3 * 30 : sn((at - 0.3) / 0.7 * PI) * 120) * dirx; o.sy = at < 0.3 ? 0.88 : 1; break;
    case 'clap': o.sx = 1 + 0.1 * sn(at * PI * 10); o.y = -Math.abs(sn(at * PI * 5)) * 20; break;
    case 'tilt': o.rot = 0.3 * bell * (at < 0.5 ? 1 : -1); break;
    case 'glow': o.glow = bell; o.sx = o.sy = 1 + 0.06 * bell; break;
    case 'stretch': o.sx = 1 + 0.25 * bell; o.sy = 1 - 0.18 * bell; break;
    case 'phase': o.alpha = 0.3 + 0.7 * Math.abs(Math.cos(at * PI * 4)); o.x = (Math.floor(at * 4) % 2 ? 60 : -60) * bell; break;
    case 'mask': o.flash = Math.floor(at * 10) % 2 ? 0.8 : 0; o.sx = Math.cos(at * PI * 6); break;
    case 'coil': o.rot = sn(at * PI * 2) * 0.18; o.sy = 1 + 0.1 * sn(at * PI * 4); o.y = -bell * 50; o.glow = bell * 0.5; break;
    case 'pose': o.y = -bell * 30; o.rot = 0.08 * bell; break;
    case 'dance': o.x = sn(at * PI * 4) * 50; o.y = -Math.abs(sn(at * PI * 6)) * 50; o.rot = sn(at * PI * 4) * 0.2; break;
    case 'poof': o.scale = at < 0.3 ? 1 - at / 0.3 * 0.9 : 0.1 + easeBack((at - 0.3) / 0.7) * 0.9; if (!A.poofed && at > 0.28) { A.poofed = 1; burst(X, Y - size * 0.4, 30, { c: ['#ffffff', '#d9ffd0'], k: 'smoke', g: -40, s0: 40, s1: 90, front: true }); } break;
    case 'buzz': o.x = sn(at * 140) * 10; o.y = -bell * 40; break;
    default: o.y = -bell * 50;
  }
  const ps = PT_STYLE[act.pt] || PT_STYLE.star;
  if (Math.random() < 0.55) pSpawn({ x: X + o.x + rnd(-size * 0.4, size * 0.4), y: Y + o.y - rnd(0, size * 0.85), vx: rnd(-90, 90), vy: -rnd(60, 220), ay: act.pt === 'snow' || act.pt === 'sakura' || act.pt === 'leaf' || act.pt === 'feather' ? 80 : -30, drag: 1, life: rnd(0.6, 1.1), s: rnd(18, 36), s1: 4, c: ps[0], k: ps[1], front: true });
}
// 待机小动作：每隔几秒随机做一下自己的招牌动作缩略版
function lifeIdle(B, side, o, dt) {
  B.idle = B.idle || { p: { t: 0, next: 5 + Math.random() * 4 }, e: { t: 0, next: 3 + Math.random() * 4 } };
  const I = B.idle[side]; I.t += dt;
  if (I.t > I.next) { I.play = (I.play || 0) + dt; const u = I.play / 0.9; if (u >= 1) { I.t = 0; I.play = 0; I.next = 6 + Math.random() * 6; return; }
    const m = side === 'p' ? active() : B.enemy; const k = (MON_ACT[m.sp] || {}).kind; const b = Math.sin(u * Math.PI);
    if (k === 'hop' || k === 'bounce' || k === 'cheer' || k === 'leap' || k === 'flip') o.y -= Math.abs(Math.sin(u * Math.PI * 2)) * 26;
    else if (k === 'spin' || k === 'roll' || k === 'twirl') o.rot += Math.sin(u * Math.PI * 2) * 0.12;
    else if (k === 'roar' || k === 'rear' || k === 'flex' || k === 'puff') { o.sx *= 1 + 0.06 * b; o.sy *= 1 + 0.06 * b; }
    else if (k === 'float' || k === 'hover' || k === 'swim' || k === 'flap' || k === 'flutter') o.y -= b * 24;
    else o.rot += Math.sin(u * Math.PI * 3) * 0.06;
  }
}
// 出场：台词 + 招牌动作（插入战斗队列）
function introSteps(side) { return [fn(() => monTalk(side, 'sum', { force: true })), { type: 'anim', kind: 'sig', side, mtype: 'normal', dur: 1.25 }, fn(() => showActName(side))]; }
function showActName(side) { const B = G.battle; const m = side === 'p' ? active() : B.enemy; const a = MON_ACT[m.sp]; if (a) { B.actName = { side, text: '招牌动作 · ' + a.name, t: 0 }; } }
function drawActName(B) {
  const n = B.actName; if (!n) return; const A0 = B.anim; if (A0 && A0.kind === 'move' && A0.cut > 0 && A0.t <= A0.cut) { B.actName = null; return; } n.t += LAST_DT; if (n.t > 2.2) { B.actName = null; return; }
  const a = Math.min(1, n.t * 5, (2.2 - n.t) * 3); const x = n.side === 'p' ? 330 : 1100, y = n.side === 'p' ? 470 : 290;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x + (1 - easeOut(clamp(n.t * 4, 0, 1))) * (n.side === 'p' ? -80 : 80), y);
  const g = ctx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, 'rgba(20,12,40,0)'); g.addColorStop(0.2, 'rgba(20,12,40,0.85)'); g.addColorStop(0.8, 'rgba(20,12,40,0.85)'); g.addColorStop(1, 'rgba(20,12,40,0)');
  ctx.fillStyle = g; ctx.fillRect(-230, -26, 460, 52); text(n.text, 0, 1, 28, '#ffe08a', 'center', '900'); ctx.restore();
}
// 奥义台词字幕（过场时在底部显示）
function drawUltLine(B, cinematic) {
  if (!cinematic || !B.bubbles) return; const b = B.bubbles.find(x => x.kind === 'ult'); if (!b) return;
  const a = Math.min(1, b.t * 4);
  ctx.save(); ctx.globalAlpha = a; const g = ctx.createLinearGradient(300, 0, 1300, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, 'rgba(0,0,0,0.7)'); g.addColorStop(0.8, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(300, 812, 1000, 64); text('「' + b.text + '」', 800, 845, 38, '#fff3c0', 'center', '900', 'middle', true); ctx.restore();
}
// 战斗外：选中 / 图鉴 / 抽卡时的台词气泡（UI 空间）
function monSay(sp, kind, x, y) { const t = Voice.mon(sp, kind); if (t) G.say = { sp, text: t, t: 0, x: x || 800, y: y || 170, kind }; return t; }
let _selT = 0;
function monSelect(sp, x, y) { const now = performance.now(); if (now - _selT < 350) return; _selT = now; monSay(sp, 'sel', x, y); }
function drawSay() {
  const S = G.say; if (!S) return; S.t += LAST_DT; const dur = Math.max(2.2, S.text.length * 0.2 + 1.2); if (S.t > dur) { G.say = null; return; }
  beginUI(); const a = Math.min(1, S.t * 6, (dur - S.t) * 4), pop = easeBack(clamp(S.t * 5, 0, 1));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(S.x, S.y); ctx.scale(pop, pop);
  ctx.font = '900 32px ' + FONT; const w = Math.min(900, ctx.measureText(S.text).width + 120);
  rrect(-w / 2, -38, w, 76, 38, 'rgba(255,253,245,0.97)', '#ffcf5a', 5);
  text('🗨', -w / 2 + 40, 1, 30, '#ffb84a', 'center', '900'); text(S.text, 20, 1, 32, '#24304f', 'center', '900');
  ctx.restore();
}
