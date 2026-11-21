// 端到端测试：3840×2160，file:// 加载
const { chromium } = require('playwright-core');
const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v4/e2e';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 3840, height: 2160 } });
  const errors = [], failed = [];
  page.on('pageerror', e => errors.push(String(e.stack || e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => failed.push(r.url()));
  const W = ms => page.waitForTimeout(ms), S = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const ev = (f, a) => page.evaluate(f, a);
  const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) process.exitCode = 1; };
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.scene() === 'title', null, { timeout: 60000 });
  ok(await ev(() => assetsFailed.length === 0), '全部美术资源加载成功 (' + await ev(() => ASSET_TOTAL) + ' 个)');
  await W(800); await S('01_title'); await ev(() => __game.G.timeScale = 3);
  // 新游戏 → 年级选择
  await page.keyboard.press('KeyZ'); await W(300);
  if (await ev(() => __game.scene()) === 'title') { await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyZ'); }
  await W(400);
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await W(300); // 5 年级
  await S('02_grade_select');
  await page.keyboard.press('KeyZ'); await W(500);
  ok(await ev(() => __game.G.grade) === 5, '选择 5 年级');
  await S('03_starter');
  await page.keyboard.press('KeyZ'); await W(200); await page.keyboard.press('KeyZ'); await W(900);
  ok(await ev(() => __game.scene() === 'world' && __game.G.party.length === 1), '选择初始灵兽进入大地图');
  for (let i = 0; i < 6; i++) { await page.keyboard.press('KeyZ'); await W(250); await page.keyboard.press('KeyZ'); await W(150); }
  await S('04_world_town');
  // 行走
  await page.keyboard.down('ArrowDown'); await W(1200); await page.keyboard.up('ArrowDown');
  ok(await ev(() => __game.G.player.y) !== null, '方向键移动');
  // 野生战斗：答题出招
  await ev(() => { __game.G.party[0].lvl = 11; __game.G.party[0].xp = xpFor(12) - 3; __game.G.party[0].hp = stats(__game.G.party[0]).hp; __game.wild('bunny', 6); });
  await W(600); await S('05_battle_intro');
  await page.waitForFunction(() => __game.G.battle.mode === 'menu' || (__game.G.battle.cur && __game.G.battle.cur.type === 'msg'), null, { timeout: 40000 });
  for (let i = 0; i < 12 && await ev(() => __game.G.battle.mode) !== 'menu'; i++) { await page.keyboard.press('KeyZ'); await W(300); }
  ok(await ev(() => __game.G.battle.mode) === 'menu', '战斗菜单出现');
  await page.keyboard.press('KeyZ'); await W(300); await S('06_battle_moves');
  await page.keyboard.press('KeyZ'); await W(500);
  ok(!!(await ev(() => __game.quizState())), '出招前弹出数学题');
  await S('07_battle_math_question');
  const before = await ev(() => __game.G.totalQ);
  await ev(() => __game.G.timeScale = 1);
  await page.keyboard.press(String(await ev(() => __game.G.quiz.q.ans + 1))); await W(400);
  await S('08_answer_correct');
  await ev(() => __game.freezeAt('p', 0.55));
  ok(await ev(b => __game.G.totalQ === b + 1 && __game.G.streak >= 1, before), '键盘答对，记录连对');
  // 等动画进行到中段截图
  await page.waitForFunction(() => __game.G.timeScale === 0, null, { timeout: 60000 }).catch(() => { });
  await W(300); await S('09_move_animation_mid'); await ev(() => __game.resume());
  for (let i = 0; i < 120 && await ev(() => __game.G.scene === 'battle'); i++) {
    const st = await ev(() => ({ q: !!__game.G.quiz, m: __game.G.battle && __game.G.battle.mode }));
    if (st.q) await ev(() => __game.answer(Math.random() < 0.7)); else if (st.m === 'menu') { await page.keyboard.press('KeyZ'); await W(150); await page.keyboard.press('KeyZ'); } else await page.keyboard.press('KeyZ');
    await W(450);
  }
  await W(800);
  ok(await ev(() => __game.scene()) === 'world', '战斗结束回到大地图');
  // 进化提示 → 进化试炼
  await W(300);
  const hasChoice = await ev(() => !!__game.G.choice);
  ok(hasChoice, '升级到进化等级后弹出进化提示');
  if (hasChoice) {
    await page.keyboard.press('KeyZ'); await W(400); await page.keyboard.press('KeyZ'); await W(300);
    await S('10_evolution_trial');
    for (let i = 0; i < 3; i++) { await ev(() => __game.answer(true)); await W(400); }
    await S('10b_trial_summary');
    await ev(() => __game.finishQuiz()); await W(300);
  } else await ev(() => __game.evolve(0));
  ok(await ev(() => __game.scene()) === 'evolve', '进化动画开始');
  for (const [t, n] of [[0.6, '11_evo_darken'], [2.0, '12_evo_glow'], [4.4, '13_evo_symbols_morph'], [6.1, '14_evo_burst'], [8.3, '15_evo_reveal']]) { await ev(t => __game.setTime(t), t); await W(120); await S(n); }
  await ev(() => __game.setTime(9.6)); await W(200); await page.keyboard.press('KeyZ'); await W(300);
  const sp = await ev(() => __game.G.party[0].sp);
  ok(sp.endsWith('2'), '进化成功：' + sp);
  for (let i = 0; i < 6 && await ev(() => !!__game.G.dialog); i++) { await page.keyboard.press('KeyZ'); await W(200); await page.keyboard.press('KeyZ'); await W(150); }
  // 进化形态参战 + 招牌技
  await ev(() => { const m = __game.G.party[0]; m.hp = stats(m).hp; m.dhp = m.hp; const sig = SPECIES[m.sp].sig; if (sig && !m.moves.some(x => x.id === sig)) m.moves[0] = { id: sig, pp: 10 }; __game.wild('rock', 12); });
  for (let i = 0; i < 12 && await ev(() => __game.G.battle.mode) !== 'menu'; i++) { await page.keyboard.press('KeyZ'); await W(300); }
  const sigIdx = await ev(() => __game.G.party[0].moves.findIndex(x => MOVES[x.id].fx.sig));
  await ev(i => { __game.G.battle.mode = 'moves'; __game.G.battle.moveIdx = i; }, Math.max(0, sigIdx));
  await page.keyboard.press('KeyZ'); await W(300); await ev(() => { __game.answer(true); __game.freezeAt('p', 0.6, true); });
  await page.waitForFunction(() => __game.G.timeScale === 0, null, { timeout: 60000 }).catch(() => { });
  await W(300); await S('16_signature_cutin');
  await ev(() => __game.freezeAt('p', 0.5));
  await page.waitForFunction(() => __game.G.timeScale === 0, null, { timeout: 60000 }).catch(() => { });
  await W(300); await S('17_evolved_signature_move');
  await ev(() => __game.freezeAt('p', 0.75));
  await page.waitForFunction(() => __game.G.timeScale === 0, null, { timeout: 60000 }).catch(() => { });
  await W(300); await S('17b_signature_impact'); await ev(() => __game.resume());
  await ev(() => { endBattle('run'); }); await W(1200);
  // 地图与迷你地图
  await ev(() => __game.G.mapUI = true); await W(300); await S('18_world_map'); await ev(() => __game.G.mapUI = false);
  // 数学之门
  const g = await ev(() => { const g = __game.GATES.find(g => g.type === 'gate'); const [x, y] = g.tiles[0]; const n = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']].find(([dx, dy]) => walkable(x + dx, y + dy)); __game.teleport(x + n[0], y + n[1], n[2]); return { id: g.id, name: g.name }; });
  await W(800); await S('19_math_gate');
  await page.keyboard.press('KeyZ'); await W(300); await page.keyboard.press('KeyZ'); await W(300); await page.keyboard.press('KeyZ'); await W(300);
  await S('20_gate_quiz');
  for (let i = 0; i < 3; i++) { await ev(() => __game.answer(true)); await W(400); }
  await ev(() => __game.finishQuiz()); await W(400);
  ok(await ev(id => !!__game.G.flags.gates[id], g.id), '答题打开 ' + g.name);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('KeyZ'); await W(200); }
  // 地区切换
  const regs = [];
  for (const rid of ['flower', 'forest', 'desert', 'snow', 'volcano', 'lake']) {
    const p = await ev(rid => { const R = __game.REGIONS.find(r => r.id === rid); const t = __game.TOWNS.find(t => t.r === rid); __game.teleport(t.x + 1, t.y + 2, 'down'); return t.n; }, rid);
    await W(1300); regs.push(await ev(() => curRegion().id));
    await S('21_region_' + rid);
  }
  ok(regs.join() === 'flower,forest,desert,snow,volcano,lake', '地区切换：' + regs.join(' → '));
  // 错题本 & 统计
  await ev(() => { __game.answer; for (let i = 0; i < 3; i++) { const q = MathQ.next({ grade: 5 }); recordAnswer(q, false, false); } });
  await ev(() => __game.G.statsUI = { tab: 0, idx: 0 }); await W(300); await S('22_stats');
  await ev(() => __game.G.statsUI = { tab: 1, idx: 0 }); await W(300); await S('23_wrong_book');
  await ev(() => __game.G.statsUI = null);
  // 竞赛宝箱题 + 鼠标答题
  await ev(() => startQuiz({ source: 'gold', count: 1, forceComp: true, title: '金色竞赛宝箱' }, () => { }));
  await W(400); await S('24_competition_question');
  const r = await ev(() => { const i = __game.G.quiz.q.ans; const rc = quizChoiceRect(i); const s = uiScale(); return { x: (rc.x + 50) * s + (CW - 1600 * s) / 2, y: (rc.y + 50) * s + (CH - 900 * s) / 2 }; });
  await page.mouse.click(r.x, r.y); await W(300);
  ok(await ev(() => __game.G.quiz && __game.G.quiz.fbOk === true), '鼠标点击答对竞赛题');
  await ev(() => __game.finishQuiz()); await W(300);
  // 存档读档
  await ev(() => saveGame()); const reload = await ev(() => { const s = __game.G.stars; return loadGame() && __game.G.stars === s; });
  ok(reload, '存档 / 读档');
  await W(300);
  const fps = await ev(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
  console.log('无 GPU 软件渲染帧率（参考）：', fps);
  ok(errors.length === 0, '控制台无错误' + (errors.length ? '：\n' + errors.slice(0, 8).join('\n') : ''));
  ok(failed.length === 0, '无加载失败请求' + (failed.length ? failed.join(',') : ''));
  await browser.close();
})();
