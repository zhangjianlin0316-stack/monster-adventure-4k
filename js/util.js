'use strict';
// ================== 基础 ==================
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
let DPR = 1, CW = 0, CH = 0;
function resize() {
  DPR = window.devicePixelRatio || 1;
  CW = Math.max(1, Math.round(window.innerWidth * DPR));
  CH = Math.max(1, Math.round(window.innerHeight * DPR));
  cv.width = CW; cv.height = CH;
  cv.style.width = window.innerWidth + 'px';
  cv.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', resize);
resize();
const FONT = '"Noto Sans CJK SC","Noto Sans SC","PingFang SC","Microsoft YaHei","Source Han Sans SC","Noto Serif CJK SC",sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
let NOW = 0, LAST_DT = 0.016;

// ================== 资源加载 ==================
const MON_KEYS = ['fox', 'turtle', 'fawn', 'volt', 'bunny', 'bird', 'lizard', 'jelly', 'shroom', 'beetle', 'seal', 'rock'];
const ASSET_LIST = {
  bg_meadow: 'assets/bg_meadow.jpg', bg_forest: 'assets/bg_forest.jpg', bg_lake: 'assets/bg_lake.jpg', bg_desert: 'assets/bg_desert.jpg',
  bg_snow: 'assets/bg_snow.jpg', bg_volcano: 'assets/bg_volcano.jpg', bg_flower: 'assets/bg_flower.jpg', title_bg: 'assets/title_bg.jpg',
  tree: 'assets/tree.webp', tallgrass: 'assets/tallgrass.webp', house_home: 'assets/house_home.webp', house_center: 'assets/house_center.webp', house_shop: 'assets/house_shop.webp',
  ground: 'assets/ground.jpg', path: 'assets/path.jpg', tex_sand: 'assets/tex_sand.jpg', tex_snow: 'assets/tex_snow.jpg', tex_ash: 'assets/tex_ash.jpg', tex_moss: 'assets/tex_moss.jpg',
  hero_down: 'assets/hero_down.webp', hero_up: 'assets/hero_up.webp', hero_left: 'assets/hero_left.webp', hero_right: 'assets/hero_right.webp',
  npc_prof: 'assets/npc_prof.webp', npc_girl: 'assets/npc_girl.webp', npc_boy: 'assets/npc_boy.webp', npc_old: 'assets/npc_old.webp',
  npc_master: 'assets/npc_master.webp', npc_sage: 'assets/npc_sage.webp', npc_trainer_f: 'assets/npc_trainer_f.webp', npc_trainer_m: 'assets/npc_trainer_m.webp',
  npc_merchant: 'assets/npc_merchant.webp', npc_explorer: 'assets/npc_explorer.webp',
  cactus: 'assets/cactus.webp', pine_snow: 'assets/pine_snow.webp', snowpine: 'assets/snowpine.webp', boulder: 'assets/boulder.webp', lavarock: 'assets/lavarock.webp',
  stele: 'assets/stele.webp', chest: 'assets/chest.webp', chest_gold: 'assets/chest_gold.webp', gate: 'assets/gate.webp', trophy: 'assets/trophy.webp', teacher: 'assets/teacher.webp'
};
const MON_KEYS2 = { moth: 3, otter: 3, owl: 3, cat: 3, golem: 3, dragon: 3, crane: 2, koi: 2, tanuki: 2, qilin: 1, whale: 1, zhulong: 1 };
MON_KEYS.forEach(k => MON_KEYS2[k] = 3);
for (const k in MON_KEYS2) for (let s = 0; s < MON_KEYS2[k]; s++) ASSET_LIST[s ? k + (s + 1) : k] = 'assets/' + (s ? k + (s + 1) : k) + '.webp';
const IMG = {}; let assetsDone = 0; const assetsFailed = [];
const ASSET_TOTAL = Object.keys(ASSET_LIST).length;
for (const k in ASSET_LIST) {
  const im = new Image();
  im.onload = () => { IMG[k] = im; assetsDone++; };
  im.onerror = () => { assetsFailed.push(k); assetsDone++; };
  im.src = ASSET_LIST[k];
}
const assetsReady = () => assetsDone >= ASSET_TOTAL;
// 高质量缩放缓存（逐级减半，避免大图直接缩小产生锯齿）
const SCALE_CACHE = new Map();
function scaled(key, w, h) {
  const im = IMG[key]; if (!im) return null;
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const ck = key + '|' + w + 'x' + h;
  let c = SCALE_CACHE.get(ck); if (c) return c;
  let src = im, sw = im.width, sh = im.height;
  while (sw / 2 > w * 1.05 && sh / 2 > h * 1.05) {
    const t = document.createElement('canvas'); t.width = Math.round(sw / 2); t.height = Math.round(sh / 2);
    const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(src, 0, 0, t.width, t.height);
    src = t; sw = t.width; sh = t.height;
  }
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const cc = c.getContext('2d'); cc.imageSmoothingQuality = 'high'; cc.drawImage(src, 0, 0, w, h);
  if (SCALE_CACHE.size > 500) SCALE_CACHE.clear();
  SCALE_CACHE.set(ck, c);
  return c;
}
const FLASH_CANVAS = document.createElement('canvas');
// 绘制灵兽插画：x,y 为脚底中心；size 为最长边像素
// opt: alpha, flash(0-1), flashColor, back(镜像), breathe, phase, t, sx/sy(挤压拉伸), rot, silhouette(纯色剪影颜色)
const SHINY_HUE = { fox: 200, turtle: 140, fawn: 250, volt: 180, bunny: 300, bird: 120, lizard: 160, jelly: 90, shroom: 200, beetle: 140, seal: 300, rock: 180, moth: 160, otter: 60, owl: 200, cat: 120, golem: 240, dragon: 180, crane: 40, koi: 180, tanuki: 250, qilin: 140, whale: 260, zhulong: 150 };
function drawCreature(c, sp, x, y, size, opt) {
  opt = opt || {};
  const im = IMG[sp];
  const info = (typeof SPECIES !== 'undefined' && SPECIES[sp]) || {};
  size *= info.scale || 1;
  if (!im) { c.save(); c.fillStyle = (TYPES[info.t] || TYPES.normal).c; c.beginPath(); c.ellipse(x, y - size * 0.4, size * 0.35, size * 0.4, 0, 0, 6.28); c.fill(); c.restore(); return; }
  const k = size / Math.max(im.width, im.height);
  const w = im.width * k, h = im.height * k;
  const t = opt.t !== undefined ? opt.t : NOW;
  const br = opt.breathe && (typeof ALIVE === 'undefined' || ALIVE.q === 'low') ? Math.sin(t * 2.4 + (opt.phase || 0)) : 0;
  const sy = (1 + br * 0.018) * (opt.sy || 1), sx = (1 - br * 0.01) * (opt.sx || 1);
  const m = c.getTransform(), dev = Math.hypot(m.a, m.b);
  c.save();
  if (opt.alpha !== undefined) c.globalAlpha *= opt.alpha;
  if (opt.shiny) c.filter = 'hue-rotate(' + (SHINY_HUE[info.line] || 150) + 'deg) saturate(1.25) brightness(1.05)';
  const floaty = info.floaty ? -size * 0.08 + Math.sin(t * 1.6) * size * 0.025 : 0;
  c.translate(x, y + floaty);
  if (opt.rot) { c.translate(0, -h / 2); c.rotate(opt.rot); c.translate(0, h / 2); }
  c.scale(opt.back ? -sx : sx, sy);
  const pw = Math.max(1, Math.round(w * dev * Math.abs(sx))), ph = Math.max(1, Math.round(h * dev * sy));
  const src = (pw < im.width * 0.7) ? scaled(sp, pw, ph) : im;
  // v6：活体变形（呼吸/摆动/尾巴翅膀/眨眼/小动作），见 js/alive.js
  let fr = null;
  if (opt.alive !== false && typeof aliveFrame === 'function' && opt.t !== 0) fr = aliveFrame(sp, src, pw, ph, t, opt);
  let dsrc = src, dw = pw, dh = ph, X0 = -w / 2, Y0 = -h, DW = w, DH = h;
  if (fr) { dsrc = fr.cv; dw = fr.w; dh = fr.h; const kx = w / pw, ky = h / ph; X0 = -w / 2 - fr.m * kx; Y0 = -h - fr.m * ky + (fr.hopY || 0) * ky; DW = fr.w * kx; DH = fr.h * ky; }
  const fl = opt.silhouette ? 1 : opt.flash;
  if (fl) {
    const fc = FLASH_CANVAS; if (fc.width < dw || fc.height < dh) { fc.width = Math.max(fc.width, dw); fc.height = Math.max(fc.height, dh); }
    const f = fc.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, fc.width, fc.height);
    f.imageSmoothingQuality = 'high'; f.drawImage(dsrc, 0, 0, dw, dh, 0, 0, dw, dh);
    f.globalCompositeOperation = 'source-atop'; f.fillStyle = opt.silhouette || opt.flashColor || ('rgba(255,255,255,' + fl + ')'); f.fillRect(0, 0, dw, dh);
    c.drawImage(fc, 0, 0, dw, dh, X0, Y0, DW, DH);
  } else if (fr) {
    c.drawImage(dsrc, 0, 0, dw, dh, X0, Y0, DW, DH);
  } else {
    c.drawImage(src, -w / 2, -h, w, h);
  }
  c.restore();
}
function shadowEllipse(c, x, y, rx, ry, a) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(10,25,10,' + a + ')'); g.addColorStop(0.6, 'rgba(10,25,10,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(10,25,10,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill(); c.restore();
}

// ================== UI 绘制工具（玻璃质感） ==================
function uiScale() { return Math.min(CW / 1600, CH / 900); }
function beginUI() { const s = uiScale(); ctx.setTransform(s, 0, 0, s, (CW - 1600 * s) / 2, (CH - 900 * s) / 2); }
function rrect(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 4; ctx.stroke(); }
}
function text(s, x, y, size, color, align, weight, base, shadow) {
  ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
  if (shadow) { ctx.fillStyle = shadow === true ? 'rgba(0,0,0,0.45)' : shadow; ctx.fillText(s, x + size * 0.04, y + size * 0.06); }
  ctx.fillStyle = color || '#222'; ctx.fillText(s, x, y);
}
function glass(x, y, w, h, r, dark, accent) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,10,30,0.35)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 8;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (dark) { g.addColorStop(0, 'rgba(26,38,78,0.92)'); g.addColorStop(1, 'rgba(14,22,50,0.94)'); }
  else { g.addColorStop(0, 'rgba(255,255,255,0.96)'); g.addColorStop(1, 'rgba(230,238,252,0.93)'); }
  rrect(x, y, w, h, r, g);
  ctx.restore();
  // 顶部高光
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  const hg = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  hg.addColorStop(0, dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.8)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg; ctx.fillRect(x, y, w, h * 0.5);
  if (accent) { const ag = ctx.createLinearGradient(x, 0, x + w, 0); ag.addColorStop(0, accent); ag.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = ag; ctx.fillRect(x, y, w, 6); }
  ctx.restore();
  rrect(x + 1.5, y + 1.5, w - 3, h - 3, r - 1.5, null, dark ? 'rgba(160,200,255,0.35)' : 'rgba(255,255,255,0.95)', 3);
  rrect(x, y, w, h, r, null, dark ? 'rgba(0,0,0,0.4)' : 'rgba(40,60,110,0.25)', 1.5);
}
function typeBadge(t, x, y, w, h) {
  w = w || 92; h = h || 40;
  const c = TYPES[t].c, g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, lighten(c, 0.35)); g.addColorStop(1, c);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; rrect(x, y, w, h, h / 2, g); ctx.restore();
  rrect(x + 1, y + 1, w - 2, h - 2, h / 2, null, 'rgba(255,255,255,0.6)', 2);
  typeIcon(t, x + h * 0.55, y + h / 2, h * 0.3);
  text(TYPES[t].n, x + w / 2 + h * 0.22, y + h / 2 + 1, h * 0.55, '#fff', 'center', '800', 'middle', 'rgba(0,0,0,0.3)');
}
function typeIcon(t, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.25;
  ctx.beginPath();
  if (t === 'fire') { ctx.moveTo(0, -r); ctx.quadraticCurveTo(r, 0, 0, r); ctx.quadraticCurveTo(-r, 0, 0, -r); ctx.fill(); }
  else if (t === 'water') { ctx.moveTo(0, -r); ctx.quadraticCurveTo(r, r * 0.3, 0, r); ctx.quadraticCurveTo(-r, r * 0.3, 0, -r); ctx.fill(); }
  else if (t === 'grass') { ctx.ellipse(0, 0, r * 0.5, r, 0.6, 0, 6.28); ctx.fill(); }
  else if (t === 'electric') { ctx.moveTo(r * 0.3, -r); ctx.lineTo(-r * 0.5, r * 0.1); ctx.lineTo(0, r * 0.1); ctx.lineTo(-r * 0.3, r); ctx.lineTo(r * 0.5, -r * 0.1); ctx.lineTo(0, -r * 0.1); ctx.closePath(); ctx.fill(); }
  else if (t === 'ice') { for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.moveTo(0, -r); ctx.lineTo(0, r); } ctx.stroke(); }
  else if (t === 'rock') { ctx.moveTo(-r * 0.9, r * 0.6); ctx.lineTo(-r * 0.4, -r * 0.7); ctx.lineTo(r * 0.5, -r * 0.8); ctx.lineTo(r * 0.95, r * 0.5); ctx.closePath(); ctx.fill(); }
  else { ctx.arc(0, 0, r * 0.7, 0, 6.28); ctx.stroke(); }
  ctx.restore();
}
function lighten(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function hpBar(x, y, w, cur, max, trail, h) {
  h = h || 24;
  const r = clamp(cur / max, 0, 1), tr = clamp((trail === undefined ? cur : trail) / max, 0, 1);
  const col = r > 0.5 ? ['#7dfc9e', '#1fb257'] : r > 0.2 ? ['#ffe27a', '#e8a412'] : ['#ff8a8a', '#d92c2c'];
  rrect(x, y, w, h, h / 2, 'rgba(20,28,50,0.85)');
  const lw = 54;
  text('HP', x + 14, y + h / 2 + 1, h * 0.72, '#ffd860', 'left', '900');
  const bx = x + lw, bw = w - lw - 6, by = y + 4, bh = h - 8;
  rrect(bx, by, bw, bh, bh / 2, '#0b0f1c');
  if (tr > r) rrect(bx, by, Math.max(bh, bw * tr), bh, bh / 2, 'rgba(255,90,90,0.85)');
  if (r > 0) {
    const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    rrect(bx, by, Math.max(bh, bw * r), bh, bh / 2, g);
    rrect(bx + 3, by + 2, Math.max(bh - 6, bw * r - 6), bh * 0.35, bh * 0.2, 'rgba(255,255,255,0.45)');
  }
}
function arrow(x, y, s) {
  s = s || 1; const o = Math.sin(NOW * 7) * 4;
  ctx.save(); ctx.translate(x + o, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(255,120,60,0.8)'; ctx.shadowBlur = 12;
  const g = ctx.createLinearGradient(-10, 0, 12, 0); g.addColorStop(0, '#ffb04a'); g.addColorStop(1, '#ff5a3a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-11, -14); ctx.lineTo(12, 0); ctx.lineTo(-11, 14); ctx.quadraticCurveTo(-5, 0, -11, -14); ctx.fill();
  ctx.restore();
}
function selBar(x, y, w, h) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(255,190,90,0.35)'); g.addColorStop(1, 'rgba(255,190,90,0.05)');
  rrect(x, y, w, h, h / 2, g, 'rgba(255,170,70,0.7)', 2.5);
}
function wrapText(s, x, y, maxW, size, lh, color, weight, shadow) {
  ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT;
  let line = '', yy = y, n = 1;
  for (const ch of s) {
    if (ctx.measureText(line + ch).width > maxW) { text(line, x, yy, size, color, 'left', weight, 'middle', shadow); ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT; line = ''; yy += lh; n++; }
    line += ch;
  }
  text(line, x, yy, size, color, 'left', weight, 'middle', shadow);
  return n;
}
function drawBallIcon(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = r * 0.4; ctx.shadowOffsetY = r * 0.12;
  const top = ctx.createRadialGradient(-r * 0.35, -r * 0.5, r * 0.1, 0, 0, r); top.addColorStop(0, '#7ff0e2'); top.addColorStop(1, '#127c74');
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fillStyle = top; ctx.fill(); ctx.shadowColor = 'transparent';
  const bot = ctx.createRadialGradient(-r * 0.3, r * 0.1, r * 0.1, 0, 0, r); bot.addColorStop(0, '#ffffff'); bot.addColorStop(1, '#c4ccd8');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fillStyle = bot; ctx.fill();
  ctx.lineWidth = r * 0.13; ctx.strokeStyle = '#1b2333';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, 6.28); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 6.28); ctx.fillStyle = '#9ff7ee'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.52, r * 0.22, r * 0.12, -0.6, 0, 6.28); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
  ctx.restore();
}
// 右上角按钮：音量 + 全屏
function topButtons() { const s = uiScale(); const r = 30 * s; return { snd: { x: CW - 150 * s, y: 44 * s, r }, fs: { x: CW - 70 * s, y: 44 * s, r } }; }
function drawTopButtons() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = uiScale(), b = topButtons();
  const btn = (o, draw) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14;
    const g = ctx.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, 'rgba(40,56,100,0.85)'); g.addColorStop(1, 'rgba(18,26,56,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(200,225,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    draw(); ctx.restore();
  };
  btn(b.snd, () => {
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-7, -6); ctx.lineTo(2, -14); ctx.lineTo(2, 14); ctx.lineTo(-7, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill();
    if (AudioSys.muted) { ctx.strokeStyle = '#ff7a7a'; ctx.beginPath(); ctx.moveTo(8, -7); ctx.lineTo(18, 7); ctx.moveTo(18, -7); ctx.lineTo(8, 7); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(4, 0, 8, -0.9, 0.9); ctx.stroke(); if (AudioSys.vol > 0.4) { ctx.beginPath(); ctx.arc(4, 0, 15, -0.9, 0.9); ctx.stroke(); } }
  });
  btn(b.fs, () => {
    const f = !!document.fullscreenElement, a = f ? -1 : 1;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      ctx.beginPath(); const cx = sx * 12, cy = sy * 12;
      ctx.moveTo(cx - sx * 7 * a * (f ? -1 : 1) * 0 + (f ? -sx * 7 : 0), cy - (f ? 0 : sy * 7));
      if (f) { ctx.moveTo(cx - sx * 7, cy); ctx.lineTo(cx - sx * 7, cy - sy * 7); ctx.lineTo(cx, cy - sy * 7); }
      else { ctx.moveTo(cx, cy - sy * 7); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * 7, cy); }
      ctx.stroke();
    });
  });
  // 音量提示
  if (G.volShow > 0) {
    beginUI(); ctx.globalAlpha = Math.min(1, G.volShow * 3);
    glass(1200, 90, 340, 112, 35, true);
    if (typeof Voice !== 'undefined') text(Voice.enabled ? '🗣 语音 ' + Math.round(Voice.vol * 100) + '%（N 开关，[ ] 调节）' : '🗣 语音已关闭（N 键开启）', 1225, 178, 20, '#ffe9a8', 'left', '700');
    text(AudioSys.muted ? '🔇 已静音（V 键切换）' : '🔊 音量 ' + Math.round(AudioSys.vol * 100) + '%', 1225, 126, 28, '#fff', 'left', '700');
    if (!AudioSys.muted) { rrect(1225, 146, 290, 6, 3, 'rgba(255,255,255,0.2)'); rrect(1225, 146, 290 * AudioSys.vol, 6, 3, '#7ff0e2'); }
    ctx.globalAlpha = 1;
  }
}
function drawHint(str, top) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = uiScale();
  ctx.save(); ctx.scale(s, s);
  ctx.font = '600 22px ' + FONT; const tw = ctx.measureText(str).width;
  const hx = top ? CW / s - tw - 60 : 24, hy = top ? 90 : CH / s - 58;
  rrect(hx, hy, tw + 36, 40, 20, 'rgba(10,18,40,0.62)', 'rgba(255,255,255,0.25)', 1.5);
  text(str, hx + 18, hy + 21, 22, '#f2f6ff', 'left', '600');
  ctx.restore();
}
function drawToast() {
  if (!G.toast) return;
  beginUI();
  const a = Math.min(1, G.toast.t * 3), sl = (1 - Math.min(1, (2.2 - G.toast.t) * 6)) * -30;
  ctx.globalAlpha = a;
  ctx.font = '700 32px ' + FONT; const tw = ctx.measureText(G.toast.text).width;
  glass(800 - tw / 2 - 40, 96 + sl, tw + 80, 66, 33, true, 'rgba(127,240,226,0.9)');
  text(G.toast.text, 800, 130 + sl, 32, '#fff', 'center', '700');
  ctx.globalAlpha = 1;
}

// 带分数标记 {n/d} 的数学文字：分数上下排列渲染。返回宽度。
function mathTextWidth(s, size, weight) {
  ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT; let w = 0;
  String(s).split(/(\{\d+\/\d+\})/).forEach(p => { const m = /^\{(\d+)\/(\d+)\}$/.exec(p); if (m) { ctx.font = (weight || '700') + ' ' + size * 0.72 + 'px ' + FONT; w += Math.max(ctx.measureText(m[1]).width, ctx.measureText(m[2]).width) + size * 0.3; ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT; } else w += ctx.measureText(p).width; });
  return w;
}
function mathText(s, x, y, size, color, align, weight) {
  const w = mathTextWidth(s, size, weight); let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  String(s).split(/(\{\d+\/\d+\})/).forEach(p => {
    if (!p) return; const m = /^\{(\d+)\/(\d+)\}$/.exec(p);
    if (m) {
      const fs2 = size * 0.72; ctx.font = (weight || '700') + ' ' + fs2 + 'px ' + FONT;
      const fw = Math.max(ctx.measureText(m[1]).width, ctx.measureText(m[2]).width); const mx = cx + size * 0.15 + fw / 2;
      text(m[1], mx, y - size * 0.36, fs2, color, 'center', weight); text(m[2], mx, y + size * 0.42, fs2, color, 'center', weight);
      ctx.fillStyle = color; ctx.fillRect(cx + size * 0.1, y - size * 0.03, fw + size * 0.1, Math.max(2, size * 0.07));
      cx += fw + size * 0.3;
    } else { text(p, cx, y, size, color, 'left', weight); ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT; cx += ctx.measureText(p).width; }
  });
  return w;
}
// 自动换行的数学文字（分数作为不可分割的整体）
function mathWrap(s, x, y, maxW, size, lh, color, weight, align) {
  const toks = String(s).match(/\{\d+\/\d+\}|[A-Za-z0-9.]+|./gu) || []; const lines = []; let line = '';
  for (const t of toks) { if (mathTextWidth(line + t, size, weight) > maxW && line) { lines.push(line); line = t.trim() ? t : ''; } else line += t; }
  if (line) lines.push(line);
  lines.forEach((l, i) => mathText(l, x, y + i * lh, size, color, align, weight));
  return lines.length;
}
function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeBack(t) { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
const lerp = (a, b, t) => a + (b - a) * t;
