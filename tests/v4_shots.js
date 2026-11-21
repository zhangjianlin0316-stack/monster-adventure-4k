// v4 图鉴 / 稀有灵兽 / 传说神社 / 异色 截图
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
  const snap = async (n) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, n + '.png') }); console.log('✓', n); };
  const toMenu = async () => { for (let i = 0; i < 100; i++) { const st = await page.evaluate(() => __game.battleState()); if (!st || st.mode === 'menu') return; if (st.cur === 'msg') await page.evaluate(() => __game.press('ok')); await page.waitForTimeout(80); } };
  // 图鉴
  await page.evaluate(() => { const F = __game.G.flags; F.seen = {}; F.dex = {}; const ks = Object.keys(__game.SPECIES); ks.forEach((k, i) => { if (i % 3 !== 2) F.seen[k] = 1; if (i % 3 === 0) F.dex[k] = 1; }); F.shinyDex = { cat: 1 }; ['qilin', 'whale', 'zhulong', 'dragon3', 'cat3'].forEach(k => { F.seen[k] = 1; F.dex[k] = 1; }); __game.dex(0); });
  await snap('dex_page1');
  await page.evaluate(() => { __game.G.dexUI.idx = __game.SPECIES ? Object.keys(__game.SPECIES).indexOf('cat3') : 0; }); await snap('dex_cat3_epic');
  await page.evaluate(() => { __game.G.dexUI.idx = Object.keys(__game.SPECIES).indexOf('qilin'); }); await snap('dex_qilin_legend');
  await page.evaluate(() => { __game.G.dexUI.idx = Object.keys(__game.SPECIES).indexOf('owl2'); }); await snap('dex_unseen_hint');
  await page.evaluate(() => { __game.G.dexUI = null; });
  // 稀有遭遇
  for (const [sp, lv, shiny, name] of [['dragon', 20, false, 'encounter_epic_dragon'], ['owl', 16, false, 'encounter_rare_owl'], ['cat', 18, true, 'encounter_shiny_cat'], ['whale', 38, false, 'encounter_legend_whale'], ['zhulong', 42, false, 'encounter_legend_zhulong'], ['crane2', 30, false, 'encounter_epic_crane'], ['koi2', 30, false, 'encounter_rare_koi'], ['golem3', 36, false, 'encounter_golem3'], ['moth3', 34, false, 'encounter_moth3'], ['otter3', 34, false, 'encounter_otter3'], ['tanuki2', 30, false, 'encounter_tanuki2']]) {
    await page.evaluate(([sp, lv, sh]) => { if (__game.G.battle) { __game.G.battle = null; __game.G.scene = 'world'; } const m = makeMon(sp, lv); if (sh) m.shiny = true; __game.G.dialog = null; startBattle(m, sp === 'whale' || sp === 'zhulong' ? { legend: true } : {}); }, [sp, lv, shiny]);
    await toMenu(); await snap(name);
  }
  await page.evaluate(() => { __game.G.battle = null; __game.G.scene = 'world'; });
  // 神社
  const o = await page.evaluate(() => { const o = __game.OBJS.find(o => o.type === 'shrine' && o.sp === 'zhulong'); __game.teleport(o.x, o.y + 2, 'up'); return [o.x, o.y]; });
  await snap('shrine_zhulong_world');
  console.log(errs.length ? '✗ 控制台问题: ' + errs.slice(0, 10).join(' | ') : '✓ 无控制台错误');
  await b.close();
})();
