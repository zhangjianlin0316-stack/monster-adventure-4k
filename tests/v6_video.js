// 逐帧录制（固定 30fps 游戏时间），生成 MP4/GIF 证明灵兽与地图在动
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.env.OUT || '/workspace/monster-game/video_v6'; const URL = process.env.URL || 'http://localhost:8765/';
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL); await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  let n = 0; const rec = async (frames, every) => { for (let i = 0; i < frames; i++) { await page.evaluate(() => new Promise(r => { G.manualStep = 1; const c = G.stepDone || 0; const w = () => (G.stepDone || 0) > c ? requestAnimationFrame(() => r()) : requestAnimationFrame(w); w(); })); if (every) await every(i); await page.screenshot({ path: path.join(OUT, 'f' + String(n++).padStart(4, '0') + '.png') }); } };
  await page.evaluate(() => { Voice.setEnabled(false); __game.quickStart('fox', 3); G.noEnc = true; G.party = [makeMon('fox2', 20)]; G.manualStep = 0; });
  // 1) 战斗待机（眨眼、呼吸、尾巴火焰晃动）+ 出招
  await page.evaluate(() => { G.manualStep = undefined; __game.wild('moth2', 18); });
  for (let i = 0; i < 40; i++) { const m = await page.evaluate(() => G.battle && G.battle.mode); if (m === 'menu') break; await page.keyboard.press('z'); await page.waitForTimeout(250); }
  await page.evaluate(() => { G.manualStep = 0; });
  await rec(75);
  await page.evaluate(() => { __game.cast('p', 'flameRush'); }); await rec(60);
  // 2) 大地图：跟随灵兽、风吹草动、水面、小动物
  await page.evaluate(() => { G.battle = null; G.scene = 'world'; G.dialog = null; __game.quickStart('fox', 3); G.noEnc = true; G.party = [makeMon('cat2', 20)]; });
  const walk = async (k, steps) => { for (let s = 0; s < steps; s++) { await page.evaluate(k => { G.held = [k]; }, k); await rec(6); } await page.evaluate(() => { G.held = []; }); };
  await rec(10); await walk('left', 3); await walk('down', 3); await rec(40);
  await page.evaluate(() => { let best = null; for (let y = 3; y < H - 3 && !best; y++) for (let x = 3; x < W - 3; x++) { if (MAP[y][x] !== T.WATER || ridAt(x, y) !== 'lake') continue; if (walkable(x, y + 3) && MAP[y + 1][x] === T.WATER) { best = [x, y + 3]; break; } } __game.teleport(best[0], best[1], 'up'); for (let i = 0; i < 6; i++) CRIT.push({ k: i % 2 ? 'fish' : 'dragonfly', x: G.player.x - 3 + i * 1.1, y: G.player.y - 2 - (i % 3) * 0.4, t: 0.25 * i, life: 6, ph: i }); for (let j = 0; j < 4; j++) CRIT.push({ k: 'bird', x: G.player.x - 7 - j * 0.7, y: G.player.y - 4 + j * 0.4, vx: 3.5, t: 0, life: 9, ph: j }); });
  await rec(70);
  await page.evaluate(() => { ALIVE.forcePhase = 0.76; for (let i = 0; i < 12; i++) CRIT.push({ k: 'firefly', x: G.player.x - 5 + i * 0.9, y: G.player.y - 2 + (i % 4), t: 1, life: 8, ph: i }); }); await rec(45);
  // 3) 图鉴：多只灵兽同时眨眼/呼吸
  await page.evaluate(() => { delete ALIVE.forcePhase; G.flags.dex = {}; Object.keys(SPECIES).forEach(k => G.flags.dex[k] = 2); __game.dex(0); }); await rec(60);
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${OUT}/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 ${OUT}/../v6_alive_demo.mp4`);
  execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${OUT}/f%04d.png -vf "fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" ${OUT}/../v6_alive_demo.gif`);
  console.log('frames', n, errs.length ? '✗ ' + errs.join('|') : '✓ 无错误');
})();
