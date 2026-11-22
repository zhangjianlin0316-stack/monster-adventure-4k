// v6 截图 + 连续帧（证明在动：眨眼、呼吸、尾巴/翅膀、出招姿态、地图生机）
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v6'; const SECT = (process.env.SECT || 'battle,dex,world').split(',');
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(process.env.URL || 'http://localhost:8765/');
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const frames = async (name, n, gap, clip) => { const fs2 = []; for (let i = 0; i < n; i++) { const f = path.join(OUT, 'frames', name + '_' + String(i).padStart(2, '0') + '.png'); await page.screenshot({ path: f, clip }); fs2.push(f); await page.waitForTimeout(gap); } return fs2; };
  const diff = async (a, c) => page.evaluate(async ([a, c]) => 0, [a, c]);
  await page.evaluate(() => { AudioSys.unlock(); __game.quickStart('fox', 3); Voice.setEnabled(false); });
  if (SECT.includes('battle')) {
    await page.evaluate(() => { __game.wild('bunny', 6); });
    for (let i = 0; i < 40; i++) { const m = await page.evaluate(() => G.battle && G.battle.mode); if (m === 'menu') break; await page.keyboard.press('z'); await page.waitForTimeout(300); }
    await page.waitForTimeout(500);
    await frames('battle_idle', 16, 90);
    await shot('v6_battle_idle');
    // 出招：蓄力→出招→收招
    await page.evaluate(() => { __game.cast('p', 'tackle'); });
    await frames('battle_attack', 14, 70);
    await page.waitForTimeout(2500);
    ok(errs.length === 0, '战斗无报错');
  }
  if (SECT.includes('dex')) {
    await page.evaluate(() => { G.battle = null; G.scene = 'world'; G.flags.dex = {}; Object.keys(SPECIES).forEach(k => G.flags.dex[k] = 2); __game.dex(20); G.dexUI.detail = true; });
    await page.waitForTimeout(600); await shot('v6_dex'); await frames('dex', 10, 120);
    await page.evaluate(() => { G.dexUI = null; });
  }
  if (SECT.includes('world')) {
    await page.evaluate(() => { G.scene = 'world'; G.battle = null; G.dialog = null; G.noEnc = true; G.party = [makeMon('cat2', 20)]; });
    for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowDown', 'ArrowDown', 'ArrowLeft']) { await page.keyboard.down(k); await page.waitForTimeout(260); await page.keyboard.up(k); await page.waitForTimeout(120); }
    await page.waitForTimeout(600); await shot('v6_world_follower');
    // 找一处湖边（水 + 可走的岸）
    const spot = await page.evaluate(() => { const { teleport } = __game; let best = null; for (let y = 3; y < H - 3 && !best; y++) for (let x = 3; x < W - 3; x++) { if (MAP[y][x] !== T.WATER) continue; let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (MAP[y + dy][x + dx] === T.WATER) n++; if (n >= 14 && walkable(x, y + 3) && ridAt(x, y) === 'lake') { best = [x, y + 3]; break; } } if (!best) for (let y = 3; y < H - 3 && !best; y++) for (let x = 3; x < W - 3; x++) if (MAP[y][x] === T.WATER && walkable(x, y + 2)) { best = [x, y + 2]; break; } teleport(best[0], best[1], 'up'); return best; });
    await page.evaluate(() => { for (let i = 0; i < 6; i++) CRIT.push({ k: i % 2 ? 'fish' : 'dragonfly', x: G.player.x - 2 + i, y: G.player.y - 2 - (i % 3) * 0.4, t: 0.2 * i, life: 6, ph: i }); for (let j = 0; j < 4; j++) CRIT.push({ k: 'bird', x: G.player.x - 6 - j * 0.7, y: G.player.y - 4 + j * 0.4, vx: 3.5, t: 0, life: 9, ph: j }); });
    await page.waitForTimeout(700); await shot('v6_world_lake'); await frames('world_lake', 12, 110);
    await page.evaluate(() => { ALIVE.forcePhase = 0.6; }); await page.waitForTimeout(400); await shot('v6_world_dusk');
    await page.evaluate(() => { ALIVE.forcePhase = 0.75; for (let i = 0; i < 10; i++) CRIT.push({ k: 'firefly', x: G.player.x - 4 + i * 0.9, y: G.player.y - 2 + (i % 4), t: 1, life: 8, ph: i }); }); await page.waitForTimeout(600); await shot('v6_world_night');
    await page.evaluate(() => { delete ALIVE.forcePhase; });
    const fol = await page.evaluate(() => FOLLOW.x !== null); ok(fol, '跟随灵兽已出现');
  }
  ok(errs.length === 0, '无控制台错误' + (errs.length ? '：' + errs.slice(0, 4).join(' | ') : ''));
  await b.close(); process.exit(pass ? 0 : 1);
})();
