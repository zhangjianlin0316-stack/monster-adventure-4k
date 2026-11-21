// ================== 数学题库引擎（人教版 1-6 年级 + 竞赛题） ==================
// 浏览器中挂到 window.MathQ；Node 中 module.exports，便于自动化验算。
(function (root) {
'use strict';
let RNG = Math.random;
const R = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const pick = arr => arr[Math.floor(RNG() * arr.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
function F(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; }
const fadd = (a, b) => F(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const fsub = (a, b) => F(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const fmul = (a, b) => F(a[0] * b[0], a[1] * b[1]);
const fdiv = (a, b) => F(a[0] * b[1], a[1] * b[0]);
// 分数显示：{n/d} 在游戏里会渲染成上下排列的分数
const fs = f => f[1] === 1 ? String(f[0]) : '{' + f[0] + '/' + f[1] + '}';
const fraw = (n, d) => '{' + n + '/' + d + '}';
// 定点小数：n / 10^p
function ds(n, p) {
  const neg = n < 0; n = Math.abs(Math.round(n));
  let s = String(n); if (p > 0) { while (s.length <= p) s = '0' + s; s = s.slice(0, s.length - p) + '.' + s.slice(s.length - p); s = s.replace(/\.?0+$/, ''); }
  return (neg && s !== '0' ? '-' : '') + s;
}
const C2 = n => n * (n - 1) / 2;
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const fmtTime = (h, m) => h + '时' + (m ? (m < 10 ? '0' + m : m) + '分' : '整');
const fmtClock = (h, m) => h + ':' + (m < 10 ? '0' + m : m);
const yuan = jiao => { const y = Math.floor(jiao / 10), j = jiao % 10; return ((y ? y + '元' : '') + (j ? j + '角' : '')) || '0元'; };
function numCN(n) { const d = '零一二三四五六七八九'; if (n < 10) return d[n]; const t = Math.floor(n / 10), o = n % 10; return (t > 1 ? d[t] : '') + '十' + (o ? d[o] : ''); }
function factorPairs(n) { const p = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) p.push(i + '×' + n / i); return p.join('、'); }
// 把字符串解析为数值（用于判断两个选项是否"值相等"）
function valOf(s) {
  if (typeof s !== 'string') return null;
  let m = /^\{(-?\d+)\/(\d+)\}$/.exec(s); if (m) return m[1] / m[2];
  m = /^(-?\d+(?:\.\d+)?)(%)?$/.exec(s); if (m) return m[2] ? m[1] / 100 : +m[1];
  return null;
}
function sameVal(a, b) { if (a === b) return true; const x = valOf(a), y = valOf(b); return x !== null && y !== null && Math.abs(x - y) < 1e-9; }
const KP = {
  g1_add20: { g: 1, n: '20以内加减法' }, g1_add100: { g: 1, n: '100以内加减法' }, g1_shape: { g: 1, n: '认识图形' }, g1_clock: { g: 1, n: '认识钟表' },
  g2_mul: { g: 2, n: '乘法口诀' }, g2_div: { g: 2, n: '表内除法' }, g2_len: { g: 2, n: '长度单位' }, g2_money: { g: 2, n: '认识人民币' },
  g3_muldiv: { g: 3, n: '多位数乘除法' }, g3_perim: { g: 3, n: '长方形和正方形周长' }, g3_frac: { g: 3, n: '分数的初步认识' }, g3_time: { g: 3, n: '时、分、秒' },
  g4_big: { g: 4, n: '大数的认识' }, g4_law: { g: 4, n: '运算定律与简便计算' }, g4_dec: { g: 4, n: '小数的意义和加减法' }, g4_angle: { g: 4, n: '角的度量' }, g4_avg: { g: 4, n: '平均数' },
  g5_decmul: { g: 5, n: '小数乘除法' }, g5_eq: { g: 5, n: '简易方程' }, g5_factor: { g: 5, n: '因数与倍数' }, g5_fracadd: { g: 5, n: '分数加减法' }, g5_area: { g: 5, n: '多边形的面积' }, g5_cuboid: { g: 5, n: '长方体和正方体' },
  g6_fracmul: { g: 6, n: '分数乘除法' }, g6_ratio: { g: 6, n: '比和比例' }, g6_percent: { g: 6, n: '百分数' }, g6_circle: { g: 6, n: '圆' }, g6_cyl: { g: 6, n: '圆柱与圆锥' },
  c_pattern: { g: 0, n: '找规律', c: 1 }, c_queue: { g: 0, n: '排队问题', c: 1 }, c_quick: { g: 0, n: '巧算速算', c: 1 }, c_count: { g: 0, n: '数图形', c: 1 },
  c_tree: { g: 0, n: '植树问题', c: 1 }, c_age: { g: 0, n: '年龄问题', c: 1 }, c_chick: { g: 0, n: '鸡兔同笼', c: 1 }, c_sumdiff: { g: 0, n: '和差问题', c: 1 },
  c_summul: { g: 0, n: '和倍问题', c: 1 }, c_surplus: { g: 0, n: '盈亏问题', c: 1 }, c_trip: { g: 0, n: '行程问题', c: 1 }, c_work: { g: 0, n: '工程问题', c: 1 },
  c_pigeon: { g: 0, n: '抽屉原理', c: 1 }, c_comb: { g: 0, n: '排列组合', c: 1 }, c_logic: { g: 0, n: '逻辑推理', c: 1 }, c_num: { g: 0, n: '数论与数字谜', c: 1 }
};
const GRADE_KPS = {
  1: ['g1_add20', 'g1_add100', 'g1_shape', 'g1_clock'],
  2: ['g2_mul', 'g2_div', 'g2_len', 'g2_money'],
  3: ['g3_muldiv', 'g3_perim', 'g3_frac', 'g3_time'],
  4: ['g4_big', 'g4_law', 'g4_dec', 'g4_angle', 'g4_avg'],
  5: ['g5_decmul', 'g5_eq', 'g5_factor', 'g5_fracadd', 'g5_area', 'g5_cuboid'],
  6: ['g6_fracmul', 'g6_ratio', 'g6_percent', 'g6_circle', 'g6_cyl']
};
const COMP_KPS = {
  1: ['c_pattern', 'c_queue', 'c_quick', 'c_count'],
  2: ['c_pattern', 'c_queue', 'c_quick', 'c_tree', 'c_age', 'c_count'],
  3: ['c_chick', 'c_sumdiff', 'c_summul', 'c_tree', 'c_comb', 'c_pattern', 'c_age', 'c_count'],
  4: ['c_chick', 'c_surplus', 'c_trip', 'c_sumdiff', 'c_summul', 'c_comb', 'c_quick', 'c_count'],
  5: ['c_pigeon', 'c_trip', 'c_surplus', 'c_chick', 'c_comb', 'c_age', 'c_pattern'],
  6: ['c_work', 'c_pigeon', 'c_trip', 'c_comb', 'c_chick', 'c_surplus']
};
const GEN = {};
// ---------------- 知识点生成器：返回 { q, a, d:[常见错误干扰项], e:解析, fig? } ----------------
GEN.g1_add20 = function (df) {
  const t = R(0, 2);
  if (t === 0) { const a = R(df ? 6 : 2, 9), b = R(10 - a + 1, 9); const s = a + b; return { q: a + ' + ' + b + ' = ?', a: String(s), d: [s - 1, s + 1, s - 10, s + 10, s + 2].map(String), e: '凑十法：把 ' + b + ' 分成 ' + (10 - a) + ' 和 ' + (b - (10 - a)) + '，' + a + ' + ' + (10 - a) + ' = 10，10 + ' + (b - (10 - a)) + ' = ' + s + '。' }; }
  if (t === 1) { const a = R(11, 19), b = R(a - 9, 9); const s = a - b; return { q: a + ' − ' + b + ' = ?', a: String(s), d: [s + 1, s - 1, s + 10, a + b, s + 2].map(String), e: '破十法：先算 10 − ' + b + ' = ' + (10 - b) + '，再加 ' + (a - 10) + '，得 ' + s + '。' }; }
  const n = pick(['小明', '小红', '乐乐', '豆豆']), it = pick([['颗', '糖'], ['个', '苹果'], ['张', '卡片'], ['朵', '花']]), a = R(5, 12), b = R(3, 8);
  if (RNG() < 0.5) return { q: n + '有 ' + a + ' ' + it[0] + it[1] + '，又得到 ' + b + ' ' + it[0] + '，现在一共有多少' + it[0] + '？', a: String(a + b), d: [a + b - 1, a + b + 1, a - b, a + b + 10].map(String), e: '求一共有多少用加法：' + a + ' + ' + b + ' = ' + (a + b) + '。' };
  const s = a + b; return { q: n + '有 ' + s + ' ' + it[0] + it[1] + '，送给别人 ' + b + ' ' + it[0] + '，还剩多少' + it[0] + '？', a: String(a), d: [a + 1, a - 1, s + b, a + 2].map(String), e: '求还剩多少用减法：' + s + ' − ' + b + ' = ' + a + '。' };
};
GEN.g1_add100 = function (df) {
  if (R(0, 1) === 0) { const a = R(12, 68), b = R(df ? 15 : 3, 99 - a); const s = a + b; const carry = (a % 10 + b % 10) >= 10; return { q: a + ' + ' + b + ' = ?', a: String(s), d: [carry ? s - 10 : s + 10, s + 1, s - 1, s + 11].map(String), e: '个位 ' + (a % 10) + ' + ' + (b % 10) + (carry ? ' 满十，向十位进 1' : '') + '，再算十位，结果是 ' + s + '。' }; }
  const a = R(30, 99), b = R(df ? 12 : 3, a - 5); const s = a - b; const bor = (a % 10) < (b % 10);
  return { q: a + ' − ' + b + ' = ?', a: String(s), d: [bor ? s + 10 : s - 10, s + 1, s - 1, s + 11].map(String), e: '个位' + (bor ? '不够减，向十位借 1 当 10，' : '直接相减，') + '再算十位，结果是 ' + s + '。' };
};
GEN.g1_shape = function (df) {
  const t = R(0, 4);
  if (t === 0) { const n = R(3, 4); const ans = C2(n); return { q: '数一数：下图中一共有几个三角形？', fig: { type: 'fan', n }, a: String(ans), d: [n - 1, ans + 1, ans + 2, ans - 1].map(String), e: '底边被分成 ' + (n - 1) + ' 段，三角形个数 = ' + Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ') + ' = ' + ans + '。' }; }
  if (t === 1) { const k = df ? 3 : 2; const ans = k === 2 ? 5 : 14; return { q: '数一数：下图中一共有几个正方形？', fig: { type: 'grid', r: k, c: k }, a: String(ans), d: k === 2 ? ['4', '6', '3'] : ['9', '13', '10'], e: k === 2 ? '小正方形 4 个，大正方形 1 个，共 5 个。' : '1×1 的 9 个，2×2 的 4 个，3×3 的 1 个，共 14 个。' }; }
  const f = pick([
    ['长方形有几条边？', '4', ['3', '5', '6'], '长方形有 4 条边，对边相等。'], ['三角形有几个角？', '3', ['4', '2', '5'], '三角形有 3 条边、3 个角。'],
    ['正方体有几个面？', '6', ['4', '8', '12'], '正方体有 6 个面，每个面都是正方形。'], ['正方形有几个直角？', '4', ['2', '3', '1'], '正方形的 4 个角都是直角。'],
    ['长方体有几个面？', '6', ['4', '8', '5'], '长方体有 6 个面，相对的面完全相同。'], ['用 2 个完全一样的三角形，一定能拼成哪种图形？', '平行四边形', ['圆', '五边形', '梯形'], '两个完全一样的三角形总能拼成一个平行四边形（特殊时是长方形或正方形）。'],
    ['圆柱的上下两个面是什么形状？', '圆', ['正方形', '三角形', '长方形'], '圆柱的上下两个底面是大小相同的圆。'], ['五边形有几条边？', '5', ['4', '6', '3'], '五边形有 5 条边、5 个角。']
  ]);
  return { q: f[0], a: f[1], d: f[2], e: f[3] };
};
GEN.g1_clock = function (df) {
  const h = R(1, 12), m = df ? pick([0, 30, 0, 30, 15, 45]) : pick([0, 30]);
  const swapH = (m === 0 ? 12 : m / 5), swapM = (h % 12) * 5;
  const d = [fmtTime(swapH, swapM), fmtTime(h % 12 + 1, m), fmtTime(h === 1 ? 12 : h - 1, m), fmtTime(h, m === 0 ? 30 : 0)];
  return { q: '钟面上显示的是几时几分？', fig: { type: 'clock', h, m }, a: fmtTime(h, m), d, e: '短针（时针）指向' + (m >= 30 ? ' ' + h + ' 和 ' + (h % 12 + 1) + ' 之间' : (m ? '刚过 ' + h : ' ' + h)) + '，长针（分针）指向 ' + (m === 0 ? 12 : m / 5) + '，所以是 ' + fmtTime(h, m) + '。' };
};
GEN.g2_mul = function (df) {
  const a = R(2, 9), b = R(df ? 4 : 2, 9), p = a * b, t = R(0, 2);
  const cn = '一二三四五六七八九';
  if (t === 0) return { q: a + ' × ' + b + ' = ?', a: String(p), d: [a * (b + 1), a * (b - 1), a + b, p + 1, p - 1].map(String), e: '口诀"' + cn[Math.min(a, b) - 1] + cn[Math.max(a, b) - 1] + (p < 10 ? '得' : '') + numCN(p) + '"：' + a + ' × ' + b + ' = ' + p + '。' };
  if (t === 1) return { q: '(　) × ' + b + ' = ' + p, a: String(a), d: [a + 1, a - 1, p - b, b + 1].map(String), e: '想乘法口诀：几乘 ' + b + ' 得 ' + p + '？' + a + ' × ' + b + ' = ' + p + '，所以填 ' + a + '。' };
  const ctx = pick([['每盒有', '个', '盒'], ['每排坐', '人', '排'], ['每袋装', '个', '袋']]);
  return { q: ctx[0] + ' ' + a + ' ' + ctx[1] + '，' + b + ' ' + ctx[2] + '一共有多少' + ctx[1] + '？', a: String(p), d: [a + b, p + a, p - a, p + 1].map(String), e: '求 ' + b + ' 个 ' + a + ' 是多少，用乘法：' + a + ' × ' + b + ' = ' + p + '。' };
};
GEN.g2_div = function (df) {
  const b = R(2, 9), q = R(df ? 4 : 2, 9), a = b * q;
  if (R(0, 1) === 0) return { q: a + ' ÷ ' + b + ' = ?', a: String(q), d: [q + 1, q - 1, a - b, q + 2].map(String), e: '想口诀：(' + q + ') × ' + b + ' = ' + a + '，所以 ' + a + ' ÷ ' + b + ' = ' + q + '。' };
  return { q: '把 ' + a + ' 个桃平均分给 ' + b + ' 只小猴，每只分到几个？', a: String(q), d: [q + 1, q - 1, a - b, q + 2].map(String), e: '平均分用除法：' + a + ' ÷ ' + b + ' = ' + q + '（个）。' };
};
GEN.g2_len = function (df) {
  const t = R(0, 3);
  if (t === 0) { const m = R(2, 9); return { q: m + ' 米 = (　) 厘米', a: String(m * 100), d: [m * 10, m * 1000, m + 100, m * 100 + 10].map(String), e: '1 米 = 100 厘米，' + m + ' 米 = ' + m * 100 + ' 厘米。' }; }
  if (t === 1) { const c = R(1, 9) * 10; return { q: '1 米 − ' + c + ' 厘米 = (　) 厘米', a: String(100 - c), d: [c, 110 - c, 90 - c, 100 + c].filter(x => x > 0).map(String), e: '先把 1 米化成 100 厘米，100 − ' + c + ' = ' + (100 - c) + '（厘米）。' }; }
  if (t === 2) { const it = pick([['一支铅笔长约 18', '厘米'], ['教室的门高约 2', '米'], ['一块橡皮长约 4', '厘米'], ['一棵大树高约 12', '米'], ['小明身高约 130', '厘米'], ['数学课本长约 26', '厘米'], ['篮球架高约 3', '米']]); return { q: it[0] + '（　）', a: it[1], d: [it[1] === '米' ? '厘米' : '米', '千克', '分钟'], e: '要联系生活实际：' + it[0] + ' ' + it[1] + ' 最合适。' }; }
  const a = R(1, 3), b = R(1, 9) * 10, c = R(1, 3); const tot = a * 100 + b + c * 100;
  return { q: a + ' 米 ' + b + ' 厘米 + ' + c + ' 米 = (　) 厘米', a: String(tot), d: [a + b + c, tot - 100, tot + 100, tot + 10].map(String), e: '统一成厘米：' + (a * 100 + b) + ' + ' + c * 100 + ' = ' + tot + '（厘米）。' };
};
GEN.g2_money = function (df) {
  const t = R(0, 3);
  if (t === 0) { const y = R(2, 9), j = R(1, 9); return { q: y + ' 元 ' + j + ' 角 = (　) 角', a: String(y * 10 + j), d: [y + j, y * 100 + j, y * 10 + j + 10, j * 10 + y].map(String), e: '1 元 = 10 角，' + y + ' 元 = ' + y * 10 + ' 角，再加 ' + j + ' 角，共 ' + (y * 10 + j) + ' 角。' }; }
  if (t === 1) { const p = R(11, 49), pay = 50; const ch = pay - p; return { q: '买一本故事书 ' + yuan(p) + '，付了 ' + yuan(pay) + '，应找回多少钱？', a: yuan(ch), d: [yuan(ch + 10), yuan(ch + 1), yuan(ch + 2), yuan(p)], e: '统一成角：' + pay + ' 角 − ' + p + ' 角 = ' + ch + ' 角 = ' + yuan(ch) + '。' }; }
  if (t === 2) { const a = R(3, 25), b = R(3, 25); return { q: '一支笔 ' + yuan(a) + '，一个本子 ' + yuan(b) + '，一共要多少钱？', a: yuan(a + b), d: [yuan(a + b + 10), yuan(a + b + 1), yuan(a + b - 1), yuan(a + b + 2)], e: '统一成角相加：' + a + ' + ' + b + ' = ' + (a + b) + ' 角 = ' + yuan(a + b) + '。' }; }
  const j = R(2, 9) * 10; return { q: j + ' 角 = (　) 元', a: String(j / 10), d: [j, j / 10 + 1, j * 10, j / 10 + 2].map(String), e: '10 角 = 1 元，' + j + ' 角 = ' + j / 10 + ' 元。' };
};
GEN.g3_muldiv = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = R(102, 489), b = R(2, 9); const p = a * b; return { q: a + ' × ' + b + ' = ?', a: String(p), d: [p + b, p - 10, p + 100, p + 10].map(String), e: '从个位乘起，满几十就向前一位进几：' + a + ' × ' + b + ' = ' + p + '。' }; }
  if (t === 1) { const a = R(12, 39), b = R(11, 29); const p = a * b; return { q: a + ' × ' + b + ' = ?', a: String(p), d: [a * (b % 10) + a * Math.floor(b / 10), p + 10, p - a, p + 100].map(String), e: '用 ' + b + ' 的个位和十位分别去乘：' + a + ' × ' + (b % 10) + ' = ' + a * (b % 10) + '，' + a + ' × ' + Math.floor(b / 10) * 10 + ' = ' + a * Math.floor(b / 10) * 10 + '，合起来 ' + p + '。' }; }
  if (t === 2) { const b = R(2, 9), q = R(df ? 101 : 21, df ? 209 : 99); const a = b * q; return { q: a + ' ÷ ' + b + ' = ?', a: String(q), d: [q + 10, q - 1, q * 10, q + 1].map(String), e: '从被除数的高位除起：' + a + ' ÷ ' + b + ' = ' + q + '，验算：' + q + ' × ' + b + ' = ' + a + '。' }; }
  const b = R(3, 9), q = R(11, 99), r = R(1, b - 1); const a = b * q + r;
  return { q: a + ' ÷ ' + b + ' = ?', a: q + '……' + r, d: [(q + 1) + '……' + r, (q - 1) + '……' + (r + b), q + '……' + (r === 1 ? 2 : r - 1), (q + 10) + '……' + r], e: b + ' × ' + q + ' = ' + b * q + '，' + a + ' − ' + b * q + ' = ' + r + '，余数 ' + r + ' 要比除数 ' + b + ' 小。' };
};
GEN.g3_perim = function (df) {
  const t = R(0, 2);
  if (t === 0) { const w = R(4, 15), h = R(2, w - 1); const P = 2 * (w + h); return { q: '长方形的长是 ' + w + ' 厘米，宽是 ' + h + ' 厘米，周长是多少厘米？', fig: { type: 'rect', w, h, u: '厘米' }, a: String(P), d: [w + h, w * h, P + 2, 2 * w + h].map(String), e: '长方形周长 = (长 + 宽) × 2 = (' + w + ' + ' + h + ') × 2 = ' + P + '（厘米）。' }; }
  if (t === 1) { const s = R(3, 25); return { q: '一个正方形的边长是 ' + s + ' 米，它的周长是多少米？', fig: { type: 'rect', w: s, h: s, u: '米' }, a: String(4 * s), d: [s * s, 2 * s, 4 * s + 4, s + 4].map(String), e: '正方形周长 = 边长 × 4 = ' + s + ' × 4 = ' + 4 * s + '（米）。' }; }
  const w = R(6, 20), h = R(2, w - 1), P = 2 * (w + h);
  return { q: '一个长方形的周长是 ' + P + ' 厘米，长是 ' + w + ' 厘米，宽是多少厘米？', a: String(h), d: [P - w, P / 2, P - 2 * w, h + 2].map(String), e: '长 + 宽 = 周长 ÷ 2 = ' + P / 2 + '，宽 = ' + P / 2 + ' − ' + w + ' = ' + h + '（厘米）。' };
};
GEN.g3_frac = function (df) {
  const t = R(0, 3);
  if (t === 0) { const n = R(3, 9), k = R(1, n - 1); return { q: '图中涂色部分占整个圆的几分之几？', fig: { type: 'pie', n, k }, a: fraw(k, n), d: [fraw(n - k, n), fraw(k, n + 1), fraw(n, k), fraw(k + 1, n)].filter(s => s !== fraw(k, n)), e: '把圆平均分成 ' + n + ' 份，涂色的有 ' + k + ' 份，就是 ' + fraw(k, n) + '。' }; }
  if (t === 1) { const d = R(5, 12), a = R(1, d - 2), b = R(1, d - 1 - a); return { q: fraw(a, d) + ' + ' + fraw(b, d) + ' = ?', a: fraw(a + b, d), d: [fraw(a + b, d + d), fraw(a + b + 1, d), fraw(a + b - 1 || 1, d), fraw(a + b, d + 1)], e: '同分母分数相加，分母不变，分子相加：' + a + ' + ' + b + ' = ' + (a + b) + '，结果是 ' + fraw(a + b, d) + '。' }; }
  if (t === 2) { const d = R(4, 12), a = R(1, d - 1); return { q: '1 − ' + fraw(a, d) + ' = ?', a: fraw(d - a, d), d: [fraw(a, d), fraw(d - a, d + 1), fraw(d - a + 1, d), fraw(d - a, d - 1)], e: '把 1 看成 ' + fraw(d, d) + '，' + fraw(d, d) + ' − ' + fraw(a, d) + ' = ' + fraw(d - a, d) + '。' }; }
  const d = R(5, 12), a = R(1, d - 2), b = R(a + 1, d - 1);
  return { q: '比一比：' + fraw(a, d) + ' 〇 ' + fraw(b, d) + '，圆圈里应填什么？', a: '<', d: ['>', '=', '无法比较'], e: '分母相同的分数，分子大的分数大。' + a + ' < ' + b + '，所以 ' + fraw(a, d) + ' < ' + fraw(b, d) + '。' };
};
GEN.g3_time = function (df) {
  const t = R(0, 3);
  if (t === 0) { const h = R(2, 5); return { q: h + ' 时 = (　) 分', a: String(h * 60), d: [h * 100, h * 10, h * 60 + 60, h * 24].map(String), e: '1 时 = 60 分，' + h + ' 时 = ' + h * 60 + ' 分。' }; }
  if (t === 1) { const m = R(2, 6), s = R(0, 5) * 10; return { q: m + ' 分' + (s ? ' ' + s + ' 秒' : '') + ' = (　) 秒', a: String(m * 60 + s), d: [m * 100 + s, m + s + 60, m * 60 + s + 60, m * 10 + s].map(String), e: '1 分 = 60 秒，' + m + ' 分 = ' + m * 60 + ' 秒' + (s ? '，再加 ' + s + ' 秒，共 ' + (m * 60 + s) + ' 秒' : '') + '。' }; }
  if (t === 2) { const h = R(7, 15), m1 = R(1, 11) * 5, dur = R(5, 17) * 5; const tot = h * 60 + m1 + dur; const h2 = Math.floor(tot / 60), m2 = tot % 60; return { q: '从 ' + fmtClock(h, m1) + ' 到 ' + fmtClock(h2, m2) + ' 经过了多少分钟？', a: String(dur), d: [dur + 60, dur + 10, dur - 5, dur + 5].map(String), e: '用结束时刻减开始时刻：' + fmtClock(h2, m2) + ' − ' + fmtClock(h, m1) + ' = ' + dur + ' 分钟。' }; }
  const h = R(7, 14), m1 = R(0, 5) * 10, dur = pick([35, 40, 45]); const tot = h * 60 + m1 + dur; const H = Math.floor(tot / 60), M = tot % 60;
  return { q: '一节课 ' + dur + ' 分钟，' + fmtClock(h, m1) + ' 上课，几时几分下课？', a: fmtClock(H, M), d: [fmtClock(H, (M + 10) % 60), fmtClock(H + 1, M), fmtClock(H, (M + 50) % 60), fmtClock(H + 1, (M + 10) % 60)], e: fmtClock(h, m1) + ' 再过 ' + dur + ' 分钟是 ' + fmtClock(H, M) + '（分钟满 60 就进 1 时）。' };
};
GEN.g4_big = function (df) {
  const t = R(0, 3);
  if (t === 0) { const w = R(101, 9999); const n = w * 10000; return { q: n + ' 改写成用"万"作单位的数是多少？', a: w + '万', d: [n / 1000 + '万', w * 10 + '万', (w + 1) + '万', Math.floor(w / 10) + '万'].filter(s => s !== w + '万'), e: '从个位起数出 4 位，在万位右下角点上小数点并去掉末尾的 0：' + w + '万。' }; }
  if (t === 1) { const n = R(10000, 999999) * 100 + R(0, 99); const w = Math.round(n / 10000); return { q: n + ' 省略"万"位后面的尾数约是多少万？', a: w + '万', d: [(w + 1) + '万', (w - 1) + '万', Math.floor(n / 1000) + '万', Math.round(n / 100000) + '万'], e: '看千位上的数：' + Math.floor(n / 1000) % 10 + (Math.floor(n / 1000) % 10 >= 5 ? '≥5 向万位进 1' : '<5 直接舍去') + '，约是 ' + w + '万。' }; }
  if (t === 2) { const a = R(1, 9), b = R(1, 9), c = R(1, 9); const n = a * 10000000 + b * 100000 + c * 1000; const s = String(n); return { q: '由 ' + a + ' 个千万、' + b + ' 个十万和 ' + c + ' 个千组成的数是多少？', a: s, d: [String(a * 1000000 + b * 100000 + c * 1000), String(a * 10000000 + b * 10000 + c * 1000), String(a * 10000000 + b * 100000 + c * 100), String(a * 100000000 + b * 100000 + c * 1000)], e: '千万位写 ' + a + '，十万位写 ' + b + '，千位写 ' + c + '，其余数位补 0：' + s + '。' }; }
  const a = R(12, 98) * 10, b = R(2, 9) * 10; const p = a * b;
  return { q: a + ' × ' + b + ' = ?', a: String(p), d: [p / 10, p * 10, p + 100, (a / 10) * (b / 10)].map(String), e: '先算 ' + a / 10 + ' × ' + b / 10 + ' = ' + (a / 10) * (b / 10) + '，再在末尾添上 2 个 0：' + p + '。' };
};
GEN.g4_law = function (df) {
  const t = R(0, 4);
  if (t === 0) { const a = R(11, 99), b = R(1, 9) * 25; const c = pick([100, 200, 300, 400, 500, 600]) - b; if (c <= 0) return GEN.g4_law(df); return { q: a + ' + ' + b + ' + ' + c + ' = ?', a: String(a + b + c), d: [a + b + c + 10, a + b + c - 10, a + b + c + 100, a + b + c + 1].map(String), e: '加法结合律：先算 ' + b + ' + ' + c + ' = ' + (b + c) + '，再加 ' + a + '，得 ' + (a + b + c) + '。' }; }
  if (t === 1) { const pr = pick([[25, 4], [125, 8], [50, 2], [25, 8], [125, 4]]); const m = R(3, 49); return { q: pr[0] + ' × ' + m + ' × ' + pr[1] + ' = ?', a: String(pr[0] * m * pr[1]), d: [pr[0] * m * pr[1] + pr[0], pr[0] * pr[1] + m, pr[0] * m * pr[1] / 10, pr[0] * m * pr[1] + 100].map(String), e: '乘法交换律和结合律：先算 ' + pr[0] + ' × ' + pr[1] + ' = ' + pr[0] * pr[1] + '，再乘 ' + m + '，得 ' + pr[0] * m * pr[1] + '。' }; }
  if (t === 2) { const a = R(12, 99), b = R(11, 89); const c = 100 - b; return { q: a + ' × ' + b + ' + ' + a + ' × ' + c + ' = ?', a: String(a * 100), d: [a * 100 + a, a * 10, a * b + c, a * 100 - a].map(String), e: '乘法分配律：' + a + ' × (' + b + ' + ' + c + ') = ' + a + ' × 100 = ' + a * 100 + '。' }; }
  if (t === 3) { const a = R(12, 99); const b = pick([99, 101, 999, 98, 102]); return { q: a + ' × ' + b + ' = ?', a: String(a * b), d: [a * b + a, a * b - a, a * b + 100, a * (b > 100 ? b - 2 : b + 2)].map(String), e: '把 ' + b + ' 看成 ' + (b > 500 ? 1000 : 100) + (b > (b > 500 ? 1000 : 100) ? ' + ' : ' − ') + Math.abs(b - (b > 500 ? 1000 : 100)) + '，用乘法分配律计算，得 ' + a * b + '。' }; }
  const a = R(300, 999), b = R(20, 99), c = R(20, 99);
  return { q: a + ' − ' + b + ' − ' + c + ' = ?', a: String(a - b - c), d: [a - b + c, a - b - c + 10, a - b - c - 10, a - (b - c)].map(String), e: '减法的性质：' + a + ' − ' + b + ' − ' + c + ' = ' + a + ' − (' + b + ' + ' + c + ') = ' + (a - b - c) + '。' };
};
GEN.g4_dec = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = R(11, 999), b = R(11, 999); return { q: ds(a, 2) + ' + ' + ds(b, 2) + ' = ?', a: ds(a + b, 2), d: [ds(a + b + 10, 2), ds(a + b - 1, 2), ds(a + b, 1), ds(a + b + 100, 2)], e: '小数加法要把小数点对齐（相同数位对齐），结果是 ' + ds(a + b, 2) + '。' }; }
  if (t === 1) { const a = R(500, 2000), b = R(11, a - 50); return { q: ds(a, 2) + ' − ' + ds(b, 2) + ' = ?', a: ds(a - b, 2), d: [ds(a - b + 10, 2), ds(a - b - 10, 2), ds(a - b + 1, 2), ds(a - b, 1)], e: '小数点对齐后相减：' + ds(a, 2) + ' − ' + ds(b, 2) + ' = ' + ds(a - b, 2) + '。' }; }
  if (t === 2) { const n = R(1001, 99999); const k = pick([10, 100, 1000]); const p = k === 10 ? 1 : k === 100 ? 2 : 3; const op = RNG() < 0.5; const v = op ? ds(n * k, 3) : ds(n, 3 + p); return { q: ds(n, 3) + (op ? ' × ' : ' ÷ ') + k + ' = ?', a: v, d: op ? [ds(n * k / 10, 3), ds(n * k * 10, 3), ds(n, 3 + p)] : [ds(n, 2 + p), ds(n, 4 + p), ds(n * k, 3)], e: '一个小数' + (op ? '乘' : '除以') + ' ' + k + '，小数点向' + (op ? '右' : '左') + '移动 ' + p + ' 位：' + v + '。' }; }
  const a = R(101, 999); const w = Math.floor(a / 100), f = a % 100;
  return { q: ds(a, 2) + ' 千克 = (　) 千克 (　) 克，下面哪个对？', a: w + '千克' + f * 10 + '克', d: [w + '千克' + f + '克', w + '千克' + f * 100 + '克', (w + 1) + '千克' + f * 10 + '克'], e: '1 千克 = 1000 克，0.' + String(f).padStart(2, '0') + ' 千克 = ' + f * 10 + ' 克。' };
};
GEN.g4_angle = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = R(2, 17) * 5; return { q: '一个直角被分成两个角，其中一个是 ' + a + '°，另一个是多少度？', a: String(90 - a), d: [180 - a, 90 + a, 100 - a, 80 - a].filter(x => x > 0).map(String), e: '直角 = 90°，90° − ' + a + '° = ' + (90 - a) + '°。' }; }
  if (t === 1) { const a = R(3, 33) * 5; return { q: '一个平角被分成两个角，其中一个是 ' + a + '°，另一个是多少度？', a: String(180 - a), d: [90 - a, 360 - a, 180 + a, 170 - a].filter(x => x > 0).map(String), e: '平角 = 180°，180° − ' + a + '° = ' + (180 - a) + '°。' }; }
  if (t === 2) { const h = pick([1, 2, 3, 4, 5, 6]); return { q: '钟面上 ' + h + ' 时整，时针和分针所成的较小的角是多少度？', fig: { type: 'clock', h, m: 0 }, a: String(h * 30), d: [h * 15, h * 30 + 30, 360 - h * 30, h * 60].filter(x => x !== h * 30).map(String), e: '钟面一周 360°，每一大格 360° ÷ 12 = 30°，' + h + ' 时整相差 ' + h + ' 大格：' + h * 30 + '°。' }; }
  const a = pick([30, 45, 60, 75, 120, 135, 150, 80, 100, 110, 20]); const kind = a < 90 ? '锐角' : a === 90 ? '直角' : '钝角';
  return { q: '量得一个角是 ' + a + '°，它是什么角？', fig: { type: 'fanray', a }, a: kind, d: ['锐角', '直角', '钝角', '平角'].filter(x => x !== kind), e: '小于 90° 的是锐角，等于 90° 的是直角，大于 90° 小于 180° 的是钝角。' + a + '° 是' + kind + '。' };
};
GEN.g4_avg = function (df) {
  const t = R(0, 2);
  if (t === 0) { const n = R(3, 5), av = R(df ? 60 : 10, df ? 98 : 40); const arr = []; let s = 0; for (let i = 0; i < n - 1; i++) { const v = av + R(-8, 8); arr.push(v); s += v; } const last = av * n - s; if (last <= 0) return GEN.g4_avg(df); arr.push(last); return { q: '求这组数的平均数：' + arr.join('、'), a: String(av), d: [av + 1, av - 1, av * n, av + 2].map(String), e: '平均数 = 总数 ÷ 份数 = ' + av * n + ' ÷ ' + n + ' = ' + av + '。' }; }
  if (t === 1) { const n = R(3, 6), av = R(80, 95); return { q: '小林 ' + n + ' 次测验的平均分是 ' + av + ' 分，总分是多少分？', a: String(av * n), d: [av * n + 10, av + n, av * (n - 1), av * n - 5].map(String), e: '总分 = 平均分 × 次数 = ' + av + ' × ' + n + ' = ' + av * n + '（分）。' }; }
  const n = R(3, 4), av = R(85, 92), nx = R(95, 100); const newAv = (av * n + nx) / (n + 1); if (newAv % 1) return GEN.g4_avg(df);
  return { q: '小芳前 ' + n + ' 次考试平均 ' + av + ' 分，第 ' + (n + 1) + ' 次考了 ' + nx + ' 分，' + (n + 1) + ' 次的平均分是多少？', a: String(newAv), d: [(av + nx) / 2 % 1 ? newAv + 1 : (av + nx) / 2, newAv + 1, newAv - 1, newAv + 2].map(String), e: '先求总分：' + av + ' × ' + n + ' + ' + nx + ' = ' + (av * n + nx) + '，再除以 ' + (n + 1) + '：' + newAv + '（分）。' };
};
GEN.g5_decmul = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = R(11, 99), b = R(2, 9); return { q: ds(a, 1) + ' × ' + b + ' = ?', a: ds(a * b, 1), d: [ds(a * b, 2), ds(a * b, 0), ds(a * b + 10, 1), ds(a * b - 1, 1)], e: '先按整数乘法算 ' + a + ' × ' + b + ' = ' + a * b + '，因数共 1 位小数，积就点 1 位小数：' + ds(a * b, 1) + '。' }; }
  if (t === 1) { const a = R(11, 99), b = R(11, 99); return { q: ds(a, 1) + ' × ' + ds(b, 1) + ' = ?', a: ds(a * b, 2), d: [ds(a * b, 1), ds(a * b, 3), ds(a * b + 100, 2), ds(a * b - 10, 2)], e: '整数乘法 ' + a + ' × ' + b + ' = ' + a * b + '，两个因数共 2 位小数，积是 ' + ds(a * b, 2) + '。' }; }
  if (t === 2) { const b = R(2, 9), q = R(11, 99); return { q: ds(b * q, 1) + ' ÷ ' + b + ' = ?', a: ds(q, 1), d: [ds(q, 0), ds(q, 2), ds(q + 1, 1), ds(q * 10 + 1, 1)], e: '商的小数点要和被除数的小数点对齐：' + ds(b * q, 1) + ' ÷ ' + b + ' = ' + ds(q, 1) + '。' }; }
  const b = R(2, 9), q = R(11, 99); const A = b * q;
  return { q: ds(A, 2) + ' ÷ ' + ds(b, 1) + ' = ?', a: ds(q, 1), d: [ds(q, 2), ds(q, 0), ds(q + 1, 1), ds(q - 1, 1)], e: '除数是小数，先把除数和被除数同时扩大 10 倍：' + ds(A, 1) + ' ÷ ' + b + ' = ' + ds(q, 1) + '。' };
};
GEN.g5_eq = function (df) {
  const t = R(0, 3), x = R(2, df ? 30 : 15);
  if (t === 0) { const a = R(3, 40); return { q: '解方程：x + ' + a + ' = ' + (x + a) + '，x = ?', a: String(x), d: [x + a + a, x + 1, x - 1, a].map(String), e: '方程两边同时减去 ' + a + '：x = ' + (x + a) + ' − ' + a + ' = ' + x + '。' }; }
  if (t === 1) { const a = R(2, 9); return { q: '解方程：' + a + 'x = ' + a * x + '，x = ?', a: String(x), d: [a * x - a, a * x * a, x + 1, x + a].map(String), e: '方程两边同时除以 ' + a + '：x = ' + a * x + ' ÷ ' + a + ' = ' + x + '。' }; }
  if (t === 2) { const a = R(2, 9), b = R(1, 30); return { q: '解方程：' + a + 'x + ' + b + ' = ' + (a * x + b) + '，x = ?', a: String(x), d: [(a * x + 2 * b) / a % 1 ? x + 2 : (a * x + 2 * b) / a, x + 1, x - 1, a * x].map(String), e: '先两边同时减 ' + b + '：' + a + 'x = ' + a * x + '，再两边同时除以 ' + a + '：x = ' + x + '。' }; }
  const a = R(2, 5), b = R(2, 9);
  return { q: '一个数的 ' + a + ' 倍再减去 ' + b + ' 等于 ' + (a * x - b) + '，这个数是多少？', a: String(x), d: [x + 1, x - 1, (a * x - 2 * b) / a % 1 ? x + 2 : (a * x - 2 * b) / a, a * x].map(String), e: '设这个数为 x：' + a + 'x − ' + b + ' = ' + (a * x - b) + '，' + a + 'x = ' + a * x + '，x = ' + x + '。' };
};
GEN.g5_factor = function (df) {
  const t = R(0, 4);
  if (t === 0) { const a = R(2, 9) * R(1, 4), b = R(2, 9) * R(1, 4); if (a === b) return GEN.g5_factor(df); const g = gcd(a, b); return { q: a + ' 和 ' + b + ' 的最大公因数是多少？', a: String(g), d: [lcm(a, b), g * 2, 1, Math.min(a, b)].map(String), e: '列出因数找公共的最大一个：' + a + ' 和 ' + b + ' 的最大公因数是 ' + g + '。' }; }
  if (t === 1) { const a = R(2, 12), b = R(2, 12); if (a === b) return GEN.g5_factor(df); const l = lcm(a, b); return { q: a + ' 和 ' + b + ' 的最小公倍数是多少？', a: String(l), d: [a * b === l ? l * 2 : a * b, gcd(a, b), l + a, l + b].map(String), e: '最小公倍数 = 两数之积 ÷ 最大公因数 = ' + a * b + ' ÷ ' + gcd(a, b) + ' = ' + l + '。' }; }
  if (t === 2) { const pool = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]; const p = pick(pool); const comps = shuffle([9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 57, 91, 1].slice()).slice(0, 3); return { q: '下面哪个数是质数？', a: String(p), d: comps.map(String), e: '质数只有 1 和它本身两个因数。' + p + ' 是质数；1 既不是质数也不是合数。' }; }
  if (t === 3) { const n = pick([12, 18, 20, 24, 28, 30, 36, 40, 45, 48]); let c = 0; for (let i = 1; i <= n; i++) if (n % i === 0) c++; return { q: n + ' 一共有几个因数？', a: String(c), d: [c - 1, c + 1, c + 2, c - 2].filter(x => x > 0).map(String), e: '成对地找：' + factorPairs(n) + '，共 ' + c + ' 个因数。' }; }
  const k = pick([2, 3, 5]); const base = R(10, 99) * k; const others = [];
  while (others.length < 3) { const v = R(100, 999); if (v % k !== 0 && others.indexOf(v) < 0) others.push(v); }
  const rule = { 2: '个位是 0、2、4、6、8 的数是 2 的倍数', 3: '各位上数字的和是 3 的倍数，这个数就是 3 的倍数', 5: '个位是 0 或 5 的数是 5 的倍数' }[k];
  return { q: '下面哪个数是 ' + k + ' 的倍数？', a: String(base), d: others.map(String), e: rule + '。' + base + ' 符合。' };
};
GEN.g5_fracadd = function (df) {
  const t = R(0, 3);
  if (t <= 1) { const d1 = R(2, 9), d2 = R(2, 9); if (d1 === d2) return GEN.g5_fracadd(df); const a = [R(1, d1 - 1), d1], b = [R(1, d2 - 1), d2]; const sub = t === 1 && a[0] / a[1] > b[0] / b[1]; const r = sub ? fsub(a, b) : fadd(a, b); return { q: fs(F(a[0], a[1])) + (sub ? ' − ' : ' + ') + fs(F(b[0], b[1])) + ' = ?', a: fs(r), d: [fraw(Math.abs(sub ? a[0] - b[0] : a[0] + b[0]) || 1, a[1] + b[1]), fs(sub ? fadd(a, b) : F(r[0] + 1, r[1])), fs(F(r[0], r[1] + 1)), fs(F(r[0] + r[1], r[1] * 2))], e: '异分母分数' + (sub ? '相减' : '相加') + '，先通分（公分母 ' + lcm(d1, d2) + '），再计算并约分，结果是 ' + fs(r) + '。' }; }
  if (t === 2) { const n = R(2, 9), k = R(2, 6); const f = F(n, n * k); const g = n; return { q: '把 ' + fraw(n, n * k) + ' 约成最简分数是多少？', a: fs(f), d: [fraw(1, n * k), fraw(n, k), fraw(2, k * 2 === n ? k * 2 + 1 : k * 2)].filter(s => !sameVal(s, fs(f))).concat([fraw(1, k + 1)]), e: '分子分母同时除以最大公因数 ' + g + '：' + fs(f) + '。' }; }
  const d = pick([2, 4, 5, 8, 10, 20, 25]); const n = R(1, d - 1); const v = n / d;
  return { q: '把 ' + fraw(n, d) + ' 化成小数是多少？', a: String(+v.toFixed(4)), d: [String(+(v * 10).toFixed(4)), String(+(n / 10).toFixed(4)), String(+(v + 0.1).toFixed(4))].concat([String(d / 100)]), e: '分数化小数用分子除以分母：' + n + ' ÷ ' + d + ' = ' + +v.toFixed(4) + '。' };
};
GEN.g5_area = function (df) {
  const t = R(0, 3);
  if (t === 0) { const b = R(4, 20), h = R(3, 15); return { q: '平行四边形的底是 ' + b + ' 厘米，高是 ' + h + ' 厘米，面积是多少平方厘米？', fig: { type: 'para', b, h }, a: String(b * h), d: [b * h / 2 % 1 ? b * h + b : b * h / 2, 2 * (b + h), b * h + h, b + h].map(String), e: '平行四边形面积 = 底 × 高 = ' + b + ' × ' + h + ' = ' + b * h + '（平方厘米）。' }; }
  if (t === 1) { const b = R(2, 10) * 2, h = R(3, 15); return { q: '三角形的底是 ' + b + ' 米，高是 ' + h + ' 米，面积是多少平方米？', fig: { type: 'trih', b, h }, a: String(b * h / 2), d: [b * h, b * h / 2 + h, b + h, b * h / 2 + b].map(String), e: '三角形面积 = 底 × 高 ÷ 2 = ' + b + ' × ' + h + ' ÷ 2 = ' + b * h / 2 + '（平方米）。' }; }
  if (t === 2) { const a = R(2, 10), b = a + R(2, 10), h = R(1, 6) * 2; return { q: '梯形的上底 ' + a + ' 厘米，下底 ' + b + ' 厘米，高 ' + h + ' 厘米，面积是多少平方厘米？', fig: { type: 'trap', a, b, h }, a: String((a + b) * h / 2), d: [(a + b) * h, a * b * h / 2 % 1 ? a * b : a * b * h / 2, (a + b) * h / 2 + h, (a + b + h)].map(String), e: '梯形面积 =（上底 + 下底）× 高 ÷ 2 = (' + a + ' + ' + b + ') × ' + h + ' ÷ 2 = ' + (a + b) * h / 2 + '（平方厘米）。' }; }
  const s = pick([2, 3, 4, 5, 6, 7, 8, 9]);
  return { q: s + ' 公顷 = (　) 平方米', a: String(s * 10000), d: [s * 1000, s * 100, s * 100000, s * 1000000].map(String), e: '1 公顷 = 10000 平方米，' + s + ' 公顷 = ' + s * 10000 + ' 平方米。' };
};
GEN.g5_cuboid = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = R(2, 12), b = R(2, 10), c = R(2, 9); return { q: '长方体长 ' + a + ' 厘米、宽 ' + b + ' 厘米、高 ' + c + ' 厘米，体积是多少立方厘米？', fig: { type: 'box', a, b, c }, a: String(a * b * c), d: [2 * (a * b + b * c + a * c), a * b * c + a * b, 4 * (a + b + c), a * b + c].map(String), e: '长方体体积 = 长 × 宽 × 高 = ' + a + ' × ' + b + ' × ' + c + ' = ' + a * b * c + '（立方厘米）。' }; }
  if (t === 1) { const a = R(2, 10), b = R(2, 8), c = R(2, 7); const S = 2 * (a * b + b * c + a * c); return { q: '长方体长 ' + a + ' 分米、宽 ' + b + ' 分米、高 ' + c + ' 分米，表面积是多少平方分米？', fig: { type: 'box', a, b, c }, a: String(S), d: [a * b * c, S / 2, S + a * b, 4 * (a + b + c)].filter(x => x !== S).map(String), e: '表面积 =（长×宽 + 宽×高 + 长×高）× 2 = (' + a * b + ' + ' + b * c + ' + ' + a * c + ') × 2 = ' + S + '（平方分米）。' }; }
  if (t === 2) { const s = R(2, 9); return { q: '正方体的棱长是 ' + s + ' 厘米，体积是多少立方厘米？', fig: { type: 'box', a: s, b: s, c: s }, a: String(s * s * s), d: [6 * s * s, s * s, 12 * s, 3 * s].filter(x => x !== s * s * s).map(String), e: '正方体体积 = 棱长 × 棱长 × 棱长 = ' + s * s * s + '（立方厘米）。' }; }
  const v = R(2, 9);
  return { q: v + ' 立方分米 = (　) 立方厘米 = (　) 升？选出正确的一组', a: v * 1000 + '立方厘米，' + v + '升', d: [v * 100 + '立方厘米，' + v + '升', v * 1000 + '立方厘米，' + v * 1000 + '升', v * 10 + '立方厘米，' + v + '升'], e: '1 立方分米 = 1000 立方厘米 = 1 升。' };
};
GEN.g6_fracmul = function (df) {
  const t = R(0, 3);
  if (t === 0) { const a = [R(1, 8), R(2, 9)], b = [R(1, 8), R(2, 9)]; if (a[0] >= a[1] || b[0] >= b[1]) return GEN.g6_fracmul(df); const r = fmul(a, b); return { q: fs(F(a[0], a[1])) + ' × ' + fs(F(b[0], b[1])) + ' = ?', a: fs(r), d: [fs(fadd(a, b)), fs(fdiv(a, b)), fs(F(a[0] * b[0], a[1] + b[1])), fs(F(r[0] + 1, r[1]))], e: '分数乘分数，分子乘分子，分母乘分母，能约分要约分：' + fs(r) + '。' }; }
  if (t === 1) { const a = [R(1, 8), R(2, 9)], b = [R(1, 8), R(2, 9)]; if (a[0] >= a[1] || b[0] >= b[1]) return GEN.g6_fracmul(df); const r = fdiv(a, b); return { q: fs(F(a[0], a[1])) + ' ÷ ' + fs(F(b[0], b[1])) + ' = ?', a: fs(r), d: [fs(fmul(a, b)), fs(fdiv(b, a)), fs(F(r[0] + 1, r[1])), fs(F(a[0] * b[0], a[1] * b[1] + 1))], e: '除以一个分数等于乘它的倒数：' + fs(F(a[0], a[1])) + ' × ' + fraw(b[1], b[0]) + ' = ' + fs(r) + '。' }; }
  if (t === 2) { const d = R(3, 9), n = R(1, d - 1), whole = d * R(2, 12); const ans = whole * n / d; return { q: '一桶油 ' + whole + ' 千克，用去了 ' + fs(F(n, d)) + '，用去多少千克？', a: String(ans), d: [whole - ans, whole / d, ans + n, whole * d / n % 1 ? ans + d : whole * d / n].map(String), e: '求一个数的几分之几是多少，用乘法：' + whole + ' × ' + fs(F(n, d)) + ' = ' + ans + '（千克）。' }; }
  const d = R(3, 9), n = R(1, d - 1); const part = n * R(2, 10); const whole = part / n * d;
  return { q: '一个数的 ' + fs(F(n, d)) + ' 是 ' + part + '，这个数是多少？', a: String(whole), d: [part * n / d % 1 ? whole + d : part * n / d, whole + n, whole - d, part + d].map(String), e: '已知一个数的几分之几是多少，求这个数用除法：' + part + ' ÷ ' + fs(F(n, d)) + ' = ' + whole + '。' };
};
GEN.g6_ratio = function (df) {
  const t = R(0, 3);
  if (t === 0) { const k = R(2, 9), a = R(1, 9), b = R(1, 9); if (gcd(a, b) !== 1 || a === b) return GEN.g6_ratio(df); return { q: '化简比：' + a * k + ' : ' + b * k + ' = ?', a: a + ':' + b, d: [b + ':' + a, a * 2 + ':' + b, a + ':' + (b + 1), (a + 1) + ':' + b], e: '比的前项和后项同时除以 ' + k + '：' + a + ':' + b + '。' }; }
  if (t === 1) { const a = R(1, 9), b = R(1, 9), k = R(2, 9); if (a === b) return GEN.g6_ratio(df); const x = b * k; return { q: '解比例：' + a + ' : ' + b + ' = ' + a * k + ' : x，x = ?', a: String(x), d: [a * k * a / b % 1 ? x + 1 : a * k * a / b, x + b, k, x - 1].map(String), e: '比例的内项之积等于外项之积：' + a + 'x = ' + b + ' × ' + a * k + '，x = ' + x + '。' }; }
  if (t === 2) { const a = R(1, 7), b = R(1, 7), k = R(2, 12); if (a === b) return GEN.g6_ratio(df); const tot = (a + b) * k; return { q: '把 ' + tot + ' 个苹果按 ' + a + ':' + b + ' 分给甲、乙，甲分到多少个？', a: String(a * k), d: [b * k, tot / 2 % 1 ? a * k + 1 : tot / 2, a * k + a, tot - a].filter(x => x !== a * k).map(String), e: '甲占总数的 ' + fraw(a, a + b) + '：' + tot + ' × ' + fraw(a, a + b) + ' = ' + a * k + '（个）。' }; }
  const sc = pick([1000, 2000, 5000, 10000, 50000]), cm = R(2, 9); const km = cm * sc / 100000;
  return { q: '在比例尺 1:' + sc + ' 的地图上，量得两地距离 ' + cm + ' 厘米，实际距离是多少米？', a: String(cm * sc / 100), d: [cm * sc, cm * sc / 1000, cm * sc / 10, cm + sc].map(String), e: '实际距离 = 图上距离 ÷ 比例尺 = ' + cm + ' × ' + sc + ' = ' + cm * sc + ' 厘米 = ' + cm * sc / 100 + ' 米' + (km >= 1 ? '（' + km + ' 千米）' : '') + '。' };
};
GEN.g6_percent = function (df) {
  const t = R(0, 3);
  if (t === 0) { const p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 15, 35, 45]), n = R(2, 30) * 20; const v = n * p / 100; return { q: n + ' 的 ' + p + '% 是多少？', a: String(v), d: [n - v, v * 10, v + p, n / p % 1 ? v + 10 : n / p].map(String), e: '求一个数的百分之几是多少，用乘法：' + n + ' × ' + p + '% = ' + v + '。' }; }
  if (t === 1) { const price = R(5, 40) * 10, z = pick([7, 8, 9, 6, 5]); const v = price * z / 10; return { q: '一件衣服原价 ' + price + ' 元，打 ' + numCN(z) + '折出售，现价多少元？', a: String(v), d: [price - v, price - z, price * z / 100, v + 10].map(String), e: z + ' 折就是原价的 ' + z * 10 + '%：' + price + ' × ' + z * 10 + '% = ' + v + '（元）。' }; }
  if (t === 2) { const all = pick([20, 25, 40, 50]), ok = R(Math.floor(all * 0.6), all); const p = ok / all * 100; return { q: '一次测验 ' + all + ' 人参加，' + ok + ' 人及格，及格率是多少？', a: ds(Math.round(p * 10), 1) + '%', d: [ds(Math.round((100 - p) * 10), 1) + '%', ok + '%', ds(Math.round(p * 10) + 50, 1) + '%', ds(Math.round(p * 10) - 50, 1) + '%'], e: '及格率 = 及格人数 ÷ 总人数 × 100% = ' + ok + ' ÷ ' + all + ' × 100% = ' + ds(Math.round(p * 10), 1) + '%。' }; }
  const P = R(1, 10) * 1000, r = pick([2, 3, 4, 5]) * 0.5 + 1, y = R(1, 3); const I = Math.round(P * r * y) / 100;
  return { q: '把 ' + P + ' 元存入银行，年利率 ' + r + '%，存 ' + y + ' 年，到期利息是多少元？', a: String(I), d: [I + P, Math.round(P * r) / 100, I * 10, I / 2].filter(x => x !== I).map(String), e: '利息 = 本金 × 利率 × 存期 = ' + P + ' × ' + r + '% × ' + y + ' = ' + I + '（元）。' };
};
GEN.g6_circle = function (df) {
  const t = R(0, 3), r = R(1, 10);
  const p = x => String(+(x * 3.14).toFixed(2));
  if (t === 0) return { q: '圆的半径是 ' + r + ' 厘米，周长是多少厘米？（π 取 3.14）', fig: { type: 'circle', r, show: 'r' }, a: p(2 * r), d: [p(r), p(r * r), p(4 * r), String(2 * r + 3.14)], e: '圆的周长 = 2πr = 2 × 3.14 × ' + r + ' = ' + p(2 * r) + '（厘米）。' };
  if (t === 1) return { q: '圆的半径是 ' + r + ' 米，面积是多少平方米？（π 取 3.14）', fig: { type: 'circle', r, show: 'r' }, a: p(r * r), d: [p(2 * r), p(4 * r * r), p(r * r) === p(2 * r) ? p(r * r + 1) : p(r * r * 2), String(r * r + 3.14)], e: '圆的面积 = πr² = 3.14 × ' + r + ' × ' + r + ' = ' + p(r * r) + '（平方米）。' };
  if (t === 2) { const d = r * 2; return { q: '圆的直径是 ' + d + ' 分米，面积是多少平方分米？（π 取 3.14）', fig: { type: 'circle', r, show: 'd' }, a: p(r * r), d: [p(d * d), p(d), p(2 * d), p(r * r * 2)], e: '先求半径 r = ' + d + ' ÷ 2 = ' + r + '，面积 = 3.14 × ' + r + '² = ' + p(r * r) + '（平方分米）。' }; }
  const R2 = r + R(1, 5);
  return { q: '圆环外圆半径 ' + R2 + ' 厘米，内圆半径 ' + r + ' 厘米，圆环面积是多少平方厘米？（π 取 3.14）', fig: { type: 'ring', R: R2, r }, a: p(R2 * R2 - r * r), d: [p((R2 - r) * (R2 - r)), p(R2 * R2 + r * r), p(2 * (R2 - r)), p(R2 * R2)], e: '圆环面积 = π(R² − r²) = 3.14 × (' + R2 * R2 + ' − ' + r * r + ') = ' + p(R2 * R2 - r * r) + '（平方厘米）。' };
};
GEN.g6_cyl = function (df) {
  const t = R(0, 3), r = R(1, 6), h = R(2, 10);
  const p = x => String(+(x * 3.14).toFixed(2));
  if (t === 0) return { q: '圆柱底面半径 ' + r + ' 厘米，高 ' + h + ' 厘米，体积是多少立方厘米？（π 取 3.14）', fig: { type: 'cyl', r, h }, a: p(r * r * h), d: [p(r * r * h / 3 % 1 ? r * r * h * 2 : r * r * h / 3), p(2 * r * h), p(r * h), p(r * r * h + r * r)], e: '圆柱体积 = 底面积 × 高 = 3.14 × ' + r + '² × ' + h + ' = ' + p(r * r * h) + '（立方厘米）。' };
  if (t === 1) { const hh = r * R(1, 3) * 3; return { q: '圆锥底面半径 ' + r + ' 米，高 ' + hh + ' 米，体积是多少立方米？（π 取 3.14）', fig: { type: 'cone', r, h: hh }, a: p(r * r * hh / 3), d: [p(r * r * hh), p(r * hh), p(r * r * hh / 3 + r), p(2 * r * hh / 3 % 1 ? r * r * hh * 2 : 2 * r * hh / 3)], e: '圆锥体积 = ⅓ × 底面积 × 高 = ⅓ × 3.14 × ' + r + '² × ' + hh + ' = ' + p(r * r * hh / 3) + '（立方米）。' }; }
  if (t === 2) return { q: '圆柱底面半径 ' + r + ' 分米，高 ' + h + ' 分米，侧面积是多少平方分米？（π 取 3.14）', fig: { type: 'cyl', r, h }, a: p(2 * r * h), d: [p(r * h), p(r * r * h), p(2 * r * h + 2 * r * r), p(2 * r * h + r * r)], e: '侧面积 = 底面周长 × 高 = 2 × 3.14 × ' + r + ' × ' + h + ' = ' + p(2 * r * h) + '（平方分米）。' };
  const V = R(2, 30) * 3;
  return { q: '一个圆柱和一个圆锥等底等高，圆柱体积是 ' + V + ' 立方厘米，圆锥体积是多少？', a: String(V / 3), d: [V * 3, V, V / 2 % 1 ? V + 3 : V / 2, V - 3].filter(x => x !== V / 3).map(String), e: '等底等高时，圆锥体积是圆柱的 ⅓：' + V + ' ÷ 3 = ' + V / 3 + '（立方厘米）。' };
};
// ---------------- 竞赛题生成器（g = 年级，控制难度） ----------------
GEN.c_pattern = function (g) {
  const t = R(0, g >= 3 ? 3 : 1);
  if (t === 0) { const a = R(1, 9), d = R(2, g >= 3 ? 9 : 5); const s = [0, 1, 2, 3, 4].map(i => a + i * d); return { q: '找规律填数：' + s.slice(0, 4).join('，') + '，(　)', a: String(s[4]), d: [s[4] + 1, s[4] - 1, s[4] + d, s[3] + 1].map(String), e: '每次都增加 ' + d + '，所以下一个数是 ' + s[3] + ' + ' + d + ' = ' + s[4] + '。' }; }
  if (t === 1) { const a = R(1, 5), k = 2; const s = [0, 1, 2, 3, 4].map(i => a + i * (i + 1) / 2 * k); return { q: '找规律填数：' + s.slice(0, 4).join('，') + '，(　)', a: String(s[4]), d: [s[4] + 2, s[4] - 2, s[3] + 6, s[4] + 4].map(String), e: '相邻两数的差依次是 2、4、6、8（每次多 2），所以 ' + s[3] + ' + 8 = ' + s[4] + '。' }; }
  if (t === 2) { const a = R(1, 3), r = R(2, 3); const s = [0, 1, 2, 3, 4].map(i => a * Math.pow(r, i)); return { q: '找规律填数：' + s.slice(0, 4).join('，') + '，(　)', a: String(s[4]), d: [s[4] + s[3], s[3] * r + r, s[4] - a, s[3] + (s[3] - s[2])].map(String), e: '后一个数是前一个数的 ' + r + ' 倍：' + s[3] + ' × ' + r + ' = ' + s[4] + '。' }; }
  const a = R(1, 4), b = R(1, 5); const s = [a, b]; for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]);
  return { q: '找规律填数：' + s.slice(0, 6).join('，') + '，(　)', a: String(s[6]), d: [s[6] + 1, s[5] + (s[5] - s[4]) + 1, s[6] - 2, s[5] * 2].map(String), e: '从第三个数起，每个数都等于前两个数的和：' + s[4] + ' + ' + s[5] + ' = ' + s[6] + '。' };
};
GEN.c_queue = function (g) {
  const t = R(0, 2);
  if (t === 0) { const a = R(3, 12), b = R(3, 12); return { q: '小朋友排成一队，小美从前往后数是第 ' + a + ' 个，从后往前数是第 ' + b + ' 个，这一队共有多少人？', a: String(a + b - 1), d: [a + b, a + b + 1, a + b - 2].map(String), e: '小美被数了两次，总人数 = ' + a + ' + ' + b + ' − 1 = ' + (a + b - 1) + '（人）。' }; }
  if (t === 1) { const a = R(3, 10), b = R(2, 8); return { q: '小亮前面有 ' + a + ' 人，后面有 ' + b + ' 人，这一队共有多少人？', a: String(a + b + 1), d: [a + b, a + b - 1, a + b + 2].map(String), e: '别忘了算上小亮自己：' + a + ' + ' + b + ' + 1 = ' + (a + b + 1) + '（人）。' }; }
  const a = R(4, 12), b = R(a + 2, a + 10);
  return { q: '从左数小红排第 ' + a + '，小兰排第 ' + b + '，她们之间有几个人？', a: String(b - a - 1), d: [b - a, b - a + 1, b - a - 2].filter(x => x >= 0).map(String), e: '她们之间的人数 = ' + b + ' − ' + a + ' − 1 = ' + (b - a - 1) + '（人）。' };
};
GEN.c_quick = function (g) {
  const t = R(0, g >= 3 ? 3 : 1);
  if (t === 0) { const n = R(4, 9), base = R(1, 5) * 10; const arr = []; let s = 0; for (let i = 0; i < n; i++) { const v = base + R(-3, 3); arr.push(v); s += v; } return { q: '巧算：' + arr.join(' + ') + ' = ?', a: String(s), d: [s + 1, s - 1, s + 10, base * n].filter(x => x !== s).map(String), e: '都看成 ' + base + '：' + base + ' × ' + n + ' = ' + base * n + '，再把多出的和少的调整回来，得 ' + s + '。' }; }
  if (t === 1) { const n = R(5, g >= 3 ? 20 : 10); return { q: '计算：1 + 2 + 3 + … + ' + n + ' = ?', a: String(n * (n + 1) / 2), d: [n * n / 2 % 1 ? n * n : n * n / 2, n * (n + 1) / 2 + n, n * (n - 1) / 2, n * (n + 1)].map(String), e: '首尾配对：(1 + ' + n + ') × ' + n + ' ÷ 2 = ' + n * (n + 1) / 2 + '。' }; }
  if (t === 2) { const a = R(11, 99); return { q: '速算：' + a + ' × 11 = ?', a: String(a * 11), d: [a * 11 + 10, a * 11 - 10, a * 10 + 1, a * 11 + 100].map(String), e: '两位数乘 11："两边一拉，中间相加"。' + a + ' × 11 = ' + a * 11 + '。' }; }
  const a = R(2, 9) * 10 + 5;
  return { q: '速算：' + a + ' × ' + a + ' = ?', a: String(a * a), d: [a * a + 100, a * a - 25, a * 2, (a - 5) * (a + 5)].map(String), e: '个位是 5 的数平方：十位数 × (十位数 + 1) 后面接 25。' + a + '² = ' + a * a + '。' };
};
GEN.c_count = function (g) {
  const t = R(0, 2);
  if (t === 0) { const n = R(3, g >= 3 ? 7 : 5); return { q: '一条线段上（含两个端点）共有 ' + n + ' 个点，一共有多少条线段？', fig: { type: 'points', n }, a: String(C2(n)), d: [n - 1, n, C2(n) + 1, n * (n - 1)].map(String), e: '线段数 = ' + Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ') + ' = ' + C2(n) + '（条）。' }; }
  if (t === 1) { const n = R(4, g >= 3 ? 7 : 5); return { q: '从一点出发引出 ' + n + ' 条射线（相邻夹角都小于平角），一共能组成多少个角？', fig: { type: 'fan', n, rays: true }, a: String(C2(n)), d: [n - 1, n, C2(n) + 1, n * 2].filter(x => x !== C2(n)).map(String), e: '角的个数 = ' + Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ') + ' = ' + C2(n) + '（个）。' }; }
  const r = R(1, 3), c = R(2, 4); const ans = C2(r + 1) * C2(c + 1);
  return { q: '下图是 ' + r + ' 行 ' + c + ' 列的长方形格子，一共有多少个长方形（含正方形）？', fig: { type: 'grid', r, c }, a: String(ans), d: [r * c, ans - 1, ans + r, (r + 1) * (c + 1)].filter(x => x !== ans).map(String), e: '横向选 2 条线有 ' + C2(r + 1) + ' 种，纵向选 2 条线有 ' + C2(c + 1) + ' 种：' + C2(r + 1) + ' × ' + C2(c + 1) + ' = ' + ans + '（个）。' };
};
GEN.c_tree = function (g) {
  const t = R(0, 2), gap = R(2, 10), n = R(4, 20), L = gap * n;
  if (t === 0) return { q: '在一条长 ' + L + ' 米的小路一边植树，每隔 ' + gap + ' 米种一棵，两端都种，一共种多少棵？', a: String(n + 1), d: [n, n - 1, n + 2, 2 * n].map(String), e: '间隔数 = ' + L + ' ÷ ' + gap + ' = ' + n + '，两端都种：棵数 = 间隔数 + 1 = ' + (n + 1) + '。' };
  if (t === 1) return { q: '在一个周长 ' + L + ' 米的圆形水池边，每隔 ' + gap + ' 米种一棵树，一共种多少棵？', a: String(n), d: [n + 1, n - 1, n + 2].map(String), e: '封闭图形上植树，棵数 = 间隔数 = ' + L + ' ÷ ' + gap + ' = ' + n + '。' };
  const f = R(2, 9), s = R(2, 4);
  return { q: '锯一根木头，锯成 ' + f + ' 段要 ' + (f - 1) * s + ' 分钟，照这样锯成 ' + (f + 2) + ' 段要多少分钟？', a: String((f + 1) * s), d: [(f + 2) * s, f * s, (f + 2) * (f - 1) * s / f % 1 ? (f + 3) * s : (f + 2) * (f - 1) * s / f].filter(x => x !== (f + 1) * s).map(String).concat([String((f + 1) * s + s * 2)]), e: '锯成 ' + f + ' 段只锯 ' + (f - 1) + ' 次，每次 ' + s + ' 分钟；锯成 ' + (f + 2) + ' 段要锯 ' + (f + 1) + ' 次：' + (f + 1) * s + ' 分钟。' };
};
GEN.c_age = function (g) {
  const t = R(0, 2);
  if (t === 0) { const a = R(6, 12), d = R(22, 32), y = R(3, 10); return { q: '今年妈妈 ' + (a + d) + ' 岁，女儿 ' + a + ' 岁，' + y + ' 年后妈妈比女儿大几岁？', a: String(d), d: [d + y, d - y, d + 2 * y].map(String), e: '年龄差永远不变：' + (a + d) + ' − ' + a + ' = ' + d + '（岁）。' }; }
  if (t === 1) { const k = R(3, 5), c = R(4, 10), y = R(2, 6); const ans = c * k + (k - 1) * 0; return { q: '爸爸今年的年龄是儿子的 ' + k + ' 倍，儿子今年 ' + c + ' 岁，' + y + ' 年后父子年龄和是多少岁？', a: String(c * k + c + 2 * y), d: [c * k + c + y, c * k + c, (c + y) * (k + 1), c * k + c + 2 * y + 2].filter(x => x !== c * k + c + 2 * y).map(String), e: '爸爸今年 ' + c * k + ' 岁，今年和为 ' + (c * k + c) + '，两人各长 ' + y + ' 岁：' + (c * k + c) + ' + ' + 2 * y + ' = ' + (c * k + c + 2 * y) + '（岁）。' }; }
  const c = R(5, 12), k = R(3, 5), d = c * (k - 1);
  return { q: '爸爸比儿子大 ' + d + ' 岁，今年爸爸的年龄是儿子的 ' + k + ' 倍，儿子今年几岁？', a: String(c), d: [c + 1, c - 1, d / k % 1 ? c + 2 : d / k, c * k].filter(x => x !== c).map(String), e: '年龄差 ' + d + ' 岁正好是儿子年龄的 ' + (k - 1) + ' 倍：' + d + ' ÷ ' + (k - 1) + ' = ' + c + '（岁）。' };
};
GEN.c_chick = function (g) {
  const c = R(3, 20), r = R(3, 20); const heads = c + r, legs = 2 * c + 4 * r;
  if (R(0, 1)) return { q: '鸡兔同笼，共有 ' + heads + ' 个头，' + legs + ' 条腿，兔有多少只？', a: String(r), d: [c, r + 1, heads - r + 1, legs / 4 % 1 ? r + 2 : legs / 4].filter(x => x !== r).map(String), e: '假设全是鸡：腿有 ' + heads * 2 + ' 条，少了 ' + (legs - heads * 2) + ' 条，每只兔比鸡多 2 条腿：兔 = ' + (legs - heads * 2) + ' ÷ 2 = ' + r + '（只）。' };
  return { q: '鸡兔同笼，共有 ' + heads + ' 个头，' + legs + ' 条腿，鸡有多少只？', a: String(c), d: [r, c + 1, c - 1, legs / 2 % 1 ? c + 2 : legs / 2].filter(x => x !== c).map(String), e: '假设全是兔：腿有 ' + heads * 4 + ' 条，多了 ' + (heads * 4 - legs) + ' 条，每只鸡比兔少 2 条腿：鸡 = ' + (heads * 4 - legs) + ' ÷ 2 = ' + c + '（只）。' };
};
GEN.c_sumdiff = function (g) {
  const b = R(5, 50), d = R(2, 30), a = b + d;
  return { q: '甲、乙两数的和是 ' + (a + b) + '，差是 ' + d + '，较大的数是多少？', a: String(a), d: [b, (a + b) / 2 % 1 ? a + 1 : (a + b) / 2, a + d, a - 1].filter(x => x !== a).map(String), e: '大数 =（和 + 差）÷ 2 = (' + (a + b) + ' + ' + d + ') ÷ 2 = ' + a + '。' };
};
GEN.c_summul = function (g) {
  const s = R(4, 30), k = R(2, 6);
  if (R(0, 1)) return { q: '甲数是乙数的 ' + k + ' 倍，两数的和是 ' + s * (k + 1) + '，乙数是多少？', a: String(s), d: [s * k, s + 1, s * (k + 1) / k % 1 ? s + k : s * (k + 1) / k].filter(x => x !== s).map(String), e: '和是乙数的 ' + (k + 1) + ' 倍：乙 = ' + s * (k + 1) + ' ÷ ' + (k + 1) + ' = ' + s + '。' };
  return { q: '甲数是乙数的 ' + k + ' 倍，甲比乙多 ' + s * (k - 1) + '，乙数是多少？', a: String(s), d: [s * k, s + 1, s * (k - 1) / k % 1 ? s + 2 : s * (k - 1) / k].filter(x => x !== s).map(String), e: '差是乙数的 ' + (k - 1) + ' 倍：乙 = ' + s * (k - 1) + ' ÷ ' + (k - 1) + ' = ' + s + '。' };
};
GEN.c_surplus = function (g) {
  const n = R(4, 15), a = R(2, 6), b = a + R(1, 3), p = R(1, 10), q = n * b - n * a - p; if (q < 1) return GEN.c_surplus(g);
  const tot = n * a + p;
  return { q: '分糖果：每人分 ' + a + ' 颗，多 ' + p + ' 颗；每人分 ' + b + ' 颗，少 ' + q + ' 颗。有多少个小朋友？', a: String(n), d: [n + 1, n - 1, tot, (p + q) / a % 1 ? n + 2 : (p + q) / a].filter(x => x !== n).map(String), e: '一盈一亏：人数 =（盈 + 亏）÷ 两次分配差 = (' + p + ' + ' + q + ') ÷ (' + b + ' − ' + a + ') = ' + n + '（人）。' };
};
GEN.c_trip = function (g) {
  const t = R(0, 2);
  if (t === 0) { const v1 = R(3, 9) * 10, v2 = R(3, 9) * 10, h = R(2, 6); return { q: '甲、乙两车从相距 ' + (v1 + v2) * h + ' 千米的两地同时相向开出，甲每小时行 ' + v1 + ' 千米，乙每小时行 ' + v2 + ' 千米，几小时后相遇？', a: String(h), d: [h + 1, h - 1 || h + 2, (v1 + v2) * h / Math.abs(v1 - v2 || 10) % 1 ? h * 2 : (v1 + v2) * h / Math.abs(v1 - v2 || 10)].filter(x => x !== h).map(String), e: '相遇时间 = 路程 ÷ 速度和 = ' + (v1 + v2) * h + ' ÷ ' + (v1 + v2) + ' = ' + h + '（小时）。' }; }
  if (t === 1) { const v1 = R(5, 12) * 10, d = R(1, 4) * 10, v2 = v1 + d, h = R(2, 6); return { q: '甲车在乙车前方 ' + d * h + ' 千米，乙车每小时行 ' + v2 + ' 千米，甲车每小时行 ' + v1 + ' 千米，同向而行，乙几小时追上甲？', a: String(h), d: [h + 1, h - 1 || h + 3, h * 2].filter(x => x !== h).map(String), e: '追及时间 = 路程差 ÷ 速度差 = ' + d * h + ' ÷ ' + d + ' = ' + h + '（小时）。' }; }
  const L = R(2, 9) * 50, v = R(10, 25), tt = R(10, 40); const bridge = v * tt - L; if (bridge <= 0) return GEN.c_trip(g);
  return { q: '一列火车长 ' + L + ' 米，每秒行 ' + v + ' 米，完全通过一座桥用了 ' + tt + ' 秒，桥长多少米？', a: String(bridge), d: [v * tt, v * tt + L, bridge + v, bridge - 10].filter(x => x > 0 && x !== bridge).map(String), e: '火车走过的路程 = 桥长 + 车长：' + v + ' × ' + tt + ' − ' + L + ' = ' + bridge + '（米）。' };
};
GEN.c_work = function (g) {
  const pairs = [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [6, 3], [20, 30], [12, 4], [15, 10], [10, 40], [5, 20], [9, 18], [8, 24], [12, 6]];
  const p = pick(pairs); const tt = p[0] * p[1] / (p[0] + p[1]);
  return { q: '一项工程，甲单独做 ' + p[0] + ' 天完成，乙单独做 ' + p[1] + ' 天完成，两人合作几天完成？', a: String(tt), d: [(p[0] + p[1]) / 2, p[0] + p[1], Math.abs(p[0] - p[1]), tt + 1].filter(x => x !== tt).map(String), e: '工作效率和 = ' + fraw(1, p[0]) + ' + ' + fraw(1, p[1]) + ' = ' + fs(F(p[0] + p[1], p[0] * p[1])) + '，合作时间 = 1 ÷ ' + fs(F(p[0] + p[1], p[0] * p[1])) + ' = ' + tt + '（天）。' };
};
GEN.c_pigeon = function (g) {
  const t = R(0, 1);
  if (t === 0) { const k = R(3, 6); const cols = ['红', '黄', '蓝', '绿', '白', '黑'].slice(0, k).join('、'); return { q: '口袋里有 ' + cols + ' ' + k + ' 种颜色的球各 10 个，至少摸出几个球才能保证有 2 个同色？', a: String(k + 1), d: [k, k + 2, 2 * k, 11].filter(x => x !== k + 1).map(String), e: '最坏情况：每种颜色先各摸 1 个（' + k + ' 个），再摸 1 个一定同色：' + k + ' + 1 = ' + (k + 1) + '（个）。' }; }
  const box = R(3, 8), m = R(2, 5); const n = box * m + R(1, box - 1);
  return { q: '把 ' + n + ' 本书放进 ' + box + ' 个抽屉，总有一个抽屉至少放几本书？', a: String(m + 1), d: [m, m + 2, Math.ceil(n / 2)].filter(x => x !== m + 1).map(String), e: n + ' ÷ ' + box + ' = ' + m + '……' + (n - box * m) + '，有余数就要再加 1：至少 ' + (m + 1) + ' 本。' };
};
GEN.c_comb = function (g) {
  const t = R(0, 3);
  if (t === 0) { const n = R(4, g >= 5 ? 12 : 8); return { q: n + ' 个小朋友每两人握一次手，一共握手多少次？', a: String(C2(n)), d: [n * (n - 1), n * 2, C2(n) + n, C2(n) - 1].map(String), e: '每人握 ' + (n - 1) + ' 次，每次握手算了两遍：' + n + ' × ' + (n - 1) + ' ÷ 2 = ' + C2(n) + '（次）。' }; }
  if (t === 1) { const a = R(2, 5), b = R(2, 5); return { q: '有 ' + a + ' 件上衣和 ' + b + ' 条裤子，一件上衣配一条裤子，共有多少种穿法？', a: String(a * b), d: [a + b, a * b + 1, a * b * 2, a * b - 1].filter(x => x !== a * b).map(String), e: '乘法原理：' + a + ' × ' + b + ' = ' + a * b + '（种）。' }; }
  if (t === 2) { const n = R(3, 4); const f = n === 3 ? 6 : 24; return { q: '用 ' + ['1、2、3', '1、2、3、4'][n - 3] + ' 这 ' + n + ' 个数字，每个只用一次，能组成多少个不同的 ' + n + ' 位数？', a: String(f), d: n === 3 ? ['3', '9', '27', '8'] : ['16', '12', '64', '256'], e: '首位有 ' + n + ' 种选法，第二位 ' + (n - 1) + ' 种……共 ' + Array.from({ length: n }, (_, i) => n - i).join(' × ') + ' = ' + f + '（个）。' }; }
  const n = R(4, 8);
  return { q: n + ' 支球队进行单循环比赛（每两队赛一场），一共要赛多少场？', a: String(C2(n)), d: [n * (n - 1), n - 1, C2(n) + 1, n * 2].map(String), e: '单循环：' + n + ' × ' + (n - 1) + ' ÷ 2 = ' + C2(n) + '（场）。' };
};
GEN.c_logic = function (g) {
  const d = R(0, 6), add = R(3, 40);
  return { q: '今天是' + WEEK[d] + '，再过 ' + add + ' 天是星期几？', a: WEEK[(d + add) % 7], d: [WEEK[(d + add + 1) % 7], WEEK[(d + add + 6) % 7], WEEK[(d + add + 2) % 7], WEEK[(d + add + 5) % 7]], e: '一星期 7 天循环：' + add + ' ÷ 7 = ' + Math.floor(add / 7) + '……' + add % 7 + '，从' + WEEK[d] + '往后数 ' + add % 7 + ' 天是' + WEEK[(d + add) % 7] + '。' };
};
GEN.c_num = function (g) {
  const t = R(0, 2);
  if (t === 0) { const n = R(20, 99); const base = R(2, 9); const pages = n; let digits = 0; for (let i = 1; i <= pages; i++) digits += String(i).length; return { q: '一本书有 ' + pages + ' 页，编页码一共要用多少个数字？', a: String(digits), d: [pages, pages * 2, digits + 9, digits - 9].map(String), e: '1~9 页用 9 个数字，10~' + pages + ' 页共 ' + (pages - 9) + ' 页，每页 2 个数字：9 + ' + (pages - 9) * 2 + ' = ' + digits + '（个）。' }; }
  if (t === 1) { const a = R(2, 7), b = R(2, 9), c = R(1, a - 1); const n = a * b * R(1, 3) + c; const m = lcm(a, b); if (c % gcd(a, b) !== 0) return GEN.c_num(g); let x = b; while (x % a !== c) x += b; if (x > 300) return GEN.c_num(g); return { q: '一个数除以 ' + a + ' 余 ' + c + '，又是 ' + b + ' 的倍数，这样的数最小是多少？', a: String(x), d: [x + m, x + 1, b, x + a].filter(v => v !== x).map(String), e: '在 ' + b + ' 的倍数 ' + b + '、' + 2 * b + '、' + 3 * b + '……中找除以 ' + a + ' 余 ' + c + ' 的最小数：' + x + '。' }; }
  const n = R(2, 9); const k = R(2, 5);
  return { q: '计算 ' + n + ' 的 ' + (4 * k + 1) + ' 次方，结果的个位数字是几？', a: String(n % 10), d: [(n * n) % 10, (n * n * n) % 10, (n + 1) % 10, (n * 2) % 10].filter(v => v !== n % 10).map(String), e: '个位数字每 4 次一循环，' + (4 * k + 1) + ' ÷ 4 余 1，所以个位和 ' + n + ' 的 1 次方相同：' + n % 10 + '。' };
};
// ---------------- 手写竞赛题库：每题附独立验算函数 v()，测试时逐题核对答案 ----------------
const B = (kp, q, a, d, e, v) => ({ kp, q, a, d, e, v });
const BANK = {
1: [
  B('c_quick', '1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = ?', '45', ['44', '46', '55'], '首尾配对：1+9、2+8、3+7、4+6 各是 10，再加 5：45。', () => String([1,2,3,4,5,6,7,8,9].reduce((a, b) => a + b))),
  B('c_quick', '19 + 19 + 19 + 19 + 19 = ?', '95', ['85', '100', '90'], '每个 19 看成 20，共 100，再减去 5 个 1：95。', () => String(19 * 5)),
  B('c_queue', '小动物排队，小兔前面有 4 只，后面有 5 只，一共有几只小动物？', '10', ['9', '11', '8'], '4 + 5 + 1（小兔自己）= 10。', () => String(4 + 5 + 1)),
  B('c_queue', '同学们排成一排，从左数小华是第 6 个，从右数是第 8 个，这排有几人？', '13', ['14', '12', '15'], '6 + 8 − 1 = 13（小华被数了两次）。', () => String(6 + 8 - 1)),
  B('c_pattern', '找规律：1，3，5，7，(　)，11', '9', ['8', '10', '13'], '单数依次增加 2：7 + 2 = 9。', () => String(7 + 2)),
  B('c_pattern', '找规律：2，4，8，16，(　)', '32', ['18', '24', '20'], '每个数是前一个数的 2 倍：16 × 2 = 32。', () => String(16 * 2)),
  B('c_pattern', '找规律：○△□○△□○△…，第 10 个图形是什么？', '○', ['△', '□', '☆'], '3 个一组循环，10 ÷ 3 = 3……1，是每组的第 1 个：○。', () => ['○','△','□'][(10 - 1) % 3]),
  B('c_count', '3 根小棒最多能摆出几个三角形？', '1', ['2', '3', '0'], '三角形有 3 条边，3 根小棒只能摆 1 个。', () => String(Math.floor(3 / 3))),
  B('c_logic', '哥哥比弟弟大 3 岁，5 年后哥哥比弟弟大几岁？', '3', ['8', '5', '2'], '年龄差永远不变，还是 3 岁。', () => String(3)),
  B('c_logic', '一根绳子对折再对折，从中间剪一刀，绳子变成几段？', '5', ['4', '3', '6'], '对折再对折是 4 股，剪一刀产生 8 个断头，加上原来 2 端共 10 个头，10 ÷ 2 = 5 段。', () => String((4 * 2 + 2) / 2)),
  B('c_logic', '树上有 10 只鸟，猎人开枪打中 1 只，树上还剩几只？', '0', ['9', '1', '10'], '枪一响其余的鸟都吓飞了，被打中的也掉下来了，树上没有鸟了。', () => String(0)),
  B('c_quick', '8 + 8 + 8 + 8 − 8 − 8 = ?', '16', ['8', '24', '32'], '4 个 8 减去 2 个 8，剩 2 个 8：16。', () => String(8 + 8 + 8 + 8 - 8 - 8)),
  B('c_logic', '1 张 5 元的人民币可以换几张 1 元的？', '5', ['4', '10', '6'], '5 元 = 5 个 1 元，可以换 5 张。', () => String(5 / 1)),
  B('c_queue', '小明家住在 5 楼，他从 1 楼走到 5 楼要走几层楼梯？', '4', ['5', '6', '3'], '从 1 楼到 5 楼走了 5 − 1 = 4 层。', () => String(5 - 1)),
  B('c_quick', '20 − 1 − 2 − 3 − 4 = ?', '10', ['12', '8', '11'], '1 + 2 + 3 + 4 = 10，20 − 10 = 10。', () => String(20 - 1 - 2 - 3 - 4)),
  B('c_pattern', '找规律：1，2，4，7，11，(　)', '16', ['15', '17', '14'], '相邻两数差依次是 1、2、3、4、5：11 + 5 = 16。', () => String(11 + 5)),
  B('c_logic', '小红有 5 颗糖，小兰比小红多 3 颗，她们一共有几颗糖？', '13', ['8', '11', '10'], '小兰有 5 + 3 = 8 颗，一共 5 + 8 = 13 颗。', () => String(5 + (5 + 3))),
  B('c_logic', '一个数加上 6，再减去 4，得 10，这个数是几？', '8', ['12', '20', '6'], '倒着想：10 + 4 − 6 = 8。', () => String(10 + 4 - 6)),
  B('c_count', '用 4 根同样长的小棒，可以摆成一个什么图形？', '正方形', ['三角形', '圆', '五边形'], '4 条一样长的边围成正方形。', () => '正方形'),
  B('c_quick', '9 + 99 = ?', '108', ['98', '109', '118'], '把 99 看成 100，9 + 100 − 1 = 108。', () => String(9 + 99)),
  B('c_pattern', '找规律：10，9，7，4，(　)', '0', ['1', '2', '3'], '依次减 1、2、3、4：4 − 4 = 0。', () => String(4 - 4))
],
2: [
  B('c_tree', '一条 20 米的小路一边每隔 5 米种一棵树（两端都种），一共种几棵？', '5', ['4', '6', '3'], '间隔数 20 ÷ 5 = 4，两端都种 4 + 1 = 5。', () => String(20 / 5 + 1)),
  B('c_tree', '爬楼梯从 1 楼到 3 楼要 2 分钟，照这样从 1 楼到 7 楼要几分钟？', '6', ['7', '5', '14'], '1 到 3 楼爬 2 层用 2 分钟，每层 1 分钟；1 到 7 楼爬 6 层要 6 分钟。', () => String((7 - 1) * (2 / (3 - 1)))),
  B('c_age', '今年小明 8 岁，爸爸 35 岁，几年后爸爸的年龄正好是小明的 4 倍？', '1', ['2', '3', '0'], '年龄差 27 岁，是小明年龄的 3 倍时小明 9 岁，所以 1 年后。', () => String(27 / 3 - 8)),
  B('c_quick', '99 + 98 + 97 + 3 + 2 + 1 = ?', '300', ['290', '310', '200'], '99+1、98+2、97+3 各是 100，共 300。', () => String(99 + 98 + 97 + 3 + 2 + 1)),
  B('c_quick', '6 × 7 + 6 × 3 = ?', '60', ['42', '58', '63'], '6 个 7 加 6 个 3 等于 6 个 10：60。', () => String(6 * 7 + 6 * 3)),
  B('c_pattern', '找规律：1，4，9，16，(　)', '25', ['20', '24', '36'], '依次是 1×1、2×2、3×3、4×4，下一个是 5×5 = 25。', () => String(5 * 5)),
  B('c_pattern', '找规律：3，6，9，12，(　)，18', '15', ['13', '14', '16'], '每次增加 3：12 + 3 = 15。', () => String(12 + 3)),
  B('c_queue', '24 名同学排成 4 列，每列人数相同，小林在某列从前往后是第 2 个，从后往前是第几个？', '5', ['4', '6', '3'], '每列 24 ÷ 4 = 6 人，6 − 2 + 1 = 5。', () => String(24 / 4 - 2 + 1)),
  B('c_count', '一个三角形和一个正方形（都画在纸上）最多有几个交点？', '6', ['8', '7', '4'], '一条直线段与正方形最多交 2 个点，三角形有 3 条边：3 × 2 = 6。', () => String(3 * 2)),
  B('c_logic', '小猫比小狗重，小狗比小兔重，谁最轻？', '小兔', ['小猫', '小狗', '一样重'], '小猫 > 小狗 > 小兔，小兔最轻。', () => '小兔'),
  B('c_logic', '一只蜗牛从 10 米深的井底往上爬，白天爬 3 米，晚上滑下 2 米，第几天能爬出井口？', '8', ['10', '7', '9'], '前 7 天每天净爬 1 米到 7 米，第 8 天白天爬 3 米到 10 米就出井了。', () => { let h = 0, d = 0; while (true) { d++; h += 3; if (h >= 10) return String(d); h -= 2; } }),
  B('c_tree', '把一根木头锯成 5 段，要锯几次？', '4', ['5', '6', '3'], '锯的次数 = 段数 − 1 = 4。', () => String(5 - 1)),
  B('c_age', '妈妈比小芳大 26 岁，3 年后妈妈比小芳大几岁？', '26', ['29', '23', '32'], '年龄差永远不变：26 岁。', () => String(26)),
  B('c_quick', '45 + 46 + 47 + 48 + 49 = ?', '235', ['225', '245', '230'], '中间数 47 × 5 = 235。', () => String(45 + 46 + 47 + 48 + 49)),
  B('c_logic', '有 3 个小朋友，每两人通一次电话，一共通几次？', '3', ['6', '2', '4'], 'AB、AC、BC，共 3 次。', () => String(3 * 2 / 2)),
  B('c_count', '一个长方形，剪去一个角（剪口经过两边），最多剩几个角？', '5', ['3', '4', '6'], '剪去 1 个角，新增 2 个角：4 − 1 + 2 = 5。', () => String(4 - 1 + 2)),
  B('c_pattern', '找规律：1，1，2，3，5，8，(　)', '13', ['11', '12', '16'], '每个数等于前两个数之和：5 + 8 = 13。', () => String(5 + 8)),
  B('c_logic', '一只青蛙 1 张嘴 2 只眼 4 条腿，3 只青蛙有几条腿？', '12', ['6', '9', '7'], '4 × 3 = 12（条）。', () => String(4 * 3)),
  B('c_quick', '36 ÷ 4 × 4 ÷ 9 = ?', '4', ['1', '9', '16'], '÷4 再 ×4 抵消，36 ÷ 9 = 4。', () => String(36 / 4 * 4 / 9)),
  B('c_tree', '在一个圆形花坛周围每隔 2 米插一面彩旗，花坛周长 16 米，共插几面彩旗？', '8', ['9', '7', '16'], '封闭图形：16 ÷ 2 = 8（面）。', () => String(16 / 2)),
  B('c_age', '小军和小强年龄和是 18 岁，小军比小强大 2 岁，小军几岁？', '10', ['8', '9', '11'], '(18 + 2) ÷ 2 = 10（岁）。', () => String((18 + 2) / 2))
],
3: [
  B('c_chick', '鸡兔同笼，有 8 个头，22 条腿，兔有几只？', '3', ['5', '4', '2'], '假设全是鸡 16 条腿，少 6 条，6 ÷ 2 = 3（只兔）。', () => String((22 - 8 * 2) / 2)),
  B('c_chick', '鸡兔同笼，有 10 个头，32 条腿，鸡有几只？', '4', ['6', '5', '3'], '假设全是兔 40 条腿，多 8 条，8 ÷ 2 = 4（只鸡）。', () => String((10 * 4 - 32) / 2)),
  B('c_sumdiff', '两数和是 50，差是 12，较小的数是多少？', '19', ['31', '20', '25'], '小数 =（和 − 差）÷ 2 = 38 ÷ 2 = 19。', () => String((50 - 12) / 2)),
  B('c_summul', '果园里梨树和苹果树共 48 棵，苹果树是梨树的 3 倍，梨树有几棵？', '12', ['16', '36', '24'], '梨树 1 份，共 4 份：48 ÷ 4 = 12（棵）。', () => String(48 / (3 + 1))),
  B('c_tree', '一条长 100 米的路两旁每隔 10 米种一棵树（两端都种），共种几棵？', '22', ['20', '11', '21'], '一边 100 ÷ 10 + 1 = 11 棵，两旁 22 棵。', () => String((100 / 10 + 1) * 2)),
  B('c_comb', '用 0、1、2 能组成几个不同的三位数（数字不重复）？', '4', ['6', '3', '9'], '0 不能在首位：首位 2 种，其余 2 种、1 种：2 × 2 × 1 = 4。', () => { let c = 0; for (let n = 100; n < 1000; n++) { const s = String(n); if ([...s].every(ch => '012'.includes(ch)) && new Set(s).size === 3) c++; } return String(c); }),
  B('c_comb', '从 4 名同学中选 2 名当正、副班长，有几种选法？', '12', ['6', '8', '16'], '正班长 4 种，副班长 3 种：4 × 3 = 12。', () => String(4 * 3)),
  B('c_pattern', '找规律：2，5，11，23，(　)', '47', ['46', '35', '45'], '每个数 × 2 + 1：23 × 2 + 1 = 47。', () => String(23 * 2 + 1)),
  B('c_age', '爸爸今年 40 岁，儿子 10 岁，几年前爸爸的年龄是儿子的 7 倍？', '5', ['4', '6', '3'], '年龄差 30 岁，是儿子年龄的 6 倍时儿子 5 岁，即 5 年前。', () => String(10 - 30 / 6)),
  B('c_count', '数一数：一个"田"字里一共有几个正方形？', '5', ['4', '6', '9'], '4 个小正方形加 1 个大正方形：5。', () => String(4 + 1)),
  B('c_quick', '125 × 8 = ?', '1000', ['100', '800', '1250'], '125 × 8 = 1000，要牢记。', () => String(125 * 8)),
  B('c_quick', '999 + 99 + 9 + 3 = ?', '1110', ['1100', '1111', '1010'], '999+1、99+1、9+1 凑整：1000 + 100 + 10 = 1110。', () => String(999 + 99 + 9 + 3)),
  B('c_sumdiff', '甲乙两袋米共 60 千克，从甲袋取 5 千克放入乙袋后两袋同样重，甲袋原有多少千克？', '35', ['30', '25', '40'], '平分后各 30 千克，甲原有 30 + 5 = 35（千克）。', () => String(60 / 2 + 5)),
  B('c_summul', '小明的画片比小华多 24 张，是小华的 4 倍，小华有几张？', '8', ['6', '32', '12'], '差是小华的 3 倍：24 ÷ 3 = 8（张）。', () => String(24 / (4 - 1))),
  B('c_logic', '今年 3 月 1 日是星期三，3 月 31 日是星期几？', '星期五', ['星期四', '星期六', '星期三'], '过 30 天，30 ÷ 7 = 4……2，星期三往后 2 天是星期五。', () => WEEK[(3 + 30) % 7]),
  B('c_tree', '小明从一楼走到四楼用 36 秒，照这样他从一楼走到八楼要多少秒？', '84', ['72', '96', '63'], '每层 36 ÷ 3 = 12 秒，一楼到八楼 7 层：12 × 7 = 84（秒）。', () => String(36 / 3 * 7)),
  B('c_comb', '有 1 元、5 元、10 元的人民币各一张，能组成几种不同的币值？', '7', ['6', '3', '8'], '取 1 张 3 种，2 张 3 种，3 张 1 种：共 7 种。', () => { const s = new Set(); [1, 5, 10].forEach((a, i, A) => { s.add(a); A.forEach((b, j) => { if (j > i) s.add(a + b); }); }); s.add(16); return String(s.size); }),
  B('c_chick', '停车场有汽车和摩托车共 12 辆，轮子共 40 个，汽车有几辆？', '8', ['4', '6', '10'], '假设全是摩托车 24 个轮子，少 16 个，16 ÷ 2 = 8（辆汽车）。', () => String((40 - 12 * 2) / 2)),
  B('c_pattern', '找规律：1，2，6，24，(　)', '120', ['48', '96', '100'], '依次 ×2、×3、×4，下一个 ×5：24 × 5 = 120。', () => String(24 * 5)),
  B('c_logic', 'A、B、C 三人中有一人打碎了花瓶。A 说：不是我。B 说：是 C。C 说：不是我。只有一人说真话，是谁打碎的？', 'A', ['B', 'C', '无法确定'], '若 A 打碎：A 假、B 假、C 真，恰一人真，符合。', () => ['A', 'B', 'C'].find(x => [x !== 'A', x === 'C', x !== 'C'].filter(Boolean).length === 1)),
  B('c_count', '5 个点，任意 3 点不在同一直线上，每 2 点连一条线段，共连几条？', '10', ['5', '20', '15'], '5 × 4 ÷ 2 = 10（条）。', () => String(5 * 4 / 2))
],
4: [
  B('c_chick', '一共有 15 道题，做对一题得 8 分，做错一题扣 4 分，小明得了 84 分，他做对了几道题？', '12', ['13', '11', '10'], '假设全对得 120 分，少 36 分，每错一题少 8 + 4 = 12 分：错 3 题，对 12 题。', () => String(15 - (15 * 8 - 84) / 12)),
  B('c_surplus', '老师分练习本，每人 5 本多 10 本，每人 7 本少 6 本，有多少名学生？', '8', ['6', '10', '16'], '(10 + 6) ÷ (7 − 5) = 8（名）。', () => String((10 + 6) / (7 - 5))),
  B('c_trip', '甲乙两人同时从相距 1000 米的两地相向而行，甲每分钟走 60 米，乙每分钟走 40 米，几分钟相遇？', '10', ['20', '25', '12'], '1000 ÷ (60 + 40) = 10（分）。', () => String(1000 / (60 + 40))),
  B('c_trip', '一列火车长 200 米，以每秒 20 米的速度通过一座长 800 米的大桥，需要多少秒？', '50', ['40', '10', '45'], '(800 + 200) ÷ 20 = 50（秒）。', () => String((800 + 200) / 20)),
  B('c_sumdiff', '大、小两桶油共 90 千克，大桶比小桶多 14 千克，大桶有多少千克？', '52', ['38', '45', '76'], '(90 + 14) ÷ 2 = 52（千克）。', () => String((90 + 14) / 2)),
  B('c_summul', '甲仓存粮是乙仓的 3 倍，从甲仓运出 20 吨后两仓同样多，乙仓有多少吨？', '10', ['20', '30', '5'], '甲比乙多 2 倍乙 = 20 吨，乙 = 10 吨。', () => String(20 / (3 - 1))),
  B('c_comb', '8 个队进行淘汰赛（输一场就淘汰），决出冠军共要赛几场？', '7', ['8', '28', '4'], '每场淘汰 1 队，要淘汰 7 队：7 场。', () => String(8 - 1)),
  B('c_quick', '(1 + 3 + 5 + … + 19) = ?', '100', ['90', '110', '81'], '1 到 19 共 10 个单数，和 = 10 × 10 = 100。', () => { let s = 0; for (let i = 1; i <= 19; i += 2) s += i; return String(s); }),
  B('c_quick', '25 × 32 × 125 = ?', '100000', ['10000', '1000000', '80000'], '32 = 4 × 8，(25 × 4) × (125 × 8) = 100 × 1000 = 100000。', () => String(25 * 32 * 125)),
  B('c_quick', '1999 + 999 × 999 = ?', '1000000', ['999000', '998001', '999999'], '1999 = 999 + 1000：999 × 999 + 999 + 1000 = 999 × 1000 + 1000 = 1000 × 1000 = 1000000。', () => String(1999 + 999 * 999)),
  B('c_count', '图中有一个 4 × 4 的方格，一共有多少个正方形？', '30', ['16', '25', '20'], '1×1 的 16 个，2×2 的 9 个，3×3 的 4 个，4×4 的 1 个，共 30 个。', () => String(16 + 9 + 4 + 1)),
  B('c_chick', '龟鹤同池，共有 20 个头，56 条腿，龟有几只？', '8', ['12', '10', '6'], '假设全是鹤 40 条腿，少 16 条，16 ÷ 2 = 8（只龟）。', () => String((56 - 20 * 2) / 2)),
  B('c_surplus', '用绳子测井深，绳子三折时多 5 米，四折时多 1 米，井深多少米？', '11', ['12', '16', '48'], '绳长是 3 和 4 的公倍数差关系：设井深 h，3(h + 5) = 4(h + 1)，h = 11。', () => { for (let h = 1; h < 100; h++) if (3 * (h + 5) === 4 * (h + 1)) return String(h); }),
  B('c_trip', '小明从家到学校，每分钟走 50 米要迟到 2 分钟，每分钟走 60 米早到 3 分钟，家到学校多少米？', '1500', ['1200', '1800', '3000'], '设规定时间 t：50(t + 2) = 60(t − 3)，t = 28，路程 50 × 30 = 1500 米。', () => { for (let t = 1; t < 200; t++) if (50 * (t + 2) === 60 * (t - 3)) return String(50 * (t + 2)); }),
  B('c_logic', '一个数除以 5 余 3，除以 6 余 4，这个数最小是多少？', '28', ['38', '18', '58'], '都比除数少 2：最小是 30 − 2 = 28。', () => { for (let n = 1; ; n++) if (n % 5 === 3 && n % 6 === 4) return String(n); }),
  B('c_comb', '从 1、2、3、4、5 中任取两个数相加，能得到几个不同的和？', '7', ['10', '8', '9'], '和可以是 3 到 9，共 7 个。', () => { const s = new Set(); for (let i = 1; i <= 5; i++) for (let j = i + 1; j <= 5; j++) s.add(i + j); return String(s.size); }),
  B('c_pattern', '找规律：1，3，7，15，31，(　)', '63', ['47', '62', '64'], '每个数 × 2 + 1：31 × 2 + 1 = 63。', () => String(31 * 2 + 1)),
  B('c_quick', '101 × 37 = ?', '3737', ['3700', '3777', '3637'], '101 × 37 = 37 × 100 + 37 = 3737。', () => String(101 * 37)),
  B('c_sumdiff', '一个长方形周长 40 厘米，长比宽多 4 厘米，面积是多少平方厘米？', '96', ['100', '80', '84'], '长 + 宽 = 20，长 12 宽 8，面积 96。', () => String(((20 + 4) / 2) * ((20 - 4) / 2))),
  B('c_count', '在 1 至 100 中，数字 9 一共出现了多少次？', '20', ['19', '10', '11'], '个位上 10 次，十位上 10 次（90~99），共 20 次。', () => { let c = 0; for (let i = 1; i <= 100; i++) c += (String(i).match(/9/g) || []).length; return String(c); }),
  B('c_trip', '甲每小时走 5 千米，乙每小时走 4 千米，乙先走 2 小时后甲出发，甲几小时追上乙？', '8', ['4', '6', '10'], '路程差 4 × 2 = 8 千米，速度差 1：8 小时。', () => String(4 * 2 / (5 - 4)))
],
5: [
  B('c_pigeon', '一个班有 40 名学生，至少有几名学生在同一个月过生日？', '4', ['3', '5', '12'], '40 ÷ 12 = 3……4，至少 3 + 1 = 4 人。', () => String(Math.ceil(40 / 12))),
  B('c_pigeon', '一副扑克牌（去掉大小王）52 张，至少抽几张才能保证有 2 张同花色？', '5', ['4', '13', '14'], '4 种花色，最坏各 1 张，再抽 1 张：5。', () => String(4 + 1)),
  B('c_trip', '一艘船顺水每小时行 24 千米，逆水每小时行 16 千米，水流速度是每小时多少千米？', '4', ['8', '20', '6'], '水速 =（顺水速度 − 逆水速度）÷ 2 = 4。', () => String((24 - 16) / 2)),
  B('c_trip', '甲、乙两人在 400 米环形跑道上同时同地反向而行，甲每秒 6 米，乙每秒 4 米，几秒后第一次相遇？', '40', ['100', '200', '50'], '反向相遇：400 ÷ (6 + 4) = 40（秒）。', () => String(400 / (6 + 4))),
  B('c_comb', '平面上 6 条直线最多把平面分成几部分？', '22', ['12', '16', '21'], '最多部分数 = 1 + (1 + 2 + … + 6) = 22。', () => { let s = 1; for (let i = 1; i <= 6; i++) s += i; return String(s); }),
  B('c_num', '一个三位数，各位数字之和是 12，百位比十位大 1，十位比个位大 1，这个数是多少？', '543', ['345', '453', '444'], '设十位是 x：(x + 1) + x + (x − 1) = 12，x = 4，这个数是 543。', () => { for (let n = 100; n < 1000; n++) { const a = Math.floor(n / 100), b = Math.floor(n / 10) % 10, c = n % 10; if (a + b + c === 12 && a === b + 1 && b === c + 1) return String(n); } }),
  B('c_num', '2 的 100 次方的个位数字是几？', '6', ['2', '4', '8'], '个位按 2、4、8、6 循环，100 ÷ 4 余 0，是 6。', () => { let d = 1; for (let i = 0; i < 100; i++) d = d * 2 % 10; return String(d); }),
  B('c_num', '能同时被 2、3、5 整除的最小三位数是多少？', '120', ['100', '150', '105'], '即 30 的倍数中最小的三位数：120。', () => { for (let n = 100; ; n++) if (n % 30 === 0) return String(n); }),
  B('c_num', '1 × 2 × 3 × … × 20 的积末尾有几个连续的 0？', '4', ['2', '3', '5'], '看因数 5 的个数：5、10、15、20 各一个，共 4 个 0。', () => String(Math.floor(20 / 5) + Math.floor(20 / 25))),
  B('c_surplus', '学校分苹果，每人 4 个多 9 个，每人 6 个少 5 个，共有多少个苹果？', '37', ['30', '42', '33'], '人数 (9 + 5) ÷ 2 = 7，苹果 7 × 4 + 9 = 37（个）。', () => String((9 + 5) / (6 - 4) * 4 + 9)),
  B('c_chick', '买 3 元和 5 元的邮票共 20 张，花了 80 元，5 元的买了几张？', '10', ['12', '8', '6'], '假设全是 3 元 60 元，少 20 元，每张差 2 元：10 张。', () => String((80 - 20 * 3) / (5 - 3))),
  B('c_age', '父亲今年 45 岁，儿子 15 岁，几年后父亲年龄是儿子的 2 倍？', '15', ['10', '20', '30'], '年龄差 30，当儿子 30 岁时父亲 60 岁是 2 倍：30 − 15 = 15 年后。', () => String(30 - 15)),
  B('c_pattern', '找规律：{1/2}，{2/3}，{3/4}，{4/5}，(　)', '{5/6}', ['{5/7}', '{6/7}', '{4/6}'], '分子分母都依次加 1：{5/6}。', () => fraw(5, 6)),
  B('c_pattern', '{1/2} + {1/4} + {1/8} + {1/16} = ?', '{15/16}', ['{4/30}', '{7/8}', '{1/16}'], '1 − {1/16} = {15/16}（每次加上剩下的一半）。', () => fs([[1,2],[1,4],[1,8],[1,16]].reduce((a, b) => fadd(a, b), [0, 1]))),
  B('c_comb', '一个正方体的 6 个面分别涂红、黄、蓝三种颜色，相对的面颜色相同，有几种不同的涂法（旋转后相同算一种）？', '1', ['6', '3', '2'], '三对对面分别是三种颜色，旋转后都相同，只有 1 种。', () => String(1)),
  B('c_pigeon', '任意 13 个人中，至少有几个人的属相相同？', '2', ['1', '3', '13'], '属相有 12 种，13 ÷ 12 = 1……1，至少 1 + 1 = 2 人。', () => String(Math.ceil(13 / 12))),
  B('c_num', '6 和 8 的最小公倍数是多少？', '24', ['48', '12', '2'], '6 = 2 × 3，8 = 2 × 2 × 2，最小公倍数 = 2 × 2 × 2 × 3 = 24。', () => String(lcm(6, 8))),
  B('c_trip', '小明上山每小时 3 千米，下山原路返回每小时 6 千米，上下山的平均速度是每小时多少千米？', '4', ['4.5', '5', '3.5'], '设单程 6 千米：上山 2 小时，下山 1 小时，12 ÷ 3 = 4。', () => String(12 / (6 / 3 + 6 / 6))),
  B('c_quick', '0.125 × 0.25 × 32 = ?', '1', ['0.1', '10', '0.5'], '32 = 8 × 4：(0.125 × 8) × (0.25 × 4) = 1 × 1 = 1。', () => String(Math.round(0.125 * 0.25 * 32 * 1000) / 1000)),
  B('c_count', '一个长方体木块的表面涂成红色，切成 27 个同样的小正方体，三面涂色的有几个？', '8', ['6', '12', '1'], '三面涂色的在 8 个顶点处：8 个。', () => String(8)),
  B('c_count', '同上，27 个小正方体中没有涂色的有几个？', '1', ['0', '6', '8'], '中心的 (3 − 2)³ = 1 个没有涂色。', () => String(Math.pow(3 - 2, 3)))
],
6: [
  B('c_work', '一项工程甲独做 10 天完成，乙独做 15 天完成，两人合作几天完成？', '6', ['12.5', '5', '25'], '1 ÷ ({1/10} + {1/15}) = 1 ÷ {1/6} = 6（天）。', () => String(Math.round(1 / (1 / 10 + 1 / 15)))),
  B('c_work', '一个水池，单开进水管 6 小时注满，单开排水管 8 小时排空，同时打开，几小时注满？', '24', ['14', '2', '48'], '每小时注入 {1/6} − {1/8} = {1/24}，要 24 小时。', () => String(Math.round(1 / (1 / 6 - 1 / 8)))),
  B('c_work', '一件工作甲做 4 天完成一半，乙做 6 天完成一半，两人合作几天完成全部？', '4.8', ['5', '10', '4'], '甲 8 天完成，乙 12 天完成，1 ÷ ({1/8} + {1/12}) = 4.8（天）。', () => String(Math.round(1 / (1 / 8 + 1 / 12) * 10) / 10)),
  B('c_trip', '甲乙两车同时从 A、B 两地相向开出，4 小时相遇，相遇后甲又行 3 小时到 B 地。乙车从 B 到 A 共要几小时？', '{28/3}', ['7', '12', '9'], '相遇前乙行的路甲 3 小时走完，甲 4 小时的路乙要 4 × 4 ÷ 3 = {16/3} 小时，乙共 4 + {16/3} = {28/3} 小时。', () => fs(fadd([4, 1], F(16, 3)))),
  B('c_pigeon', '从 1~10 中至少任选几个数，才能保证其中有两个数的和是 11？', '6', ['5', '7', '11'], '分成 (1,10)(2,9)(3,8)(4,7)(5,6) 5 组，选 6 个必有一组全选。', () => String(5 + 1)),
  B('c_comb', '从 5 名同学中选 3 人参加比赛（不分顺序），有几种选法？', '10', ['60', '15', '20'], '5 × 4 × 3 ÷ (3 × 2 × 1) = 10（种）。', () => String(5 * 4 * 3 / 6)),
  B('c_comb', '用 1、2、3、4 组成没有重复数字的四位偶数，有几个？', '12', ['24', '6', '8'], '个位只能 2 或 4，其余 3 位排列 3 × 2 × 1 = 6：2 × 6 = 12。', () => { let c = 0; for (let n = 1000; n < 10000; n++) { const s = String(n); if ([...s].every(ch => '1234'.includes(ch)) && new Set(s).size === 4 && n % 2 === 0) c++; } return String(c); }),
  B('c_chick', '一次知识竞赛共 20 题，答对一题得 5 分，答错或不答扣 2 分，小红得了 79 分，答对了几题？', '17', ['16', '18', '15'], '全对 100 分，少 21 分，每错一题少 7 分：错 3 题，对 17 题。', () => String(20 - (100 - 79) / 7)),
  B('c_surplus', '一本书，小明每天读 15 页，比计划晚 2 天读完；每天读 20 页，提前 1 天读完。这本书多少页？', '180', ['150', '200', '240'], '设计划 t 天：15(t + 2) = 20(t − 1)，t = 10，页数 180。', () => { for (let t = 1; t < 100; t++) if (15 * (t + 2) === 20 * (t - 1)) return String(15 * (t + 2)); }),
  B('c_num', '一个数的 {2/3} 比它的 {1/2} 多 10，这个数是多少？', '60', ['30', '20', '120'], '{2/3} − {1/2} = {1/6}，10 ÷ {1/6} = 60。', () => String(Math.round(10 / (2 / 3 - 1 / 2)))),
  B('c_num', '商品先提价 10%，再降价 10%，现价是原价的百分之几？', '99%', ['100%', '90%', '101%'], '(1 + 10%) × (1 − 10%) = 99%。', () => Math.round(110 * 90 / 100) + '%'),
  B('c_num', '甲数的 {3/4} 等于乙数的 {3/5}，甲 : 乙 = ?', '4:5', ['5:4', '3:4', '3:5'], '甲 × {3/4} = 乙 × {3/5}，甲 : 乙 = {3/5} : {3/4} = 4 : 5。', () => { const f = fdiv(F(3, 5), F(3, 4)); return f[0] + ':' + f[1]; }),
  B('c_trip', '一辆汽车从甲地到乙地，去时每小时行 60 千米，回时每小时行 40 千米，往返的平均速度是多少？', '48', ['50', '45', '52'], '设路程 120 千米：去 2 小时、回 3 小时，240 ÷ 5 = 48（千米/时）。', () => String(240 / (120 / 60 + 120 / 40))),
  B('c_quick', '1/(1×2) + 1/(2×3) + … + 1/(9×10) = ?', '{9/10}', ['{1/10}', '1', '{10/11}'], '裂项：1/(n×(n+1)) = 1/n − 1/(n+1)，原式 = 1 − {1/10} = {9/10}。', () => { let f = [0, 1]; for (let n = 1; n <= 9; n++) f = fadd(f, F(1, n * (n + 1))); return fs(f); }),
  B('c_comb', '一个圆周上有 8 个点，以这些点为顶点能画多少个三角形？', '56', ['24', '336', '28'], '8 × 7 × 6 ÷ 6 = 56（个）。', () => String(8 * 7 * 6 / 6)),
  B('c_work', '一批零件，甲单独做 12 小时完成，甲乙合做 4 小时完成，乙单独做几小时完成？', '6', ['8', '16', '3'], '乙效率 {1/4} − {1/12} = {1/6}，乙独做 6 小时。', () => String(Math.round(1 / (1 / 4 - 1 / 12)))),
  B('c_pigeon', '口袋里有红、黄、蓝球各 5 个，至少摸几个才能保证有 3 个同色？', '7', ['3', '6', '9'], '最坏每色各 2 个共 6 个，再摸 1 个：7 个。', () => String(3 * 2 + 1)),
  B('c_num', '浓度 20% 的盐水 100 克，加入多少克水后浓度变为 10%？', '100', ['50', '200', '80'], '盐 20 克不变，10% 时盐水 200 克，要加水 100 克。', () => String(20 / 0.1 - 100)),
  B('c_num', '一个圆的半径扩大到原来的 3 倍，面积扩大到原来的几倍？', '9', ['3', '6', '27'], '面积与半径的平方成正比：3² = 9 倍。', () => String(3 * 3)),
  B('c_num', '一个圆柱和一个圆锥体积相等、底面积相等，圆柱高 6 厘米，圆锥高几厘米？', '18', ['2', '6', '12'], '等底等积时，圆锥的高是圆柱的 3 倍：18 厘米。', () => String(6 * 3)),
  B('c_trip', '时钟从 3 点整开始，分针至少再走多少分钟能追上时针？', '{180/11}', ['15', '16', '{165/11}'], '3 点时分针落后 90°，分针每分钟比时针多走 5.5°：90 ÷ 5.5 = {180/11} 分钟。', () => fs(F(90 * 2, 11)))
]
};

// ---------------- 组装：去重 + 补足干扰项 + 打乱 ----------------
// 知识点主题标签：用于地区主题（湖畔=分数/小数，峡谷=几何……）
const TAG = {
  g1_add20: 'calc', g1_add100: 'calc', g1_shape: 'geo', g1_clock: 'measure', g2_mul: 'calc', g2_div: 'calc', g2_len: 'measure', g2_money: 'measure',
  g3_muldiv: 'calc', g3_perim: 'geo', g3_frac: 'frac', g3_time: 'measure', g4_big: 'calc', g4_law: 'calc', g4_dec: 'frac', g4_angle: 'geo', g4_avg: 'logic',
  g5_decmul: 'frac', g5_eq: 'logic', g5_factor: 'logic', g5_fracadd: 'frac', g5_area: 'geo', g5_cuboid: 'geo', g6_fracmul: 'frac', g6_ratio: 'frac', g6_percent: 'frac', g6_circle: 'geo', g6_cyl: 'geo'
};
const TAG_NAME = { calc: '计算', geo: '图形与几何', measure: '测量与单位', frac: '分数与小数', logic: '规律与推理' };
const BAD = /NaN|undefined|Infinity|null|^-|\{-|\{\d+\/0\}|\{0\//;
function nearAlternatives(a) {
  const out = []; const v = valOf(a);
  let m = /^\{(\d+)\/(\d+)\}$/.exec(a);
  if (m) { const n = +m[1], d = +m[2]; [[n + 1, d], [Math.max(1, n - 1), d], [n, d + 1], [d, n], [n + 2, d], [n, d + 2]].forEach(f => out.push(fs(F(f[0], f[1])))); return out; }
  if (v !== null && /^\d+(\.\d+)?%?$/.test(a)) {
    const pct = a.endsWith('%'); const body = pct ? a.slice(0, -1) : a; const dec = (body.split('.')[1] || '').length; const u = Math.pow(10, dec);
    const n = Math.round(+body * u);
    [n + 1, n - 1, n + 10, n * 10, n + 2, n - 10, n + u, n + 5].forEach(x => { if (x > 0) out.push(ds(x, dec) + (pct ? '%' : '')); });
    return out;
  }
  // 通用：把字符串中的某个数字改动一下（适用于"3:4""8时30分""5千克20克""12……3"等）
  const digs = []; a.replace(/\d+/g, (s, i) => { digs.push([s, i]); return s; });
  digs.forEach(([s, i]) => [1, -1, 2, 10].forEach(k => { const nv = +s + k; if (nv >= 0) out.push(a.slice(0, i) + nv + a.slice(i + s.length)); }));
  return out;
}
function assemble(raw, meta) {
  const a = String(raw.a); const choices = [a];
  const ok = s => s !== undefined && s !== null && s !== '' && !BAD.test(String(s)) && choices.every(c => !sameVal(c, String(s)));
  shuffle((raw.d || []).map(String).slice()).forEach(s => { if (choices.length < 4 && ok(s)) choices.push(s); });
  if (choices.length < 4) nearAlternatives(a).forEach(s => { if (choices.length < 4 && ok(s)) choices.push(s); });
  let guard = 0; while (choices.length < 4 && guard++ < 50) { const s = String((valOf(a) || 10) + R(3, 30)); if (ok(s)) choices.push(s); }
  shuffle(choices);
  return { q: raw.q, choices, ans: choices.indexOf(a), answer: a, exp: raw.e, fig: raw.fig || null, kp: meta.kp, kpName: KP[meta.kp].n, grade: meta.grade, comp: !!meta.comp, bank: meta.bank || null, tag: TAG[meta.kp] || 'logic' };
}
function genKP(kp, grade, df) {
  if (KP[kp].c) return assemble(GEN[kp](grade || 3), { kp, grade, comp: true });
  return assemble(GEN[kp](!!df), { kp, grade: KP[kp].g });
}
function genBank(grade, recent) {
  const list = BANK[grade]; let i = R(0, list.length - 1), tries = 0;
  while (recent && recent.indexOf(grade + ':' + i) >= 0 && tries++ < 20) i = R(0, list.length - 1);
  const b = list[i];
  return assemble(b, { kp: b.kp, grade, comp: true, bank: grade + ':' + i });
}
function genComp(grade, recent) {
  if (RNG() < 0.5) return genBank(grade, recent);
  return genKP(pick(COMP_KPS[grade]), grade);
}
function acc(st) { return st && st.n ? st.ok / st.n : 0.6; }
// 自适应：错得多、练得少、符合当前地区主题的知识点出现概率更高
function weightedKP(kps, stats, theme) {
  const w = kps.map(k => { const st = stats && stats[k]; let x = 1 + (1 - acc(st)) * 3; if (!st || st.n < 3) x += 1.5; if (theme && TAG[k] === theme) x += 2.5; return x; });
  let t = RNG() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < kps.length; i++) { t -= w[i]; if (t <= 0) return kps[i]; }
  return kps[kps.length - 1];
}
function diffFor(stats, kp) { const st = stats && stats[kp]; return !!(st && st.n >= 4 && acc(st) >= 0.75); }
// 主入口：opts = { grade, comp(竞赛模式), stats, theme, forceComp, recentBank, kp }
function next(opts) {
  opts = opts || {}; const g = Math.min(6, Math.max(1, opts.grade | 0 || 1));
  if (opts.kp) return genKP(opts.kp, g, diffFor(opts.stats, opts.kp));
  const compRate = opts.forceComp ? 1 : opts.comp ? 0.35 : 0.08;
  if (RNG() < compRate) return genComp(g, opts.recentBank);
  // 非竞赛：以本年级为主，偶尔复习低一个年级
  let kps = GRADE_KPS[g]; if (g > 1 && RNG() < 0.2) kps = GRADE_KPS[g - 1];
  const kp = weightedKP(kps, opts.stats, opts.theme);
  return genKP(kp, g, diffFor(opts.stats, kp));
}
function timeLimit(q) { return q.comp ? 60 : 18 + (q.grade || 1) * 4; }
const API = { next, genKP, genBank, genComp, assemble, timeLimit, KP, TAG, TAG_NAME, GRADE_KPS, COMP_KPS, BANK, GEN, valOf, sameVal, fs, F, setRNG: f => { RNG = f; }, nearAlternatives };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MathQ = API;
})(typeof window !== 'undefined' ? window : this);
