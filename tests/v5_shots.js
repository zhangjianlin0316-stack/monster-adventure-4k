// v5 截图：灵兽台词气泡 / 招牌动作 / 奥义台词 / 闪避 / 图鉴口头禅 …（SECT 环境变量选择部分）
const { chromium } = require('playwright-core'); const path = require('path');
const OUT = process.env.OUT || '/workspace/monster-game/screenshots_v5';
const SECT = (process.env.SECT || 'talk,dex').split(',');
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.__game && __game.G.scene === 'title', null, { timeout: 120000 });
  await page.evaluate(() => { AudioSys.unlock(); __game.quickStart('fox', 4); });
  await page.waitForFunction(() => VoicePack.loaded.mons && VoicePack.loaded.tutor, null, { timeout: 60000 });
  let pass = true; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) pass = false; };
  const S = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const W = ms => page.waitForTimeout(ms);
  // 自动推进战斗文字，直到条件成立
  const until = async (cond, arg, max) => { for (let i = 0; i < (max || 120); i++) { if (await page.evaluate(cond, arg)) return true; await page.evaluate(() => { const B = G.battle; if (B && B.cur && B.cur.type === 'msg' && B.cur.t > 0.25) { B.cur.chars = 999; B.cur = null; } }); await W(120); } return false; };
  const waitAnim = (kind, side) => until(([k, s]) => !!(G.battle && G.battle.anim && G.battle.anim.kind === k && (!s || G.battle.anim.side === s)), [kind, side]);
  global.__ctx = { page, ok, S, W, waitAnim, until };
  if (SECT.includes('talk')) {
    await page.evaluate(() => { __game.setParty('fox3', 40); G.noKO = true; __game.wild('qilin', 40); });
    await waitAnim('sig', 'e'); await W(500); await S('v5_enemy_entry_catchphrase');
    ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.side === 'e' && b.kind === 'sum')), '敌方出场口头禅气泡');
    await waitAnim('sig', 'p'); await W(450); await S('v5_player_signature_action');
    ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.side === 'p') && !!G.battle.actName), '我方出场台词 + 招牌动作名');
    await until(() => G.battle.mode === 'menu');
    await page.evaluate(() => { G.battle.lastTalk = null; __game.cast('p', SPECIES.fox3.ult, { correct: true, pass: true, ok: 2, n: 2 }); });
    await until(() => !!(G.battle.anim && G.battle.anim.kind === 'move' && G.battle.anim.t > 0.9));
    await S('v5_ult_catchphrase'); ok(await page.evaluate(() => (G.battle.bubbles || []).some(b => b.kind === 'ult')), '奥义台词字幕');
    await until(() => G.battle.mode !== 'queue', null, 300);
    await page.evaluate(() => { const B = G.battle; B.queue = []; B.cur = null; B.anim = null; B.mode = 'queue'; B.lastTalk = null; Q({ type: 'anim', kind: 'move', side: 'e', move: 'tackle', mtype: 'normal', dur: 0.6, cut: 0, H: 0.5, miss: true }, fn(() => monTalk('p', 'dodge', { force: true })), { type: 'anim', kind: 'dodge', side: 'p', mtype: 'normal', dur: 0.6 }, msg('但是没有命中！')); });
    await waitAnim('dodge', 'p'); await W(200); await S('v5_dodge_line');
    await page.evaluate(() => endBattle('run')); await W(1500);
  }
  if (SECT.includes('dex')) {
    await page.evaluate(() => { DEX_ORDER.forEach(s => { G.flags.seen = G.flags.seen || {}; G.flags.seen[s] = 1; }); __game.dex(DEX_ORDER.indexOf('zhulong')); });
    await W(300); await page.keyboard.press('KeyZ'); await W(600); await S('v5_dex_catchphrase');
    ok(await page.evaluate(() => !!G.say), '图鉴里按 Z 播放台词');
    await page.evaluate(() => { G.dexUI = null; });
  }
  for (const f of (process.env.EXTRA || '').split(',').filter(Boolean)) await require('./' + f)(global.__ctx);
  ok(errs.length === 0, '无控制台错误' + (errs.length ? '：' + errs.slice(0, 6).join(' | ') : ''));
  await b.close(); process.exit(pass ? 0 : 1);
})();
