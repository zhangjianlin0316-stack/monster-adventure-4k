// 音乐系统测试：每首曲目都能生成、播放并产生声音；动态强度切换无报错
const { chromium } = require('playwright-core'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.addInitScript(() => {
    const orig = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dst, ...r) { const res = orig.call(this, dst, ...r); if (dst instanceof AudioDestinationNode && !this.context.__an) { const an = this.context.createAnalyser(); an.fftSize = 2048; orig.call(this, an); this.context.__an = an; window.__an = an; } return res; };
  });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => { AudioSys.unlock(); AudioSys.setMuted(false); AudioSys.setVol(0.7); });
  const songs = await page.evaluate(() => Object.keys(AudioSys.SONGS));
  let fail = 0;
  for (const s of songs) {
    const info = await page.evaluate(s => { const b = AudioSys._build(s); const inst = [...new Set(b.ev.map(e => e.i))]; return { n: b.ev.length, bars: b.L / 16, inst, missing: inst.filter(i => !AudioSys.INST[i]) }; }, s);
    await page.evaluate(s => { __game.G.scene = 'loading'; AudioSys.play(s); }, s);
    await page.waitForTimeout(1800);
    const rms = await page.evaluate(async () => { const an = window.__an; if (!an) return -1; let mx = 0; for (let k = 0; k < 10; k++) { const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let r = 0; for (const v of d) r += v * v; mx = Math.max(mx, Math.sqrt(r / d.length)); await new Promise(r => setTimeout(r, 60)); } return mx; });
    await page.evaluate(() => AudioSys.setIntensity(1)); await page.waitForTimeout(400); await page.evaluate(() => AudioSys.setIntensity(0));
    const ok = info.n > 50 && !info.missing.length && rms > 0.005;
    if (!ok) fail++;
    console.log((ok ? '✓ ' : '✗ ') + s.padEnd(12) + ' 事件 ' + info.n + '  小节 ' + info.bars + '  乐器 ' + info.inst.join('/') + '  RMS ' + rms.toFixed(3) + (info.missing.length ? ' 缺少 ' + info.missing : ''));
  }
  for (const fx of ['talk', 'chalk', 'tutor_in', 'slash', 'cutin', 'sigcut', 'ult', 'gauge']) await page.evaluate(fx => AudioSys.sfx(fx), fx);
  await page.waitForTimeout(800);
  console.log(errs.length ? '✗ 控制台错误: ' + errs.slice(0, 5).join(' | ') : '✓ 无控制台错误');
  console.log(fail ? '✗ 失败 ' + fail : '全部曲目通过 ✓');
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
