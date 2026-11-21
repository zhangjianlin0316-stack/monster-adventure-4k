// ================== 开放大世界：程序化生成（固定种子，每次相同） ==================
// 不依赖 DOM，可在 Node 中运行连通性测试。
const W = 150, H = 110;
const T = { GROUND: 0, TALL: 1, TREE: 2, WATER: 3, PATH: 4, FLOWER: 5, FENCE: 6, BUILD: 7, DOOR: 8, SIGN: 9, GATE: 10, BRIDGEX: 11, BRIDGE: 12, STONE: 13, LAVA: 14, CLIFF: 15 };
const REGIONS = [
  { id: 'meadow', n: '翠风原野', seed: [75, 93], wgt: 1.0, lv: [2, 6], theme: 'calc', bg: 'bg_meadow', song: 'route', dens: 0.64, grass: 0.59,
    pool: [['bunny', 28], ['bird', 28], ['shroom', 16], ['volt', 10], ['moth', 14], ['otter', 8], ['fawn', 4], ['fox', 3], ['turtle', 3], ['cat', 1]] },
  { id: 'flower', n: '花海草原', seed: [80, 57], wgt: 1.0, lv: [5, 10], theme: 'measure', bg: 'bg_flower', song: 'flower', dens: 0.7, grass: 0.58,
    pool: [['bunny', 20], ['bird', 18], ['fawn', 12], ['shroom', 12], ['volt', 10], ['moth', 14], ['tanuki', 6], ['jelly', 5], ['crane', 2], ['bunny2', 3], ['bird2', 3]] },
  { id: 'lake', n: '镜湖湖畔', seed: [27, 84], wgt: 1.0, lv: [7, 12], theme: 'frac', bg: 'bg_lake', song: 'lake', dens: 0.66, grass: 0.58,
    pool: [['turtle', 14], ['jelly', 22], ['seal', 12], ['otter', 18], ['koi', 10], ['volt', 8], ['bird', 10], ['crane', 2], ['dragon', 1], ['jelly2', 4]] },
  { id: 'forest', n: '幽暗森林', seed: [28, 45], wgt: 1.0, lv: [9, 15], theme: 'logic', bg: 'bg_forest', song: 'forest', dens: 0.5, grass: 0.55,
    pool: [['shroom', 22], ['beetle', 20], ['fawn', 12], ['tanuki', 10], ['moth', 10], ['lizard', 8], ['owl', 6], ['cat', 2], ['shroom2', 6], ['beetle2', 4]] },
  { id: 'desert', n: '赤砂峡谷', seed: [124, 66], wgt: 1.0, lv: [13, 20], theme: 'geo', bg: 'bg_desert', song: 'desert', dens: 0.66, grass: 0.6,
    pool: [['rock', 24], ['lizard', 20], ['golem', 12], ['beetle', 12], ['bird2', 12], ['fox', 7], ['otter2', 4], ['rock2', 6], ['lizard2', 4], ['dragon', 1]] },
  { id: 'snow', n: '霜冠雪山', seed: [55, 14], wgt: 1.0, lv: [18, 26], theme: 'frac', bg: 'bg_snow', song: 'snow', dens: 0.62, grass: 0.58,
    pool: [['seal', 20], ['owl', 14], ['seal2', 10], ['volt2', 12], ['bunny2', 12], ['rock', 10], ['jelly2', 8], ['golem2', 4], ['turtle2', 5], ['owl2', 3], ['crane', 2]] },
  { id: 'volcano', n: '炎心火山', seed: [123, 19], wgt: 1.0, lv: [24, 32], theme: 'logic', bg: 'bg_volcano', song: 'volcano', dens: 0.64, grass: 0.59,
    pool: [['lizard2', 22], ['fox2', 12], ['rock2', 16], ['golem2', 10], ['beetle2', 12], ['lizard', 12], ['volt2', 6], ['moth2', 6], ['dragon2', 1], ['lizard3', 2]] }
];
const RIDX = {}; REGIONS.forEach((r, i) => RIDX[r.id] = i);
// 地区之间的通道：type = open(开放) / gate(数学之门) / bridge(断桥)
const LINKS = [
  { a: 'meadow', b: 'flower', type: 'gate', theme: 'calc', name: '翠风之门' },
  { a: 'meadow', b: 'lake', type: 'bridge', theme: 'frac', name: '镜湖断桥' },
  { a: 'flower', b: 'forest', type: 'open' },
  { a: 'lake', b: 'forest', type: 'gate', theme: 'logic', name: '林荫石门' },
  { a: 'flower', b: 'desert', type: 'gate', theme: 'geo', name: '峡谷石门' },
  { a: 'forest', b: 'snow', type: 'gate', theme: 'frac', name: '冰封之门' },
  { a: 'desert', b: 'volcano', type: 'bridge', theme: 'logic', name: '熔岩断桥' },
  { a: 'snow', b: 'volcano', type: 'gate', theme: 'calc', name: '霜火之门' },
  { a: 'meadow', b: 'desert', type: 'open' }
];
const TOWNS = [
  { id: 'cuifeng', n: '翠风镇', r: 'meadow', x: 70, y: 95, start: true },
  { id: 'huayu', n: '花语村', r: 'flower', x: 84, y: 52 },
  { id: 'jinghu', n: '镜湖村', r: 'lake', x: 16, y: 94 },
  { id: 'linjian', n: '林间小屋', r: 'forest', x: 22, y: 38, small: true },
  { id: 'lvzhou', n: '绿洲集市', r: 'desert', x: 126, y: 74 },
  { id: 'xuefeng', n: '雪峰村', r: 'snow', x: 50, y: 10 },
  { id: 'rongyan', n: '熔岩堡', r: 'volcano', x: 126, y: 12 }
];
let MAP = [], REG = [], BORDER = [], PROT = [];
const LAKE_C = [40, 75];
let BUILDINGS = [], OBJS = [], GATES = [], SIGNS = {};
let SPAWN = { x: 70, y: 100 };
// ---------- 随机与噪声 ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return (vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15); }
const inMap = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const regionAt = (x, y) => inMap(x, y) ? REG[y][x] : -1;
function setT(x, y, v) { if (inMap(x, y)) MAP[y][x] = v; }
// ---------- 生成 ----------
function genWorld() {
  const rng = mulberry32(20261121);
  MAP = []; REG = []; BORDER = []; PROT = []; BUILDINGS = []; OBJS = []; GATES = []; SIGNS = {};
  for (let y = 0; y < H; y++) { MAP.push(new Array(W).fill(T.GROUND)); REG.push(new Array(W).fill(0)); BORDER.push(new Array(W).fill(0)); PROT.push(new Array(W).fill(0)); }
  // 1) 扭曲的 Voronoi 地区划分
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = x + (fbm(x / 16, y / 16, 3) - 0.5) * 22, wy = y + (fbm(x / 16, y / 16, 9) - 0.5) * 22;
    let best = 0, bd = 1e9;
    REGIONS.forEach((r, i) => { const d = Math.hypot(wx - r.seed[0], (wy - r.seed[1]) * 1.15) * r.wgt; if (d < bd) { bd = d; best = i; } });
    REG[y][x] = best;
  }
  // 2) 边界：两格厚的天然屏障；地图外圈也是屏障
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let b = x < 2 || y < 2 || x >= W - 2 || y >= H - 2;
    if (!b) for (let dy = -1; dy <= 1 && !b; dy++) for (let dx = -1; dx <= 1; dx++) { const r = regionAt(x + dx, y + dy); if (r >= 0 && r !== REG[y][x]) { b = true; break; } }
    if (b) { BORDER[y][x] = 1; MAP[y][x] = T.TREE; }
  }
  // 3) 地区内部地形
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (BORDER[y][x]) continue;
    const R = REGIONS[REG[y][x]], id = R.id;
    const n1 = fbm(x / 7, y / 7, 21), n2 = fbm(x / 5, y / 5, 33), n3 = fbm(x / 4, y / 4, 45), n4 = fbm(x / 9, y / 9, 57);
    if (n1 > R.dens) MAP[y][x] = id === 'desert' && n1 > R.dens + 0.06 ? T.CLIFF : T.TREE;
    else if (id === 'volcano' && n4 > 0.68) MAP[y][x] = T.LAVA;
    else if ((id === 'meadow' || id === 'flower' || id === 'forest' || id === 'snow') && n4 > 0.74) MAP[y][x] = T.WATER;
    else if (n2 > R.grass) MAP[y][x] = T.TALL;
    else if (n3 > (id === 'flower' ? 0.5 : 0.7) && id !== 'desert' && id !== 'volcano') MAP[y][x] = T.FLOWER;
    // 森林里额外的散落树木
    if (id === 'forest' && MAP[y][x] === T.GROUND && h2(x, y, 5) > 0.86) MAP[y][x] = T.TREE;
  }
  // 镜湖：大湖 + 湖心岛（隐藏区域）
  const LK = LAKE_C;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (BORDER[y][x] || REGIONS[REG[y][x]].id !== 'lake') continue;
    const d = Math.hypot(x - LK[0], (y - LK[1]) * 1.3) + (fbm(x / 6, y / 6, 77) - 0.5) * 6;
    if (d < 10.5) MAP[y][x] = d < 2.6 ? (d < 1.4 ? T.FLOWER : T.GROUND) : T.WATER;
  }
  // 4) 城镇
  TOWNS.forEach(t => buildTown(t, rng));
  // 5) 地区通道（含数学之门 / 断桥）与道路
  LINKS.forEach((L, i) => buildLink(L, i, rng));
  // 6) 隐藏区域与地标
  buildSecrets(rng);
  // 7) 连通性修复：不可达的空地被打通或填平
  fixConnectivity();
  // 8) 放置宝箱、石碑、训练师、大师、路人
  placeObjects(rng);
  return { W, H };
}
function townTiles(t) { return { x0: t.x - 6, y0: t.y - 4, x1: t.x + 6, y1: t.y + 5 }; }
function buildTown(t, rng) {
  const b = townTiles(t); const ri = RIDX[t.r];
  for (let y = b.y0 - 1; y <= b.y1 + 1; y++) for (let x = b.x0 - 1; x <= b.x1 + 1; x++) if (inMap(x, y) && !BORDER[y][x]) MAP[y][x] = T.GROUND;
  // 十字道路
  for (let x = b.x0; x <= b.x1; x++) { setT(x, t.y + 1, T.PATH); setT(x, t.y + 2, T.PATH); }
  for (let y = b.y0; y <= b.y1; y++) { setT(t.x, y, T.PATH); setT(t.x + 1, y, T.PATH); }
  const add = (kind, x, y) => { const B = { kind, x, y, w: 4, h: 3, town: t.id, door: [x + 2, y + 3] }; BUILDINGS.push(B);
    for (let yy = y; yy < y + 3; yy++) for (let xx = x; xx < x + 4; xx++) setT(xx, yy, T.BUILD); setT(x + 2, y + 3, T.DOOR); setT(x + 2, y + 4, T.PATH); };
  add('center', t.x - 5, t.y - 3);
  if (!t.small) add('shop', t.x + 3, t.y - 3);
  if (t.start || !t.small) add('home', t.x + 3, t.y + 4 - 1 + 0) ;
  // 花坛与栅栏装饰
  for (let x = t.x - 5; x <= t.x - 2; x++) { setT(x, t.y + 4, T.FLOWER); setT(x, t.y + 5, T.FENCE); }
  SIGNS[(t.x - 1) + ',' + (t.y + 3)] = t.n + '\n' + townSlogan(t);
  setT(t.x - 1, t.y + 3, T.SIGN);
  if (t.start) SPAWN = { x: t.x + 5, y: t.y + 4 + 3 };
}
function townSlogan(t) {
  return { cuifeng: '清风拂面、灵兽初遇的小镇。往北是花海草原，往西可到镜湖。', huayu: '花香四溢的村庄。东边的峡谷石门考验图形与几何！', jinghu: '湖光如镜。传说湖心岛上藏着金色宝箱……', linjian: '森林深处的歇脚小屋，可以在这里恢复灵兽。',
    lvzhou: '沙漠中的绿洲集市，商人们最爱算账。', xuefeng: '雪山脚下的村庄，冰封之门后是寒冷的高原。', rongyan: '火山口旁的古堡，最强的算术大师在此等候。' }[t.id];
}
function carveLine(x0, y0, x1, y1, width, tile, rng, opts) {
  opts = opts || {};
  let x = x0, y = y0; const pts = [];
  let guard = 0;
  while ((x !== x1 || y !== y1) && guard++ < 2000) {
    const dx = x1 - x, dy = y1 - y;
    // 带一点随机摆动的曼哈顿行走
    if (Math.abs(dx) > Math.abs(dy) ? rng() < 0.78 : rng() < 0.22) x += Math.sign(dx) || 0; else y += Math.sign(dy) || 0;
    if (dx === 0 && y !== y1) { } // already handled
    pts.push([x, y]);
  }
  pts.forEach(([px, py]) => {
    for (let k = 0; k < width; k++) for (let j = 0; j < width; j++) {
      const xx = px + k, yy = py + j; if (!inMap(xx, yy)) continue;
      if ((BORDER[yy][xx] && !opts.allowBorder) || PROT[yy][xx]) continue;
      const cur = MAP[yy][xx]; if (cur === T.BUILD || cur === T.DOOR || cur === T.GATE || cur === T.BRIDGEX || cur === T.SIGN || cur === T.FENCE) continue;
      if (cur === T.WATER || cur === T.LAVA) { if (!opts.bridge) continue; MAP[yy][xx] = T.BRIDGE; continue; }
      MAP[yy][xx] = tile;
    }
  });
  return pts;
}
function townOf(r) { return TOWNS.find(t => t.r === r); }
function buildLink(L, i, rng) {
  const A = RIDX[L.a], B = RIDX[L.b];
  const SA = REGIONS[A].seed, SB = REGIONS[B].seed, mx = (SA[0] + SB[0]) / 2, my = (SA[1] + SB[1]) / 2;
  // 寻找 A、B 交界处离两地中点最近的竖直或水平穿越点
  let best = null, bd = 1e9;
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    if (REG[y][x] !== A) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (regionAt(x + dx, y + dy) !== B) continue;
      // 穿越线两侧各 3 格都应是各自地区
      let ok = true; for (let k = 1; k <= 3; k++) { if (regionAt(x - dx * k, y - dy * k) !== A || regionAt(x + dx * (k + 1), y + dy * (k + 1)) !== B) ok = false; }
      if (!ok) continue;
      // 侧向也要是同一条边界（避免三区交点）
      const px = dy !== 0 ? 1 : 0, py = dx !== 0 ? 1 : 0;
      for (let k = -3; k <= 3; k++) { const r1 = regionAt(x + px * k, y + py * k), r2 = regionAt(x + dx + px * k, y + dy + py * k); if ((r1 !== A && r1 !== B) || (r2 !== A && r2 !== B)) ok = false; }
      if (!ok) continue;
      const d = Math.hypot(x - mx, y - my) + h2(x, y, i) * 2;
      if (d < bd) { bd = d; best = { x, y, dx, dy }; }
    }
  }
  if (!best) { console.warn('无法连接', L.a, L.b); return; }
  const { x, y, dx, dy } = best; L.at = best;
  // 穿越走廊（宽 1 格），A 侧边界格放门
  const corridor = []; for (let k = -3; k <= 4; k++) corridor.push([x + dx * k, y + dy * k]);
  const px = dy !== 0 ? 1 : 0, py = dx !== 0 ? 1 : 0;
  if (L.type === 'bridge') {
    // 河流：在穿越点周围把屏障换成水面，桥面先是断的
    for (let k = -6; k <= 6; k++) for (let j = -1; j <= 2; j++) { const xx = x + px * k + dx * j, yy = y + py * k + dy * j; if (inMap(xx, yy) && (BORDER[yy][xx] || Math.abs(j) <= 1)) { if (MAP[yy][xx] !== T.BUILD) MAP[yy][xx] = L.a === 'desert' ? T.LAVA : T.WATER; } }
  }
  corridor.forEach(([cx, cy], k) => { if (inMap(cx, cy)) MAP[cy][cx] = T.PATH; });
  if (L.type === 'gate') { MAP[y][x] = T.GATE; GATES.push({ id: 'g' + i, tiles: [[x, y]], type: 'gate', theme: L.theme, name: L.name, n: 3, need: 2, a: L.a, b: L.b }); }
  else if (L.type === 'bridge') { const tiles = []; for (let j = -1; j <= 2; j++) { const xx = x + dx * j, yy = y + dy * j; MAP[yy][xx] = T.BRIDGEX; tiles.push([xx, yy]); } GATES.push({ id: 'g' + i, tiles, type: 'bridge', theme: L.theme, name: L.name, n: 3, need: 2, a: L.a, b: L.b }); }
  // 告示牌
  const sx = x - dx * 3 + px, sy = y - dy * 3 + py; if (inMap(sx, sy) && !BORDER[sy][sx]) { MAP[sy][sx] = T.SIGN; SIGNS[sx + ',' + sy] = '前方：' + REGIONS[B].n + '（推荐等级 ' + REGIONS[B].lv[0] + '~' + REGIONS[B].lv[1] + '）' + (L.type === 'open' ? '' : '\n' + L.name + '：答对数学题即可通过！'); }
  const sx2 = x + dx * 4 - px, sy2 = y + dy * 4 - py; if (inMap(sx2, sy2) && !BORDER[sy2][sx2]) { MAP[sy2][sx2] = T.SIGN; SIGNS[sx2 + ',' + sy2] = '前方：' + REGIONS[A].n + '（推荐等级 ' + REGIONS[A].lv[0] + '~' + REGIONS[A].lv[1] + '）'; }
  // 道路：A 城镇 → 走廊 → B 城镇
  const ta = townOf(L.a), tb = townOf(L.b);
  const ea = [x - dx * 3, y - dy * 3], eb = [x + dx * 4, y + dy * 4];
  carveLine(ta.x, ta.y + 1, ea[0], ea[1], 2, T.PATH, rng, { bridge: true });
  carveLine(eb[0], eb[1], tb.x, tb.y + 1, 2, T.PATH, rng, { bridge: true });
}
const SECRETS = [];
function grove(cx, cy, opening, kind) {
  // 被树木环绕的小空地，只有一个入口（谜题石 / 隐秘缝隙）；入口朝向最近的道路
  let best = null, bd = 1e9;
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (MAP[y][x] === T.PATH && REG[y][x] === REG[cy][cx]) { const d = Math.abs(x - cx) + Math.abs(y - cy); if (d < bd) { bd = d; best = [x, y]; } }
  if (best) { const ddx = best[0] - cx, ddy = best[1] - cy; opening = Math.abs(ddx) > Math.abs(ddy) ? [Math.sign(ddx), 0] : [0, Math.sign(ddy) || 1]; }
  for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) {
    if (!inMap(x, y) || BORDER[y][x]) continue; const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
    MAP[y][x] = d === 3 ? T.TREE : (d <= 1 ? T.FLOWER : T.GROUND); PROT[y][x] = 1;
  }
  const [ox, oy] = opening; MAP[cy + oy * 3][cx + ox * 3] = kind === 'stone' ? T.STONE : T.GROUND;
  SECRETS.push({ x: cx, y: cy });
  if (best) carveLine(cx + ox * 4, cy + oy * 4, best[0], best[1], 1, T.GROUND, mulberry32(cx * 31 + cy));
  setT(cx + ox * 4, cy + oy * 4, T.GROUND);
  return [cx + ox * 3, cy + oy * 3];
}
function findSpot(rid, rng, test, tries) {
  for (let i = 0; i < (tries || 4000); i++) {
    const x = 6 + Math.floor(rng() * (W - 12)), y = 6 + Math.floor(rng() * (H - 12));
    if (REG[y][x] !== RIDX[rid]) continue;
    let ok = true; for (let yy = y - 5; yy <= y + 5 && ok; yy++) for (let xx = x - 5; xx <= x + 5; xx++) { if (!inMap(xx, yy) || BORDER[yy][xx] || PROT[yy][xx] || REG[yy][xx] !== RIDX[rid] || MAP[yy][xx] === T.BUILD || MAP[yy][xx] === T.DOOR || MAP[yy][xx] === T.GATE || MAP[yy][xx] === T.BRIDGEX || MAP[yy][xx] === T.PATH) { ok = false; break; } }
    if (ok && (!test || test(x, y))) return [x, y];
  }
  return null;
}
function buildSecrets(rng) {
  SECRETS.length = 0;
  // 湖心岛：断桥谜题
  const LK = LAKE_C; let sx = LK[0], y = LK[1];
  while (inMap(sx, y) && MAP[y][sx] !== T.WATER) y++;
  const tiles = []; while (inMap(sx, y) && MAP[y][sx] === T.WATER) { tiles.push([sx, y]); y++; }
  tiles.forEach(([x, yy]) => MAP[yy][x] = T.BRIDGEX);
  if (tiles.length) { GATES.push({ id: 'island', tiles, type: 'bridge', theme: 'frac', name: '湖心断桥', n: 3, need: 3, secret: true }); for (let k = 0; k < 4; k++) if (inMap(sx, y + k) && !BORDER[y + k][sx]) { if (MAP[y + k][sx] !== T.BUILD) MAP[y + k][sx] = T.PATH; } }
  SECRETS.push({ x: LK[0], y: LK[1], gold: true, region: 'lake', gate: 'island' });
  for (let y2 = LK[1] - 3; y2 <= LK[1] + 3; y2++) for (let x2 = LK[0] - 3; x2 <= LK[0] + 3; x2++) PROT[y2][x2] = 1;
  // 其余地区的秘密花园（谜题石或隐秘缝隙）
  const plan = [['meadow', 'gap'], ['flower', 'stone'], ['forest', 'stone'], ['desert', 'gap'], ['snow', 'stone'], ['volcano', 'stone'], ['forest', 'gap']];
  plan.forEach(([rid, kind], i) => {
    const p = findSpot(rid, rng); if (!p) return;
    const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1]]; const o = dirs[i % 4];
    const door = grove(p[0], p[1], o, kind); SECRETS[SECRETS.length - 1].gold = true; SECRETS[SECRETS.length - 1].region = rid;
    if (kind === 'stone') SECRETS[SECRETS.length - 1].gate = 'stone' + i;
    if (kind === 'stone') GATES.push({ id: 'stone' + i, tiles: [door], type: 'stone', theme: REGIONS[RIDX[rid]].theme, name: '谜题石', n: 2, need: 2, secret: true });
  });
}
const PASSABLE = new Set([T.GROUND, T.TALL, T.PATH, T.FLOWER, T.DOOR, T.BRIDGE, T.GATE, T.BRIDGEX, T.STONE]);
function bfs(fromX, fromY, passFn) {
  const seen = new Uint8Array(W * H); const q = [fromY * W + fromX]; seen[q[0]] = 1;
  for (let i = 0; i < q.length; i++) { const v = q[i], x = v % W, y = (v / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inMap(nx, ny)) continue; const k = ny * W + nx; if (seen[k] || !passFn(MAP[ny][nx], nx, ny)) continue; seen[k] = 1; q.push(k); } }
  return seen;
}
function fixConnectivity() {
  for (let iter = 0; iter < 60; iter++) {
    const seen = bfs(SPAWN.x, SPAWN.y, t => PASSABLE.has(t));
    // 找第一个不可达的空地连通块
    let found = null;
    for (let y = 0; y < H && !found; y++) for (let x = 0; x < W; x++) if (PASSABLE.has(MAP[y][x]) && !seen[y * W + x]) { found = [x, y]; break; }
    if (!found) return;
    const comp = bfs(found[0], found[1], t => PASSABLE.has(t)); const cells = []; for (let k = 0; k < W * H; k++) if (comp[k]) cells.push(k);
    if (cells.length < 12) { cells.forEach(k => { const x = k % W, y = (k / W) | 0; MAP[y][x] = T.TREE; }); continue; }
    // 打通：从该块找最近的可达格（同一地区内，不穿越边界）
    let bestD = 1e9, pair = null;
    for (const k of cells) { const x = k % W, y = (k / W) | 0; if (k % 3) continue;
      for (let r = 1; r < 18; r++) { let hit = false; for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const nx = x + dx, ny = y + dy; if (inMap(nx, ny) && seen[ny * W + nx] && REG[ny][nx] === REG[y][x]) { if (r < bestD) { bestD = r; pair = [x, y, nx, ny]; } hit = true; } } if (hit || r >= bestD) break; } }
    if (!pair) { cells.forEach(k => { const x = k % W, y = (k / W) | 0; MAP[y][x] = T.TREE; }); continue; }
    const [x0, y0, x1, y1] = pair; const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    let x = x0, y = y0; while (x !== x1 || y !== y1) { x += sx; y += sy; if (BORDER[y][x] || PROT[y][x]) break; if (!PASSABLE.has(MAP[y][x])) MAP[y][x] = (MAP[y][x] === T.WATER || MAP[y][x] === T.LAVA) ? T.BRIDGE : T.GROUND; }
  }
}
// ---------- 物体 ----------
const TRAINER_NAMES = ['小勇', '阿杰', '小雪', '晴晴', '大壮', '米粒', '思思', '乐天', '阿木', '朵朵', '小虎', '星星', '豆子', '安安'];
function nearPathSpot(rid, rng, avoid) {
  for (let i = 0; i < 5000; i++) {
    const x = 4 + Math.floor(rng() * (W - 8)), y = 4 + Math.floor(rng() * (H - 8));
    if (REG[y][x] !== RIDX[rid] || BORDER[y][x] || MAP[y][x] !== T.GROUND && MAP[y][x] !== T.FLOWER) continue;
    let nearPath = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inMap(x + dx, y + dy) && MAP[y + dy][x + dx] === T.PATH) nearPath = true;
    if (!nearPath) continue;
    if (OBJS.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < (avoid || 8))) continue;
    if (TOWNS.some(t => Math.abs(t.x - x) < 9 && Math.abs(t.y - y) < 8)) continue;
    return [x, y];
  }
  return null;
}
function openSpot(rid, rng, avoid, reach) {
  for (let i = 0; i < 6000; i++) {
    const x = 4 + Math.floor(rng() * (W - 8)), y = 4 + Math.floor(rng() * (H - 8));
    if (REG[y][x] !== RIDX[rid] || BORDER[y][x] || (MAP[y][x] !== T.GROUND && MAP[y][x] !== T.FLOWER)) continue;
    if (reach && !reach[y * W + x]) continue;
    if (OBJS.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < (avoid || 6))) continue;
    if (TOWNS.some(t => Math.abs(t.x - x) < 8 && Math.abs(t.y - y) < 7)) continue;
    let free = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (PASSABLE.has(MAP[y + dy][x + dx])) free++;
    if (free < 3) continue;
    return [x, y];
  }
  return null;
}
function placeObjects(rng) {
  const reach = bfs(SPAWN.x, SPAWN.y, t => PASSABLE.has(t));
  const add = (o) => { OBJS.push(o); return o; };
  // 秘密花园里的金色宝箱（竞赛题）
  SECRETS.forEach((s, i) => { if (s.gold) add({ type: 'gold', id: 'gold' + i, x: s.x, y: s.y, region: s.region, gate: s.gate || null }); });
  // 城镇居民、算术大师
  const MASTER_NAMES = { meadow: '算术大师·启明', flower: '算术大师·花间', lake: '算术大师·镜心', forest: '算术大师·林隐', desert: '算术大师·沙鸥', snow: '算术大师·霜岚', volcano: '算术宗师·炎心' };
  TOWNS.forEach((t, i) => {
    const r = t.r;
    add({ type: 'master', id: 'm_' + r, x: t.x - 3, y: t.y + 2 - 2 + 1 + 0, region: r, name: MASTER_NAMES[r], img: i % 2 ? 'npc_sage' : 'npc_master' });
    const npcImg = ['npc_girl', 'npc_boy', 'npc_old', 'npc_explorer'][i % 4];
    add({ type: 'npc', id: 'n_' + t.id, x: t.x + 3, y: t.y + 3 - 0, img: npcImg, region: r, lines: NPC_LINES[t.id] });
    if (t.id === 'lvzhou' || t.id === 'xuefeng') add({ type: 'merchant', id: 'merchant_' + t.id, x: t.x - 2, y: t.y - 1 + 3 + 0, img: 'npc_merchant', region: r });
  });
  // 招式导师（每个城镇一位）
  TOWNS.forEach(t => add({ type: 'movetutor', id: 'tutor_' + t.id, x: t.x + 5, y: t.y + 1, region: t.r, img: 'npc_sage', name: '招式导师·' + t.n.slice(0, 2) }));
  // 教授在起始镇
  const st = TOWNS[0]; add({ type: 'npc', id: 'prof', x: st.x + 2, y: st.y + 4 + 1, img: 'npc_prof', region: 'meadow', lines: NPC_LINES.prof });
  // 每个地区：宝箱、石碑、训练师
  REGIONS.forEach((R, ri) => {
    const nChest = R.id === 'meadow' ? 5 : 4, nStele = 3, nTrainer = R.id === 'meadow' ? 2 : 3;
    for (let i = 0; i < nChest; i++) { const p = openSpot(R.id, rng, 7, reach); if (p) add({ type: 'chest', id: 'c_' + R.id + i, x: p[0], y: p[1], region: R.id }); }
    for (let i = 0; i < nStele; i++) { const p = openSpot(R.id, rng, 9, reach); if (p) add({ type: 'stele', id: 's_' + R.id + i, x: p[0], y: p[1], region: R.id }); }
    for (let i = 0; i < nTrainer; i++) {
      const p = nearPathSpot(R.id, rng, 10); if (!p) continue;
      const lv = R.lv[0] + Math.round((R.lv[1] - R.lv[0]) * (0.4 + 0.25 * i));
      const pool = R.pool.map(e => e[0]); const n = 1 + Math.min(2, Math.floor(ri / 2) + (i > 1 ? 1 : 0));
      const team = []; for (let k = 0; k < n; k++) team.push([pool[(i * 3 + k * 2 + ri) % pool.length], Math.max(2, lv - (n - 1 - k))]);
      const female = (ri + i) % 2 === 0;
      add({ type: 'trainer', id: 't_' + R.id + i, x: p[0], y: p[1], region: R.id, img: female ? 'npc_trainer_f' : 'npc_trainer_m', name: (female ? '训练师 ' : '探险家 ') + TRAINER_NAMES[(ri * 3 + i) % TRAINER_NAMES.length], team, stars: 6 + ri * 3 });
    }
  });
  // 传说灵兽的神社：金色竞赛试炼后才会现身
  [['forest', 'qilin', 36, '雷鸣古神社'], ['lake', 'whale', 38, '云海星祠'], ['volcano', 'zhulong', 42, '烛火神殿']].forEach(([rid, sp, lv, name]) => { const p = openSpot(rid, rng, 10, reach); if (p) add({ type: 'shrine', id: 'shrine_' + sp, x: p[0], y: p[1], region: rid, sp, lv, name }); });
  // 地标：火山之巅的金星奖杯
  const vt = townOf('volcano'); add({ type: 'trophy', id: 'trophy', x: vt.x + 5, y: vt.y + 2, region: 'volcano' });
  // 物体所在格设为可通行地面
  OBJS.forEach(o => { if (MAP[o.y][o.x] !== T.FLOWER) MAP[o.y][o.x] = T.GROUND; });
  // 移除会被其他物体挡住、无法到达的可选物体
  for (let pass = 0; pass < 3; pass++) {
    const occ = new Set(OBJS.map(o => o.x + ',' + o.y));
    const S = bfs(SPAWN.x, SPAWN.y, (t, x, y) => PASSABLE.has(t) && !occ.has(x + ',' + y));
    const adj = o => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => S[(o.y + dy) * W + o.x + dx]);
    const before = OBJS.length; OBJS = OBJS.filter(o => adj(o) || !['chest', 'stele', 'trainer', 'npc', 'merchant'].includes(o.type) || o.id === 'prof');
    if (OBJS.length === before) break;
  }
}
const NPC_LINES = {
  prof: ['林教授：欢迎来到灵兽的世界！在这里，数学就是最强的力量。', '林教授：战斗时每次出招都要解一道数学题——答对了招式威力大增，连续答对还有连击加成！', '林教授：灵兽升到一定等级会进入"进化准备"状态，通过进化试炼（3 道题答对 2 道）就能进化成更强的形态！', '林教授：按 M 打开世界地图，按 Q 查看错题本和学习统计。去吧，北边的翠风之门在等你！'],
  cuifeng: ['小芳：我听说答对数学题能让捕获球更容易成功哦！', '小芳：草丛里会窜出野生灵兽，记得先在灵兽中心恢复体力。'],
  huayu: ['阿明：花海草原东边有一座峡谷石门，要懂图形和几何才能打开。', '阿明：听说有些树丛后面藏着秘密花园，要仔细找找看！'],
  jinghu: ['老渔夫：湖心岛上有一只金色宝箱，可惜桥断了……', '老渔夫：想修好湖心断桥？那得连对三道分数小数题才行！'],
  linjian: ['探险家：幽暗森林里有好几块谜题石，解开就能找到宝藏。', '探险家：北边的冰封之门通往雪山，那里的灵兽可厉害了。'],
  lvzhou: ['商队少女：沙漠里迷路时就打开地图（M 键），已探索的地方都会显示出来。', '商队少女：南边沙丘有一条小缝隙能通往隐秘绿洲哦！'],
  xuefeng: ['雪村老人：雪山上的灵兽等级很高，记得多带回复药。', '雪村老人：熔岩堡里住着最强的算术宗师！'],
  rongyan: ['守卫：能来到这里的人，都是真正的数学勇者！', '守卫：火山之巅的金星奖杯，属于集齐七枚徽章的人。']
};
if (typeof module !== 'undefined' && module.exports) module.exports = { genWorld, get MAP() { return MAP; }, get REG() { return REG; }, get OBJS() { return OBJS; }, get GATES() { return GATES; }, get BUILDINGS() { return BUILDINGS; }, get SPAWN() { return SPAWN; }, get SIGNS() { return SIGNS; }, W, H, T, REGIONS, LINKS, TOWNS, PASSABLE, bfs };
