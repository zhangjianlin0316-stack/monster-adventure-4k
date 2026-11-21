// 星老师讲解动画截图 + 无报错检查
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
  const list = (process.env.VIZ || 'g1_add20:tenframe,g1_add100:columns,g2_mul:array,g2_div:group,g1_clock:clock,g2_money:coins,g3_frac:pie,g5_fracadd:fracbar,g6_fracmul:fracbar,g3_perim:perim,g5_area:area,g5_cuboid:box,g4_angle:angle,g4_avg:avg,g5_eq:balance,g6_ratio:ratio,g6_percent:percent,g6_circle:circle,g6_cyl:cyl,c_chick:chick,c_sumdiff:segment,c_summul:segment,c_trip:trip,c_tree:trees,c_pigeon:pigeon,c_comb:handshake,c_queue:queue,c_pattern:pattern,g3_muldiv:longdiv,g3_time:timeline,c_work:steps,g5_factor:steps').split(',');
  for (const it of list) {
    const [kp, viz] = it.split(':');
    const got = await page.evaluate(([k, v]) => __game.tutorFor(k, 4, v), [kp, viz]);
    const n = await page.evaluate(() => __game.tutor().n);
    for (const s of [Math.min(1, n - 1), n - 1]) { await page.evaluate(([s]) => __game.tutorSet(s, 2.2), [s]); await page.waitForTimeout(250); await page.screenshot({ path: path.join(OUT, 'tutor_' + kp + '_' + got + '_s' + s + '.png') }); }
    await page.evaluate(() => __game.closeTutor());
    console.log('✓', kp, got, n + ' 步');
  }
  console.log(errs.length ? '✗ 控制台问题: ' + errs.slice(0, 10).join(' | ') : '✓ 无控制台错误');
  await b.close();
})();
