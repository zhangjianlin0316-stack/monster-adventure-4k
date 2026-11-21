'use strict';
// ================== 界面：HUD / 对话 / 菜单 / 队伍 / 背包 / 商店 / 统计 / 标题 ==================
function toast(s) { G.toast = { text: s, t: 2.2 }; }
function say(lines, after) { G.dialog = { lines: Array.isArray(lines) ? lines : [lines], i: 0, chars: 0, after }; }
function openChoice(textS, opts, cb) { G.choice = { text: textS, opts, idx: 0, cb }; }
const BLUR_CACHE = {};
function drawUIBackdrop(key, dark) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const im = IMG[key];
  if (im) {
    const ck = key + CW + 'x' + CH; let bc = BLUR_CACHE[ck];
    if (!bc) { bc = document.createElement('canvas'); const q = 0.5; bc.width = Math.ceil(CW * q); bc.height = Math.ceil(CH * q); const c = bc.getContext('2d'); const sc = Math.max(bc.width / im.width, bc.height / im.height) * 1.06; c.filter = 'blur(' + Math.round(bc.height / 110) + 'px)'; c.drawImage(im, (bc.width - im.width * sc) / 2, (bc.height - im.height * sc) / 2, im.width * sc, im.height * sc); BLUR_CACHE[ck] = bc; }
    ctx.drawImage(bc, 0, 0, CW, CH);
  } else { ctx.fillStyle = '#2c4f9a'; ctx.fillRect(0, 0, CW, CH); }
  ctx.fillStyle = dark || 'rgba(12,24,60,0.55)'; ctx.fillRect(0, 0, CW, CH);
}
// ---------- 大地图 HUD ----------
function drawWorldHUD() {
  beginUI();
  const R = curRegion();
  if (G.regionShow === undefined || G.regionName !== R.n) { G.regionName = R.n; G.regionShow = NOW; }
  const zk = clamp((NOW - G.regionShow) / 0.5, 0, 1);
  ctx.globalAlpha = zk;
  glass(24 - (1 - zk) * 40, 24, 330, 74, 37, true, 'rgba(255,200,90,0.9)');
  text(R.n, 60 - (1 - zk) * 40, 52, 30, '#fff', 'left', '800', 'middle', true);
  text('Lv.' + R.lv[0] + '~' + R.lv[1] + '　' + MathQ.TAG_NAME[R.theme], 60 - (1 - zk) * 40, 82, 18, '#ffe9a0', 'left', '700');
  ctx.globalAlpha = 1;
  // 新地区大横幅
  const bk = NOW - G.regionShow;
  if (bk < 3 && G.regionBanner === R.n) {
    const a = bk < 0.4 ? bk / 0.4 : bk > 2.4 ? (3 - bk) / 0.6 : 1;
    ctx.globalAlpha = a; const g = ctx.createLinearGradient(300, 0, 1300, 0); g.addColorStop(0, 'rgba(10,20,50,0)'); g.addColorStop(0.5, 'rgba(10,20,50,0.75)'); g.addColorStop(1, 'rgba(10,20,50,0)');
    ctx.fillStyle = g; ctx.fillRect(200, 300, 1200, 150);
    text(R.n, 800, 355, 68, '#fff', 'center', '900', 'middle', true);
    text('本地区数学主题：' + MathQ.TAG_NAME[R.theme] + '　推荐等级 Lv.' + R.lv[0] + '~' + R.lv[1], 800, 420, 28, '#ffe58a', 'center', '700');
    ctx.globalAlpha = 1;
  }
  G.party.forEach((m, i) => {
    const x = 400 + i * 80, y = 61;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12;
    const g = ctx.createRadialGradient(x, y - 10, 5, x, y, 34); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(200,220,255,0.85)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.28); ctx.fill(); ctx.restore();
    const r = clamp(m.hp / stats(m).hp, 0, 1);
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,30,60,0.6)'; ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = r > 0.5 ? '#3ad66e' : r > 0.2 ? '#f0b020' : '#e83a3a'; ctx.beginPath(); ctx.arc(x, y, 34, -Math.PI / 2, -Math.PI / 2 + r * 6.28); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 31, 0, 6.28); ctx.clip(); drawCreature(ctx, m.sp, x, y + 28, 62, { alpha: m.hp > 0 ? 1 : 0.35 }); ctx.restore();
    if (m.evoReady) { const p = 1 + Math.sin(NOW * 5) * 0.15; ctx.save(); ctx.translate(x + 24, y - 24); ctx.scale(p, p); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.28); ctx.fill(); text('进', 0, 1, 15, '#fff', 'center', '900'); ctx.restore(); }
  });
  // 星星 / 连对 / 年级
  const sp = G.starPop && G.starPop.t < 1 ? 1 + 0.3 * Math.sin(G.starPop.t * Math.PI) : 1;
  glass(24, 112, 330, 64, 32, true, 'rgba(255,210,80,0.9)');
  ctx.save(); ctx.translate(64, 144); ctx.scale(sp, sp); text('★', 0, 0, 34, '#ffd23a', 'center', '900'); ctx.restore();
  text(String(G.stars), 90, 145, 30, '#fff', 'left', '900');
  text('连对 ' + G.streak, 200, 145, 24, G.streak >= 3 ? '#7ff0e2' : '#dfe8ff', 'left', '800');
  text(G.grade + '年级' + (G.comp ? '·竞赛' : ''), 340, 145, 20, '#ffe9a0', 'right', '800');
  if (G.doubleExp > 0) { glass(24, 186, 330, 46, 23, true, 'rgba(255,140,80,0.9)'); text('双倍经验：还剩 ' + G.doubleExp + ' 场战斗', 189, 210, 22, '#ffb080', 'center', '900'); }
  const badges = Object.keys(G.flags.badges).length;
  if (badges) { text('徽章 ' + badges + '/7', 24 + 330, 250, 20, '#c8b0ff', 'right', '800', 'middle', true); }
  drawMinimap(1600 - 24 - 300, 124, 300, 210);
  if (!G.dialog && !G.menu && !G.partyUI && !G.bagUI && !G.choice) drawHint('方向键/WASD 移动　Shift 奔跑　Z 交互　X 菜单　M 地图　Q 错题本　V 静音　F 全屏');
}
// ---------- 对话框与选择框 ----------
function drawDialogBox() {
  const D = G.dialog; beginUI();
  const line = D.lines[D.i] || ''; let name = null, body = line;
  const m = /^([^：\n]{1,8})：([\s\S]*)$/.exec(line); if (m) { name = m[1]; body = m[2]; }
  const shown = body.slice(0, Math.max(0, Math.floor(D.chars) - (name ? name.length + 1 : 0)));
  glass(90, 680, 1420, 196, 30, true, 'rgba(127,240,226,0.9)');
  if (name) { ctx.font = '800 30px ' + FONT; const nw = ctx.measureText(name).width + 50; const g = ctx.createLinearGradient(0, 652, 0, 700); g.addColorStop(0, '#ffcf5a'); g.addColorStop(1, '#f08a2a'); rrect(130, 652, nw, 50, 25, g); text(name, 130 + nw / 2, 678, 30, '#3a1d00', 'center', '800'); }
  let yy = 745; shown.split('\n').forEach(l => { const n = wrapText(l, 140, yy, 1320, 38, 54, '#f4f7ff', '600', 'rgba(0,0,0,0.5)'); yy += 54 * (n || 1); });
  if (D.chars >= line.length) { const o = Math.sin(NOW * 6) * 5; ctx.fillStyle = '#7ff0e2'; ctx.beginPath(); ctx.moveTo(1450, 836 + o); ctx.lineTo(1476, 836 + o); ctx.lineTo(1463, 851 + o); ctx.fill(); }
}
function drawChoice() {
  const C = G.choice; beginUI();
  ctx.fillStyle = 'rgba(5,10,30,0.45)'; ctx.fillRect(-400, -200, 2400, 1300);
  glass(90, 620, 1420, 256, 30, true, 'rgba(255,200,90,0.9)');
  let yy = 670; C.text.split('\n').forEach(l => { wrapText(l, 140, yy, 1320, 36, 50, '#fff', '700', 'rgba(0,0,0,0.5)'); yy += 50; });
  C.opts.forEach((o, i) => { const x = 140 + i * 440, y = 790, sel = i === C.idx; rrect(x, y, 400, 64, 32, sel ? 'rgba(255,200,90,0.9)' : 'rgba(255,255,255,0.1)', sel ? '#fff' : 'rgba(255,255,255,0.4)', sel ? 3 : 2); text(o, x + 200, y + 33, 30, sel ? '#3a1d00' : '#fff', 'center', '800'); });
}
function choiceInput(k) {
  const C = G.choice;
  if (k === 'left' || k === 'up') C.idx = Math.max(0, C.idx - 1);
  if (k === 'right' || k === 'down') C.idx = Math.min(C.opts.length - 1, C.idx + 1);
  if (k === 'ok') { G.choice = null; AudioSys.sfx('confirm'); C.cb(C.idx); }
  if (k === 'cancel') { G.choice = null; C.cb(C.opts.length - 1); }
}
function dialogInput(k) {
  const D = G.dialog; if (k !== 'ok' && k !== 'cancel') return;
  const line = D.lines[D.i];
  if (D.chars < line.length) { D.chars = line.length; return; }
  D.i++; D.chars = 0; AudioSys.sfx('blip');
  if (D.i >= D.lines.length) { G.dialog = null; if (D.after) D.after(); }
}
// ---------- 主菜单 ----------
const MENU_OPTS = ['队伍', '背包', '灵兽图鉴', '世界地图', '错题本与统计', '年级与竞赛', '保存', '读取', '关闭'];
function drawMenu() {
  beginUI();
  const n = MENU_OPTS.length, h = 60 + n * 70, sl = clamp((NOW - (G.menu.t0 || 0)) * 6, 0, 1), ox = (1 - sl) * 80;
  ctx.globalAlpha = sl;
  glass(1140 + ox, 110, 420, h, 30, true, 'rgba(255,200,90,0.9)');
  MENU_OPTS.forEach((o, i) => { const y = 160 + i * 70; if (i === G.menu.idx) { selBar(1165 + ox, y - 28, 370, 56); arrow(1190 + ox, y); } text(o, 1230 + ox, y + 1, 32, '#fff', 'left', '700', 'middle', true); });
  ctx.globalAlpha = 1;
}
function menuInput(k) {
  const M = G.menu;
  if (k === 'up') { M.idx = (M.idx + MENU_OPTS.length - 1) % MENU_OPTS.length; AudioSys.sfx('move'); }
  if (k === 'down') { M.idx = (M.idx + 1) % MENU_OPTS.length; AudioSys.sfx('move'); }
  if (k === 'cancel') { G.menu = null; AudioSys.sfx('cancel'); }
  if (k !== 'ok') return;
  AudioSys.sfx('confirm');
  const o = MENU_OPTS[M.idx];
  if (o === '队伍') G.partyUI = { idx: 0, mode: 'world', sel: null, sub: null };
  if (o === '背包') G.bagUI = { idx: 0, ctx: 'world' };
  if (o === '灵兽图鉴') { G.menu = null; G.dexUI = { idx: 0 }; }
  if (o === '世界地图') { G.menu = null; G.mapUI = true; }
  if (o === '错题本与统计') { G.menu = null; G.statsUI = { tab: 0, idx: 0, scroll: 0 }; }
  if (o === '年级与竞赛') { G.menu = null; G.gradeUI = { grade: G.grade, comp: G.comp, row: 0, setup: false }; }
  if (o === '保存') { saveGame(); G.menu = null; say('游戏进度已保存！（星星、错题本、地图探索都会保存）'); AudioSys.sfx('save'); }
  if (o === '读取') { if (loadGame()) { G.menu = null; toast('读取成功！'); } else toast('没有找到存档'); }
  if (o === '关闭') G.menu = null;
}
// ---------- 队伍 ----------
function partyOpts(m) { const o = []; if (m.evoReady && SPECIES[m.sp].evoTo) o.push('进化试炼'); o.push('调换顺序', '返回'); return o; }
function partyInput(k) {
  const u = G.partyUI, n = G.party.length;
  if (u.sub) {
    const opts = partyOpts(G.party[u.idx]);
    if (k === 'up') u.sub.idx = Math.max(0, u.sub.idx - 1); if (k === 'down') u.sub.idx = Math.min(opts.length - 1, u.sub.idx + 1);
    if (k === 'cancel') u.sub = null;
    if (k === 'ok') { const o = opts[u.sub.idx]; u.sub = null; if (o === '进化试炼') { const m = G.party[u.idx]; G.partyUI = null; G.menu = null; startEvoTrial(m); } else if (o === '调换顺序') u.sel = u.idx; }
    return;
  }
  if (k === 'up') { u.idx = (u.idx + n - 1) % n; AudioSys.sfx('move'); }
  if (k === 'down') { u.idx = (u.idx + 1) % n; AudioSys.sfx('move'); }
  const B = G.battle;
  if (k === 'cancel') {
    if (u.mode === 'forced') return;
    if (u.sel !== null) { u.sel = null; return; }
    G.partyUI = null; if (B && G.scene === 'battle') B.mode = 'menu'; else if (u.mode === 'item') G.bagUI = { idx: ITEM_ORDER.indexOf(u.item), ctx: 'world' };
    AudioSys.sfx('cancel'); return;
  }
  if (k !== 'ok') return;
  const m = G.party[u.idx];
  if (u.mode === 'world') {
    if (u.sel === null) { u.sub = { idx: 0 }; AudioSys.sfx('confirm'); }
    else { const a = G.party[u.sel]; G.party[u.sel] = G.party[u.idx]; G.party[u.idx] = a; u.sel = null; AudioSys.sfx('confirm'); }
  } else if (u.mode === 'item') {
    useItemOn(u.item, m);
  } else {
    if (m.hp <= 0) { toast(nameOf(m) + '已经没有力气战斗了！'); return; }
    if (u.idx === B.pi && u.mode !== 'forced') { toast(nameOf(m) + '已经在场上了！'); return; }
    const forced = u.mode === 'forced'; G.partyUI = null; battleSwitch(u.idx, forced);
  }
}
function useItemOn(id, m) {
  const st = stats(m);
  if (id === 'revive') { if (m.hp > 0) { toast('它并没有倒下。'); return; } G.bag.revive--; m.hp = Math.floor(st.hp / 2); m.dhp = m.hp; AudioSys.sfx('heal'); toast(nameOf(m) + '恢复了精神！'); }
  else { if (m.hp <= 0) { toast('需要先用复活草。'); return; } if (m.hp >= st.hp) { toast('体力已经是满的了。'); return; } const h = Math.min(id === 'potion' ? 30 : 80, st.hp - m.hp); G.bag[id]--; m.hp += h; m.dhp = m.hp; AudioSys.sfx('heal'); toast(nameOf(m) + '恢复了 ' + h + ' 点体力！'); }
  if (G.bag[id] <= 0) G.partyUI = null;
}
function drawPartyUI() {
  const u = G.partyUI;
  drawUIBackdrop(G.battle && G.scene === 'battle' ? (G.battle.bg || 'bg_meadow') : 'title_bg', 'rgba(10,20,52,0.62)');
  beginUI();
  text(u.mode === 'item' ? '选择要使用' + ITEMS[u.item].n + '的灵兽' : '灵兽队伍', 64, 56, 44, '#fff', 'left', '900', 'middle', true);
  const hint = { world: u.sel === null ? 'Z 打开选项（进化试炼 / 调换顺序）　X 返回' : '再选择一只灵兽与它交换位置　X 取消', battle: 'Z 让它出战　X 返回', forced: '请选择下一只出战的灵兽', item: 'Z 使用　X 返回' }[u.mode];
  text(hint, 64, 868, 26, '#dfe8ff', 'left', '600', 'middle', true);
  G.party.forEach((m, i) => {
    const y = 104 + i * 124, st = stats(m), sel = i === u.idx, ox = sel ? 18 : 0;
    ctx.save(); if (m.hp <= 0) ctx.globalAlpha = 0.7;
    glass(50 + ox, y, 760, 112, 24, !sel, sel ? 'rgba(255,170,60,0.95)' : null);
    if (sel) rrect(50 + ox, y, 760, 112, 24, null, '#ffb04a', 4);
    if (u.sel === i) rrect(56 + ox, y + 6, 748, 100, 20, null, '#3ad66e', 5);
    const g = ctx.createRadialGradient(118 + ox, y + 56, 5, 118 + ox, y + 56, 52); g.addColorStop(0, lighten(TYPES[SPECIES[m.sp].t].c, 0.6)); g.addColorStop(1, TYPES[SPECIES[m.sp].t].c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(118 + ox, y + 56, 46, 0, 6.28); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(118 + ox, y + 56, 46, 0, 6.28); ctx.clip(); drawCreature(ctx, m.sp, 118 + ox, y + 104, 92, { breathe: sel }); ctx.restore();
    const tc = sel ? '#1b2440' : '#fff';
    text(nameOf(m), 184 + ox, y + 36, 32, tc, 'left', '800');
    text('Lv.' + m.lvl, 410 + ox, y + 36, 28, tc, 'left', '800');
    typeBadge(SPECIES[m.sp].t, 500 + ox, y + 16, 92, 38);
    if (m.evoReady && SPECIES[m.sp].evoTo) text('✦可进化', 740 + ox, y + 36, 24, '#ff7a1a', 'center', '900');
    else if (G.battle && G.scene === 'battle' && i === G.battle.pi && m.hp > 0) text('战斗中', 730 + ox, y + 36, 24, '#ff6a4a', 'center', '800');
    if (m.hp <= 0) text('濒死', 730 + ox, y + 36, 24, '#ff8a8a', 'center', '800');
    hpBar(184 + ox, y + 66, 440, m.hp, st.hp, undefined, 26);
    text(m.hp + ' / ' + st.hp, 790 + ox, y + 80, 26, tc, 'right', '800');
    ctx.restore();
  });
  const m = G.party[u.idx]; if (!m) return;
  const st = stats(m), sp = SPECIES[m.sp];
  glass(860, 104, 690, 740, 34, false, TYPES[sp.t].c);
  const g = ctx.createRadialGradient(1060, 300, 20, 1060, 300, 220); g.addColorStop(0, lighten(TYPES[sp.t].c, 0.75)); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(860, 110, 400, 380);
  shadowEllipse(ctx, 1060, 440, 120, 22, 0.3); drawCreature(ctx, m.sp, 1060, 440, 300, { breathe: true });
  text(sp.n, 1250, 160, 44, '#1b2440', 'left', '900');
  text('Lv.' + m.lvl + '　第' + ['一', '二', '三'][sp.stage - 1] + '形态', 1250, 212, 28, '#3a4870', 'left', '800');
  typeBadge(sp.t, 1250, 236, 110, 40);
  wrapText(sp.d, 1250, 310, 280, 22, 32, '#4a5677', '500');
  // 进化链
  const line = LINES[sp.line]; if (line) { [line.ids ? line.ids : null]; }
  const chain = [sp.line, sp.line + '2', sp.line + '3'];
  chain.forEach((id, i) => { const x = 1270 + i * 92, y = 430, cur = id === m.sp, known = G.flags.dex && G.flags.dex[id] || SPECIES[id].stage <= sp.stage; rrect(x - 40, y - 40, 80, 80, 18, cur ? 'rgba(255,170,60,0.35)' : 'rgba(0,0,0,0.06)', cur ? '#ffb04a' : 'rgba(0,0,0,0.15)', 2); drawCreature(ctx, id, x, y + 34, 70, { silhouette: known ? undefined : 'rgba(40,50,80,0.85)' }); if (i < 2) text('›', x + 46, y, 30, '#8a96b8', 'center', '900'); });
  if (sp.evoTo) text(m.evoReady ? '已可进化！选择「进化试炼」' : 'Lv.' + sp.evoLvl + ' 可进化', 1405, 490, 20, m.evoReady ? '#ff7a1a' : '#4a5677', 'center', '800');
  const nx = xpFor(m.lvl + 1), cx = xpFor(m.lvl);
  text('经验 ' + (m.xp - cx) + ' / ' + (nx - cx), 900, 520, 22, '#4a5677', 'left', '600');
  rrect(1080, 512, 440, 12, 6, '#d5dcec'); const xg = ctx.createLinearGradient(1080, 0, 1520, 0); xg.addColorStop(0, '#5ac8ff'); xg.addColorStop(1, '#3a6aff'); rrect(1080, 512, Math.max(12, 440 * clamp((m.xp - cx) / (nx - cx), 0, 1)), 12, 6, xg);
  [['体力', st.hp, '#3ad66e'], ['攻击', st.atk, '#ff6a4a'], ['防御', st.def, '#ffb020'], ['速度', st.spd, '#5ac8ff']].forEach((l, i) => { const x = 900 + (i % 2) * 320, y = 560 + Math.floor(i / 2) * 40; text(l[0], x, y, 24, '#4a5677', 'left', '700'); text(String(l[1]), x + 270, y, 26, '#1b2440', 'right', '800'); });
  m.moves.forEach((mv, i) => { const M = MOVES[mv.id], x = 890 + (i % 2) * 325, y = 650 + Math.floor(i / 2) * 92; const tg = ctx.createLinearGradient(x, y, x + 305, y + 80); tg.addColorStop(0, lighten(TYPES[M.t].c, 0.55)); tg.addColorStop(1, lighten(TYPES[M.t].c, 0.15)); rrect(x, y, 305, 80, 18, tg); text((M.fx.sig ? '★' : '') + M.n, x + 18, y + 28, 26, '#1b2440', 'left', '800'); typeIcon(M.t, x + 278, y + 26, 12); text('威力 ' + (M.p || '—') + '　PP ' + mv.pp + '/' + M.pp, x + 18, y + 60, 20, '#2a3658', 'left', '600'); });
  if (u.sub) { const opts = partyOpts(m); glass(560, 120 + u.idx * 124, 300, 40 + opts.length * 60, 22, true, 'rgba(255,200,90,0.9)'); opts.forEach((o, i) => { const y = 150 + u.idx * 124 + i * 60; if (i === u.sub.idx) { selBar(574, y - 24, 272, 48); } text(o, 710, y, 28, o === '进化试炼' ? '#ffb04a' : '#fff', 'center', '800'); }); }
  if (G.box.length) text('灵兽箱中还有 ' + G.box.length + ' 只灵兽', 1540, 868, 22, '#dfe8ff', 'right', '600', 'middle', true);
}
// ---------- 背包 ----------
function itemIcon(id, x, y) {
  if (id === 'ball') return drawBallIcon(x, y, 30);
  if (id === 'superball') { drawBallIcon(x, y, 30); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite('#ffd23a'), x - 40, y - 40, 80, 80); ctx.restore(); text('★', x, y - 14, 18, '#ffd23a', 'center', '900'); return; }
  if (id === 'hintcard') { rrect(x - 24, y - 30, 48, 60, 8, '#fff6d0', '#d0a020', 3); text('H', x, y + 2, 30, '#d07a10', 'center', '900'); return; }
  if (id === 'revive') { ctx.fillStyle = '#5ad04a'; ctx.beginPath(); ctx.ellipse(x - 8, y, 12, 26, -0.5, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 10, y, 12, 26, 0.5, 0, 6.28); ctx.fill(); text('✚', x, y, 20, '#fff', 'center', '900'); return; }
  const g = ctx.createLinearGradient(0, y - 30, 0, y + 34); g.addColorStop(0, id === 'superpotion' ? '#ffd0f0' : '#b8f0ff'); g.addColorStop(1, id === 'superpotion' ? '#d03a9a' : '#2a9ad8');
  rrect(x - 22, y - 26, 44, 60, 14, g); rrect(x - 12, y - 40, 24, 16, 5, '#ff6a8a');
}
function bagInput(k) {
  const u = G.bagUI, n = ITEM_ORDER.length;
  if (k === 'up') { u.idx = (u.idx + n - 1) % n; AudioSys.sfx('move'); }
  if (k === 'down') { u.idx = (u.idx + 1) % n; AudioSys.sfx('move'); }
  if (k === 'cancel') { G.bagUI = null; if (G.battle && G.scene === 'battle') G.battle.mode = 'menu'; AudioSys.sfx('cancel'); return; }
  if (k !== 'ok') return;
  const id = ITEM_ORDER[u.idx];
  if ((G.bag[id] || 0) <= 0) { toast('没有' + ITEMS[id].n + '了'); return; }
  if (u.ctx === 'battle') { G.bagUI = null; battleItem(id); return; }
  if (id === 'ball' || id === 'superball') { toast('在战斗中使用'); return; }
  if (id === 'hintcard') { toast('答题时按 H 使用提示卡'); return; }
  G.bagUI = null; G.partyUI = { idx: 0, mode: 'item', item: id, sel: null };
}
function drawBagUI() {
  const u = G.bagUI;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(5,10,30,0.5)'; ctx.fillRect(0, 0, CW, CH);
  beginUI();
  glass(380, 70, 840, 760, 36, true, 'rgba(255,200,90,0.9)');
  text('背包', 440, 130, 44, '#fff', 'left', '900', 'middle', true);
  text('★ ' + G.stars, 1160, 130, 32, '#ffd23a', 'right', '900');
  ITEM_ORDER.forEach((id, i) => { const y = 210 + i * 84; if (i === u.idx) { selBar(420, y - 38, 760, 76); arrow(450, y); } itemIcon(id, 520, y); text(ITEMS[id].n, 580, y, 34, '#fff', 'left', '800', 'middle', true); text('× ' + (G.bag[id] || 0), 1140, y, 34, '#ffcf5a', 'right', '800', 'middle', true); });
  rrect(430, 712, 740, 2, 1, 'rgba(255,255,255,0.2)');
  wrapText(ITEMS[ITEM_ORDER[u.idx]].d, 440, 750, 700, 26, 36, '#dfe8ff', '500');
  text('Z 使用　X 返回', 1160, 806, 22, '#aab8dd', 'right', '600');
}
// ---------- 星星商店 ----------
function shopInput(k) {
  const u = G.shopUI, n = ITEM_ORDER.length + 1;
  if (k === 'up') u.idx = (u.idx + n - 1) % n; if (k === 'down') u.idx = (u.idx + 1) % n;
  if (k === 'cancel' || (k === 'ok' && u.idx === n - 1)) { G.shopUI = null; say('店员：欢迎下次光临！多答题多攒星星哦～'); return; }
  if (k !== 'ok') return;
  const id = ITEM_ORDER[u.idx], pr = ITEMS[id].price;
  if (G.stars < pr) { toast('星星不够！去答题、开宝箱或挑战训练师吧'); AudioSys.sfx('wrong'); return; }
  G.stars -= pr; G.bag[id] = (G.bag[id] || 0) + 1; AudioSys.sfx('buy'); toast('购买了 ' + ITEMS[id].n + '（剩余 ★' + G.stars + '）');
}
function drawShopUI() {
  const u = G.shopUI; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(5,10,30,0.5)'; ctx.fillRect(0, 0, CW, CH);
  beginUI(); glass(330, 60, 940, 780, 36, true, 'rgba(255,210,80,0.95)');
  text('星星商店', 390, 120, 44, '#fff', 'left', '900', 'middle', true); text('我的星星 ★ ' + G.stars, 1210, 120, 32, '#ffd23a', 'right', '900');
  [...ITEM_ORDER, 'close'].forEach((id, i) => { const y = 200 + i * 80; if (i === u.idx) { selBar(370, y - 36, 860, 72); arrow(400, y); } if (id === 'close') { text('离开商店', 470, y, 32, '#fff', 'left', '800'); return; } itemIcon(id, 470, y); text(ITEMS[id].n, 530, y, 32, '#fff', 'left', '800'); text('持有 ' + (G.bag[id] || 0), 900, y, 24, '#dfe8ff', 'right', '700'); text('★ ' + ITEMS[id].price, 1200, y, 32, G.stars >= ITEMS[id].price ? '#ffd23a' : '#ff8a8a', 'right', '900'); });
  if (u.idx < ITEM_ORDER.length) wrapText(ITEMS[ITEM_ORDER[u.idx]].d, 380, 790, 840, 24, 34, '#dfe8ff', '500');
}
// ---------- 错题本与统计 ----------
function statsRows() {
  const rows = Object.keys(G.mstats).map(kp => ({ kp, n: G.mstats[kp].n, ok: G.mstats[kp].ok, info: MathQ.KP[kp] })).filter(r => r.info);
  rows.sort((a, b) => (a.ok / a.n) - (b.ok / b.n));
  return rows;
}
function statsInput(k) {
  const u = G.statsUI;
  if (k === 'cancel') { G.statsUI = null; return; }
  if (k === 'left' || k === 'right') { u.tab = 1 - u.tab; u.idx = 0; AudioSys.sfx('move'); return; }
  const n = u.tab === 0 ? statsRows().length : G.wrongBook.length;
  if (k === 'up') u.idx = Math.max(0, u.idx - 1); if (k === 'down') u.idx = Math.min(Math.max(0, n - 1), u.idx + 1);
  if ((k === 'hint' || k === 'replay') && u.tab === 1 && G.wrongBook[u.idx]) { openTutor(G.wrongBook[u.idx], null); return; }
  if (k === 'ok') {
    const kp = u.tab === 0 ? (statsRows()[u.idx] || {}).kp : (G.wrongBook[u.idx] || {}).kp;
    if (!kp) return;
    const back = { ...u }; G.statsUI = null;
    startQuiz({ source: 'review', count: 3, need: 2, kp, title: '同类题练习：' + MathQ.KP[kp].n, sub: '针对这个知识点再练 3 题，答对 2 题可获得 ★3 奖励！' }, res => { if (res.pass) { addStars(3); toast('练习通过！奖励 ★3'); } G.statsUI = back; });
  }
}
function drawStatsUI() {
  const u = G.statsUI; drawUIBackdrop('title_bg', 'rgba(8,14,40,0.78)'); beginUI();
  ['知识点统计', '错题本 (' + G.wrongBook.length + ')'].forEach((s, i) => { const x = 60 + i * 300, sel = u.tab === i; rrect(x, 30, 280, 64, 32, sel ? 'rgba(255,200,90,0.9)' : 'rgba(255,255,255,0.1)', sel ? '#fff' : 'rgba(255,255,255,0.3)', 2); text(s, x + 140, 63, 28, sel ? '#3a1d00' : '#fff', 'center', '900'); });
  const acc = G.totalQ ? Math.round((G.totalOK || 0) / G.totalQ * 100) : 0;
  text('总答题 ' + (G.totalQ || 0) + '　正确率 ' + acc + '%　最高连对 ' + (G.bestStreak || 0) + '　★ ' + G.stars + '　徽章 ' + Object.keys(G.flags.badges).length + '/7　探索 ' + exploredPct() + '%', 1390, 63, 22, '#dfe8ff', 'right', '700');
  if (u.tab === 0) {
    const rows = statsRows();
    glass(50, 120, 1500, 720, 30, true, 'rgba(127,240,226,0.8)');
    if (!rows.length) { text('还没有答题记录。去战斗、开宝箱、挑战算术大师吧！', 800, 480, 34, '#fff', 'center', '800'); }
    const per = 11, s0 = clamp(u.idx - 5, 0, Math.max(0, rows.length - per));
    rows.slice(s0, s0 + per).forEach((r, j) => {
      const i = s0 + j, y = 170 + j * 60, p = r.ok / r.n, sel = i === u.idx;
      if (sel) selBar(70, y - 26, 1460, 52);
      text((r.info.c ? '★竞赛 ' : r.info.g + '年级 ') + r.info.n, 100, y, 26, '#fff', 'left', '800');
      rrect(640, y - 12, 600, 24, 12, 'rgba(255,255,255,0.12)'); rrect(640, y - 12, Math.max(24, 600 * p), 24, 12, p >= 0.8 ? '#3ad66e' : p >= 0.5 ? '#f0b020' : '#e8543a');
      text(Math.round(p * 100) + '%', 1270, y, 26, '#fff', 'left', '900'); text(r.ok + '/' + r.n, 1500, y, 24, '#aab8dd', 'right', '700');
    });
    text('按正确率从低到高排列：越靠前越需要加强。系统会自动多出你薄弱的知识点。　Z 同类题练习　←→ 切换　X 返回', 800, 870, 21, '#aab8dd', 'center', '600');
  } else {
    const W0 = G.wrongBook;
    glass(50, 120, 620, 720, 30, true, 'rgba(255,120,120,0.8)');
    if (!W0.length) text('错题本是空的，太棒了！', 360, 480, 32, '#fff', 'center', '800');
    const per = 11, s0 = clamp(u.idx - 5, 0, Math.max(0, W0.length - per));
    W0.slice(s0, s0 + per).forEach((w, j) => { const i = s0 + j, y = 170 + j * 60, sel = i === u.idx; if (sel) selBar(66, y - 26, 588, 52); text((w.fixed ? '✔ ' : '✘ ') + w.kpName, 90, y, 24, w.fixed ? '#7dfc9e' : '#ffb0b0', 'left', '800'); text('错 ' + w.count + ' 次', 640, y, 22, '#dfe8ff', 'right', '700'); });
    const w = W0[u.idx];
    glass(690, 120, 860, 720, 30, false, 'rgba(255,120,120,0.8)');
    if (w) {
      text(w.grade + ' 年级' + (w.comp ? ' · 竞赛题' : '') + ' · ' + w.kpName, 730, 170, 24, '#8a4a4a', 'left', '800');
      const qn = mathWrapCount(w.q, 780, 32);
      mathWrap(w.q, 730, 230, w.fig ? 500 : 780, 32, 46, '#1b2440', '800');
      if (w.fig) { rrect(1250, 200, 270, 240, 20, 'rgba(80,150,255,0.08)'); drawFig(w.fig, 1385, 320, 250, 220); }
      const yA = Math.max(470, 230 + qn * 46 + 30);
      mathText('正确答案：' + w.answer, 730, yA, 32, '#1a8a4a', 'left', '900');
      mathWrap('解析：' + w.exp, 730, yA + 60, 780, 26, 40, '#3a4870', '600');
      text(w.fixed ? '已在之后答对，掌握啦！按 H 再看星老师讲解' : '还没掌握：按 H 看星老师动画讲解，按 Z 做同类题练习', 730, 800, 22, w.fixed ? '#1a8a4a' : '#c0402a', 'left', '800');
    }
    text('←→ 切换　↑↓ 选择　H 动画讲解　Z 同类题练习　X 返回', 800, 870, 21, '#aab8dd', 'center', '600');
  }
}
function mathWrapCount(s, maxW, size) { const toks = String(s).match(/\{\d+\/\d+\}|[A-Za-z0-9.]+|./gu) || []; let n = 1, line = ''; for (const t of toks) { if (mathTextWidth(line + t, size, '800') > maxW && line) { n++; line = t; } else line += t; } return n; }
// ---------- 年级与竞赛设置 ----------
function gradeInput(k) {
  const u = G.gradeUI;
  if (k === 'up' || k === 'down') u.row = 1 - u.row;
  if (k === 'left') { if (u.row === 0) u.grade = Math.max(1, u.grade - 1); else u.comp = !u.comp; AudioSys.sfx('move'); }
  if (k === 'right') { if (u.row === 0) u.grade = Math.min(6, u.grade + 1); else u.comp = !u.comp; AudioSys.sfx('move'); }
  if (k === 'cancel' && !u.setup) { G.gradeUI = null; return; }
  if (k === 'ok') { G.grade = u.grade; G.comp = u.comp; G.gradeUI = null; AudioSys.sfx('confirm'); if (u.setup) { G.scene = 'starter'; G.starterIdx = 0; } else toast('已切换为 ' + G.grade + ' 年级' + (G.comp ? '，竞赛模式开启' : '')); }
}
function drawGradeUI() {
  const u = G.gradeUI; drawUIBackdrop('title_bg', 'rgba(10,20,52,0.6)'); beginUI();
  glass(200, 60, 1200, 780, 40, true, 'rgba(255,200,90,0.9)');
  text(u.setup ? '选择你的年级' : '年级与竞赛设置', 800, 130, 54, '#fff', 'center', '900', 'middle', true);
  text('题目会按人教版对应年级的知识点出题，并根据你的答题情况自动调整难度。', 800, 195, 26, '#dfe8ff', 'center', '600');
  for (let g = 1; g <= 6; g++) {
    const x = 800 + (g - 3.5) * 170, y = 330, sel = g === u.grade, focus = u.row === 0;
    const sc = sel ? 1.1 + Math.sin(NOW * 4) * 0.02 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    rrect(-70, -80, 140, 160, 28, sel ? 'rgba(255,200,90,0.95)' : 'rgba(255,255,255,0.1)', sel && focus ? '#fff' : 'rgba(255,255,255,0.35)', sel ? 4 : 2);
    text(String(g), 0, -15, 72, sel ? '#3a1d00' : '#fff', 'center', '900'); text('年级', 0, 50, 26, sel ? '#3a1d00' : '#dfe8ff', 'center', '800');
    ctx.restore();
  }
  const kps = MathQ.GRADE_KPS[u.grade] || [];
  text('本年级知识点：' + kps.map(k => MathQ.KP[k].n).join('、'), 800, 470, 24, '#ffe9a0', 'center', '700');
  const cy = 580, focus = u.row === 1;
  rrect(400, cy - 50, 800, 100, 50, focus ? 'rgba(255,200,90,0.25)' : 'rgba(255,255,255,0.06)', focus ? '#fff' : 'rgba(255,255,255,0.3)', focus ? 3 : 2);
  text('竞赛模式', 450, cy, 36, '#fff', 'left', '900');
  text(u.comp ? '开启：竞赛题更多，奖励×3' : '关闭：以课本题为主', 690, cy, 24, '#dfe8ff', 'left', '700');
  rrect(1080, cy - 26, 96, 52, 26, u.comp ? '#3ad66e' : 'rgba(255,255,255,0.25)'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(u.comp ? 1150 : 1106, cy, 21, 0, 6.28); ctx.fill();
  text('↑↓ 切换行　←→ 调整　Z/回车 确定' + (u.setup ? '' : '　X 返回'), 800, 760, 28, '#7ff0e2', 'center', '800');
}
// ---------- 幸运转盘 ----------
const WHEEL_PRIZES = [['★5', g => addStars(5)], ['捕获球×3', g => g.bag.ball += 3], ['提示卡×2', g => g.bag.hintcard += 2], ['高级球×1', g => g.bag.superball += 1], ['双倍经验', g => g.doubleExp = Math.max(g.doubleExp, 3)], ['★10', g => addStars(10)], ['回复药×3', g => g.bag.potion += 3], ['复活草×1', g => g.bag.revive += 1]];
function openWheel(after) { G.wheel = { a: Math.random() * 6.28, v: 0, state: 'ready', t: 0, after }; AudioSys.sfx('gold'); }
function wheelInput(k) {
  const Wh = G.wheel; if (k !== 'ok') return;
  if (Wh.state === 'ready') { Wh.state = 'spin'; Wh.v = 14 + Math.random() * 6; }
  else if (Wh.state === 'done' && Wh.t > 0.5) { G.wheel = null; if (Wh.after) Wh.after(); }
}
function updateWheel(dt) {
  const Wh = G.wheel; if (!Wh) return; Wh.t += dt;
  if (Wh.state === 'spin') { const prev = Math.floor(Wh.a / (6.28 / 8)); Wh.a += Wh.v * dt; Wh.v *= Math.pow(0.45, dt); if (Math.floor(Wh.a / (6.28 / 8)) !== prev) AudioSys.sfx('tick'); if (Wh.v < 0.25) { Wh.state = 'done'; Wh.t = 0; const n = WHEEL_PRIZES.length, seg = 6.28318 / n; const idx = ((Math.floor(((-Math.PI / 2 - Wh.a) % 6.28318 + 6.28318 * 4) % 6.28318 / seg)) % n + n) % n; Wh.prize = idx; WHEEL_PRIZES[idx][1](G); AudioSys.sfx('wheel'); } }
}
function drawWheel() {
  const Wh = G.wheel; beginUI(); ctx.fillStyle = 'rgba(5,10,30,0.6)'; ctx.fillRect(-400, -200, 2400, 1300);
  text('幸运转盘', 800, 80, 56, '#ffd23a', 'center', '900', 'middle', true);
  const n = WHEEL_PRIZES.length, seg = 6.28318 / n, cx = 800, cy = 460, r = 300;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Wh.a);
  WHEEL_PRIZES.forEach((p, i) => { ctx.fillStyle = ['#ff6a4a', '#ffb84a', '#4ad08a', '#5aa0ff', '#b98cff', '#ff7aa2', '#4ad0d0', '#f0d040'][i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, i * seg, (i + 1) * seg); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); ctx.save(); ctx.rotate(i * seg + seg / 2); text(p[0], r * 0.62, 0, 28, '#fff', 'center', '900', 'middle', true); ctx.restore(); });
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, 6.28); ctx.fill(); text('★', cx, cy, 50, '#ffb020', 'center', '900');
  ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.moveTo(cx - 26, cy - r - 30); ctx.lineTo(cx + 26, cy - r - 30); ctx.lineTo(cx, cy - r + 20); ctx.closePath(); ctx.fill();
  text(Wh.state === 'ready' ? '按 Z 转动转盘！' : Wh.state === 'spin' ? '转呀转……' : '获得：' + WHEEL_PRIZES[Wh.prize][0] + '！按 Z 继续', 800, 830, 38, '#fff', 'center', '900', 'middle', true);
}
// ---------- 加载 / 标题 / 初始灵兽 ----------
function drawLoading() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0c1430'; ctx.fillRect(0, 0, CW, CH); beginUI();
  text('灵兽冒险', 800, 380, 80, '#fff', 'center', '900');
  const k = assetsDone / ASSET_TOTAL; rrect(500, 470, 600, 16, 8, 'rgba(255,255,255,0.15)'); rrect(500, 470, Math.max(16, 600 * k), 16, 8, '#7ff0e2');
  text('正在加载高清美术资源… ' + Math.round(k * 100) + '%', 800, 530, 26, '#aab8dd', 'center', '600');
}
const TITLE_FX = []; for (let i = 0; i < 40; i++) TITLE_FX.push({ x: Math.random() * 1600, y: Math.random() * 900, s: 0.5 + Math.random(), ph: Math.random() * 6.28, c: ['#ffd1e0', '#ffc0d4', '#fff1c4', '#d8ffb0'][i % 4] });
let LOGO_C = null;
function getLogo(us) {
  if (LOGO_C && LOGO_C._s === us) return LOGO_C;
  const c = document.createElement('canvas'); c.width = Math.ceil(1200 * us); c.height = Math.ceil(380 * us); c._s = us;
  const g = c.getContext('2d'); g.scale(us, us); g.translate(600, 165);
  g.font = '900 150px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(255,190,80,0.8)'; g.shadowBlur = 40; g.lineWidth = 30; g.strokeStyle = '#13265e'; g.strokeText('灵兽冒险', 0, 0); g.shadowBlur = 0;
  g.lineWidth = 12; g.strokeStyle = '#e8f6ff'; g.strokeText('灵兽冒险', 0, 0);
  const tg = g.createLinearGradient(0, -70, 0, 70); tg.addColorStop(0, '#fff6a8'); tg.addColorStop(0.45, '#ffc93a'); tg.addColorStop(1, '#ff7a1a'); g.fillStyle = tg; g.fillText('灵兽冒险', 0, 0);
  g.font = '800 46px ' + FONT; g.lineWidth = 12; g.strokeStyle = '#13265e'; g.strokeText('—  翠风之旅 · 数学大冒险  —', 0, 118); g.fillStyle = '#ffffff'; g.fillText('—  翠风之旅 · 数学大冒险  —', 0, 118);
  LOGO_C = c; return c;
}
function titleOptions() { const o = []; if (hasSave()) o.push({ n: '继续冒险', f: () => { loadGame(); } }); o.push({ n: '新的冒险', f: () => newGame() }); return o; }
function drawTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const im = IMG.title_bg;
  if (im) { const z = 1.06 + Math.sin(NOW * 0.08) * 0.03, sc = Math.max(CW / im.width, CH / im.height) * z; ctx.drawImage(im, (CW - im.width * sc) / 2 + Math.sin(NOW * 0.05) * CW * 0.012, (CH - im.height * sc) / 2, im.width * sc, im.height * sc); }
  else { ctx.fillStyle = '#6ec6ff'; ctx.fillRect(0, 0, CW, CH); }
  const vg = ctx.createLinearGradient(0, 0, 0, CH); vg.addColorStop(0, 'rgba(10,20,50,0.35)'); vg.addColorStop(0.35, 'rgba(10,20,50,0)'); vg.addColorStop(0.75, 'rgba(10,20,50,0)'); vg.addColorStop(1, 'rgba(10,20,50,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, CW, CH);
  beginUI();
  TITLE_FX.forEach(p => { const x = (p.x + NOW * 40 * p.s) % 1700 - 50, y = (p.y + NOW * 22 * p.s + Math.sin(NOW + p.ph) * 20) % 950 - 25; ctx.save(); ctx.translate(x, y); ctx.rotate(NOW * p.s + p.ph); ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(NOW * 1.7 + p.ph))); ctx.fillStyle = p.c; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(0, 0, 9 * p.s, 5 * p.s, 0, 0, 6.28); ctx.fill(); ctx.restore(); });
  // 漂浮的数学符号
  ['+', '−', '×', '÷', '=', '½', 'π'].forEach((s, i) => { const x = 140 + i * 220 + Math.sin(NOW * 0.7 + i) * 30, y = 520 + Math.sin(NOW * 1.1 + i * 2) * 40; ctx.globalAlpha = 0.35; text(s, x, y, 70, '#ffffff', 'center', '900', 'middle', true); ctx.globalAlpha = 1; });
  const L = getLogo(uiScale()); ctx.drawImage(L, 200, 30 + Math.sin(NOW * 1.5) * 6, 1200, 380);
  const opts = titleOptions(); G.titleIdx = Math.min(G.titleIdx, opts.length - 1);
  const ph = 50 + opts.length * 78; glass(590, 560, 420, ph, 32, true, 'rgba(255,200,90,0.9)');
  opts.forEach((o, i) => { const y = 600 + i * 78; if (i === G.titleIdx) { selBar(615, y - 30, 370, 60); arrow(645, y); } text(o.n, 800, y + 1, 38, '#fff', 'center', '800', 'middle', true); });
  text(AudioSys.started ? '♪ 原创配乐播放中' : '按任意键开始（开启音乐）', 800, 560 + ph + 36, 24, '#ffffff', 'center', '600', 'middle', 'rgba(0,0,0,0.6)');
  drawHint('↑↓ 选择　Z/回车 确认　V 静音　F 全屏');
}
function drawStarter() {
  drawUIBackdrop('title_bg', 'rgba(20,30,60,0.45)'); beginUI();
  glass(250, 34, 1100, 76, 38, true, 'rgba(255,200,90,0.9)');
  text('林教授：请从这三只灵兽中，选择你的第一位伙伴！', 800, 73, 34, '#fff', 'center', '800', 'middle', true);
  STARTERS.forEach((sp, i) => {
    const x = 310 + i * 490, sel = i === G.starterIdx, c = TYPES[SPECIES[sp].t].c, lift = sel ? -16 : 0;
    ctx.save(); ctx.globalAlpha = sel ? 1 : 0.82;
    glass(x - 210, 140 + lift, 420, 480, 36, !sel, c);
    const g = ctx.createRadialGradient(x, 380 + lift, 10, x, 380 + lift, 230); g.addColorStop(0, lighten(c, sel ? 0.55 : 0.75)); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 205, 145 + lift, 410, 380);
    if (sel) rrect(x - 210, 140 + lift, 420, 480, 36, null, '#ffb04a', 5);
    shadowEllipse(ctx, x, 470 + lift, 130, 26, 0.35);
    drawCreature(ctx, sp, x, 470 + lift - (sel ? Math.abs(Math.sin(NOW * 3)) * 14 : 0), sel ? 330 : 280, { breathe: true, phase: i });
    text(SPECIES[sp].n, x, 528 + lift, 44, sel ? '#1b2440' : '#fff', 'center', '900');
    typeBadge(SPECIES[sp].t, x - 55, 562 + lift, 110, 42);
    // 进化预览
    ctx.restore();
  });
  glass(110, 660, 1380, 190, 32, true, 'rgba(127,240,226,0.9)');
  const sp = SPECIES[STARTERS[G.starterIdx]];
  if (G.starterConfirm) { text('确定选择 ' + sp.n + ' 作为你的伙伴吗？', 160, 728, 40, '#fff', 'left', '800', 'middle', true); text('Z/回车 确定　　X/Esc 再想想', 160, 796, 32, '#ffcf5a', 'left', '700'); }
  else { text(sp.n + '（' + TYPES[sp.t].n + '属性）→ Lv.' + sp.evoLvl + ' 进化为 ' + SPECIES[sp.evoTo].n + ' → ' + SPECIES[SPECIES[sp.evoTo].evoTo].n, 160, 712, 34, '#fff', 'left', '800', 'middle', true); wrapText(sp.d, 160, 780, 1300, 30, 42, '#dfe8ff', '500'); }
  drawHint('←→ 选择　Z/回车 确认');
}
function drawTransition() {
  if (!G.trans) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const t = G.trans > 0 ? G.trans : -G.trans;
  const k = G.trans > 0 ? clamp(t / 1.2, 0, 1) : clamp(t / 0.6, 0, 1);
  const a = G.trans > 0 ? (k > 0.5 ? (k - 0.5) * 2 : 1 - k * 2) : k;
  ctx.fillStyle = 'rgba(8,10,24,' + clamp(G.trans > 0 ? Math.max(0, (k - 0.55) / 0.45) : k, 0, 1) + ')'; ctx.fillRect(0, 0, CW, CH);
  if (G.trans > 0 && k < 0.6) { ctx.save(); ctx.translate(CW / 2, CH / 2); ctx.rotate(k * 6); const n = 12; for (let i = 0; i < n; i++) { ctx.rotate(6.28 / n); ctx.fillStyle = i % 2 ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Math.max(CW, CH) * (1 - k / 0.6) * 1.2 + 1, 0, 0.26); ctx.closePath(); ctx.globalAlpha = 1 - (1 - k / 0.6) * 0.3; ctx.fill(); } ctx.restore(); }
}
