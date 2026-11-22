// ================== 祈愿（抽卡）核心逻辑：概率、保底、UP、重复转化 ==================
// 货币「灵晶」只能通过游戏获得（答对题目、每日数学挑战、探索宝箱、灵瞳），没有任何付费入口。
(function (root) {
'use strict';
const POOL = {
  common: ['volt', 'bunny', 'bird', 'shroom', 'rock', 'moth', 'otter'],
  rare: ['fox', 'turtle', 'fawn', 'lizard', 'jelly', 'beetle', 'seal', 'owl', 'golem', 'koi', 'tanuki'],
  epic: ['cat', 'dragon', 'crane'],
  legend: ['qilin', 'whale', 'zhulong'],
  items: [['ball', 2], ['potion', 2], ['hintcard', 1], ['superball', 1], ['superpotion', 1]],
};
const COST = 20, COST10 = 200;
const RATE = { five: 0.012, soft: 55, softStep: 0.06, hard: 70, four: 0.09, fourHard: 10, threeMon: 0.6 };
// 限定祈愿按日期轮换：UP 传说 + 3 只 UP 稀有
function limitedBanner(day) {
  const L = POOL.legend[day % 3], r = POOL.rare, k = (day * 3) % r.length;
  return { id: 'limited', name: '神社之约 · 限定祈愿', up5: L, up4: [r[k], r[(k + 1) % r.length], r[(k + 2) % r.length]], five: POOL.epic, four: r };
}
const STANDARD = { id: 'standard', name: '翠风常驻祈愿', up5: null, up4: [], five: POOL.epic, four: POOL.rare };
function newState() { return { pity5: { standard: 0, limited: 0 }, pity4: { standard: 0, limited: 0 }, guar5: false, guar4: false, total: 0, history: [] }; }
function rate5(p) { return p + 1 >= RATE.hard ? 1 : p + 1 > RATE.soft ? Math.min(1, RATE.five + (p + 1 - RATE.soft) * RATE.softStep) : RATE.five; }
function pick(a, rng) { return a[Math.floor(rng() * a.length)]; }
// 抽一次：返回 { star, sp | item, up }
function roll(S, B, rng) {
  const id = B.id; S.total++;
  const p5 = S.pity5[id], p4 = S.pity4[id];
  let r;
  if (rng() < rate5(p5)) {
    S.pity5[id] = 0; S.pity4[id]++;
    if (B.up5) { const win = S.guar5 || rng() < 0.5; S.guar5 = !win; r = { star: 5, sp: win ? B.up5 : pick(B.five, rng), up: win }; }
    else r = { star: 5, sp: pick(B.five, rng) };
  } else if (p4 + 1 >= RATE.fourHard || rng() < RATE.four) {
    S.pity5[id]++; S.pity4[id] = 0;
    if (B.up4.length) { const win = S.guar4 || rng() < 0.5; S.guar4 = !win; r = { star: 4, sp: win ? pick(B.up4, rng) : pick(B.four, rng), up: win && true }; }
    else r = { star: 4, sp: pick(B.four, rng) };
  } else {
    S.pity5[id]++; S.pity4[id]++;
    r = rng() < RATE.threeMon ? { star: 3, sp: pick(POOL.common, rng) } : { star: 3, item: pick(POOL.items, rng) };
  }
  S.history.unshift({ b: id, star: r.star, sp: r.sp || null, item: r.item ? r.item[0] : null }); if (S.history.length > 60) S.history.pop();
  return r;
}
// 公示概率（含保底的综合概率，由模拟得出后写死并由测试校验）
const SHOWN = { five: '基础 1.2%，综合约 2.3%（第 56 抽起概率逐步提升，最多 70 抽必出）', four: '基础 9%，综合约 15%（每 10 抽至少 1 个 4★ 或以上）', three: '其余为 3★（普通灵兽或道具）', up: '限定祈愿：5★ 有 50% 为 UP 传说，若未出 UP，下一个 5★ 必定是 UP' };
const API = { POOL, COST, COST10, RATE, SHOWN, STANDARD, limitedBanner, newState, roll, rate5 };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.WishCore = API;
})(typeof window !== 'undefined' ? window : globalThis);
