const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errors = []; page.on('pageerror', e => errors.push(String(e.stack || e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + __dirname + '/../index.html');
  await page.waitForFunction(() => window.__game && __game.scene() === 'title', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/s_title.png' });
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyZ'); await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/s_grade.png' });
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(300); await page.keyboard.press('KeyZ'); await page.waitForTimeout(200); await page.keyboard.press('KeyZ');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/s_world.png' });
  console.log('scene', await page.evaluate(() => __game.scene()));
  console.log('errors', errors.slice(0, 10));
  await browser.close();
})();
