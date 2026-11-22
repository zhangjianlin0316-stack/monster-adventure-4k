'use strict';
// ================== 大地图生机：风、跟随灵兽、NPC 待机、脚步特效、小动物、水面/瀑布、云影、光束、昼夜 ==================
// ---- 风场：基础微风 + 一阵阵扫过地图的阵风（草、树、花一起摆）----
function windAt(x, y) { const g = Math.max(0, Math.sin(x * 0.22 + y * 0.09 - NOW * 1.25)); return { base: Math.sin(NOW * 1.1 + x * 0.5 + y * 0.3), gust: g * g * g }; }
// ---- 昼夜：8 分钟一轮（白天 → 黄昏 → 夜晚 → 黎明）；在菜单「声音与语音」可固定为白天 ----
const DAY_LEN = 480;
function dayPhase() { if (ALIVE.forcePhase !== undefined) return ALIVE.forcePhase; if (ALIVE.day === 'day') return 0.25; return ((G.flags && G.flags.clock0 ? 0 : 0) + NOW / DAY_LEN + 0.18) % 1; } // 0.18 起：上午开局
function nightK() { const p = dayPhase(); // 0..1 夜晚程度
  if (p < 0.55) return 0; if (p < 0.65) return (p - 0.55) / 0.1 * 0.55; if (p < 0.85) return 0.55 + 0.45 * Math.min(1, (p - 0.65) / 0.05); if (p < 0.95) return 1 - (p - 0.85) / 0.1; return 0; }
function duskK() { const p = dayPhase(); return p > 0.5 && p < 0.7 ? Math.sin((p - 0.5) / 0.2 * Math.PI) : (p > 0.86 && p < 0.98 ? 0.6 * Math.sin((p - 0.86) / 0.12 * Math.PI) : 0); }
try { ALIVE.day = localStorage.getItem('ls_daycycle') || 'cycle'; } catch (e) { ALIVE.day = 'cycle'; }
// ---- 跟随灵兽（队伍第一只跟在主角身后，走路会蹦跳）----
const FOLLOW = { x: null, y: null, fx: null, fy: null, dir: 'down', emo: null, emoT: 0, idleT: 0 };
function followReset() { const p = G.player; let t = [p.x, p.y]; for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const x = p.x + dx, y = p.y + dy; if (typeof walkable === 'function' && walkable(x, y)) { t = [x, y]; break; } } FOLLOW.x = FOLLOW.fx = t[0]; FOLLOW.y = FOLLOW.fy = t[1]; }
function followStep(ox, oy) { if (FOLLOW.x === null) followReset(); FOLLOW.fx = FOLLOW.x; FOLLOW.fy = FOLLOW.y; FOLLOW.x = ox; FOLLOW.y = oy; const dx = FOLLOW.x - FOLLOW.fx; if (dx) FOLLOW.dir = dx > 0 ? 'right' : 'left'; FOLLOW.idleT = 0; }
function followPos() { const p = G.player; if (FOLLOW.x === null) followReset(); if (Math.abs(FOLLOW.x - p.x) + Math.abs(FOLLOW.y - p.y) > 3) followReset(); const k = p.moving ? p.prog : 1; return [FOLLOW.fx + (FOLLOW.x - FOLLOW.fx) * k, FOLLOW.fy + (FOLLOW.y - FOLLOW.fy) * k]; }
function drawFollower(TS) {
  const m = G.party && G.party.find(x => x.hp > 0); if (!m || !IMG[m.sp]) return null;
  const [x, y] = followPos(), p = G.player; if (FOLLOW.x === p.x && FOLLOW.y === p.y && !p.moving) return null;
  const moving = p.moving && (FOLLOW.fx !== FOLLOW.x || FOLLOW.fy !== FOLLOW.y);
  const hop = moving ? Math.abs(Math.sin(p.prog * Math.PI)) * TS * (p.run ? 0.22 : 0.16) : 0;
  return { y: (y + 1) * TS - 3, d: () => {
    const cx = (x + 0.5) * TS, by = (y + 1) * TS - TS * 0.06, sz = TS * 1.05;
    shadowEllipse(ctx, cx, by, TS * 0.32 * (1 - hop / TS), TS * 0.1, 0.4);
    const sq = moving ? 1 + Math.sin(p.prog * Math.PI * 2) * 0.06 : 1;
    drawCreature(ctx, m.sp, cx, by - hop, sz, { breathe: true, alive: true, back: FOLLOW.dir === 'right', shiny: m.shiny, sx: 1 / sq, sy: sq, excited: moving, phase: 2, walk: moving ? 1 : 0, spd: p.run ? 1.6 : 1.1 });
    FOLLOW.idleT += LAST_DT; if (!moving && FOLLOW.idleT > 9 && !FOLLOW.emo) { FOLLOW.emo = ['♥', '♪', '!', '…', '★'][Math.floor(Math.random() * 5)]; FOLLOW.emoT = 0; FOLLOW.idleT = 0; }
    if (FOLLOW.emo) { FOLLOW.emoT += LAST_DT; const a = Math.min(1, FOLLOW.emoT * 4) * Math.min(1, (2.2 - FOLLOW.emoT) * 3); if (FOLLOW.emoT > 2.2) FOLLOW.emo = null; else { ctx.save(); ctx.globalAlpha = Math.max(0, a); bubble(cx + TS * 0.25, by - sz * 0.95, TS * 0.8, FOLLOW.emo, FOLLOW.emo === '♥' ? '#ff5a8a' : '#5a7aff'); ctx.restore(); } }
  } };
}
// ---- NPC 待机：呼吸、东张西望（转身）、偶尔小跳、头顶表情 ----
function npcIdle(o) { const h = (o.x * 13 + o.y * 7) % 10, t = NOW + h * 1.7; const per = 5 + (h % 4);
  const k = Math.floor(t / per), q = t - k * per, typ = (k * 7 + h) % 4;
  return { flip: typ === 1 && q < 2.2, hop: typ === 2 && q < 0.5 ? Math.sin(q / 0.5 * Math.PI) : 0, emo: typ === 3 && q < 1.8 ? ['…', '♪', '?', '!'][(k + h) % 4] : null, sway: Math.sin(t * 1.6) * 0.02 }; }
// ---- 脚步：尘土 / 沙 / 雪印 / 花瓣 ----
const FOOTPRINTS = [];
function stepFx(x, y) {
  const r = ridAt(x, y), t = MAP[y][x];
  const c = r === 'desert' ? '#e8cf98' : r === 'snow' ? '#ffffff' : r === 'volcano' ? '#8a8078' : t === T.PATH ? '#d9c49a' : '#b7d38a';
  const n = ALIVE.q === 'low' ? 2 : 5;
  for (let i = 0; i < n; i++) WORLD_FX.push({ x: x + 0.5 + rnd(-0.18, 0.18), y: y + 0.92, vx: rnd(-0.8, 0.8), vy: rnd(-0.9, -0.3), r: 0, vr: 0, t: 0, life: rnd(0.35, 0.6), c, dust: true });
  if (r === 'desert' || r === 'snow') { FOOTPRINTS.push({ x: x + 0.5 + (FOOTPRINTS.length % 2 ? 0.1 : -0.1), y: y + 0.85, t: NOW, c: r === 'snow' ? 'rgba(150,175,210,0.45)' : 'rgba(150,110,60,0.35)' }); if (FOOTPRINTS.length > 40) FOOTPRINTS.shift(); }
  if (t === T.FLOWER) for (let i = 0; i < 3; i++) WORLD_FX.push({ x: x + 0.5, y: y + 0.6, vx: rnd(-1, 1), vy: rnd(-2, -1), r: rnd(0, 6), vr: rnd(-6, 6), t: 0, life: 1, c: ['#ffb0d0', '#fff0a0', '#ffffff'][i] });
}
function drawFootprints(TS) { for (let i = FOOTPRINTS.length - 1; i >= 0; i--) { const f = FOOTPRINTS[i], a = 1 - (NOW - f.t) / 8; if (a <= 0) { FOOTPRINTS.splice(i, 1); continue; } ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(f.x * TS, f.y * TS, TS * 0.06, TS * 0.035, 0, 0, 6.28); ctx.fill(); ctx.restore(); } }
// ---- 小动物：蝴蝶、蜻蜓、鸟群（带地面影子）、跃出水面的鱼 ----
const CRIT = [];
function nearTiles(cx, cy, rad, test) { const out = []; for (let i = 0; i < 40; i++) { const x = Math.round(cx + rnd(-rad, rad)), y = Math.round(cy + rnd(-rad * 0.6, rad * 0.6)); if (y >= 0 && y < H && x >= 0 && x < W && test(MAP[y][x], x, y)) out.push([x, y]); } return out; }
function updateCritters(TS, camX, camY) {
  const p = G.player, r = ridAt(p.x, p.y), cap = ALIVE.q === 'low' ? 6 : 16, nk = nightK();
  for (let i = CRIT.length - 1; i >= 0; i--) { const c = CRIT[i]; c.t += LAST_DT; if (c.t > c.life || Math.abs(c.x - p.x) > 20 || Math.abs(c.y - p.y) > 14) CRIT.splice(i, 1); }
  if (CRIT.length < cap && Math.random() < 0.08) {
    const roll = Math.random();
    if (roll < 0.45 && r !== 'volcano' && r !== 'snow' && nk < 0.6) { const s = nearTiles(p.x, p.y, 9, t => t === T.FLOWER || t === T.TALL || t === T.GROUND)[0]; if (s) CRIT.push({ k: 'fly', x: s[0] + 0.5, y: s[1] + 0.5, t: 0, life: rnd(8, 16), c: ['#ffd23a', '#ff8ac0', '#8ad0ff', '#ffffff', '#c59cff'][Math.floor(Math.random() * 5)], ph: Math.random() * 9 }); }
    else if (roll < 0.62) { const s = nearTiles(p.x, p.y, 8, t => t === T.WATER)[0]; if (s) CRIT.push({ k: nk > 0.5 ? 'firefly' : (Math.random() < 0.5 ? 'fish' : 'dragonfly'), x: s[0] + 0.5, y: s[1] + 0.5, t: 0, life: 1.4 + Math.random() * 6, ph: Math.random() * 9 }); }
    else if (roll < 0.78 && r !== 'volcano' && nk < 0.5 && !CRIT.some(c => c.k === 'bird')) { const dir = Math.random() < 0.5 ? 1 : -1; for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) CRIT.push({ k: 'bird', x: p.x - dir * 14 - j * dir * 0.7, y: p.y - 6 + rnd(-2, 2) + j * 0.5, vx: dir * rnd(3.2, 4), t: 0, life: 9, ph: j }); }
    else if (nk > 0.3 || r === 'forest') { const s = nearTiles(p.x, p.y, 9, t => t !== T.WATER && t !== T.LAVA)[0]; if (s) CRIT.push({ k: 'firefly', x: s[0] + 0.5, y: s[1] + 0.3, t: 0, life: rnd(5, 10), ph: Math.random() * 9 }); }
  }
}
function drawCrittersGround(TS) { // 在角色之下：鱼、水花
  for (const c of CRIT) if (c.k === 'fish') { const q = c.t / 1.4; if (q > 1) continue; const x = c.x * TS, y = c.y * TS;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - q)) + ')'; ctx.lineWidth = TS * 0.02; ctx.beginPath(); ctx.ellipse(x, y, TS * 0.12 + q * TS * 0.35, (TS * 0.12 + q * TS * 0.35) * 0.4, 0, 0, 6.28); ctx.stroke();
    if (q < 0.7) { const a = q / 0.7, jx = x + (a - 0.5) * TS * 0.5, jy = y - Math.sin(a * Math.PI) * TS * 0.45; ctx.translate(jx, jy); ctx.rotate((a - 0.5) * 2.4); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.ellipse(0, 0, TS * 0.11, TS * 0.045, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(-TS * 0.1, 0); ctx.lineTo(-TS * 0.17, -TS * 0.05); ctx.lineTo(-TS * 0.17, TS * 0.05); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(TS * 0.06, -TS * 0.01, TS * 0.012, 0, 6.28); ctx.fill(); }
    ctx.restore(); }
}
function drawCrittersAir(TS) {
  for (const c of CRIT) {
    const life = Math.min(1, c.t * 2, (c.life - c.t) * 2);
    if (c.k === 'fly' || c.k === 'dragonfly') { const fl = c.k === 'dragonfly'; c.x += Math.sin(NOW * (fl ? 1.1 : 0.7) + c.ph) * LAST_DT * (fl ? 1.6 : 0.8); c.y += Math.cos(NOW * (fl ? 1.5 : 0.9) + c.ph * 2) * LAST_DT * (fl ? 1.0 : 0.6);
      const x = c.x * TS, y = c.y * TS - TS * (0.5 + 0.15 * Math.sin(NOW * 2 + c.ph)), f = Math.abs(Math.sin(NOW * (fl ? 40 : 14) + c.ph));
      ctx.save(); ctx.globalAlpha = life; ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + TS * 0.55, TS * 0.06, TS * 0.02, 0, 0, 6.28); ctx.fill(); ctx.translate(x, y);
      if (fl) { ctx.fillStyle = '#3ab0c8'; ctx.fillRect(-TS * 0.1, -TS * 0.01, TS * 0.2, TS * 0.02); ctx.fillStyle = 'rgba(220,250,255,0.7)'; ctx.beginPath(); ctx.ellipse(-TS * 0.02, -TS * 0.03 * f, TS * 0.04, TS * 0.08 * (0.4 + f), 0.3, 0, 6.28); ctx.ellipse(TS * 0.02, -TS * 0.03 * f, TS * 0.04, TS * 0.08 * (0.4 + f), -0.3, 0, 6.28); ctx.fill(); }
      else { ctx.fillStyle = c.c; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * TS * 0.045 * (0.3 + f), -TS * 0.015, TS * 0.05 * (0.3 + f), TS * 0.045, s * 0.4, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * TS * 0.035 * (0.3 + f), TS * 0.03, TS * 0.035 * (0.3 + f), TS * 0.03, -s * 0.3, 0, 6.28); ctx.fill(); } ctx.fillStyle = '#3a2a20'; ctx.fillRect(-TS * 0.008, -TS * 0.04, TS * 0.016, TS * 0.08); }
      ctx.restore(); }
    else if (c.k === 'bird') { c.x += c.vx * LAST_DT; c.y += Math.sin(NOW * 1.3 + c.ph) * LAST_DT * 0.3; const x = c.x * TS, y = c.y * TS, f = Math.sin(NOW * 9 + c.ph * 1.7);
      ctx.save(); ctx.fillStyle = 'rgba(20,40,20,0.13)'; ctx.beginPath(); ctx.ellipse(x + TS * 1.2, y + TS * 3.2, TS * 0.18, TS * 0.06, 0, 0, 6.28); ctx.fill();
      ctx.translate(x, y); ctx.scale(c.vx > 0 ? 1 : -1, 1); ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = TS * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-TS * 0.2, -TS * 0.08 * f); ctx.quadraticCurveTo(-TS * 0.08, -TS * 0.02, 0, 0); ctx.quadraticCurveTo(TS * 0.08, -TS * 0.02, TS * 0.2, -TS * 0.08 * f); ctx.stroke(); ctx.restore(); }
    else if (c.k === 'firefly') { c.x += Math.sin(NOW * 0.6 + c.ph) * LAST_DT * 0.5; c.y += Math.cos(NOW * 0.8 + c.ph) * LAST_DT * 0.4; const x = c.x * TS, y = c.y * TS - TS * 0.4, a = life * (0.35 + 0.65 * Math.max(0, Math.sin(NOW * 2.4 + c.ph)));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(glowSprite('#d8ff7a'), x - TS * 0.28, y - TS * 0.28, TS * 0.56, TS * 0.56); ctx.fillStyle = '#f4ffc0'; ctx.beginPath(); ctx.arc(x, y, TS * 0.025, 0, 6.28); ctx.fill(); ctx.restore(); }
  }
}
// ---- 水面：岸边浪花、流动波光；悬崖下的瀑布与水雾 ----
let FALLS = null;
function findFalls() { FALLS = []; for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) if (MAP[y][x] === T.WATER && (MAP[y - 1][x] === T.CLIFF || MAP[y - 1][x] === T.TREE && hash(x, y) > 0.86 && MAP[y + 1] && MAP[y + 1][x] === T.WATER)) FALLS.push([x, y]); }
function drawWaterLife(TS, x0, y0, x1, y1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (MAP[y][x] !== T.WATER) continue;
    // 流动波光：斜向移动的亮带
    const b = Math.sin(x * 1.3 + y * 0.7 - NOW * 1.6) * 0.5 + 0.5; if (b > 0.75) { ctx.globalAlpha = (b - 0.75) * 0.9; ctx.fillStyle = 'rgba(200,240,255,0.35)'; ctx.beginPath(); ctx.ellipse((x + 0.5) * TS, (y + 0.5) * TS, TS * 0.42, TS * 0.08, -0.35, 0, 6.28); ctx.fill(); }
    // 岸边浪花
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(NOW * 2.2 + x + y); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = TS * 0.035;
    const land = (xx, yy) => yy >= 0 && yy < H && xx >= 0 && xx < W && MAP[yy][xx] !== T.WATER && MAP[yy][xx] !== T.BRIDGE && MAP[yy][xx] !== T.BRIDGEX;
    const o = TS * (0.07 + 0.03 * Math.sin(NOW * 2 + x * 2 + y));
    ctx.beginPath(); if (land(x, y - 1)) { ctx.moveTo(x * TS, y * TS + o); ctx.lineTo((x + 1) * TS, y * TS + o); } if (land(x, y + 1)) { ctx.moveTo(x * TS, (y + 1) * TS - o); ctx.lineTo((x + 1) * TS, (y + 1) * TS - o); } if (land(x - 1, y)) { ctx.moveTo(x * TS + o, y * TS); ctx.lineTo(x * TS + o, (y + 1) * TS); } if (land(x + 1, y)) { ctx.moveTo((x + 1) * TS - o, y * TS); ctx.lineTo((x + 1) * TS - o, (y + 1) * TS); } ctx.stroke();
  }
  ctx.restore();
  if (!FALLS) findFalls();
  for (const [x, y] of FALLS) { if (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 2) continue;
    const cx = x * TS, top = (y - 1) * TS + TS * 0.2, bot = y * TS + TS * 0.35;
    ctx.save(); const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(170,220,255,0.85)'); g.addColorStop(1, 'rgba(230,248,255,0.95)'); ctx.fillStyle = g; ctx.fillRect(cx + TS * 0.12, top, TS * 0.76, bot - top);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = TS * 0.03; for (let i = 0; i < 6; i++) { const xx = cx + TS * (0.18 + i * 0.13), off = ((NOW * 2.2 + hash(x + i, y)) % 1) * (bot - top); ctx.beginPath(); ctx.moveTo(xx, top + off); ctx.lineTo(xx, Math.min(bot, top + off + TS * 0.3)); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const q = (NOW * 0.8 + i / 4) % 1; ctx.globalAlpha = (1 - q) * 0.5; ctx.drawImage(softSprite('#ffffff'), cx + TS * 0.5 - TS * (0.3 + q * 0.5), bot - TS * (0.2 + q * 0.4), TS * (0.6 + q), TS * (0.4 + q * 0.6)); }
    ctx.restore(); }
}
// ---- 屏幕空间：云影、光束、昼夜与夜间灯光 ----
let CLOUD_SPR = null;
function cloudSprite() { if (CLOUD_SPR) return CLOUD_SPR; const c = document.createElement('canvas'); c.width = 340; c.height = 230; const g = c.getContext('2d');
  for (let i = 0; i < 7; i++) { const x = 92 + i * 26 + Math.sin(i * 2.1) * 10, y = 115 + Math.sin(i * 1.7) * 18, r = 34 + (i % 3) * 10; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill(); }
  return (CLOUD_SPR = c); }
function drawSkyLife(camX, camY, TS, rid) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); const nk = nightK(), dk = duskK(), hi = ALIVE.q !== 'low';
  if (hi && rid !== 'volcano') { // 云影：大片柔和阴影随风飘过
    ctx.save(); ctx.globalAlpha = 0.13 * (1 - nk); const S = TS * 9;
    for (let i = 0; i < 5; i++) { const wx = ((i * 0.37 * W * TS + NOW * TS * 0.35 - camX * 1.0) % (CW + S * 2) + CW + S * 2) % (CW + S * 2) - S, wy = ((i * 0.29 * H * TS + NOW * TS * 0.08 - camY) % (CH + S) + CH + S) % (CH + S) - S * 0.5;
      ctx.drawImage(cloudSprite(), wx, wy, S * (1.4 + (i % 2) * 0.6), S * 0.8); }
    ctx.restore(); }
  if (hi && (rid === 'forest' || rid === 'meadow' || rid === 'flower' || rid === 'lake') && nk < 0.5) { // 光束
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const a = (0.05 + 0.035 * Math.sin(NOW * 0.5 + i * 1.9)) * (1 - nk * 2) * (rid === 'forest' ? 1.4 : 1); if (a <= 0) continue; const x = CW * (0.1 + i * 0.27) - camX * 0.05 % (CW * 0.27);
      ctx.globalAlpha = a; const g = ctx.createLinearGradient(x, 0, x + CW * 0.25, CH); g.addColorStop(0, 'rgba(255,248,210,1)'); g.addColorStop(1, 'rgba(255,248,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + CW * 0.07, -10); ctx.lineTo(x + CW * 0.32, CH); ctx.lineTo(x + CW * 0.18, CH); ctx.closePath(); ctx.fill(); }
    ctx.restore(); }
  if (dk > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = dk * 0.55; ctx.fillStyle = '#ff9a4a'; ctx.fillRect(0, 0, CW, CH); ctx.restore(); }
  if (nk > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = nk * 0.62; ctx.fillStyle = '#26346e'; ctx.fillRect(0, 0, CW, CH); ctx.restore(); }
}
function drawNightLights(TS) { // 夜晚：房屋窗户、主角身边一圈暖光
  const nk = nightK(); if (nk < 0.05) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  BUILDINGS.forEach(b => { ctx.globalAlpha = nk * (0.55 + 0.1 * Math.sin(NOW * 3 + b.x)); ctx.drawImage(glowSprite('#ffc860'), (b.x + b.w / 2) * TS - TS * 1.6, (b.y + b.h - 0.9) * TS - TS * 1.2, TS * 3.2, TS * 2.4); });
  const [fx, fy] = playerPos(); ctx.globalAlpha = nk * 0.35; ctx.drawImage(softSprite('#fff0c0'), (fx + 0.5) * TS - TS * 2.2, (fy + 0.5) * TS - TS * 2.2, TS * 4.4, TS * 4.4);
  ctx.restore();
}
// ---- 地面小草丛：随风摇摆（不在静态贴图里，实时画）----
function drawGroundLife(TS, x0, y0, x1, y1) {
  if (ALIVE.q === 'low') return; const r0 = ridAt(G.player.x, G.player.y); if (r0 === 'desert' || r0 === 'volcano') return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = TS * 0.028;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = MAP[y][x]; if (t !== T.GROUND && t !== T.FLOWER) continue; const h = hash(x * 5 + 3, y * 9 + 1); if (h < 0.55) continue;
    const r = ridAt(x, y); if (r === 'desert' || r === 'volcano') continue; const wd = windAt(x, y), sw = wd.base * 0.12 + wd.gust * 0.45;
    const bx = (x + 0.2 + hash(x, y * 3) * 0.6) * TS, by = (y + 0.35 + hash(x * 7, y) * 0.55) * TS;
    ctx.strokeStyle = r === 'snow' ? 'rgba(235,245,255,0.8)' : t === T.FLOWER ? 'rgba(120,190,90,0.9)' : 'rgba(70,150,60,0.75)';
    for (let i = -1; i <= 1; i++) { const hh = TS * (0.13 + 0.05 * hash(x + i, y)); ctx.beginPath(); ctx.moveTo(bx + i * TS * 0.035, by); ctx.quadraticCurveTo(bx + i * TS * 0.05 + sw * hh * 0.5, by - hh * 0.6, bx + i * TS * 0.07 + sw * hh, by - hh); ctx.stroke(); }
    if (t === T.FLOWER && h > 0.8) { ctx.fillStyle = ['#ff8ab8', '#fff07a', '#ffffff', '#c08aff'][Math.floor(h * 40) % 4]; ctx.beginPath(); ctx.arc(bx + sw * TS * 0.15, by - TS * 0.17, TS * 0.035, 0, 6.28); ctx.fill(); }
  }
  ctx.restore();
}
