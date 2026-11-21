// 招式学习界面 / 招式导师 截图 + 逻辑检查
const { chromium } = require('playwright-core'); const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v4';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => __game.quickStart('fox', 3));
  const ok = async () => { await page.evaluate(() => __game.press('ok')); await page.waitForTimeout(120); };
  // 招式导师
  await page.evaluate(() => { const m = makeMon('fox2', 24); m.dhp = m.hp; __game.G.party[0] = m; const o = __game.OBJS.find(o => o.type === 'movetutor' && o.id === 'tutor_cuifeng'); __game.teleport(o.x - 1, o.y, 'right'); interactObj(o); });
  for (let i = 0; i < 6 && !(await page.evaluate(() => !!__game.G.pickUI)); i++) await ok();
  await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'move_tutor_pick.png') }); console.log('✓ move_tutor_pick', await page.evaluate(() => __game.pick()));
  await ok(); // 选择第一项 → 答题
  for (let i = 0; i < 3; i++) { await page.evaluate(() => __game.answer(true)); await page.waitForTimeout(100); }
  await page.evaluate(() => __game.finishQuiz());
  for (let i = 0; i < 10 && !(await page.evaluate(() => !!__game.G.pickUI)); i++) { await page.waitForTimeout(150); if (await page.evaluate(() => !!__game.G.dialog)) await ok(); }
  await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'learn_move_replace.png') }); console.log('✓ learn_move_replace', await page.evaluate(() => __game.pick()));
  await page.evaluate(() => __game.press('down')); await ok();
  const mv = await page.evaluate(() => __game.G.party[0].moves.map(x => MOVES[x.id].n).join(','));
  console.log('招式：', mv);
  // 战斗中升级学习
  await page.evaluate(() => { __game.G.dialog = null; const m = makeMon('fox', 16); m.dhp = m.hp; __game.G.party[0] = m; m.xp = xpFor(17) - 1; __game.wild('bunny', 3); });
  for (let i = 0; i < 60; i++) { const st = await page.evaluate(() => __game.battleState()); if (st.mode === 'menu') break; await ok(); }
  await page.evaluate(() => { const B = __game.G.battle; const m = active(); while (m.moves.length < 4) m.moves.push({ id: ['tackle', 'growl', 'quickhit', 'focus'][m.moves.length], pp: 10 }); B.mode = 'queue'; Q(...learnMove(m, 'fireFang'), fn(() => { B.mode = 'menu'; })); });
  for (let i = 0; i < 10 && !(await page.evaluate(() => !!__game.G.pickUI)); i++) await ok();
  await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, 'learn_move_in_battle.png') }); console.log('✓ learn_move_in_battle', await page.evaluate(() => [__game.pick(), __game.G.battle.mode]));
  await ok(); for (let i = 0; i < 10; i++) { const st = await page.evaluate(() => __game.battleState()); if (st.mode === 'menu') break; await ok(); }
  console.log('战斗中学习后：', await page.evaluate(() => __game.G.party[0].moves.map(x => MOVES[x.id].n).join(',') + ' / ' + __game.G.battle.mode));
  console.log(errs.length ? '✗ 控制台问题: ' + errs.slice(0, 10).join(' | ') : '✓ 无控制台错误');
  await b.close();
})();
