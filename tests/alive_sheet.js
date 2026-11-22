// 生成 63 只灵兽的“闭眼帧 / 睁眼帧 / 变形帧”对照图，检查眨眼眼皮位置与网格变形
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v6';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(process.env.URL || 'http://localhost:8765/');
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  for (const mode of (process.env.MODES || 'closed,open').split(',')) {
    const url = await page.evaluate((mode) => {
      const ids = Object.keys(SPECIES); const C = 300, cols = 9, cv = document.createElement('canvas'); cv.width = C * cols; cv.height = C * Math.ceil(ids.length / cols);
      const g = cv.getContext('2d'); g.fillStyle = '#dfe6ef'; g.fillRect(0, 0, cv.width, cv.height);
      ids.forEach((sp, i) => { const x = (i % cols) * C + C / 2, y = Math.floor(i / cols) * C + C - 20; drawCreature(g, sp, x, y, C - 40, { alive: true, t: mode === 'warp' ? 2.0 : 1.0, fidget: false, eyesClosed: mode === 'closed' ? 1 : 0, noBlink: mode !== 'closed' }); g.fillStyle = '#000'; g.font = '16px sans-serif'; g.fillText(sp, x - C / 2 + 6, y - C + 40); });
      return cv.toDataURL('image/png');
    }, mode);
    fs.writeFileSync(path.join(OUT, 'alive_sheet_' + mode + '.png'), Buffer.from(url.split(',')[1], 'base64')); console.log('✓', mode);
  }
  console.log(errs.length ? '✗ ' + errs.join('|') : '✓ 无错误'); await b.close();
})();
