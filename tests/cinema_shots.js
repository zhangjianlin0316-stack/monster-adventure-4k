// 战斗演出截图：技能特写 / 奥义 / 连击 / 冲击帧 / 敌方奥义
const { chromium } = require('playwright-core'); const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v4';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => __game.quickStart('fox', 4));
  const toMenu = async () => { for (let i = 0; i < 200; i++) { const st = await page.evaluate(() => __game.battleState()); if (!st || st.mode === 'menu') return; if (st.quiz) await page.evaluate(() => __game.answer(true)); if (st.cur === 'msg') await page.evaluate(() => __game.press('ok')); await page.waitForTimeout(60); } };
  const shot = async (name, side, id, frac, cut, res, prep) => {
    await toMenu();
    await page.evaluate(([p]) => { const G = __game.G; G.timeScale = 3; const B = G.battle; [B.enemy, G.party[0]].forEach(m => { healMon(m); }); if (p) eval(p); }, [prep || '']);
    await page.evaluate(([s, id, res]) => __game.cast(s, id, res), [side, id, res || null]);
    await page.evaluate(([s, f, c]) => __game.freezeAt(s, f, c), [side, frac, cut]);
    for (let i = 0; i < 300; i++) { const st = await page.evaluate(() => ({ ts: __game.G.timeScale, b: __game.battleState() })); if (st.ts === 0) break; if (st.b.quiz) await page.evaluate(() => __game.answer(true)); else if (st.b.cur === 'msg') await page.evaluate(() => __game.press('ok')); await page.waitForTimeout(40); }
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('✓', name);
    await page.evaluate(() => __game.resume());
  };
  const which = (process.env.SHOTS || 'all');
  await page.evaluate(() => { __game.G.party[0] = Object.assign(__game.G.party[0], {}); __game.setParty('fox3', 34); __game.wild('qilin', 50); __game.G.noKO = true; __game.G.timeScale = 3; });
  const R = { correct: true, fast: true, comp: false, ok: 2, n: 2, pass: true };
  await shot('cutin_normal', 'p', 'flamethrower', 0.55, true, R);
  await shot('cutin_sig2', 'p', 'sigFox3', 0.6, true, R);
  await shot('ult_1_ink', 'p', 'ultFox', 0.07, true, R);
  await shot('ult_2_portrait', 'p', 'ultFox', 0.62, true, R);
  await shot('ult_3_name', 'p', 'ultFox', 0.8, true, R);
  await shot('ult_4_attack', 'p', 'ultFox', 0.45, false, R);
  await shot('combo_shadowclone', 'p', 'shadowClone', 0.4, false, R);
  await shot('combo_hits_counter', 'p', 'fireFang', 0.75, false, R);
  await shot('impact_frame', 'p', 'sigFox3', 0.505, false, R);
  await shot('blink_aquajet', 'p', 'heatWave', 0.3, false, R);
  await shot('enemy_cutin', 'e', 'sigQilinB', 0.55, true);
  await shot('enemy_ult_cut', 'e', 'ultQilin', 0.7, true);
  await shot('enemy_ult_attack', 'e', 'ultQilin', 0.5, false);
  await page.evaluate(() => { __game.setParty('dragon3', 42); __game.G.battle.pi = 0; });
  await shot('ult_dragon_cut', 'p', 'ultDragon', 0.75, true, R);
  await shot('ult_dragon_attack', 'p', 'ultDragon', 0.5, false, R);
  await page.evaluate(() => { __game.setParty('cat3', 42); });
  await shot('ult_cat_clones', 'p', 'ultCat', 0.4, false, R);
  await shot('cat_talisman', 'p', 'sigCat3', 0.3, false, R);
  await toMenu(); await page.evaluate(() => { __game.gauge(100, 40); __game.G.battle.mode = 'moves'; __game.G.battle.moveIdx = 4; }); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'ult_menu.png') }); console.log('✓ ult_menu');
  console.log(errs.length ? '✗ 控制台问题: ' + errs.slice(0, 10).join(' | ') : '✓ 无控制台错误');
  await b.close();
})();
