// v5 截图：灵兽台词气泡 / 招牌动作 / 奥义台词 / 闪避 / 图鉴口头禅 …（SECT 环境变量选择部分）
const { chromium } = require('playwright-core'); const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v5';
const SECT = (process.env.SECT || 'talk,dex').split(',');
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => { AudioSys.unlock(); __game.quickStart('fox', 4); });
  await page.waitForFunction(() => VoicePack.loaded.mons && VoicePack.loaded.tutor, null, { timeout: 60000 });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  const S = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const W = ms => page.waitForTimeout(ms);
  // 自动推进战斗文字，直到条件成立
  const until = async (cond, arg, max) => { for (let i = 0; i < (max || 120); i++) { if (await page.evaluate(cond, arg)) return true; await page.evaluate(() => { const B = G.battle; if (B && B.cur && B.cur.type === 'msg' && B.cur.t > 0.25) { B.cur.chars = 999; B.cur = null; } }); await W(120); } return false; };
  const waitAnim = (kind, side) => until(([k, s]) => !!(G.battle && G.battle.anim && G.battle.anim.kind === k && (!s || G.battle.anim.side === s)), [kind, side]);
  global.__ctx = { page, ok, S, W, waitAnim, until };
  if (SECT.includes('talk')) {
    await page.evaluate(() => { __game.setParty('fox3', 40); G.noKO = true; __game.wild('qilin', 40); });
    await waitAnim('sig', 'e'); await W(500); await S('v5_enemy_entry_catchphrase');
    ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.side === 'e' && b.kind === 'sum')), '敌方出场口头禅气泡');
    await waitAnim('sig', 'p'); await W(450); await S('v5_player_signature_action');
    ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.side === 'p') && !!G.battle.actName), '我方出场台词 + 招牌动作名');
    await until(() => G.battle.mode === 'menu');
    await page.evaluate(() => { G.battle.lastTalk = null; __game.cast('p', SPECIES.fox3.ult, { correct: true, pass: true, ok: 2, n: 2 }); });
    await until(() => !!(G.battle.anim && G.battle.anim.kind === 'move' && G.battle.anim.t > 0.9));
    await S('v5_ult_catchphrase'); ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.kind === 'ult')), '奥义台词字幕');
    await until(() => G.battle.mode !== 'queue', null, 300);
    await page.evaluate(() => { const B = G.battle; B.queue = []; B.cur = null; B.anim = null; B.mode = 'queue'; B.lastTalk = null; Q({ type: 'anim', kind: 'move', side: 'e', move: 'tackle', mtype: 'normal', dur: 0.6, cut: 0, H: 0.5, miss: true }, fn(() => monTalk('p', 'dodge', { force: true })), { type: 'anim', kind: 'dodge', side: 'p', mtype: 'normal', dur: 0.6 }, msg('但是没有命中！')); });
    await waitAnim('dodge', 'p'); await W(200); await S('v5_dodge_line');
    await page.evaluate(() => endBattle('run')); await W(1500);
  }
  if (SECT.includes('dex')) {
    await page.evaluate(() => { DEX_ORDER.forEach(s => { G.flags.seen = G.flags.seen || {}; G.flags.seen[s] = 1; }); __game.dex(DEX_ORDER.indexOf('zhulong')); });
    await W(300); await page.keyboard.press('KeyZ'); await W(600); await S('v5_dex_catchphrase');
    ok(await page.evaluate(() => !!G.say), '图鉴里按 Z 播放台词');
    await page.evaluate(() => { G.dexUI = null; });
  }
  if (SECT.includes('wish')) {
    await page.evaluate(() => { __game.gems(1000); __game.openWish(0); }); await W(800); await S('v5_wish_banner_limited');
    await page.keyboard.press('ArrowRight'); await W(700); await S('v5_wish_banner_standard'); await page.keyboard.press('ArrowLeft'); await W(300);
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyZ'); await W(500); await S('v5_wish_rates'); await page.keyboard.press('KeyZ'); await W(200);
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
    // 金色流星（强制一个 5★）
    await page.evaluate(() => __game.forceWish([5])); await W(1900); await S('v5_wish_gold_meteor');
    await page.waitForFunction(() => G.wishUI.phase === 'reveal', null, { timeout: 10000 }); await W(1500); await S('v5_wish_reveal_5star');
    const r = await page.evaluate(() => __game.wishUI()); ok(r.res[0].star === 5 && !!r.res[0].sp, '5★ 揭晓：' + (r.res[0].sp) + ' ' + r.res[0].out);
    await page.keyboard.press('KeyZ'); await W(300);
    // 真实 10 连
    const g0 = await page.evaluate(() => G.flags.gems);
    await page.evaluate(() => __game.doWish(10)); await W(500);
    const r10 = await page.evaluate(() => __game.wishUI()); ok(r10.n === 10 && r10.res.some(x => x.star >= 4), '10 连抽：至少 1 个 4★+（' + r10.res.map(x => x.star).join('') + '）');
    ok(await page.evaluate(g => G.flags.gems === g - 200, g0), '10 连消耗 ◆200');
    for (let i = 0; i < 30; i++) { const ph = await page.evaluate(() => G.wishUI.phase + G.wishUI.ri); if (ph.startsWith('summary')) break; await page.keyboard.press('KeyZ'); await W(i === 1 ? 900 : 650); if (i === 1) await S('v5_wish_reveal_card'); }
    await page.waitForFunction(() => G.wishUI.phase === 'summary' || G.wishUI.phase === 'banner', null, { timeout: 20000 }).catch(() => { });
    if (await page.evaluate(() => G.wishUI.phase === 'summary')) { await W(1500); await S('v5_wish_summary10'); }
    await page.evaluate(() => { G.wishUI.phase = 'banner'; G.flags.gems = 5; }); await page.keyboard.press('KeyZ'); await W(200);
    ok(await page.evaluate(() => G.wishUI.phase === 'banner' && G.flags.gems === 5), '灵晶不足时无法祈愿');
    await page.evaluate(() => { G.wishUI = null; }); await W(300); await S('v5_world_hud_gems');
  }
  if (SECT.includes('events')) {
    await page.evaluate(() => { G.party[0].hp = G.party[0].hp; __game.setParty('lizard3', 30); G.noKO = true; __game.wild('turtle2', 28); });
    await until(() => G.battle && G.battle.mode === 'menu', null, 300);
    // 元素反应：水附着 + 火招
    const fm = await page.evaluate(() => Object.keys(MOVES).find(k => MOVES[k].t === 'fire' && MOVES[k].p > 0 && !MOVES[k].ult && !MOVES[k].fx.sig && FXDEF[MOVES[k].fx.k].type === 'proj'));
    await page.evaluate(m => { const B = G.battle; B.aura = { p: null, e: { el: 'water', turns: 2 } }; B.queue = []; B.cur = null; B.anim = null; B.mode = 'queue'; Q(act('p', m, 0, null)); }, fm);
    await W(300); await S('v5_elem_aura_badge');
    await until(() => !!(G.battle.stamps || []).find(s => /蒸汽爆/.test(s.text)), null, 200); await W(150); await S('v5_elem_reaction_steam');
    ok(await page.evaluate(() => (G.battle.reactions || 0) >= 1), '元素反应「蒸汽爆」触发');
    await until(() => G.battle.mode !== 'queue', null, 300);
    for (const ev of ['weather', 'riddle', 'banter', 'roulette', 'dance', 'stars']) {
      await page.evaluate(() => { const B = G.battle; B.mode = 'menu'; B.lastTalk = null; });
      ok(await page.evaluate(id => __game.event(id), ev), '随机事件触发：' + ev);
      await W(700); await S('v5_event_' + ev);
      // 推进：遇到答题就答对
      for (let i = 0; i < 80; i++) {
        const st = await page.evaluate(() => ({ q: !!G.quiz, mode: G.battle && G.battle.mode, ev: !!(G.battle && G.battle.event) }));
        if (st.q) { if (ev === 'roulette' || ev === 'stars' || ev === 'riddle' || ev === 'dance') { await W(300); await S('v5_event_' + ev + '_quiz'); } await page.evaluate(() => __game.answer(true)); await W(400); await page.evaluate(() => { for (let i = 0; i < 3 && G.quiz; i++) { G.quiz.t = 9; quizContinue(); } }); if (ev === 'roulette') { await W(1100); await S('v5_event_roulette_spin'); } continue; }
        if (!st.ev && st.mode === 'menu') break;
        await page.evaluate(() => { const B = G.battle; if (B && B.cur && B.cur.type === 'msg' && B.cur.t > 0.25) { B.cur.chars = 999; B.cur = null; } }); await W(150);
      }
      ok(await page.evaluate(() => G.battle.mode === 'menu' && !G.battle.event), '事件结束回到战斗菜单：' + ev);
    }
    ok(await page.evaluate(() => G.battle.luckyMul === 2), '幸运转盘答对 → 下一招 ×2');
    await page.evaluate(() => endBattle('run')); await W(1200);
  }
  if (SECT.includes('oculus')) {
    const o = await page.evaluate(() => { const o = OBJS.find(x => x.type === 'oculus' && x.region === 'meadow'); const n = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']].find(([dx, dy]) => walkable(o.x + dx, o.y + dy)); __game.teleport(o.x + n[0], o.y + n[1], n[2]); return o.id; });
    await W(900); await S('v5_oculus_world');
    for (let i = 0; i < 10 && !(await page.evaluate(() => !!G.quiz)); i++) { await page.keyboard.press('KeyZ'); await W(350); }
    await W(500); await S('v5_oculus_quiz');
    for (let i = 0; i < 2; i++) { await page.evaluate(() => __game.answer(true)); await W(400); }
    await page.evaluate(() => __game.finishQuiz()); await W(400);
    ok(await page.evaluate(id => !!G.flags.objs[id] && G.flags.oculi >= 1, o), '答对 2 题收集灵瞳');
    for (let i = 0; i < 3; i++) { await page.keyboard.press('KeyZ'); await W(200); }
  }
  for (const f of (process.env.EXTRA || '').split(',').filter(Boolean)) await require('./' + f)(global.__ctx);
  ok(errs.length === 0, '无控制台错误' + (errs.length ? '：' + errs.slice(0, 6).join(' | ') : ''));
  await b.close(); process.exit(pass ? 0 : 1);
})();
