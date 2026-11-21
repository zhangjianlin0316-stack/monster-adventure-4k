// 数学题库自动化测试：node tests/mathq.test.js
const M = require('../js/mathq.js');
let fail = 0, total = 0; const errs = {};
function bad(kp, msg, q) { fail++; errs[kp] = errs[kp] || []; if (errs[kp].length < 5) errs[kp].push(msg + ' :: ' + q.q + ' => ' + JSON.stringify(q.choices) + ' ans=' + q.answer); }
// —— 独立的精确分数求值器（不复用生成器代码）——
const g = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const k = g(n, d) || 1; return [n / k, d / k]; };
const ops = { '+': (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]), '−': (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), '×': (a, b) => fr(a[0] * b[0], a[1] * b[1]), '÷': (a, b) => fr(a[0] * b[1], a[1] * b[0]) };
function num(s) { const m = /^\{(\d+)\/(\d+)\}$/.exec(s); if (m) return fr(+m[1], +m[2]); const p = (s.split('.')[1] || '').length; return fr(Math.round(+s * 10 ** p), 10 ** p); }
function evalExpr(str) {
  const toks = str.match(/\{\d+\/\d+\}|\d+(?:\.\d+)?|[+−×÷()]/g); if (!toks) return null; let i = 0;
  const prim = () => { const t = toks[i++]; if (t === '(') { const v = add(); i++; return v; } return num(t); };
  const mul = () => { let v = prim(); while (toks[i] === '×' || toks[i] === '÷') { const o = toks[i++]; v = ops[o](v, prim()); } return v; };
  const add = () => { let v = mul(); while (toks[i] === '+' || toks[i] === '−') { const o = toks[i++]; v = ops[o](v, mul()); } return v; };
  const v = add(); return i === toks.length ? v : null;
}
const eqv = (s, f) => { const v = M.valOf(s); return v !== null && Math.abs(v - f[0] / f[1]) < 1e-9; };
// 针对各类题型的独立验算（返回 true/false；返回 null 表示该题型不在此验算范围内）
function verify(q) {
  const t = q.q, a = q.answer; let m;
  if ((m = /^(\d+) ÷ (\d+) = \?$/.exec(t)) && a.includes('……')) { const [qq, r] = a.split('……').map(Number); return qq * m[2] + r === +m[1] && r < +m[2] && r > 0; }
  if ((m = /^([\d.{}\/+−×÷() ]+) = \?$/.exec(t))) { const f = evalExpr(m[1]); return f ? eqv(a, f) : null; }
  if ((m = /^速算：([\d ×]+) = \?$/.exec(t)) || (m = /^巧算：([\d +]+) = \?$/.exec(t))) return eqv(a, evalExpr(m[1]));
  if ((m = /^计算：1 \+ 2 \+ 3 \+ … \+ (\d+) = \?$/.exec(t))) return +a === m[1] * (+m[1] + 1) / 2;
  if ((m = /^(\d+) ÷ (\d+) = \?$/.exec(t)) && a.includes('……')) { const [qq, r] = a.split('……').map(Number); return qq * m[2] + r === +m[1] && r < +m[2]; }
  if ((m = /^解方程：x \+ (\d+) = (\d+)/.exec(t))) return +a + +m[1] === +m[2];
  if ((m = /^解方程：(\d+)x = (\d+)/.exec(t))) return +a * m[1] === +m[2];
  if ((m = /^解方程：(\d+)x \+ (\d+) = (\d+)/.exec(t))) return +a * m[1] + +m[2] === +m[3];
  if ((m = /^\(　\) × (\d+) = (\d+)$/.exec(t))) return +a * m[1] === +m[2];
  if ((m = /^(\d+) 米 = \(　\) 厘米$/.exec(t))) return +a === m[1] * 100;
  if ((m = /^(\d+) 时 = \(　\) 分$/.exec(t))) return +a === m[1] * 60;
  if ((m = /^(\d+) 公顷/.exec(t))) return +a === m[1] * 10000;
  if ((m = /长方形的长是 (\d+) 厘米，宽是 (\d+) 厘米，周长/.exec(t))) return +a === 2 * (+m[1] + +m[2]);
  if ((m = /正方形的边长是 (\d+) 米，它的周长/.exec(t))) return +a === 4 * m[1];
  if ((m = /长方体长 (\d+) 厘米、宽 (\d+) 厘米、高 (\d+) 厘米，体积/.exec(t))) return +a === m[1] * m[2] * m[3];
  if ((m = /平行四边形的底是 (\d+) 厘米，高是 (\d+) 厘米/.exec(t))) return +a === m[1] * m[2];
  if ((m = /三角形的底是 (\d+) 米，高是 (\d+) 米/.exec(t))) return +a === m[1] * m[2] / 2;
  if ((m = /共有 (\d+) 个头，(\d+) 条腿，兔/.exec(t))) return +a === (m[2] - 2 * m[1]) / 2;
  if ((m = /共有 (\d+) 个头，(\d+) 条腿，鸡/.exec(t))) return +a === (4 * m[1] - m[2]) / 2;
  if ((m = /两数的和是 (\d+)，差是 (\d+)，较大/.exec(t))) return +a === (+m[1] + +m[2]) / 2;
  if ((m = /^(\d+) 和 (\d+) 的最大公因数/.exec(t))) return +a === g(+m[1], +m[2]);
  if ((m = /^(\d+) 和 (\d+) 的最小公倍数/.exec(t))) return +a === m[1] * m[2] / g(+m[1], +m[2]);
  if ((m = /^下面哪个数是质数/.exec(t))) { const isP = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }; return isP(+a) && q.choices.filter(c => isP(+c)).length === 1; }
  if ((m = /^下面哪个数是 (\d) 的倍数/.exec(t))) return +a % m[1] === 0 && q.choices.filter(c => +c % m[1] === 0).length === 1;
  if ((m = /^(\d+) 的 (\d+)% 是多少/.exec(t))) return Math.abs(+a - m[1] * m[2] / 100) < 1e-9;
  if ((m = /^化简比：(\d+) : (\d+)/.exec(t))) { const [x, y] = a.split(':').map(Number); return g(x, y) === 1 && x * m[2] === y * m[1]; }
  if ((m = /个小朋友每两人握一次手/.exec(t))) { const n = +/^(\d+)/.exec(t)[1]; return +a === n * (n - 1) / 2; }
  if ((m = /今天是(星期.)，再过 (\d+) 天是星期几/.exec(t))) { const W = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']; return a === W[(W.indexOf(m[1]) + +m[2]) % 7]; }


  if (/^钟面上显示的是几时几分/.test(t)) { const { h, m: mm } = q.fig; return a === h + '时' + (mm ? (mm < 10 ? '0' + mm : mm) + '分' : '整'); }
  if (/^数一数：下图中一共有几个三角形/.test(t)) return +a === q.fig.n * (q.fig.n - 1) / 2;
  if (/^数一数：下图中一共有几个正方形/.test(t)) { let c = 0; const n = q.fig.r; for (let k = 1; k <= n; k++) c += (n - k + 1) ** 2; return +a === c; }
  if (/^图中涂色部分占整个圆的几分之几/.test(t)) return eqv(a, fr(q.fig.k, q.fig.n));
  const P = x => Math.abs(+a - x * 3.14) < 1e-6;
  if ((m = /圆的半径是 (\d+) 厘米，周长/.exec(t))) return P(2 * m[1]);
  if ((m = /圆的半径是 (\d+) 米，面积/.exec(t))) return P(m[1] * m[1]);
  if ((m = /圆的直径是 (\d+) 分米，面积/.exec(t))) return P((m[1] / 2) ** 2);
  if ((m = /外圆半径 (\d+) 厘米，内圆半径 (\d+) 厘米/.exec(t))) return P(m[1] * m[1] - m[2] * m[2]);
  if ((m = /圆柱底面半径 (\d+) 厘米，高 (\d+) 厘米，体积/.exec(t))) return P(m[1] * m[1] * m[2]);
  if ((m = /圆锥底面半径 (\d+) 米，高 (\d+) 米/.exec(t))) return P(m[1] * m[1] * m[2] / 3);
  if ((m = /圆柱底面半径 (\d+) 分米，高 (\d+) 分米，侧面积/.exec(t))) return P(2 * m[1] * m[2]);
  if ((m = /圆柱体积是 (\d+) 立方厘米，圆锥/.exec(t))) return +a === m[1] / 3;
  if ((m = /直角被分成两个角，其中一个是 (\d+)°/.exec(t))) return +a === 90 - m[1];
  if ((m = /平角被分成两个角，其中一个是 (\d+)°/.exec(t))) return +a === 180 - m[1];
  if ((m = /钟面上 (\d+) 时整，时针和分针/.exec(t))) return +a === Math.min(m[1] * 30, 360 - m[1] * 30);
  if ((m = /量得一个角是 (\d+)°/.exec(t))) return a === (m[1] < 90 ? '锐角' : m[1] == 90 ? '直角' : '钝角');
  if ((m = /^求这组数的平均数：(.+)$/.exec(t))) { const xs = m[1].split('、').map(Number); return +a === xs.reduce((x, y) => x + y) / xs.length; }
  if ((m = /(\d+) 次测验的平均分是 (\d+) 分，总分/.exec(t))) return +a === m[1] * m[2];
  if ((m = /前 (\d+) 次考试平均 (\d+) 分，第 \d+ 次考了 (\d+) 分/.exec(t))) return +a === (m[1] * m[2] + +m[3]) / (+m[1] + 1);
  if ((m = /从前往后数是第 (\d+) 个，从后往前数是第 (\d+) 个/.exec(t))) return +a === +m[1] + +m[2] - 1;
  if ((m = /前面有 (\d+) 人，后面有 (\d+) 人/.exec(t))) return +a === +m[1] + +m[2] + 1;
  if ((m = /小红排第 (\d+)，小兰排第 (\d+)/.exec(t))) return +a === m[2] - m[1] - 1;
  if ((m = /长 (\d+) 米的小路一边植树，每隔 (\d+) 米/.exec(t))) return +a === m[1] / m[2] + 1;
  if ((m = /周长 (\d+) 米的圆形水池边，每隔 (\d+) 米/.exec(t))) return +a === m[1] / m[2];
  if ((m = /锯成 (\d+) 段要 (\d+) 分钟，照这样锯成 (\d+) 段/.exec(t))) return +a === m[2] / (m[1] - 1) * (m[3] - 1);
  if ((m = /有 (.+) (\d) 种颜色的球各 10 个/.exec(t))) return +a === +m[2] + 1;
  if ((m = /把 (\d+) 本书放进 (\d+) 个抽屉/.exec(t))) return +a === Math.ceil(m[1] / m[2]);
  if ((m = /甲数是乙数的 (\d+) 倍，两数的和是 (\d+)/.exec(t))) return +a === m[2] / (+m[1] + 1);
  if ((m = /甲数是乙数的 (\d+) 倍，甲比乙多 (\d+)/.exec(t))) return +a === m[2] / (m[1] - 1);
  if ((m = /每人分 (\d+) 颗，多 (\d+) 颗；每人分 (\d+) 颗，少 (\d+) 颗/.exec(t))) return +a * m[1] + +m[2] === +a * m[3] - m[4];
  if ((m = /相距 (\d+) 千米的两地同时相向开出，甲每小时行 (\d+) 千米，乙每小时行 (\d+) 千米/.exec(t))) return +a === m[1] / (+m[2] + +m[3]);
  if ((m = /前方 (\d+) 千米，乙车每小时行 (\d+) 千米，甲车每小时行 (\d+) 千米/.exec(t))) return +a === m[1] / (m[2] - m[3]);
  if ((m = /火车长 (\d+) 米，每秒行 (\d+) 米，完全通过一座桥用了 (\d+) 秒/.exec(t))) return +a === m[2] * m[3] - m[1];
  if ((m = /甲单独做 (\d+) 天完成，乙单独做 (\d+) 天完成，两人合作/.exec(t))) return Math.abs(+a - 1 / (1 / m[1] + 1 / m[2])) < 1e-9;
  if ((m = /线段上（含两个端点）共有 (\d+) 个点/.exec(t)) || (m = /引出 (\d+) 条射线/.exec(t))) return +a === m[1] * (m[1] - 1) / 2;
  if ((m = /(\d+) 行 (\d+) 列的长方形格子/.exec(t))) { const r = +m[1], c = +m[2]; return +a === (r + 1) * r / 2 * (c + 1) * c / 2; }
  if ((m = /今年妈妈 (\d+) 岁，女儿 (\d+) 岁/.exec(t))) return +a === m[1] - m[2];
  if ((m = /爸爸比儿子大 (\d+) 岁，今年爸爸的年龄是儿子的 (\d+) 倍/.exec(t))) return +a * m[2] - +a === +m[1];
  if ((m = /儿子的 (\d+) 倍，儿子今年 (\d+) 岁，(\d+) 年后父子年龄和/.exec(t))) return +a === m[1] * m[2] + +m[2] + 2 * m[3];
  if ((m = /(\d+) 件上衣和 (\d+) 条裤子/.exec(t))) return +a === m[1] * m[2];
  if ((m = /(\d+) 支球队进行单循环/.exec(t))) return +a === m[1] * (m[1] - 1) / 2;
  if ((m = /一本书有 (\d+) 页，编页码/.exec(t))) { let c = 0; for (let i = 1; i <= +m[1]; i++) c += String(i).length; return +a === c; }
  if ((m = /除以 (\d+) 余 (\d+)，又是 (\d+) 的倍数，这样的数最小/.exec(t))) { for (let x = 1; ; x++) if (x % m[1] == m[2] && x % m[3] == 0) return +a === x; }
  if ((m = /计算 (\d) 的 (\d+) 次方，结果的个位/.exec(t))) { let d = 1; for (let i = 0; i < +m[2]; i++) d = d * m[1] % 10; return +a === d; }
  if ((m = /^找规律填数：(.+)，\(　\)$/.exec(t))) { const xs = m[1].split('，').map(Number); const n = +a; const d1 = xs.map((x, i) => i ? x - xs[i - 1] : 0).slice(1);
    const arith = d1.every(x => x === d1[0]) && n - xs[xs.length - 1] === d1[0];
    const geo = xs.every((x, i) => !i || x === xs[i - 1] * (xs[1] / xs[0])) && n === xs[xs.length - 1] * (xs[1] / xs[0]);
    const d2 = d1.map((x, i) => i ? x - d1[i - 1] : 0).slice(1); const sec = d2.every(x => x === d2[0]) && n - xs[xs.length - 1] === d1[d1.length - 1] + d2[0];
    const fib = xs.every((x, i) => i < 2 || x === xs[i - 1] + xs[i - 2]) && n === xs[xs.length - 1] + xs[xs.length - 2];
    return arith || geo || sec || fib; }
  if ((m = /一桶油 (\d+) 千克，用去了 \{?(\d+)\/?(\d*)\}?/.exec(t))) return null;
  if ((m = /打 (.)折出售/.exec(t))) { const z = '零一二三四五六七八九'.indexOf(m[1]); const p0 = +/原价 (\d+) 元/.exec(t)[1]; return +a === p0 * z / 10; }
  if ((m = /存入银行，年利率 ([\d.]+)%，存 (\d+) 年/.exec(t))) { const P0 = +/把 (\d+) 元/.exec(t)[1]; return Math.abs(+a - P0 * m[1] / 100 * m[2]) < 1e-6; }
  if ((m = /一次测验 (\d+) 人参加，(\d+) 人及格/.exec(t))) return Math.abs(M.valOf(a) - m[2] / m[1]) < 1e-9;
  if ((m = /^(\d+) 改写成用"万"作单位/.exec(t))) return a === m[1] / 10000 + '万';
  if ((m = /^(\d+) 省略"万"位后面的尾数/.exec(t))) return a === Math.round(m[1] / 10000) + '万';
  if ((m = /^(\d+) 元 (\d+) 角 = \(　\) 角/.exec(t))) return +a === m[1] * 10 + +m[2];
  if ((m = /^(\d+) 角 = \(　\) 元/.exec(t))) return +a === m[1] / 10;
  if ((m = /^(\d+) 分(?: (\d+) 秒)? = \(　\) 秒/.exec(t))) return +a === m[1] * 60 + (+m[2] || 0);
  if ((m = /^1 米 − (\d+) 厘米/.exec(t))) return +a === 100 - m[1];
  if ((m = /长方体长 (\d+) 分米、宽 (\d+) 分米、高 (\d+) 分米，表面积/.exec(t))) return +a === 2 * (m[1] * m[2] + m[2] * m[3] + m[1] * m[3]);
  if ((m = /正方体的棱长是 (\d+) 厘米/.exec(t))) return +a === m[1] ** 3;
  if ((m = /梯形的上底 (\d+) 厘米，下底 (\d+) 厘米，高 (\d+) 厘米/.exec(t))) return +a === (+m[1] + +m[2]) * m[3] / 2;
  if ((m = /周长是 (\d+) 厘米，长是 (\d+) 厘米，宽/.exec(t))) return +a === m[1] / 2 - m[2];
  if ((m = /把 (\d+) 个苹果按 (\d+):(\d+) 分给甲、乙/.exec(t))) return +a === m[1] * m[2] / (+m[2] + +m[3]);
  if ((m = /解比例：(\d+) : (\d+) = (\d+) : x/.exec(t))) return +a * m[1] === m[2] * m[3];
  if ((m = /比例尺 1:(\d+) 的地图上，量得两地距离 (\d+) 厘米/.exec(t))) return +a === m[1] * m[2] / 100;
  if ((m = /一个数的 (\d+) 倍再减去 (\d+) 等于 (\d+)/.exec(t))) return +a * m[1] - m[2] === +m[3];
  if ((m = /^(\d+) 一共有几个因数/.exec(t))) { let c = 0; for (let i = 1; i <= +m[1]; i++) if (m[1] % i === 0) c++; return +a === c; }
  if ((m = /^把 (\{\d+\/\d+\}) 化成小数/.exec(t))) { const f = num(m[1]); return Math.abs(+a - f[0] / f[1]) < 1e-9; }
  if ((m = /^把 (\{\d+\/\d+\}) 约成最简分数/.exec(t))) { const f = num(m[1]); return eqv(a, f) && /^\{\d+\/\d+\}$|^\d+$/.test(a); }
  if ((m = /^(\d+) 米 (\d+) 厘米 \+ (\d+) 米 = /.exec(t))) return +a === m[1] * 100 + +m[2] + m[3] * 100;
  return null;
}
function check(q, kp) {
  total++;
  if (q.choices.length !== 4) return bad(kp, '选项不足4个', q);
  if (q.choices[q.ans] !== q.answer || q.ans < 0) return bad(kp, '答案下标错误', q);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (M.sameVal(q.choices[i], q.choices[j])) return bad(kp, '选项重复', q);
  for (const c of q.choices) if (/NaN|undefined|Infinity|null|^-|\{-/.test(c) || c === '') return bad(kp, '非法选项 ' + c, q);
  if (/NaN|undefined|Infinity/.test(q.q + q.exp)) return bad(kp, '题干/解析含非法值', q);
  const v = M.valOf(q.answer); if (v !== null && (v < 0 || v > 1e10 || (Math.abs(v * 1e6 - Math.round(v * 1e6)) > 1e-6 && !/\{/.test(q.answer)))) return bad(kp, '答案数值不合理', q);
  if (!q.exp || q.exp.length < 6) return bad(kp, '缺少解析', q);
  const r = verify(q); if (r === false) return bad(kp, '独立验算不通过', q);
  return r;
}
const N = +process.argv[2] || 3000;
const report = [];
for (const kp of Object.keys(M.KP)) {
  let verified = 0;
  const grades = M.KP[kp].c ? [1, 2, 3, 4, 5, 6] : [M.KP[kp].g];
  for (let i = 0; i < N; i++) { const gr = grades[i % grades.length]; const q = M.genKP(kp, gr, i % 2 === 1); if (check(q, kp) === true) verified++; }
  report.push(kp.padEnd(11) + M.KP[kp].n.padEnd(12, '　') + ' 生成 ' + N + ' 题，独立验算 ' + verified + ' 题');
}
// 题库：逐题核对答案 + 干扰项
let bankN = 0;
for (const gr of Object.keys(M.BANK)) M.BANK[gr].forEach((b, i) => {
  bankN++; total++;
  const got = b.v();
  if (got !== b.a) { fail++; (errs.bank = errs.bank || []).push(gr + '年级#' + i + ' 验算=' + got + ' 标注=' + b.a + ' :: ' + b.q); }
  if (!b.e || b.d.length < 3 || b.d.some(x => M.sameVal(String(x), b.a)) || new Set(b.d).size !== b.d.length) { fail++; (errs.bank = errs.bank || []).push(gr + '年级#' + i + ' 干扰项/解析问题 :: ' + b.q); }
  for (let k = 0; k < 20; k++) { const q = M.genBank(+gr); check(q, 'bank'); }
});
// next() 综合抽样（含竞赛模式/主题/自适应）
for (let gr = 1; gr <= 6; gr++) for (let i = 0; i < 2000; i++) check(M.next({ grade: gr, comp: i % 2 === 0, theme: ['calc', 'geo', 'frac', 'measure', 'logic'][i % 5], stats: { g1_add20: { n: 10, ok: 2 } } }), 'next');
console.log(report.join('\n'));
console.log('竞赛题库：' + Object.entries(M.BANK).map(([k, l]) => k + '年级 ' + l.length + ' 题').join('，') + '，共 ' + bankN + ' 题，全部逐题验算');
console.log('总检查 ' + total + ' 题，失败 ' + fail);
if (fail) { console.log(JSON.stringify(errs, null, 1)); process.exit(1); }
console.log('全部通过 ✓');
