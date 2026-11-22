'use strict';
// ================== 祈愿（抽卡）界面 + 灵晶经济（只靠游戏获得，无任何付费）==================
function wishState() { const F = G.flags; if (!F.wish) F.wish = WishCore.newState(); if (F.gems === undefined) F.gems = 160; F.dust = F.dust || 0; F.tickets = F.tickets || 0; return F.wish; }
function addGems(n, why) { wishState(); G.flags.gems += n; G.gemPop = { n, t: 0, why }; }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayIndex() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
function curBanners() { return [WishCore.limitedBanner(dayIndex()), WishCore.STANDARD]; }
function openWish() { wishState(); G.wishUI = { bi: 0, act: 0, phase: 'banner', t: 0, res: [], ri: 0 }; G.menu = null; AudioSys.sfx('confirm'); AudioSys.play('legend'); }
function closeWish() { G.wishUI = null; AudioSys.sfx('cancel'); if (typeof musicFor === 'function') AudioSys.play(musicFor()); }
function wishActions() {
  const F = G.flags, dd = F.daily && F.daily.date === todayKey();
  return [
    { k: 'one', label: F.tickets ? '祈愿 1 次（使用祈愿券 ×1）' : '祈愿 1 次　◆' + WishCore.COST },
    { k: 'ten', label: '祈愿 10 次　◆' + WishCore.COST10 },
    { k: 'daily', label: dd ? '每日数学挑战（今日已完成 ✓）' : '每日数学挑战：5 题答对 3 题 → ◆80 + 祈愿券' },
    { k: 'dust', label: '灵尘兑换（' + F.dust + ' 尘）：120 尘 → 祈愿券' },
    { k: 'rates', label: '概率公示与保底说明' },
    { k: 'close', label: '离开' },
  ];
}
function ownedOfLine(line) { return G.party.concat(G.box).filter(m => SPECIES[m.sp].line === line); }
function doWish(n) {
  const S = wishState(), F = G.flags, B = curBanners()[G.wishUI.bi];
  if (n === 1 && F.tickets > 0) F.tickets--;
  else { const cost = n === 1 ? WishCore.COST : WishCore.COST10; if (F.gems < cost) { toast('灵晶不够！答对题目、完成每日数学挑战、开宝箱、寻找灵瞳都能获得灵晶'); AudioSys.sfx('wrong'); return; } F.gems -= cost; }
  G.say = null; Voice.stop();
  const res = []; for (let i = 0; i < n; i++) res.push(WishCore.roll(S, B, Math.random));
  const lvl = clamp(Math.max(...G.party.map(m => m.lvl)) - 2, 5, 60);
  res.forEach(r => {
    if (r.item) { G.bag[r.item[0]] = (G.bag[r.item[0]] || 0) + r.item[1]; r.out = ITEMS[r.item[0]].n + ' ×' + r.item[1]; return; }
    const line = SPECIES[r.sp].line || r.sp, own = ownedOfLine(line);
    G.flags.seen = G.flags.seen || {}; G.flags.seen[r.sp] = 1;
    if (own.length && r.star === 3) { F.dust += 5; r.out = '重复 → 灵尘 +5'; r.dup = true; return; }
    if (own.length) { const t = own.filter(m => (m.cons || 0) < 6).sort((a, b) => b.lvl - a.lvl)[0];
      if (t) { t.cons = (t.cons || 0) + 1; r.out = nameOf(t) + ' 星魂 ' + t.cons + ' 阶（全能力 +' + t.cons * 5 + '%）'; r.cons = t.cons; }
      else { const d = r.star === 5 ? 100 : 25; F.dust += d; r.out = '星魂已满 → 灵尘 +' + d; } r.dup = true; return; }
    const m = makeMon(r.sp, lvl); m.dhp = m.hp; if (Math.random() < 1 / 64) m.shiny = true; G.flags.dex[r.sp] = 1;
    if (G.party.length < 6) { G.party.push(m); r.out = '新灵兽！加入队伍'; } else { G.box.push(m); r.out = '新灵兽！已送往灵兽箱'; } r.isNew = true;
  });
  const U = G.wishUI; U.res = res; U.ri = 0; U.phase = 'meteor'; U.t = 0; U.max = Math.max(...res.map(r => r.star));
  AudioSys.sfx('powerup'); AudioSys.setIntensity(1); if (U.max === 5) setTimeout(() => Voice.npc('wish_gold'), 1700);
}
function wishInput(k) {
  const U = G.wishUI; if (!U) return;
  if (U.phase === 'rates') { if (k === 'ok' || k === 'cancel') U.phase = 'banner'; return; }
  if (U.phase === 'meteor') { if ((k === 'ok' || k === 'cancel') && U.t > 0.6) { U.phase = 'reveal'; U.t = 0; revealVoice(); } return; }
  if (U.phase === 'reveal') { if (k === 'cancel') { U.phase = U.res.length > 1 ? 'summary' : 'banner'; U.t = 0; Voice.stop(); AudioSys.setIntensity(0); return; }
    if (k === 'ok' && U.t > 0.5) { if (U.ri < U.res.length - 1) { U.ri++; U.t = 0; revealVoice(); } else { U.phase = U.res.length > 1 ? 'summary' : 'banner'; U.t = 0; AudioSys.setIntensity(0); } } return; }
  if (U.phase === 'summary') { if (k === 'ok' || k === 'cancel') { U.phase = 'banner'; U.t = 0; } return; }
  if (k === 'cancel') return closeWish();
  if (k === 'left' || k === 'right') { U.bi = 1 - U.bi; AudioSys.sfx('move'); const B = curBanners()[U.bi]; if (B.up5) monSay(B.up5, 'sum', 520, 140); }
  const A = wishActions();
  if (k === 'up') { U.act = (U.act + A.length - 1) % A.length; AudioSys.sfx('move'); }
  if (k === 'down') { U.act = (U.act + 1) % A.length; AudioSys.sfx('move'); }
  if (k === 'ok') {
    const a = A[U.act].k;
    if (a === 'one') doWish(1); else if (a === 'ten') doWish(10);
    else if (a === 'rates') U.phase = 'rates';
    else if (a === 'close') closeWish();
    else if (a === 'dust') { if (G.flags.dust >= 120) { G.flags.dust -= 120; G.flags.tickets++; toast('兑换成功！获得祈愿券 ×1'); AudioSys.sfx('buy'); } else { toast('灵尘不足 120（重复的灵兽会转化为灵尘）'); AudioSys.sfx('wrong'); } }
    else if (a === 'daily') startDaily();
  }
}
function startDaily() {
  const F = G.flags; if (F.daily && F.daily.date === todayKey()) { toast('今天的每日数学挑战已经完成啦，明天再来！'); return; }
  const back = G.wishUI; G.wishUI = null;
  startQuiz({ source: 'daily', count: 5, need: 3, title: '每日数学挑战', sub: '5 题答对 3 题：灵晶 ◆80 + 祈愿券 ×1（每天一次）' }, res => {
    F.daily = { date: todayKey(), ok: res.ok || 0 };
    if (res.pass) { addGems(80, '每日挑战'); F.tickets++; toast('每日挑战成功！获得 ◆80 和祈愿券 ×1'); AudioSys.sfx('levelup'); Voice.npc('daily_ok'); }
    else { addGems(20, '每日挑战'); toast('这次差一点！安慰奖 ◆20，明天再来挑战吧'); }
    G.wishUI = back;
  });
}
function revealVoice() { const r = G.wishUI.res[G.wishUI.ri]; Voice.stop(); if (r.sp) { setTimeout(() => { if (G.wishUI && G.wishUI.res[G.wishUI.ri] === r) Voice.mon(r.sp, r.star >= 4 ? 'sum' : 'sel'); }, r.star === 5 ? 900 : 450); } AudioSys.sfx(r.star === 5 ? 'ult' : r.star === 4 ? 'sigcut' : 'star'); }
function updateWish(dt) { const U = G.wishUI; if (!U) return; U.t += dt; if (U.phase === 'meteor' && U.t > (U.max === 5 ? 3.0 : 2.2)) { U.phase = 'reveal'; U.t = 0; revealVoice(); } }
const STAR_C = { 3: '#6fb8ff', 4: '#c27bff', 5: '#ffcc4a' };
function starRow(n, x, y, s, t) { for (let i = 0; i < n; i++) { const a = clamp((t - i * 0.12) * 5, 0, 1); if (a <= 0) continue; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + (i - (n - 1) / 2) * s * 1.1, y); ctx.scale(0.6 + 0.4 * easeBack(a), 0.6 + 0.4 * easeBack(a)); text('★', 0, 0, s, '#ffd84a', 'center', '900', 'middle', true); ctx.restore(); } }
function gemIcon(x, y, r) { ctx.save(); ctx.translate(x, y); const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#d9fbff'); g.addColorStop(0.5, '#62d6ff'); g.addColorStop(1, '#7a5cff'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, -r * 0.2); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, -r * 0.2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
function drawWish() {
  const U = G.wishUI; if (!U) return; beginUI();
  const F = G.flags, S = wishState(), banners = curBanners(), B = banners[U.bi];
  // 背景：夜空 + 星轨
  const bg = ctx.createLinearGradient(0, 0, 0, 900); bg.addColorStop(0, '#0b0f2e'); bg.addColorStop(1, U.bi === 0 ? '#3a1d4a' : '#123a4a'); ctx.fillStyle = bg; ctx.fillRect(-400, -200, 2400, 1300);
  for (let i = 0; i < 90; i++) { const x = hash(i, 3) * 1600, y = hash(i, 5) * 900, r = 1 + hash(i, 7) * 2.5; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(NOW * (0.5 + hash(i, 9)) + i)); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, r, r); } ctx.globalAlpha = 1;
  if (U.phase === 'meteor') return drawMeteor(U);
  if (U.phase === 'reveal') return drawReveal(U);
  if (U.phase === 'summary') return drawWishSummary(U);
  // 顶部：标签页 + 货币
  banners.forEach((b, i) => { const x = 60 + i * 330, sel = i === U.bi; rrect(x, 30, 310, 64, 22, sel ? 'rgba(255,214,110,0.95)' : 'rgba(255,255,255,0.1)', sel ? '#fff4c8' : 'rgba(255,255,255,0.25)', 3); text(b.up5 ? '★限定 ' + SPECIES[b.up5].n : '常驻祈愿', x + 155, 63, 28, sel ? '#3a2400' : '#dfe8ff', 'center', '900'); });
  text('← →', 740, 63, 20, '#aab8dd', 'left', '700');
  glass(900, 30, 480, 64, 32, true, 'rgba(120,220,255,0.9)'); gemIcon(935, 62, 18); text(String(F.gems), 960, 63, 30, '#fff', 'left', '900'); text('灵晶', 1045, 63, 20, '#9fe8ff', 'left', '800');
  text('🎫 ' + F.tickets, 1130, 63, 26, '#ffe08a', 'left', '900'); text('灵尘 ' + F.dust, 1360, 63, 22, '#d8c8ff', 'right', '800');
  // 主视觉
  const fx = 520, fy = 720; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(softSprite(B.up5 ? '#ffcc4a' : '#c27bff'), fx - 380, fy - 640, 760, 700); ctx.restore();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28 + NOW * 0.15; ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(fx, fy - 300); ctx.lineTo(fx + Math.cos(a) * 900, fy - 300 + Math.sin(a) * 900); ctx.stroke(); ctx.restore(); }
  const feat = B.up5 || 'dragon3'; drawCreature(ctx, B.up5 ? B.up5 : feat, fx, fy, 560, { breathe: true, t: NOW, showcase: true });
  if (!B.up5) { drawCreature(ctx, 'cat3', fx - 300, fy + 20, 330, { breathe: true, t: NOW + 1, alpha: 0.95 }); drawCreature(ctx, 'crane2', fx + 300, fy + 10, 330, { breathe: true, t: NOW + 2, alpha: 0.95 }); }
  text(B.name, 70, 150, 50, '#fff', 'left', '900', 'middle', true);
  text(B.up5 ? 'UP 传说 5★：' + SPECIES[B.up5].n + '　（每天轮换）' : '5★ 史诗灵兽：灵纹猫 · 墨鳞幼龙 · 白羽鹤', 70, 205, 26, '#ffe08a', 'left', '800', 'middle', true);
  if (B.up4.length) text('UP 4★：' + B.up4.map(s => SPECIES[s].n).join(' · '), 70, 245, 24, '#e2c4ff', 'left', '800', 'middle', true);
  // 右侧操作面板
  glass(980, 130, 580, 600, 30, true, 'rgba(255,214,110,0.9)');
  text('距离 5★ 保底还有 ' + (WishCore.RATE.hard - S.pity5[B.id]) + ' 抽', 1270, 175, 26, '#ffd84a', 'center', '900');
  text('4★ 保底还有 ' + (WishCore.RATE.fourHard - S.pity4[B.id]) + ' 抽' + (B.up5 && S.guar5 ? '　·　下个 5★ 必定 UP！' : ''), 1270, 212, 20, '#e2c4ff', 'center', '800');
  wishActions().forEach((a, i) => { const y = 270 + i * 72, sel = i === U.act; if (sel) { rrect(1000, y - 30, 540, 60, 18, 'rgba(255,214,110,0.22)', '#ffd66e', 3); text('▶', 1022, y, 22, '#ffd66e', 'left', '900'); } text(a.label, 1050, y, a.label.length > 20 ? 21 : 24, sel ? '#fff' : '#cfd8f0', 'left', '800'); });
  text('灵晶获取：答对 +2（竞赛题 +4，神速 +1）· 连对 5 题 +10 · 宝箱 +10 · 灵瞳 +40', 1270, 712, 16, '#9fe8ff', 'center', '700');
  // 最近记录
  text('最近：' + S.history.slice(0, 8).map(h => h.star + '★' + (h.sp ? SPECIES[h.sp].n : ITEMS[h.item].n)).join(' ') , 70, 812, 18, '#aab8dd', 'left', '700');
  text('本游戏没有任何付费内容，灵晶只能通过学习和探索获得', 1560, 812, 18, '#7ff0b0', 'right', '800');
  if (U.phase === 'rates') drawRates(B);
  drawHint('↑↓ 选择　Z 确定　← → 切换卡池　X 离开');
}
function drawRates(B) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-400, -200, 2400, 1300); glass(220, 90, 1160, 720, 30, true, 'rgba(255,214,110,0.9)');
  text('概率公示（' + B.name + '）', 800, 140, 36, '#ffd84a', 'center', '900');
  const L = ['5★：' + WishCore.SHOWN.five, '4★：' + WishCore.SHOWN.four, '3★：' + WishCore.SHOWN.three, B.up5 ? WishCore.SHOWN.up : '常驻祈愿：5★ 在史诗灵兽中平均出现', B.up4.length ? '4★ 有 50% 为 UP 稀有灵兽（' + B.up4.map(s => SPECIES[s].n).join('、') + '）' : '4★ 在全部稀有灵兽中平均出现',
    '保底次数在同一卡池中累计，不会因为切换卡池或关闭游戏而清零', '重复获得：4★/5★ → 星魂（每阶全能力 +5%，最多 6 阶），星魂满或 3★ 重复 → 灵尘', '5★ 池：' + B.five.map(s => SPECIES[s].n).join('、') + (B.up5 ? '、' + SPECIES[B.up5].n + '（UP）' : ''), '4★ 池：' + B.four.map(s => SPECIES[s].n).join('、'), '3★ 池：' + WishCore.POOL.common.map(s => SPECIES[s].n).join('、') + '、各种道具'];
  L.forEach((s, i) => wrapText(s, 280, 200 + i * 58, 1040, 22, 28, i < 3 ? '#fff' : '#cfd8f0', '700'));
  text('Z / X 返回', 800, 780, 22, '#aab8dd', 'center', '700');
}
function drawMeteor(U) {
  const c = STAR_C[U.max], t = U.t, n = U.res.length > 1 ? 3 : 1;
  for (let k = 0; k < n; k++) { const tt = clamp((t - k * 0.18) / 1.4, 0, 1), x = 1700 - tt * 1300 - k * 60, y = -100 + tt * 760 + k * 40;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const q = i / 26; ctx.globalAlpha = (1 - q) * 0.8; ctx.drawImage(glowSprite(c), x + q * 340 - 40, y - q * 200 - 40, 80 * (1 - q * 0.7), 80 * (1 - q * 0.7)); } ctx.restore();
    glowOrb(x, y, 60, c); }
  if (t > 1.4) { const f = clamp((t - 1.4) / 0.4, 0, 1); ctx.fillStyle = hexA(c, Math.sin(f * Math.PI) * 0.9); ctx.fillRect(-400, -200, 2400, 1300); }
  if (U.max === 5 && t > 1.7) { for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28 + t; ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(800, 450); ctx.lineTo(800 + Math.cos(a) * 1200, 450 + Math.sin(a) * 1200); ctx.stroke(); ctx.restore(); } text('✦ 金色流星 ✦', 800, 450, 70, '#fff6c8', 'center', '900', 'middle', true); }
  drawHint('Z 跳过');
}
function drawReveal(U) {
  const r = U.res[U.ri], c = STAR_C[r.star], t = U.t;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.65; ctx.drawImage(softSprite(c), 200, -50, 1200, 1000); ctx.restore();
  if (r.star >= 4) for (let i = 0; i < 20; i++) { const a = i / 20 * 6.28 + NOW * 0.3; ctx.save(); ctx.globalAlpha = r.star === 5 ? 0.22 : 0.12; ctx.strokeStyle = c; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(800, 430); ctx.lineTo(800 + Math.cos(a) * 1100, 430 + Math.sin(a) * 1100); ctx.stroke(); ctx.restore(); }
  const ap = easeOut(clamp(t * (r.star === 5 ? 1.4 : 2.5), 0, 1));
  if (r.sp) {
    const sil = t < (r.star === 5 ? 0.6 : 0.25);
    ctx.save(); ctx.globalAlpha = ap; drawCreature(ctx, r.sp, 800 - (1 - ap) * 200, 700, 520 + (r.star === 5 ? (1 - ap) * 200 : 0), sil ? { silhouette: hexA(c, 0.95) } : { breathe: true, t: NOW, showcase: true, shiny: false }); ctx.restore();
    if (!sil && t < 0.9) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.9) * 0.6 + ')'; ctx.fillRect(-400, -200, 2400, 1300); }
    text(SPECIES[r.sp].n, 160, 600, 64, '#fff', 'left', '900', 'middle', true);
    text(RARITY[SPECIES[r.sp].rar].n + ' · ' + TYPES[SPECIES[r.sp].t].n + '属性', 160, 660, 28, c, 'left', '900', 'middle', true);
    starRow(r.star, 280, 720, 52, t - 0.3);
    if (t > 0.6) { const MV = MON_VOICE[r.sp]; if (MV) { rrect(150, 770, 640, 60, 20, 'rgba(255,253,245,0.95)', c, 4); text('「' + (r.star >= 4 ? MV.sum[0] : MV.sel[0]) + '」', 470, 800, 28, '#24304f', 'center', '900'); } }
  } else { ctx.save(); ctx.globalAlpha = ap; itemIcon(r.item[0], 800, 420); ctx.restore(); text(r.out, 800, 560, 50, '#fff', 'center', '900', 'middle', true); starRow(3, 800, 640, 46, t); }
  if (r.up && t > 0.5) { rrect(1180, 150, 220, 70, 20, '#ff5a7a', '#fff', 4); text('UP!', 1290, 186, 40, '#fff', 'center', '900'); }
  if (t > 0.7) { const tag = r.isNew ? '✦ NEW 新灵兽' : r.cons ? '星魂 +1' : r.dup ? '重复转化' : ''; if (tag) { rrect(1100, 600, 380, 64, 22, r.isNew ? 'rgba(255,214,110,0.95)' : 'rgba(194,123,255,0.9)', '#fff', 3); text(tag, 1290, 633, 30, '#2a1a00', 'center', '900'); } if (r.sp) text(r.out, 1290, 700, 22, '#e8ecff', 'center', '800', 'middle', true); }
  text((U.ri + 1) + ' / ' + U.res.length, 80, 60, 30, '#aab8dd', 'left', '900');
  drawHint('Z 下一个　X 跳过');
}
function drawWishSummary(U) {
  text('祈愿结果', 800, 90, 48, '#fff', 'center', '900', 'middle', true);
  U.res.forEach((r, i) => { const x = 140 + (i % 5) * 270, y = 200 + Math.floor(i / 5) * 320, c = STAR_C[r.star], a = clamp(U.t * 4 - i * 0.15, 0, 1);
    ctx.save(); ctx.globalAlpha = a; rrect(x, y, 240, 290, 22, 'rgba(10,14,40,0.85)', c, 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * a; ctx.drawImage(softSprite(c), x, y + 10, 240, 220); ctx.restore();
    if (r.sp) drawCreature(ctx, r.sp, x + 120, y + 210, 190, { t: NOW }); else itemIcon(r.item[0], x + 120, y + 130);
    text(r.sp ? SPECIES[r.sp].n : ITEMS[r.item[0]].n, x + 120, y + 236, 24, '#fff', 'center', '900'); starRow(r.star, x + 120, y + 268, 22, 9);
    if (r.isNew) { rrect(x + 150, y + 10, 80, 32, 12, '#ffd66e'); text('NEW', x + 190, y + 26, 20, '#2a1a00', 'center', '900'); }
    ctx.restore(); });
  drawHint('Z 返回卡池');
}
