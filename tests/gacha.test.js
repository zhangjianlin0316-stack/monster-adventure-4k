// 祈愿概率与保底测试（蒙特卡洛）
const W = require('../js/gacha_core.js');
let s = 1; const rng = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
for (const bid of ['standard', 'limited']) {
  const S = W.newState(); const B = bid === 'standard' ? W.STANDARD : W.limitedBanner(2); const N = 400000;
  let c5 = 0, c4 = 0, up = 0, maxGap5 = 0, gap5 = 0, maxGap4 = 0, gap4 = 0, upAfterLose = true, lastLose = false;
  for (let i = 0; i < N; i++) { const r = W.roll(S, B, rng); gap5++; gap4++;
    if (r.star === 5) { c5++; maxGap5 = Math.max(maxGap5, gap5); gap5 = 0; if (B.up5) { if (lastLose && !r.up) upAfterLose = false; lastLose = !r.up; if (r.up) up++; } }
    if (r.star >= 4) { maxGap4 = Math.max(maxGap4, gap4); gap4 = 0; } if (r.star === 4) c4++; }
  const p5 = c5 / N * 100, p4 = c4 / N * 100;
  console.log(B.name + '：5★ ' + p5.toFixed(2) + '%，4★ ' + p4.toFixed(2) + '%，最长 5★ 间隔 ' + maxGap5 + '，最长 4★+ 间隔 ' + maxGap4);
  ok(p5 > 2.0 && p5 < 2.6, B.name + ' 5★ 综合概率与公示（约 2.3%）一致'); ok(p4 > 13.5 && p4 < 16.5, B.name + ' 4★ 综合概率与公示（约 15%）一致');
  ok(maxGap5 <= W.RATE.hard, '5★ 硬保底 ' + W.RATE.hard + ' 抽');
  ok(maxGap4 <= 10, '4★ 每 10 抽保底');
  if (B.up5) { ok(upAfterLose, '歪了之后下一个 5★ 必定 UP'); ok(up / c5 > 0.6 && up / c5 < 0.75, 'UP 占 5★ 比例 ' + (up / c5 * 100).toFixed(1) + '%（理论 66.7%）'); }
}
if (fail) process.exit(1); else console.log('祈愿测试通过 ✓');
