// 语音覆盖测试：随机生成新题目，检查星老师每一步讲解都能用预生成的神经语音片段完整拼读；检查灵兽台词语音齐全
const fs = require('fs'), M = require('../js/mathq.js'), X = require('../js/explain.js'), V = require('../js/voice_text.js');
const load = f => { let d; global.VoicePack = { add: (n, x) => d = x }; eval(fs.readFileSync(__dirname + '/../voice/' + f + '.js', 'utf8')); return d; };
const tutor = load('tutor'); const has = k => !!tutor[k];
function ok(s) { const p = V.parse(s), segs = V.segs(p.key); for (let i = 0; i < segs.length; i++) { const t = segs[i]; if (t && !V.silentSeg(t) && !has(t)) return false; if (i < p.toks.length && !V.tokChunks(p.toks[i]).every(has)) return false; } return true; }
let tot = 0, hit = 0; const miss = new Map(); const N = +(process.env.N || 800);
for (const k of Object.keys(M.KP)) for (let i = 0; i < N; i++) { const q = M.KP[k].c ? M.genKP(k, 1 + (i * 7) % 6) : M.genKP(k, 0, (i + 1) % 2); for (const s of X.build(q).steps) { tot++; if (ok(s)) hit++; else { const key = V.parse(s).key; miss.set(key, (miss.get(key) || 0) + 1); } } }
for (let g = 1; g <= 6; g++) for (let i = 0; i < 300; i++) { const q = M.next({ grade: g, comp: true, forceComp: true }); if (!q) continue; for (const s of X.build(q).steps) { tot++; if (ok(s)) hit++; else miss.set(V.parse(s).key, 1); } }
const pct = hit / tot * 100;
console.log('星老师讲解步骤 ' + tot + ' 句，神经语音完整覆盖 ' + hit + ' 句（' + pct.toFixed(2) + '%）');
if (miss.size) console.log('未覆盖模板（回退到浏览器语音）示例：', [...miss.keys()].slice(0, 5));
let mbad = 0; const MV = require('../js/mon_voice.js');
if (fs.existsSync(__dirname + '/../voice/mons.js')) { const mons = load('mons'); for (const sp in MV.MON_VOICE) for (const k of MV.VOICE_KINDS) MV.MON_VOICE[sp][k].forEach((t, i) => { if (!mons[sp + ':' + k + ':' + i]) { mbad++; if (mbad < 5) console.log('缺灵兽语音', sp, k, i); } }); console.log('灵兽台词语音 ' + Object.keys(mons).length + ' 条，缺失 ' + mbad); }
if (pct < 99 || mbad) process.exit(1); else console.log('语音测试通过 ✓');
