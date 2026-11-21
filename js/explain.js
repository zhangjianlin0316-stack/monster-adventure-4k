// ================== 错题讲解数据：把一道题转换成「动画讲解脚本」 ==================
// Explain.build(q) → { viz: 动画类型, p: 参数, steps: [每一步老师说的话], check: 动画最终算出的答案 }
// 动画类型由 tutor.js 绘制；check 用于自动化测试（必须与题目答案一致）。
(function (root) {
'use strict';
const nums = s => (String(s).match(/\d+(?:\.\d+)?/g) || []).map(Number);
const fr = s => { const m = [...String(s).matchAll(/\{(\d+)\/(\d+)\}/g)]; return m.map(x => [+x[1], +x[2]]); };
const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const fs = (n, d) => { const g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : '{' + n + '/' + d + '}'; };
// 把解析文字拆成若干步（不拆开分数）
function splitExp(e) {
  if (!e) return [];
  const out = []; let cur = '';
  for (const ch of String(e)) { cur += ch; if ('。；！？'.includes(ch) || (ch === '，' && cur.length > 14)) { const s = cur.trim(); if (s) out.push(s); cur = ''; } }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [String(e)];
}
function digits(n) { return String(n).split('').map(Number); }
// 竖式加减（逐位，含进位/退位）
function columnsAddSub(a, b, op) {
  const res = op === '+' ? a + b : a - b; const L = Math.max(String(a).length, String(b).length, String(res).length);
  const da = String(a).padStart(L, '0').split('').map(Number), db = String(b).padStart(L, '0').split('').map(Number);
  const cols = []; let carry = 0; const steps = [];
  const pn = ['个', '十', '百', '千', '万'];
  for (let i = L - 1; i >= 0; i--) {
    const pos = L - 1 - i; let x = da[i], y = db[i], r, c = 0, note;
    if (op === '+') { r = x + y + carry; c = r >= 10 ? 1 : 0; note = pn[pos] + '位：' + x + ' + ' + y + (carry ? ' + 1（进位）' : '') + ' = ' + r + (c ? '，写 ' + (r % 10) + '，向' + pn[pos + 1] + '位进 1' : '，写 ' + r); r %= 10; }
    else { let xx = x - carry; if (xx < y) { c = 1; r = xx + 10 - y; note = pn[pos] + '位：' + xx + ' 不够减 ' + y + '，向' + pn[pos + 1] + '位借 1 当 10，' + (xx + 10) + ' − ' + y + ' = ' + r; } else { r = xx - y; note = pn[pos] + '位：' + xx + ' − ' + y + ' = ' + r; } }
    if (!(i < L - String(Math.max(a, b)).length && x === 0 && y === 0 && r === 0 && !carry)) { cols.push({ pos, r, c }); steps.push(note + '。'); }
    carry = c;
  }
  if (op === '+' && carry) { cols.push({ pos: L, r: 1, c: 0 }); }
  return { cols, steps, res };
}
function columnsMul1(a, b) { // a × 一位数 b
  const da = digits(a).reverse(); let carry = 0; const steps = [], cols = []; const pn = ['个', '十', '百', '千', '万'];
  da.forEach((x, pos) => { const r = x * b + carry; steps.push(pn[pos] + '位：' + x + ' × ' + b + (carry ? ' + ' + carry + '（进位）' : '') + ' = ' + r + (r >= 10 && pos < da.length - 1 ? '，写 ' + (r % 10) + '，进 ' + Math.floor(r / 10) : '') + '。'); cols.push({ pos, r: pos === da.length - 1 ? r : r % 10, c: Math.floor(r / 10) }); carry = Math.floor(r / 10); });
  return { cols, steps, res: a * b };
}
function longDiv(a, b) {
  const ds = digits(a); let rem = 0, qs = ''; const steps = [], rows = [];
  ds.forEach((d, i) => { const cur = rem * 10 + d; const qd = Math.floor(cur / b); if (qs || qd) qs += qd; if (qd || i === ds.length - 1 || qs) { if (cur >= b || qs) { steps.push('看 ' + cur + '：' + cur + ' ÷ ' + b + ' 商 ' + qd + '，' + qd + ' × ' + b + ' = ' + qd * b + '，余 ' + (cur - qd * b) + '。'); rows.push({ i, cur, qd, sub: qd * b, rem: cur - qd * b }); } } rem = cur - qd * b; });
  return { steps, rows, q: Math.floor(a / b), r: a % b };
}
const B = {};
function arith(q) { // 识别 “a op b = ?”
  const m = /^(\d+(?:\.\d+)?) ([+−×÷]) (\d+(?:\.\d+)?) = \?$/.exec(q.q); if (!m) return null; return { a: +m[1], op: m[2], b: +m[3] };
}
function addSub(q) {
  let t = arith(q); let word = false;
  if (!t) { const n = nums(q.q); if (/又得到|一共/.test(q.q) && n.length >= 2) t = { a: n[0], op: '+', b: n[1] }; else if (/送给|还剩/.test(q.q) && n.length >= 2) t = { a: n[0], op: '−', b: n[1] }; word = true; }
  if (!t || (t.op !== '+' && t.op !== '−') || t.a % 1 || t.b % 1) return null;
  const res = t.op === '+' ? t.a + t.b : t.a - t.b;
  if (t.a <= 20 && t.b <= 20 && res <= 20 && res >= 0) {
    const steps = [];
    if (word) steps.push(t.op === '+' ? '“一共”就是把两部分合起来，用加法。' : '“还剩”就是从总数里去掉一部分，用减法。');
    if (t.op === '+') { steps.push('先摆出 ' + t.a + ' 个小圆点。'); if (t.a < 10 && res > 10) { steps.push('凑十法：' + t.a + ' 还差 ' + (10 - t.a) + ' 个就满 10，从 ' + t.b + ' 里拿出 ' + (10 - t.a) + ' 个。'); steps.push('10 再加上剩下的 ' + (t.b - (10 - t.a)) + ' 个，就是 ' + res + '。'); } else steps.push('再放进 ' + t.b + ' 个，一起数一数：' + res + '。'); }
    else { steps.push('先摆出 ' + t.a + ' 个小圆点。'); if (t.a > 10 && t.a - 10 < t.b) { steps.push('破十法：' + t.b + ' 比个位的 ' + (t.a - 10) + ' 多，先从 10 里去掉 ' + t.b + '，剩 ' + (10 - t.b) + '。'); steps.push((10 - t.b) + ' 加上原来的 ' + (t.a - 10) + '，等于 ' + res + '。'); } else steps.push('去掉 ' + t.b + ' 个，还剩 ' + res + ' 个。'); }
    steps.push('所以答案是 ' + res + '。');
    return { viz: 'tenframe', p: { a: t.a, b: t.b, op: t.op }, steps, check: String(res) };
  }
  const c = columnsAddSub(t.a, t.b, t.op);
  return { viz: 'columns', p: { a: t.a, b: t.b, op: t.op === '+' ? '+' : '−', cols: c.cols, res: c.res }, steps: ['列竖式：数位对齐，从个位算起。'].concat(c.steps, ['结果是 ' + c.res + '。']), check: String(c.res) };
}
B.g1_add20 = addSub; B.g1_add100 = addSub;
B.g2_mul = q => {
  let t = arith(q), a, b, res;
  if (t && t.op === '×') { a = t.a; b = t.b; } else { const n = nums(q.q); if (/每/.test(q.q) && n.length >= 2) { a = n[0]; b = n[1]; } else if (/^\(　\) × (\d+) = (\d+)/.test(q.q)) { const m = /^\(　\) × (\d+) = (\d+)/.exec(q.q); return { viz: 'array', p: { r: +m[2] / +m[1], c: +m[1] }, steps: ['想一想：几个 ' + m[1] + ' 是 ' + m[2] + '？', '一排排摆 ' + m[1] + ' 个，摆到 ' + m[2] + ' 个时数一数排数。', '一共 ' + (+m[2] / +m[1]) + ' 排，所以括号里填 ' + (+m[2] / +m[1]) + '。'], check: String(+m[2] / +m[1]) }; } else return null; }
  res = a * b;
  return { viz: 'array', p: { r: b, c: a }, steps: [(t ? a + ' × ' + b + ' 表示 ' + b + ' 个 ' + a + ' 相加。' : '每份 ' + a + '，有 ' + b + ' 份，求一共用乘法。'), '每排摆 ' + a + ' 个，摆 ' + b + ' 排。', '一排一排数：' + Array.from({ length: Math.min(b, 9) }, (_, i) => a * (i + 1)).join('、') + '。', '所以 ' + a + ' × ' + b + ' = ' + res + '。'], check: String(res) };
};
B.g2_div = q => {
  let t = arith(q), a, b;
  if (t && t.op === '÷') { a = t.a; b = t.b; } else { const n = nums(q.q); if (/平均分/.test(q.q) && n.length >= 2) { a = n[0]; b = n[1]; } else return null; }
  const r = a / b; if (r % 1) return null;
  return { viz: 'group', p: { n: a, g: b }, steps: ['把 ' + a + ' 个平均分成 ' + b + ' 份。', '像发牌一样，一轮一轮地每份发 1 个。', '发完后每份都是 ' + r + ' 个。', '想口诀：' + b + ' × ' + r + ' = ' + a + '，所以 ' + a + ' ÷ ' + b + ' = ' + r + '。'], check: String(r) };
};
B.g1_clock = q => {
  if (!q.fig || q.fig.type !== 'clock') return null; const { h, m } = q.fig;
  return { viz: 'clock', p: { h, m }, steps: ['先看短针（时针），它告诉我们是几时。', '时针指向' + (m ? ' ' + h + ' 和 ' + (h % 12 + 1) + ' 之间，过了 ' + h + ' 时' : ' ' + h) + '。', '再看长针（分针），它走一大格是 5 分钟。', '分针指向 ' + (m ? m / 5 : 12) + '，就是 ' + m + ' 分。', '所以是 ' + q.answer + '。'], check: q.answer };
};
B.g2_money = q => {
  const toJ = s => { let j = 0; const y = /(\d+)元/.exec(s), k = /(\d+)角/.exec(s); if (y) j += +y[1] * 10; if (k) j += +k[1]; return j; };
  const parts = q.q.match(/\d+元(?:\d+角)?|\d+角/g) || [];
  if (/找回/.test(q.q) && parts.length >= 2) { const p = toJ(parts[0]), pay = toJ(parts[1]); return { viz: 'coins', p: { mode: 'change', price: p, pay }, steps: ['付的钱 − 价钱 = 找回的钱。', '把 ' + parts[1] + ' 换成 ' + pay + ' 个 1 角。', '拿走价钱 ' + parts[0] + '（' + p + ' 角）。', '还剩 ' + (pay - p) + ' 角，也就是 ' + yuan(pay - p) + '。'], check: yuan(pay - p) }; }
  if (/一共/.test(q.q) && parts.length >= 2) { const a = toJ(parts[0]), b = toJ(parts[1]); return { viz: 'coins', p: { mode: 'sum', a, b }, steps: ['求一共要多少钱，用加法。', '元和元相加，角和角相加。', '角满 10 个就换成 1 元。', '一共 ' + yuan(a + b) + '。'], check: yuan(a + b) }; }
  return null;
};
function yuan(j) { const y = Math.floor(j / 10), k = j % 10; return ((y ? y + '元' : '') + (k ? k + '角' : '')) || '0元'; }
B.g3_muldiv = q => {
  const t = arith(q); if (!t) return null;
  if (t.op === '×' && t.b < 10) { const c = columnsMul1(t.a, t.b); return { viz: 'columns', p: { a: t.a, b: t.b, op: '×', cols: c.cols, res: c.res }, steps: ['列竖式：用 ' + t.b + ' 依次去乘每一位。'].concat(c.steps, ['结果是 ' + c.res + '。']), check: String(c.res) }; }
  if (t.op === '×') { const b1 = t.b % 10, b10 = t.b - b1; return { viz: 'mulsplit', p: { a: t.a, b: t.b }, steps: ['把 ' + t.b + ' 拆成 ' + b10 + ' 和 ' + b1 + '。', t.a + ' × ' + b1 + ' = ' + t.a * b1 + '。', t.a + ' × ' + b10 + ' = ' + t.a * b10 + '。', '合起来：' + t.a * b1 + ' + ' + t.a * b10 + ' = ' + t.a * t.b + '。'], check: String(t.a * t.b) }; }
  const d = longDiv(t.a, t.b); const ans = d.r ? d.q + '……' + d.r : String(d.q);
  return { viz: 'longdiv', p: { a: t.a, b: t.b, rows: d.rows, q: d.q, r: d.r }, steps: ['列除法竖式，从最高位开始除。'].concat(d.steps, ['商是 ' + d.q + (d.r ? '，余数是 ' + d.r : '') + '。']), check: ans };
};
B.g3_time = q => {
  const m = /从 (\d+):(\d+) 到 (\d+):(\d+)/.exec(q.q); if (!m) return null;
  const s = +m[1] * 60 + +m[2], e = +m[3] * 60 + +m[4]; const toH = (+m[1] + 1) * 60; const hops = [];
  if (toH < e) { hops.push({ from: s, to: toH }); hops.push({ from: toH, to: e }); } else hops.push({ from: s, to: e });
  const steps = ['把时间画在一条时间轴上，一段一段地跳。'];
  hops.forEach(h => steps.push('从 ' + Math.floor(h.from / 60) + ':' + String(h.from % 60).padStart(2, '0') + ' 跳到 ' + Math.floor(h.to / 60) + ':' + String(h.to % 60).padStart(2, '0') + '，经过 ' + (h.to - h.from) + ' 分钟。'));
  steps.push('合起来：' + hops.map(h => h.to - h.from).join(' + ') + ' = ' + (e - s) + ' 分钟。');
  return { viz: 'timeline', p: { s, e, hops }, steps, check: String(e - s) };
};
B.g3_frac = q => {
  if (q.fig && q.fig.type === 'pie') return { viz: 'pie', p: { mode: 'show', n: q.fig.n, k: q.fig.k }, steps: ['把整个圆平均分成了 ' + q.fig.n + ' 份，分母就是 ' + q.fig.n + '。', '涂色的有 ' + q.fig.k + ' 份，分子就是 ' + q.fig.k + '。', '所以涂色部分是 {' + q.fig.k + '/' + q.fig.n + '}。'], check: '{' + q.fig.k + '/' + q.fig.n + '}' };
  const f = fr(q.q);
  if (f.length === 2 && f[0][1] === f[1][1] && /[+−] /.test(q.q)) { const op = /\} \+ \{/.test(q.q) ? '+' : '−'; const n = f[0][1], k = op === '+' ? f[0][0] + f[1][0] : f[0][0] - f[1][0]; return { viz: 'pie', p: { mode: op, n, a: f[0][0], b: f[1][0] }, steps: ['两个分数分母都是 ' + n + '，表示圆都分成了 ' + n + ' 份。', '先涂上 ' + f[0][0] + ' 份。', (op === '+' ? '再涂上 ' : '再擦去 ') + f[1][0] + ' 份。', '分母不变，分子' + (op === '+' ? '相加' : '相减') + '：现在有 ' + k + ' 份，就是 ' + fs(k, n) + '。'], check: fs(k, n) }; }
  if (f.length === 2 && /〇/.test(q.q)) { const [a, b] = f; const va = a[0] / a[1], vb = b[0] / b[1]; const sym = va > vb ? '>' : va < vb ? '<' : '='; return { viz: 'pie', p: { mode: 'cmp', f: [a, b] }, steps: ['把两个分数都画成圆，比一比涂色部分的大小。', '{' + a[0] + '/' + a[1] + '} 涂了 ' + a[0] + ' 份（共 ' + a[1] + ' 份）。', '{' + b[0] + '/' + b[1] + '} 涂了 ' + b[0] + ' 份（共 ' + b[1] + ' 份）。', '涂色多的分数大，所以填“' + sym + '”。'], check: sym }; }
  return null;
};
B.g5_fracadd = q => {
  const f = fr(q.q); if (f.length !== 2 || !/\} [+−] \{/.test(q.q)) return null;
  const op = /\} \+ \{/.test(q.q) ? '+' : '−'; const L = lcm(f[0][1], f[1][1]); const a = f[0][0] * L / f[0][1], b = f[1][0] * L / f[1][1]; const k = op === '+' ? a + b : a - b;
  return { viz: 'fracbar', p: { f, L, op }, steps: ['分母不同，不能直接相加减，要先通分。', f[0][1] + ' 和 ' + f[1][1] + ' 的最小公倍数是 ' + L + '，把两条纸带都切成 ' + L + ' 小格。', '{' + f[0][0] + '/' + f[0][1] + '} = {' + a + '/' + L + '}，{' + f[1][0] + '/' + f[1][1] + '} = {' + b + '/' + L + '}。', '分子' + (op === '+' ? '相加' : '相减') + '：{' + a + '/' + L + '} ' + op + ' {' + b + '/' + L + '} = {' + k + '/' + L + '}' + (fs(k, L) !== '{' + k + '/' + L + '}' ? ' = ' + fs(k, L) : '') + '。'], check: fs(k, L) };
};
B.g6_fracmul = q => {
  const m = /(\d+) ?千克，用去了 \{(\d+)\/(\d+)\}/.exec(q.q); if (!m) return null; const T = +m[1], a = +m[2], b = +m[3]; const r = T * a / b; if (r % 1) return null;
  return { viz: 'fracbar', p: { qty: T, a, b }, steps: ['画一条线段表示全部 ' + T + ' 千克，把它平均分成 ' + b + ' 份。', '每一份是 ' + T + ' ÷ ' + b + ' = ' + T / b + '（千克）。', '用去 ' + a + ' 份：' + T / b + ' × ' + a + ' = ' + r + '（千克）。', '也就是求 ' + T + ' 的 {' + a + '/' + b + '}：' + T + ' × {' + a + '/' + b + '} = ' + r + '。'], check: String(r) };
};
B.g3_perim = q => {
  if (!q.fig || q.fig.type !== 'rect') return null; const { w, h, u } = q.fig; const P = 2 * (w + h);
  return { viz: 'perim', p: { w, h, u }, steps: ['周长就是绕图形一圈的长度，小蚂蚁沿着边走一圈。', '长 ' + w + ' + 宽 ' + h + ' = ' + (w + h) + '，这是半圈。', '一圈有两个长、两个宽：(' + w + ' + ' + h + ') × 2 = ' + P + '。', '周长是 ' + P + ' ' + u + '。'], check: String(P) };
};
B.g5_area = q => {
  const f = q.fig; if (!f) return null;
  if (f.type === 'para') return { viz: 'area', p: f, steps: ['沿着高剪下一个三角形。', '把它平移到另一边，拼成一个长方形。', '长方形的长就是底 ' + f.b + '，宽就是高 ' + f.h + '。', '面积 = 底 × 高 = ' + f.b + ' × ' + f.h + ' = ' + f.b * f.h + '。'], check: String(f.b * f.h) };
  if (f.type === 'trih') return { viz: 'area', p: f, steps: ['再拿一个一模一样的三角形。', '两个三角形能拼成一个平行四边形。', '平行四边形面积 = ' + f.b + ' × ' + f.h + ' = ' + f.b * f.h + '。', '三角形是它的一半：' + f.b * f.h + ' ÷ 2 = ' + f.b * f.h / 2 + '。'], check: String(f.b * f.h / 2) };
  if (f.type === 'trap') return { viz: 'area', p: f, steps: ['再拿一个一模一样的梯形，倒过来拼在旁边。', '拼成了一个平行四边形，底是 ' + f.a + ' + ' + f.b + ' = ' + (f.a + f.b) + '。', '平行四边形面积 = ' + (f.a + f.b) + ' × ' + f.h + ' = ' + (f.a + f.b) * f.h + '。', '梯形是它的一半：' + (f.a + f.b) * f.h + ' ÷ 2 = ' + (f.a + f.b) * f.h / 2 + '。'], check: String((f.a + f.b) * f.h / 2) };
  if (f.type === 'rect') return { viz: 'grid', p: f, steps: ['用 1 个单位的小正方形铺满长方形。', '每行铺 ' + f.w + ' 个，铺了 ' + f.h + ' 行。', '面积 = 长 × 宽 = ' + f.w + ' × ' + f.h + ' = ' + f.w * f.h + '。'], check: String(f.w * f.h) };
  return null;
};
B.g5_cuboid = q => {
  const f = q.fig; if (!f || f.type !== 'box') return null;
  if (/体积/.test(q.q)) return { viz: 'box', p: Object.assign({ mode: 'v' }, f), steps: ['体积就是能装下多少个 1 立方单位的小正方体。', '底面一层：' + f.a + ' × ' + f.b + ' = ' + f.a * f.b + ' 个。', '一共叠 ' + f.c + ' 层。', '体积 = ' + f.a * f.b + ' × ' + f.c + ' = ' + f.a * f.b * f.c + '。'], check: String(f.a * f.b * f.c) };
  if (/表面积/.test(q.q)) { const s = 2 * (f.a * f.b + f.a * f.c + f.b * f.c); return { viz: 'box', p: Object.assign({ mode: 's' }, f), steps: ['表面积 = 6 个面的面积之和，相对的两个面一样大。', '上下：' + f.a + ' × ' + f.b + ' × 2 = ' + 2 * f.a * f.b + '。', '前后：' + f.a + ' × ' + f.c + ' × 2 = ' + 2 * f.a * f.c + '；左右：' + f.b + ' × ' + f.c + ' × 2 = ' + 2 * f.b * f.c + '。', '合起来是 ' + s + '。'], check: String(s) }; }
  return null;
};
B.g4_angle = q => {
  const m = /一个(直角|平角)被分成两个角，其中一个是 (\d+)°/.exec(q.q); if (!m) return null; const T = m[1] === '直角' ? 90 : 180, a = +m[2];
  return { viz: 'angle', p: { T, a }, steps: [m[1] + '是 ' + T + '°。', '其中一个角是 ' + a + '°。', '另一个角 = ' + T + '° − ' + a + '° = ' + (T - a) + '°。'], check: String(T - a) };
};
B.g4_avg = q => {
  const m = /平均数：([\d、]+)/.exec(q.q); if (!m) return null; const arr = m[1].split('、').map(Number); const s = arr.reduce((a, b) => a + b, 0), av = s / arr.length; if (av % 1) return null;
  return { viz: 'avg', p: { arr, av }, steps: ['把每个数画成一根柱子。', '“移多补少”：把高的柱子多出来的部分，补给矮的柱子。', '先求总数：' + arr.join(' + ') + ' = ' + s + '。', '再平均分：' + s + ' ÷ ' + arr.length + ' = ' + av + '，所有柱子一样高了！'], check: String(av) };
};
B.g5_eq = q => {
  let m, a = 1, b = 0, op = '+', c;
  if ((m = /(\d*)x ([+−]) (\d+) = (\d+)/.exec(q.q))) { a = m[1] ? +m[1] : 1; op = m[2]; b = +m[3]; c = +m[4]; }
  else if ((m = /(\d+)x = (\d+)/.exec(q.q))) { a = +m[1]; c = +m[2]; }
  else if ((m = /一个数的 (\d+) 倍再(加上|减去) (\d+) 等于 (\d+)/.exec(q.q))) { a = +m[1]; op = m[2] === '加上' ? '+' : '−'; b = +m[3]; c = +m[4]; }
  else if ((m = /x − (\d+) = (\d+)/.exec(q.q))) { op = '−'; b = +m[1]; c = +m[2]; }
  else return null;
  const mid = op === '+' ? c - b : c + b, x = mid / a; if (x % 1) return null;
  const L = (a > 1 ? a : '') + 'x' + (b ? ' ' + op + ' ' + b : '');
  const steps = ['方程就像一架天平：左边 ' + L + '，右边 ' + c + '，两边一样重。'];
  if (b) steps.push('两边同时' + (op === '+' ? '减去 ' : '加上 ') + b + '，天平还是平的：' + (a > 1 ? a : '') + 'x = ' + mid + '。');
  if (a > 1) steps.push('两边同时除以 ' + a + '：x = ' + mid + ' ÷ ' + a + ' = ' + x + '。');
  steps.push('检验：把 x = ' + x + ' 代回去，左边正好等于 ' + c + '。');
  return { viz: 'balance', p: { a, b, op, c, x, mid }, steps, check: String(x) };
};
B.g6_ratio = q => {
  const m = /把 (\d+) 个苹果按 (\d+):(\d+) 分给甲、乙，(甲|乙)分到/.exec(q.q); if (!m) return null; const T = +m[1], a = +m[2], b = +m[3]; const per = T / (a + b); if (per % 1) return null; const r = (m[4] === '甲' ? a : b) * per;
  return { viz: 'ratio', p: { T, a, b, who: m[4] }, steps: ['按 ' + a + ':' + b + ' 分，就是甲 ' + a + ' 份、乙 ' + b + ' 份。', '一共 ' + a + ' + ' + b + ' = ' + (a + b) + ' 份。', '每份是 ' + T + ' ÷ ' + (a + b) + ' = ' + per + ' 个。', m[4] + '有 ' + (m[4] === '甲' ? a : b) + ' 份：' + per + ' × ' + (m[4] === '甲' ? a : b) + ' = ' + r + ' 个。'], check: String(r) };
};
B.g6_percent = q => {
  const m = /^(\d+) 的 (\d+)% 是多少/.exec(q.q); if (!m) return null; const T = +m[1], p = +m[2]; const r = T * p / 100;
  return { viz: 'percent', p: { T, p }, steps: ['百分数表示“每 100 份里占几份”。把整体画成 100 个小格。', p + '% 就是涂上其中的 ' + p + ' 格。', '每一格代表 ' + T + ' ÷ 100 = ' + T / 100 + '。', T + ' × ' + p + '% = ' + r + '。'], check: String(r) };
};
const pi = v => String(Math.round(v * 100) / 100);
B.g6_circle = q => {
  const f = q.fig; if (!f) return null;
  if (f.type === 'circle' && /面积/.test(q.q)) { const r = f.r, A = 3.14 * r * r; return { viz: 'circle', p: { r, mode: 'area', show: f.show }, steps: [(f.show === 'd' ? '直径是 ' + 2 * r + '，半径 = 直径 ÷ 2 = ' + r + '。' : '半径是 ' + r + '。'), '把圆切成很多小扇形，拼起来近似一个长方形。', '长方形的长是半个周长 πr，宽是半径 r，所以 S = πr²。', 'S = 3.14 × ' + r + ' × ' + r + ' = ' + pi(A) + '。'], check: pi(A) }; }
  if (f.type === 'circle' && /周长/.test(q.q)) { const r = f.r, C = 2 * 3.14 * r; return { viz: 'circle', p: { r, mode: 'perim', show: f.show }, steps: ['把圆滚一圈，滚过的长度就是周长。', '周长大约是直径的 3.14 倍：C = πd = 2πr。', 'C = 2 × 3.14 × ' + r + ' = ' + pi(C) + '。'], check: pi(C) }; }
  if (f.type === 'ring') { const A = 3.14 * (f.R * f.R - f.r * f.r); return { viz: 'circle', p: { r: f.R, r2: f.r, mode: 'ring' }, steps: ['圆环 = 大圆 − 小圆。', '大圆：3.14 × ' + f.R + ' × ' + f.R + ' = ' + pi(3.14 * f.R * f.R) + '。', '小圆：3.14 × ' + f.r + ' × ' + f.r + ' = ' + pi(3.14 * f.r * f.r) + '。', '相减：' + pi(A) + '。'], check: pi(A) }; }
  return null;
};
B.g6_cyl = q => {
  const f = q.fig; if (!f) return null; const base = 3.14 * f.r * f.r;
  if (f.type === 'cyl' && /侧面积/.test(q.q)) { const S = 2 * 3.14 * f.r * f.h; return { viz: 'cyl', p: Object.assign({ mode: 'side' }, f), steps: ['把圆柱的侧面沿着高剪开、展开。', '展开后是一个长方形：长是底面周长，宽是高。', '底面周长 = 2 × 3.14 × ' + f.r + ' = ' + pi(2 * 3.14 * f.r) + '。', '侧面积 = ' + pi(2 * 3.14 * f.r) + ' × ' + f.h + ' = ' + pi(S) + '。'], check: pi(S) }; }
  if (f.type === 'cyl' && /体积/.test(q.q)) return { viz: 'cyl', p: Object.assign({ mode: 'v' }, f), steps: ['圆柱体积 = 底面积 × 高，就像把一张张圆片叠起来。', '底面积 = 3.14 × ' + f.r + ' × ' + f.r + ' = ' + pi(base) + '。', '叠 ' + f.h + ' 层高：' + pi(base) + ' × ' + f.h + ' = ' + pi(base * f.h) + '。'], check: pi(base * f.h) };
  if (f.type === 'cone' && /体积/.test(q.q)) return { viz: 'cyl', p: Object.assign({ mode: 'cone' }, f), steps: ['等底等高的圆锥，倒 3 次沙子正好装满圆柱。', '所以圆锥体积 = {1/3} × 底面积 × 高。', '底面积 = 3.14 × ' + f.r + ' × ' + f.r + ' = ' + pi(base) + '。', 'V = {1/3} × ' + pi(base) + ' × ' + f.h + ' = ' + pi(base * f.h / 3) + '。'], check: pi(base * f.h / 3) };
  return null;
};
B.c_chick = q => {
  const m = /共有 (\d+) 个头，(\d+) 条腿，(兔|鸡)有多少只/.exec(q.q); if (!m) return null; const H = +m[1], L = +m[2]; const rab = (L - 2 * H) / 2, ch = H - rab; if (rab % 1 || rab < 0 || ch < 0) return null;
  return { viz: 'chick', p: { H, L, rab, ch, ask: m[3] }, steps: ['假设法：先假设笼子里 ' + H + ' 只全是鸡。', '每只鸡 2 条腿，一共 ' + H + ' × 2 = ' + 2 * H + ' 条腿。', '实际有 ' + L + ' 条，少了 ' + L + ' − ' + 2 * H + ' = ' + (L - 2 * H) + ' 条。', '把一只鸡换成兔，就多 2 条腿：' + (L - 2 * H) + ' ÷ 2 = ' + rab + '，有 ' + rab + ' 只兔。', '鸡有 ' + H + ' − ' + rab + ' = ' + ch + ' 只。所以' + m[3] + '有 ' + (m[3] === '兔' ? rab : ch) + ' 只。'], check: String(m[3] === '兔' ? rab : ch) };
};
B.c_sumdiff = q => {
  const m = /和是 (\d+)，差是 (\d+)，较(大|小)的数/.exec(q.q); if (!m) return null; const S = +m[1], D = +m[2]; const big = (S + D) / 2, small = (S - D) / 2;
  return { viz: 'segment', p: { mode: 'sumdiff', S, D, big, small, ask: m[3] }, steps: ['画线段图：大数的线段比小数长 ' + D + '。', '两条线段合起来是和 ' + S + '。', m[3] === '大' ? '给小数补上 ' + D + '，就变成两个大数：(' + S + ' + ' + D + ') ÷ 2 = ' + big + '。' : '把大数多出的 ' + D + ' 去掉，就变成两个小数：(' + S + ' − ' + D + ') ÷ 2 = ' + small + '。', '所以较' + m[3] + '的数是 ' + (m[3] === '大' ? big : small) + '。'], check: String(m[3] === '大' ? big : small) };
};
B.c_summul = q => {
  let m = /甲数是乙数的 (\d+) 倍，两数的和是 (\d+)，(甲|乙)数是多少/.exec(q.q), k, S, D, small;
  if (m) { k = +m[1]; S = +m[2]; small = S / (k + 1); if (small % 1) return null; const r = m[3] === '乙' ? small : small * k; return { viz: 'segment', p: { mode: 'summul', k, S, small, ask: m[3] }, steps: ['画线段图：把乙数看作 1 份，甲数就是 ' + k + ' 份。', '和 ' + S + ' 一共是 ' + k + ' + 1 = ' + (k + 1) + ' 份。', '1 份 = ' + S + ' ÷ ' + (k + 1) + ' = ' + small + '，这就是乙数。', m[3] + '数是 ' + r + '。'], check: String(r) }; }
  m = /甲数是乙数的 (\d+) 倍，甲比乙多 (\d+)，(甲|乙)数是多少/.exec(q.q);
  if (m) { k = +m[1]; D = +m[2]; small = D / (k - 1); if (small % 1) return null; const r = m[3] === '乙' ? small : small * k; return { viz: 'segment', p: { mode: 'diffmul', k, D, small, ask: m[3] }, steps: ['画线段图：把乙数看作 1 份，甲数是 ' + k + ' 份。', '甲比乙多 ' + k + ' − 1 = ' + (k - 1) + ' 份，正好是 ' + D + '。', '1 份 = ' + D + ' ÷ ' + (k - 1) + ' = ' + small + '，这就是乙数。', m[3] + '数是 ' + r + '。'], check: String(r) }; }
  return null;
};
B.c_age = q => {
  const m = /爸爸比儿子大 (\d+) 岁，今年爸爸的年龄是儿子的 (\d+) 倍，儿子今年几岁/.exec(q.q); if (!m) return null; const D = +m[1], k = +m[2], s = D / (k - 1); if (s % 1) return null;
  return { viz: 'segment', p: { mode: 'diffmul', k, D, small: s, ask: '乙', labels: ['爸爸', '儿子'] }, steps: ['画线段图：儿子的年龄看作 1 份，爸爸是 ' + k + ' 份。', '年龄差永远不变，爸爸比儿子多 ' + (k - 1) + ' 份，就是 ' + D + ' 岁。', '1 份 = ' + D + ' ÷ ' + (k - 1) + ' = ' + s + '。', '儿子今年 ' + s + ' 岁。'], check: String(s) };
};
B.c_trip = q => {
  let m = /相距 (\d+) 千米的两地同时相向开出，甲每小时行 (\d+) 千米，乙每小时行 (\d+) 千米/.exec(q.q);
  if (m) { const D = +m[1], a = +m[2], b = +m[3], t = D / (a + b); return { viz: 'trip', p: { mode: 'meet', D, a, b, t }, steps: ['两车面对面开，每小时一共靠近 ' + a + ' + ' + b + ' = ' + (a + b) + ' 千米（速度和）。', '要走完的总路程是 ' + D + ' 千米。', '相遇时间 = 路程 ÷ 速度和 = ' + D + ' ÷ ' + (a + b) + ' = ' + t + ' 小时。'], check: String(t) }; }
  m = /甲车在乙车前方 (\d+) 千米，乙车每小时行 (\d+) 千米，甲车每小时行 (\d+) 千米/.exec(q.q);
  if (m) { const D = +m[1], b = +m[2], a = +m[3], t = D / (b - a); return { viz: 'trip', p: { mode: 'chase', D, a, b, t }, steps: ['乙在后面追，每小时比甲多走 ' + b + ' − ' + a + ' = ' + (b - a) + ' 千米（速度差）。', '一开始相差 ' + D + ' 千米。', '追上时间 = 路程差 ÷ 速度差 = ' + D + ' ÷ ' + (b - a) + ' = ' + t + ' 小时。'], check: String(t) }; }
  m = /火车长 (\d+) 米，每秒行 (\d+) 米，完全通过一座桥用了 (\d+) 秒/.exec(q.q);
  if (m) { const Lt = +m[1], v = +m[2], t = +m[3]; const tot = v * t; return { viz: 'trip', p: { mode: 'train', Lt, v, t, bridge: tot - Lt }, steps: ['“完全通过”：从车头上桥，到车尾离开桥。', '火车走过的路程 = 桥长 + 车长。', '路程 = ' + v + ' × ' + t + ' = ' + tot + ' 米。', '桥长 = ' + tot + ' − ' + Lt + ' = ' + (tot - Lt) + ' 米。'], check: String(tot - Lt) }; }
  return null;
};
B.c_tree = q => {
  const m = /长 (\d+) 米的小路一边植树，每隔 (\d+) 米种一棵，两端都种/.exec(q.q); if (!m) return null; const L = +m[1], d = +m[2], n = L / d + 1;
  return { viz: 'trees', p: { L, d }, steps: ['先算有几个间隔：' + L + ' ÷ ' + d + ' = ' + L / d + ' 个间隔。', '画出来看看：两端都种树时，树比间隔多 1 棵。', '棵数 = ' + L / d + ' + 1 = ' + n + ' 棵。'], check: String(n) };
};
B.c_pigeon = q => {
  const m = /把 (\d+) 本书放进 (\d+) 个抽屉/.exec(q.q); if (!m) return null; const n = +m[1], k = +m[2]; const r = Math.ceil(n / k);
  return { viz: 'pigeon', p: { n, k }, steps: ['要让每个抽屉尽量少，就要尽量平均地放。', '一轮一轮放：' + n + ' ÷ ' + k + ' = ' + Math.floor(n / k) + (n % k ? ' …… ' + n % k : '') + '。', n % k ? '每个抽屉先放 ' + Math.floor(n / k) + ' 本，剩下的 ' + n % k + ' 本不管放哪，都会让某个抽屉变成 ' + r + ' 本。' : '正好每个抽屉 ' + r + ' 本。', '所以总有一个抽屉至少放 ' + r + ' 本。'], check: String(r) };
};
B.c_comb = q => {
  const m = /(\d+) 个小朋友每两人握一次手|(\d+) 支球队进行单循环比赛/.exec(q.q); if (!m) return null; const n = +(m[1] || m[2]); const r = n * (n - 1) / 2;
  return { viz: 'handshake', p: { n }, steps: ['把每个' + (m[1] ? '人' : '队') + '画成一个点，每两点连一条线。', '第 1 个点连出 ' + (n - 1) + ' 条，第 2 个点再连新的 ' + (n - 2) + ' 条……', '一共 ' + Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ') + ' = ' + r + '。'], check: String(r) };
};
B.c_queue = q => {
  const m = /前面有 (\d+) 人，后面有 (\d+) 人/.exec(q.q); if (!m) return null; const a = +m[1], b = +m[2];
  return { viz: 'queue', p: { a, b }, steps: ['画一排小人，中间那个是小亮。', '前面 ' + a + ' 人，后面 ' + b + ' 人。', '别忘了把小亮自己也算上：' + a + ' + ' + b + ' + 1 = ' + (a + b + 1) + ' 人。'], check: String(a + b + 1) };
};
B.c_pattern = q => {
  const m = /找规律填数：([\d，]+)，\(　\)/.exec(q.q); if (!m) return null; const arr = m[1].split('，').map(Number);
  const d1 = arr.slice(1).map((v, i) => v - arr[i]);
  return { viz: 'pattern', p: { arr, ans: q.answer }, steps: ['观察相邻两个数的变化，把差写在下面。', '差分别是：' + d1.join('、') + '。', '找到变化的规律，就能推出下一个数。', '下一个数是 ' + q.answer + '。'].concat(splitExp(q.exp).slice(0, 2)), check: q.answer };
};
function build(q) {
  let r = null;
  try { if (B[q.kp]) r = B[q.kp](q); } catch (e) { r = null; }
  if (!r) {
    const st = splitExp(q.exp);
    r = { viz: 'steps', p: { fig: q.fig || null }, steps: ['我们一起来读题，找出关键的数。'].concat(st, ['所以正确答案是 ' + q.answer + '。']), check: q.answer };
  }
  r.kp = q.kp; r.answer = q.answer;
  return r;
}
const API = { build, splitExp, VIZ_KPS: Object.keys(B) };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Explain = API;
})(typeof window !== 'undefined' ? window : this);
