// ================== v4：灵兽图鉴（稀有度 / 已见 / 已收服 / 异色）==================
function dexWhere(sp) {
  const S = SPECIES[sp]; if (S.rar === 'legend') { const o = OBJS.find(o => o.type === 'shrine' && o.sp === sp); return o ? REGIONS[RIDX[o.region]].n + ' · ' + o.name + '（金色竞赛试炼）' : '神社'; }
  const rs = REGIONS.filter(R => R.pool.some(e => e[0] === sp)).map(R => R.n);
  if (rs.length) return '野外：' + rs.join('、');
  return S.stage ? '由' + SPECIES[S.line].n + '进化而来' : '尚未发现栖息地';
}
function dexStatus(sp) { const F = G.flags; return F.dex && F.dex[sp] ? 2 : F.seen && F.seen[sp] ? 1 : 0; }
const DEX_COLS = 7, DEX_ROWS = 4, DEX_PAGE = DEX_COLS * DEX_ROWS;
function dexInput(k) {
  const U = G.dexUI, n = DEX_ORDER.length;
  if (k === 'cancel' || k === 'dex') { G.dexUI = null; AudioSys.sfx('cancel'); return; }
  const mv = { left: -1, right: 1, up: -DEX_COLS, down: DEX_COLS }[k];
  if (mv) { U.idx = clamp(U.idx + mv, 0, n - 1); AudioSys.sfx('move'); }
  if (k === 'ok') { const sp = DEX_ORDER[U.idx]; if (dexStatus(sp) >= 1) { U.vk = ((U.vk || 0) + 1) % 4; monSay(sp, ['sum', 'sel', 'win', 'ult'][U.vk], 1100, 840); } }
}
function drawDexUI() {
  const U = G.dexUI, n = DEX_ORDER.length;
  beginUI();
  ctx.fillStyle = 'rgba(6,10,26,0.78)'; ctx.fillRect(-400, -200, 2400, 1300);
  glass(40, 30, 1520, 840, 34, true, 'rgba(255,200,90,0.9)');
  const seen = DEX_ORDER.filter(s => dexStatus(s) >= 1).length, caught = DEX_ORDER.filter(s => dexStatus(s) === 2).length;
  text('灵兽图鉴', 80, 78, 44, '#ffd23a', 'left', '900', 'middle', true);
  text('已见 ' + seen + ' / ' + n + '　　已收服 ' + caught + ' / ' + n, 330, 80, 28, '#dfe8ff', 'left', '800');
  RAR_ORDER.forEach((r, i) => { const x = 760 + i * 120; rrect(x, 64, 22, 22, 6, RARITY[r].c); text(RARITY[r].n, x + 30, 76, 22, '#dfe8ff', 'left', '800'); });
  const page = Math.floor(U.idx / DEX_PAGE), pages = Math.ceil(n / DEX_PAGE);
  text('第 ' + (page + 1) + ' / ' + pages + ' 页', 1520, 80, 22, '#aab8dd', 'right', '700');
  for (let i = 0; i < DEX_PAGE; i++) {
    const gi = page * DEX_PAGE + i; if (gi >= n) break;
    const sp = DEX_ORDER[gi], S = SPECIES[sp], st = dexStatus(sp), R = RARITY[S.rar];
    const x = 70 + (i % DEX_COLS) * 124, y = 120 + Math.floor(i / DEX_COLS) * 180, sel = gi === U.idx;
    ctx.save(); if (sel) { ctx.shadowColor = R.c; ctx.shadowBlur = 24; }
    rrect(x, y, 114, 168, 18, sel ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'); ctx.restore();
    rrect(x, y, 114, 168, 18, null, st ? R.c : 'rgba(255,255,255,0.18)', sel ? 4 : 2);
    if (st && (S.rar === 'legend' || S.rar === 'epic')) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(NOW * 3 + i); ctx.drawImage(softSprite(R.c), x + 5, y + 10, 104, 110); ctx.restore(); }
    drawCreature(ctx, sp, x + 57, y + 122, 96, st ? { t: NOW } : { silhouette: 'rgba(20,30,60,0.9)' });
    text('No.' + String(gi + 1).padStart(3, '0'), x + 10, y + 18, 15, '#aab8dd', 'left', '800');
    if (st === 2) { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(x + 98, y + 18, 9, 0, 6.28); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x + 89, y + 17, 18, 2); }
    if (G.flags.shinyDex && G.flags.shinyDex[sp]) text('✦', x + 98, y + 40, 20, '#fff3a0', 'center', '900');
    text(st ? S.n : '？？？', x + 57, y + 146, S.n.length > 4 ? 17 : 20, st ? '#fff' : '#7a86a8', 'center', '800');
  }
  // 详情
  const sp = DEX_ORDER[U.idx], S = SPECIES[sp], st = dexStatus(sp), R = RARITY[S.rar], dx = 960;
  glass(dx, 110, 570, 740, 28, true, R.c);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = st ? 0.55 : 0.15; ctx.drawImage(softSprite(R.c), dx + 85, 120, 400, 380); ctx.restore();
  drawCreature(ctx, sp, dx + 285, 470, 330, st ? { breathe: true, t: NOW, showcase: true } : { silhouette: 'rgba(20,30,60,0.92)' });
  text('No.' + String(U.idx + 1).padStart(3, '0'), dx + 30, 146, 22, '#aab8dd', 'left', '800');
  rarityTag(S.rar, dx + 440, 146, false);
  if (!st) { text('？？？', dx + 285, 530, 44, '#7a86a8', 'center', '900'); text('还没有遇见过这只灵兽。', dx + 285, 590, 24, '#aab8dd', 'center', '700'); text('线索：' + dexWhere(sp), dx + 285, 640, 20, '#7ff0e2', 'center', '700'); return drawHint('方向键 选择　X/Esc 关闭', true); }
  text(S.n, dx + 30, 530, 42, '#fff', 'left', '900', 'middle', true);
  typeBadge(S.t, dx + 300, 510, 100, 40);
  text(['一阶', '二阶', '三阶'][S.stage] + (S.stages === 1 ? '（唯一形态）' : ' / 共 ' + S.stages + ' 阶'), dx + 540, 530, 20, '#aab8dd', 'right', '700');
  wrapText(S.d, dx + 30, 580, 510, 24, 34, '#dfe8ff', '600');
  const names = ['体力', '攻击', '防御', '速度'];
  S.b.forEach((v, i) => { const y = 668 + i * 26; text(names[i], dx + 30, y, 19, '#aab8dd', 'left', '700'); rrect(dx + 84, y - 7, 200, 14, 7, 'rgba(255,255,255,0.12)'); rrect(dx + 84, y - 7, Math.max(14, 200 * Math.min(1, v / 170)), 14, 7, R.c); text(String(v), dx + 300, y, 18, '#fff', 'left', '800'); });
  const sig = (S.sigs || []).map(id => MOVES[id].n), U2 = MOVES[S.ult];
  text('招牌技：' + (sig.length ? sig.join('、') : '进化后习得'), dx + 350, 668, 18, '#ffcf5a', 'left', '800');
  text('奥义：' + U2.n.replace('奥义·', ''), dx + 350, 698, 18, '#ff9a5a', 'left', '800');
  wrapText('出没：' + dexWhere(sp), dx + 350, 728, 190, 17, 24, '#7ff0e2', '700');
  const MV = MON_VOICE[sp], MA = MON_ACT[sp];
  if (MV) { rrect(dx + 24, 778, 522, 58, 16, 'rgba(255,207,90,0.12)', 'rgba(255,207,90,0.5)', 2); text('口头禅「' + MV.sum[0] + '」', dx + 40, 798, 19, '#ffe9a8', 'left', '800'); text('招牌动作：' + MA.name + '　·　声线：' + VOICE_PROFILES[MV.pf].label, dx + 40, 822, 17, '#cfe0ff', 'left', '700'); }
  drawHint('方向键 选择　Z 听台词　X/Esc 关闭', true);
}
