// v7 骨骼动画演示视频：逐帧（30fps 游戏时间）录制 → docs/v7_skeletal_demo.mp4
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.env.OUT || '/workspace/monster-game/video_v7'; const URL = process.env.URL || 'http://localhost:8765/';
const MP4 = process.env.MP4 || path.join(__dirname, '..', 'docs', 'v7_skeletal_demo.mp4');
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.dirname(MP4), { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL); await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'cap'; d.style.cssText = 'position:fixed;left:0;right:0;top:8px;text-align:center;font:900 26px sans-serif;color:#fff;text-shadow:0 2px 6px #000,0 0 3px #000;z-index:99;pointer-events:none'; document.body.appendChild(d); });
  const cap = s => page.evaluate(s => { document.getElementById('cap').textContent = s; }, s);
  let n = 0; const snap = () => page.screenshot({ path: path.join(OUT, 'f' + String(n++).padStart(4, '0') + '.png') });
  const rec = async frames => { for (let i = 0; i < frames; i++) { await page.evaluate(() => new Promise(r => { const B0 = G.battle; if (B0 && B0.cur && B0.cur.type === 'msg') B0.cur = null; G.manualStep = 1; const c = G.stepDone || 0; const w = () => (G.stepDone || 0) > c ? requestAnimationFrame(() => r()) : requestAnimationFrame(w); w(); })); await snap(); } };
  await page.evaluate(() => { Voice.setEnabled(false); __game.quickStart('fox', 3); G.noEnc = true; });
  for (let i = 0; i < 80; i++) { const k = await page.evaluate(() => Object.keys(RIGS).filter(s => !skelReady(s)).length); if (!k) break; await page.waitForTimeout(500); }
  const reset = () => page.evaluate(() => { const B = G.battle; B.queue = []; B.cur = null; B.anim = null; B.mode = 'menu'; B.react = { p: null, e: null }; });
  const battle = async (P, E, lvP, lvE) => {
    await page.evaluate(([P, E, a, c]) => { G.manualStep = undefined; G.battle = null; G.scene = 'world'; G.party = [makeMon(P, a)]; __game.wild(E, c); }, [P, E, lvP, lvE]);
    for (let i = 0; i < 40; i++) { const m = await page.evaluate(() => G.battle && G.battle.mode); if (m === 'menu') break; await page.keyboard.press('z'); await page.waitForTimeout(200); }
    await page.evaluate(() => { G.manualStep = 0; });
  };
  const ult = () => page.evaluate(() => SPECIES[active().sp].ult);
  // 1) 九焰天狐 vs 苍墨天龙
  await battle('fox3', 'dragon3', 30, 28);
  await cap('v7 真·骨骼动画 —— 待机：呼吸、甩尾、转头'); await rec(45);
  await cap('普通攻击：蓄力 → 扑击 → 收招'); await page.evaluate(() => __game.cast('p', 'tackle', { correct: true, pass: true, ok: 1, n: 1 })); await rec(55); await reset(); await rec(6);
  await cap('奥义：四肢大幅动作 + 跃起'); await page.evaluate(u => __game.cast('p', u, { correct: true, pass: true, ok: 2, n: 2 }), await ult()); await rec(120); await reset(); await rec(6);
  await cap('招牌动作'); await page.evaluate(() => { Q({ type: 'anim', kind: 'sig', side: 'p', mtype: 'normal', dur: 1.3 }); G.battle.mode = 'queue'; }); await rec(45); await reset();
  await cap('敌方出招 / 我方受击'); await page.evaluate(() => __game.cast('e', 'tackle', { correct: false, pass: true })); await rec(55); await reset(); await rec(6);
  await cap('胜利动作'); await page.evaluate(() => { G.battle.victory = true; }); await rec(50);
  // 2) 其他体型
  for (const [P, E, t] of [['owl3', 'golem3', '鸟类：翅膀扇动'], ['turtle3', 'whale', '重型四足：踏地'], ['jelly3', 'qilin', '漂浮类：触手摆动']]) {
    await battle(P, E, 30, 28); await cap(t + ' —— 攻击'); await page.evaluate(() => __game.cast('p', 'tackle', { correct: true, pass: true, ok: 1, n: 1 })); await rec(50); await reset();
    await cap(t + ' —— 奥义'); await page.evaluate(u => __game.cast('p', u, { correct: true, pass: true, ok: 2, n: 2 }), await ult()); await rec(100); await reset(); await rec(5);
  }
  // 3) 大地图跟随走路
  await page.evaluate(() => { G.battle = null; G.scene = 'world'; G.dialog = null; __game.quickStart('fox', 3); G.noEnc = true; G.party = [makeMon('cat2', 20)]; });
  await cap('大地图：跟随灵兽迈腿走路');
  const walk = async (k, s) => { for (let i = 0; i < s; i++) { await page.evaluate(k => { G.held = [k]; }, k); await rec(6); } await page.evaluate(() => { G.held = []; }); };
  await rec(10); await walk('left', 5); await walk('down', 4); await walk('right', 4); await rec(20);
  // 4) 图鉴展示
  await page.evaluate(() => { G.flags.dex = {}; Object.keys(SPECIES).forEach(k => G.flags.dex[k] = 2); });
  for (const sp of ['zhulong', 'qilin', 'dragon3']) { await page.evaluate(sp => { __game.dex(DEX_ORDER.indexOf(sp)); G.dexUI.detail = true; }, sp); await cap('图鉴展示动作'); await rec(70); }
  await page.evaluate(() => { G.dexUI = null; });
  // 5) 全部 63 只同屏
  await page.evaluate(() => { const cv = document.createElement('canvas'); cv.id = 'gal'; cv.width = 1280; cv.height = 720; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:98'; document.body.appendChild(cv); });
  const SPS = await page.evaluate(() => Object.keys(SPECIES));
  const CL = [['待机', { clip: 'idle' }], ['走路', { clip: 'idle', walk: 1 }], ['攻击', { clip: 'attack' }], ['招牌', { clip: 'special' }], ['奥义', { clip: 'ult' }], ['胜利', { clip: 'victory' }]];
  for (let pg = 0; pg < 2; pg++) {
    const grp = SPS.slice(pg * 32, pg * 32 + 32);
    for (let f = 0; f < 6 * 36; f++) {
      const ci = Math.floor(f / 36), u = (f % 36) / 36; await cap(`全部 63 只都已绑定骨骼（${pg + 1}/2）—— ${CL[ci][0]}`);
      await page.evaluate(([grp, st, u, t]) => { const g = document.getElementById('gal').getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, '#2b4a6b'); gr.addColorStop(1, '#6f9a6a'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
        grp.forEach((sp, i) => { const x = 80 + (i % 8) * 160, y = 60 + Math.floor(i / 8) * 165 + 150; drawCreature(g, sp, x, y, 135 / ((SPECIES[sp].scale) || 1), { t, skel: Object.assign({ u }, st), phase: i }); g.fillStyle = '#fff'; g.font = '700 13px sans-serif'; g.textAlign = 'center'; g.fillText(SPECIES[sp].name, x, y + 12); }); }, [grp, CL[ci][1], u, f / 30]);
      await snap();
    }
  }
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${OUT}/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 24 -movflags +faststart ${MP4}`);
  console.log('frames', n, errs.length ? '✗ ' + errs.slice(0, 4).join('|') : '✓ 无错误');
})();
