'use strict';
// ================== 进化：数学试炼 + 华丽变身动画 ==================
function evoCandidates() { return G.party.filter(m => m.evoReady && SPECIES[m.sp].evoTo); }
function offerEvolution(m, after) {
  const to = SPECIES[SPECIES[m.sp].evoTo];
  openChoice(nameOf(m) + '浑身散发着光芒，想要进化成' + to.n + '！\n要挑战进化试炼吗？（3 题答对 2 题）', ['挑战进化试炼', '以后再说'], i => {
    if (i === 0) startEvoTrial(m, after); else { toast('可以随时在「队伍」菜单中选择「进化试炼」'); if (after) after(); }
  });
}
function startEvoTrial(m, after) {
  const R = curRegion();
  startQuiz({ source: 'evo', count: 3, need: 2, title: '进化试炼 · ' + nameOf(m), sub: nameOf(m) + '想要突破极限！用你的数学力量帮助它——3 道题里答对 2 道，就能完成进化！', theme: R.theme }, res => {
    if (res.pass) startEvoCutscene(m, after);
    else { say(['进化试炼失败了……' + nameOf(m) + '的光芒渐渐暗了下去。', '不要灰心！随时可以在「队伍」菜单里再次挑战进化试炼。'], after); }
  });
}
const EVO_DUR = 9.4;
function startEvoCutscene(m, after) {
  const from = m.sp, to = SPECIES[m.sp].evoTo;
  G.evo = { m, from, to, t: 0, after, swapped: false, done: false, parts: [], sfx: {}, old0: stats(m) };
  G.prevScene = G.scene; G.scene = 'evolve'; G.held = [];
  AudioSys.play('evolve');
}
function evolveSwap(E) {
  if (E.swapped || E.m.sp !== E.from) return;
  const m = E.m, old = E.old0, ratio = m.hp / Math.max(1, old.hp);
  m.sp = E.to; m.evoReady = false;
  const nw = stats(m); m.hp = Math.max(1, Math.round(nw.hp * ratio)); m.dhp = m.hp;
  E.old = old; E.nw = nw; E.learned = [];
  SPECIES[m.sp].learn.filter(e => e[0] <= m.lvl).forEach(e => { if (!m.moves.some(x => x.id === e[1])) { const L = learnMove(m, e[1], true); E.learned.push(e[1]); } });
  G.flags.dex = G.flags.dex || {}; G.flags.dex[m.sp] = 1;
  // 进化后如果已经满足下一次进化的等级，也会进入准备状态
  const sp = SPECIES[m.sp]; if (sp.evoTo && m.lvl >= sp.evoLvl) m.evoReady = true;
}
function updateEvo(dt) {
  const E = G.evo; if (!E) return;
  const t0 = E.t; E.t += dt; const t = E.t;
  const once = (k, at, f) => { if (t0 < at && t >= at) f(); };
  once('c1', 1.0, () => AudioSys.sfx('charge'));
  once('c2', 3.2, () => AudioSys.sfx('charge'));
  once('c3', 5.0, () => AudioSys.sfx('charge'));
  once('b', 6.0, () => AudioSys.sfx('burst'));
  if (t >= 6.25 && !E.swapped) { evolveSwap(E); E.swapped = true; }
  once('e', 6.7, () => AudioSys.sfx('evolve'));
  // 汇聚粒子
  if (t > 1 && t < 6) for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, r = 700 + Math.random() * 300; E.parts.push({ x: 800 + Math.cos(a) * r, y: 470 + Math.sin(a) * r * 0.7, tx: 800, ty: 470, life: 0, max: 0.9 + Math.random() * 0.4, c: Math.random() < 0.5 ? '#fff3a0' : '#9ff6ff', k: 0 }); }
  if (t0 < 6.05 && t >= 6.05) for (let i = 0; i < 160; i++) { const a = Math.random() * 6.28, v = 300 + Math.random() * 1100; E.parts.push({ x: 800, y: 470, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1 + Math.random() * 1.2, c: ['#ffffff', '#ffe58a', '#9ff6ff', '#ffb0e8'][i % 4], k: 1 }); }
  if (t > 6.5 && Math.random() < 0.5) E.parts.push({ x: 800 + rnd(-300, 300), y: 470 + rnd(-260, 200), vx: 0, vy: -40, life: 0, max: 1.2, c: '#fff6c0', k: 2 });
  E.parts.forEach(p => { p.life += dt; if (p.k === 0) { const k = p.life / p.max; p.cx = p.x + (p.tx - p.x) * easeInOut(k); p.cy = p.y + (p.ty - p.y) * easeInOut(k); } else { p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.vx) { p.vx *= 0.96; p.vy *= 0.96; } p.cx = p.x; p.cy = p.y; } });
  E.parts = E.parts.filter(p => p.life < p.max);
}
function evoInput(k) {
  const E = G.evo; if (!E || E.t < EVO_DUR) return;
  if (k !== 'ok' && k !== 'cancel') return;
  const m = E.m, lines = [];
  lines.push('恭喜！' + SPECIES[E.from].n + '进化成了' + SPECIES[E.to].n + '！');
  E.learned.forEach(id => lines.push(SPECIES[E.to].n + '领悟了' + (MOVES[id].fx.sig ? '进化招牌技「' + MOVES[id].n + '」' : '「' + MOVES[id].n + '」') + '！'));
  if (SPECIES[E.to].evoTo) lines.push('（' + SPECIES[E.to].n + '在 Lv.' + SPECIES[E.to].evoLvl + ' 时还能再次进化！）');
  else lines.push('这是' + SPECIES[E.to].n + '的最终形态！');
  G.evo = null; G.scene = 'world'; AudioSys.play(worldSong());
  addStars(5); lines.push('进化奖励：★5');
  say(lines, E.after);
}
function drawEvolve() {
  const E = G.evo; if (!E) return;
  const t = E.t;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05071a'; ctx.fillRect(0, 0, CW, CH);
  beginUI();
  const dark = clamp(t / 1.0, 0, 1);
  // 背景：旋转光芒 + 魔法阵
  const bg = ctx.createRadialGradient(800, 470, 50, 800, 470, 1100);
  const tc = TYPES[SPECIES[E.swapped ? E.to : E.from].t].c;
  bg.addColorStop(0, hexA(tc, 0.5 * dark)); bg.addColorStop(0.5, 'rgba(30,20,80,' + 0.8 * dark + ')'); bg.addColorStop(1, 'rgba(4,6,20,1)');
  ctx.fillStyle = bg; ctx.fillRect(-500, -300, 2600, 1500);
  ctx.save(); ctx.translate(800, 470); ctx.globalCompositeOperation = 'lighter';
  const rays = 18, spin = t * 0.3 + (t > 6 ? (t - 6) * 0.6 : 0);
  for (let i = 0; i < rays; i++) { const a = spin + i / rays * 6.28; ctx.fillStyle = 'rgba(255,240,200,' + (0.05 + 0.05 * Math.sin(t * 3 + i)) * dark + ')'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, a, a + 0.12); ctx.closePath(); ctx.fill(); }
  // 地面魔法阵（数学符号）
  ctx.save(); ctx.translate(0, 230); ctx.scale(1, 0.32);
  const ma = clamp((t - 0.6) / 0.8, 0, 1);
  ctx.strokeStyle = hexA('#9ff6ff', 0.8 * ma); ctx.lineWidth = 6;
  [380, 330, 220].forEach((r, i) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke(); });
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 330, Math.sin(a) * 330); ctx.lineTo(Math.cos(a + 2.094) * 330, Math.sin(a + 2.094) * 330); ctx.stroke(); }
  ['+', '−', '×', '÷', '=', '%', '√', 'π'].forEach((s, i) => { const a = i / 8 * 6.28; ctx.save(); ctx.translate(Math.cos(a) * 355, Math.sin(a) * 355); ctx.scale(1, 3); text(s, 0, 0, 34, hexA('#ffe58a', ma), 'center', '900'); ctx.restore(); });
  ctx.restore();
  // 能量环
  if (t > 1.2 && t < 6.2) for (let i = 0; i < 4; i++) { const ph = ((t * 0.9 + i / 4) % 1); const r = 520 * (1 - ph); ctx.strokeStyle = hexA(i % 2 ? '#9ff6ff' : '#ffe58a', ph * 0.8); ctx.lineWidth = 10 * ph; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.9, 0, 0, 6.28); ctx.stroke(); }
  ctx.restore();
  // 环绕的 + − × ÷ 符号
  if (t > 2.2 && t < 6.3) {
    const k = clamp((t - 2.2) / 0.6, 0, 1), sp = 1.5 + (t - 2.2) * 1.2, rr = 360 - clamp((t - 4.5) / 1.6, 0, 1) * 300;
    ['+', '−', '×', '÷', '+', '−', '×', '÷'].forEach((s, i) => {
      const a = NOW * 0 + t * sp + i / 8 * 6.28; const x = 800 + Math.cos(a) * rr, y = 450 + Math.sin(a) * rr * 0.5 - 40;
      const front = Math.sin(a) > 0; if (!front) { ctx.globalAlpha = k * 0.5; glowOrb(x, y, 50, '#ffe58a'); text(s, x, y, 56, '#fff', 'center', '900'); ctx.globalAlpha = 1; }
      E['sym' + i] = { x, y, front, s };
    });
  }
  // 灵兽本体
  const size = 540, X = 800, Y = 740;
  const flick = t > 3 && t < 6.2 ? (Math.sin(t * (6 + (t - 3) * 9)) > 0) : false;
  const showNew = E.swapped || flick;
  const sp = showNew ? E.to : E.from;
  const sil = t > 1.3 && t < 6.6;
  const grow = t < 6 ? 1 + Math.sin(t * 7) * 0.02 * clamp(t - 1.5, 0, 3) : 1;
  const sq = t > 6.2 && t < 6.8 ? 1 + Math.sin((t - 6.2) / 0.6 * Math.PI) * 0.15 : 1;
  const floatY = t > 1.3 && t < 6.6 ? -Math.min(1, (t - 1.3) / 1) * 60 + Math.sin(t * 2) * 10 : 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(X, Y - 260 + floatY, 420 * (sil ? 1 + 0.2 * Math.sin(t * 8) : 0.6), sil ? '#ffffff' : tc); ctx.restore();
  if (!sil || t < 1.6) shadowEllipse(ctx, X, Y, 200, 40, 0.5);
  drawCreature(ctx, sp, X, Y + floatY, size * grow, { breathe: !sil, sx: 1 / sq, sy: sq, alpha: sil && t < 1.6 ? 1 : 1, flash: sil ? 1 : (t < 7.2 && t > 6.6 ? 1 - (t - 6.6) / 0.6 : 0), flashColor: sil ? (t > 3 ? 'rgba(255,250,230,1)' : 'rgba(255,255,255,' + clamp((t - 1.3) / 0.4, 0, 1) + ')') : undefined });
  // 前方的符号
  if (t > 2.2 && t < 6.3) for (let i = 0; i < 8; i++) { const s = E['sym' + i]; if (s && s.front) { glowOrb(s.x, s.y, 60, '#ffe58a'); text(s.s, s.x, s.y, 64, '#fff', 'center', '900', 'middle', true); } }
  // 粒子
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  E.parts.forEach(p => { const a = 1 - p.life / p.max; const r = p.k === 1 ? 26 * a + 6 : p.k === 2 ? 14 : 16; if (p.k === 2) { ctx.globalAlpha = Math.sin(a * Math.PI); text('✦', p.cx, p.cy, 30, p.c, 'center', '900'); ctx.globalAlpha = 1; } else ctx.drawImage(glowSprite(p.c), p.cx - r, p.cy - r, r * 2, r * 2); });
  ctx.restore();
  // 闪光
  if (t > 5.6 && t < 7.4) { const f = t < 6.05 ? (t - 5.6) / 0.45 : 1 - (t - 6.05) / 1.35; ctx.fillStyle = 'rgba(255,255,255,' + clamp(f, 0, 1) + ')'; ctx.fillRect(-500, -300, 2600, 1500); }
  // 文字
  if (t < 6) { const a = clamp(t / 0.6, 0, 1) * (t > 5.4 ? 1 - (t - 5.4) / 0.6 : 1); ctx.globalAlpha = a; text('咦？' + SPECIES[E.from].n + '的样子……', 800, 110, 54, '#fff', 'center', '900', 'middle', true); text(t > 3 ? '数学能量正在汇聚！' : '身体发出了耀眼的光芒！', 800, 180, 34, '#ffe58a', 'center', '800'); ctx.globalAlpha = 1; }
  if (t > 6.9) {
    const k = easeBack(clamp((t - 6.9) / 0.6, 0, 1));
    ctx.save(); ctx.translate(800, 130); ctx.scale(k, k);
    const g = ctx.createLinearGradient(-520, 0, 520, 0); g.addColorStop(0, hexA(tc, 0)); g.addColorStop(0.2, hexA(tc, 0.85)); g.addColorStop(0.8, hexA(tc, 0.85)); g.addColorStop(1, hexA(tc, 0));
    ctx.fillStyle = g; ctx.fillRect(-620, -70, 1240, 140);
    text('进化成功！', 0, -26, 40, '#fff8d0', 'center', '900', 'middle', true);
    text(SPECIES[E.to].n, 0, 34, 68, '#ffffff', 'center', '900', 'middle', true);
    ctx.restore();
    if (E.nw && t > 7.5) {
      const a = clamp((t - 7.5) / 0.5, 0, 1); ctx.globalAlpha = a;
      glass(1150, 300, 380, 300, 26, true, tc);
      text('Lv.' + E.m.lvl + '　' + TYPES[SPECIES[E.to].t].n + '属性', 1176, 340, 26, '#fff', 'left', '800');
      [['体力', 'hp'], ['攻击', 'atk'], ['防御', 'def'], ['速度', 'spd']].forEach(([n, key], i) => { const y = 390 + i * 44; text(n, 1176, y, 28, '#dfe8ff', 'left', '700'); text(String(E.nw[key]), 1400, y, 30, '#fff', 'right', '900'); text('+' + (E.nw[key] - E.old[key]), 1505, y, 28, '#7dfc9e', 'right', '900'); });
      if (E.learned.length) { glass(70, 300, 420, 150, 26, true, '#ffcf5a'); text('领悟新招式', 96, 340, 26, '#ffcf5a', 'left', '900'); E.learned.slice(0, 2).forEach((id, i) => text((MOVES[id].fx.sig ? '★ ' : '') + MOVES[id].n, 96, 384 + i * 40, 30, '#fff', 'left', '800')); }
      ctx.globalAlpha = 1;
    }
    if (t > EVO_DUR) text('按 Z / 回车 继续', 800, 860 + Math.sin(NOW * 4) * 4, 30, '#7ff0e2', 'center', '800');
  }
}
