// 世界连通性测试：node tests/world.test.js
const Wd = require('../js/world.js'); Wd.genWorld();
const { MAP, OBJS, GATES, BUILDINGS, SPAWN, W, H, T, REGIONS, REG, TOWNS } = Wd;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗ ' + m); } };
const gateTiles = new Set(); GATES.forEach(g => g.tiles.forEach(([x, y]) => gateTiles.add(x + ',' + y)));
const objAt = new Set(OBJS.map(o => o.x + ',' + o.y));
const base = t => [T.GROUND, T.TALL, T.PATH, T.FLOWER, T.DOOR, T.BRIDGE].includes(t);
function reach(open) { return Wd.bfs(SPAWN.x, SPAWN.y, (t, x, y) => !objAt.has(x + ',' + y) && (base(t) || ((t === T.GATE || t === T.BRIDGEX || t === T.STONE) && open.has(GATES.find(g => g.tiles.some(([a, b]) => a === x && b === y)).id)))); }
const all = new Set(GATES.map(g => g.id));
const R = reach(all);
const adjReach = (x, y, S) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => S[(y + dy) * W + x + dx]);
OBJS.forEach(o => ok(adjReach(o.x, o.y, R), '物体不可达 ' + o.type + ' ' + o.id + ' @' + o.x + ',' + o.y));
BUILDINGS.forEach(b => ok(adjReach(b.door[0], b.door[1], R) || R[b.door[1] * W + b.door[0]], '门不可达 ' + b.town + ' ' + b.kind));
GATES.forEach(g => ok(g.tiles.every(([x, y]) => R[y * W + x]), '门/桥不可达 ' + g.id));
// 逐步解锁：只能打开与已到达区域相邻的门
let open = new Set(), steps = 0, regionsSeen;
for (;;) { const S = reach(open); regionsSeen = new Set(); for (let k = 0; k < W * H; k++) if (S[k]) regionsSeen.add(REG[(k / W) | 0][k % W]);
  const next = GATES.filter(g => !open.has(g.id) && g.tiles.some(([x, y]) => adjReach(x, y, S)));
  if (!next.length) break; next.forEach(g => open.add(g.id)); steps++; if (steps > 20) break; }
ok(regionsSeen.size === REGIONS.length, '最终可到达地区 ' + regionsSeen.size + '/' + REGIONS.length);
const S0 = reach(new Set()); const r0 = new Set(); for (let k = 0; k < W * H; k++) if (S0[k]) r0.add(REGIONS[REG[(k / W) | 0][k % W]].n);
OBJS.filter(o => o.type === 'gold').forEach(o => { const g = o.gate && GATES.find(gt => gt.id === o.gate); if (g) ok(!adjReach(o.x, o.y, reach(new Set([...all].filter(id => id !== g.id)))), '秘密宝箱未被谜题保护 ' + o.id); });
TOWNS.forEach(t => ok(R[(t.y + 1) * W + t.x], '城镇不可达 ' + t.n));
let walk = 0; for (let k = 0; k < W * H; k++) if (R[k]) walk++;
console.log('地图 ' + W + '×' + H + '，可行走格 ' + walk + '，物体 ' + OBJS.length + '，门/桥/谜题石 ' + GATES.length + '，不开门时可到达：' + [...r0].join('、') + '，逐步解锁轮数 ' + steps);
if (fail) { console.log('失败 ' + fail); process.exit(1); } console.log('世界连通性测试通过 ✓');
