// 讲解脚本测试：每个知识点生成大量题目，检查动画讲解推导出的答案与题目答案一致、步骤非空
const M = require('../js/mathq.js'), X = require('../js/explain.js');
const N = +(process.env.N || 3000); let tot = 0, bad = 0; const vizCount = {};
for (const k of Object.keys(M.KP)) for (let i = 0; i < N; i++) {
  const q = M.KP[k].c ? M.genKP(k, 1 + i % 6) : M.genKP(k, 0, i % 2); const x = X.build(q); tot++;
  vizCount[x.viz] = (vizCount[x.viz] || 0) + 1;
  const ok = M.sameVal(String(x.check), String(q.answer)) && x.steps.length >= 2 && x.steps.every(s => typeof s === 'string' && s.length > 0 && !/undefined|NaN/.test(s));
  if (!ok) { bad++; if (bad < 10) console.log('✗', k, q.q, q.answer, x.check, x.viz); }
}
for (let g = 1; g <= 6; g++) M.BANK[g].forEach((b, i) => { const q = M.genBank ? M.next({ grade: g, comp: true, forceComp: true }) : null; if (!q) return; const x = X.build(q); tot++; if (!M.sameVal(String(x.check), String(q.answer)) || x.steps.length < 2) { bad++; console.log('✗ bank', q.q); } });
console.log('讲解动画类型分布：' + Object.entries(vizCount).sort((a, b) => b[1] - a[1]).map(e => e[0] + ' ' + e[1]).join('，'));
console.log('讲解脚本检查 ' + tot + ' 题，失败 ' + bad);
if (bad) process.exit(1); else console.log('全部通过 ✓');
