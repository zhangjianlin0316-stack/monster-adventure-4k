'use strict';
// ================== 主程序：状态、输入、大地图逻辑、存档、主循环 ==================
const SAVE_KEY = 'lingshou_adventure_save_v3';
genWorld();
const G = {
  scene: 'loading', titleIdx: 0, starterIdx: 0, starterConfirm: false,
  player: { x: SPAWN.x, y: SPAWN.y, dir: 'up', moving: false, fx: 0, fy: 0, prog: 0, run: false },
  party: [], box: [], bag: { ball: 5, superball: 0, potion: 3, superpotion: 0, revive: 0, hintcard: 2 }, stars: 0,
  flags: { gates: {}, objs: {}, badges: {}, dex: {} }, grade: 3, comp: false, mstats: {}, wrongBook: [], streak: 0, bestStreak: 0, totalQ: 0, totalOK: 0, doubleExp: 0,
  explored: new Uint8Array(W * H), recentBank: [],
  dialog: null, choice: null, menu: null, partyUI: null, bagUI: null, shopUI: null, mapUI: false, statsUI: null, gradeUI: null, quiz: null, wheel: null, evo: null,
  toast: null, trans: 0, battle: null, held: [], lastCenter: { x: SPAWN.x, y: SPAWN.y }, volShow: 0, fadeIn: 0, pendingEnc: null, moveCD: 0
};
function cleanMon(m) { const o = { sp: m.sp, lvl: m.lvl, xp: m.xp, hp: m.hp, moves: m.moves.map(x => ({ id: x.id, pp: x.pp })), status: null, evoReady: !!m.evoReady }; return o; }
function healAll() { G.party.forEach(healMon); }
function newGame() {
  genWorld(); CHUNKS.clear(); MINI = null; FOG_DIRTY = true;
  Object.assign(G, { party: [], box: [], bag: { ball: 5, superball: 0, potion: 3, superpotion: 0, revive: 0, hintcard: 2 }, stars: 0, flags: { gates: {}, objs: {}, badges: {}, dex: {} }, mstats: {}, wrongBook: [], streak: 0, bestStreak: 0, totalQ: 0, totalOK: 0, doubleExp: 0, explored: new Uint8Array(W * H) });
  G.player = { x: SPAWN.x, y: SPAWN.y, dir: 'up', moving: false, fx: 0, fy: 0, prog: 0, run: false };
  G.lastCenter = { x: SPAWN.x, y: SPAWN.y };
  G.gradeUI = { grade: G.grade, comp: G.comp, row: 0, setup: true }; G.scene = 'grade';
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveGame() {
  const ex = Array.from(G.explored).join('');
  const d = { v: 3, player: { x: G.player.x, y: G.player.y, dir: G.player.dir }, party: G.party.map(cleanMon), box: G.box.map(cleanMon), bag: G.bag, stars: G.stars, flags: G.flags, grade: G.grade, comp: G.comp, mstats: G.mstats, wrongBook: G.wrongBook, streak: G.streak, bestStreak: G.bestStreak, totalQ: G.totalQ, totalOK: G.totalOK, doubleExp: G.doubleExp, explored: ex, lastCenter: G.lastCenter };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
}
function loadGame() {
  let d; try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
  if (!d || !d.party || !d.party.length) return false;
  genWorld(); CHUNKS.clear(); MINI = null;
  Object.assign(G, { party: d.party, box: d.box || [], bag: Object.assign({ ball: 0, superball: 0, potion: 0, superpotion: 0, revive: 0, hintcard: 0 }, d.bag), stars: d.stars || 0, flags: Object.assign({ gates: {}, objs: {}, badges: {}, dex: {} }, d.flags), grade: d.grade || 3, comp: !!d.comp, mstats: d.mstats || {}, wrongBook: d.wrongBook || [], streak: d.streak || 0, bestStreak: d.bestStreak || 0, totalQ: d.totalQ || 0, totalOK: d.totalOK || 0, doubleExp: d.doubleExp || 0, lastCenter: d.lastCenter || { x: SPAWN.x, y: SPAWN.y } });
  G.explored = new Uint8Array(W * H); if (d.explored) for (let i = 0; i < Math.min(d.explored.length, W * H); i++) G.explored[i] = d.explored.charCodeAt(i) === 49 ? 1 : 0;
  FOG_DIRTY = true;
  G.party.forEach(m => { m.dhp = m.hp; });
  GATES.forEach(g => { if (G.flags.gates[g.id]) applyGateOpen(g); });
  G.player = { x: d.player.x, y: d.player.y, dir: d.player.dir || 'down', moving: false, fx: d.player.x, fy: d.player.y, prog: 0, run: false };
  W_CAM.init = false; G.scene = 'world'; G.battle = null; G.trans = 0; G.fadeIn = 1;
  return true;
}
// ---------- 输入 ----------
const KEYMAP = { r: 'replay', R: 'replay', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', X: 'cancel', Escape: 'cancel', Backspace: 'cancel', '1': '1', '2': '2', '3': '3', '4': '4', h: 'hint', H: 'hint', m: 'map', M: 'map', q: 'stats', Q: 'stats' };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
window.addEventListener('keydown', e => {
  AudioSys.unlock();
  if (e.key === 'Shift') { G.player.run = true; return; }
  if (e.key === 'f' || e.key === 'F') { toggleFS(); e.preventDefault(); return; }
  if (e.key === 'v' || e.key === 'V') { AudioSys.setMuted(!AudioSys.muted); G.volShow = 1.6; return; }
  if (e.key === '-' || e.key === '_') { AudioSys.setVol(AudioSys.vol - 0.1); G.volShow = 1.6; return; }
  if (e.key === '=' || e.key === '+') { AudioSys.setVol(AudioSys.vol + 0.1); G.volShow = 1.6; return; }
  const k = KEYMAP[e.key]; if (!k) return;
  e.preventDefault();
  if (DIRS[k] && !G.held.includes(k)) G.held.push(k);
  if (e.repeat && !DIRS[k]) return;
  onPress(k);
});
window.addEventListener('keyup', e => { if (e.key === 'Shift') G.player.run = false; const k = KEYMAP[e.key]; if (k) G.held = G.held.filter(h => h !== k); });
window.addEventListener('blur', () => { G.held = []; G.player.run = false; });
function toggleFS() { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); }
function toUI(ev) { const s = uiScale(); return [(ev.clientX * DPR - (CW - 1600 * s) / 2) / s, (ev.clientY * DPR - (CH - 900 * s) / 2) / s]; }
cv.addEventListener('mousemove', ev => { if (G.quiz) { const [x, y] = toUI(ev); quizPointer(x, y, false); } });
cv.addEventListener('mousedown', ev => {
  AudioSys.unlock();
  const b = topButtons(), px = ev.clientX * DPR, py = ev.clientY * DPR;
  if (Math.hypot(px - b.snd.x, py - b.snd.y) < b.snd.r) { AudioSys.setMuted(!AudioSys.muted); G.volShow = 1.6; return; }
  if (Math.hypot(px - b.fs.x, py - b.fs.y) < b.fs.r) { toggleFS(); return; }
  if (G.tutor) { const [x, y] = toUI(ev); tutorPointer(x, y); return; }
  if (G.quiz) { const [x, y] = toUI(ev); quizPointer(x, y, true); return; }
  if (G.dialog || (G.scene === 'battle' && G.battle && G.battle.mode === 'queue') || G.scene === 'evolve' || G.wheel || G.scene === 'title') onPress('ok');
});
function onPress(k) {
  if (G.tutor) return tutorInput(k);
  if (G.quiz) return quizInput(k);
  if (G.trans > 0.3 && G.scene === 'battle') return;
  if (G.gradeUI) return gradeInput(k);
  switch (G.scene) {
    case 'loading': return;
    case 'title': { const o = titleOptions(); if (k === 'up') G.titleIdx = (G.titleIdx + o.length - 1) % o.length; if (k === 'down') G.titleIdx = (G.titleIdx + 1) % o.length; if (k === 'ok') { AudioSys.sfx('confirm'); o[G.titleIdx].f(); } return; }
    case 'starter': return starterInput(k);
    case 'evolve': return evoInput(k);
    case 'battle': if (G.choice) return choiceInput(k); return battleInput(k);
  }
  if (G.wheel) return wheelInput(k);
  if (G.choice) return choiceInput(k);
  if (G.dialog) return dialogInput(k);
  if (G.shopUI) return shopInput(k);
  if (G.statsUI) return statsInput(k);
  if (G.mapUI) { if (k === 'map' || k === 'cancel' || k === 'ok') G.mapUI = false; return; }
  if (G.partyUI) return partyInput(k);
  if (G.bagUI) return bagInput(k);
  if (G.menu) return menuInput(k);
  if (G.pendingEnc || G.player.moving) { if (k === 'ok' || k === 'cancel') G.queued = k; return; }
  if (k === 'ok') interact();
  else if (k === 'cancel') { G.menu = { idx: 0, t0: NOW }; AudioSys.sfx('confirm'); }
  else if (k === 'map') G.mapUI = true;
  else if (k === 'stats') G.statsUI = { tab: G.wrongBook.length ? 1 : 0, idx: 0 };
}
function starterInput(k) {
  if (G.starterConfirm) {
    if (k === 'ok') {
      const sp = STARTERS[G.starterIdx]; const m = makeMon(sp, 5); m.dhp = m.hp; G.party = [m]; G.flags.dex[sp] = 1; G.starterConfirm = false;
      G.scene = 'world'; W_CAM.init = false; G.fadeIn = 1; markExplored(G.player.x, G.player.y);
      say(['林教授：' + SPECIES[sp].n + '看起来很喜欢你！', '林教授：在这个世界里，数学就是力量！每次出招都要答一道数学题——答对了，招式威力大增；连续答对还会触发连击！', '林教授：' + SPECIES[sp].n + '升到 Lv.' + SPECIES[sp].evoLvl + ' 时就能挑战「进化试炼」，变身成更强大的形态！', '林教授：世界上有七个地区，被数学之门和断桥连接。按 M 打开地图，去探索吧！', '林教授：先送你 2 张提示卡（答题时按 H 去掉两个错误选项）。祝你好运！']);
      saveGame();
    }
    if (k === 'cancel') G.starterConfirm = false;
    return;
  }
  if (k === 'left') { G.starterIdx = (G.starterIdx + 2) % 3; AudioSys.sfx('move'); }
  if (k === 'right') { G.starterIdx = (G.starterIdx + 1) % 3; AudioSys.sfx('move'); }
  if (k === 'ok') { G.starterConfirm = true; AudioSys.sfx('confirm'); }
  if (k === 'cancel') { G.gradeUI = { grade: G.grade, comp: G.comp, row: 0, setup: true }; }
}
// ---------- 大地图逻辑 ----------
function objAt(x, y) { return OBJS.find(o => o.x === x && o.y === y && !((o.type === 'chest' || o.type === 'gold') && G.flags.objs[o.id])); }
function gateAt(x, y) { return GATES.find(g => !G.flags.gates[g.id] && g.tiles.some(([a, b]) => a === x && b === y)); }
function walkable(x, y) {
  if (!inMap(x, y)) return false;
  const t = MAP[y][x];
  if (!PASSABLE.has(t) || t === T.GATE || t === T.BRIDGEX || t === T.STONE || t === T.DOOR) return false;
  return !objAt(x, y);
}
function applyGateOpen(g) {
  g.tiles.forEach(([x, y]) => { const t = MAP[y][x]; MAP[y][x] = t === T.GATE ? T.PATH : t === T.BRIDGEX ? T.BRIDGE : T.GROUND; invalidateChunksAt(x, y); });
  MINI = null;
}
function openGate(g) { G.flags.gates[g.id] = 1; applyGateOpen(g); AudioSys.sfx('gate'); }
function townAt(x, y) { return TOWNS.find(t => Math.abs(x - t.x) <= 8 && Math.abs(y - t.y) <= 7); }
function worldSong() { const p = G.player; return townAt(p.x, p.y) ? 'town' : curRegion().song; }
function musicFor() {
  if (G.scene === 'loading') return null;
  if (G.scene === 'title' || G.scene === 'starter' || G.scene === 'grade') return 'title';
  if (G.scene === 'evolve') return 'evolve';
  if (G.scene === 'battle' && G.battle) return G.battle.victory ? 'victory' : (G.trans > 0.9 ? null : G.battle.trainer ? 'trainer' : 'battle');
  if (G.quiz && G.quiz.opts.count > 1) return 'quiz';
  return worldSong();
}
function regionTheme() { return curRegion().theme; }
function interact() {
  const p = G.player, [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy;
  const o = objAt(x, y); if (o) return interactObj(o);
  const g = gateAt(x, y); if (g) return interactGate(g);
  if (tileAt(x, y) === T.SIGN) { say((SIGNS[x + ',' + y] || '……').split('\n')); return; }
  if (tileAt(x, y) === T.DOOR) return doorAction(x, y);
  if (tileAt(x, y) === T.WATER) toast('清澈的湖水，倒映着天空。');
}
function interactGate(g) {
  const desc = { gate: '一扇刻满算式的石门挡住了去路。', bridge: '桥断了，桥头的石板上写着数学题。', stone: '一块发光的谜题石挡住了入口，上面刻着奇怪的符号。' }[g.type];
  openChoice(g.name + '：' + desc + '\n答对 ' + g.n + ' 题中的 ' + g.need + ' 题即可通过（主题：' + MathQ.TAG_NAME[g.theme] + '）', ['挑战', '离开'], i => {
    if (i) return;
    startQuiz({ source: 'gate', count: g.n, need: g.need, theme: g.theme, title: g.name, sub: desc + '答对 ' + g.need + ' 题就能' + (g.type === 'bridge' ? '修好断桥' : g.type === 'stone' ? '移开谜题石' : '打开石门') + '！' }, res => {
      if (res.pass) { openGate(g); addStars(5); say([g.name + (g.type === 'bridge' ? '的木板一块块拼好了！' : g.type === 'stone' ? '缓缓沉入地下，露出了一条小路！' : '轰隆隆地打开了！'), '获得 ★5！' + (g.secret ? '这里好像通往一个秘密地点……' : '新的地区在等着你！')]); }
      else say('还差一点！复习一下解析，再来挑战吧。');
    });
  });
}
function rewardText(r) { return r.map(([k, n]) => k === 'stars' ? '★' + n : ITEMS[k].n + '×' + n).join('、'); }
function give(r) { r.forEach(([k, n]) => { if (k === 'stars') addStars(n); else G.bag[k] = (G.bag[k] || 0) + n; }); }
function interactObj(o) {
  const R = curRegion(), done = G.flags.objs[o.id];
  if (o.type === 'npc') {
    if (o.id === 'prof' && !G.flags.profTalk) { G.flags.profTalk = 1; G.bag.hintcard += 3; say([...(o.lines || []), '林教授：再送你 3 张提示卡，加油！']); return; }
    say(o.lines || ['你好！']); return;
  }
  if (o.type === 'merchant') { say('商人：远道而来辛苦啦！用星星换点补给吧～', () => { G.shopUI = { idx: 0 }; }); return; }
  if (o.type === 'chest') {
    startQuiz({ source: 'chest', count: 1, theme: R.theme, title: '数学宝箱', sub: '答对就能打开宝箱！' }, res => {
      if (res.correct) { const pool = [[['stars', rint(3, 6)], ['ball', 2]], [['stars', 4], ['potion', 2]], [['stars', 5], ['hintcard', 1]], [['stars', 3], ['superball', 1]], [['stars', 6], ['superpotion', 1]]]; const r = pool[rint(0, pool.length - 1)]; give(r); G.flags.objs[o.id] = 1; AudioSys.sfx('chest'); say('宝箱打开了！获得：' + rewardText(r) + '！'); }
      else say('宝箱纹丝不动……看看解析，再试一次吧！');
    }); return;
  }
  if (o.type === 'gold') {
    say('一只金光闪闪的竞赛宝箱！只有答对竞赛题才能打开。', () => startQuiz({ source: 'gold', count: 1, forceComp: true, title: '金色竞赛宝箱', sub: '竞赛难度！答对奖励丰厚。' }, res => {
      if (res.correct) { const r = [['stars', 15], ['superball', 2], ['hintcard', 2], ['revive', 1]]; give(r); G.flags.objs[o.id] = 1; AudioSys.sfx('gold'); say(['金色宝箱打开了！', '获得：' + rewardText(r) + '！'], () => openWheel()); }
      else say('好难的题！宝箱还在这里，随时可以再来挑战。');
    })); return;
  }
  if (o.type === 'stele') {
    if (done) { say('石碑上的文字已经暗淡下来了。'); return; }
    say('古老的谜题石碑上刻着一道题……', () => startQuiz({ source: 'stele', count: 1, theme: 'logic', title: '谜题石碑', sub: '解开石碑上的谜题！' }, res => {
      if (res.correct) { G.flags.objs[o.id] = 1; addStars(4); if (Math.random() < 0.4) say('石碑发出光芒！获得 ★4，还出现了一个幸运转盘！', () => openWheel()); else say('石碑发出光芒！获得 ★4！'); }
      else say('石碑没有反应……再想想吧。');
    })); return;
  }
  if (o.type === 'master') {
    if (G.flags.badges[o.region]) { say(o.name + '：你已经拿到了本地的徽章，继续前进吧！'); return; }
    openChoice(o.name + '：我出 5 道题，你能答对 4 道，就把「' + REGIONS[RIDX[o.region]].n + '徽章」送给你！', ['接受挑战', '下次再说'], i => {
      if (i) return;
      startQuiz({ source: 'master', count: 5, need: 4, theme: REGIONS[RIDX[o.region]].theme, title: o.name + '的考验', sub: '5 道题答对 4 道即可获得徽章和 ★15！' }, res => {
        if (res.pass) { G.flags.badges[o.region] = 1; addStars(15); G.bag.hintcard += 1; say([o.name + '：了不起！这是你应得的徽章！', '获得了「' + REGIONS[RIDX[o.region]].n + '徽章」、★15 和提示卡×1！（徽章 ' + Object.keys(G.flags.badges).length + '/7）'], () => openWheel()); }
        else say(o.name + '：答对了 ' + res.ok + ' 题，还差一点。复习一下再来！');
      });
    }); return;
  }
  if (o.type === 'trainer') {
    if (done) { say(o.name + '：你的数学真厉害，我还要继续修炼！'); return; }
    say([o.name + '：站住！我们来一场数学对决吧！', '（数学对决：每次答对都会压制对手下一次的攻击！）'], () => {
      const team = o.team.map(([sp, lv]) => makeMon(sp, lv)); startBattle(team[0], { trainer: o, team: team.slice(1) });
    }); return;
  }
  if (o.type === 'trophy') {
    const n = Object.keys(G.flags.badges).length;
    if (n >= 7) { if (!done) { G.flags.objs[o.id] = 1; addStars(50); } say(['金星奖杯闪耀着光芒！', '恭喜你集齐了七枚徽章，成为真正的「数学灵兽大师」！获得 ★50！', '（你可以继续探索、收集所有灵兽的进化形态，或者把年级调高接受新挑战！）']); }
    else say('金星奖杯：集齐七位算术大师的徽章才能拿起它。（当前 ' + n + '/7）');
  }
}
function doorAction(x, y) {
  const b = BUILDINGS.find(b => b.door[0] === x && b.door[1] === y); if (!b) return;
  const t = TOWNS.find(t => t.id === b.town);
  if (b.kind === 'center') { healAll(); G.lastCenter = { x, y: y + 1 }; AudioSys.sfx('heal'); saveGame(); say(['护士：欢迎来到' + t.n + '灵兽中心！', '你的灵兽已经完全恢复了！（已自动保存）']); }
  else if (b.kind === 'shop') { say('店员：欢迎光临星星商店！答题获得的星星可以在这里换道具哦。', () => { G.shopUI = { idx: 0 }; }); }
  else { healAll(); say(t.start ? ['妈妈：回来啦？先吃点东西休息一下！', '（全队恢复了体力）', '妈妈：别忘了，遇到难题时多看看错题本（Q 键）！'] : ['屋里的老奶奶给你泡了一杯热茶。', '（全队恢复了体力）']); }
}
function pickWild() {
  const R = curRegion(); const tot = R.pool.reduce((s, e) => s + e[1], 0); let r = Math.random() * tot, sp = R.pool[0][0];
  for (const [id, w] of R.pool) { r -= w; if (r <= 0) { sp = id; break; } }
  return makeMon(sp, rint(R.lv[0], R.lv[1]));
}
function onStep() {
  const p = G.player; markExplored(p.x, p.y);
  const rid = ridAt(p.x, p.y);
  if (rid !== G.lastRid) { if (G.lastRid) { G.regionBanner = REGIONS[RIDX[rid]].n; G.regionShow = NOW; } G.lastRid = rid; G.flags.visited = G.flags.visited || {}; if (!G.flags.visited[rid]) { G.flags.visited[rid] = 1; if (Object.keys(G.flags.visited).length > 1) { addStars(3); toast('发现新地区：' + REGIONS[RIDX[rid]].n + '！★3'); } } }
  if (MAP[p.y][p.x] === T.TALL) {
    RUSTLE.set(p.x + ',' + p.y, NOW); spawnGrassFx(p.x, p.y); AudioSys.sfx('grass');
    if (G.party.some(m => m.hp > 0) && Math.random() < 1 / 9) { G.pendingEnc = { t: 0.7, mon: pickWild() }; AudioSys.sfx('encounter'); G.held = []; }
    else if (Math.random() < 1 / 160) { toast('草丛里藏着一个幸运转盘！'); openWheel(); }
  } else AudioSys.sfx('step');
}
function afterBattleChecks() {
  const c = evoCandidates().find(m => !m._offered);
  if (c) { c._offered = true; offerEvolution(c, afterBattleChecks); return; }
  if (G.pendingWheel) { G.pendingWheel = false; toast('连对 10 题！幸运转盘出现了！'); openWheel(); }
}
function updateWorld(dt) {
  const p = G.player;
  if (G.starPop) G.starPop.t += dt;
  if (G.pendingEnc) { G.pendingEnc.t -= dt; if (G.pendingEnc.t <= 0) { const m = G.pendingEnc.mon; G.pendingEnc = null; startBattle(m); } return; }
  if (G.dialog) { G.dialog.chars += dt * 45; }
  if (G.wheel) updateWheel(dt);
  if (G.dialog || G.choice || G.menu || G.partyUI || G.bagUI || G.shopUI || G.mapUI || G.statsUI || G.gradeUI || G.quiz || G.wheel) { if (!p.moving) return; }
  if (p.moving) {
    p.prog += dt / (p.run ? 0.12 : 0.2);
    if (p.prog >= 1) { p.moving = false; p.prog = 0; onStep(); }
    else return;
  }
  if (G.dialog || G.choice || G.menu || G.partyUI || G.bagUI || G.shopUI || G.mapUI || G.statsUI || G.gradeUI || G.quiz || G.wheel || G.pendingEnc) return;
  if (G.queued) { const k = G.queued; G.queued = null; onPress(k); return; }
  const k = G.held[G.held.length - 1];
  if (!k) return;
  const [dx, dy] = DIRS[k];
  if (p.dir !== k && !p.moving) { p.dir = k; if (G.moveCD <= 0) { G.moveCD = 0.06; return; } }
  G.moveCD -= dt;
  const nx = p.x + dx, ny = p.y + dy;
  if (tileAt(nx, ny) === T.DOOR) { G.held = []; doorAction(nx, ny); return; }
  if (walkable(nx, ny)) { p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.moving = true; p.prog = 0; }
  else if (!G.bumpT || NOW - G.bumpT > 0.35) { G.bumpT = NOW; AudioSys.sfx('bump'); const g = gateAt(nx, ny); if (g && !G.gateHint) { G.gateHint = 1; toast('面对' + g.name + '按 Z 挑战数学题！'); } }
}
// ---------- 主循环 ----------
let lastTS = performance.now(), tintedDone = false;
function update(dt) {
  if (G.freeze && G.battle && G.battle.anim && G.battle.anim.kind === 'move' && G.battle.anim.side === G.freeze.side) { const a = G.battle.anim; if (a.t >= (G.freeze.cut ? a.cut * G.freeze.frac : a.cut + (a.dur - a.cut) * G.freeze.frac)) { G.timeScale = 0; G.freeze = null; } }
  if (G.scene === 'loading' && assetsReady()) { makeTinted(); G.scene = 'title'; G.fadeIn = 1; }
  if (G.volShow > 0) G.volShow -= dt;
  if (G.fadeIn > 0) G.fadeIn = Math.max(0, G.fadeIn - dt * 1.6);
  if (AudioSys.started) { const mu = musicFor(); if (mu && AudioSys.current !== mu) AudioSys.play(mu); }
  if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
  if (G.tutor) { updateTutor(dt); return; }
  updateQuiz(dt);
  if (G.trans > 0) G.trans = Math.max(0, G.trans - dt);
  else if (G.trans < 0) {
    G.trans = Math.min(0, G.trans + dt);
    if (G.trans === 0 && G.battle && G.battle.mode === 'end') { G.battle = null; G.scene = 'world'; G.partyUI = null; G.bagUI = null; G.held = []; G.fadeIn = 1; pClear(); afterBattleChecks(); }
    return;
  }
  if (G.scene === 'world') updateWorld(dt);
  else if (G.scene === 'battle' && G.trans <= 0.45 && !G.quiz) updateBattle(dt);
  else if (G.scene === 'evolve') updateEvo(dt);
}
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  switch (G.scene) {
    case 'loading': drawLoading(); break;
    case 'title': drawTitle(); break;
    case 'grade': drawTitle(); break;
    case 'starter': drawStarter(); break;
    case 'world':
      drawWorld(); drawWorldHUD();
      if (G.dialog) drawDialogBox();
      if (G.menu) drawMenu();
      if (G.partyUI) drawPartyUI();
      if (G.bagUI) drawBagUI();
      if (G.shopUI) drawShopUI();
      if (G.mapUI) drawMapScreen();
      if (G.statsUI) drawStatsUI();
      break;
    case 'battle': drawBattle(); break;
    case 'evolve': drawEvolve(); break;
  }
  if (G.gradeUI) drawGradeUI();
  if (G.quiz) drawQuiz();
  if (G.tutor) drawTutor();
  if (G.choice) drawChoice();
  if (G.wheel) drawWheel();
  if (G.dialog && G.scene !== 'world') drawDialogBox();
  drawTransition();
  if (G.fadeIn > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(8,10,24,' + G.fadeIn + ')'; ctx.fillRect(0, 0, CW, CH); }
  if (G.scene !== 'loading') drawTopButtons();
  drawToast();
}
function loop(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastTS) / 1000)) * (G.timeScale ?? 1); lastTS = ts; NOW += dt; LAST_DT = dt;
  try { update(dt); draw(); } catch (err) { console.error(err); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
// ---------- 自动化测试接口 ----------
window.__game = {
  G, MathQ, SPECIES, MOVES, OBJS, GATES, REGIONS, TOWNS, BUILDINGS, get MAP() { return MAP; },
  press: k => onPress(k),
  answer: correct => { if (!G.quiz) return false; for (let i = 0; i < 4 && G.quiz && G.quiz.phase !== 'ask'; i++) { if (G.tutor) closeTutor(); G.quiz.t = 9; quizContinue(); if (G.tutor) closeTutor(); } if (!G.quiz || G.quiz.phase !== 'ask') return false; const q = G.quiz.q; quizAnswer(correct ? q.ans : (q.ans + 1) % 4); return true; },
  quizState: () => G.quiz && { phase: G.quiz.phase, q: G.quiz.q && G.quiz.q.q, ans: G.quiz.q && G.quiz.q.ans, i: G.quiz.i },
  teleport: (x, y, dir) => { Object.assign(G.player, { x, y, dir: dir || 'down', moving: false, prog: 0 }); W_CAM.init = false; markExplored(x, y); G.lastRid = ridAt(x, y); },
  quickStart: (sp, grade) => { G.grade = grade || 3; G.party = [makeMon(sp || 'fox', 5)]; G.party[0].dhp = G.party[0].hp; G.scene = 'world'; G.gradeUI = null; G.dialog = null; W_CAM.init = false; markExplored(G.player.x, G.player.y); },
  wild: (sp, lv) => { G.dialog = null; startBattle(makeMon(sp, lv)); },
  finishQuiz: () => { for (let i = 0; i < 6 && G.quiz; i++) { if (G.tutor) closeTutor(); G.quiz.t = 9; quizContinue(); if (G.tutor) closeTutor(); } },
  tutor: () => G.tutor && { viz: G.tutor.X.viz, s: G.tutor.s, n: G.tutor.X.steps.length, kp: G.tutor.q.kp },
  tutorFor: (kp, grade, match) => { let q; for (let i = 0; i < 400; i++) { q = MathQ.KP[kp].c ? MathQ.genKP(kp, grade || 4) : MathQ.genKP(kp, 0, i % 2); if (!match || Explain.build(q).viz === match) break; } openTutor(q, null); G.tutor.auto = false; return Explain.build(q).viz; },
  tutorSet: (s, t) => { if (G.tutor) { G.tutor.s = s; G.tutor.t = t; G.tutor.T = 5; } },
  closeTutor: () => closeTutor(),
  evolve: i => { const m = G.party[i || 0]; startEvoCutscene(m); },
  setTime: t => { if (G.evo) { G.evo.t = t - 0.001; } },
  openGate: id => { const g = GATES.find(g => g.id === id); if (g) openGate(g); },
  freezeAt: (side, frac, cut) => { G.freeze = { side, frac, cut }; G.timeScale = 1; },
  resume: () => { G.freeze = null; G.timeScale = 3; },
  ridAt, scene: () => G.scene
};
