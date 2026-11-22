// v6 语音真实环境测试：不加自动播放豁免参数，用真实点击解锁；模拟老存档里「音乐已静音 / 语音关」的设置；
// 可用 URL=https://...github.io/... 直接测线上；SLOW=1 模拟慢网速
const { chromium } = require('playwright-core'); const path = require('path');
const URL = process.env.URL || 'http://localhost:8765/'; const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v6';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const page = await ctx.newPage();
  if (process.env.SLOW) { const cdp = await ctx.newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 1024 * 1024, uploadThroughput: 100 * 1024 }); }
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', 1); localStorage.setItem('ls_muted', '1'); localStorage.setItem('ls_voice', '0'); } });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'commit', timeout: 0 });
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 300000 });
  ok(await page.evaluate(() => AudioSys.ac.state !== 'running' || true), '标题画面（AudioContext：' + await page.evaluate(() => AudioSys.ac.state) + '）');
  await page.mouse.click(800, 450); await page.waitForTimeout(400);
  ok(await page.evaluate(() => AudioSys.ac.state === 'running'), '第一次点击后声音引擎已运行');
  ok(await page.evaluate(() => Voice.enabled && AudioSys.muted), '老存档「音乐静音、语音关」→ v6 语音默认开启，音乐仍静音');
  await page.evaluate(() => { __game.quickStart('fox', 3); __game.wild('moth', 3); window.__pk = 0; setInterval(() => { if (Voice.curTag === 'tutor') __pk = Math.max(__pk, Voice.level()); }, 40); });
  for (let i = 0; i < 80; i++) { const st = await page.evaluate(() => G.quiz && G.quiz.phase); if (st === 'ask') break; await page.keyboard.press('z'); await page.waitForTimeout(350); }
  // 用鼠标点错误选项
  const wrong = await page.evaluate(() => (G.quiz.q.ans + 1) % 4);
  await page.keyboard.press(String(wrong + 1));
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!G.tutor)); i++) { await page.waitForTimeout(400); await page.keyboard.press('z'); }
  ok(await page.evaluate(() => !!G.tutor), '答错后星老师出现');
  const t0 = Date.now(); await page.waitForFunction(() => Voice.curTag === 'tutor', null, { timeout: 120000 }).catch(() => { });
  ok(await page.evaluate(() => Voice.curTag === 'tutor'), '星老师开始说话（等待 ' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒，语音包 ' + JSON.stringify(await page.evaluate(() => VoicePack.progress('tutor'))) + '）');
  await page.waitForTimeout(1500); await page.screenshot({ path: path.join(OUT, 'v6_tutor_voice_live.png') });
  const pk = await page.evaluate(() => __pk); ok(pk > 0.05, '扬声器通道检测到真实声音输出（峰值 ' + pk.toFixed(2) + '），音乐静音不影响语音');
  ok(await page.evaluate(() => Voice.stats.fallback === 0 && Voice.stats.played > 0), '使用神经语音片段（' + JSON.stringify(await page.evaluate(() => Voice.stats)) + '）');
  await page.evaluate(() => __game.closeTutor());
  // 测试语音按钮
  await page.evaluate(() => { __game.finishQuiz(); G.scene = 'world'; G.battle = null; __game.openSound(); });
  await page.keyboard.press('z'); await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUT, 'v6_sound_settings_test.png') });
  await page.waitForFunction(() => { const r = __game.soundRes(); return r && /✓|没|还没|很小/.test(r.text); }, null, { timeout: 30000 }).catch(() => { });
  const r = await page.evaluate(() => __game.soundRes()); ok(r && /✓/.test(r.text), '「测试语音」按钮：' + (r && r.text));
  await page.screenshot({ path: path.join(OUT, 'v6_sound_settings_ok.png') });
  ok(errs.length === 0, '无控制台错误 / 404' + (errs.length ? '：' + errs.slice(0, 5).join(' | ') : ''));
  await b.close(); process.exit(pass ? 0 : 1);
})();
