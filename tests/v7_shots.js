// v7 骨骼动画截图：战斗中各片段 + 图鉴展示 + 跟随走路（逐帧推进，确定性）
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v7'; const URL = process.env.URL || 'http://localhost:8765/';
const P = process.env.P || 'fox3', E = process.env.E || 'dragon3';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL); await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  const step = async n => { for (let i = 0; i < n; i++) await page.evaluate(() => new Promise(r => { const B0 = G.battle; if (B0 && B0.cur && B0.cur.type === 'msg' && !window.KEEPMSG) B0.cur = null; G.manualStep = 1; const c = G.stepDone || 0; const w = () => (G.stepDone || 0) > c ? requestAnimationFrame(() => r()) : requestAnimationFrame(w); w(); })); };
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  await page.evaluate(() => { Voice.setEnabled(false); __game.quickStart('fox', 3); G.noEnc = true; });
  for (let i = 0; i < 60; i++) { const n = await page.evaluate(() => Object.keys(RIGS).filter(s => !skelReady(s)).length); if (!n) break; await page.waitForTimeout(500); }
  await page.evaluate(([P, E]) => { G.party = [makeMon(P, 30)]; __game.wild(E, 28); }, [P, E]);
  for (let i = 0; i < 40; i++) { const m = await page.evaluate(() => G.battle && G.battle.mode); if (m === 'menu') break; await page.keyboard.press('z'); await page.waitForTimeout(250); }
  await page.evaluate(() => { G.manualStep = 0; }); await step(10); await shot('v7_battle_idle');
  const seq = async (name, js, marks) => { await page.evaluate(js); let f = 0; for (const m of marks) { await step(m - f); f = m; await shot(`v7_${name}_${String(m).padStart(2, '0')}`); } await step(70); await page.evaluate(() => { const B = G.battle; B.queue = []; B.cur = null; B.anim = null; B.mode = 'menu'; B.react = { p: null, e: null }; }); await step(12); };
  const P0 = await page.evaluate(() => { const m = active(); const mv = m.moves.map(x => x.id).filter(x => MOVES[x].p > 0 && !MOVES[x].ult); return { atk: mv[mv.length - 1] || 'tackle', ult: SPECIES[m.sp].ult }; });
  const R = (a, b, s) => { const o = []; for (let i = a; i <= b; i += s) o.push(i); return o; };
  await seq('attack', `__game.cast('p', 'tackle', { correct: true, pass: true, ok: 1, n: 1 })`, R(3, 42, 3));
  await seq('ult', `__game.cast('p', '${P0.ult}', { correct: true, pass: true, ok: 2, n: 2 })`, R(4, 120, 4));
  await seq('sig', `Q({ type: 'anim', kind: 'sig', side: 'p', mtype: 'normal', dur: 1.3 }); G.battle.mode = 'queue';`, R(3, 39, 3));
  await seq('dodge', `Q({ type: 'anim', kind: 'dodge', side: 'p', mtype: 'normal', dur: 0.7 }); G.battle.mode = 'queue';`, R(3, 21, 3));
  await seq('ehit', `G.battle.react.e = { t: 0, dir: 1, pow: 1.6 };`, R(2, 20, 2));
  await seq('eatk', `__game.cast('e', 'tackle', { correct: false, pass: true })`, R(3, 45, 3));
  await page.evaluate(() => { G.battle.victory = true; }); await step(20); await shot('v7_victory_a'); await step(12); await shot('v7_victory_b');
  // 图鉴展示模式
  await page.evaluate(() => { G.battle = null; G.scene = 'world'; G.flags.dex = {}; Object.keys(SPECIES).forEach(k => G.flags.dex[k] = 2); __game.dex(DEX_ORDER.indexOf('qilin')); G.dexUI.detail = true; });
  await step(140); await shot('v7_dex_a'); await step(12); await shot('v7_dex_b');
  ok(errs.length === 0, '无控制台错误' + (errs.length ? '：' + errs.slice(0, 4).join(' | ') : ''));
  await b.close(); process.exit(pass ? 0 : 1);
})();
