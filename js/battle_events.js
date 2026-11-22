'use strict';
// ================== 战斗中的随机趣味事件（多数和数学挂钩）==================
const WX_BOOST = { rain: { water: 1.2, fire: 0.8, n: '大雨' }, sun: { fire: 1.2, water: 0.8, n: '烈日' }, snow: { ice: 1.2, n: '暴雪' }, storm: { electric: 1.2, n: '雷暴' }, petals: { grass: 1.2, n: '花雨' } };
function weatherMul(B, el) { const w = B.wx; if (!w) return 1; return (WX_BOOST[w.kind] || {})[el] || 1; }
const BATTLE_EVENTS = [
  { id: 'weather', w: 3, run: evWeather },
  { id: 'riddle', w: 3, run: evRiddle },
  { id: 'banter', w: 2, run: evBanter },
  { id: 'roulette', w: 3, run: evRoulette },
  { id: 'dance', w: 2, run: evDance },
  { id: 'stars', w: 2, run: evStars },
];
function eventBanner(B, name, sub, c, vk) { B.event = { name, sub, c: c || '#ffd66e', t: 0 }; AudioSys.sfx('gold'); if (vk) Voice.npc(vk); }
// 每回合开始时有概率触发（每场最多 2 次，第 2 回合起）
function maybeBattleEvent(B, force) {
  B.turnNo = (B.turnNo || 0) + 1; B.evN = B.evN || 0;
  if (!force && (B.turnNo < 2 || B.evN >= 2 || B.over || B.victory || Math.random() > (G.eventRate !== undefined ? G.eventRate : 0.22))) return false;
  const list = force ? BATTLE_EVENTS.filter(e => e.id === force) : BATTLE_EVENTS; let tot = list.reduce((a, e) => a + e.w, 0), r = Math.random() * tot, ev = list[0];
  for (const e of list) { r -= e.w; if (r <= 0) { ev = e; break; } }
  B.evN++; B.mode = 'queue'; ev.run(B); Q(fn(() => { B.event = null; B.mode = 'menu'; }));
  return true;
}
function evWeather(B) {
  const kinds = Object.keys(WX_BOOST), k = kinds[rint(0, kinds.length - 1)], W0 = WX_BOOST[k];
  const boost = Object.keys(W0).filter(x => x !== 'n' && W0[x] > 1).map(x => TYPES[x].n).join('、'), weak = Object.keys(W0).filter(x => x !== 'n' && W0[x] < 1).map(x => TYPES[x].n).join('、');
  Q(fn(() => { eventBanner(B, '天气突变 · ' + W0.n + '！', boost + '属性招式威力 ×1.2' + (weak ? '，' + weak + '属性 ×0.8' : '') + '（3 回合）', '#9fd8ff', 'ev_weather'); B.wx = { kind: k, turns: 3 }; setWeather(B, k, 9999); }),
    msg('天空突然变了脸色……' + W0.n + '来了！'), msg(boost + '属性的招式威力提升了' + (weak ? '，' + weak + '属性的招式变弱了！' : '！')));
}
function tickWeather(B) { if (B.wx && --B.wx.turns <= 0) { B.wx = null; B.weather = null; QF(msg('天气恢复了平静。')); } }
function evRiddle(B) {
  Q(fn(() => { eventBanner(B, '云游先生出题啦！', '答对：体力回复 30%、奥义槽 +30、灵晶 ◆10', '#ffe08a', 'riddle_in'); B.npc = { img: 'npc_sage', t: 0 }; }),
    msg('云游先生：哈哈，好热闹的战斗！小朋友，先来解我一道谜题吧！'),
    fn(() => { B.mode = 'quiz'; startQuiz({ source: 'battle', count: 1, title: '云游先生的谜题', sub: '答对：体力回复 30%、奥义槽 +30、灵晶 ◆10', theme: B.theme, forceComp: Math.random() < 0.5 }, r => {
      B.mode = 'queue'; B.asked++; const p = active();
      if (r.correct) { B.correct++; const mx = stats(p).hp, h = Math.min(mx - p.hp, Math.round(mx * 0.3)); p.hp += h; addGauge(B, 'p', 30); addGems(10, '谜题'); Voice.npc('riddle_ok'); QF(anim('heal', 'p', 'grass', 0.6), waitHp(), msg('云游先生：妙哉！送你一点灵力！（体力 +' + h + '，奥义槽 +30，◆10）'), fn(() => { monTalk('p', 'win', { force: true }); B.npc = null; })); }
      else (Voice.npc('riddle_ng'), QF(msg('云游先生：别灰心，回去好好想想刚才的讲解！'), fn(() => { B.npc = null; })));
    }); }));
}
function evBanter(B) {
  Q(fn(() => { eventBanner(B, '灵兽斗嘴！', '双方互相挑衅，奥义槽各 +15', '#ff9ad0', 'ev_banter'); }),
    fn(() => monTalk('e', 'taunt', { force: true })), { type: 'anim', kind: 'taunt', side: 'e', mtype: 'normal', dur: 1.4 },
    fn(() => monTalk('p', 'taunt', { force: true })), { type: 'anim', kind: 'taunt', side: 'p', mtype: 'normal', dur: 1.4 },
    fn(() => { addGauge(B, 'p', 15); addGauge(B, 'e', 15); }), msg('两只灵兽互不服气，气势都涨了！'));
}
function evRoulette(B) {
  Q(fn(() => { eventBanner(B, '幸运转盘出现！', '答对题目让指针停在「×2」，下一招伤害翻倍！', '#ffcc4a', 'ev_roulette'); }),
    msg('一只神秘的幸运转盘飘了过来！答对题目，就能让指针停在好格子上！'),
    fn(() => { B.mode = 'quiz'; startQuiz({ source: 'battle', count: 1, title: '幸运转盘', sub: '答对：下一招伤害 ×2；答错：×1.2', theme: B.theme }, r => {
      B.mode = 'queue'; B.asked++; if (r.correct) B.correct++;
      const mul = r.correct ? 2 : 1.2; B.roul = { t: 0, target: mul === 2 ? 0 : 3, mul };
      QF({ type: 'anim', kind: 'none', side: 'p', mtype: 'normal', dur: 2.2 }, fn(() => { B.luckyMul = mul; B.roul = null; AudioSys.sfx(mul === 2 ? 'levelup' : 'blip'); }), msg(mul === 2 ? '指针停在了「×2」！下一招伤害翻倍！' : '指针停在了「×1.2」，下一招伤害小小提升！'));
    }); }));
}
function evDance(B) {
  Q(fn(() => { eventBanner(B, '突然的斗舞大会！', '跟上节拍答对题目：对手看呆了（攻击下降），奥义槽 +20', '#c27bff', 'ev_dance'); AudioSys.setIntensity(1); }),
    fn(() => monTalk('e', 'taunt', { force: true })), { type: 'anim', kind: 'dance', side: 'e', mtype: 'normal', dur: 1.6 },
    { type: 'anim', kind: 'dance', side: 'p', mtype: 'normal', dur: 1.6 },
    fn(() => { B.mode = 'quiz'; startQuiz({ source: 'battle', count: 1, title: '斗舞节拍题', sub: '答对：对手看呆了，攻击下降；你的奥义槽 +20', theme: B.theme }, r => {
      B.mode = 'queue'; B.asked++; AudioSys.setIntensity(0);
      if (r.correct) { B.correct++; B.stages.e.atk = Math.max(-6, B.stages.e.atk - 1); addGauge(B, 'p', 20); QF({ type: 'anim', kind: 'cheer', side: 'p', mtype: 'normal', dur: 1.2 }, fn(() => monTalk('p', 'crit', { force: true })), msg('完美的舞步！对手看呆了，攻击下降了！')); }
      else QF({ type: 'anim', kind: 'dance', side: 'e', mtype: 'normal', dur: 1 }, msg('对手跳得更起劲了……这次平局！'));
    }); }));
}
function evStars(B) {
  const a = rint(4, 12), b = rint(3, 9), c = rint(1, Math.min(a + b - 1, 6));
  const r0 = a + b - c, opts = [r0]; for (const d of [a + b, r0 + 1, r0 - 1, r0 + 2, r0 - 2]) if (d > 0 && !opts.includes(d) && opts.length < 4) opts.push(d);
  for (let i = opts.length - 1; i > 0; i--) { const j = rint(0, i); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  const q = { q: '天上落下 ' + a + ' 颗流星，又落下 ' + b + ' 颗，被风吹走了 ' + c + ' 颗。还剩几颗流星？', choices: opts.map(String), ans: opts.indexOf(r0), answer: String(r0), exp: '先算一共落下 ' + a + ' + ' + b + ' = ' + (a + b) + ' 颗，再减去被吹走的 ' + c + ' 颗：' + (a + b) + ' − ' + c + ' = ' + r0 + ' 颗。', fig: null, kp: 'c_logic', kpName: '流星雨应用题', grade: G.grade, comp: false, bank: null, tag: 'calc' };
  Q(fn(() => { eventBanner(B, '流星雨！', '数一数流星：答对获得 ★5 和 ◆10', '#fff3a0', 'ev_stars'); B.starRain = { t: 0, n: a + b }; }),
    msg('哇，战场上空下起了流星雨！'),
    fn(() => { B.mode = 'quiz'; startQuiz({ source: 'battle', count: 1, title: '流星雨', sub: '答对获得 ★5 和 ◆10', theme: B.theme, custom: q }, r => {
      B.mode = 'queue'; B.asked++; B.starRain = null;
      if (r.correct) { B.correct++; addStars(5); addGems(10, '流星雨'); QF(msg('数对了！收集到 ★5 和灵晶 ◆10！')); } else QF(msg('流星飞走了……下次数仔细一点哦！'));
    }); }));
}
// 事件横幅 / 云游先生 / 转盘 / 流星（UI 层）
function drawBattleEventUI(B) {
  const E = B.event;
  if (B.starRain) { B.starRain.t += LAST_DT; for (let i = 0; i < B.starRain.n; i++) { const tt = ((B.starRain.t * 0.6 + hash(i, 3)) % 1), x = 1600 - tt * 1500 + hash(i, 5) * 600 - 300, y = -50 + tt * 700 + hash(i, 7) * 100; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9; ctx.drawImage(glowSprite('#fff3a0'), x - 22, y - 22, 44, 44); ctx.strokeStyle = 'rgba(255,243,160,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y - 34); ctx.stroke(); ctx.restore(); } }
  if (B.npc) { B.npc.t += LAST_DT; const im = IMG[B.npc.img]; if (im) { const h = 330, w = im.width * h / im.height, sl = easeOut(clamp(B.npc.t * 3, 0, 1)); ctx.drawImage(scaled(B.npc.img, w, h) || im, 1600 - w * sl - 30, 515 - h, w, h); } }
  if (B.roul) { B.roul.t += LAST_DT; const R0 = B.roul, segs = ['×2', '×1.2', '×1.5', '×1.2', '×2', '×1.5'], n = segs.length, cx = 800, cy = 480, rad = 170;
    const spin = Math.min(1, R0.t / 1.8), ang = (1 - Math.pow(1 - spin, 3)) * (Math.PI * 2 * 5) - (R0.target + 0.5) / n * Math.PI * 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rad, i / n * 6.283 - Math.PI / 2, (i + 1) / n * 6.283 - Math.PI / 2); ctx.fillStyle = ['#ff6a8a', '#6fb8ff', '#ffcc4a', '#8fe36b', '#ff6a8a', '#c27bff'][i]; ctx.fill(); ctx.save(); ctx.rotate((i + 0.5) / n * 6.283); text(segs[i], 0, -rad * 0.66, 34, '#fff', 'center', '900', 'middle', true); ctx.restore(); }
    ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.28); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy - rad - 6); ctx.lineTo(cx - 22, cy - rad - 44); ctx.lineTo(cx + 22, cy - rad - 44); ctx.fill(); cdot(cx, cy, 26, '#ffd66e'); }
  if (!E) return; E.t += LAST_DT; const a = Math.min(1, E.t * 5, Math.max(0, (4 - E.t) * 2)), sl = easeBack(clamp(E.t * 3, 0, 1)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(800, 232); ctx.scale(sl, 1);
  const g = ctx.createLinearGradient(-520, 0, 520, 0); g.addColorStop(0, 'rgba(20,10,40,0)'); g.addColorStop(0.15, 'rgba(20,10,40,0.88)'); g.addColorStop(0.85, 'rgba(20,10,40,0.88)'); g.addColorStop(1, 'rgba(20,10,40,0)');
  ctx.fillStyle = g; ctx.fillRect(-560, -62, 1120, 124); ctx.fillStyle = E.c; ctx.fillRect(-460, -64, 920, 4); ctx.fillRect(-460, 60, 920, 4);
  text('✦ 随机事件 ✦', 0, -34, 20, E.c, 'center', '900'); text(E.name, 0, 2, 44, '#fff', 'center', '900', 'middle', true); text(E.sub, 0, 40, 20, '#e8ecff', 'center', '700');
  ctx.restore();
}
