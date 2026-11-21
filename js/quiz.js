'use strict';
// ================== 数学答题系统（贯穿战斗、捕获、进化、地图谜题） ==================
// opts: { title, sub, count, need, theme, forceComp, source, kp }
// cb(res): { correct(最后一题), ok, n, pass, fast, comp, list }
function startQuiz(opts, cb) {
  opts = Object.assign({ count: 1, need: 1, title: '数学挑战' }, opts);
  G.quiz = { opts, cb, i: 0, list: [], phase: 'intro', t: 0, sel: 0, removed: new Set(), ok: 0, q: null, elapsed: 0, hover: -1 };
  if (opts.count === 1) quizNextQ(); else AudioSys.sfx('powerup');
  G.held = [];
}
function quizNextQ() {
  const Z = G.quiz;
  G.recentBank = G.recentBank || [];
  const q = MathQ.next({ grade: G.grade, comp: G.comp, stats: G.mstats, theme: Z.opts.theme, forceComp: Z.opts.forceComp, recentBank: G.recentBank, kp: Z.opts.kp });
  if (q.bank) { G.recentBank.push(q.bank); if (G.recentBank.length > 40) G.recentBank.shift(); }
  Z.q = q; Z.phase = 'ask'; Z.t = 0; Z.elapsed = 0; Z.sel = 0; Z.removed = new Set(); Z.limit = MathQ.timeLimit(q); Z.chosen = -1;
  AudioSys.sfx(q.comp ? 'gold' : 'select');
}
function recordAnswer(q, ok, fast) {
  G.totalQ = (G.totalQ || 0) + 1;
  const s = G.mstats[q.kp] || (G.mstats[q.kp] = { n: 0, ok: 0 }); s.n++;
  let gain = 0;
  if (ok) {
    s.ok++; G.totalOK = (G.totalOK || 0) + 1; G.streak++; G.bestStreak = Math.max(G.bestStreak || 0, G.streak);
    gain = (q.comp ? 3 : 1) + (fast ? 1 : 0);
    if (G.streak % 5 === 0) { gain += 2; G.doubleExp = 3; AudioSys.sfx('combo'); setTimeout(() => toast('连对 ' + G.streak + ' 题！奖励 ★2，接下来 3 场战斗经验翻倍！'), 300); }
    if (G.streak % 10 === 0) G.pendingWheel = true;
    AudioSys.sfx('correct');
  } else {
    G.streak = 0;
    const key = q.q + '|' + q.answer;
    const w = G.wrongBook.find(x => x.key === key);
    if (w) { w.count++; w.t = Date.now(); w.fixed = false; }
    else { G.wrongBook.unshift({ key, q: q.q, choices: q.choices, answer: q.answer, exp: q.exp, kp: q.kp, kpName: q.kpName, fig: q.fig, grade: q.grade, comp: q.comp, count: 1, t: Date.now() }); if (G.wrongBook.length > 120) G.wrongBook.pop(); }
    AudioSys.sfx('wrong');
  }
  if (gain) addStars(gain, true);
  return gain;
}
function addStars(n, silent) { G.stars += n; G.starPop = { n, t: 0 }; if (!silent) AudioSys.sfx('star'); }
function quizAnswer(i) {
  const Z = G.quiz; if (!Z || Z.phase !== 'ask' || Z.removed.has(i)) return;
  const q = Z.q, ok = i === q.ans, fast = Z.elapsed < Z.limit * 0.4;
  Z.chosen = i; Z.phase = 'fb'; Z.t = 0; Z.fbOk = ok; Z.fast = ok && fast;
  Z.gain = recordAnswer(q, ok, Z.fast);
  if (ok) Z.ok++;
  Z.list.push({ q, ok, fast: Z.fast });
  // 错题本里的同一道题答对后标记为已掌握
  if (ok) { const w = G.wrongBook.find(x => x.key === q.q + '|' + q.answer); if (w) w.fixed = true; }
}
function quizContinue() {
  const Z = G.quiz;
  if (Z.phase === 'intro') { quizNextQ(); return; }
  if (Z.phase === 'fb') {
    if (Z.t < 0.35) return;
    Z.i++;
    if (Z.i < Z.opts.count) { quizNextQ(); return; }
    if (Z.opts.count > 1) { Z.phase = 'sum'; Z.t = 0; AudioSys.sfx(Z.ok >= Z.opts.need ? 'victory_short' : 'statdown'); return; }
    return quizFinish();
  }
  if (Z.phase === 'sum' && Z.t > 0.4) quizFinish();
}
function quizFinish() {
  const Z = G.quiz; G.quiz = null;
  const last = Z.list[Z.list.length - 1] || {};
  const res = { correct: !!last.ok, ok: Z.ok, n: Z.opts.count, pass: Z.ok >= Z.opts.need, fast: !!last.fast, comp: !!(last.q && last.q.comp), list: Z.list };
  if (Z.cb) Z.cb(res);
}
function useHint() {
  const Z = G.quiz; if (!Z || Z.phase !== 'ask' || Z.removed.size) return;
  if ((G.bag.hintcard || 0) <= 0) { toast('没有提示卡了（可以在商店用星星购买）'); return; }
  G.bag.hintcard--;
  const wrong = [0, 1, 2, 3].filter(i => i !== Z.q.ans); wrong.sort(() => Math.random() - 0.5);
  Z.removed.add(wrong[0]); Z.removed.add(wrong[1]);
  if (Z.removed.has(Z.sel)) Z.sel = Z.q.ans;
  AudioSys.sfx('powerup'); toast('提示卡：去掉了两个错误选项！');
}
function quizInput(k) {
  const Z = G.quiz; if (!Z) return;
  if (Z.phase !== 'ask') { if (k === 'ok' || k === 'cancel') quizContinue(); return; }
  if (['1', '2', '3', '4'].includes(k)) { quizAnswer(+k - 1); return; }
  if (k === 'hint') { useHint(); return; }
  const r = Math.floor(Z.sel / 2), c = Z.sel % 2; let n = Z.sel;
  if (k === 'up') n = c; if (k === 'down') n = 2 + c; if (k === 'left') n = r * 2; if (k === 'right') n = r * 2 + 1;
  if (n !== Z.sel && !Z.removed.has(n)) { Z.sel = n; AudioSys.sfx('select'); }
  if (k === 'ok') quizAnswer(Z.sel);
}
const QUIZ_BOX = { x: 150, y: 60, w: 1300, h: 790 };
function quizChoiceRect(i) { return { x: 190 + (i % 2) * 620, y: 590 + Math.floor(i / 2) * 118, w: 600, h: 100 }; }
function quizPointer(ux, uy, click) {
  const Z = G.quiz; if (!Z) return false;
  if (Z.phase === 'ask') {
    Z.hover = -1;
    for (let i = 0; i < 4; i++) { const r = quizChoiceRect(i); if (ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h && !Z.removed.has(i)) { Z.hover = i; if (click) quizAnswer(i); else Z.sel = i; } }
    if (click && ux > 1180 && ux < 1420 && uy > 80 && uy < 130) useHint();
  } else if (click) quizContinue();
  return true;
}
function updateQuiz(dt) {
  const Z = G.quiz; if (!Z) return;
  Z.t += dt; if (Z.phase === 'ask') { const before = Z.elapsed; Z.elapsed += dt; if (Z.limit - Z.elapsed < 5 && Math.floor(before) !== Math.floor(Z.elapsed) && Z.elapsed < Z.limit) AudioSys.sfx('tick'); }
  if (Z.phase === 'fb' && Z.fbOk && Z.opts.count === 1 && Z.t > 1.7) quizContinue();
}
const SRC_COLOR = { battle: '#ff8a5a', catch: '#7ff0e2', evo: '#ffcf5a', gate: '#8ab4ff', gold: '#ffd23a', stele: '#b9a4ff', master: '#ff9ad0', chest: '#9affb8', duel: '#ff6a8a', review: '#9fe8ff' };
function drawQuiz() {
  const Z = G.quiz; if (!Z) return;
  beginUI();
  const appear = easeOut(Math.min(1, (Z.phase === 'intro' ? Z.t : 1) * 4));
  ctx.fillStyle = 'rgba(6,10,28,' + (0.55 * appear) + ')'; ctx.fillRect(-400, -200, 2400, 1300);
  const B = QUIZ_BOX, acc = (Z.q && Z.q.comp) ? '#ffd23a' : (SRC_COLOR[Z.opts.source] || '#7ff0e2');
  ctx.save(); ctx.translate(800, 450); ctx.scale(0.9 + 0.1 * appear, 0.9 + 0.1 * appear); ctx.translate(-800, -450); ctx.globalAlpha = appear;
  glass(B.x, B.y, B.w, B.h, 40, true, acc);
  // 标题栏
  const hg = ctx.createLinearGradient(B.x, 0, B.x + B.w, 0); hg.addColorStop(0, hexA(acc, 0.35)); hg.addColorStop(1, 'rgba(255,255,255,0.02)');
  rrect(B.x + 12, B.y + 12, B.w - 24, 84, 30, hg);
  text(Z.opts.title, B.x + 50, B.y + 54, 38, '#fff', 'left', '900', 'middle', true);
  if (Z.opts.count > 1) text('第 ' + Math.min(Z.i + 1, Z.opts.count) + ' / ' + Z.opts.count + ' 题　需答对 ' + Z.opts.need + ' 题', B.x + 50 + measure(Z.opts.title, 38, '900') + 30, B.y + 56, 26, '#dfe8ff', 'left', '700');
  text('★ ' + G.stars + '　连对 ' + G.streak, B.x + B.w - 330, B.y + 56, 26, '#ffd23a', 'right', '800');
  rrect(B.x + B.w - 310, B.y + 30, 270, 50, 25, (G.bag.hintcard || 0) > 0 ? 'rgba(255,210,80,0.22)' : 'rgba(255,255,255,0.06)', 'rgba(255,210,80,0.6)', 2);
  text('H 提示卡 ×' + (G.bag.hintcard || 0), B.x + B.w - 175, B.y + 56, 24, '#ffe9a0', 'center', '800');
  if (Z.phase === 'intro') {
    wrapText(Z.opts.sub || '', B.x + 80, B.y + 220, B.w - 160, 36, 56, '#f4f7ff', '700');
    text('共 ' + Z.opts.count + ' 题，答对 ' + Z.opts.need + ' 题即可通过', 800, B.y + 420, 40, '#ffd23a', 'center', '900');
    text('年级：' + G.grade + ' 年级' + (G.comp ? '　竞赛模式：开' : ''), 800, B.y + 490, 30, '#aab8dd', 'center', '700');
    text('按 Z / 回车 / 点击 开始', 800, B.y + 640 + Math.sin(NOW * 4) * 4, 34, '#7ff0e2', 'center', '800');
    ctx.restore(); return;
  }
  if (Z.phase === 'sum') { drawQuizSummary(Z, B); ctx.restore(); return; }
  const q = Z.q;
  // 知识点标签
  let tx = B.x + 50; const ty = B.y + 132;
  const tag = (s, c) => { ctx.font = '800 22px ' + FONT; const w = ctx.measureText(s).width + 32; rrect(tx, ty - 20, w, 40, 20, hexA(c, 0.25), hexA(c, 0.8), 2); text(s, tx + w / 2, ty, 22, '#fff', 'center', '800'); tx += w + 12; };
  if (q.comp) tag('★ 竞赛题', '#ffd23a');
  tag(q.grade + ' 年级', '#8ab4ff'); tag(q.kpName, '#7ff0e2');
  // 计时条
  const tl = clamp(1 - Z.elapsed / Z.limit, 0, 1), tw = 380, tX = B.x + B.w - tw - 50;
  if (Z.phase === 'ask') {
    rrect(tX, ty - 12, tw, 24, 12, 'rgba(255,255,255,0.12)');
    const fastZone = Z.elapsed < Z.limit * 0.4;
    rrect(tX, ty - 12, Math.max(24, tw * tl), 24, 12, fastZone ? '#7dfc9e' : tl > 0.2 ? '#ffd23a' : tl > 0 ? '#ff6a4a' : '#667');
    text(tl > 0 ? (fastZone ? '神速加成中 ' : '') + Math.ceil(Z.limit - Z.elapsed) + ' 秒' : '慢慢想，不着急', tX - 16, ty, 22, '#dfe8ff', 'right', '700');
  }
  // 题干 + 图形
  const hasFig = !!q.fig, qw = hasFig ? 780 : B.w - 120;
  const qs = q.q.length > 60 ? 36 : 42;
  mathWrap(q.q, B.x + 60, B.y + 220, qw, qs, qs * 1.45, '#ffffff', '800');
  if (hasFig) { rrect(B.x + B.w - 470, B.y + 170, 420, 360, 26, 'rgba(255,255,255,0.94)'); drawFig(q.fig, B.x + B.w - 260, B.y + 350, 380, 320); }
  // 选项
  for (let i = 0; i < 4; i++) {
    const r = quizChoiceRect(i), rem = Z.removed.has(i);
    const isSel = Z.phase === 'ask' && i === Z.sel, isAns = Z.phase === 'fb' && i === q.ans, isWrong = Z.phase === 'fb' && i === Z.chosen && !Z.fbOk;
    let fill = 'rgba(255,255,255,0.08)', stroke = 'rgba(255,255,255,0.3)';
    if (isSel) { fill = hexA(acc, 0.35); stroke = '#fff'; }
    if (isAns) { fill = 'rgba(80,220,130,0.55)'; stroke = '#b8ffd0'; }
    if (isWrong) { fill = 'rgba(255,80,80,0.5)'; stroke = '#ffb0b0'; }
    ctx.save(); ctx.globalAlpha *= rem ? 0.25 : 1;
    const bump = isSel ? Math.sin(NOW * 6) * 3 : 0;
    if (isSel || isAns) { ctx.shadowColor = isAns ? '#7dfc9e' : acc; ctx.shadowBlur = 26; }
    rrect(r.x - bump, r.y - bump, r.w + bump * 2, r.h + bump * 2, 26, fill); ctx.shadowBlur = 0;
    rrect(r.x - bump, r.y - bump, r.w + bump * 2, r.h + bump * 2, 26, null, stroke, isSel ? 4 : 2);
    ctx.fillStyle = isSel ? '#fff' : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(r.x + 50, r.y + r.h / 2, 28, 0, 6.28); ctx.fill();
    text(String(i + 1), r.x + 50, r.y + r.h / 2 + 1, 30, isSel ? '#1b2440' : '#fff', 'center', '900');
    const cs = q.choices[i].length > 14 ? 30 : 38;
    mathText(q.choices[i], r.x + 100, r.y + r.h / 2 + 2, cs, '#fff', 'left', '800');
    if (rem) { ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(r.x + 20, r.y + r.h / 2); ctx.lineTo(r.x + r.w - 20, r.y + r.h / 2); ctx.stroke(); }
    if (isAns) text('✔', r.x + r.w - 44, r.y + r.h / 2, 46, '#eaffef', 'center', '900');
    if (isWrong) text('✘', r.x + r.w - 44, r.y + r.h / 2, 46, '#fff', 'center', '900');
    ctx.restore();
  }
  if (Z.phase === 'ask') text('按 1~4 或 方向键+Z 作答，也可以用鼠标点击　｜　H：提示卡去掉两个错误选项', 800, B.y + B.h - 26, 22, '#aab8dd', 'center', '600');
  if (Z.phase === 'fb') drawQuizFeedback(Z, B, q);
  ctx.restore();
}
function measure(s, size, w) { ctx.font = (w || '700') + ' ' + size + 'px ' + FONT; return ctx.measureText(s).width; }
function drawQuizFeedback(Z, B, q) {
  const k = easeBack(Math.min(1, Z.t * 4));
  const y0 = Z.fbOk ? 490 : 465;
  ctx.save();
  ctx.translate(800, y0); ctx.scale(k, k);
  const h = Z.fbOk ? 150 : 230;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (Z.fbOk) { g.addColorStop(0, 'rgba(40,170,100,0.96)'); g.addColorStop(1, 'rgba(20,110,70,0.96)'); } else { g.addColorStop(0, 'rgba(200,70,70,0.97)'); g.addColorStop(1, 'rgba(120,30,50,0.97)'); }
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; rrect(-600, -h / 2, 1200, h, 32, g); ctx.shadowBlur = 0;
  rrect(-600, -h / 2, 1200, h, 32, null, 'rgba(255,255,255,0.7)', 3);
  if (Z.fbOk) {
    text('回答正确！' + (G.streak >= 2 ? '连对 ' + G.streak + ' 题！' : ''), -560, -28, 46, '#fff', 'left', '900', 'middle', true);
    text('+' + Z.gain + ' ★' + (Z.fast ? '　神速加成！' : '') + (q.comp ? '　竞赛题奖励 ×3' : ''), -560, 36, 30, '#ffe58a', 'left', '800');
    // 小解析
    ctx.font = '600 22px ' + FONT;
    mathWrap('解析：' + q.exp, 40, -30, 520, 22, 32, 'rgba(255,255,255,0.92)', '600');
  } else {
    text('答错了，没关系！', -560, -h / 2 + 46, 42, '#fff', 'left', '900', 'middle', true);
    mathText('正确答案：' + q.answer, 560, -h / 2 + 48, 34, '#ffe58a', 'right', '900');
    mathWrap('解析：' + q.exp, -560, -h / 2 + 116, 1120, 28, 42, '#fff', '700');
    text('已记录到错题本（Q 键查看）', 560, h / 2 - 24, 22, 'rgba(255,255,255,0.8)', 'right', '600');
  }
  ctx.restore();
  // 星星飞出
  if (Z.fbOk && Z.t < 1) for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + Z.t * 2, r = 120 + Z.t * 420; ctx.globalAlpha = 1 - Z.t; text('★', 800 + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.6, 40, '#ffd23a', 'center', '900'); }
  ctx.globalAlpha = 1;
  text(Z.fbOk && Z.opts.count === 1 ? '' : '按 Z / 回车 / 点击 继续', 800, B.y + B.h - 26, 24, '#dfe8ff', 'center', '700');
}
function drawQuizSummary(Z, B) {
  const pass = Z.ok >= Z.opts.need, k = easeBack(Math.min(1, Z.t * 3));
  ctx.save(); ctx.translate(800, 420); ctx.scale(k, k);
  text(pass ? '挑战成功！' : '挑战失败', 0, -130, 84, pass ? '#ffd23a' : '#ff8a8a', 'center', '900', 'middle', true);
  text('答对 ' + Z.ok + ' / ' + Z.opts.count + ' 题（需要 ' + Z.opts.need + ' 题）', 0, -30, 40, '#fff', 'center', '800');
  Z.list.forEach((r, i) => { const x = (i - (Z.list.length - 1) / 2) * 110; ctx.fillStyle = r.ok ? '#3fd07a' : '#e05a5a'; ctx.beginPath(); ctx.arc(x, 70, 40, 0, 6.28); ctx.fill(); text(r.ok ? '✔' : '✘', x, 72, 44, '#fff', 'center', '900'); });
  text(pass ? '' : '别灰心，复习一下错题本再来挑战吧！', 0, 170, 30, '#dfe8ff', 'center', '700');
  ctx.restore();
  text('按 Z / 回车 / 点击 继续', 800, B.y + B.h - 30, 26, '#7ff0e2', 'center', '800');
}
// ---------- 题目配图 ----------
function drawFig(f, cx, cy, w, h) {
  const ink = '#24304f', acc = '#ff7a3a', blue = '#3a8aff', fill = 'rgba(80,150,255,0.25)';
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lab = (s, x, y, size, c, al) => text(String(s), x, y, size || 24, c || ink, al || 'center', '800');
  const line = (x1, y1, x2, y2, c, lw, dash) => { ctx.strokeStyle = c || ink; ctx.lineWidth = lw || 4; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); };
  const poly = (pts, fc, sc) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fc) { ctx.fillStyle = fc; ctx.fill(); } ctx.strokeStyle = sc || ink; ctx.lineWidth = 4; ctx.stroke(); };
  const t = f.type;
  if (t === 'clock') {
    const r = Math.min(w, h) * 0.44;
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 8; ctx.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.28 - Math.PI / 2, big = i % 5 === 0; line(cx + Math.cos(a) * r * (big ? 0.84 : 0.9), cy + Math.sin(a) * r * (big ? 0.84 : 0.9), cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95, ink, big ? 4 : 2); }
    for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.28 - Math.PI / 2; lab(i, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7 + 2, r * 0.17); }
    const ha = ((f.h % 12) + f.m / 60) / 12 * 6.28 - Math.PI / 2, ma = f.m / 60 * 6.28 - Math.PI / 2;
    line(cx, cy, cx + Math.cos(ha) * r * 0.48, cy + Math.sin(ha) * r * 0.48, ink, 12);
    line(cx, cy, cx + Math.cos(ma) * r * 0.78, cy + Math.sin(ma) * r * 0.78, acc, 7);
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 6.28); ctx.fill();
  } else if (t === 'fan') {
    const n = f.n, ax = cx, ay = cy - h * 0.38, by = cy + h * 0.36, half = w * 0.42;
    for (let i = 0; i < n; i++) { const bx = cx - half + (2 * half) * i / (n - 1); line(ax, ay, f.rays ? ax + (bx - ax) * 1.0 : bx, f.rays ? ay + (by - ay) * 1.0 : by, i === 0 || i === n - 1 ? ink : blue, 4); if (f.rays) { ctx.fillStyle = ink; ctx.beginPath(); const a = Math.atan2(by - ay, bx - ax); ctx.moveTo(bx, by); ctx.lineTo(bx - 16 * Math.cos(a - 0.4), by - 16 * Math.sin(a - 0.4)); ctx.lineTo(bx - 16 * Math.cos(a + 0.4), by - 16 * Math.sin(a + 0.4)); ctx.fill(); } }
    if (!f.rays) line(cx - half, by, cx + half, by, ink, 4);
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 6.28); ctx.fill();
  } else if (t === 'fanray') {
    const ox = cx - w * 0.3, oy = cy + h * 0.25, L = w * 0.6, a = f.a * Math.PI / 180;
    ctx.fillStyle = 'rgba(255,122,58,0.25)'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, 70, -a, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = acc; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox, oy, 70, -a, 0); ctx.stroke();
    line(ox, oy, ox + L, oy, ink, 5); line(ox, oy, ox + Math.cos(a) * L * 0.85, oy - Math.sin(a) * L * 0.85, ink, 5);
    lab(f.a + '°', ox + Math.cos(a / 2) * 115, oy - Math.sin(a / 2) * 115, 30, acc);
  } else if (t === 'grid') {
    const cs = Math.min(w * 0.85 / f.c, h * 0.8 / f.r), x0 = cx - cs * f.c / 2, y0 = cy - cs * f.r / 2;
    ctx.fillStyle = 'rgba(80,150,255,0.12)'; ctx.fillRect(x0, y0, cs * f.c, cs * f.r);
    for (let i = 0; i <= f.r; i++) line(x0, y0 + i * cs, x0 + f.c * cs, y0 + i * cs, ink, 4);
    for (let j = 0; j <= f.c; j++) line(x0 + j * cs, y0, x0 + j * cs, y0 + f.r * cs, ink, 4);
  } else if (t === 'rect' || t === 'para' || t === 'trih' || t === 'trap') {
    const A = t === 'trap' ? Math.max(f.a, f.b) : (f.w || f.b), Hh = t === 'rect' ? f.h : f.h, k = Math.min(w * 0.72 / A, h * 0.62 / Hh), W2 = A * k, H2 = Hh * k, x0 = cx - W2 / 2, y0 = cy - H2 / 2 + 10;
    if (t === 'rect') { poly([[x0, y0], [x0 + W2, y0], [x0 + W2, y0 + H2], [x0, y0 + H2]], fill); lab(f.w + ' ' + (f.u || ''), cx, y0 + H2 + 30, 24); lab(f.h + ' ' + (f.u || ''), x0 + W2 + 14, cy + 10, 24, ink, 'left'); }
    if (t === 'para') { const sk = W2 * 0.22; poly([[x0 + sk, y0], [x0 + W2, y0], [x0 + W2 - sk, y0 + H2], [x0, y0 + H2]], fill); line(x0 + sk, y0, x0 + sk, y0 + H2, acc, 3, [10, 8]); lab('底 ' + f.b, cx - sk / 2, y0 + H2 + 30, 24); lab('高 ' + f.h, x0 + sk + 12, cy + 10, 24, acc, 'left'); }
    if (t === 'trih') { const px = x0 + W2 * 0.35; poly([[x0, y0 + H2], [x0 + W2, y0 + H2], [px, y0]], fill); line(px, y0, px, y0 + H2, acc, 3, [10, 8]); lab('底 ' + f.b, cx, y0 + H2 + 30, 24); lab('高 ' + f.h, px + 12, cy + 20, 24, acc, 'left'); }
    if (t === 'trap') { const ta = f.a * k, tb = f.b * k; const xb = cx - tb / 2, xa = cx - ta / 2 - tb * 0.08; poly([[xa, y0], [xa + ta, y0], [xb + tb, y0 + H2], [xb, y0 + H2]], fill); line(xa + 8, y0, xa + 8, y0 + H2, acc, 3, [10, 8]); lab('上底 ' + f.a, xa + ta / 2, y0 - 22, 24); lab('下底 ' + f.b, cx, y0 + H2 + 30, 24); lab('高 ' + f.h, xa + 20, cy + 10, 24, acc, 'left'); }
  } else if (t === 'pie') {
    const r = Math.min(w, h) * 0.4;
    for (let i = 0; i < f.n; i++) { const a0 = -Math.PI / 2 + i / f.n * 6.28, a1 = a0 + 6.28 / f.n; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fillStyle = i < f.k ? '#ff9a5a' : '#fffaf0'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.stroke(); }
  } else if (t === 'points') {
    const x0 = cx - w * 0.42, x1 = cx + w * 0.42; line(x0, cy, x1, cy, ink, 5);
    for (let i = 0; i < f.n; i++) { const x = x0 + (x1 - x0) * i / (f.n - 1); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, cy, 11, 0, 6.28); ctx.fill(); lab(String.fromCharCode(65 + i), x, cy - 36, 26); }
  } else if (t === 'box') {
    const sc = Math.min(w * 0.5 / (f.a + f.b * 0.5), h * 0.55 / (f.c + f.b * 0.5)), A = f.a * sc, C = f.c * sc, D = f.b * sc * 0.5;
    const x0 = cx - (A + D) / 2, y0 = cy - (C - D) / 2 + 10;
    poly([[x0, y0], [x0 + A, y0], [x0 + A, y0 + C], [x0, y0 + C]], 'rgba(80,150,255,0.3)');
    poly([[x0, y0], [x0 + D, y0 - D], [x0 + A + D, y0 - D], [x0 + A, y0]], 'rgba(80,150,255,0.18)');
    poly([[x0 + A, y0], [x0 + A + D, y0 - D], [x0 + A + D, y0 + C - D], [x0 + A, y0 + C]], 'rgba(80,150,255,0.42)');
    lab(f.a, x0 + A / 2, y0 + C + 28, 24); lab(f.c, x0 - 16, y0 + C / 2, 24, ink, 'right'); lab(f.b, x0 + A + D / 2 + 16, y0 + C - D / 2 + 10, 24, ink, 'left');
  } else if (t === 'circle' || t === 'ring') {
    const r = Math.min(w, h) * 0.4;
    if (t === 'ring') { ctx.fillStyle = 'rgba(80,150,255,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.arc(cx, cy, r * f.r / f.R, 0, 6.28, true); ctx.fill('evenodd'); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * f.r / f.R, 0, 6.28); ctx.stroke(); line(cx, cy, cx + r, cy, acc, 4); lab('R=' + f.R, cx + r * 0.62, cy - 22, 24, acc); line(cx, cy, cx, cy - r * f.r / f.R, blue, 4); lab('r=' + f.r, cx - 12, cy - r * f.r / f.R / 2, 24, blue, 'right'); }
    else { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.stroke(); if (f.show === 'd') { line(cx - r, cy, cx + r, cy, acc, 4); lab('d=' + f.r * 2, cx, cy - 22, 26, acc); } else { line(cx, cy, cx + r, cy, acc, 4); lab('r=' + f.r, cx + r / 2, cy - 22, 26, acc); } }
    ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 6.28); ctx.fill();
  } else if (t === 'cyl' || t === 'cone') {
    const rx = w * 0.26, ry = rx * 0.3, hh = h * 0.55, top = cy - hh / 2, bot = cy + hh / 2;
    ctx.fillStyle = 'rgba(80,150,255,0.25)';
    if (t === 'cyl') { ctx.fillRect(cx - rx, top, rx * 2, hh); ctx.beginPath(); ctx.ellipse(cx, bot, rx, ry, 0, 0, 6.28); ctx.fill(); line(cx - rx, top, cx - rx, bot); line(cx + rx, top, cx + rx, bot); ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, 0, 6.28); ctx.fillStyle = 'rgba(80,150,255,0.4)'; ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + rx, bot); ctx.lineTo(cx - rx, bot); ctx.closePath(); ctx.fill(); line(cx, top, cx - rx, bot); line(cx, top, cx + rx, bot); }
    ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, bot, rx, ry, 0, 0, Math.PI); ctx.stroke(); ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.ellipse(cx, bot, rx, ry, 0, Math.PI, 6.28); ctx.stroke(); ctx.setLineDash([]);
    line(cx, bot, cx + rx, bot, acc, 4); lab('r=' + f.r, cx + rx / 2, bot + 30, 24, acc);
    line(cx, top, cx, bot, blue, 3, [10, 8]); lab('h=' + f.h, cx + 12, cy, 24, blue, 'left');
  }
  ctx.restore();
}
