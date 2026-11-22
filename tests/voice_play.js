// 浏览器内语音播放测试：语音包能加载、解码、按步骤播放并与动画同步，无报错
const { chromium } = require('playwright-core'); const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v5';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => { AudioSys.unlock(); __game.quickStart('fox', 4); });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  for (const kp of ['g1_add20', 'g3_muldiv', 'c_chick', 'g6_percent', 'g5_fracadd']) {
    await page.evaluate(k => { __game.tutorFor(k, 4); G.tutor.auto = true; }, kp);
    const t0 = Date.now();
    await page.waitForFunction(() => Voice.curTag === 'tutor', null, { timeout: 20000 }).catch(() => { });
    ok(await page.evaluate(() => Voice.curTag === 'tutor'), kp + ' 第1步语音开始播放（' + (Date.now() - t0) + 'ms）');
    if (kp === 'c_chick') { await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, 'tutor_voice_speaking.png') }); }
    const info = await page.evaluate(() => ({ vdur: G.tutor.vdur, steps: G.tutor.X.steps.length, s: G.tutor.s }));
    await page.waitForFunction(() => G.tutor && G.tutor.s >= 1, null, { timeout: 40000 }).catch(() => { });
    const s1 = await page.evaluate(() => ({ s: G.tutor.s, t: G.tutor.T }));
    ok(s1.s >= 1, kp + ' 语音说完后自动进入下一步（第1步语音约 ' + (info.vdur || 0).toFixed(1) + ' 秒）');
    await page.evaluate(() => __game.closeTutor());
    ok(await page.evaluate(() => !Voice.busy()), kp + ' 关闭讲解时语音立即停止');
  }
  // 静音开关
  await page.evaluate(() => { Voice.setEnabled(false); __game.tutorFor('g2_mul', 3); G.tutor.auto = true; });
  await page.waitForTimeout(1500); ok(await page.evaluate(() => Voice.curTag === null), '关闭语音后不再播放');
  await page.evaluate(() => { __game.closeTutor(); Voice.setEnabled(true); });
  const st = await page.evaluate(() => Voice.stats); ok(st.fallback === 0, '全部使用预生成神经语音（回退浏览器语音 ' + st.fallback + ' 次）');
  ok(errs.length === 0, '无控制台错误' + (errs.length ? '：' + errs.slice(0, 5).join(' | ') : ''));
  if (process.env.MONS !== '0') {
    const r = await page.evaluate(async () => { await VoicePack.load('mons'); let n = 0, bad = []; for (const sp of ['fox3', 'qilin', 'whale', 'bunny', 'seal3']) for (const k of ['sum', 'ult']) { const b = await VoicePack.get('mons', sp + ':' + k + ':0'); if (b && b.e - b.s > 0.3) n++; else bad.push(sp + k); } return { n, bad }; });
    ok(r.bad.length === 0, '灵兽语音解码正常（' + r.n + ' 条抽检）');
  }
  await b.close(); process.exit(pass ? 0 : 1);
})();
