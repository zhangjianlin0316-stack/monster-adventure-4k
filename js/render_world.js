'use strict';
// ================== 大地图渲染：多地貌分块缓存 + 深度排序 + 迷你地图 ==================
const W_CAM = { x: 0, y: 0, init: false };
const RUSTLE = new Map();
const WORLD_FX = [];
const AMBIENT = [];
for (let i = 0; i < 60; i++) AMBIENT.push({ x: Math.random(), y: Math.random(), z: 0.4 + Math.random() * 0.8, ph: Math.random() * 6.28 });
let NOISE_CANVAS = null;
const REGION_TEX = { meadow: 'ground', flower: 'ground', lake: 'ground', forest: 'tex_moss', desert: 'tex_sand', snow: 'tex_snow', volcano: 'tex_ash' };
const REGION_TINT = { meadow: [255, 220, 160, 0.05], flower: [255, 190, 220, 0.07], lake: [150, 210, 255, 0.06], forest: [20, 60, 40, 0.22], desert: [255, 170, 80, 0.10], snow: [190, 220, 255, 0.10], volcano: [200, 50, 20, 0.16] };
const TINT_NOW = [255, 220, 160, 0.05];
function makeNoise() {
  const n = document.createElement('canvas'); n.width = 48; n.height = 48; const c = n.getContext('2d'); const id = c.createImageData(48, 48);
  for (let i = 0; i < 48 * 48; i++) { const v = hash(i % 48, Math.floor(i / 48)); id.data[i * 4] = 20; id.data[i * 4 + 1] = 40; id.data[i * 4 + 2] = 10; id.data[i * 4 + 3] = Math.floor(v * 70); }
  c.putImageData(id, 0, 0); return n;
}
// 生成地区专属的染色素材（干草、雪草、焦草、暗林）
function makeTinted() {
  const mk = (src, key, color, mode) => { const im = IMG[src]; if (!im || IMG[key]) return; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = mode || 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); IMG[key] = c; };
  mk('tallgrass', 'tallgrass_dry', 'rgba(220,170,80,0.55)');
  mk('tallgrass', 'tallgrass_snow', 'rgba(225,240,255,0.55)');
  mk('tallgrass', 'tallgrass_ash', 'rgba(120,40,30,0.55)');
  mk('tallgrass', 'tallgrass_dark', 'rgba(10,60,50,0.35)');
  mk('tallgrass', 'tallgrass_pink', 'rgba(255,150,200,0.25)');
  mk('tree', 'tree_dark', 'rgba(10,40,50,0.38)');
  mk('tree', 'tree_bloom', 'rgba(255,160,210,0.28)');
  mk('boulder', 'boulder_red', 'rgba(200,90,40,0.35)');
}
function tileSize() { return Math.max(24, Math.round(Math.min(CH / 14, CW / 22))); }
function tileAt(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return T.TREE; return MAP[y][x]; }
function ridAt(x, y) { const r = regionAt(clamp(x, 0, W - 1), clamp(y, 0, H - 1)); return REGIONS[r < 0 ? 0 : r].id; }
const isPathLike = t => t === T.PATH || t === T.DOOR;
const isWaterLike = t => t === T.WATER || t === T.BRIDGE || t === T.BRIDGEX;
function roundedTilePath(c, x, y, TS, same, r) {
  const n = same(0, -1), s = same(0, 1), w = same(-1, 0), e = same(1, 0);
  c.roundRect(x, y, TS + 0.5, TS + 0.5, [(!n && !w) ? r : 0, (!n && !e) ? r : 0, (!s && !e) ? r : 0, (!s && !w) ? r : 0]);
}
const CHUNKS = new Map(); let CHUNK_TS = 0;
function invalidateChunksAt(x, y) { const k = Math.floor(x / 8) + ',' + Math.floor(y / 8); CHUNKS.delete(k); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) CHUNKS.delete(Math.floor((x + dx) / 8) + ',' + Math.floor((y + dy) / 8)); }
const PAT_CACHE = {};
function texPattern(g, key, TS) { const sc = scaled(key, TS * 3, TS * 3); return sc ? g.createPattern(sc, 'repeat') : null; }
function getChunk(cx, cy, TS) {
  const CT = 8;
  if (cx < 0 || cy < 0 || cx * CT >= W || cy * CT >= H) return null;
  if (CHUNK_TS !== TS) { CHUNKS.clear(); CHUNK_TS = TS; }
  const key = cx + ',' + cy; let c = CHUNKS.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = CT * TS;
  const g = c.getContext('2d'); const saved = ctx; ctx = g;
  try {
    const ox = cx * CT * TS, oy = cy * CT * TS;
    const tx0 = Math.max(0, cx * CT - 1), ty0 = Math.max(0, cy * CT - 1), tx1 = Math.min(W - 1, cx * CT + CT), ty1 = Math.min(H - 1, cy * CT + CT);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.translate(-ox, -oy);
    // 地表：按地区使用不同材质
    const byTex = {};
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) { const r = ridAt(x, y); (byTex[r] = byTex[r] || []).push([x, y]); }
    for (const r in byTex) {
      g.save(); g.beginPath(); byTex[r].forEach(([x, y]) => g.rect(x * TS - 0.5, y * TS - 0.5, TS + 1, TS + 1)); g.clip();
      g.fillStyle = { desert: '#d8b070', snow: '#e8f0f8', volcano: '#4a3430', forest: '#3f7040' }[r] || '#7fc552'; g.fillRect(ox - TS, oy - TS, c.width + 2 * TS, c.height + 2 * TS);
      const p = texPattern(g, REGION_TEX[r], TS); if (p) { g.fillStyle = p; g.fillRect(ox - TS, oy - TS, c.width + 2 * TS, c.height + 2 * TS); }
      if (r === 'flower') { g.fillStyle = 'rgba(255,200,230,0.12)'; g.fillRect(ox - TS, oy - TS, c.width + 2 * TS, c.height + 2 * TS); }
      if (r === 'forest') { g.fillStyle = 'rgba(10,40,30,0.25)'; g.fillRect(ox - TS, oy - TS, c.width + 2 * TS, c.height + 2 * TS); }
      g.restore();
    }
    g.save(); g.globalAlpha = 0.45; g.drawImage(NOISE_CANVAS, 0, 0, 48, 48, -TS * 2, -TS * 2, W * TS + TS * 4, H * TS + TS * 4); g.restore();
    const sameAt = (x, y, f) => (dx, dy) => f(tileAt(x + dx, y + dy));
    // 小路
    g.beginPath();
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (isPathLike(MAP[y][x]) || MAP[y][x] === T.GATE) roundedTilePath(g, x * TS, y * TS, TS, sameAt(x, y, t => isPathLike(t) || t === T.BUILD || t === T.GATE || t === T.BRIDGE || t === T.BRIDGEX), TS * 0.35);
    g.save(); g.shadowColor = 'rgba(60,40,10,0.45)'; g.shadowBlur = TS * 0.12; const pp = texPattern(g, 'path', TS); g.fillStyle = pp || '#e2c98f'; g.fill(); g.restore();
    g.save(); g.clip(); g.strokeStyle = 'rgba(120,90,40,0.35)'; g.lineWidth = TS * 0.12; g.stroke(); g.restore();
    // 水 / 熔岩
    const liquid = (test, rim, cols, deep) => {
      const path = new Path2D(), exact = new Path2D(); let any = false;
      for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (test(MAP[y][x])) {
        any = true; const same = sameAt(x, y, test), r = TS * 0.45; roundedTilePath(path, x * TS, y * TS, TS, same, r);
        const n = same(0, -1), so = same(0, 1), w = same(-1, 0), e = same(1, 0); exact.roundRect(x * TS, y * TS, TS, TS, [(!n && !w) ? r : 0, (!n && !e) ? r : 0, (!so && !e) ? r : 0, (!so && !w) ? r : 0]);
      }
      if (!any) return;
      g.save(); g.strokeStyle = rim; g.lineWidth = TS * 0.22; g.lineJoin = 'round'; g.stroke(path); g.strokeStyle = 'rgba(40,30,20,0.35)'; g.lineWidth = TS * 0.08; g.stroke(path); g.restore();
      g.save(); g.clip(path);
      const wg = g.createLinearGradient(0, oy, 0, oy + c.height); wg.addColorStop(0, cols[0]); wg.addColorStop(1, cols[1]); g.fillStyle = wg; g.fillRect(ox - TS, oy - TS, c.width + 2 * TS, c.height + 2 * TS);
      const fr = new Path2D(); fr.rect(ox - TS * 4, oy - TS * 4, c.width + TS * 8, c.height + TS * 8); fr.addPath(exact);
      g.shadowColor = deep; g.shadowBlur = TS * 0.4; g.fillStyle = deep; g.fill(fr, 'evenodd'); g.shadowBlur = 0; g.restore();
    };
    const snowy = ridAt(cx * CT + 4, cy * CT + 4) === 'snow';
    liquid(isWaterLike, snowy ? '#cfe6f5' : '#d8c48e', snowy ? ['#8fd0f0', '#5aa8e0'] : ['#2f8fd8', '#1c64b8'], snowy ? 'rgba(40,90,150,0.7)' : 'rgba(5,30,70,0.85)');
    liquid(t => t === T.LAVA, '#3a2420', ['#ff8a2a', '#d0300a'], 'rgba(90,10,0,0.9)');
    // 已修好的桥面
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (MAP[y][x] === T.BRIDGE) drawPlanks(g, x, y, TS, false);
    // 花、草丛底色、悬崖
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const t = MAP[y][x], r = ridAt(x, y);
      if (t === T.FLOWER) drawFlowers(x * TS, y * TS, TS, x, y, r);
      else if (t === T.GROUND && hash(x * 5, y * 3) > 0.84 && r !== 'snow' && r !== 'volcano' && r !== 'desert') drawTuftSmall(x * TS + TS * hash(x, y * 2), y * TS + TS * (0.4 + 0.5 * hash(y, x)), TS);
      else if (t === T.GROUND && r === 'desert' && hash(x * 5, y * 3) > 0.9) { g.fillStyle = 'rgba(150,100,50,0.4)'; g.beginPath(); g.ellipse(x * TS + TS * 0.5, y * TS + TS * 0.6, TS * 0.12, TS * 0.06, 0, 0, 6.28); g.fill(); }
      else if (t === T.GROUND && r === 'volcano' && hash(x * 5, y * 3) > 0.88) { g.strokeStyle = 'rgba(255,110,40,0.5)'; g.lineWidth = TS * 0.03; g.beginPath(); g.moveTo(x * TS + TS * 0.2, y * TS + TS * 0.4); g.lineTo(x * TS + TS * 0.5, y * TS + TS * 0.55); g.lineTo(x * TS + TS * 0.75, y * TS + TS * 0.45); g.stroke(); }
      else if (t === T.TALL) { g.fillStyle = 'rgba(30,70,30,0.3)'; g.fillRect(x * TS, y * TS, TS + 0.5, TS + 0.5); }
    }
  } finally { ctx = saved; }
  CHUNKS.set(key, c);
  if (CHUNKS.size > 30) CHUNKS.delete(CHUNKS.keys().next().value);
  return c;
}
function drawPlanks(g, x, y, TS, broken) {
  const vert = isWaterLike(tileAt(x, y - 1)) || isWaterLike(tileAt(x, y + 1)) || tileAt(x, y - 1) === T.PATH || tileAt(x, y + 1) === T.PATH;
  const X = x * TS, Y = y * TS;
  g.save(); g.translate(X + TS / 2, Y + TS / 2); if (!vert) g.rotate(Math.PI / 2);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-TS * 0.42, -TS * 0.5, TS * 0.84, TS);
  for (let i = 0; i < 4; i++) { if (broken && (i === 1 || i === 2)) continue; const gy = -TS * 0.5 + i * TS * 0.25; const gr = g.createLinearGradient(0, gy, 0, gy + TS * 0.22); gr.addColorStop(0, '#d8a060'); gr.addColorStop(1, '#8a5428'); g.fillStyle = gr; g.fillRect(-TS * 0.45, gy + TS * 0.015, TS * 0.9, TS * 0.21); }
  g.fillStyle = '#5c3416'; g.fillRect(-TS * 0.48, -TS * 0.5, TS * 0.07, TS); g.fillRect(TS * 0.41, -TS * 0.5, TS * 0.07, TS);
  g.restore();
}
function drawFlowers(X, Y, TS, x, y, r) {
  const cols = r === 'snow' ? [['#9fd8ff', '#e8f6ff'], ['#ffffff', '#eef6ff']] : r === 'desert' ? [['#ff8a4c', '#ffd1b0'], ['#ffd23f', '#fff1b0']] : r === 'volcano' ? [['#ff5a2a', '#ffb070']] : [['#ff7aa2', '#ffd0de'], ['#ffd23f', '#fff1b0'], ['#ffffff', '#fff6e8'], ['#b98cff', '#e6d6ff'], ['#ff8a4c', '#ffd1b0']];
  const n = r === 'flower' ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const h1 = hash(x * 7 + i, y * 13 - i), h2 = hash(y * 5 + i * 3, x * 11 + i);
    const fx = X + TS * (0.12 + 0.76 * h1), fy = Y + TS * (0.15 + 0.75 * h2), rr = TS * (0.055 + 0.03 * hash(i, x + y));
    const c = cols[Math.floor(hash(x + i * 3, y) * cols.length)];
    ctx.strokeStyle = '#3d8f35'; ctx.lineWidth = TS * 0.018; ctx.beginPath(); ctx.moveTo(fx, fy + TS * 0.12); ctx.quadraticCurveTo(fx, fy + TS * 0.05, fx, fy); ctx.stroke();
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + h1; ctx.fillStyle = k % 2 ? c[0] : c[1]; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * rr * 0.75, fy + Math.sin(a) * rr * 0.6, rr * 0.6, rr * 0.42, a, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#ffcf33'; ctx.beginPath(); ctx.arc(fx, fy, rr * 0.35, 0, 6.28); ctx.fill();
  }
}
function drawTuftSmall(x, y, TS) {
  for (let i = -2; i <= 2; i++) { ctx.strokeStyle = i % 2 ? '#4a9a38' : '#6cbc48'; ctx.lineWidth = TS * 0.022; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + i * TS * 0.03, y); ctx.quadraticCurveTo(x + i * TS * 0.04, y - TS * 0.08, x + i * TS * 0.06, y - TS * (0.13 + 0.03 * (2 - Math.abs(i)))); ctx.stroke(); }
}
// ---------- 物件 ----------
function propOf(x, y, t) {
  const r = ridAt(x, y), h = hash(x * 3 + 1, y * 5 + 2);
  if (t === T.CLIFF) return ['boulder_red', 1.35];
  if (r === 'desert') return h < 0.6 ? ['cactus', 1.15] : ['boulder_red', 1.2];
  if (r === 'snow') return h < 0.5 ? ['snowpine', 1.6] : ['pine_snow', 1.6];
  if (r === 'volcano') return h < 0.55 ? ['lavarock', 1.2] : ['boulder', 1.15];
  if (r === 'forest') return ['tree_dark', 1.95];
  if (r === 'flower') return h < 0.45 ? ['tree_bloom', 1.75] : ['tree', 1.75];
  return ['tree', 1.75];
}
function drawProp(x, y, TS, t) {
  const [key, sz] = propOf(x, y, t), img = IMG[key];
  const h = hash(x * 2 + 1, y * 3 + 7), s = 0.9 + h * 0.22, w = TS * sz * s;
  const cx = (x + 0.5) * TS + (h - 0.5) * TS * 0.22, by = (y + 1) * TS + TS * 0.05;
  shadowEllipse(ctx, cx + TS * 0.12, by - TS * 0.08, w * 0.42, TS * 0.26, 0.42);
  if (!img) { ctx.fillStyle = '#2e7d3a'; ctx.beginPath(); ctx.arc(cx, by - TS, TS * 0.7, 0, 6.28); ctx.fill(); return; }
  const hh = w * img.height / img.width, sw = key.startsWith('tree') || key.includes('pine') ? Math.sin(NOW * 0.9 + x * 0.7 + y * 0.3) * 0.012 : 0;
  ctx.save(); ctx.translate(cx, by); if (sw) ctx.transform(1, 0, sw, 1, 0, 0); ctx.drawImage(scaled(key, w, hh), -w / 2, -hh, w, hh); ctx.restore();
}
function drawTallGrass(x, y, TS, part) {
  const r = ridAt(x, y), key = { desert: 'tallgrass_dry', snow: 'tallgrass_snow', volcano: 'tallgrass_ash', forest: 'tallgrass_dark', flower: 'tallgrass_pink' }[r] || 'tallgrass';
  const img = IMG[key] || IMG.tallgrass; if (!img) return;
  const rt = RUSTLE.get(x + ',' + y), rust = rt !== undefined ? Math.max(0, 1 - (NOW - rt) / 0.6) : 0;
  [[0.22, 0.55], [0.72, 0.6], [0.47, 0.98], [0.02, 1.0], [0.95, 0.95]].forEach(([ox, oy], i) => {
    const front = oy >= 0.8; if ((part === 'back') === front) return;
    const w = TS * ((front ? 0.56 : 0.62) + 0.18 * hash(x + i, y)), hgt = w * img.height / img.width;
    const bx = x * TS + (ox + (hash(x * 3 + i, y * 5) - 0.5) * 0.16) * TS, by = y * TS + (oy + (hash(x + i * 7, y * 2) - 0.5) * 0.08) * TS;
    const sw = Math.sin(NOW * 1.9 + x * 0.6 + y * 0.45 + i) * 0.07 + Math.sin(NOW * 30) * rust * 0.25;
    ctx.save(); ctx.translate(bx, by); ctx.transform(1, 0, sw, 1, 0, 0); ctx.drawImage(scaled(IMG[key] ? key : 'tallgrass', w, hgt), -w / 2, -hgt * 0.92, w, hgt); ctx.restore();
  });
}
function drawFence(x, y, TS) {
  const X = x * TS, Y = y * TS;
  const wood = (x0, y0, w, h) => { const g = ctx.createLinearGradient(x0, y0, x0 + w, y0); g.addColorStop(0, '#9a6232'); g.addColorStop(0.4, '#d39a5c'); g.addColorStop(1, '#8a5428'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, Math.min(w, h) * 0.3); ctx.fill(); };
  const rail = yy => { const g = ctx.createLinearGradient(0, Y + yy, 0, Y + yy + TS * 0.1); g.addColorStop(0, '#e0aa6a'); g.addColorStop(1, '#8a5428'); ctx.fillStyle = g; ctx.fillRect(X - 1, Y + yy, TS + 2, TS * 0.1); };
  rail(TS * 0.28); rail(TS * 0.48); wood(X + TS * 0.1, Y + TS * 0.12, TS * 0.16, TS * 0.56); wood(X + TS * 0.62, Y + TS * 0.12, TS * 0.16, TS * 0.56);
}
function drawSign(x, y, TS) {
  const X = x * TS, Y = y * TS;
  shadowEllipse(ctx, X + TS * 0.5, Y + TS * 0.88, TS * 0.3, TS * 0.08, 0.35);
  ctx.fillStyle = '#7a4a24'; ctx.fillRect(X + TS * 0.45, Y + TS * 0.45, TS * 0.1, TS * 0.45);
  const bg = ctx.createLinearGradient(0, Y + TS * 0.08, 0, Y + TS * 0.55); bg.addColorStop(0, '#e8b878'); bg.addColorStop(1, '#a8703c');
  ctx.fillStyle = bg; ctx.strokeStyle = '#5c3416'; ctx.lineWidth = TS * 0.03; ctx.beginPath(); ctx.roundRect(X + TS * 0.1, Y + TS * 0.1, TS * 0.8, TS * 0.42, TS * 0.06); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(92,52,22,0.6)'; ctx.lineWidth = TS * 0.025;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(X + TS * 0.2, Y + TS * (0.2 + i * 0.1)); ctx.lineTo(X + TS * (0.8 - i * 0.12), Y + TS * (0.2 + i * 0.1)); ctx.stroke(); }
}
function drawBuilding(b, TS) {
  const key = 'house_' + b.kind, img = IMG[key];
  const w = (b.w + 0.5) * TS, cx = (b.x + b.w / 2) * TS, by = (b.y + b.h) * TS + TS * 0.12;
  shadowEllipse(ctx, cx + TS * 0.3, by - TS * 0.1, w * 0.55, TS * 0.45, 0.4);
  if (img) { const hh = w * img.height / img.width; ctx.drawImage(scaled(key, w, hh), cx - w / 2, by - hh, w, hh); }
  else { ctx.fillStyle = '#f3ead2'; ctx.fillRect(b.x * TS, b.y * TS, b.w * TS, b.h * TS); }
  const lbl = { center: '灵兽中心', shop: '星星商店', home: '' }[b.kind];
  if (lbl) { ctx.save(); ctx.font = '800 ' + Math.round(TS * 0.26) + 'px ' + FONT; const tw = ctx.measureText(lbl).width; ctx.fillStyle = 'rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.roundRect(cx - tw / 2 - TS * 0.15, by + TS * 0.05, tw + TS * 0.3, TS * 0.38, TS * 0.19); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lbl, cx, by + TS * 0.25); ctx.restore(); }
}
function drawPersonSprite(key, cx, by, TS, dir, prog, moving, npc, run) {
  if (!key) key = 'hero_' + dir;
  const img = IMG[key]; const hgt = TS * 1.32;
  shadowEllipse(ctx, cx, by - TS * 0.02, TS * 0.3, TS * 0.1, 0.45);
  if (!img) { ctx.fillStyle = '#3a70e0'; ctx.fillRect(cx - TS * 0.2, by - TS, TS * 0.4, TS); return; }
  const w = hgt * img.width / img.height, ph = moving ? prog * Math.PI : 0;
  const bob = moving ? Math.abs(Math.sin(ph * 2)) * TS * (run ? 0.08 : 0.05) : 0, rot = moving ? Math.sin(ph * 2) * (run ? 0.08 : 0.05) : 0;
  const br = npc ? Math.sin(NOW * 2 + cx) * 0.012 : 0;
  ctx.save(); ctx.translate(cx, by - bob); ctx.rotate(rot); ctx.scale(1 - br * 0.5, 1 + br); ctx.drawImage(scaled(key, w, hgt), -w / 2, -hgt, w, hgt); ctx.restore();
}
function bubble(cx, y, TS, s, col) {
  const k = 1 + Math.sin(NOW * 4) * 0.05; ctx.save(); ctx.translate(cx, y + Math.sin(NOW * 3) * TS * 0.05); ctx.scale(k, k);
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = TS * 0.1; ctx.beginPath(); ctx.roundRect(-TS * 0.24, -TS * 0.3, TS * 0.48, TS * 0.46, TS * 0.14); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = col || '#e8343a'; ctx.font = '900 ' + Math.round(TS * 0.32) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, -TS * 0.06); ctx.restore();
}
function objDone(o) { return !!G.flags.objs[o.id]; }
function drawObj(o, TS) {
  const cx = (o.x + 0.5) * TS, by = (o.y + 1) * TS - TS * 0.06;
  const img = (k, w) => { const im = IMG[k]; if (!im) return 0; const h = w * im.height / im.width; ctx.drawImage(scaled(k, w, h), cx - w / 2, by - h, w, h); return h; };
  if (o.type === 'chest' || o.type === 'gold') {
    if (objDone(o)) return;
    const gold = o.type === 'gold';
    if (gold) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(NOW * 3); ctx.drawImage(glowSprite('#ffd23a'), cx - TS, by - TS * 1.4, TS * 2, TS * 2); ctx.restore(); }
    shadowEllipse(ctx, cx, by, TS * 0.36, TS * 0.1, 0.4);
    const h = img(gold ? 'chest_gold' : 'chest', TS * 0.85 * (1 + Math.sin(NOW * 2 + o.x) * 0.02));
    if (gold && hash(Math.floor(NOW * 3), o.x) > 0.7) text('✦', cx + rnd(-TS * 0.4, TS * 0.4), by - h * rnd(0.3, 1), TS * 0.25, '#fff6c0', 'center', '900');
    return;
  }
  if (o.type === 'stele') {
    shadowEllipse(ctx, cx, by, TS * 0.34, TS * 0.1, 0.4);
    const h = img('stele', TS * 0.8);
    if (!objDone(o)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(NOW * 2.5 + o.y); ctx.drawImage(glowSprite('#b9a4ff'), cx - TS * 0.6, by - h * 0.9, TS * 1.2, TS * 1.2); ctx.restore(); }
    return;
  }
  if (o.type === 'shrine') {
    // 朱红鸟居 + 漂浮的传说灵兽剪影
    const w = TS * 1.6, h = TS * 1.5, col = '#d8302a';
    shadowEllipse(ctx, cx, by, TS * 0.8, TS * 0.16, 0.4);
    ctx.save(); ctx.fillStyle = col; ctx.fillRect(cx - w * 0.36, by - h, TS * 0.14, h); ctx.fillRect(cx + w * 0.36 - TS * 0.14, by - h, TS * 0.14, h);
    ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.moveTo(cx - w * 0.6, by - h - TS * 0.1); ctx.quadraticCurveTo(cx, by - h + TS * 0.05, cx + w * 0.6, by - h - TS * 0.1); ctx.lineTo(cx + w * 0.55, by - h + TS * 0.06); ctx.quadraticCurveTo(cx, by - h + TS * 0.2, cx - w * 0.55, by - h + TS * 0.06); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(cx - w * 0.5, by - h + TS * 0.12, w, TS * 0.12); ctx.fillRect(cx - w * 0.45, by - h * 0.72, w * 0.9, TS * 0.1); ctx.restore();
    if (!objDone(o)) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.3 * Math.sin(NOW * 2); ctx.drawImage(glowSprite('#ffd23a'), cx - TS * 1.2, by - TS * 2.2, TS * 2.4, TS * 2.4); ctx.restore();
      drawCreature(ctx, o.sp, cx, by - TS * 0.35 + Math.sin(NOW * 1.5) * TS * 0.08, TS * 1.1, { silhouette: 'rgba(255,220,120,0.55)', t: NOW });
      bubble(cx, by - TS * 2.1, TS, '传', '#e0a000');
    }
    return;
  }
  if (o.type === 'trophy') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(glowSprite('#ffe58a'), cx - TS * 1.2, by - TS * 1.8, TS * 2.4, TS * 2.4); ctx.restore(); shadowEllipse(ctx, cx, by, TS * 0.3, TS * 0.1, 0.4); img('trophy', TS * 0.75); return; }
  const key = o.img || 'npc_old';
  drawPersonSprite(key, cx, by, TS, 'down', 0, false, o);
  if (o.type === 'trainer' && !objDone(o)) bubble(cx, by - TS * 1.55, TS, '!', '#e8343a');
  if (o.type === 'master' && !G.flags.badges[o.region]) bubble(cx, by - TS * 1.6, TS, '算', '#8a4aff');
  if (o.type === 'movetutor') bubble(cx, by - TS * 1.55, TS, '技', '#ff6a2a');
  if (o.type === 'merchant') bubble(cx, by - TS * 1.55, TS, '★', '#e0a000');
  if (o.id === 'prof' && !G.flags.profTalk) bubble(cx, by - TS * 1.55, TS, '?', '#2a7aff');
}
function drawGateTile(x, y, TS, t) {
  const cx = (x + 0.5) * TS, by = (y + 1) * TS;
  const gate = GATES.find(g => g.tiles.some(([a, b]) => a === x && b === y));
  if (t === T.GATE) {
    const im = IMG.gate; if (im) { const w = TS * 1.5, h = w * im.height / im.width; shadowEllipse(ctx, cx, by - TS * 0.05, w * 0.45, TS * 0.14, 0.45); ctx.drawImage(scaled('gate', w, h), cx - w / 2, by - h, w, h); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(NOW * 3); ctx.drawImage(glowSprite('#7ff0e2'), cx - TS * 0.5, by - TS * 1.25, TS, TS); ctx.restore();
    text('?', cx, by - TS * 0.75, TS * 0.45, '#ffffff', 'center', '900', 'middle', true);
  } else if (t === T.STONE) {
    const im = IMG.boulder; if (im) { const w = TS * 1.1, h = w * im.height / im.width; shadowEllipse(ctx, cx, by - TS * 0.05, w * 0.42, TS * 0.12, 0.45); ctx.drawImage(scaled('boulder', w, h), cx - w / 2, by - h, w, h); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(NOW * 2.2 + x); ctx.drawImage(glowSprite('#b9a4ff'), cx - TS * 0.5, by - TS * 1.0, TS, TS); ctx.restore();
    text('÷', cx, by - TS * 0.55, TS * 0.42, '#f0e8ff', 'center', '900', 'middle', true);
  } else if (t === T.BRIDGEX) {
    drawPlanks(ctx, x, y, TS, true);
    if (gate && gate.tiles[0][0] === x && gate.tiles[0][1] === y) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(NOW * 3); ctx.drawImage(glowSprite('#ffd23a'), cx - TS * 0.6, by - TS * 1.4, TS * 1.2, TS * 1.2); ctx.restore(); text('?', cx, by - TS * 0.8, TS * 0.45, '#fff', 'center', '900', 'middle', true); }
  }
}
// ---------- 主绘制 ----------
function playerPos() { const p = G.player; return p.moving ? [p.fx + (p.x - p.fx) * p.prog, p.fy + (p.y - p.fy) * p.prog] : [p.x, p.y]; }
function drawWorld() {
  const TS = tileSize(), p = G.player;
  if (!NOISE_CANVAS) NOISE_CANVAS = makeNoise();
  const [fx, fy] = playerPos(), ppx = fx * TS, ppy = fy * TS;
  let tx = clamp(ppx + TS / 2 - CW / 2, 0, W * TS - CW), ty = clamp(ppy + TS / 2 - CH / 2 - TS * 0.3, 0, H * TS - CH);
  if (!W_CAM.init || W_CAM.ts !== TS) { W_CAM.x = tx; W_CAM.y = ty; W_CAM.init = true; W_CAM.ts = TS; }
  const lk = 1 - Math.exp(-LAST_DT * 9); W_CAM.x += (tx - W_CAM.x) * lk; W_CAM.y += (ty - W_CAM.y) * lk;
  const camX = Math.round(W_CAM.x), camY = Math.round(W_CAM.y);
  const x0 = Math.max(0, Math.floor(camX / TS) - 1), y0 = Math.max(0, Math.floor(camY / TS) - 1);
  const x1 = Math.min(W - 1, Math.ceil((camX + CW) / TS) + 1), y1 = Math.min(H - 1, Math.ceil((camY + CH) / TS) + 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#1a3020'; ctx.fillRect(0, 0, CW, CH);
  const cpx = 8 * TS;
  for (let cy = Math.floor(camY / cpx); cy <= Math.floor((camY + CH) / cpx); cy++) for (let cx = Math.floor(camX / cpx); cx <= Math.floor((camX + CW) / cpx); cx++) { const ch = getChunk(cx, cy, TS); if (ch) ctx.drawImage(ch, cx * cpx - camX, cy * cpx - camY); }
  ctx.save(); ctx.translate(-camX, -camY);
  // 水面与熔岩动画
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = MAP[y][x];
    if (t === T.WATER) {
      for (let k = 0; k < 2; k++) { const ph = NOW * 0.9 + hash(x, y + k) * 6.28, cx = x * TS + TS * (0.2 + 0.6 * hash(x + k, y)), cy = y * TS + TS * (0.3 + k * 0.35); ctx.strokeStyle = 'rgba(160,220,255,' + (0.16 + 0.12 * Math.sin(ph)) + ')'; ctx.lineWidth = TS * 0.035; ctx.beginPath(); ctx.moveTo(cx - TS * 0.22, cy); ctx.quadraticCurveTo(cx, cy - TS * 0.07 * Math.sin(ph * 1.3), cx + TS * 0.22, cy); ctx.stroke(); }
      if (hash(x * 3, y * 7) > 0.6) { const s = (Math.sin(NOW * 3 + hash(x, y) * 30) + 1) / 2; ctx.fillStyle = 'rgba(255,255,255,' + s * 0.7 + ')'; ctx.beginPath(); ctx.arc(x * TS + TS * hash(y, x), y * TS + TS * hash(x, x + y), TS * 0.03 * s + 1, 0, 6.28); ctx.fill(); }
    } else if (t === T.LAVA) {
      const ph = NOW * 1.3 + hash(x, y) * 6.28; ctx.globalAlpha = 0.35 + 0.25 * Math.sin(ph); ctx.drawImage(glowSprite('#ffb040'), x * TS - TS * 0.3, y * TS - TS * 0.3, TS * 1.6, TS * 1.6); ctx.globalAlpha = 1;
      if (Math.random() < 0.004) WORLD_FX.push({ x: x + Math.random(), y: y + Math.random(), vx: 0, vy: -1.5, r: 0, vr: 0, t: 0, life: 1.2, c: '#ffcf60', ember: true });
    }
  }
  ctx.restore();
  // 深度排序
  const ents = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = MAP[y][x];
    if (t === T.TREE || t === T.CLIFF) ents.push({ y: (y + 1) * TS - 1, d: () => drawProp(x, y, TS, t) });
    else if (t === T.TALL) { ents.push({ y: (y + 0.6) * TS, d: () => drawTallGrass(x, y, TS, 'back') }); ents.push({ y: (y + 1) * TS + 0.5, d: () => drawTallGrass(x, y, TS, 'front') }); }
    else if (t === T.FENCE) ents.push({ y: (y + 0.7) * TS, d: () => drawFence(x, y, TS) });
    else if (t === T.SIGN) ents.push({ y: (y + 0.9) * TS, d: () => drawSign(x, y, TS) });
    else if (t === T.GATE || t === T.STONE) ents.push({ y: (y + 1) * TS - 2, d: () => drawGateTile(x, y, TS, t) });
    else if (t === T.BRIDGEX) ents.push({ y: y * TS, d: () => drawGateTile(x, y, TS, t) });
  }
  BUILDINGS.forEach(b => { if (b.x + b.w >= x0 - 2 && b.x <= x1 + 2 && b.y + b.h >= y0 - 3 && b.y <= y1 + 1) ents.push({ y: (b.y + b.h) * TS, d: () => drawBuilding(b, TS) }); });
  OBJS.forEach(o => { if (o.x >= x0 - 1 && o.x <= x1 + 1 && o.y >= y0 - 1 && o.y <= y1 + 1) ents.push({ y: (o.y + 1) * TS - 2, d: () => drawObj(o, TS) }); });
  ents.push({ y: ppy + TS - 2, d: () => drawPersonSprite(null, ppx + TS / 2, ppy + TS - TS * 0.06, TS, p.dir, p.prog, p.moving, null, p.run) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.d());
  // 粒子（草屑、火星）
  for (let i = WORLD_FX.length - 1; i >= 0; i--) {
    const f = WORLD_FX[i]; f.t += LAST_DT; if (f.t > f.life) { WORLD_FX.splice(i, 1); continue; }
    f.x += f.vx * LAST_DT; f.y += f.vy * LAST_DT; if (!f.ember) f.vy += 3 * LAST_DT; f.r += f.vr * LAST_DT;
    ctx.save(); ctx.translate(f.x * TS, f.y * TS); ctx.rotate(f.r); ctx.globalAlpha = 1 - f.t / f.life;
    if (f.ember) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(f.c), -TS * 0.08, -TS * 0.08, TS * 0.16, TS * 0.16); }
    else { ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(0, 0, TS * 0.06, TS * 0.022, 0, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  if (G.pendingEnc) { const k = 1 - G.pendingEnc.t / 0.7, s = Math.min(1, k * 4); ctx.save(); ctx.translate(ppx + TS / 2, ppy - TS * 0.55); ctx.scale(s, s); bubble(0, 0, TS, '!', '#e8343a'); ctx.restore(); }
  ctx.restore();
  drawAmbient(camX, camY, TS);
  // 地区色调（平滑过渡）
  const tgt = REGION_TINT[ridAt(Math.round(fx), Math.round(fy))] || REGION_TINT.meadow;
  for (let i = 0; i < 4; i++) TINT_NOW[i] += (tgt[i] - TINT_NOW[i]) * Math.min(1, LAST_DT * 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(' + Math.round(TINT_NOW[0]) + ',' + Math.round(TINT_NOW[1]) + ',' + Math.round(TINT_NOW[2]) + ',' + TINT_NOW[3].toFixed(3) + ')'; ctx.fillRect(0, 0, CW, CH);
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.45, CW / 2, CH / 2, Math.max(CW, CH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,20,30,0.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, CW, CH);
}
function drawAmbient(camX, camY, TS) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const r = ridAt(G.player.x, G.player.y);
  for (const a of AMBIENT) {
    const wrapX = v => ((v % (CW * 1.2)) + CW * 1.2) % (CW * 1.2) - CW * 0.1, wrapY = v => ((v % (CH * 1.2)) + CH * 1.2) % (CH * 1.2) - CH * 0.1;
    const s = TS * 0.05 * a.z;
    if (r === 'snow') { const px = wrapX(a.x * CW * 1.2 - camX * a.z * 0.6 + Math.sin(NOW * 0.7 + a.ph) * TS * 0.5), py = wrapY(a.y * CH * 1.2 - camY * a.z * 0.6 + NOW * 60 * a.z * (TS / 100)); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(px, py, s * 1.3, 0, 6.28); ctx.fill(); continue; }
    if (r === 'volcano') { const px = wrapX(a.x * CW * 1.2 - camX * a.z * 0.6 + Math.sin(NOW + a.ph) * TS * 0.3), py = wrapY(a.y * CH * 1.2 - camY * a.z * 0.6 - NOW * 40 * a.z * (TS / 100)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(NOW * 3 + a.ph); ctx.drawImage(glowSprite('#ff8a30'), px - s * 2, py - s * 2, s * 4, s * 4); ctx.restore(); continue; }
    if (r === 'desert') { const px = wrapX(a.x * CW * 1.2 - camX * a.z * 0.6 + NOW * 160 * a.z * (TS / 100)), py = wrapY(a.y * CH * 1.2 - camY * a.z * 0.6); ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = s * 0.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + s * 8, py + s); ctx.stroke(); continue; }
    const px = wrapX(a.x * CW * 1.2 - camX * a.z * 0.6 + NOW * 30 * a.z * (TS / 100)), py = wrapY(a.y * CH * 1.2 - camY * a.z * 0.6 + NOW * 14 * a.z * (TS / 100));
    const firefly = r === 'forest' || r === 'lake';
    if (!firefly && (r === 'flower' || a.ph > 3)) { ctx.save(); ctx.translate(px + Math.sin(NOW * 1.3 + a.ph) * TS * 0.3, py); ctx.rotate(NOW * 1.5 + a.ph); ctx.scale(1, Math.abs(Math.sin(NOW * 2 + a.ph)) * 0.7 + 0.3); ctx.globalAlpha = 0.85; ctx.fillStyle = r === 'flower' ? '#ffb0d0' : ['#ffd1e0', '#ffe9a8', '#ffffff'][Math.floor(a.ph) % 3]; ctx.beginPath(); ctx.ellipse(0, 0, s * 1.4, s * 0.8, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
    else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(NOW * 2 + a.ph)); ctx.drawImage(glowSprite(firefly ? '#c8ff7a' : '#fff6c0'), px - s * 3, py - s * 3, s * 6, s * 6); ctx.restore(); }
  }
}
function spawnGrassFx(x, y) { const r = ridAt(x, y); const cols = r === 'snow' ? ['#ffffff', '#dceeff'] : r === 'desert' ? ['#d8b070', '#b89050'] : ['#3f9a3a', '#6cc04a', '#9ad86a']; for (let i = 0; i < 9; i++) WORLD_FX.push({ x: x + 0.5 + rnd(-0.3, 0.3), y: y + 0.75, vx: rnd(-1.2, 1.2), vy: rnd(-2.6, -1.2), r: rnd(0, 6), vr: rnd(-8, 8), t: 0, life: rnd(0.5, 0.9), c: cols[i % cols.length] }); }
// ---------- 迷你地图 / 大地图 ----------
let MINI = null, FOG = null; let FOG_DIRTY = true;
const TILE_COL = { 0: null, 1: '#3f8a35', 2: '#1f5a2a', 3: '#2f7fd0', 4: '#e2c98f', 5: '#f0a0c0', 6: '#8a5428', 7: '#c86a4a', 8: '#f4e0b0', 9: '#a8703c', 10: '#7ff0e2', 11: '#ffd23a', 12: '#c89058', 13: '#b9a4ff', 14: '#ff5a1a', 15: '#8a4a2a' };
const REGION_GROUND = { meadow: '#7fc552', flower: '#a8d870', lake: '#86c86a', forest: '#3f7040', desert: '#e0bc7c', snow: '#eef4fa', volcano: '#5a3a34' };
function buildMini() {
  MINI = document.createElement('canvas'); MINI.width = W; MINI.height = H; const g = MINI.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = MAP[y][x], r = ridAt(x, y); let c = TILE_COL[t] || REGION_GROUND[r]; if (t === T.TREE) c = { desert: '#b08040', snow: '#9ab8c8', volcano: '#3a2420' }[r] || c; if (t === T.TALL) c = { desert: '#c0a060', snow: '#c8e0ea', volcano: '#7a3a2a' }[r] || c; if (t === T.WATER && r === 'snow') c = '#9fd8f0'; g.fillStyle = c; g.fillRect(x, y, 1, 1); }
}
function markExplored(px, py) {
  const R = 9; let ch = false;
  for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) { if (!inMap(x, y) || (x - px) * (x - px) + (y - py) * (y - py) > R * R) continue; const i = y * W + x; if (!G.explored[i]) { G.explored[i] = 1; ch = true; } }
  if (ch) FOG_DIRTY = true;
}
function fogCanvas() {
  if (!FOG) { FOG = document.createElement('canvas'); FOG.width = W; FOG.height = H; }
  if (FOG_DIRTY) { const g = FOG.getContext('2d'), id = g.createImageData(W, H); for (let i = 0; i < W * H; i++) { id.data[i * 4] = 14; id.data[i * 4 + 1] = 20; id.data[i * 4 + 2] = 42; id.data[i * 4 + 3] = G.explored[i] ? 0 : 245; } g.putImageData(id, 0, 0); FOG_DIRTY = false; }
  return FOG;
}
function exploredPct() { let n = 0, t = 0; for (let i = 0; i < W * H; i++) { if (PASSABLE.has(MAP[Math.floor(i / W)][i % W])) { t++; if (G.explored[i]) n++; } } return Math.round(n / Math.max(1, t) * 100); }
function drawMinimap(x, y, w, h) {
  if (!MINI) buildMini();
  const k = 3.2, vw = w / k, vh = h / k; const [fx, fy] = playerPos();
  const sx = clamp(fx - vw / 2, 0, W - vw), sy = clamp(fy - vh / 2, 0, H - vh);
  glass(x - 8, y - 8, w + 16, h + 16, 20, true, 'rgba(127,240,226,0.8)');
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(MINI, sx, sy, vw, vh, x, y, w, h); ctx.drawImage(fogCanvas(), sx, sy, vw, vh, x, y, w, h);
  ctx.imageSmoothingEnabled = true;
  const P = (tx, ty) => [x + (tx + 0.5 - sx) * k, y + (ty + 0.5 - sy) * k];
  OBJS.forEach(o => { if (!G.explored[o.y * W + o.x] || objDone(o)) return; const c = { chest: '#9affb8', gold: '#ffd23a', stele: '#b9a4ff', trainer: '#ff6a6a', master: '#c08aff', shrine: '#ff9a2a' }[o.type]; if (!c) return; const [a, b] = P(o.x, o.y); if (a < x || b < y || a > x + w || b > y + h) return; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a, b, 3.5, 0, 6.28); ctx.fill(); });
  const [px, py] = P(fx, fy); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e8343a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 6 + Math.sin(NOW * 5), 0, 6.28); ctx.fill(); ctx.stroke();
  ctx.restore();
  text(curRegion().n, x + w / 2, y + h + 26, 22, '#fff', 'center', '800', 'middle', true);
}
function drawMapScreen() {
  beginUI();
  ctx.fillStyle = 'rgba(6,10,28,0.85)'; ctx.fillRect(-400, -200, 2400, 1300);
  if (!MINI) buildMini();
  const k = Math.min(1420 / W, 700 / H), w = W * k, h = H * k, x = 800 - w / 2, y = 120;
  text('世界地图', 800, 62, 46, '#fff', 'center', '900', 'middle', true);
  text('已探索 ' + exploredPct() + '%', 1500, 62, 26, '#7ff0e2', 'right', '800');
  glass(x - 14, y - 14, w + 28, h + 28, 24, true, 'rgba(127,240,226,0.8)');
  ctx.imageSmoothingEnabled = false; ctx.drawImage(MINI, x, y, w, h); ctx.globalAlpha = 0.92; ctx.drawImage(fogCanvas(), x, y, w, h); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
  const P = (tx, ty) => [x + (tx + 0.5) * k, y + (ty + 0.5) * k];
  REGIONS.forEach(R => { const seen = (() => { for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) { const xx = R.seed[0] + dx, yy = R.seed[1] + dy; if (inMap(xx, yy) && G.explored[yy * W + xx]) return true; } return false; })(); const [a, b] = P(R.seed[0], R.seed[1]); text(seen ? R.n : '？？？', a, b - 28, 26, seen ? '#fff' : 'rgba(255,255,255,0.5)', 'center', '900', 'middle', true); if (seen) text('Lv.' + R.lv[0] + '~' + R.lv[1], a, b + 2, 18, '#dfe8ff', 'center', '700', 'middle', true); });
  TOWNS.forEach(t => { if (!G.explored[t.y * W + t.x]) return; const [a, b] = P(t.x, t.y); rrect(a - 9, b - 9, 18, 18, 4, '#ff6a4a', '#fff', 2); text(t.n, a, b + 22, 18, '#ffe9c0', 'center', '800', 'middle', true); });
  GATES.forEach(g => { const [gx, gy] = g.tiles[0]; if (!G.explored[gy * W + gx]) return; const [a, b] = P(gx, gy); const open = G.flags.gates[g.id]; ctx.fillStyle = open ? '#7dfc9e' : '#ffd23a'; ctx.beginPath(); ctx.arc(a, b, 8, 0, 6.28); ctx.fill(); text(open ? '✓' : '?', a, b + 1, 14, '#1b2440', 'center', '900'); });
  OBJS.forEach(o => { if (!G.explored[o.y * W + o.x] || objDone(o)) return; const c = { chest: '#9affb8', gold: '#ffd23a', stele: '#b9a4ff', trainer: '#ff6a6a', master: '#c08aff', trophy: '#fff', shrine: '#ff9a2a' }[o.type]; if (!c) return; const [a, b] = P(o.x, o.y); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a, b, 4, 0, 6.28); ctx.fill(); });
  const [fx, fy] = playerPos(); const [px, py] = P(fx, fy); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e8343a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, 9 + Math.sin(NOW * 5) * 2, 0, 6.28); ctx.fill(); ctx.stroke();
  const leg = [['#ff6a4a', '城镇'], ['#ffd23a', '数学之门 / 断桥 / 金宝箱'], ['#7dfc9e', '已解锁'], ['#9affb8', '宝箱'], ['#b9a4ff', '谜题石碑'], ['#ff6a6a', '训练师'], ['#c08aff', '算术大师']];
  leg.forEach(([c, n], i) => { const lx = 120 + i * 200; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(lx, 862, 9, 0, 6.28); ctx.fill(); text(n, lx + 16, 862, 20, '#dfe8ff', 'left', '700'); });
  drawHint('M / X 关闭地图', true);
}
