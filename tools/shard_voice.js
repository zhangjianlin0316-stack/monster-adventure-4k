// 把 voice/<pack>.js 拆成约 300KB 的小分片 voice/<pack>_NN.js，并写 voice/index.js（分片数量）
// 小分片：并行下载更快、单个失败可重试，不必整包重下
const fs = require('fs'), path = require('path'); const V = path.join(__dirname, '../voice');
const LIMIT = +(process.env.SHARD_KB || 300) * 1024; const out = {};
for (const pack of ['tutor', 'npc', 'mons']) {
  let d; global.VoicePack = { add: (n, x) => d = x }; eval(fs.readFileSync(path.join(V, pack + '.js'), 'utf8'));
  for (const f of fs.readdirSync(V)) if (f.startsWith(pack + '_') && f.endsWith('.js')) fs.unlinkSync(path.join(V, f));
  const shards = []; let cur = {}, sz = 0;
  for (const k in d) { if (sz > LIMIT) { shards.push(cur); cur = {}; sz = 0; } cur[k] = d[k]; sz += d[k].length + k.length; }
  if (Object.keys(cur).length) shards.push(cur);
  shards.forEach((s, i) => fs.writeFileSync(path.join(V, pack + '_' + String(i).padStart(2, '0') + '.js'), 'VoicePack.add(' + JSON.stringify(pack) + ',' + JSON.stringify(s) + ');\n'));
  out[pack] = shards.length; console.log(pack, Object.keys(d).length, 'clips →', shards.length, 'shards');
}
fs.writeFileSync(path.join(V, 'index.js'), 'var VOICE_SHARDS = ' + JSON.stringify(out) + ';\n');
