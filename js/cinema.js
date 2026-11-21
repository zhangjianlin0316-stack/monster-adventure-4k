// ================== v4：火影风格战斗演出（技能特写 / 奥义 / 连击 / 冲击帧 / 灵力槽）==================
// ---- 新增特效配方 ----
Object.assign(FXDEF, {
  stars: { type: 'proj', c: ['#ffffff', '#ffd23a'], pk: 'star', size: 40, count: 5, arc: 60, starProj: 1 },
  clones: { type: 'contact', c: ['#ffffff', '#c8b8ff'], multi: 5, clones: 1, slash: 2 },
  gigaimpact: { type: 'contact', c: ['#fff6c0', '#ff8a2a'], speed: 1, boom: 1, pk: 'spark' },
  firefang: { type: 'contact', c: ['#ffd060', '#ff4a1a'], fang: 1, pk: 'ember' },
  heatwave: { type: 'wave', c: ['#ffe080', '#ff5a1a'], pk: 'ember' },
  aquajet: { type: 'contact', c: ['#e0f6ff', '#2a8aff'], slash: 2, speed: 1, pk: 'drop' },
  waterpulse: { type: 'proj', c: ['#d8f4ff', '#2a8aff'], pk: 'drop', size: 90, arc: 40, pulse: 1 },
  seedbomb: { type: 'proj', c: ['#c8ff8a', '#4a9a2a'], pk: 'leaf', size: 26, count: 5, arc: 160 },
  leafstorm: { type: 'vortex', c: ['#c8ff9a', '#2f8a2a'], pk: 'leaf', big: 1, wind: 1 },
  thunderfang: { type: 'contact', c: ['#fffbd0', '#ffd23a'], fang: 1, zap: 1, pk: 'spark' },
  volttackle: { type: 'contact', c: ['#fffbd0', '#ffd23a'], zap: 1, speed: 1, pk: 'spark' },
  icespear: { type: 'proj', c: ['#ffffff', '#66ccee'], pk: 'shard', size: 56, count: 3, arc: 20 },
  rockblast: { type: 'proj', c: ['#e8c890', '#8a5a2a'], pk: 'rock', size: 46, count: 3, arc: 100 },
  meteorfist: { type: 'contact', c: ['#ffd8a0', '#a8502a'], pk: 'rock', crackHit: 1 },
  talisman: { type: 'proj', c: ['#fff4c0', '#ff3a3a'], size: 44, count: 7, arc: 120, talisman: 1 },
  needles: { type: 'proj', c: ['#ffffff', '#ffd23a'], size: 50, count: 12, arc: 30, needles: 1 },
  inkbreath: { type: 'stream', c: ['#3a4a7a', '#0a0f20'], pk: 'smoke', ink: 1 },
  inkvortex: { type: 'vortex', c: ['#5a6aa0', '#101830'], pk: 'smoke', big: 1, ink: 1 },
  inkclaw: { type: 'contact', c: ['#c8d0ff', '#101830'], slash: 3, ink: 1 },
  // 奥义基础形态
  ult_sky: { type: 'sky', n: 14, big: 1, boom: 1, ult: 1 },
  ult_wave: { type: 'wave', big: 1, ult: 1 },
  ult_vortex: { type: 'vortex', big: 1, ult: 1, wind: 1 },
  ult_beam: { type: 'beam', w: 210, charge: 1, ult: 1 },
  ult_area: { type: 'area', boom: 1, vines: 1, spikes: 1, ult: 1 },
  ult_clones: { type: 'contact', multi: 7, clones: 1, slash: 3, ult: 1 },
  ult_ink: { type: 'vortex', big: 1, ink: 1, ult: 1 }
});
// 每个带 base 的招式：复制基础特效并换上灵兽专属配色
(function buildFx() {
  const dropOf = { ember: 'meteor', bolt: 'bolt', rock: 'rock', star: 'meteor', leaf: 'meteor', shard: 'meteor', drop: 'meteor', petal: 'meteor', meteor: 'meteor', tail: 'tail' };
  for (const id in MOVES) {
    const fx = MOVES[id].fx; if (!fx.base) continue;
    const b = FXDEF[fx.base]; if (!b) { console.warn('no fx base', fx.base); continue; }
    const d = Object.assign({}, b, { c: fx.col || b.c });
    if (fx.pk) { d.pk = fx.pk === 'bolt' ? 'spark' : fx.pk === 'tail' ? 'ember' : fx.pk; if (d.type === 'sky') d.drop = dropOf[fx.pk] || 'meteor'; }
    if (d.type === 'sky' && !d.drop) d.drop = 'meteor';
    FXDEF[fx.k] = d;
  }
})();
const isUlt = id => !!(MOVES[id] && MOVES[id].ult);
// ---- 动作：瞬身（blink）——消失→出现在目标身侧→斩击→闪回 ----
const _motionOf = motionOf;
motionOf = function (m, u, H, dir, dist) {
  if (m === 'blink') {
    const o = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, glow: 0, alpha: 1, blink: 0 };
    if (u < 0.18) { const q = u / 0.18; o.sx = 1 - 0.5 * q; o.sy = 1 + 0.4 * q; o.alpha = 1 - q; o.blink = q; }
    else if (u < H) { o.x = dist * 0.62 * dir; o.y = -50; o.alpha = clamp((u - 0.18) / 0.08, 0, 1); o.sx = 1.1; o.sy = 0.92; o.blink = 1 - o.alpha; }
    else if (u < H + 0.22) { o.x = dist * 0.62 * dir + 30 * dir; o.y = -40; o.rot = 0.15 * dir; }
    else { const q = Math.min(1, (u - H - 0.22) / 0.14); o.x = dist * 0.62 * dir * (1 - q); o.alpha = q < 0.5 ? 1 - q * 2 : (q - 0.5) * 2; o.blink = 1 - o.alpha; }
    return o;
  }
  return _motionOf(m, u, H, dir, dist);
};
// ---- 招式时长：普通技能也有短特写，招牌技更长，奥义最长 ----
moveTiming = function (id) {
  const mv = MOVES[id], fx = mv.fx, sig = fx.sig || 0, def = FXDEF[fx.k];
  const cut = mv.ult ? 2.7 : sig === 2 ? 1.5 : sig === 1 ? 0.95 : mv.p > 0 ? 0.55 : 0;
  const base = def.type === 'sky' || def.type === 'vortex' || def.type === 'wave' || def.type === 'area' ? 1.35 : def.type === 'beam' || def.type === 'stream' ? 1.25 : 1.0;
  const H = def.type === 'beam' || def.type === 'stream' ? 0.42 : def.type === 'sky' ? 0.5 : def.type === 'vortex' ? 0.4 : def.type === 'contact' ? 0.42 : 0.5;
  return { cut, dur: cut + base * (mv.ult ? 1.9 : sig ? 1.35 : 1), H };
};
// ---- 招式主体特效的扩展层 ----
function inkBlot(x, y, r, col, a, seed) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i <= 18; i++) { const an = i / 18 * 6.283, rr = r * (0.72 + 0.4 * hash(seed, i)); ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
  ctx.fill();
  for (let i = 0; i < 6; i++) { const an = hash(seed, i + 30) * 6.283, d = r * (1.1 + hash(seed, i + 40) * 0.7); ctx.beginPath(); ctx.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, r * 0.08 * (1 + hash(seed, i + 50)), 0, 6.283); ctx.fill(); }
  ctx.restore();
}
const _drawMoveFx = drawMoveFx;
drawMoveFx = function (B, A, u, S, Tg, dt) {
  const mv = MOVES[A.move], fx = mv.fx, d = FXDEF[fx.k], H = A.H, c1 = d.c[0], c2 = d.c[1], dir = A.side === 'p' ? 1 : -1;
  const mon = A.side === 'p' ? active() : B.enemy;
  // 影分身：在目标四周出现分身轮番斩击
  if (d.clones && u > 0.12 && u < H + 0.35) {
    const n = d.ult ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const t0 = 0.12 + i * (H - 0.1) / n, q = clamp((u - t0) / 0.28, 0, 1); if (q <= 0 || q >= 1) continue;
      const an = i / n * 6.283 + 0.6, r = 260 - q * 160, x = Tg.x + Math.cos(an) * r, y = Tg.y + 60 + Math.sin(an) * r * 0.45;
      drawCreature(ctx, mon.sp, x, y + 120, (A.side === 'p' ? 360 : 300), { back: false, alpha: Math.sin(q * Math.PI) * 0.85, flash: 0.55, flashColor: hexA(c2, 0.7), sx: Math.cos(an) > 0 ? -1 : 1 });
      if (q > 0.6 && !A['cl' + i]) { A['cl' + i] = 1; addStar(B, Tg.x + rnd(-60, 60), Tg.y + rnd(-60, 60), c2, false); burst(Tg.x, Tg.y, 10, { c: [c1, c2], k: 'spark', sp1: 700 }); B.shake = Math.max(B.shake, 12); AudioSys.sfx('slash'); }
    }
  }
  // 符咒 / 千本针：自绘投射物，跳过默认光球
  if (d.talisman || d.needles) {
    const n = d.count;
    for (let j = 0; j < n; j++) {
      const delay = j * 0.035, q = clamp((u - 0.15 - delay) / (H - 0.15), 0, 1); if (q <= 0 || q >= 1) continue;
      const ox = (hash(j, 3) - 0.5) * 160, oy = (hash(j, 5) - 0.5) * 140;
      const x = S.x + (Tg.x + ox * q - S.x) * q, y = S.y + (Tg.y + oy * q - S.y) * q - Math.sin(q * Math.PI) * d.arc * (hash(j, 7) + 0.5);
      ctx.save(); ctx.translate(x, y);
      if (d.talisman) { ctx.rotate(Math.sin(NOW * 8 + j) * 0.5); ctx.fillStyle = '#fff4c8'; ctx.fillRect(-18, -34, 36, 68); ctx.strokeStyle = c2; ctx.lineWidth = 4; ctx.strokeRect(-14, -30, 28, 60); ctx.fillStyle = c2; ctx.font = '900 30px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('灵', 0, 0); }
      else { ctx.rotate(Math.atan2(Tg.y - S.y, Tg.x - S.x)); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c1; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(30, 0); ctx.stroke(); glowOrb(30, 0, 22, c2); }
      ctx.restore();
    }
    return;
  }
  // 墨染：攻击时周围泼墨
  if (d.ink && u > 0.1 && u < 1 && Math.random() < 0.35) A.inks = (A.inks || []).concat([{ x: Tg.x + rnd(-320, 320), y: Tg.y + rnd(-220, 160), r: rnd(30, 90), t: 0, s: Math.floor(Math.random() * 999) }]).slice(-26);
  if (A.inks) A.inks.forEach(k => { k.t += dt; inkBlot(k.x, k.y, k.r * Math.min(1, k.t * 6), hexA(c2, 1), Math.max(0, 0.75 - k.t * 0.5), k.s); });
  _drawMoveFx(B, A, u, S, Tg, dt);
  if (d.starProj && u < H) for (let j = 0; j < d.count; j++) { const q = clamp((u - 0.15 - j * 0.05) / (H - 0.15), 0, 1); if (q > 0 && q < 1) { const x = S.x + (Tg.x - S.x) * q, y = S.y + (Tg.y - S.y) * q - Math.sin(q * Math.PI) * 60 + (hash(j, 2) - 0.5) * 120 * q; ctx.save(); ctx.translate(x, y); ctx.rotate(NOW * 16 + j); ctx.fillStyle = c1; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 34, an = i / 10 * 6.283; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.fill(); ctx.restore(); } }
  if (d.pulse && u < H) { const q = clamp((u - 0.15) / (H - 0.15), 0, 1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const qq = Math.max(0, q - i * 0.08), x = S.x + (Tg.x - S.x) * qq, y = S.y + (Tg.y - S.y) * qq; ctx.strokeStyle = hexA(c2, 0.8 - i * 0.2); ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(x, y, 60 + i * 20, 90 + i * 30, Math.atan2(Tg.y - S.y, Tg.x - S.x), 0, 6.283); ctx.stroke(); } ctx.restore(); }
};
// ---- 奥义：背景切换（暗色世界 + 旋转光芒 + 属性色）----
function drawUltBackdrop(B, A, u) {
  const d = FXDEF[MOVES[A.move].fx.k], c2 = d.c[1], c1 = d.c[0];
  const a = Math.min(1, u * 5) * (u > 0.88 ? (1 - u) / 0.12 : 1);
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,16,' + 0.62 * a + ')'; ctx.fillRect(-400, -300, 2400, 1500);
  ctx.globalCompositeOperation = 'lighter';
  const cx = A.side === 'p' ? 1150 : 500, cy = 320;
  for (let i = 0; i < 18; i++) {
    const an = i / 18 * 6.283 + NOW * 0.4;
    ctx.fillStyle = hexA(i % 2 ? c2 : c1, 0.1 * a);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * 2200, cy + Math.sin(an) * 2200); ctx.lineTo(cx + Math.cos(an + 0.12) * 2200, cy + Math.sin(an + 0.12) * 2200); ctx.fill();
  }
  ctx.drawImage(softSprite(c2), cx - 700, cy - 700, 1400, 1400);
  ctx.globalAlpha = a * 0.7; ctx.drawImage(glowSprite(c1), cx - 260, cy - 260, 520, 520);
  ctx.restore();
}
// ---- 技能特写（UI 坐标系 1600×900）----
const BRUSH = '"STXingkai","STKaiti","KaiTi","Kaiti SC","Noto Serif CJK SC","Source Han Serif SC","Songti SC",serif';
function brushBand(cx, cy, w, h, seed, fill) {
  ctx.beginPath();
  const n = 26;
  for (let i = 0; i <= n; i++) { const x = cx - w / 2 + w * i / n; ctx.lineTo(x, cy - h / 2 + (hash(seed, i) - 0.5) * h * 0.22 + (i === 0 || i === n ? h * 0.3 : 0)); }
  for (let i = n; i >= 0; i--) { const x = cx - w / 2 + w * i / n; ctx.lineTo(x, cy + h / 2 + (hash(seed + 7, i) - 0.5) * h * 0.22 - (i === 0 || i === n ? h * 0.3 : 0)); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function hanko(x, y, s, txt, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || -0.08);
  ctx.fillStyle = '#d8202a'; rrect(-s / 2, -s / 2, s, s, s * 0.12, '#d8202a');
  ctx.strokeStyle = '#fff3e0'; ctx.lineWidth = s * 0.05; ctx.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
  ctx.fillStyle = '#fff3e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (txt.length === 2) { ctx.font = '900 ' + Math.round(s * 0.36) + 'px ' + BRUSH; ctx.fillText(txt[0], 0, -s * 0.18); ctx.fillText(txt[1], 0, s * 0.2); }
  else { ctx.font = '900 ' + Math.round(s * 0.6) + 'px ' + BRUSH; ctx.fillText(txt, 0, s * 0.03); }
  ctx.restore();
}
// 书法逐字显现
function brushTitle(str, x, y, size, t, col, align) {
  ctx.save(); ctx.font = '900 ' + size + 'px ' + BRUSH; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const ws = [...str].map(ch => ctx.measureText(ch).width * 0.96), tot = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'right' ? x - tot : align === 'center' ? x - tot / 2 : x;
  [...str].forEach((ch, i) => {
    const k = clamp((t - i * 0.06) / 0.16, 0, 1); const w = ws[i];
    if (k > 0) {
      const sc = 1 + (1 - easeOut(k)) * 1.4, px = cx + w / 2;
      if (k < 1 || true) inkBlot(px, y + size * 0.05, size * 0.5 * easeOut(k), 'rgba(0,0,0,0.55)', 0.6 * k, i * 13 + str.length);
      ctx.save(); ctx.translate(px, y); ctx.scale(sc, sc); ctx.globalAlpha = k;
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(10,6,20,0.92)'; ctx.strokeText(ch, 0, 0);
      ctx.lineWidth = size * 0.05; ctx.strokeStyle = col; ctx.strokeText(ch, 0, 0);
      const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#fff4d0'); g.addColorStop(1, lighten(col, 0.3));
      ctx.fillStyle = g; ctx.fillText(ch, 0, 0); ctx.restore();
    }
    cx += w;
  });
  ctx.restore();
  return tot;
}
// 立绘特写：在指定区域里放大灵兽的脸部
function portrait(sp, cx, cy, size, faceK, opt) { const sc = (SPECIES[sp] && SPECIES[sp].scale) || 1; drawCreature(ctx, sp, cx, cy + size * sc * (faceK || 0.76), size, Object.assign({ back: false, t: 0 }, opt || {})); }
function drawCutInV4(B, A, t) {
  const mv = MOVES[A.move], fx = mv.fx, cut = A.cut; if (t > cut) return;
  if (mv.ult) return drawUltCut(B, A, t);
  const tier = fx.sig || 0, k = t / cut, inK = easeOut(Math.min(1, k * 5)), outK = k > 0.8 ? (k - 0.8) / 0.2 : 0;
  const mon = A.side === 'p' ? active() : B.enemy, col = FXDEF[fx.k].c[1] || TYPES[mv.t].c, isP = A.side === 'p';
  ctx.save();
  ctx.fillStyle = 'rgba(5,6,18,' + (0.22 + tier * 0.18) * inK * (1 - outK) + ')'; ctx.fillRect(-800, -400, 3200, 1700);
  if (tier) { const bar = (70 + tier * 25) * inK * (1 - outK); ctx.fillStyle = '#000'; ctx.fillRect(-800, -400, 3200, 400 + bar); ctx.fillRect(-800, 900 - bar, 3200, bar + 400); }
  const H = tier === 0 ? 200 : tier === 1 ? 270 : 320, cy = tier === 0 ? (isP ? 330 : 380) : 450;
  ctx.translate(800, cy); ctx.rotate(isP ? -0.1 : 0.1);
  const bx = ((1 - inK) * -1900 + outK * 1900) * (isP ? 1 : -1);
  ctx.save(); ctx.translate(bx, 0);
  // 墨色笔刷横幅 + 属性色底
  brushBand(0, 0, 2300, H + 30, 11 + tier, hexA(col, 0.95));
  brushBand(0, 0, 2300, H, 23 + tier, 'rgba(12,10,26,0.94)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const y = -H / 2 + hash(i, 1) * H, x = ((hash(i, 2) * 2600 + t * 3600) % 2600) - 1300; ctx.strokeStyle = hexA(i % 3 ? '#ffffff' : col, 0.35); ctx.lineWidth = 2 + hash(i, 4) * 4; ctx.beginPath(); ctx.moveTo(x * (isP ? 1 : -1), y); ctx.lineTo((x + 180 + hash(i, 3) * 260) * (isP ? 1 : -1), y); ctx.stroke(); }
  ctx.restore();
  // 立绘（脸部特写，镜头缓慢推进）
  ctx.save(); ctx.beginPath(); ctx.rect(-1150, -H / 2 + 6, 2300, H - 12); ctx.clip();
  const ps = (tier === 0 ? 760 : tier === 1 ? 980 : 1200) * (1 + k * 0.08), px = isP ? -470 : 470;
  glowOrb(px, 0, H * 0.9, col);
  portrait(mon.sp, px + (isP ? 1 : -1) * k * 40, 0, ps, 0.74, { flash: 0 });
  ctx.restore();
  // 招式名（书法字）
  const nameSize = tier === 0 ? 96 : tier === 1 ? 118 : 136;
  const tx = isP ? -40 : 40;
  brushTitle(mv.n, tx, -6, nameSize, t * (tier ? 1.1 : 1.6), col, isP ? 'left' : 'right');
  hanko(isP ? tx - 70 : tx + 70, -10, tier ? 92 : 72, tier === 2 ? '秘技' : tier === 1 ? '招牌' : '技');
  if (tier) { ctx.font = '800 30px ' + FONT; ctx.fillStyle = '#ffe9a0'; ctx.textAlign = isP ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.fillText(tier === 2 ? '★★ 终极招牌技 ★★' : '★ 进化招牌技 ★', tx, H / 2 - 34); }
  ctx.restore(); ctx.restore();
  // 二阶以上：眼部特写细条
  if (tier >= 1 && k > 0.15) {
    const q = easeOut(clamp((k - 0.15) / 0.2, 0, 1)) * (1 - outK), ey = tier === 2 ? 140 : 150, eh = 110;
    ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = '#000'; ctx.fillRect(-800, ey - eh / 2 - 6, 3200, eh + 12);
    ctx.beginPath(); ctx.rect(-800, ey - eh / 2, 3200, eh); ctx.clip();
    ctx.fillStyle = hexA(col, 0.4); ctx.fillRect(-800, ey - eh / 2, 3200, eh);
    portrait(mon.sp, 800 + (isP ? -1 : 1) * (1 - q) * 300, ey, 2000, 0.8);
    ctx.restore();
  }
}
// ---- 奥义全屏过场：泼墨转场 → 异空间背景 → 立绘 + 眼部特写 → 书法奥义名 → 白闪 ----
function drawUltCut(B, A, t) {
  const mv = MOVES[A.move], fx = mv.fx, d = FXDEF[fx.k], c1 = d.c[0], c2 = d.c[1], isP = A.side === 'p', sgn = isP ? 1 : -1;
  const mon = A.side === 'p' ? active() : B.enemy, T = A.cut;
  ctx.save();
  // 阶段 0：泼墨盖满屏幕
  const inkK = clamp(t / 0.45, 0, 1), outF = clamp((t - (T - 0.35)) / 0.35, 0, 1);
  if (t < 0.5) {
    for (let i = 0; i < 9; i++) { const ox = isP ? 300 : 1300, x = ox + (hash(i, 1) - 0.5) * 1400 * inkK, y = 450 + (hash(i, 2) - 0.5) * 900 * inkK; inkBlot(x, y, (180 + hash(i, 3) * 260) * easeOut(clamp(inkK * 1.6 - i * 0.07, 0, 1)) * 2.2, '#07060f', 0.97, i * 7); }
  }
  if (t >= 0.38) {
    const a = clamp((t - 0.38) / 0.1, 0, 1) * (1 - outF);
    ctx.globalAlpha = a;
    // 异空间背景
    const cx = isP ? 520 : 1080, cy = 470;
    const g = ctx.createRadialGradient(cx, cy, 60, cx, cy, 1300); g.addColorStop(0, lighten(c2, 0.2)); g.addColorStop(0.35, c2); g.addColorStop(1, '#05040c');
    ctx.fillStyle = g; ctx.fillRect(-800, -400, 3200, 1700);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 28; i++) { const an = i / 28 * 6.283 + t * 0.5 * sgn; ctx.fillStyle = hexA(i % 2 ? c1 : '#ffffff', 0.07); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * 2600, cy + Math.sin(an) * 2600); ctx.lineTo(cx + Math.cos(an + 0.07) * 2600, cy + Math.sin(an + 0.07) * 2600); ctx.fill(); }
    // 漩涡灵力粒子
    for (let i = 0; i < 90; i++) { const an = hash(i, 5) * 6.283 + t * (1.5 + hash(i, 6) * 2) * sgn, r = 120 + ((hash(i, 7) * 900 - t * 520) % 900 + 900) % 900; const x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 0.75, s = 6 + hash(i, 8) * 16; ctx.drawImage(glowSprite(i % 3 ? c1 : '#ffffff'), x - s, y - s, s * 2, s * 2); }
    ctx.restore();
    // 浓墨飞白：四周墨痕
    for (let i = 0; i < 7; i++) inkBlot((i % 2 ? -60 : 1660) + (hash(i, 9) - 0.5) * 200, hash(i, 10) * 900, 120 + hash(i, 11) * 120, 'rgba(5,4,12,0.85)', 1, i * 31);
    // 灵兽全身像 + 灵气
    const zoom = 1 + (t - 0.38) * 0.06, mx = cx, my = 860;
    ctx.save(); ctx.translate(mx, my); ctx.scale(zoom, zoom); ctx.translate(-mx, -my);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (0.6 + 0.3 * Math.sin(t * 20)); ctx.drawImage(softSprite(c1), mx - 560, my - 1050, 1120, 1100); ctx.restore();
    drawCreature(ctx, mon.sp, mx + 10, my + 8, 900, { back: !isP ? false : false, alpha: 0.5, flash: 1, flashColor: hexA(c1, 1), t: 0 });
    drawCreature(ctx, mon.sp, mx, my, 880, { back: false, t: 0 });
    ctx.restore();
    // 眼部特写条
    if (t > 0.75) {
      const q = easeOut(clamp((t - 0.75) / 0.25, 0, 1)), ey = 150, eh = 150;
      ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(-800, ey - eh / 2 - 8, 3200 * q, eh + 16);
      ctx.beginPath(); ctx.rect(-800, ey - eh / 2, 3200 * q, eh); ctx.clip();
      ctx.fillStyle = hexA(c2, 0.55); ctx.fillRect(-800, ey - eh / 2, 3200, eh);
      portrait(mon.sp, (isP ? 1150 : 450) - sgn * (1 - q) * 200, ey, 2100, 0.8);
      ctx.restore();
    }
    // 奥义印章 + 书法名
    if (t > 0.85) {
      const q = clamp((t - 0.85) / 0.15, 0, 1), sc = 1 + (1 - easeOut(q)) * 2;
      ctx.save(); ctx.translate(isP ? 1180 : 420, 150); ctx.scale(sc, sc); ctx.globalAlpha = a * q; hanko(0, 0, 150, '奥义', -0.1 * sgn); ctx.restore();
    }
    if (t > 1.0) {
      const name = mv.n.replace('奥义·', '');
      const sz = Math.min(150, Math.floor(700 / name.length));
      ctx.save(); ctx.translate(isP ? 1350 : 250, 450);
      // 竖排书法
      [...name].forEach((ch, i) => { const k = clamp((t - 1.0 - i * 0.09) / 0.18, 0, 1); if (k <= 0) return; const y = 20 + (i - (name.length - 1) / 2) * sz * 0.98, sc2 = 1 + (1 - easeOut(k)) * 1.6;
        inkBlot(0, y, sz * 0.62 * easeOut(k), 'rgba(0,0,0,0.6)', 0.8, i * 17);
        ctx.save(); ctx.translate(0, y); ctx.scale(sc2, sc2); ctx.globalAlpha = k * a; ctx.font = '900 ' + sz + 'px ' + BRUSH; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.lineWidth = sz * 0.16; ctx.strokeStyle = '#07060f'; ctx.strokeText(ch, 0, 0); ctx.lineWidth = sz * 0.05; ctx.strokeStyle = c2; ctx.strokeText(ch, 0, 0);
        const gg = ctx.createLinearGradient(0, -sz / 2, 0, sz / 2); gg.addColorStop(0, '#ffffff'); gg.addColorStop(1, lighten(c1, 0.2)); ctx.fillStyle = gg; ctx.fillText(ch, 0, 0); ctx.restore(); });
      ctx.restore();
      ctx.font = '900 34px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3c0'; ctx.globalAlpha = a * clamp((t - 1.4) / 0.2, 0, 1);
      ctx.fillText(isP ? '— 灵力全开 —' : '— 对手的奥义 —', isP ? 1350 : 250, 840);
    }
    ctx.globalAlpha = 1;
  }
  // 阶段 2：白闪
  if (t > T - 0.45) { const q = (t - (T - 0.45)) / 0.45, f = q < 0.45 ? q / 0.45 : 1 - (q - 0.45) / 0.55; ctx.fillStyle = 'rgba(255,255,255,' + clamp(f, 0, 1) + ')'; ctx.fillRect(-800, -400, 3200, 1700); }
  ctx.restore();
}
// ---- 连击：分段命中 ----
function onSubHit(B, A, Tg, i, n, amt) {
  const d = FXDEF[MOVES[A.move].fx.k], c1 = d.c[0], c2 = d.c[1];
  const x = Tg.x + rnd(-70, 70), y = Tg.y + rnd(-70, 50);
  burst(x, y, 10, { c: [c1, c2, '#ffffff'], k: 'spark', sp1: 800 });
  addStar(B, x, y, c2, false); addRing(B, x, y, 120, c1, 0.25, 1, 8);
  B.shake = Math.max(B.shake, 12); B.hitStop = Math.max(B.hitStop, 0.035);
  B.cam.kz = Math.max(B.cam.kz, 0.04); B.cam.rot += (Math.random() - 0.5) * 0.03;
  B.nums.push({ x: x + rnd(-20, 20), y: y - 60, t: 0, text: String(amt), c: '#ffffff' });
  B.combo = { n: i + 1, t: 0, side: A.side, c: c2 };
  const def = A.side === 'p' ? 'e' : 'p'; B.react[def] = { t: 0, dir: A.side === 'p' ? 1 : -1, pow: 0.5 };
  AudioSys.sfx(i % 2 ? 'hit' : 'slash');
  addGauge(B, A.side, 3);
}
// ---- 命中扩展：冲击帧 / 碎石 / 镜头旋转 / 慢动作 / 灵力槽 ----
const _onMoveHit = onMoveHit;
onMoveHit = function (B, A, Tg) {
  _onMoveHit(B, A, Tg);
  if (A.miss || !A.dmg) return;
  const mv = MOVES[A.move], d = FXDEF[mv.fx.k], big = mv.ult ? 2.2 : mv.fx.sig ? 1.2 + mv.fx.sig * 0.2 : 1, eff = A.eff || 1;
  const heavy = mv.ult || A.crit || A.ko || eff > 1 || mv.fx.sig >= 2 || mv.p >= 100;
  if (heavy) B.impact = { t: 0, life: mv.ult || A.ko ? 0.2 : 0.1, kind: mv.ult || A.ko ? 'bw' : 'inv', x: Tg.x, y: Tg.y };
  if (A.ko) { B.slow = mv.ult ? 1.3 : 0.9; B.cam.kz = Math.max(B.cam.kz, 0.3); addStamp(B, '击倒！', '#ff5a5a', true); }
  if (heavy || d.pk === 'rock' || d.crack || d.crackHit) {
    const n = Math.round(10 * big);
    for (let i = 0; i < n; i++) pSpawn({ x: Tg.x + rnd(-80, 80), y: Tg.y + 120, vx: rnd(-520, 520), vy: -rnd(500, 1100), ay: 2000, drag: 0.4, life: rnd(0.7, 1.2), s: rnd(10, 26), s1: 8, c: i % 3 ? '#6a5a4a' : '#a89070', k: PK.rock, front: true });
  }
  // 冲击波
  addRing(B, Tg.x, Tg.y, 520 * big, '#ffffff', 0.45, 1, 6);
  B.cam.rot += (A.side === 'p' ? 1 : -1) * (heavy ? 0.06 : 0.025) * (mv.ult ? 1.6 : 1);
  if (mv.ult) { B.shake = Math.max(B.shake, 60); B.flash = Math.max(B.flash, 0.9); B.hitStop = Math.max(B.hitStop, 0.22); B.speedLines = 1; }
  addGauge(B, A.side, mv.ult ? 0 : 8); addGauge(B, A.side === 'p' ? 'e' : 'p', mv.ult ? 10 : 12);
};
// ---- 灵力 / 奥义槽 ----
function addGauge(B, side, v) {
  if (!B || !B.gauge || !v) return;
  const before = B.gauge[side]; B.gauge[side] = Math.min(100, B.gauge[side] + v);
  if (before < 100 && B.gauge[side] >= 100) { B.gaugeFull = B.gaugeFull || {}; B.gaugeFull[side] = 0; if (side === 'p') { AudioSys.sfx('powerup'); addStamp(B, '奥义槽已满！', '#ffb020', true); } }
}
// ---- 灵气：蓄力 / 奥义槽满时围绕灵兽升腾 ----
function drawAura(B, sd, X, Y, size, col, k) {
  if (k <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 * k * (0.75 + 0.25 * Math.sin(NOW * 9));
  ctx.drawImage(softSprite(col), X - size * 0.55, Y - size * 1.0, size * 1.1, size * 1.05);
  ctx.restore();
  if (Math.random() < 0.6 * k) pSpawn({ x: X + rnd(-size * 0.35, size * 0.35), y: Y - rnd(0, size * 0.2), vx: rnd(-20, 20), vy: -rnd(220, 480), ay: -100, drag: 0.6, life: rnd(0.5, 0.9), s: rnd(12, 26), s1: 0, c: Math.random() < 0.3 ? '#ffffff' : col, k: PK.glow, front: false });
  if (Math.random() < 0.25 * k) pSpawn({ x: X + rnd(-size * 0.3, size * 0.3), y: Y - size * rnd(0.1, 0.6), vx: 0, vy: -rnd(300, 600), ay: 0, drag: 0, life: 0.35, s: 30, s1: 0, c: col, k: PK.spark, front: true });
}
// ---- 冲击帧（反色 / 黑白漫画帧）与连击计数器，在屏幕坐标系绘制 ----
function drawImpactFrame(B, dt) {
  const I = B.impact; if (!I) return;
  I.t += dt; if (I.t > I.life) { B.impact = null; return; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (I.kind === 'inv') { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH); }
  else {
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'source-over';
    // 放射状集中线
    const s = uiScale(), cx = CW / 2, cy = CH / 2; ctx.fillStyle = '#000';
    for (let i = 0; i < 70; i++) { const a = hash(i, 3) * 6.283, r0 = Math.min(CW, CH) * (0.22 + hash(i, 4) * 0.12), w = 0.008 + hash(i, 5) * 0.012; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a - w) * CW, cy + Math.sin(a - w) * CW); ctx.lineTo(cx + Math.cos(a + w) * CW, cy + Math.sin(a + w) * CW); ctx.fill(); }
  }
  ctx.restore();
}
function drawComboCounter(B, dt) {
  const C = B.combo; if (!C) return;
  C.t += dt; if (C.t > 1.6 || C.n < 2) { if (C.t > 1.6) B.combo = null; return; }
  const a = C.t > 1.2 ? 1 - (C.t - 1.2) / 0.4 : 1, pop = 1 + Math.max(0, 0.35 - C.t * 2.5);
  const x = C.side === 'p' ? 1000 : 640, y = 250;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.08); ctx.scale(pop, pop);
  ctx.font = 'italic 900 150px ' + FONT; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.lineWidth = 22; ctx.strokeStyle = '#1a0a20'; ctx.strokeText(String(C.n), 0, 0);
  const g = ctx.createLinearGradient(0, -120, 0, 0); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.5, '#ffb020'); g.addColorStop(1, '#ff4a1a'); ctx.fillStyle = g; ctx.fillText(String(C.n), 0, 0);
  ctx.font = 'italic 900 56px ' + FONT; ctx.textAlign = 'left'; ctx.lineWidth = 12; ctx.strokeText('HITS', 12, -6); ctx.fillStyle = '#ffffff'; ctx.fillText('HITS', 12, -6);
  ctx.font = '900 36px ' + FONT; ctx.lineWidth = 9; ctx.strokeText('连击！', 16, -66); ctx.fillStyle = '#7ff0e2'; ctx.fillText('连击！', 16, -66);
  ctx.restore();
}
function drawGaugeBar(x, y, w, h, v, full, label) {
  rrect(x, y, w, h, h / 2, 'rgba(10,14,30,0.75)', 'rgba(255,255,255,0.35)', 1.5);
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ff7a2a'); g.addColorStop(0.6, '#ffc83a'); g.addColorStop(1, '#fff3a0');
  if (v > 0) { ctx.save(); if (full) { ctx.shadowColor = '#ffb020'; ctx.shadowBlur = 18 + 10 * Math.sin(NOW * 8); } rrect(x + 2, y + 2, Math.max(h - 4, (w - 4) * v / 100), h - 4, (h - 4) / 2, g); ctx.restore(); }
  for (let i = 1; i < 4; i++) { ctx.fillStyle = 'rgba(10,14,30,0.6)'; ctx.fillRect(x + w * i / 4 - 1, y + 2, 2, h - 4); }
  if (full) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = x + ((NOW * 300) % w); ctx.drawImage(glowSprite('#ffffff'), sx - h, y - h * 0.5, h * 2, h * 2); ctx.restore(); }
  if (label) text(label + ' ' + Math.round(v) + '%', x + w / 2, y + h / 2 + 1, Math.round(h * 0.8), '#ffffff', 'center', '900', 'middle', 'rgba(0,0,0,0.8)');
}
// ---- 稀有度标签 ----
function rarityTag(rar, x, y, shiny) {
  const R = RARITY[rar || 'common']; if (!R) return;
  const w = shiny ? 150 : 84;
  ctx.save(); ctx.shadowColor = R.c; ctx.shadowBlur = rar === 'legend' || rar === 'epic' ? 14 + 6 * Math.sin(NOW * 5) : 0;
  rrect(x, y - 15, w, 30, 15, R.c); ctx.restore();
  rrect(x, y - 15, w, 30, 15, null, 'rgba(255,255,255,0.85)', 1.5);
  text((rar === 'legend' ? '★' : rar === 'epic' ? '◆' : rar === 'rare' ? '●' : '') + R.n + (shiny ? ' · 异色✦' : ''), x + w / 2, y + 1, 19, '#14102a', 'center', '900');
}
