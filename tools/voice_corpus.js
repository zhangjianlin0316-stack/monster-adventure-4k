// 收集星老师讲解需要的全部语音片段 → tools/voice_jobs_tutor.json
const M = require('../js/mathq.js'), X = require('../js/explain.js'), V = require('../js/voice_text.js');
const N = +(process.env.N || 3000);
const keys = new Map();
function add(s) { const p = V.parse(s); keys.set(p.key, (keys.get(p.key) || 0) + 1); }
for (const k of Object.keys(M.KP)) for (let i = 0; i < N; i++) { const q = M.KP[k].c ? M.genKP(k, 1 + i % 6) : M.genKP(k, 0, i % 2); X.build(q).steps.forEach(add); }
for (let g = 1; g <= 6; g++) for (let i = 0; i < 400; i++) { const q = M.next({ grade: g, comp: true, forceComp: true }); if (q) X.build(q).steps.forEach(add); }
const EXTRA = require('./tutor_lines.json');
const texts = new Set();
for (const key of keys.keys()) V.segs(key).forEach(t => { if (t && !V.silentSeg(t)) texts.add(t); });
for (let n = 0; n < 200000; n++) V.numChunks(n).forEach(c => texts.add(c));
['点', '分之', '百分之', '万', '零'].forEach(t => texts.add(t));
Object.values(EXTRA).flat().forEach(t => texts.add(t));
require('fs').writeFileSync(__dirname + '/voice_keys_tutor.json', JSON.stringify([...keys.keys()].sort()));
require('fs').writeFileSync(__dirname + '/voice_jobs_tutor.json', JSON.stringify([...texts].sort()));
console.log('模板', keys.size, '语音片段', texts.size);
