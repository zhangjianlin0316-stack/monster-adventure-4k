'use strict';
// ================== 星老师：答错后的动画分步讲解 ==================
// openTutor(q, onClose)：q 为题目对象（或错题本条目）；Explain.build 生成讲解脚本，这里负责绘制动画。
const TUTOR_STEP_T = 4.6; // 每一步自动前进的时间（秒）
function openTutor(q, onClose) {
  const X = Explain.build(q);
  G.tutor = { q, X, s: 0, t: 0, T: 0, onClose, auto: true, done: false };
  AudioSys.sfx('tutor_in'); tutorVoice(X.steps[0]);
}
function closeTutor() { const T = G.tutor; if (!T) return; G.tutor = null; AudioSys.sfx('confirm'); if (T.onClose) T.onClose(); }
function tutorVoice(s) { AudioSys.sfx('talk'); }
function tutorStep(d) {
  const T = G.tutor; if (!T) return; const n = T.X.steps.length;
  const ns = clamp(T.s + d, 0, n - 1);
  if (ns !== T.s) { T.s = ns; T.t = 0; tutorVoice(T.X.steps[ns]); AudioSys.sfx('chalk'); }
  else if (d > 0) closeTutor();
}
function tutorInput(k) {
  const T = G.tutor; if (!T) return;
  if (k === 'cancel') return closeTutor();
  if (k === 'ok' || k === 'right' || k === 'down') { if (T.t < 0.25) return; return tutorStep(1); }
  if (k === 'left' || k === 'up') return tutorStep(-1);
  if (k === 'replay' || k === 'hint') { T.s = 0; T.t = 0; T.T = 0; AudioSys.sfx('chalk'); tutorVoice(T.X.steps[0]); }
}
function tutorPointer(ux, uy) {
  const T = G.tutor; if (!T) return;
  if (uy > 900 - 70 && ux > 1180) { if (ux > 1420) closeTutor(); else if (ux > 1300) tutorStep(1); else tutorStep(-1); return; }
  tutorStep(1);
}
function updateTutor(dt) {
  const T = G.tutor; if (!T) return;
  T.t += dt; T.T += dt;
  if (T.auto && T.t > TUTOR_STEP_T && T.s < T.X.steps.length - 1) { T.s++; T.t = 0; tutorVoice(T.X.steps[T.s]); AudioSys.sfx('chalk'); }
}
// ---------- 绘制工具 ----------
const CH_W = '#f6f3e8', CH_Y = '#ffe27a', CH_P = '#ff9ab8', CH_B = '#8fd8ff', CH_G = '#a6f5a0', CH_O = '#ffb36b';
const TU = { e: t => easeOut(clamp(t, 0, 1)) };
function chalk(s, x, y, size, color, align) { mathText(String(s), x, y, size, color || CH_W, align || 'center', '800'); }
function cdot(x, y, r, c, a) { ctx.save(); if (a !== undefined) ctx.globalAlpha *= a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
function cline(x1, y1, x2, y2, c, lw, dash) { ctx.save(); ctx.strokeStyle = c || CH_W; ctx.lineWidth = lw || 4; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
function crect(x, y, w, h, fill, stroke, lw) { ctx.save(); if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.strokeRect(x, y, w, h); } ctx.restore(); }
function brace(x1, x2, y, up, label, c) { const d = up ? -1 : 1; ctx.save(); ctx.strokeStyle = c || CH_Y; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo(x1, y + 16 * d, x1 + 16, y + 16 * d); ctx.lineTo((x1 + x2) / 2 - 12, y + 16 * d); ctx.quadraticCurveTo((x1 + x2) / 2, y + 16 * d, (x1 + x2) / 2, y + 30 * d); ctx.quadraticCurveTo((x1 + x2) / 2, y + 16 * d, (x1 + x2) / 2 + 12, y + 16 * d); ctx.lineTo(x2 - 16, y + 16 * d); ctx.quadraticCurveTo(x2, y + 16 * d, x2, y); ctx.stroke(); ctx.restore(); if (label !== undefined) chalk(label, (x1 + x2) / 2, y + 52 * d, 28, c || CH_Y); }
function pop(t, d) { return easeBack(clamp((t - (d || 0)) * 3, 0, 1)); }
function glowBox(x, y, w, h, c, t) { ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.shadowColor = c; ctx.shadowBlur = 14 + 6 * Math.sin(t * 6); ctx.strokeRect(x, y, w, h); ctx.restore(); }
function wedge(cx, cy, r, a0, a1, fill) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
// 简易小图标
function iconChick(x, y, s) { cdot(x, y, s * 0.42, '#ffd54a'); cdot(x + s * 0.18, y - s * 0.32, s * 0.26, '#ffe07a'); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(x + s * 0.4, y - s * 0.34); ctx.lineTo(x + s * 0.58, y - s * 0.28); ctx.lineTo(x + s * 0.4, y - s * 0.22); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + s * 0.24, y - s * 0.36, s * 0.04, 0, 6.3); ctx.fill(); }
function iconRabbit(x, y, s) { ctx.save(); ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.ellipse(x - s * 0.08, y - s * 0.72, s * 0.08, s * 0.24, -0.15, 0, 6.3); ctx.ellipse(x + s * 0.12, y - s * 0.72, s * 0.08, s * 0.24, 0.15, 0, 6.3); ctx.fill(); ctx.restore(); cdot(x, y, s * 0.42, '#f2f2f2'); cdot(x + s * 0.04, y - s * 0.34, s * 0.26, '#ffffff'); ctx.fillStyle = '#ff7aa0'; ctx.beginPath(); ctx.arc(x + s * 0.2, y - s * 0.34, s * 0.04, 0, 6.3); ctx.fill(); }
function iconPerson(x, y, s, c) { cdot(x, y - s * 0.55, s * 0.18, c || CH_B); ctx.save(); ctx.fillStyle = c || CH_B; ctx.beginPath(); ctx.moveTo(x - s * 0.22, y); ctx.lineTo(x, y - s * 0.38); ctx.lineTo(x + s * 0.22, y); ctx.closePath(); ctx.fill(); ctx.restore(); }
function iconTree(x, y, s) { crect(x - s * 0.06, y - s * 0.35, s * 0.12, s * 0.35, '#9b6b3a'); ctx.fillStyle = '#5fd36a'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.32, y - s * 0.3); ctx.lineTo(x - s * 0.32, y - s * 0.3); ctx.closePath(); ctx.fill(); }
// ---------- 各类动画 ----------
const VIZ = {};
// 十格阵：20 以内加减
VIZ.tenframe = (X, k, t, A) => {
  const p = X.p, res = p.op === '+' ? p.a + p.b : p.a - p.b; const N = p.op === '+' ? ((p.a < 10 && res > 10) ? 4 : 3) : ((p.a > 10 && p.a - 10 < p.b) ? 4 : 3);
  const st = k - (X.steps.length - N); const cs = 70, gx = A.x + 40, gy = A.y + 150;
  chalk(p.a + ' ' + p.op + ' ' + p.b + ' = ' + (st >= N - 1 ? res : '?'), A.x + A.w / 2, A.y + 60, 54, st >= N - 1 ? CH_Y : CH_W);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 10; i++) { const x = gx + f * (cs * 5 + 50) + (i % 5) * cs, y = gy + Math.floor(i / 5) * cs; crect(x, y, cs, cs, null, 'rgba(246,243,232,0.6)', 3); }
  const pos = i => { const f = Math.floor(i / 10), j = i % 10; return [gx + f * (cs * 5 + 50) + (j % 5) * cs + cs / 2, gy + Math.floor(j / 5) * cs + cs / 2]; };
  const showA = st >= 0 ? Math.min(p.a, Math.floor((st > 0 ? 99 : t * 8))) : 0;
  if (p.op === '+') {
    for (let i = 0; i < showA; i++) { const [x, y] = pos(i); cdot(x, y, cs * 0.36 * pop(st > 0 ? 9 : t, i * 0.12), CH_B); }
    let nb = 0; if (st >= 1) { const lim = (N === 4 && st === 1) ? 10 - p.a : p.b; nb = Math.min(lim, Math.floor((st === 1 || (N === 4 && st === 2) ? t * 6 : 99) + (N === 4 && st === 2 ? 10 - p.a : 0))); if (st > (N === 4 ? 2 : 1)) nb = p.b; }
    for (let i = 0; i < nb; i++) { const [x, y] = pos(p.a + i); cdot(x, y, cs * 0.36, CH_O); }
    if (N === 4 && st >= 1 && p.a + nb >= 10) { glowBox(gx - 6, gy - 6, cs * 5 + 12, cs * 2 + 12, CH_Y, A.T); chalk('满 10！', gx + cs * 2.5, gy + cs * 2 + 50, 34, CH_Y); }
    if (st >= N - 1) chalk('一共 ' + res + ' 个', A.x + A.w / 2, gy + cs * 2 + 120, 40, CH_G);
  } else {
    for (let i = 0; i < showA; i++) { const [x, y] = pos(i); cdot(x, y, cs * 0.36, CH_B); }
    if (st >= 1) { const nb = Math.min(p.b, Math.floor(st === 1 ? t * 6 : 99)); for (let i = 0; i < nb; i++) { const idx = N === 4 ? i : p.a - 1 - i; const [x, y] = pos(idx); cline(x - 22, y - 22, x + 22, y + 22, CH_P, 6); cline(x + 22, y - 22, x - 22, y + 22, CH_P, 6); } }
    if (st >= N - 1) chalk('还剩 ' + res + ' 个', A.x + A.w / 2, gy + cs * 2 + 120, 40, CH_G);
  }
};
// 竖式
VIZ.columns = (X, k, t, A) => {
  const p = X.p, cols = p.cols, L = Math.max(String(p.a).length, String(p.b).length, String(p.res).length) + 1, cw = 76;
  const rx = A.x + A.w / 2 + L * cw / 2 - 40, y0 = A.y + 120;
  const nShow = k >= X.steps.length - 1 ? cols.length : clamp(k, 0, cols.length);
  const cur = k >= 1 && k <= cols.length ? cols[k - 1].pos : -1;
  if (cur >= 0) { ctx.save(); ctx.fillStyle = 'rgba(255,226,122,' + (0.16 + 0.06 * Math.sin(A.T * 5)) + ')'; ctx.fillRect(rx - cur * cw - cw / 2, y0 - 70, cw, 360); ctx.restore(); }
  const drawNum = (n, y, c) => { String(n).split('').reverse().forEach((d, i) => chalk(d, rx - i * cw, y, 66, c)); };
  drawNum(p.a, y0 + 30, CH_W); drawNum(p.b, y0 + 130, CH_W); chalk(p.op, rx - (L - 1) * cw - 10, y0 + 130, 60, CH_Y);
  cline(rx - (L - 0.4) * cw, y0 + 190, rx + cw * 0.6, y0 + 190, CH_W, 5);
  for (let i = 0; i < nShow; i++) {
    const c = cols[i], a = i === nShow - 1 && k < X.steps.length - 1 ? pop(t, 0.3) : 1;
    ctx.save(); ctx.globalAlpha = a; chalk(String(c.r), rx - c.pos * cw - (String(c.r).length - 1) * cw * 0, y0 + 260, 66, CH_G);
    if (c.c && i < cols.length) { if (p.op === '−') cdot(rx - (c.pos + 1) * cw, y0 - 30, 7, CH_P); else chalk(String(c.c), rx - (c.pos + 1) * cw + 22, y0 - 22, 30, CH_P); }
    ctx.restore();
  }
  if (p.op === '×') { for (let i = 0; i < nShow; i++) { const c = cols[i]; if (String(c.r).length > 1) { /* 最高位直接写出 */ } } }
  if (k >= X.steps.length - 1) chalk('= ' + p.res, A.x + A.w / 2, A.y + A.h - 40, 46, CH_Y);
};
// 乘法拆分
VIZ.mulsplit = (X, k, t, A) => {
  const p = X.p, b1 = p.b % 10, b10 = p.b - b1, W = A.w - 120, x0 = A.x + 60, y0 = A.y + 140, H = 220;
  const w10 = W * b10 / p.b, w1 = W - w10;
  chalk(p.a + ' × ' + p.b, A.x + A.w / 2, A.y + 60, 50);
  crect(x0, y0, W, H, 'rgba(143,216,255,0.15)', CH_W, 3);
  if (k >= 0) { cline(x0 + w10, y0 - 10, x0 + w10, y0 + H + 10, CH_Y, 4, [10, 8]); chalk(b10, x0 + w10 / 2, y0 - 30, 32, CH_Y); chalk(b1, x0 + w10 + w1 / 2, y0 - 30, 32, CH_Y); chalk(p.a, x0 - 34, y0 + H / 2, 32, CH_Y); }
  if (k >= 1) { crect(x0 + w10, y0, w1, H, 'rgba(255,179,107,' + 0.45 * TU.e(k > 1 ? 1 : t * 2) + ')'); chalk(p.a * b1, x0 + w10 + w1 / 2, y0 + H / 2, 34, CH_W); }
  if (k >= 2) { crect(x0, y0, w10, H, 'rgba(166,245,160,' + 0.35 * TU.e(k > 2 ? 1 : t * 2) + ')'); chalk(p.a * b10, x0 + w10 / 2, y0 + H / 2, 40, CH_W); }
  if (k >= 3) chalk(p.a * b10 + ' + ' + p.a * b1 + ' = ' + p.a * p.b, A.x + A.w / 2, y0 + H + 110, 48, CH_Y);
};
// 长除法（逐步写出）
VIZ.longdiv = (X, k, t, A) => {
  const p = X.p; chalk(p.a + ' ÷ ' + p.b, A.x + A.w / 2, A.y + 50, 50);
  const x0 = A.x + 230, y0 = A.y + 150, cw = 58;
  chalk(p.b, x0 - 50, y0 + 10, 54, CH_W); ctx.save(); ctx.strokeStyle = CH_W; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 - 14, y0 + 44); ctx.quadraticCurveTo(x0 + 4, y0 + 10, x0 - 14, y0 - 30); ctx.lineTo(x0 + String(p.a).length * cw + 20, y0 - 30); ctx.stroke(); ctx.restore();
  String(p.a).split('').forEach((d, i) => chalk(d, x0 + 20 + i * cw, y0 + 10, 54, CH_W));
  const n = clamp(k, 0, p.rows.length); let y = y0 + 80;
  for (let r = 0; r < n; r++) { const row = p.rows[r]; const xi = x0 + 20 + row.i * cw; chalk(row.qd, xi, y0 - 64, 54, CH_G); chalk(row.sub, xi, y, 38, CH_O, 'right'); cline(xi - 80, y + 24, xi + 20, y + 24, CH_W, 3); chalk(row.rem, xi, y + 58, 38, CH_W, 'right'); y += 120; if (y > A.y + A.h - 40) break; }
  if (k >= X.steps.length - 1) chalk('商 ' + p.q + (p.r ? '　余 ' + p.r : ''), A.x + A.w - 160, A.y + A.h - 60, 44, CH_Y);
};
// 点阵：乘法
VIZ.array = (X, k, t, A) => {
  const p = X.p, r = p.r, c = p.c; const s = Math.min(70, (A.w - 140) / c, (A.h - 200) / r), r0 = s * 0.36;
  const x0 = A.x + (A.w - c * s) / 2, y0 = A.y + 110;
  const rows = k <= 0 ? Math.min(1, t) : k === 1 ? Math.min(r, Math.floor(t * 2.2) + 1) : r;
  for (let i = 0; i < rows; i++) { for (let j = 0; j < c; j++) cdot(x0 + j * s + s / 2, y0 + i * s + s / 2, r0 * (i === rows - 1 && k === 1 ? pop(t * 2.2 - i) : 1), [CH_B, CH_O, CH_G, CH_P][i % 4]); if (k >= 2 && i < Math.min(r, Math.floor(t * 2.5) + 1 + (k > 2 ? 99 : 0))) chalk(c * (i + 1), x0 + c * s + 50, y0 + i * s + s / 2, Math.min(32, s * 0.6), CH_Y, 'left'); }
  if (k >= 0) chalk('每排 ' + c + ' 个，共 ' + r + ' 排', A.x + A.w / 2, A.y + 60, 36, CH_W);
  if (k >= X.steps.length - 1) chalk(c + ' × ' + r + ' = ' + c * r, A.x + A.w / 2, A.y + A.h - 30, 48, CH_Y);
};
// 平均分（发牌）
VIZ.group = (X, k, t, A) => {
  const p = X.p, g = p.g, per = p.n / g; const pw = Math.min(150, (A.w - 40) / g - 12), y0 = A.y + 300;
  const dealt = k <= 0 ? 0 : k === 1 ? Math.min(p.n, Math.floor(t * Math.max(4, p.n / 3.2))) : p.n;
  for (let j = 0; j < g; j++) { const x = A.x + 20 + j * (pw + 12); ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.strokeStyle = CH_W; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + pw / 2, y0 + 120, pw / 2, 46, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.restore(); }
  const ds = Math.min(18, pw / 7);
  for (let i = 0; i < p.n; i++) {
    if (i < dealt) { const j = i % g, n = Math.floor(i / g); const x = A.x + 20 + j * (pw + 12) + pw / 2 + ((n % 3) - 1) * ds * 2.1, y = y0 + 110 - Math.floor(n / 3) * ds * 2.1; cdot(x, y, ds, CH_O); }
    else { const x = A.x + 60 + (i % 24) * 28, y = A.y + 80 + Math.floor(i / 24) * 28; cdot(x, y, 11, CH_O); }
  }
  if (k >= 2) for (let j = 0; j < g; j++) chalk(per, A.x + 20 + j * (pw + 12) + pw / 2, y0 + 210, 34, CH_Y);
  if (k >= X.steps.length - 1) chalk(p.n + ' ÷ ' + g + ' = ' + per, A.x + A.w / 2, A.y + A.h - 20, 48, CH_Y);
};
// 钟面
VIZ.clock = (X, k, t, A) => {
  const p = X.p, cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 10, R = Math.min(A.w, A.h) * 0.4;
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ffcf5a'; ctx.stroke(); ctx.restore();
  for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.2832 - 1.5708; text(String(i), cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8, 34, k === 3 && i === (p.m ? p.m / 5 : 12) ? '#e0402a' : '#24304f', 'center', '900'); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * 6.2832; const r1 = i % 5 ? R * 0.93 : R * 0.88; cline(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * R * 0.97, cy + Math.sin(a) * R * 0.97, '#24304f', i % 5 ? 2 : 4); }
  const hT = ((p.h % 12) + p.m / 60) / 12 * 6.2832, mT = p.m / 60 * 6.2832;
  const hA = k <= 0 ? 0 : k === 1 ? hT * TU.e(t / 1.6) : hT, mA = k <= 2 ? 0 : k === 3 ? mT * TU.e(t / 1.6) : mT;
  const hand = (a, len, w, c) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -len); ctx.stroke(); ctx.restore(); };
  hand(mA, R * 0.78, 8, k === 2 || k === 3 ? '#3a8aff' : '#24304f'); hand(hA, R * 0.5, 14, k === 1 ? '#e0402a' : '#24304f');
  cdot(cx, cy, 12, '#ffcf5a');
  if (k === 2) { const a0 = -1.5708; ctx.save(); ctx.strokeStyle = 'rgba(58,138,255,0.8)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, a0, a0 + 6.2832 / 12 * TU.e(t)); ctx.stroke(); ctx.restore(); chalk('一大格 = 5 分', cx + R + 40, cy - R + 20, 30, CH_B, 'left'); }
  chalk(k >= 1 ? '时针：短' : '', A.x + 20, A.y + 40, 28, CH_P, 'left'); chalk(k >= 2 ? '分针：长' : '', A.x + 20, A.y + 80, 28, CH_B, 'left');
  if (k >= X.steps.length - 1) chalk(X.answer, cx, A.y + A.h - 10, 46, CH_Y);
};
// 人民币
VIZ.coins = (X, k, t, A) => {
  const p = X.p; const note = (x, y, a) => { ctx.save(); ctx.globalAlpha *= a === undefined ? 1 : a; rrect(x, y, 110, 56, 8, '#7fd08a', '#2f7a3a', 3); text('1元', x + 55, y + 30, 26, '#13361a', 'center', '900'); ctx.restore(); };
  const coin = (x, y, c, a) => { ctx.save(); ctx.globalAlpha *= a === undefined ? 1 : a; cdot(x, y, 20, c || '#e8c45a'); text('角', x, y + 1, 18, '#4a3200', 'center', '900'); ctx.restore(); };
  if (p.mode === 'change') {
    const n = p.pay; chalk('付 ' + yuanStr(p.pay) + '　价钱 ' + yuanStr(p.price), A.x + A.w / 2, A.y + 40, 34);
    if (k <= 0) { for (let i = 0; i < Math.floor(p.pay / 10); i++) note(A.x + 40 + (i % 5) * 130, A.y + 110 + Math.floor(i / 5) * 76); return; }
    for (let i = 0; i < n; i++) { const x = A.x + 50 + (i % 15) * 46, y = A.y + 110 + Math.floor(i / 15) * 50; const gone = k >= 2 && i < p.price; const a = gone ? (k === 2 ? 1 - 0.75 * TU.e(t) : 0.25) : 1; coin(x, y, gone ? '#c98a8a' : (k >= 3 ? '#ffe27a' : '#e8c45a'), a); if (gone && k >= 2) cline(x - 14, y - 14, x + 14, y + 14, CH_P, 4); }
    if (k >= 3) chalk('找回 ' + (p.pay - p.price) + ' 角 = ' + yuanStr(p.pay - p.price), A.x + A.w / 2, A.y + A.h - 30, 44, CH_Y);
  } else {
    const draw = (j, x0, y0, c) => { for (let i = 0; i < Math.floor(j / 10); i++) note(x0 + i * 120, y0); for (let i = 0; i < j % 10; i++) coin(x0 + 25 + (i % 6) * 46, y0 + 100 + Math.floor(i / 6) * 46, c); };
    if (k <= 1) { draw(p.a, A.x + 30, A.y + 90, '#e8c45a'); draw(p.b, A.x + A.w / 2 + 20, A.y + 90, '#f0a85a'); chalk(yuanStr(p.a), A.x + A.w / 4, A.y + 50, 32); chalk(yuanStr(p.b), A.x + A.w * 0.75, A.y + 50, 32); chalk('+', A.x + A.w / 2, A.y + 140, 54, CH_Y); }
    else { const s = p.a + p.b; draw(k >= 3 ? s : Math.floor(p.a / 10) * 10 + Math.floor(p.b / 10) * 10 + (p.a % 10 + p.b % 10), A.x + 60, A.y + 100, '#e8c45a'); if (k === 2 && (p.a % 10 + p.b % 10) >= 10) glowBox(A.x + 60, A.y + 175, 300, 110, CH_Y, A.T); }
    if (k >= 3) chalk('一共 ' + yuanStr(p.a + p.b), A.x + A.w / 2, A.y + A.h - 30, 46, CH_Y);
  }
};
function yuanStr(j) { const y = Math.floor(j / 10), k = j % 10; return ((y ? y + '元' : '') + (k ? k + '角' : '')) || '0元'; }
// 时间轴
VIZ.timeline = (X, k, t, A) => {
  const p = X.p, x0 = A.x + 50, x1 = A.x + A.w - 50, y = A.y + A.h / 2 + 40, span = p.e - p.s, X_ = m => x0 + (m - p.s) / span * (x1 - x0);
  cline(x0 - 20, y, x1 + 20, y, CH_W, 5);
  const fmt = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  const marks = [p.s, p.e]; p.hops.forEach(h => marks.push(h.to)); [...new Set(marks)].forEach(m => { cline(X_(m), y - 16, X_(m), y + 16, CH_W, 4); chalk(fmt(m), X_(m), y + 50, 30, CH_W); });
  p.hops.forEach((h, i) => { if (k < i + 1) return; const pr = k === i + 1 ? TU.e(t / 1.4) : 1; const xa = X_(h.from), xb = X_(h.to), mid = (xa + xb) / 2, hh = Math.min(200, (xb - xa) * 0.45); ctx.save(); ctx.strokeStyle = i ? CH_O : CH_B; ctx.lineWidth = 6; ctx.beginPath(); for (let s = 0; s <= 40 * pr; s++) { const u = s / 40, xx = xa + (xb - xa) * u, yy = y - Math.sin(u * Math.PI) * hh; s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore(); if (pr > 0.95) chalk((h.to - h.from) + ' 分', mid, y - hh - 26, 34, i ? CH_O : CH_B); });
  if (k >= X.steps.length - 1) chalk('共 ' + span + ' 分钟', A.x + A.w / 2, A.y + 50, 46, CH_Y);
};
// 圆形分数
function drawPie(cx, cy, r, n, shadeList) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fill(); for (let i = 0; i < n; i++) { const c = shadeList[i]; if (c) wedge(cx, cy, r, -1.5708 + i / n * 6.2832, -1.5708 + (i + 1) / n * 6.2832, c); } ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.stroke(); for (let i = 0; i < n; i++) { const a = -1.5708 + i / n * 6.2832; cline(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, CH_W, 3); } ctx.restore(); }
VIZ.pie = (X, k, t, A) => {
  const p = X.p, cy = A.y + A.h / 2 - 10;
  if (p.mode === 'cmp') { p.f.forEach((f, j) => { const cx = A.x + A.w * (0.27 + 0.46 * j); const sh = []; const on = k >= j + 1 ? Math.min(f[0], Math.floor((k === j + 1 ? t * 5 : 99))) : 0; for (let i = 0; i < on; i++) sh[i] = j ? CH_O : CH_B; drawPie(cx, cy, 160, f[1], sh); chalk('{' + f[0] + '/' + f[1] + '}', cx, cy + 220, 44); }); if (k >= 3) chalk(X.answer, A.x + A.w / 2, cy, 90, CH_Y); return; }
  const cx = A.x + A.w / 2, sh = [];
  if (p.mode === 'show') { const on = k >= 1 ? p.k : 0; for (let i = 0; i < on; i++) sh[i] = CH_O; drawPie(cx, cy, 200, p.n, sh); if (k >= 0) chalk('平均分成 ' + p.n + ' 份', cx, A.y + 30, 32); if (k >= 1) chalk('涂了 ' + p.k + ' 份', cx, A.y + A.h - 40, 34, CH_O); if (k >= 2) chalk('{' + p.k + '/' + p.n + '}', cx + 290, cy, 60, CH_Y); return; }
  const na = k >= 1 ? Math.min(p.a, Math.floor(k === 1 ? t * 5 : 99)) : 0; for (let i = 0; i < na; i++) sh[i] = CH_B;
  if (k >= 2) { const nb = Math.min(p.b, Math.floor(k === 2 ? t * 5 : 99)); for (let i = 0; i < nb; i++) { if (p.mode === '+') sh[p.a + i] = CH_O; else sh[p.a - 1 - i] = 'rgba(255,154,184,0.25)'; } }
  drawPie(cx, cy, 200, p.n, sh); chalk('{' + p.a + '/' + p.n + '} ' + p.mode + ' {' + p.b + '/' + p.n + '}', cx, A.y + 30, 40);
  if (k >= 3) chalk('= ' + X.answer, cx + 300, cy, 56, CH_Y);
};
// 纸条通分 / 分数乘法
VIZ.fracbar = (X, k, t, A) => {
  const p = X.p, x0 = A.x + 60, W = A.w - 120;
  if (p.qty) { const y = A.y + 200, H = 90; crect(x0, y, W, H, 'rgba(255,255,255,0.06)', CH_W, 4); brace(x0, x0 + W, y - 12, true, p.qty + ' 千克', CH_W); const seg = W / p.b; for (let i = 1; i < p.b; i++) cline(x0 + i * seg, y, x0 + i * seg, y + H, CH_W, 3); if (k >= 1) for (let i = 0; i < p.b; i++) chalk(p.qty / p.b, x0 + i * seg + seg / 2, y + H / 2, 28, CH_B); if (k >= 2) { const n = Math.min(p.a, Math.floor(k === 2 ? t * 3 : 99)); for (let i = 0; i < n; i++) crect(x0 + i * seg + 3, y + 3, seg - 6, H - 6, 'rgba(255,179,107,0.55)'); brace(x0, x0 + p.a * seg, y + H + 12, false, '用去 ' + p.a + ' 份', CH_O); } if (k >= 3) chalk(p.qty + ' × {' + p.a + '/' + p.b + '} = ' + X.answer, A.x + A.w / 2, A.y + A.h - 40, 44, CH_Y); return; }
  const H = 70, ys = [A.y + 90, A.y + 220]; const cols = [CH_B, CH_O];
  p.f.forEach((f, j) => { const y = ys[j]; crect(x0, y, W, H, 'rgba(255,255,255,0.06)', CH_W, 4); const dn = k >= 1 ? p.L : f[1]; const num = k >= 1 ? f[0] * p.L / f[1] : f[0]; const seg = W / dn; for (let i = 0; i < num; i++) crect(x0 + i * seg + 2, y + 2, seg - 4, H - 4, hexA(cols[j], 0.6)); for (let i = 1; i < dn; i++) cline(x0 + i * seg, y, x0 + i * seg, y + H, i % (p.L / f[1]) === 0 || k < 1 ? CH_W : 'rgba(246,243,232,0.45)', i % (p.L / f[1]) === 0 || k < 1 ? 3 : 2); chalk(k >= 2 ? '{' + num + '/' + p.L + '}' : '{' + f[0] + '/' + f[1] + '}', x0 - 10, y + H / 2, 34, cols[j], 'right'); });
  if (k >= 3) { const y = A.y + 380, seg = W / p.L; const a = p.f[0][0] * p.L / p.f[0][1], b = p.f[1][0] * p.L / p.f[1][1]; crect(x0, y, W, H, 'rgba(255,255,255,0.06)', CH_Y, 4); const tot = p.op === '+' ? a + b : a - b; for (let i = 0; i < Math.min(p.L, tot); i++) crect(x0 + i * seg + 2, y + 2, seg - 4, H - 4, hexA(i < a ? CH_B : CH_O, 0.6)); if (tot > p.L) { for (let i = 0; i < tot - p.L; i++) crect(x0 + i * seg + 2, y + H + 14, seg - 4, H - 4, hexA(CH_O, 0.6)); } for (let i = 1; i < p.L; i++) cline(x0 + i * seg, y, x0 + i * seg, y + H, 'rgba(246,243,232,0.45)', 2); chalk('= ' + X.answer, A.x + A.w / 2, A.y + A.h - 30, 50, CH_Y); }
};
// 周长：小蚂蚁绕一圈
VIZ.perim = (X, k, t, A) => {
  const p = X.p, s = Math.min((A.w - 200) / p.w, (A.h - 200) / p.h), w = p.w * s, h = p.h * s, x0 = A.x + (A.w - w) / 2, y0 = A.y + (A.h - h) / 2 + 10;
  crect(x0, y0, w, h, 'rgba(143,216,255,0.12)', CH_W, 4);
  chalk(p.w + ' ' + p.u, x0 + w / 2, y0 - 30, 30, CH_Y); chalk(p.h + ' ' + p.u, x0 + w + 20, y0 + h / 2, 30, CH_Y, 'left'); chalk(p.w, x0 + w / 2, y0 + h + 34, 30, k >= 2 ? CH_Y : 'rgba(246,243,232,0.5)'); chalk(p.h, x0 - 20, y0 + h / 2, 30, k >= 2 ? CH_Y : 'rgba(246,243,232,0.5)', 'right');
  if (k >= 1) { cline(x0, y0, x0 + w, y0, CH_O, 9); cline(x0 + w, y0, x0 + w, y0 + h, CH_O, 9); }
  if (k >= 2) { cline(x0 + w, y0 + h, x0, y0 + h, CH_G, 9); cline(x0, y0 + h, x0, y0, CH_G, 9); }
  const L = 2 * (w + h), d = ((A.T * 0.35) % 1) * L; let ax, ay; if (d < w) { ax = x0 + d; ay = y0; } else if (d < w + h) { ax = x0 + w; ay = y0 + d - w; } else if (d < 2 * w + h) { ax = x0 + w - (d - w - h); ay = y0 + h; } else { ax = x0; ay = y0 + h - (d - 2 * w - h); }
  cdot(ax, ay, 14, '#3a2a1a'); cdot(ax + 8, ay - 6, 8, '#3a2a1a');
  if (k >= 3) chalk('周长 = ' + X.answer, A.x + A.w / 2, A.y + A.h - 10, 44, CH_Y);
};
// 面积：剪拼法
VIZ.area = (X, k, t, A) => {
  const p = X.p, cx = A.x + A.w / 2, base = A.y + A.h - 110;
  if (p.type === 'para') { const s = Math.min(26, (A.w - 300) / p.b, (A.h - 260) / p.h), w = p.b * s, h = p.h * s, sk = h * 0.6, x0 = cx - w / 2 - sk / 2; const mv = k >= 1 ? TU.e(k === 1 ? t / 1.4 : 1) : 0;
    ctx.save(); ctx.fillStyle = 'rgba(143,216,255,0.25)'; ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 + sk, base - h); ctx.lineTo(x0 + sk + w, base - h); ctx.lineTo(x0 + w, base); ctx.lineTo(x0 + sk, base); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(mv * w, 0); ctx.fillStyle = 'rgba(255,179,107,0.6)'; ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0 + sk, base - h); ctx.lineTo(x0 + sk, base); ctx.closePath(); ctx.fill(); ctx.strokeStyle = CH_O; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
    cline(x0 + sk, base - h, x0 + sk, base, CH_Y, 4, [10, 8]); chalk('底 ' + p.b, cx, base + 40, 30, CH_Y); chalk('高 ' + p.h, x0 + sk - 16, base - h / 2, 28, CH_Y, 'right');
    if (k >= 3) chalk(p.b + ' × ' + p.h + ' = ' + X.answer, cx, A.y + 40, 46, CH_Y); return; }
  const isTri = p.type === 'trih'; const top = isTri ? 0 : p.a, bot = p.b; const s = Math.min(isTri ? 24 : 40, (A.w - 200) / (2 * (top + bot) / (isTri ? 1 : 1) + 4), (A.h - 260) / p.h); const h = p.h * s, wb = bot * s, wt = top * s; const x0 = cx - (wb + wt) / 2 - 20;
  const shape = (ox, rot, fill) => { ctx.save(); ctx.translate(ox, 0); ctx.beginPath(); if (!rot) { ctx.moveTo(x0, base); ctx.lineTo(x0 + wb, base); ctx.lineTo(x0 + (isTri ? wb * 0.3 : wt + 10 * s * 0), base - h); if (!isTri) ctx.lineTo(x0, base - h); } else { ctx.moveTo(x0 + wb, base); ctx.lineTo(x0 + wb + (isTri ? wb * 0.3 : wt), base); ctx.lineTo(x0 + wb + (isTri ? wb : wt + wb), base - h); ctx.lineTo(x0 + (isTri ? wb * 0.3 : wt), base - h); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); };
  shape(0, false, 'rgba(143,216,255,0.35)');
  if (k >= 0) { const mv = k === 0 ? 0 : k === 1 ? 1 - TU.e(t / 1.4) : 0; ctx.save(); ctx.globalAlpha = k === 0 ? 0.5 + 0.3 * Math.sin(A.T * 4) : 1; shape(mv * 200, true, 'rgba(255,179,107,0.45)'); ctx.restore(); }
  chalk(isTri ? '底 ' + p.b : '下底 ' + p.b, x0 + wb / 2, base + 40, 28, CH_Y); chalk('高 ' + p.h, x0 - 16, base - h / 2, 28, CH_Y, 'right'); if (!isTri) chalk('上底 ' + p.a, x0 + wt / 2, base - h - 26, 28, CH_Y);
  if (k >= 3) chalk('÷ 2 = ' + X.answer, cx, A.y + 40, 46, CH_Y);
};
VIZ.grid = (X, k, t, A) => { const p = X.p, s = Math.min(60, (A.w - 120) / p.w, (A.h - 180) / p.h), x0 = A.x + (A.w - p.w * s) / 2, y0 = A.y + 90; const n = k <= 0 ? 0 : k === 1 ? Math.min(p.w * p.h, Math.floor(t * 12)) : p.w * p.h; for (let i = 0; i < n; i++) crect(x0 + (i % p.w) * s + 2, y0 + Math.floor(i / p.w) * s + 2, s - 4, s - 4, hexA(Math.floor(i / p.w) % 2 ? CH_B : CH_G, 0.55)); crect(x0, y0, p.w * s, p.h * s, null, CH_W, 4); if (k >= 2) chalk(p.w + ' × ' + p.h + ' = ' + X.answer, A.x + A.w / 2, A.y + A.h - 30, 46, CH_Y); };
// 长方体（小正方体堆叠）
VIZ.box = (X, k, t, A) => {
  const p = X.p, s = Math.min(34, (A.w - 120) / (p.a + p.b * 0.6), (A.h - 160) / (p.c + p.b * 0.5)), ox = A.x + A.w / 2 - (p.a * s + p.b * s * 0.6) / 2, oy = A.y + A.h - 80;
  const cube = (i, j, l, c) => { const x = ox + i * s + j * s * 0.6, y = oy - l * s - j * s * 0.5; ctx.save(); ctx.fillStyle = c; ctx.strokeStyle = 'rgba(20,40,30,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(x, y - s, s, s); ctx.fill(); ctx.stroke(); ctx.fillStyle = lighten(c, 0.25); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.6, y - s * 1.5); ctx.lineTo(x + s * 1.6, y - s * 1.5); ctx.lineTo(x + s, y - s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = lighten(c, -0.2); ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s * 1.6, y - s * 1.5); ctx.lineTo(x + s * 1.6, y - s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
  if (p.mode === 'v') { const layers = k <= 0 ? 1 : k === 1 ? 1 : k === 2 ? Math.min(p.c, 1 + Math.floor(t * 2)) : p.c; for (let l = 0; l < layers; l++) for (let j = p.b - 1; j >= 0; j--) for (let i = 0; i < p.a; i++) cube(i, j, l, l === 0 ? '#5fb0ff' : '#7fe08a'); chalk(k >= 1 ? '底层 ' + p.a + ' × ' + p.b + ' = ' + p.a * p.b : '', A.x + 20, A.y + 40, 30, CH_Y, 'left'); if (k >= 2) chalk('× ' + layers + ' 层', A.x + 20, A.y + 84, 30, CH_G, 'left'); if (k >= 3) chalk('体积 = ' + X.answer, A.x + A.w / 2, A.y + A.h - 20, 44, CH_Y); return; }
  // 表面积：用三种颜色标出成对的面
  const w = p.a * s, d = p.b * s, h = p.c * s, x = ox, y = oy; const face = (pts, c, on) => { ctx.save(); ctx.fillStyle = on ? c : 'rgba(255,255,255,0.08)'; ctx.strokeStyle = CH_W; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
  face([[x, y], [x + w, y], [x + w, y - h], [x, y - h]], 'rgba(255,179,107,0.6)', k >= 2); face([[x, y - h], [x + d * 0.6, y - h - d * 0.5], [x + w + d * 0.6, y - h - d * 0.5], [x + w, y - h]], 'rgba(143,216,255,0.6)', k >= 1); face([[x + w, y], [x + w + d * 0.6, y - d * 0.5], [x + w + d * 0.6, y - h - d * 0.5], [x + w, y - h]], 'rgba(166,245,160,0.6)', k >= 2);
  chalk('长 ' + p.a, x + w / 2, y + 34, 28, CH_Y); chalk('高 ' + p.c, x - 14, y - h / 2, 28, CH_Y, 'right'); chalk('宽 ' + p.b, x + w + d * 0.3 + 30, y - d * 0.25 + 10, 28, CH_Y, 'left'); if (k >= 3) chalk('表面积 = ' + X.answer, A.x + A.w / 2, A.y + 40, 44, CH_Y);
};
// 角
VIZ.angle = (X, k, t, A) => { const p = X.p, cx = A.x + A.w / 2, cy = A.y + A.h - 120, R = 300; const ang = d => -d / 180 * Math.PI; cline(cx, cy, cx + R, cy, CH_W, 5); cline(cx, cy, cx + Math.cos(ang(p.T)) * R, cy + Math.sin(ang(p.T)) * R, CH_W, 5); ctx.save(); ctx.strokeStyle = 'rgba(246,243,232,0.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R * 0.95, ang(p.T), 0); ctx.stroke(); ctx.restore(); if (k >= 1) { const a = p.a * (k === 1 ? TU.e(t) : 1); cline(cx, cy, cx + Math.cos(ang(a)) * R, cy + Math.sin(ang(a)) * R, CH_B, 6); wedge(cx, cy, 90, ang(a), 0, 'rgba(143,216,255,0.4)'); chalk(p.a + '°', cx + Math.cos(ang(a / 2)) * 130, cy + Math.sin(ang(a / 2)) * 130, 32, CH_B); } if (k >= 2) { wedge(cx, cy, 120, ang(p.T), ang(p.a), 'rgba(255,179,107,0.45)'); chalk(X.answer + '°', cx + Math.cos(ang((p.T + p.a) / 2)) * 170, cy + Math.sin(ang((p.T + p.a) / 2)) * 170, 40, CH_Y); } chalk(p.T + '°', cx - 40, A.y + 40, 34, CH_W); };
// 平均数：移多补少
VIZ.avg = (X, k, t, A) => { const p = X.p, n = p.arr.length, mx = Math.max(...p.arr) * 1.15, bw = Math.min(110, (A.w - 100) / n - 20), base = A.y + A.h - 70, H = A.h - 170; const lv = k >= 1 ? TU.e(k === 1 ? t / 2 : 1) : 0; p.arr.forEach((v, i) => { const x = A.x + 60 + i * (bw + 20), hv = (v + (p.av - v) * lv) / mx * H; crect(x, base - hv, bw, hv, hexA([CH_B, CH_O, CH_G, CH_P, CH_Y, CH_W][i % 6], 0.6), CH_W, 3); chalk(k >= 1 && lv > 0.95 ? p.av : v, x + bw / 2, base - hv - 24, 30); }); if (k >= 1) { const y = base - p.av / mx * H; cline(A.x + 40, y, A.x + A.w - 40, y, CH_Y, 4, [14, 10]); } if (k >= 3) chalk('平均数 = ' + p.av, A.x + A.w / 2, A.y + 40, 44, CH_Y); };
// 天平：解方程
VIZ.balance = (X, k, t, A) => {
  const p = X.p, cx = A.x + A.w / 2, py = A.y + 150; const bStep = p.b ? 1 : -1, aStep = p.a > 1 ? (p.b ? 2 : 1) : -1;
  const tilt = Math.sin(A.T * 2) * 0.012; ctx.save(); ctx.translate(cx, py); ctx.rotate(tilt); cline(-300, 0, 300, 0, '#d9b36a', 10); ctx.restore(); crect(cx - 10, py, 20, 300, '#b68c4a'); crect(cx - 90, py + 300, 180, 20, '#b68c4a');
  const pan = (x) => { cline(x, py, x - 90, py + 150, CH_W, 2); cline(x, py, x + 90, py + 150, CH_W, 2); ctx.save(); ctx.fillStyle = 'rgba(246,243,232,0.2)'; ctx.beginPath(); ctx.ellipse(x, py + 155, 120, 22, 0, 0, 6.3); ctx.fill(); ctx.restore(); };
  pan(cx - 300); pan(cx + 300);
  const xbox = (x, y, s, label) => { rrect(x - s / 2, y - s, s, s, 10, '#5fb0ff', '#fff', 3); text(label, x, y - s / 2, s * 0.45, '#fff', 'center', '900'); };
  const wt = (x, y, v, a) => { ctx.save(); ctx.globalAlpha *= a; rrect(x - 50, y - 60, 100, 60, 12, '#ffb36b', '#fff', 3); text(String(v), x, y - 30, 30, '#3a1d00', 'center', '900'); ctx.restore(); };
  const afterB = bStep > 0 && k >= bStep, afterA = aStep > 0 && k >= aStep;
  const nx = afterA ? 1 : p.a; const sz = Math.min(64, 220 / nx);
  for (let i = 0; i < nx; i++) xbox(cx - 300 - (nx - 1) * sz * 0.55 + i * sz * 1.1 - (p.b && !afterB ? 60 : 0), py + 150, sz, 'x');
  if (p.b) { const fly = afterB ? (k === bStep ? TU.e(t) : 1) : 0; if (fly < 1) { wt(cx - 300 + 90 + fly * 0, py + 150 - fly * 160, (p.op === '+' ? '' : '−') + p.b, 1 - fly); } }
  const right = afterA ? p.x : afterB ? p.mid : p.c; wt(cx + 300, py + 150, right, 1);
  if (afterB && k === bStep) chalk((p.op === '+' ? '两边都 − ' : '两边都 + ') + p.b, cx, py - 50, 36, CH_O);
  if (afterA && k === aStep) chalk('两边都 ÷ ' + p.a, cx, py - 50, 36, CH_B);
  const eq = afterA ? 'x = ' + p.x : afterB ? (p.a > 1 ? p.a : '') + 'x = ' + p.mid : (p.a > 1 ? p.a : '') + 'x' + (p.b ? ' ' + p.op + ' ' + p.b : '') + ' = ' + p.c;
  chalk(eq, cx, A.y + A.h - 30, 50, afterA ? CH_Y : CH_W);
};
// 比的分配
VIZ.ratio = (X, k, t, A) => { const p = X.p, n = p.a + p.b, u = Math.min(90, (A.w - 200) / Math.max(p.a, p.b) ), x0 = A.x + 140; const row = (y, m, c, name) => { chalk(name, x0 - 30, y + 30, 32, c, 'right'); for (let i = 0; i < m; i++) { crect(x0 + i * u + 2, y, u - 4, 60, hexA(c, k >= 0 ? 0.55 : 0.2), CH_W, 3); if (k >= 2) chalk(p.T / n, x0 + i * u + u / 2, y + 30, Math.min(28, u * 0.4), CH_W); } }; row(A.y + 120, p.a, CH_B, '甲'); row(A.y + 240, p.b, CH_O, '乙'); if (k >= 1) chalk('共 ' + n + ' 份 = ' + p.T + ' 个', A.x + A.w / 2, A.y + 60, 36, CH_Y); if (k >= 3) { const m = p.who === '甲' ? p.a : p.b, y = p.who === '甲' ? A.y + 120 : A.y + 240; glowBox(x0 - 4, y - 4, m * u + 8, 68, CH_Y, A.T); chalk(p.who + ' = ' + X.answer + ' 个', A.x + A.w / 2, A.y + A.h - 40, 46, CH_Y); } };
// 百分数：百格图
VIZ.percent = (X, k, t, A) => { const p = X.p, s = Math.min(42, (A.h - 120) / 10), x0 = A.x + 60, y0 = A.y + 60; const n = k >= 1 ? Math.min(p.p, Math.floor(k === 1 ? t * 40 : 999)) : 0; for (let i = 0; i < 100; i++) crect(x0 + (i % 10) * s + 2, y0 + Math.floor(i / 10) * s + 2, s - 4, s - 4, i < n ? hexA(CH_O, 0.7) : 'rgba(255,255,255,0.08)'); crect(x0, y0, s * 10, s * 10, null, CH_W, 3); const rx = x0 + s * 10 + 50; chalk('整体 ' + p.T, rx, y0 + 40, 34, CH_W, 'left'); if (k >= 1) chalk(p.p + '% = ' + p.p + ' 格', rx, y0 + 110, 34, CH_O, 'left'); if (k >= 2) chalk('1 格 = ' + p.T / 100, rx, y0 + 180, 34, CH_B, 'left'); if (k >= 3) chalk('= ' + X.answer, rx, y0 + 270, 54, CH_Y, 'left'); };
// 圆
VIZ.circle = (X, k, t, A) => {
  const p = X.p, R = Math.min(170, A.h * 0.3), cx = A.x + 230, cy = A.y + A.h / 2;
  if (p.mode === 'ring') { ctx.save(); ctx.fillStyle = 'rgba(143,216,255,0.45)'; ctx.beginPath(); ctx.arc(cx + 120, cy, R * 1.2, 0, 6.3); ctx.fill(); ctx.restore(); const r2 = R * 1.2 * p.r2 / p.r; if (k >= 2) { ctx.save(); ctx.fillStyle = '#1f3b33'; ctx.beginPath(); ctx.arc(cx + 120, cy, r2 * (k === 2 ? TU.e(t) : 1), 0, 6.3); ctx.fill(); ctx.restore(); } ctx.save(); ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx + 120, cy, R * 1.2, 0, 6.3); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + 120, cy, r2, 0, 6.3); ctx.stroke(); ctx.restore(); cline(cx + 120, cy, cx + 120 + R * 1.2, cy, CH_Y, 4); chalk('R=' + p.r, cx + 120 + R * 0.6, cy - 22, 28, CH_Y); cline(cx + 120, cy, cx + 120, cy - r2, CH_O, 4); chalk('r=' + p.r2, cx + 140, cy - r2 / 2, 28, CH_O, 'left'); if (k >= 3) chalk('圆环 = ' + X.answer, A.x + A.w - 220, A.y + 60, 40, CH_Y); return; }
  const n = 16, sw = Math.PI * R / (n / 2);
  ctx.save(); ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.stroke(); ctx.restore();
  const ra = (A.T * 0.8) % 6.2832; if (k <= 0) { cline(cx, cy, cx + Math.cos(ra) * R, cy + Math.sin(ra) * R, CH_Y, 5); chalk(p.show === 'd' ? 'd = ' + p.r * 2 : 'r = ' + p.r, cx, cy + R + 44, 32, CH_Y); }
  if (p.mode === 'perim') { if (k >= 1) { const u = TU.e(k === 1 ? t / 2 : 1); const bx = A.x + 60, by = A.y + A.h - 60; cline(bx, by, bx + 2 * Math.PI * R * 0.5 * u * 1.4, by, CH_O, 8); chalk('滚一圈 = 周长', bx + 200, by + 40, 30, CH_O); } if (k >= 2) chalk('C = ' + X.answer, A.x + A.w - 200, A.y + 60, 44, CH_Y); return; }
  for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832; wedge(cx, cy, R, a0, a1, hexA(i % 2 ? CH_B : CH_O, 0.5)); }
  if (k >= 1) { const u = TU.e(k === 1 ? t / 1.8 : 1), sx = A.x + 470, sy = cy + 40; for (let i = 0; i < n; i++) { const up = i % 2 === 0, x = sx + Math.floor(i / 2) * sw * 0.98 + (up ? 0 : sw / 2) * 0.98, mid = up ? -Math.PI / 2 : Math.PI / 2; const ccx = lerp(cx, x + sw / 2, u), ccy = lerp(cy, up ? sy : sy - R, u); ctx.save(); ctx.globalAlpha = u; wedge(ccx, ccy, R, mid - Math.PI / n, mid + Math.PI / n, hexA(i % 2 ? CH_B : CH_O, 0.65)); ctx.restore(); } if (u > 0.9) { chalk('πr', sx + sw * 4, sy + 34, 30, CH_Y); chalk('r', sx - 20, sy - R / 2, 30, CH_Y, 'right'); } }
  if (k >= 2) chalk('S = πr²', A.x + A.w - 200, A.y + 60, 44, CH_G);
  if (k >= 3) chalk('S = ' + X.answer, A.x + A.w - 200, A.y + 120, 44, CH_Y);
};
// 圆柱圆锥
VIZ.cyl = (X, k, t, A) => {
  const p = X.p, r = 90, h = Math.min(280, 40 * p.h / Math.max(1, p.r) + 120), cx = A.x + 180, by = A.y + A.h - 90;
  const drawCyl = (x, frac, alpha) => { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = 'rgba(143,216,255,0.25)'; ctx.fillRect(x - r, by - h, 2 * r, h); if (frac) { ctx.fillStyle = 'rgba(255,210,120,0.6)'; ctx.fillRect(x - r, by - h * frac, 2 * r, h * frac); } ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, by - h, r, 26, 0, 0, 6.3); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, by, r, 26, 0, 0, Math.PI); ctx.stroke(); cline(x - r, by - h, x - r, by); cline(x + r, by - h, x + r, by); ctx.restore(); };
  if (p.mode === 'side') { drawCyl(cx, 0, 1); if (k >= 1) { const u = TU.e(k === 1 ? t / 1.6 : 1), W = 2 * Math.PI * r * 0.9 * u; crect(cx + r + 60, by - h, W, h, 'rgba(255,179,107,0.45)', CH_O, 4); if (k >= 2) { chalk('底面周长 2πr', cx + r + 60 + W / 2, by + 36, 30, CH_Y); chalk('高 ' + p.h, cx + r + 50 + W, by - h / 2, 28, CH_Y, 'left'); } } if (k >= 3) chalk('侧面积 = ' + X.answer, A.x + A.w / 2 + 120, A.y + 40, 42, CH_Y); return; }
  if (p.mode === 'v') { const layers = k >= 2 ? (k === 2 ? TU.e(t / 1.6) : 1) : 0.08; drawCyl(cx + 120, layers, 1); for (let i = 0; i < 8 * layers; i++) cline(cx + 120 - r, by - h * i / 8, cx + 120 + r, by - h * i / 8, 'rgba(255,255,255,0.35)', 2); if (k >= 1) chalk('底面积 = ' + (Math.round(314 * p.r * p.r) / 100), A.x + A.w - 260, A.y + 80, 34, CH_B); if (k >= 2) chalk('V = ' + X.answer, A.x + A.w - 260, A.y + 150, 44, CH_Y); return; }
  // 圆锥：倒 3 次沙
  const fills = k <= 0 ? 0 : k === 1 ? Math.min(3, Math.floor(t * 1.2) + 1) : 3; drawCyl(cx + 300, fills / 3, 1);
  ctx.save(); ctx.fillStyle = 'rgba(255,210,120,0.6)'; ctx.strokeStyle = CH_W; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - r, by); ctx.lineTo(cx, by - h); ctx.lineTo(cx + r, by); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  chalk('倒了 ' + fills + ' 次', cx + 300, by + 50, 30, CH_O); if (k >= 1) chalk('V锥 = {1/3} V柱', A.x + A.w - 220, A.y + 70, 36, CH_G); if (k >= 3) chalk('V = ' + X.answer, A.x + A.w - 220, A.y + 140, 44, CH_Y);
};
// 鸡兔同笼
VIZ.chick = (X, k, t, A) => {
  const p = X.p, n = p.H, cols = Math.min(n, 10), rows = Math.ceil(n / cols), s = Math.min(64, (A.w - 60) / cols, (A.h - 210) / rows);
  const conv = k >= 3 ? (k === 3 ? Math.min(p.rab, Math.floor(t * 4)) : p.rab) : 0;
  for (let i = 0; i < n; i++) { const x = A.x + 40 + (i % cols) * s + s / 2, y = A.y + 130 + Math.floor(i / cols) * s * 1.05 + s * 0.6; const rab = i < conv; if (rab) iconRabbit(x, y, s * 0.9); else iconChick(x, y, s * 0.9); if (k >= 1) { const legs = rab ? 4 : 2; for (let l = 0; l < legs; l++) cline(x - s * 0.16 + l * (s * 0.32 / Math.max(1, legs - 1)), y + s * 0.3, x - s * 0.16 + l * (s * 0.32 / Math.max(1, legs - 1)), y + s * 0.48, rab ? CH_P : CH_O, 3); } }
  chalk(n + ' 个头', A.x + 40, A.y + 50, 32, CH_W, 'left');
  const legsNow = 2 * n + 2 * conv; if (k >= 1) chalk('腿：' + legsNow + ' 条', A.x + A.w - 40, A.y + 50, 32, k >= 3 && conv === p.rab ? CH_G : CH_O, 'right');
  if (k === 2) chalk('还差 ' + (p.L - 2 * n) + ' 条腿！', A.x + A.w / 2, A.y + A.h - 40, 40, CH_P);
  if (k >= 3) chalk('兔 ' + conv + ' 只　鸡 ' + (n - conv) + ' 只', A.x + A.w / 2, A.y + A.h - 40, 40, CH_Y);
};
// 线段图
VIZ.segment = (X, k, t, A) => {
  const p = X.p, x0 = A.x + 140, W = A.w - 240, y1 = A.y + 140, y2 = A.y + 280; const lab = p.labels || ['甲', '乙'];
  if (p.mode === 'sumdiff') { const u = W / p.big; const wb = p.big * u, ws = p.small * u; chalk('大数', x0 - 20, y1 + 6, 30, CH_B, 'right'); chalk('小数', x0 - 20, y2 + 6, 30, CH_O, 'right'); cline(x0, y1, x0 + wb, y1, CH_B, 10); cline(x0, y2, x0 + ws, y2, CH_O, 10); cline(x0 + ws, y1 - 20, x0 + ws, y2 + 20, 'rgba(246,243,232,0.5)', 2, [8, 8]); brace(x0 + ws, x0 + wb, y1 - 14, true, '差 ' + p.D, CH_P); if (k >= 1) { ctx.save(); ctx.strokeStyle = CH_Y; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + wb + 30, y1); ctx.quadraticCurveTo(x0 + wb + 70, (y1 + y2) / 2, x0 + wb + 30, y2); ctx.stroke(); ctx.restore(); chalk('和 ' + p.S, x0 + wb + 80, (y1 + y2) / 2, 32, CH_Y, 'left'); } if (k >= 2) { const u2 = TU.e(k === 2 ? t : 1); if (p.ask === '大') cline(x0 + ws, y2, x0 + ws + (wb - ws) * u2, y2, CH_G, 10, [12, 8]); else { ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * (1 - u2); cline(x0 + ws, y1, x0 + wb, y1, CH_P, 12); ctx.restore(); } } if (k >= 3) chalk('较' + p.ask + '的数 = ' + X.answer, A.x + A.w / 2, A.y + A.h - 50, 44, CH_Y); return; }
  const kk = p.k, u = W / (kk + 1) * 0.95; chalk(lab[0], x0 - 20, y1 + 6, 30, CH_B, 'right'); chalk(lab[1], x0 - 20, y2 + 6, 30, CH_O, 'right');
  for (let i = 0; i < kk; i++) { crect(x0 + i * u + 2, y1 - 22, u - 4, 44, hexA(CH_B, 0.5), CH_W, 2); if (k >= 2) chalk(p.small, x0 + i * u + u / 2, y1, 24, CH_W); }
  crect(x0 + 2, y2 - 22, u - 4, 44, hexA(CH_O, 0.5), CH_W, 2); if (k >= 2) chalk(p.small, x0 + u / 2, y2, 24, CH_W);
  if (k >= 1) { if (p.mode === 'summul') { ctx.save(); ctx.strokeStyle = CH_Y; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + kk * u + 30, y1); ctx.quadraticCurveTo(x0 + kk * u + 70, (y1 + y2) / 2, x0 + kk * u + 30, y2); ctx.stroke(); ctx.restore(); chalk('和 ' + p.S + '（' + (kk + 1) + ' 份）', x0 + kk * u + 80, (y1 + y2) / 2, 30, CH_Y, 'left'); } else { brace(x0 + u, x0 + kk * u, y1 - 30, true, '多 ' + p.D + '（' + (kk - 1) + ' 份）', CH_P); cline(x0 + u, y1 - 22, x0 + u, y2 + 22, 'rgba(246,243,232,0.5)', 2, [8, 8]); } }
  if (k >= 2) glowBox(x0, y2 - 26, u, 52, CH_Y, A.T);
  if (k >= 3) chalk('答案：' + X.answer, A.x + A.w / 2, A.y + A.h - 50, 44, CH_Y);
};
// 行程
VIZ.trip = (X, k, t, A) => {
  const p = X.p, x0 = A.x + 60, x1 = A.x + A.w - 60, y = A.y + A.h / 2;
  const car = (x, yy, c, flip) => { ctx.save(); ctx.translate(x, yy); if (flip) ctx.scale(-1, 1); rrect(-40, -30, 80, 30, 10, c, '#fff', 2); rrect(-20, -50, 44, 24, 8, c, '#fff', 2); cdot(-22, 2, 10, '#333'); cdot(22, 2, 10, '#333'); ctx.restore(); };
  const loop = Math.min(1, ((A.T * 0.25) % 1.3));
  if (p.mode === 'meet') { cline(x0, y, x1, y, CH_W, 4); const tot = p.a + p.b, xm = x0 + (x1 - x0) * p.a / tot; const u = k >= 1 ? loop : 0; car(x0 + (xm - x0) * u, y - 6, '#5fb0ff', false); car(x1 - (x1 - xm) * u, y - 6, '#ff8a5a', true); chalk('甲 ' + p.a + ' 千米/时', x0, y + 50, 28, CH_B, 'left'); chalk('乙 ' + p.b + ' 千米/时', x1, y + 50, 28, CH_O, 'right'); brace(x0, x1, y + 80, false, '全程 ' + p.D + ' 千米', CH_W); if (k >= 0) chalk('每小时靠近 ' + tot + ' 千米', A.x + A.w / 2, A.y + 50, 34, CH_Y); if (k >= 2) chalk('相遇时间 = ' + X.answer + ' 小时', A.x + A.w / 2, A.y + 100, 40, CH_G); return; }
  if (p.mode === 'chase') { cline(x0, y, x1, y, CH_W, 4); const gap = (x1 - x0) * 0.35, u = k >= 1 ? loop : 0; car(x0 + gap + (x1 - x0 - gap - 80) * 0.6 * u, y - 6, '#ff8a5a', false); car(x0 + (x1 - x0 - 80) * 0.6 * u * (1 + gap / (x1 - x0) / 0.6) , y - 6, '#5fb0ff', false); chalk('乙（追）' + p.b, x0, y + 50, 28, CH_B, 'left'); chalk('甲 ' + p.a, x0 + gap, y + 50, 28, CH_O, 'left'); if (k < 1) brace(x0, x0 + gap, y - 70, true, '相差 ' + p.D, CH_P); chalk('每小时追近 ' + (p.b - p.a) + ' 千米', A.x + A.w / 2, A.y + 50, 34, CH_Y); if (k >= 2) chalk('追上时间 = ' + X.answer + ' 小时', A.x + A.w / 2, A.y + 100, 40, CH_G); return; }
  const bx0 = A.x + 260, bx1 = A.x + A.w - 200; crect(bx0, y, bx1 - bx0, 18, '#b68c4a'); for (let i = 0; i < 6; i++) crect(bx0 + 20 + i * (bx1 - bx0 - 40) / 5 - 6, y + 18, 12, 80, '#8a6a3a'); const TL = 200; const u = k >= 1 ? loop : 0; const head = bx0 + (bx1 - bx0 + TL) * u; ctx.save(); for (let i = 0; i < 4; i++) rrect(head - TL + i * 50, y - 44, 46, 40, 6, i === 3 ? '#ff8a5a' : '#5fb0ff', '#fff', 2); ctx.restore(); brace(bx0, bx1, y + 120, false, '桥长 ?', CH_Y); if (k >= 2) brace(bx0 - TL * 0.6, bx1, y - 70, true, '桥长 + 车长 = ' + p.v * p.t, CH_G); if (k >= 3) chalk('桥长 = ' + X.answer + ' 米', A.x + A.w / 2, A.y + 40, 40, CH_Y);
};
// 植树
VIZ.trees = (X, k, t, A) => { const p = X.p, n = p.L / p.d, x0 = A.x + 60, x1 = A.x + A.w - 60, y = A.y + A.h / 2 + 60, sp = (x1 - x0) / n; cline(x0, y, x1, y, CH_W, 5); for (let i = 0; i < n; i++) if (k >= 0) { chalk(p.d, x0 + i * sp + sp / 2, y + 36, 24, CH_B); } const shown = k >= 1 ? Math.min(n + 1, Math.floor(k === 1 ? t * 4 : 99)) : 0; for (let i = 0; i < shown; i++) { iconTree(x0 + i * sp, y, Math.min(90, sp * 1.2)); chalk(i + 1, x0 + i * sp, y - Math.min(90, sp * 1.2) - 18, 22, CH_Y); } chalk(n + ' 个间隔', A.x + A.w / 2, A.y + 50, 36, CH_B); if (k >= 2) chalk(n + ' + 1 = ' + (n + 1) + ' 棵', A.x + A.w / 2, A.y + A.h - 30, 44, CH_Y); };
// 抽屉原理
VIZ.pigeon = (X, k, t, A) => { const p = X.p, w = Math.min(150, (A.w - 40) / p.k - 16), y0 = A.y + A.h - 120; const put = k >= 1 ? Math.min(p.n, Math.floor(k === 1 ? t * 5 : 999)) : 0; const cnt = new Array(p.k).fill(0); for (let i = 0; i < put; i++) cnt[i % p.k]++; for (let j = 0; j < p.k; j++) { const x = A.x + 20 + j * (w + 16); crect(x, y0, w, 90, 'rgba(182,140,74,0.6)', CH_W, 3); for (let b = 0; b < cnt[j]; b++) crect(x + 12 + (b % 3) * (w - 24) / 3, y0 - 16 - Math.floor(b / 3) * 22, (w - 24) / 3 - 4, 18, [CH_B, CH_O, CH_G][b % 3]); chalk(cnt[j], x + w / 2, y0 + 50, 32, CH_W); if (k >= 3 && cnt[j] === Math.max(...cnt)) glowBox(x - 4, y0 - 4, w + 8, 98, CH_Y, A.T); } chalk(p.n + ' 本书，' + p.k + ' 个抽屉', A.x + A.w / 2, A.y + 40, 34); if (k >= 3) chalk('至少 ' + X.answer + ' 本', A.x + A.w / 2, A.y + 90, 44, CH_Y); };
// 握手 / 单循环
VIZ.handshake = (X, k, t, A) => { const p = X.p, n = p.n, cx = A.x + A.w / 2 - 80, cy = A.y + A.h / 2 + 10, R = Math.min(220, A.h * 0.38); const pts = Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832 - 1.57) * R, cy + Math.sin(i / n * 6.2832 - 1.57) * R]); const lines = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) lines.push([i, j]); const show = k <= 0 ? 0 : k === 1 ? Math.min(n - 1, Math.floor(t * 3)) : Math.min(lines.length, Math.floor((k === 2 ? t * 4 : 999))); for (let l = 0; l < show; l++) { const [i, j] = lines[l]; cline(pts[i][0], pts[i][1], pts[j][0], pts[j][1], [CH_B, CH_O, CH_G, CH_P, CH_Y][i % 5], 3); } pts.forEach((q, i) => { cdot(q[0], q[1], 22, '#fff'); text(String(i + 1), q[0], q[1], 22, '#24304f', 'center', '900'); }); chalk('连线 ' + show + ' 条', A.x + A.w - 160, A.y + 80, 36, CH_Y); if (k >= 2) chalk('= ' + X.answer, A.x + A.w - 160, A.y + 140, 48, CH_Y); };
// 排队
VIZ.queue = (X, k, t, A) => { const p = X.p, n = p.a + p.b + 1, s = Math.min(60, (A.w - 40) / n), y = A.y + A.h / 2 + 40; for (let i = 0; i < n; i++) { const me = i === p.a; iconPerson(A.x + 20 + i * s + s / 2, y, s * 1.4, me ? CH_Y : (i < p.a ? CH_B : CH_O)); } if (k >= 1) { brace(A.x + 20, A.x + 20 + p.a * s, y + 20, false, '前 ' + p.a, CH_B); brace(A.x + 20 + (p.a + 1) * s, A.x + 20 + n * s, y + 20, false, '后 ' + p.b, CH_O); } chalk('小亮', A.x + 20 + p.a * s + s / 2, y - s * 1.4 - 10, 26, CH_Y); if (k >= 2) { glowBox(A.x + 20 + p.a * s, y - s * 1.5, s, s * 1.5 + 6, CH_Y, A.T); chalk(p.a + ' + ' + p.b + ' + 1 = ' + X.answer, A.x + A.w / 2, A.y + 60, 46, CH_Y); } };
// 找规律
VIZ.pattern = (X, k, t, A) => { const p = X.p, arr = p.arr.concat([k >= 3 ? p.ans : '?']), n = arr.length, w = Math.min(120, (A.w - 40) / n - 12), y = A.y + 150; arr.forEach((v, i) => { const x = A.x + 20 + i * (w + 12); const last = i === n - 1; rrect(x, y, w, 80, 14, last ? (k >= 3 ? 'rgba(255,226,122,0.35)' : 'rgba(255,154,184,0.25)') : 'rgba(255,255,255,0.1)', last ? CH_Y : CH_W, 3); chalk(v, x + w / 2, y + 40, Math.min(40, w * 0.4), last ? CH_Y : CH_W); if (k >= 1 && i > 0 && i < n - 1) { const d = p.arr[i] - p.arr[i - 1]; const xm = x - 6; ctx.save(); ctx.strokeStyle = CH_B; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(xm, y + 100, w / 2, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore(); chalk((d >= 0 ? '+' : '') + d, xm, y + 100 + w / 2 + 30, 28, CH_B); } }); };
// 通用：逐步板书
VIZ.steps = (X, k, t, A) => {
  const fig = X.p.fig; const tw = fig ? A.w - 400 : A.w - 60;
  if (fig) { rrect(A.x + A.w - 380, A.y + 20, 360, 320, 22, 'rgba(255,255,255,0.93)'); drawFig(fig, A.x + A.w - 200, A.y + 180, 330, 290); }
  let y = A.y + 50;
  for (let i = 0; i <= Math.min(k, X.steps.length - 1); i++) { const cur = i === k; ctx.save(); ctx.globalAlpha = cur ? TU.e(t * 2.5) : 0.55; const lines = mathWrap((i + 1) + '. ' + X.steps[i], A.x + 30 + (cur ? (1 - TU.e(t * 2.5)) * 30 : 0), y, tw, cur ? 34 : 28, cur ? 50 : 40, cur ? CH_Y : CH_W, '800'); ctx.restore(); y += (lines || 1) * (cur ? 50 : 40) + 16; if (y > A.y + A.h - 40) break; }
  // 小灯泡
  const bx = A.x + A.w - 70, by = A.y + A.h - 70; ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(A.T * 4); cdot(bx, by, 30, '#ffe27a'); ctx.restore(); crect(bx - 12, by + 26, 24, 16, '#bbb');
};
// ---------- 主绘制 ----------
function drawTutor() {
  const T = G.tutor; if (!T) return; const X = T.X; beginUI();
  const ap = TU.e(T.T * 3);
  ctx.save(); ctx.fillStyle = 'rgba(4,8,20,' + 0.78 * ap + ')'; ctx.fillRect(-400, -200, 2400, 1300); ctx.restore();
  // 黑板
  const B = { x: 400, y: 30, w: 1170, h: 720 };
  ctx.save(); ctx.globalAlpha = ap; ctx.translate(0, (1 - ap) * 40);
  rrect(B.x - 16, B.y - 16, B.w + 32, B.h + 32, 26, '#8a5a2e', '#5a3818', 4);
  const g = ctx.createLinearGradient(0, B.y, 0, B.y + B.h); g.addColorStop(0, '#24493d'); g.addColorStop(1, '#173328'); rrect(B.x, B.y, B.w, B.h, 16, g);
  // 粉笔灰纹理
  ctx.save(); ctx.globalAlpha = 0.05; for (let i = 0; i < 40; i++) { const x = B.x + hash(i, 3) * B.w, y = B.y + hash(i, 9) * B.h; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, 60 + hash(i, 1) * 120, 6 + hash(i, 2) * 10, hash(i, 5) * 3, 0, 6.3); ctx.fill(); } ctx.restore();
  // 标题 + 题目
  rrect(B.x + 20, B.y + 16, 300, 50, 25, 'rgba(255,226,122,0.2)', CH_Y, 2); text('星老师讲解 · ' + (T.q.kpName || ''), B.x + 170, B.y + 42, 24, CH_Y, 'center', '900');
  mathWrap('题目：' + T.q.q, B.x + 340, B.y + 30, B.w - 360, 24, 32, 'rgba(246,243,232,0.85)', '700');
  const A = { x: B.x + 20, y: B.y + 100, w: X.viz === 'steps' ? B.w - 40 : 760, h: B.h - 120, T: T.T };
  ctx.save(); ctx.beginPath(); ctx.rect(A.x - 10, A.y - 10, A.w + 20, A.h + 20); ctx.clip();
  try { (VIZ[X.viz] || VIZ.steps)(X, T.s, T.t, A); } catch (e) { console.warn('tutor viz', X.viz, e); }
  ctx.restore();
  // 右侧步骤清单
  if (X.viz !== 'steps') {
    const lx = B.x + 800, lw = B.w - 820; let y = B.y + 110;
    text('解题步骤', lx, y, 26, CH_Y, 'left', '900'); y += 44;
    for (let i = 0; i < X.steps.length; i++) {
      const cur = i === T.s, past = i < T.s; if (!past && !cur) { rrect(lx, y - 18, lw, 36, 12, 'rgba(255,255,255,0.05)'); text('第 ' + (i + 1) + ' 步', lx + 16, y, 20, 'rgba(246,243,232,0.35)', 'left', '700'); y += 48; continue; }
      ctx.save(); ctx.font = '700 22px ' + FONT; const lines = Math.max(1, Math.ceil(mathTextWidth(X.steps[i], 22, '700') / (lw - 50))); ctx.restore();
      const h = lines * 30 + 14; if (y + h > B.y + B.h - 10) break;
      rrect(lx, y - 20, lw, h, 12, cur ? 'rgba(255,226,122,0.18)' : 'rgba(255,255,255,0.06)', cur ? CH_Y : null, 2);
      cdot(lx + 20, y - 2, 13, cur ? CH_Y : CH_G); text(String(i + 1), lx + 20, y - 1, 16, '#173328', 'center', '900');
      mathWrap(X.steps[i], lx + 42, y - 3, lw - 52, 22, 30, cur ? '#fff' : 'rgba(246,243,232,0.7)', '700');
      y += h + 10;
    }
  }
  ctx.restore();
  // 老师立绘
  const im = IMG.teacher; const sl = TU.e(T.T * 2.2);
  if (im) { const h = 700, w = im.width * h / im.height, bob = Math.sin(T.T * 2) * 5, talk = T.t < 2 ? Math.abs(Math.sin(T.t * 14)) * 3 : 0; ctx.save(); ctx.globalAlpha = sl; ctx.drawImage(scaled('teacher', w, h) || im, -110 - (1 - sl) * 300, 900 - h + 20 + bob - talk, w, h); ctx.restore(); }
  // 对话气泡
  const bx = 330, by = 768, bw = 1250, bh = 118; ctx.save(); ctx.globalAlpha = sl;
  rrect(bx, by, bw, bh, 28, 'rgba(255,253,245,0.97)', '#ffcf5a', 4);
  ctx.fillStyle = 'rgba(255,253,245,0.97)'; ctx.beginPath(); ctx.moveTo(bx + 10, by + 40); ctx.lineTo(bx - 40, by + 70); ctx.lineTo(bx + 10, by + 76); ctx.fill();
  const st = X.steps[T.s] || ''; const fade = TU.e(T.t * 3);
  ctx.save(); ctx.globalAlpha *= fade; mathWrap(st, bx + 36, by + 42, bw - 300, st.length > 46 ? 28 : 32, 40, '#24304f', '800'); ctx.restore();
  text('第 ' + (T.s + 1) + '/' + X.steps.length + ' 步', bx + bw - 30, by + 34, 22, '#8a6a2a', 'right', '800');
  const last = T.s >= X.steps.length - 1;
  text(last ? 'Z 明白了！　R 重播' : 'Z 下一步　← 上一步　R 重播　X 跳过', bx + bw - 30, by + 88, 20, '#8a6a2a', 'right', '700');
  // 自动前进进度条
  if (!last) { rrect(bx + 36, by + bh - 14, bw - 72, 6, 3, 'rgba(0,0,0,0.08)'); rrect(bx + 36, by + bh - 14, (bw - 72) * clamp(T.t / TUTOR_STEP_T, 0, 1), 6, 3, '#ffcf5a'); }
  ctx.restore();
}
