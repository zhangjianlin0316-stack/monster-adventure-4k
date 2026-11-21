// ================== v4：招式选择界面（学习新招式时选择遗忘哪一个）+ 招式导师 ==================
// 通用招式列表选择器：G.pickUI = { title, sub, items: [{ id | label }], idx, cb(i) }
function openPick(title, sub, items, cb) { G.pickUI = { title, sub, items, idx: 0, cb, t0: NOW }; G.held = []; }
function pickInput(k) {
  const U = G.pickUI, n = U.items.length;
  if (k === 'up') { U.idx = (U.idx + n - 1) % n; AudioSys.sfx('move'); }
  if (k === 'down') { U.idx = (U.idx + 1) % n; AudioSys.sfx('move'); }
  if (/^[1-5]$/.test(k) && +k <= n) U.idx = +k - 1;
  if (k === 'cancel') { const cb = U.cb; G.pickUI = null; AudioSys.sfx('cancel'); cb(-1); return; }
  if (k === 'ok') { const cb = U.cb, i = U.idx; G.pickUI = null; AudioSys.sfx('confirm'); cb(i); }
}
function moveTag(M) { return M.ult ? '奥义' : M.fx.sig === 2 ? '终极招牌技' : M.fx.sig ? '招牌技' : M.hits ? M.hits + '段连击' : M.p ? '' : '变化技'; }
function drawPickUI() {
  const U = G.pickUI; beginUI();
  const k = easeOut(clamp((NOW - U.t0) * 5, 0, 1));
  ctx.fillStyle = 'rgba(5,8,24,' + 0.6 * k + ')'; ctx.fillRect(-400, -200, 2400, 1300);
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 40);
  glass(200, 70, 1200, 770, 32, true, 'rgba(255,200,90,0.9)');
  text(U.title, 800, 125, 38, '#ffd23a', 'center', '900', 'middle', true);
  wrapText(U.sub, 260, 180, 1080, 24, 34, '#dfe8ff', '700');
  U.items.forEach((it, i) => {
    const y = 250 + i * 104, sel = i === U.idx;
    if (it.label) { rrect(260, y, 1080, 88, 24, sel ? 'rgba(255,200,90,0.85)' : 'rgba(255,255,255,0.08)', sel ? '#fff' : 'rgba(255,255,255,0.3)', sel ? 3 : 1.5); text(it.label, 800, y + 45, 30, sel ? '#3a1d00' : '#fff', 'center', '900'); return; }
    const M = MOVES[it.id], c = TYPES[M.t].c;
    const g = ctx.createLinearGradient(260, y, 1340, y); g.addColorStop(0, sel ? lighten(c, 0.25) : hexA(c, 0.4)); g.addColorStop(1, sel ? hexA(c, 0.85) : hexA(c, 0.12));
    ctx.save(); if (sel) { ctx.shadowColor = c; ctx.shadowBlur = 22; } rrect(260, y, 1080, 88, 24, g); ctx.restore();
    rrect(260, y, 1080, 88, 24, null, sel ? '#fff' : 'rgba(255,255,255,0.3)', sel ? 3 : 1.5);
    if (it.isNew) { rrect(276, y + 12, 64, 28, 14, '#ff5a3a'); text('新', 308, y + 27, 20, '#fff', 'center', '900'); }
    typeBadge(M.t, 352, y + 24, 92, 40);
    text(M.n, 466, y + 44, 34, '#fff', 'left', '900', 'middle', 'rgba(0,0,0,0.45)');
    const tag = moveTag(M); if (tag) text(tag, 466 + Math.min(320, M.n.length * 36) + 16, y + 46, 20, M.fx.sig ? '#ffe08a' : '#7ff0e2', 'left', '900', 'middle', true);
    text('威力 ' + (M.p || '—') + '　命中 ' + M.acc + '　PP ' + M.pp, 1320, y + 44, 24, '#fff', 'right', '800', 'middle', 'rgba(0,0,0,0.45)');
  });
  drawHint('↑↓ 选择　Z/回车 确认　X/Esc 取消', false);
  ctx.restore();
}
// 学习招式：已满 4 个时让玩家选择遗忘哪一个（或放弃学习）
function openLearnUI(m, id, done) {
  const M = MOVES[id];
  const items = m.moves.map(x => ({ id: x.id })).concat([{ id, isNew: true }]);
  openPick(nameOf(m) + '想学习「' + M.n + '」！', '但是一只灵兽最多只能掌握 4 个招式。请选择要遗忘的招式（选择最下面的新招式 = 放弃学习）。', items, i => {
    if (i < 0 || i === 4) { done(nameOf(m) + '没有学习' + M.n + '。'); return; }
    const old = MOVES[m.moves[i].id].n; m.moves[i] = { id, pp: M.pp };
    AudioSys.sfx('levelup'); done('1、2……哔！' + nameOf(m) + '忘记了' + old + '，学会了' + M.n + '！');
  });
}
// 战斗外的待学习队列（例如进化时同时领悟了多个招式）
function queueLearn(m, id) { if (m.moves.some(x => x.id === id)) return; if (m.moves.length < 4) { m.moves.push({ id, pp: MOVES[id].pp }); toast(nameOf(m) + '学会了' + MOVES[id].n + '！'); return; } (G.pendingLearn = G.pendingLearn || []).push([m, id]); }
function processPendingLearn() {
  if (!G.pendingLearn || !G.pendingLearn.length || G.pickUI || G.dialog || G.quiz || G.choice || G.scene !== 'world') return;
  const [m, id] = G.pendingLearn.shift(); if (!G.party.includes(m) || m.moves.some(x => x.id === id)) return;
  openLearnUI(m, id, txt => say(txt));
}
// ---------- 招式导师：用数学挑战换取招式 ----------
function tutorMovesFor(m) {
  const S = SPECIES[m.sp], know = new Set(m.moves.map(x => x.id)), out = [];
  const add = id => { if (MOVES[id] && !know.has(id) && !out.includes(id) && MOVES[id].p > 0) out.push(id); };
  (S.sigs || []).forEach(add);
  S.learn.filter(e => e[0] <= m.lvl).map(e => e[1]).reverse().forEach(add);
  (TYPE_LEARN[S.t] || []).forEach(e => { if (m.lvl + 6 >= e[0]) add(e[1]); });
  if (m.lvl >= 10) add('swiftStar'); if (m.lvl >= 18) add('shadowClone');
  return out.slice(0, 5);
}
function interactMoveTutor(o) {
  const m = G.party[0]; if (!m) return;
  const list = tutorMovesFor(m);
  if (!list.length) { say(o.name + '：' + nameOf(m) + '已经掌握了我能教的所有招式，继续变强吧！'); return; }
  say([o.name + '：我是招式导师。只要通过我的数学挑战（3 题答对 2 题），我就教' + nameOf(m) + '一招！', '（会教给队伍里的第一只灵兽）'], () =>
    openPick(o.name + '：想学哪一招？', '可以学习已经遗忘的招式、进化招牌技，以及属性进阶招式。', list.map(id => ({ id })).concat([{ label: '下次再说' }]), i => {
      if (i < 0 || i >= list.length) return;
      const id = list[i];
      startQuiz({ source: 'tutor', count: 3, need: 2, theme: curRegion().theme, title: '招式导师的挑战：' + MOVES[id].n, sub: '3 道题答对 2 道，就能学会这一招！' }, res => {
        if (!res.pass) { say(o.name + '：答对了 ' + res.ok + ' 题，再复习一下错题本吧！'); return; }
        AudioSys.sfx('gold');
        if (m.moves.length < 4) { m.moves.push({ id, pp: MOVES[id].pp }); say(o.name + '：很好！' + nameOf(m) + '学会了' + MOVES[id].n + '！'); }
        else openLearnUI(m, id, txt => say(txt));
      });
    }));
}
