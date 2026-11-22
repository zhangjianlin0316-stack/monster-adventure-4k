// ================== 战斗逻辑（数学深度融合） ==================
const msg = text => ({ type: 'msg', text });
const fn = f => ({ type: 'fn', f });
const anim = (kind, side, mtype, dur) => ({ type: 'anim', kind, side, mtype, dur });
const waitHp = () => ({ type: 'waitHp' });
function Q(...steps) { G.battle.queue.push(...steps); }
function QF(...steps) { G.battle.queue.unshift(...steps); }
const active = () => G.party[G.battle.pi];
function stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
const BG_LAYOUT = {
  bg_meadow: { p: [0.32, 0.80], e: [0.775, 0.535] }, bg_forest: { p: [0.30, 0.79], e: [0.765, 0.545] }, bg_lake: { p: [0.32, 0.77], e: [0.78, 0.50] },
  bg_desert: { p: [0.32, 0.79], e: [0.78, 0.54] }, bg_snow: { p: [0.34, 0.80], e: [0.77, 0.525] }, bg_volcano: { p: [0.29, 0.76], e: [0.78, 0.50] }, bg_flower: { p: [0.33, 0.78], e: [0.795, 0.515] }
};
function curRegion() { return REGIONS[regionAt(G.player.x, G.player.y)] || REGIONS[0]; }
function startBattle(enemy, opts) {
  opts = opts || {};
  enemy.dhp = enemy.hp; enemy.status = null;
  const pi = G.party.findIndex(m => m.hp > 0);
  G.party.forEach(m => { m.dhp = m.hp; });
  const R = curRegion();
  pClear();
  const B = G.battle = {
    enemy, pi: pi < 0 ? 0 : pi, mode: 'queue', queue: [], cur: null, menu: 0, moveIdx: 0, trainer: opts.trainer || null, team: opts.team || [],
    anim: null, stages: { p: { atk: 0, def: 0, spd: 0 }, e: { atk: 0, def: 0, spd: 0 } }, over: false, runs: 0,
    showP: false, showE: true, caught: false, t: 0, end: null, bg: R.bg, theme: R.theme,
    rings: [], nums: [], stars: [], stamps: [], shake: 0, flash: 0, hitStop: 0, cam: { kz: 0, kx: 0, ky: 0, rot: 0 }, react: { p: null, e: null }, weather: null, speedLines: 0,
    victory: false, correct: 0, asked: 0, enemyWeak: false, part: new Set(), lvPanel: null,
    gauge: { p: 0, e: (opts.trainer ? 25 : 0) + (SPECIES[enemy.sp].rar === 'legend' ? 60 : 0) }, combo: null, slow: 0, impact: null, gaugeFull: {}
  };
  G.flags.seen = G.flags.seen || {}; G.flags.seen[enemy.sp] = 1; (opts.team || []).forEach(m => G.flags.seen[m.sp] = 1);
  B.legend = !!opts.legend;
  G.trans = 1.2; G.held = []; G.menu = null; G.dialog = null; G.choice = null;
  G.scene = 'battle';
  const R2 = SPECIES[enemy.sp].rar, rarTxt = R2 === 'legend' ? '传说中的' : R2 === 'epic' ? '史诗级的' : R2 === 'rare' ? '稀有的' : '';
  const intro = B.trainer ? [msg(B.trainer.name + '向你发起了数学对决！'), msg(B.trainer.name + '派出了' + nameOf(enemy) + '！')] : [msg(R2 === 'legend' ? '传说灵兽' + nameOf(enemy) + '降临了！' : (enemy.shiny ? '✦闪闪发光的异色' : '') + '野生的' + rarTxt + nameOf(enemy) + '跳出来了！')];
  Q(...intro, ...introSteps('e'), fn(() => { B.showP = true; B.part.add(B.pi); }), anim('send', 'p', 'normal', 0.5), msg('去吧，' + nameOf(active()) + '！'), ...introSteps('p'),
    ...(B.trainer ? [msg('【数学对决】答对题目不仅威力大增，还能压制对手下一次的攻势！')] : []), fn(() => B.mode = 'menu'));
}
function battleInput(k) {
  const B = G.battle; if (!B) return;
  if (B.mode === 'queue') {
    if ((k === 'ok' || k === 'cancel') && B.cur && B.cur.type === 'msg') {
      if (B.cur.chars < B.cur.text.length) B.cur.chars = B.cur.text.length; else B.cur = null;
    }
    return;
  }
  if (G.pickUI) return pickInput(k);
  if (B.mode === 'party') return partyInput(k);
  if (B.mode === 'bag') return bagInput(k);
  const grid = (idx, k, n) => {
    let r = Math.floor(idx / 2), c = idx % 2;
    if (k === 'up') r = 0; if (k === 'down') r = 1; if (k === 'left') c = 0; if (k === 'right') c = 1;
    const ni = r * 2 + c; return ni < n ? ni : idx;
  };
  if (B.mode === 'menu') {
    if (['up', 'down', 'left', 'right'].includes(k)) B.menu = grid(B.menu, k, 4);
    if (k === 'ok') {
      if (B.menu === 0) { B.mode = 'moves'; B.moveIdx = Math.min(B.moveIdx, active().moves.length - 1); }
      if (B.menu === 1) { B.mode = 'bag'; G.bagUI = { idx: 0, ctx: 'battle' }; }
      if (B.menu === 2) { B.mode = 'party'; G.partyUI = { idx: B.pi, mode: 'battle', sel: null }; }
      if (B.menu === 3) battleRun();
    }
  } else if (B.mode === 'moves') {
    const n = active().moves.length, ultOk = B.gauge.p >= 100;
    if (B.moveIdx === 4) { if (k === 'left' || k === 'up' || k === 'down') B.moveIdx = Math.min(1, n - 1); }
    else if (k === 'right' && ultOk && (B.moveIdx % 2 === 1 || n === 1)) B.moveIdx = 4;
    else if (['up', 'down', 'left', 'right'].includes(k)) B.moveIdx = grid(B.moveIdx, k, n);
    if (k === '5' && ultOk) B.moveIdx = 4;
    if (k === 'cancel') B.mode = 'menu';
    if (k === 'ok' && B.moveIdx === 4 && ultOk) {
      const uid = SPECIES[active().sp].ult; B.mode = 'quiz';
      startQuiz({ source: 'battle', count: 2, need: 2, title: '奥义答题：' + MOVES[uid].n, sub: '连答两题！全对：奥义全力爆发（必定会心）；答错会削弱奥义威力', theme: B.theme, forceComp: G.comp }, res => { B.mathRes = res; battleTurn(4); });
      return;
    }
    if (k === 'ok') {
      const mv = active().moves[B.moveIdx];
      if (mv.pp <= 0) { toast('这个招式的PP用完了！'); return; }
      const mi = B.moveIdx; B.mode = 'quiz';
      startQuiz({ source: 'battle', count: 1, title: '出招答题：' + MOVES[mv.id].n, sub: '答对：威力大增、可能会心一击；连续答对有连击加成！', theme: B.theme }, res => { B.mathRes = res; battleTurn(mi); });
    }
  }
}
function enemyMove() {
  const B = G.battle, e = B.enemy, p = active();
  if (B.gauge.e >= 100 && (B.trainer || SPECIES[e.sp].rar === 'legend' || SPECIES[e.sp].rar === 'epic' || Math.random() < 0.6)) return SPECIES[e.sp].ult;
  const dmg = e.moves.filter(m => MOVES[m.id].p > 0);
  if (dmg.length && Math.random() < 0.45) { let best = dmg[0]; dmg.forEach(m => { if (MOVES[m.id].p * effOf(MOVES[m.id].t, SPECIES[p.sp].t) > MOVES[best.id].p * effOf(MOVES[best.id].t, SPECIES[p.sp].t)) best = m; }); return best.id; }
  return e.moves[rint(0, e.moves.length - 1)].id;
}
function battleTurn(mi) {
  const B = G.battle, p = active(), e = B.enemy;
  const pm = mi === 4 ? SPECIES[p.sp].ult : p.moves[mi].id, em = enemyMove();
  const pp = MOVES[pm].prio || 0, ep = MOVES[em].prio || 0;
  const ps = stats(p).spd * stageMul(B.stages.p.spd) * (p.status === 'para' ? 0.5 : 1), es = stats(e).spd * stageMul(B.stages.e.spd) * (e.status === 'para' ? 0.5 : 1);
  const pFirst = pp !== ep ? pp > ep : (ps !== es ? ps > es : Math.random() < 0.5);
  B.mode = 'queue';
  const res = B.mathRes; B.mathRes = null;
  if (res) {
    B.asked++;
    if (mi === 4) { B.correct += res.ok || 0; B.asked += (res.n || 1) - 1; }
    if (res.correct && mi !== 4) addGauge(B, 'p', 25 + (res.fast ? 10 : 0) + (res.comp ? 10 : 0));
    if (res.correct) {
      if (mi !== 4) B.correct++;
      if (G.streak >= 2) addStamp(B, '连击 ×' + G.streak + '！', '#7ff0e2');
      if (B.trainer) B.enemyWeak = true;
    }
  }
  if (pFirst) Q(act('p', pm, mi, res), act('e', em));
  else Q(act('e', em), act('p', pm, mi, res));
  Q(fn(endOfTurn), fn(endTurn));
}
function endTurn() { const B = G.battle; if (B && !B.over) B.mode = 'menu'; }
function mathMult(res, ult) {
  if (!res) return { m: 1, crit: 0, text: null };
  if (ult) {
    if (res.pass) return { m: 1.5, crit: 1, text: '两题全对！灵力全开，奥义完美发动！' };
    if (res.ok) return { m: 1.0, crit: 0.3, text: '答对了一题，奥义发动了！' };
    return { m: 0.6, crit: 0, text: '答错了……灵力不稳，奥义威力减弱了。' };
  }
  if (!res.correct) return { m: 0.6, crit: 0, text: '答错了……招式威力减弱了。' };
  const combo = Math.min(5, Math.max(0, G.streak - 1));
  let m = 1.3 + combo * 0.1 + (res.fast ? 0.1 : 0) + (res.comp ? 0.2 : 0);
  return { m, crit: res.comp ? 1 : 0.3, text: '答对了！威力 ×' + m.toFixed(1) + (combo ? '（连击加成）' : '') + (res.fast ? '　神速加成！' : '') + (res.comp ? '　竞赛题必定会心！' : '') };
}
function act(side, moveId, mi, res) {
  return fn(() => {
    const B = G.battle;
    const att = side === 'p' ? active() : B.enemy, def = side === 'p' ? B.enemy : active();
    if (att.hp <= 0 || def.hp <= 0 || B.over) return;
    const mv = MOVES[moveId];
    const wild = B.trainer ? '对手的' : '野生的';
    const an = (side === 'e' ? wild : '') + nameOf(att), dn = (side === 'p' ? wild : '') + nameOf(def);
    const os = side === 'p' ? 'e' : 'p';
    const steps = [];
    // 状态异常：行动前判定
    if (att.status === 'frz') { if (Math.random() < 0.3) { att.status = null; steps.push(msg(an + '身上的冰融化了！')); } else { QF(msg(an + '被冻住了，无法行动！')); return; } }
    if (att.status === 'para' && Math.random() < 0.25) { QF(anim('status', side, 'electric', 0.5), msg(an + '身体麻痹，无法行动！')); return; }
    // 对手奥义：先答题防御
    if (side === 'e' && mv.ult && !B.defPending) {
      B.defPending = true; B.gauge.e = 0;
      QF(msg(an + '正在凝聚灵力……是奥义！'), msg('快答题防御！答对可以化解大部分伤害！'),
        fn(() => { B.mode = 'quiz'; startQuiz({ source: 'battle', count: 1, title: '奥义防御：' + mv.n, sub: '答对：结出灵力护盾，伤害大幅降低！', theme: B.theme }, r => { B.defRes = r; if (r.correct) { B.asked++; B.correct++; addGauge(B, 'p', 15); } else B.asked++; B.mode = 'queue'; }); }),
        act(side, moveId, mi, res));
      return;
    }
    let guard = 1;
    if (side === 'e' && mv.ult) { B.defPending = false; if (B.defRes && B.defRes.correct) { guard = 0.4; steps.push(msg('答对了！灵力护盾挡住了大部分冲击！')); } B.defRes = null; }
    if (side === 'p' && mv.ult) B.gauge.p = 0;
    if (side === 'p' && !mv.ult) att.moves[mi].pp--;
    const mm = side === 'p' ? mathMult(res, mv.ult) : { m: 1, crit: 0 };
    if (side === 'p' && mm.text) steps.push(msg(mm.text));
    let weak = 1;
    if (side === 'e' && B.enemyWeak) { weak = 0.6; B.enemyWeak = false; steps.push(msg('你的数学气势压制了对手，' + an + '的攻势减弱了！')); }
    steps.push(fn(() => monTalk(side, mv.ult ? 'ult' : 'atk', mv.ult ? { force: true } : { chance: 0.45 })));
    steps.push(msg(an + '使用了' + mv.n + '！'));
    const tm = moveTiming(moveId);
    const mk = (extra) => Object.assign({ type: 'anim', kind: 'move', side, move: moveId, mtype: mv.t, dur: tm.dur, cut: tm.cut, H: tm.H }, extra);
    if (Math.random() * 100 >= mv.acc * (side === 'p' && res && res.correct ? 1.15 : 1)) {
      steps.push(mk({ miss: true }), fn(() => monTalk(os, 'dodge', { force: true })), { type: 'anim', kind: 'dodge', side: os, mtype: 'normal', dur: 0.6 }, msg('但是没有命中！'));
    } else if (mv.p === 0) {
      const a = mk({});
      steps.push(a);
      const successBoost = side === 'p' && res ? (res.correct ? 1 : 0) : 0;
      if (side === 'p' && res && !res.correct && Math.random() < 0.5) { steps.push(msg('答错了，招式没能发挥作用……')); }
      else if (mv.self) { const st = B.stages[side]; st[mv.self.stat] = Math.min(6, st[mv.self.stat] + mv.self.d + successBoost); steps.push(msg(an + '的' + statName(mv.self.stat) + '提升了！')); }
      else if (mv.eff) { const st = B.stages[os]; if (st[mv.eff.stat] <= -6) steps.push(msg(dn + '的' + statName(mv.eff.stat) + '已经无法再下降了！')); else { st[mv.eff.stat] = Math.max(-6, st[mv.eff.stat] + mv.eff.d - successBoost); steps.push(msg(dn + '的' + statName(mv.eff.stat) + (successBoost ? '大幅' : '') + '下降了！')); } }
      else if (mv.st) { steps.push(...applyStatus(def, mv.st[0], 100, dn)); }
    } else {
      const as = stats(att), ds = stats(def);
      const A = as.atk * stageMul(B.stages[side].atk) * (att.status === 'burn' ? 0.5 : 1), D = ds.def * stageMul(B.stages[os].def);
      const eff = effOf(mv.t, SPECIES[def.sp].t);
      const stab = mv.t === SPECIES[att.sp].t ? 1.5 : 1;
      const crit = side === 'p' ? Math.random() < Math.max(1 / 16, mm.crit) : Math.random() < 1 / 16;
      let dmg = ((2 * att.lvl / 5 + 2) * mv.p * A / D) / 50 + 2;
      dmg = Math.max(1, Math.floor(dmg * stab * eff * (crit ? 1.5 : 1) * mm.m * weak * guard * rnd(0.85, 1)));
      // 连击：答对后普通招式化作多段连击（分段伤害），带 hits 的招式固定多段
      const ftype = FXDEF[mv.fx.k].type;
      let hits = mv.hits || 1;
      if (!mv.hits && !mv.ult && side === 'p' && res && res.correct && (ftype === 'contact' || ftype === 'proj') && (mv.fx.sig || 0) < 2) hits = Math.min(5, 2 + (res.fast ? 1 : 0) + Math.min(2, Math.floor(G.streak / 3)));
      hits = Math.max(1, Math.min(hits, dmg));
      const parts = []; let left = dmg; for (let i = 0; i < hits; i++) { const pp2 = i === hits - 1 ? left : Math.max(1, Math.round(dmg / hits * rnd(0.8, 1.2))); parts.push(Math.min(left - (hits - 1 - i), pp2)); left -= parts[i]; }
      const an2 = mk({ eff, dmg, crit, hits, parts, ko: dmg >= def.hp }); an2.dur += 0.13 * (hits - 1);
      an2.onHit = (amt) => { def.hp = Math.max(G.noKO ? 1 : 0, def.hp - (amt === undefined ? dmg : amt)); };
      if (mv.fx.w) setTimeout(() => { if (G.battle === B) setWeather(B, mv.fx.w, tm.dur + 1.2); }, tm.cut * 1000);
      steps.push(an2, waitHp(), fn(() => {
        if (crit) monTalk(side, 'crit', { force: true });
        else if (def.hp > 0 && def.hp < stats(def).hp * 0.28 && !(B.lowSaid = B.lowSaid || new Set()).has(def)) { B.lowSaid.add(def); monTalk(os, 'low', { force: true }); }
        else if (def.hp > 0) monTalk(os, 'hit', { chance: 0.4 });
      }));
      if (crit) steps.push(msg('击中了要害！'));
      if (eff > 1) steps.push(msg('效果拔群！'));
      if (eff < 1) steps.push(msg('效果不太理想……'));
      if (mv.heal) steps.push(fn(() => { const mx = stats(att).hp, h = Math.min(mx - att.hp, Math.round(mx * mv.heal)); if (h > 0) { att.hp += h; QF(anim('heal', side, 'grass', 0.6), waitHp(), msg(an + '恢复了' + h + '点体力！')); } }));
      if (mv.self) steps.push(fn(() => { const st = B.stages[side]; st[mv.self.stat] = Math.min(6, st[mv.self.stat] + mv.self.d); QF(msg(an + '的' + statName(mv.self.stat) + '提升了！')); }));
      if (mv.eff && mv.eff.ch) steps.push(fn(() => { if (def.hp > 0 && Math.random() * 100 < mv.eff.ch) { const st = B.stages[os]; st[mv.eff.stat] = Math.max(-6, st[mv.eff.stat] + mv.eff.d); QF(anim('status', os, 'normal', 0.6), msg(dn + '的' + statName(mv.eff.stat) + '下降了！')); } }));
      if (mv.st) steps.push(fn(() => { if (def.hp > 0) QF(...applyStatus(def, mv.st[0], mv.st[1], dn)); }));
      steps.push(fn(() => faintCheck(os)));
    }
    QF(...steps);
  });
}
function statName(s) { return { atk: '攻击', def: '防御', spd: '速度' }[s]; }
function applyStatus(mon, st, chance, name) {
  if (mon.status || mon.hp <= 0) return chance >= 100 ? [msg(name + '没有受到影响。')] : [];
  if (Math.random() * 100 >= chance) return [];
  if ((st === 'burn' && SPECIES[mon.sp].t === 'fire') || (st === 'frz' && SPECIES[mon.sp].t === 'ice') || (st === 'para' && SPECIES[mon.sp].t === 'electric')) return chance >= 100 ? [msg(name + '没有受到影响。')] : [];
  mon.status = st; const side = mon === G.battle.enemy ? 'e' : 'p';
  return [anim('status', side, st === 'burn' ? 'fire' : st === 'frz' ? 'ice' : 'electric', 0.6), msg(name + { burn: '被灼伤了！', para: '麻痹了，可能无法行动！', frz: '被冻住了！' }[st])];
}
function endOfTurn() {
  const B = G.battle; if (!B || B.over) return;
  const steps = [];
  [['p', active()], ['e', B.enemy]].forEach(([side, m]) => {
    if (m && m.hp > 0 && m.status === 'burn') {
      const d = Math.max(1, Math.floor(stats(m).hp / 16));
      steps.push(fn(() => { m.hp = Math.max(0, m.hp - d); }), anim('status', side, 'fire', 0.5), waitHp(), msg((side === 'e' ? (B.trainer ? '对手的' : '野生的') : '') + nameOf(m) + '受到了灼伤的伤害！'), fn(() => faintCheck(side)));
    }
  });
  QF(...steps);
}
function faintCheck(side) {
  const B = G.battle;
  if (side === 'e' && B.enemy.hp <= 0 && !B.enemy._fainted) {
    B.enemy._fainted = true; B.over = true;
    const e = B.enemy;
    QF(fn(() => monTalk('e', 'ko', { force: true })), anim('faint', 'e', 'normal', 0.9), fn(() => B.showE = false), msg((B.trainer ? '对手的' : '野生的') + nameOf(e) + '倒下了！'), fn(() => awardXP(e)));
  }
  if (side === 'p' && active().hp <= 0 && !active()._fainting) {
    B.over = true;
    const p = active(); p._fainting = true;
    QF(fn(() => monTalk('p', 'ko', { force: true })), anim('faint', 'p', 'normal', 0.9), fn(() => { B.showP = false; p._fainting = false; p.status = null; }), msg(nameOf(p) + '倒下了！'), fn(() => {
      B.queue.length = 0;
      if (G.party.some(m => m.hp > 0)) {
        Q(msg('请选择下一只出战的灵兽。'), fn(() => { B.mode = 'party'; G.partyUI = { idx: G.party.findIndex(m => m.hp > 0), mode: 'forced', sel: null }; }));
      } else {
        Q(msg('你已经没有可以战斗的灵兽了……'), msg('你眼前一黑，被送回了灵兽中心。'), fn(() => endBattle('lose')));
      }
    }));
  }
}
function awardXP(e) {
  const B = G.battle; const p = active();
  const bonus = 1 + 0.1 * Math.min(5, B.correct), dbl = G.doubleExp > 0 ? 2 : 1;
  const gain = Math.max(1, Math.round(xpGain(e, !!B.trainer) * bonus * dbl));
  const steps = [msg(nameOf(p) + '获得了' + gain + '点经验值！' + (bonus > 1 ? '（答对 ' + B.correct + ' 题，经验 ×' + bonus.toFixed(1) + '）' : '') + (dbl > 1 ? '【双倍经验】' : ''))];
  steps.push(fn(() => gainXP(p, gain, true)));
  const share = Math.round(gain * 0.35);
  const others = G.party.filter(m => m !== p && m.hp > 0);
  if (others.length && share > 0) steps.push(msg('其他队员也获得了' + share + '点经验值。'), fn(() => others.forEach(m => gainXP(m, share, false))));
  steps.push(fn(() => afterEnemyDown()));
  QF(...steps);
}
function afterEnemyDown() {
  const B = G.battle;
  if (B.trainer && B.team.length) {
    const nx = B.team.shift(); nx.dhp = nx.hp;
    QF(msg(B.trainer.name + '派出了' + nameOf(nx) + '！'), fn(() => { B.enemy = nx; B.showE = true; B.over = false; B.stages.e = { atk: 0, def: 0, spd: 0 }; }), anim('send', 'e', 'normal', 0.5), ...introSteps('e'), fn(endTurn));
    return;
  }
  B.victory = true;
  if (B.trainer) {
    const T0 = B.trainer; const st = T0.stars || 8;
    QF(msg('你赢得了与' + T0.name + '的数学对决！'), fn(() => { addStars(st); G.flags.objs[T0.id] = 1; }), msg('获得了 ★' + st + ' 颗星星！'), fn(() => endBattle('win')));
  } else QF(fn(() => endBattle('win')));
  QF(fn(() => monTalk('p', 'win', { force: true })), { type: 'anim', kind: 'sig', side: 'p', mtype: 'normal', dur: 1.3 }, fn(() => showActName('p')));
}
function gainXP(m, amt, main) {
  m.xp += amt;
  const steps = [];
  while (m.lvl < 100 && m.xp >= xpFor(m.lvl + 1)) {
    const old = stats(m);
    m.lvl++;
    const nw = stats(m); m.hp += nw.hp - old.hp;
    const lv = m.lvl;
    steps.push(fn(() => { m.dhp = m.hp; G.battle.lvPanel = { m, old, nw, lvl: lv, t: 0 }; }), anim(m === active() ? 'levelup' : 'none', 'p', 'normal', m === active() ? 0.8 : 0.05), msg(nameOf(m) + '升到了' + lv + '级！'));
    SPECIES[m.sp].learn.filter(e => e[0] === lv).forEach(e => steps.push(...learnMove(m, e[1])));
    const sp = SPECIES[m.sp];
    if (sp.evoTo && lv >= sp.evoLvl && !m.evoReady) { m.evoReady = true; steps.push(msg(nameOf(m) + '的身体发出了微光……进化的时刻到了！战斗后可以挑战进化试炼！')); }
  }
  steps.push(fn(() => { if (G.battle) G.battle.lvPanel = null; }));
  QF(...steps);
}
function learnMove(m, id, silent) {
  if (m.moves.some(x => x.id === id)) return [];
  if (m.moves.length < 4) { m.moves.push({ id, pp: MOVES[id].pp }); return silent ? [] : [msg(nameOf(m) + '学会了' + MOVES[id].n + '！')]; }
  if (silent) { queueLearn(m, id); return []; }
  // 战斗中：暂停队列，让玩家选择遗忘哪个招式
  return [msg(nameOf(m) + '想要学习新招式「' + MOVES[id].n + '」！'), fn(() => { const B = G.battle; B.mode = 'learn'; openLearnUI(m, id, txt => { B.mode = 'queue'; QF(msg(txt)); }); })];
}
function battleSwitch(idx, forced) {
  const B = G.battle;
  B.mode = 'queue';
  const old = active();
  B.stages.p = { atk: 0, def: 0, spd: 0 };
  if (!forced) Q(msg('回来吧，' + nameOf(old) + '！'), anim('recall', 'p', 'normal', 0.35), fn(() => { B.showP = false; }));
  Q(fn(() => { B.pi = idx; B.showP = true; B.over = false; B.part.add(idx); }), anim('send', 'p', 'normal', 0.5), msg('去吧，' + nameOf(G.party[idx]) + '！'), ...introSteps('p'));
  if (!forced) Q(act('e', enemyMove()), fn(endOfTurn));
  Q(fn(endTurn));
}
function battleItem(id) {
  const B = G.battle;
  if (id === 'hintcard') { toast('提示卡会在答题时自动可用（按 H）'); B.mode = 'menu'; return; }
  if (id === 'ball' || id === 'superball') {
    if (B.trainer) { toast('不能抢走别人的灵兽！'); B.mode = 'menu'; return; }
    B.mode = 'quiz';
    startQuiz({ source: 'catch', count: 1, title: '捕获答题', sub: '答对：捕获率大幅提升！竞赛题更是 ×3！', theme: B.theme }, res => doThrow(id, res));
    return;
  }
  B.mode = 'queue';
  if (id === 'potion' || id === 'superpotion') {
    const p = active(), mx = stats(p).hp;
    if (p.hp >= mx) { toast(nameOf(p) + '的体力是满的！'); B.mode = 'menu'; return; }
    G.bag[id]--;
    const heal = Math.min(id === 'potion' ? 30 : 80, mx - p.hp);
    Q(msg('使用了' + ITEMS[id].n + '！'), anim('heal', 'p', 'grass', 0.7), fn(() => p.hp += heal), waitHp(), msg(nameOf(p) + '恢复了' + heal + '点体力！'), act('e', enemyMove()), fn(endOfTurn), fn(endTurn));
  } else if (id === 'revive') {
    const t = G.party.find(m => m.hp <= 0);
    if (!t) { toast('没有倒下的灵兽。'); B.mode = 'menu'; return; }
    G.bag.revive--; t.hp = Math.floor(stats(t).hp / 2); t.dhp = t.hp;
    Q(msg('使用了复活草！' + nameOf(t) + '恢复了精神！'), act('e', enemyMove()), fn(endOfTurn), fn(endTurn));
  }
}
function doThrow(id, res) {
  const B = G.battle; B.mode = 'queue';
  G.bag[id]--;
  const e = B.enemy, mx = stats(e).hp;
  const a = (3 * mx - 2 * e.hp) * SPECIES[e.sp].cr / (3 * mx);
  const mathMul = res.correct ? (res.comp ? 3 : 2.2) : 0.8;
  const st = e.status ? 1.5 : 1;
  const p = clamp(a / 255 * 1.4 * (id === 'superball' ? 1.8 : 1) * mathMul * st, 0.03, 1);
  const sp = Math.pow(p, 0.25);
  let shakes = 0; while (shakes < 4 && Math.random() < sp) shakes++;
  Q(msg(res.correct ? '答对了！捕获球闪耀着金光！' : '答错了……捕获球的光芒暗淡了一些。'), msg('你扔出了' + ITEMS[id].n + '！'), anim('throw', 'e', 'normal', 0.6), anim('absorb', 'e', 'normal', 0.35), fn(() => { B.caught = true; }));
  for (let i = 0; i < Math.min(shakes, 3); i++) Q(anim('shake', 'e', 'normal', 0.6));
  if (shakes >= 4) {
    Q(anim('click', 'e', 'normal', 0.6), fn(() => { B.victory = true; }), msg('太好了！成功收服了' + nameOf(e) + '！'), fn(() => {
      const nm = cleanMon(e); nm.dhp = nm.hp; G.flags.dex = G.flags.dex || {}; G.flags.dex[e.sp] = 1; if (e.shiny) { G.flags.shinyDex = G.flags.shinyDex || {}; G.flags.shinyDex[e.sp] = 1; }
      if (G.party.length < 6) { G.party.push(nm); QF(msg(nameOf(e) + '加入了你的队伍！')); }
      else { G.box.push(nm); QF(msg('队伍已满，' + nameOf(e) + '被传送到了灵兽箱。')); }
    }), fn(() => endBattle('catch')));
  } else {
    const t = ['糟糕！灵兽挣脱出来了！', '啊！差一点就……', '可恶！就差一点了！', '只差一点点就抓住了！'][shakes];
    Q(fn(() => { B.caught = false; }), anim('release', 'e', 'normal', 0.35), msg(t), act('e', enemyMove()), fn(endOfTurn), fn(endTurn));
  }
}
function battleRun() {
  const B = G.battle;
  if (B.trainer) { toast('数学对决不能逃跑！'); return; }
  B.mode = 'queue'; B.runs++;
  const ps = stats(active()).spd, es = stats(B.enemy).spd;
  const ok = ps >= es || Math.random() < (ps * 32 / es + 30 * B.runs) / 256;
  if (ok) Q(msg('成功逃走了！'), fn(() => endBattle('run')));
  else Q(msg('没能逃走！'), act('e', enemyMove()), fn(endOfTurn), fn(endTurn));
}
function endBattle(result) {
  const B = G.battle; B.queue.length = 0; B.mode = 'end'; B.end = result;
  if (G.legendObj) { if (result === 'catch') G.flags.objs[G.legendObj] = 1; else if (result === 'win') setTimeout(() => toast('传说灵兽化作光芒消失了……再次通过神社试炼还能再见到它！'), 1500); G.legendObj = null; }
  G.trans = -0.6;
  G.party.forEach(m => { m.dhp = m.hp; m._fainting = false; });
  if (G.doubleExp > 0 && (result === 'win' || result === 'catch')) G.doubleExp--;
  if (result === 'lose') { healAll(); Object.assign(G.player, { x: G.lastCenter.x, y: G.lastCenter.y, dir: 'down', moving: false, prog: 0 }); }
}
function animSfx(a) {
  const m = { status: 'statdown', faint: 'faint', throw: 'throw', shake: 'shake', click: 'catch', levelup: 'levelup', heal: 'heal', send: 'sendout', recall: 'run', release: 'sendout', absorb: 'swoosh' }[a.kind];
  if (a.kind === 'move') { const fx = MOVES[a.move].fx; AudioSys.sfx(MOVES[a.move].ult ? 'ult' : fx.sig ? 'sigcut' : a.cut > 0 ? 'cutin' : 'blip'); if (fx.sig && !MOVES[a.move].ult) AudioSys.sfx('charge'); setTimeout(() => AudioSys.sfx(FXDEF[fx.k].type === 'beam' ? 'beam' : 'swoosh'), a.cut * 1000 + 120); }
  else if (m) AudioSys.sfx(m);
}
function updateBattle(dt) {
  const B = G.battle; if (!B) return;
  B.t += dt;
  [B.enemy, ...G.party].forEach(m => {
    if (m.dhp === undefined) m.dhp = m.hp;
    const sp = Math.max(18, stats(m).hp * 0.9) * dt;
    if (m.dhp > m.hp) m.dhp = Math.max(m.hp, m.dhp - sp); else if (m.dhp < m.hp) m.dhp = Math.min(m.hp, m.dhp + sp);
  });
  if (B.lvPanel) B.lvPanel.t += dt;
  updateBubbles(B, dt);
  if (B.slow > 0) { B.slow -= dt; dt *= 0.28; }
  if (B.mode !== 'queue') return;
  if (B.hitStop > 0) { B.hitStop -= dt; return; }
  let guard = 0;
  while (guard++ < 60) {
    if (!B.cur) {
      if (!B.queue.length) { if (B.mode === 'queue') B.mode = 'menu'; return; }
      B.cur = B.queue.shift(); B.cur.t = 0; B.cur.chars = 0;
      if (B.cur.type === 'fn') { const f = B.cur.f; B.cur = null; f(); if (B.mode !== 'queue') return; continue; }
      if (B.cur.type === 'anim') { B.anim = B.cur; animSfx(B.cur); if (B.cur.kind === 'faint') { const P = battlePositions(B); const sd = B.cur.side; const mon = sd === 'e' ? B.enemy : active(); faintDissolve(B, sd === 'e' ? P.EX : P.PX, sd === 'e' ? P.EY : P.PY, sd === 'e' ? 380 : 500, TYPES[SPECIES[mon.sp].t].c); } }
    }
    const c = B.cur;
    c.t += dt;
    if (c.type === 'msg') { c.chars += dt * 50; return; }
    if (c.type === 'anim') {
      const hitT = c.kind === 'move' ? c.cut + (c.dur - c.cut) * c.H : c.dur * 0.45;
      if (c.kind === 'move' && !c.hitDone && c.t >= hitT) {
        const n = c.hits || 1; c.sub = c.sub || 0;
        const P = battlePositions(B), Tg = c.side === 'p' ? { x: P.EX, y: P.EY - 150 } : { x: P.PX, y: P.PY - 190 };
        while (c.sub < n && c.t >= hitT + c.sub * 0.13) {
          const i = c.sub++, amt = c.parts ? c.parts[i] : c.dmg;
          if (c.onHit) c.onHit(c.parts ? amt : undefined);
          if (i < n - 1) onSubHit(B, c, Tg, i, n, amt); else { c.hitDone = true; if (n > 1) B.combo = { n, t: 0, side: c.side, c: '#ffb020' }; onMoveHit(B, c, Tg); }
        }
      }
      if (c.t >= c.dur) { if (c.kind === 'move' && !c.hitDone) { c.hitDone = true; if (c.onHit) { const rest = c.parts ? c.parts.slice(c.sub || 0).reduce((a, b) => a + b, 0) : undefined; c.onHit(rest); } } B.anim = null; B.cur = null; continue; } return;
    }
    if (c.type === 'waitHp') { if (active().dhp === active().hp && B.enemy.dhp === B.enemy.hp) { B.cur = null; continue; } return; }
    return;
  }
}
// ================== 战斗绘制 ==================
function battlePositions(B) {
  const L = BG_LAYOUT[B.bg] || BG_LAYOUT.bg_meadow;
  const k = battleImgScale();
  return { PX: 800 + (L.p[0] - 0.5) * 1600 * k, PY: 450 + (L.p[1] - 0.5) * 900 * k - 12, EX: 800 + (L.e[0] - 0.5) * 1600 * k, EY: 450 + (L.e[1] - 0.5) * 900 * k + 6 };
}
function battleImgScale() { const s = uiScale(); return Math.max(CW / (1600 * s), CH / (900 * s), 1) * 1.03; }
function trail(tr, v, dt) { if (tr === undefined || tr < v) return v; return Math.max(v, tr - Math.max(4, (tr - v) * 2.2) * dt); }
function drawBattle() {
  const B = G.battle, dt = LAST_DT * (B.slow > 0 ? 0.28 : 1);
  const P = battlePositions(B);
  const stopped = B.hitStop > 0;
  B.shake = (B.shake || 0) * Math.pow(0.002, dt); B.flash = (B.flash || 0) * Math.pow(0.02, dt);
  B.cam.kz *= Math.pow(0.03, dt); B.cam.kx *= Math.pow(0.05, dt); B.cam.ky *= Math.pow(0.05, dt); B.cam.rot *= Math.pow(0.02, dt);
  if (B.speedLines > 0) B.speedLines -= dt;
  const shx = (Math.random() - 0.5) * B.shake, shy = (Math.random() - 0.5) * B.shake;
  // 开场镜头 + 冲击推镜
  const k0 = clamp(B.t / 1.5, 0, 1), e0 = 1 - Math.pow(1 - k0, 3);
  let z = (1.45 - 0.45 * e0) * (1 + B.cam.kz);
  let fx = P.EX + (800 - P.EX) * e0 + B.cam.kx, fy = (P.EY - 120) + (450 - (P.EY - 120)) * e0 + B.cam.ky;
  const A = B.anim, at = A ? clamp(A.t / A.dur, 0, 1) : 0;
  // 招牌技镜头：蓄力时推近攻击者
  if (A && A.kind === 'move' && MOVES[A.move].fx.sig && A.t > A.cut) { const u = (A.t - A.cut) / (A.dur - A.cut); const pull = Math.sin(clamp(u / A.H, 0, 1) * Math.PI) * 0.12; z *= 1 + pull; const sx0 = A.side === 'p' ? P.PX : P.EX; fx += (sx0 - fx) * pull * 1.5; }
  let camRot = B.cam.rot;
  if (A && A.kind === 'move' && MOVES[A.move].ult && A.t > A.cut) { const u2 = (A.t - A.cut) / (A.dur - A.cut); z *= 1.05 + 0.1 * Math.sin(Math.min(1, u2 / A.H) * Math.PI / 2); camRot += Math.sin(u2 * Math.PI) * 0.035 * (A.side === 'p' ? 1 : -1); const tx0 = A.side === 'p' ? P.EX : P.PX; fx += (tx0 - fx) * 0.25 * Math.min(1, u2 * 3); }
  if (B.slow > 0) z *= 1 + Math.min(0.15, B.slow * 0.15);
  z *= 1 + Math.abs(camRot) * 2.2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = uiScale();
  const im = IMG[B.bg];
  const isc = battleImgScale();
  const IL = 800 - 800 * isc, IR = 800 + 800 * isc, IT = 450 - 450 * isc, IB = 450 + 450 * isc;
  const hw = CW / 2 / (s * z), hh = CH / 2 / (s * z);
  const par = Math.sin(NOW * 0.25) * 10;
  fx = clamp(fx, IL + hw + 12, IR - hw - 12); fy = clamp(fy, IT + hh + 6, IB - hh - 6);
  ctx.setTransform(s * z, 0, 0, s * z, CW / 2 - fx * z * s + shx * s, CH / 2 - fy * z * s + shy * s);
  if (camRot) { ctx.translate(fx, fy); ctx.rotate(camRot); ctx.translate(-fx, -fy); }
  if (im) ctx.drawImage(im, IL + par - 12, IT, IR - IL + 24, IB - IT);
  else { ctx.fillStyle = '#9ad8ff'; ctx.fillRect(IL, IT, IR - IL, IB - IT); }
  // 漂浮光尘
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) { const x = (hash(i, 3) * 1700 + NOW * 25 * (0.5 + hash(i, 9))) % 1700 - 50, y = (hash(i, 7) * 800 + Math.sin(NOW + i) * 20); const r = 5 + hash(i, 1) * 8; ctx.drawImage(glowSprite('#fff6d0'), x - r, y - r, r * 2, r * 2); }
  ctx.restore();
  const e = B.enemy, p = active();
  const eo = { x: 0, y: 0, alpha: 1, flash: 0, scale: 1, rot: 0, sx: 1, sy: 1 }, po = { x: 0, y: 0, alpha: 1, flash: 0, scale: 1, rot: 0, sx: 1, sy: 1 };
  const off = sd => sd === 'e' ? eo : po;
  let S = null, Tg = null, u = 0;
  if (A) {
    const o = off(A.side), dirx = A.side === 'p' ? 1 : -1;
    if (A.kind === 'move') {
      S = A.side === 'p' ? { x: P.PX + 60, y: P.PY - 220 } : { x: P.EX - 50, y: P.EY - 160 };
      Tg = A.side === 'p' ? { x: P.EX, y: P.EY - 150 } : { x: P.PX, y: P.PY - 190 };
      u = A.t <= A.cut ? 0 : (A.t - A.cut) / (A.dur - A.cut);
      const mo = motionOf(MOVES[A.move].fx.m, u, A.H, dirx, Math.abs(Tg.x - S.x));
      o.x = mo.x; o.y = mo.y; o.rot = mo.rot; o.sx = mo.sx; o.sy = mo.sy; o.glow = mo.glow; if (mo.alpha !== undefined) o.alpha = mo.alpha; o.blink = mo.blink || 0;
      A.ax = S.x + o.x; A.ay = S.y + o.y; A.footY = A.side === 'p' ? P.PY : P.EY;
    }
    if (A.kind === 'lunge') { const l = at < 0.15 ? -Math.sin(at / 0.15 * Math.PI / 2) * 0.3 : at < 0.45 ? Math.sin((at - 0.15) / 0.3 * Math.PI) : 0; o.x = l * 90 * dirx; o.y = -l * 30 * dirx; }
    if (A.kind === 'faint') { o.y = easeInOut(at) * 120; o.alpha = 1 - at; o.flash = Math.min(1, at * 2.5); o.sy = 1 - at * 0.4; o.sx = 1 + at * 0.15; }
    if (A.kind === 'send' || A.kind === 'release') { o.scale = Math.max(0.01, easeBack(at)); o.flash = 1 - at; }
    if (A.kind === 'recall' || A.kind === 'absorb') { o.scale = Math.max(0.01, 1 - at); o.flash = Math.min(1, at * 2); }
    if (A.kind === 'levelup' || A.kind === 'heal') { o.flash = Math.sin(at * Math.PI) * 0.5; }
    if (A.kind === 'status') { o.x = Math.sin(at * 50) * 8 * (1 - at); o.flash = Math.sin(at * Math.PI) * 0.3; }
    if (A.kind === 'sig' || A.kind === 'dodge' || A.kind === 'taunt' || A.kind === 'dance' || A.kind === 'cheer') lifePose(A, o, at, dirx, B, P);
  }
  if (!stopped) { if (!A || A.side !== 'p' || A.kind === 'none') lifeIdle(B, 'p', po, dt); if (!A || A.side !== 'e' || A.kind === 'none') lifeIdle(B, 'e', eo, dt); }
  // 受击反应：顿帧 + 击退 + 闪白 + 挤压
  ['p', 'e'].forEach(sd => {
    const r = B.react[sd]; if (!r) return; if (!stopped) r.t += dt; const o = off(sd);
    if (r.t > 0.7) { B.react[sd] = null; return; }
    const k = r.t / 0.7;
    o.x += r.dir * 70 * r.pow * Math.sin(Math.min(1, k * 3) * Math.PI / 2) * (1 - k) + Math.sin(r.t * 80) * 12 * (1 - k);
    o.flash = Math.max(o.flash, k < 0.4 ? (Math.floor(r.t * 30) % 2 ? 0.9 : 0.25) : 0);
    o.sx *= 1 + 0.12 * (1 - k) * Math.sin(r.t * 40); o.sy *= 1 - 0.1 * (1 - k);
  });
  if (A && A.kind === 'move' && MOVES[A.move].ult && A.t > A.cut) drawUltBackdrop(B, A, (A.t - A.cut) / (A.dur - A.cut));
  const padGlow = (x, y, rx, c) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, 0.28); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(NOW * 2); ctx.drawImage(softSprite(c), -rx, -rx, rx * 2, rx * 2); ctx.restore(); };
  if (B.showE) padGlow(P.EX, P.EY, 220, TYPES[SPECIES[e.sp].t].c);
  if (B.showP) padGlow(P.PX, P.PY, 280, TYPES[SPECIES[p.sp].t].c);
  drawParticles(stopped ? 0 : dt, false);
  const drawMon = (side) => {
    const isE = side === 'e', m = isE ? e : p, o = isE ? eo : po, X = isE ? P.EX : P.PX, Y = isE ? P.EY : P.PY, size = isE ? 380 : 500;
    if (isE && (B.caught || !B.showE) && !(A && A.kind === 'faint' && A.side === 'e')) return;
    if (!isE && !B.showP && !(A && A.kind === 'faint' && A.side === 'p')) return;
    shadowEllipse(ctx, X + o.x * 0.3, Y, (isE ? 140 : 180) * o.scale, (isE ? 30 : 38) * o.scale, 0.45 * o.alpha);
    if (o.glow) glowOrb(X + o.x, Y - size * 0.4 + o.y, size * 0.7 * o.glow, TYPES[SPECIES[m.sp].t].c);
    const charging = A && A.kind === 'move' && A.side === side && MOVES[A.move].p > 0 && A.t > A.cut && (A.t - A.cut) / (A.dur - A.cut) < A.H;
    const rar = SPECIES[m.sp].rar, idleK = { legend: 0.75, epic: 0.5, rare: 0.2 }[rar] || 0;
    const actK = Math.max(charging ? ((MOVES[A.move].fx.sig || 0) + 1) / 3 : 0, B.gauge && B.gauge[side] >= 100 ? 0.55 : 0);
    if (!stopped && o.alpha > 0.3 && (B.showE || !isE)) drawAura(B, side, X + o.x, Y + o.y, size, actK >= idleK ? TYPES[SPECIES[m.sp].t].c : RARITY[rar].c, Math.max(actK, idleK));
    if (o.blink > 0.05 && !stopped && Math.random() < 0.7) for (let i = 0; i < 3; i++) pSpawn({ x: X + o.x + rnd(-size * 0.25, size * 0.25), y: Y + o.y - rnd(0, size * 0.6), vx: rnd(-120, 120), vy: -rnd(40, 200), ay: -40, drag: 1.5, life: 0.5, s: 40, s1: 90, c: 'rgba(235,240,255,0.7)', k: PK.smoke, front: true });
    // 冲刺残影
    if (A && A.kind === 'move' && A.side === side && Math.abs(o.x) > 40) for (let i = 1; i <= 3; i++) drawCreature(ctx, m.sp, X + o.x * (1 - i * 0.22), Y + o.y * (1 - i * 0.22), size * o.scale, { back: !isE, alpha: 0.18 * (4 - i) / 3, flash: 0.6, sx: o.sx, sy: o.sy, rot: o.rot });
    drawCreature(ctx, m.sp, X + o.x, Y + o.y, size * o.scale, { shiny: m.shiny, back: !isE, alpha: o.alpha, flash: o.flash, breathe: !stopped, phase: isE ? 1 : 0, sx: o.sx, sy: o.sy, rot: o.rot, flashColor: m.status === 'frz' && !o.flash ? 'rgba(160,230,255,0.45)' : undefined });
    if (m.status === 'frz' && !o.flash) drawCreature(ctx, m.sp, X + o.x, Y + o.y, size * o.scale, { back: !isE, alpha: 0.45, flash: 1, flashColor: 'rgba(170,235,255,0.6)', sx: o.sx, sy: o.sy });
    drawStatusFx(B, m, X + o.x, Y + o.y, size);
    if (m.shiny && !stopped && Math.random() < 0.25) pSpawn({ x: X + o.x + rnd(-size * 0.35, size * 0.35), y: Y + o.y - rnd(0, size * 0.8), vx: 0, vy: -20, ay: 0, drag: 1, life: 0.6, s: rnd(16, 30), s1: 0, c: '#fff6a0', k: PK.star, front: true });
  };
  // 攻击方在前
  if (A && A.kind === 'move' && A.side === 'e') { drawMon('p'); drawMon('e'); } else { drawMon('e'); drawMon('p'); }
  if (A && A.kind === 'move' && A.t > A.cut) drawMoveFx(B, A, u, { x: S.x + (MOVES[A.move].fx.m === 'dash' || MOVES[A.move].fx.m === 'jump' ? off(A.side).x : 0), y: S.y }, Tg, dt);
  if (A && A.kind === 'status') {
    const tx = A.side === 'e' ? P.EX : P.PX, ty = A.side === 'e' ? P.EY - 150 : P.PY - 190;
    const c = A.mtype === 'fire' ? '#ff7a30' : A.mtype === 'electric' ? '#ffe23a' : A.mtype === 'ice' ? '#9fe8ff' : '#8c9cff';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const r = 60 + at * 160 + i * 34; ctx.strokeStyle = hexA(c, (1 - at) * 0.8); ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(tx, ty + 40 + at * 60, r, r * 0.35, 0, 0, 6.28); ctx.stroke(); }
    if (A.mtype === 'normal') for (let i = 0; i < 5; i++) { const x = tx - 100 + i * 50, y = ty - 40 + ((at * 200 + i * 40) % 200); ctx.fillStyle = hexA(c, 1 - at); ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.fill(); }
    ctx.restore();
  }
  if (A && (A.kind === 'levelup' || A.kind === 'heal') && Math.random() < 0.7) pSpawn({ x: P.PX + rnd(-140, 140), y: P.PY - rnd(0, 60), vx: 0, vy: -rnd(200, 420), ay: 0, drag: 0.5, life: 0.8, s: 22, s1: 0, c: A.kind === 'heal' ? '#8affb0' : '#ffe9a0', k: 0, front: true });
  if (A && A.kind === 'send' && at < 0.1 && !A.fxd) { A.fxd = 1; const x = A.side === 'p' ? P.PX : P.EX, y = (A.side === 'p' ? P.PY : P.EY) - 150; burst(x, y, 30, { c: ['#ffffff', '#bff8ff'], k: 'glow', g: 0 }); addRing(B, x, y + 150, 240, '#ffffff', 0.6); }
  // 捕获球
  if (A && A.kind === 'throw') {
    const sx = 260, sy = 760, tx = P.EX, ty = P.EY - 170;
    const bx = sx + (tx - sx) * at, by = sy + (ty - sy) * at - Math.sin(at * Math.PI) * 380;
    for (let i = 1; i < 6; i++) { const kk = Math.max(0, at - i * 0.03); glowOrb(sx + (tx - sx) * kk, sy + (ty - sy) * kk - Math.sin(kk * Math.PI) * 380, 22 - i * 3, '#7ff0e2'); }
    drawBallIcon(bx, by, 36, at * 14);
  } else if (A && A.kind === 'absorb') {
    glowOrb(P.EX, P.EY - 170 + at * 130, 160 * (1 - at) + 30, '#bff8ff');
    drawBallIcon(P.EX, P.EY - 170 + at * 130, 36, 0);
  } else if (B.caught && B.showE) {
    const rot = A && A.kind === 'shake' ? Math.sin(at * Math.PI * 2) * 0.55 : 0;
    shadowEllipse(ctx, P.EX, P.EY, 40, 10, 0.4);
    drawBallIcon(P.EX + rot * 10, P.EY - 38, 38, rot);
    if (A && A.kind === 'click') { if (!A.fxd) { A.fxd = 1; burst(P.EX, P.EY - 40, 40, { c: ['#fff3a0', '#ffffff'], k: 'star', g: 200 }); } glowOrb(P.EX, P.EY - 40, 120 * (1 - at), '#fff3a0'); }
  }
  drawParticles(stopped ? 0 : dt, true);
  drawRingsStars(B, dt);
  drawBubbles(B, P);
  // 天气 / 闪光 / 速度线 / 暗角
  drawWeather(B, dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (B.speedLines > 0) { ctx.save(); ctx.translate(CW / 2, CH / 2); ctx.strokeStyle = 'rgba(255,255,255,' + B.speedLines + ')'; ctx.lineWidth = 3 * s; for (let i = 0; i < 60; i++) { const a = hash(i, 4) * 6.28 + NOW, r0 = Math.max(CW, CH) * (0.3 + hash(i, 5) * 0.2); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r0 * 2, Math.sin(a) * r0 * 2); ctx.stroke(); } ctx.restore(); }
  drawImpactFrame(B, dt);
  if (B.flash > 0.01) { ctx.fillStyle = 'rgba(' + (B.flashC || '255,255,255') + ',' + B.flash + ')'; ctx.fillRect(0, 0, CW, CH); }
  const vg = ctx.createRadialGradient(CW / 2, CH * 0.45, Math.min(CW, CH) * 0.4, CW / 2, CH / 2, Math.max(CW, CH) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,10,30,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, CW, CH);
  // ---- UI ----
  beginUI();
  const cinematic = A && A.kind === 'move' && A.cut > 0 && A.t <= A.cut;
  if (cinematic) drawCutInV4(B, A, A.t);
  drawStamps(B, dt);
  drawComboCounter(B, dt);
  drawActName(B); drawUltLine(B, cinematic);
  const uiIn = clamp((B.t - 0.9) / 0.5, 0, 1) * (cinematic ? 0 : 1), ue = 1 - Math.pow(1 - uiIn, 3);
  if (B.showE || (A && A.kind === 'faint' && A.side === 'e')) {
    const x = 50 - (1 - ue) * 640;
    glass(x, 44, 600, 140, 30, false, TYPES[SPECIES[e.sp].t].c);
    text(nameOf(e), x + 36, 92, 40, '#1b2440', 'left', '900');
    text('Lv.' + e.lvl, x + 564, 92, 34, '#3a4870', 'right', '900');
    typeBadge(SPECIES[e.sp].t, x + 330, 71, 100, 40);
    if (e.status) { rrect(x + 440, 72, 76, 38, 19, STATUS[e.status].c); text(STATUS[e.status].n, x + 478, 92, 24, '#1b1030', 'center', '900'); }
    e._tr = trail(e._tr, e.dhp, dt);
    hpBar(x + 36, 128, 528, e.dhp, stats(e).hp, e._tr, 28);
    if (B.trainer) for (let i = 0; i <= B.team.length; i++) drawBallIcon(x + 40 + i * 36, 210, 13);
    if (B.gauge) drawGaugeBar(x + 36, 166, 528, 11, B.gauge.e, B.gauge.e >= 100);
    rarityTag(SPECIES[e.sp].rar, x + 40, 44, e.shiny);
    if (B.enemyWeak) text('气势被压制！', x + 300, 210, 24, '#7ff0e2', 'left', '900', 'middle', true);
  }
  if (B.showP || (A && A.kind === 'faint' && A.side === 'p')) {
    const st = stats(p), x = 960 + (1 - ue) * 700;
    glass(x, 520, 600, 176, 30, false, TYPES[SPECIES[p.sp].t].c);
    text(nameOf(p), x + 36, 568, 40, '#1b2440', 'left', '900');
    text('Lv.' + p.lvl, x + 564, 568, 34, '#3a4870', 'right', '900');
    typeBadge(SPECIES[p.sp].t, x + 330, 547, 100, 40);
    if (p.status) { rrect(x + 440, 548, 76, 38, 19, STATUS[p.status].c); text(STATUS[p.status].n, x + 478, 568, 24, '#1b1030', 'center', '900'); }
    p._tr = trail(p._tr, p.dhp, dt);
    hpBar(x + 36, 604, 528, p.dhp, st.hp, p._tr, 28);
    text(Math.ceil(p.dhp) + ' / ' + st.hp, x + 564, 654, 28, '#1b2440', 'right', '800');
    const nx = xpFor(p.lvl + 1), cx = xpFor(p.lvl);
    text('EXP', x + 36, 676, 18, '#3a6aff', 'left', '900');
    rrect(x + 84, 670, 330, 10, 5, '#d5dcec'); const xg = ctx.createLinearGradient(x + 84, 0, x + 414, 0); xg.addColorStop(0, '#5ac8ff'); xg.addColorStop(1, '#3a6aff');
    rrect(x + 84, 670, Math.max(10, 330 * clamp((p.xp - cx) / (nx - cx), 0, 1)), 10, 5, xg);
    if (p.evoReady) text('✦ 可进化', x + 430, 676, 20, '#ff8a2a', 'left', '900');
    if (B.gauge) { drawGaugeBar(x + 300, 478, 300, 24, B.gauge.p, B.gauge.p >= 100, '奥义槽'); if (B.gauge.p >= 100) text('奥义可发动！', x + 445, 455, 22, '#ffd23a', 'center', '900', 'middle', true); }
  }
  for (let i = 0; i < 6; i++) { const m = G.party[i]; ctx.globalAlpha = (m ? (m.hp > 0 ? 1 : 0.35) : 0.18) * ue; drawBallIcon(1000 + i * 44 + (1 - ue) * 700, 494, 15); }
  ctx.globalAlpha = 1;
  // 连击 / 星星 / 双倍经验 指示
  if (ue > 0) {
    ctx.globalAlpha = ue;
    glass(1290 + (1 - ue) * 400, 44, 270, 96, 26, true, 'rgba(255,210,80,0.9)');
    text('★ ' + G.stars, 1316 + (1 - ue) * 400, 76, 30, '#ffd23a', 'left', '900');
    text('连对 ' + G.streak, 1316 + (1 - ue) * 400, 116, 26, G.streak >= 3 ? '#7ff0e2' : '#dfe8ff', 'left', '800');
    if (G.doubleExp > 0) text('双倍经验×' + G.doubleExp, 1540 + (1 - ue) * 400, 116, 22, '#ff9a5a', 'right', '900');
    text(B.asked ? '本场 ' + B.correct + '/' + B.asked : (B.trainer ? '数学对决' : '野生战斗'), 1540 + (1 - ue) * 400, 76, 22, '#aab8dd', 'right', '700');
    ctx.globalAlpha = 1;
  }
  drawBubblesUI(B);
  if (B.lvPanel) drawLvPanel(B.lvPanel);
  // 底部面板
  const py = 724 + (1 - ue) * 220;
  glass(30, py, 1540, 156, 30, true, 'rgba(127,240,226,0.9)');
  if (B.cur && B.cur.type === 'msg') B.lastMsg = B.cur.text;
  const showMsg = B.mode === 'queue' || B.mode === 'end' || B.mode === 'quiz';
  if (showMsg && B.cur && B.cur.type === 'msg') wrapText(B.cur.text.slice(0, Math.floor(B.cur.chars)), 84, py + 60, 1430, 40, 52, '#f4f7ff', '700', 'rgba(0,0,0,0.5)');
  else if (showMsg && B.lastMsg) wrapText(B.lastMsg, 84, py + 60, 1430, 40, 52, 'rgba(244,247,255,0.85)', '700', 'rgba(0,0,0,0.5)');
  if (showMsg && B.cur && B.cur.type === 'msg') {
    if (B.cur.chars >= B.cur.text.length) { const o = Math.sin(NOW * 6) * 5; ctx.fillStyle = '#7ff0e2'; ctx.beginPath(); ctx.moveTo(1500, py + 110 + o); ctx.lineTo(1526, py + 110 + o); ctx.lineTo(1513, py + 125 + o); ctx.fill(); }
  } else if (B.mode === 'menu' || B.mode === 'bag' || B.mode === 'party') {
    text(nameOf(p) + '要怎么做？', 84, py + 60, 42, '#f4f7ff', 'left', '800', 'middle', 'rgba(0,0,0,0.5)');
    text('出招前要先答一道数学题哦！', 84, py + 116, 26, '#7ff0e2', 'left', '700');
    const opts = [['战斗', '#ff6a4a', '#c8301a'], ['背包', '#ffb84a', '#d07a10'], ['队伍', '#4ad08a', '#1a9a50'], [B.trainer ? '不能逃' : '逃跑', '#5aa0ff', '#2a5ad0']];
    opts.forEach((o, i) => {
      const x = 860 + (i % 2) * 340, y = py + 16 + Math.floor(i / 2) * 64, sel = i === B.menu;
      const g = ctx.createLinearGradient(0, y, 0, y + 56); g.addColorStop(0, sel ? lighten(o[1], 0.2) : 'rgba(255,255,255,0.12)'); g.addColorStop(1, sel ? o[2] : 'rgba(255,255,255,0.05)');
      ctx.save(); if (sel) { ctx.shadowColor = hexA(o[1], 0.8); ctx.shadowBlur = 20; } rrect(x, y, 320, 56, 28, g); ctx.restore();
      rrect(x, y, 320, 56, 28, null, sel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', 2);
      ctx.fillStyle = o[1]; ctx.beginPath(); ctx.arc(x + 34, y + 28, 10, 0, 6.28); ctx.fill();
      text(o[0], x + 170, y + 29, 34, '#fff', 'center', '800', 'middle', 'rgba(0,0,0,0.35)');
    });
  } else if (B.mode === 'moves') {
    p.moves.forEach((mv, i) => {
      const M = MOVES[mv.id], x = 54 + (i % 2) * 520, y = py + 14 + Math.floor(i / 2) * 66, sel = i === B.moveIdx, c = TYPES[M.t].c;
      const g = ctx.createLinearGradient(x, y, x + 500, y + 58); g.addColorStop(0, sel ? lighten(c, 0.3) : hexA(c, 0.45)); g.addColorStop(1, sel ? c : hexA(c, 0.2));
      ctx.save(); if (sel) { ctx.shadowColor = hexA(c, 0.9); ctx.shadowBlur = 22; } rrect(x, y, 500, 58, 29, g); ctx.restore();
      rrect(x, y, 500, 58, 29, null, sel ? '#fff' : 'rgba(255,255,255,0.3)', sel ? 3 : 1.5);
      typeIcon(M.t, x + 34, y + 29, 13);
      text((M.fx.sig ? '★' : '') + M.n, x + 64, y + 30, 32, mv.pp > 0 ? '#fff' : 'rgba(255,255,255,0.4)', 'left', '800', 'middle', 'rgba(0,0,0,0.35)');
      text('PP ' + mv.pp + '/' + M.pp, x + 478, y + 30, 24, '#fff', 'right', '700', 'middle', 'rgba(0,0,0,0.35)');
    });
    if (B.gauge.p >= 100 || B.moveIdx === 4) {
      const U = MOVES[SPECIES[p.sp].ult], sel = B.moveIdx === 4, x = 1100, y = py + 14;
      const g = ctx.createLinearGradient(x, y, x + 450, y + 128); g.addColorStop(0, sel ? '#ffe08a' : 'rgba(255,190,60,0.55)'); g.addColorStop(1, sel ? '#ff5a1a' : 'rgba(200,60,20,0.45)');
      ctx.save(); ctx.shadowColor = '#ffb020'; ctx.shadowBlur = sel ? 34 : 14 + 8 * Math.sin(NOW * 6); rrect(x, y, 450, 128, 22, g); ctx.restore();
      rrect(x, y, 450, 128, 22, null, sel ? '#fff' : 'rgba(255,240,200,0.6)', sel ? 3 : 1.5);
      hanko(x + 58, y + 64, 78, '奥义');
      text(U.n.replace('奥义·', ''), x + 112, y + 50, U.n.length > 8 ? 30 : 36, '#fff', 'left', '900', 'middle', 'rgba(0,0,0,0.5)');
      text(sel ? '连答两题发动！　威力 ' + U.p : '按 → 或 5 选择奥义', x + 112, y + 98, 22, '#fff6d8', 'left', '800', 'middle', 'rgba(0,0,0,0.4)');
      if (sel) { if (B.moveIdx === 4) drawHint('Z/回车 发动奥义（需连答两题）　← 返回招式', true); return; }
    } else {
    const M = MOVES[p.moves[B.moveIdx].id];
    rrect(1100, py + 14, 450, 128, 22, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.25)', 1.5);
    typeBadge(M.t, 1124, py + 30, 110, 42);
    const ef = M.p ? effOf(M.t, SPECIES[e.sp].t) : 1;
    if (M.p && ef !== 1) text(ef > 1 ? '效果拔群！' : '效果不佳', 1528, py + 52, 28, ef > 1 ? '#ffd23a' : '#aab8dd', 'right', '900');
    text('威力 ' + (M.p || '—') + '　命中 ' + M.acc, 1124, py + 100, 28, '#dfe8ff', 'left', '700');
    text(M.fx.sig ? '进化招牌技！' : (M.hits ? M.hits + ' 段连击！' : '答对威力大增·可触发连击'), 1124, py + 130, 20, M.fx.sig ? '#ffcf5a' : '#7ff0e2', 'left', '700');
    }
  }
  if (G.pickUI) drawPickUI();
  if (B.mode === 'party' && G.partyUI) drawPartyUI();
  if (B.mode === 'bag' && G.bagUI) drawBagUI();
  if (B.mode === 'menu' || B.mode === 'moves') drawHint('方向键 选择　Z/回车 确认　X/Esc 返回', true);
  else if (B.mode === 'queue' && B.cur && B.cur.type === 'msg') drawHint('Z/回车 继续', true);
}
function drawLvPanel(L) {
  const k = easeOut(Math.min(1, L.t * 4)), x = 1600 - 420 * k + 20;
  ctx.save(); ctx.globalAlpha = Math.min(1, L.t * 4);
  glass(x - 20, 230, 380, 280, 26, true, 'rgba(255,210,80,0.95)');
  text('升级！Lv.' + L.lvl, x + 4, 272, 34, '#ffd23a', 'left', '900', 'middle', true);
  text(nameOf(L.m), x + 4, 312, 24, '#dfe8ff', 'left', '700');
  [['体力', 'hp'], ['攻击', 'atk'], ['防御', 'def'], ['速度', 'spd']].forEach(([n, key], i) => {
    const y = 356 + i * 38; text(n, x + 4, y, 26, '#fff', 'left', '700'); text(String(L.nw[key]), x + 220, y, 28, '#fff', 'right', '800');
    const d = L.nw[key] - L.old[key]; text('+' + d, x + 330, y, 28, '#7dfc9e', 'right', '900');
  });
  ctx.restore();
}
