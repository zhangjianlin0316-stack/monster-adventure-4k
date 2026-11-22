// 骨骼动画检查表：每只灵兽 × 各动作片段关键帧
const { chromium } = require('playwright-core'); const fs = require('fs');
const URL = process.env.URL || 'http://localhost:8765/'; const OUT = process.env.OUT || '/tmp/skel';
const SPS = (process.env.SP || 'fox').split(',');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL); await page.waitForTimeout(1500);
  await page.evaluate(sps => Promise.all(sps.map(sp => new Promise(r => { skelLoad(sp); const im = SKEL.img[sp]; if (im.complete) r(); im.onload = r; setTimeout(r, 8000); }))), SPS);
  const COLS = [['原画', null], ['idle', { clip: 'idle', fid: false }], ['walk¼', { clip: 'idle', walk: 1, tt: 0.125 }], ['walk¾', { clip: 'idle', walk: 1, tt: 0.375 }],
    ['攻·蓄力', { clip: 'attack', u: 0.28 }], ['攻·命中', { clip: 'attack', u: 0.47 }], ['招牌', { clip: 'special', u: 0.45 }], ['奥义·腾空', { clip: 'ult', u: 0.5 }], ['奥义·落地', { clip: 'ult', u: 0.66 }],
    ['受击', { clip: 'hit', u: 0.1 }], ['击飞', { clip: 'knock', u: 0.25 }], ['闪避', { clip: 'dodge', u: 0.4 }], ['胜利', { clip: 'victory', u: 0.13 }], ['倒下', { clip: 'faint', u: 0.9 }]];
  for (const sp of SPS) {
    const url = await page.evaluate(([sp, COLS]) => {
      const S = 260, cv = document.createElement('canvas'); cv.width = S * 7; cv.height = S * 2 + 40; const g = cv.getContext('2d'); g.fillStyle = '#dfe6dc'; g.fillRect(0, 0, cv.width, cv.height);
      COLS.forEach(([name, st], i) => {
        const x = (i % 7) * S + S / 2, y = Math.floor(i / 7) * (S + 20) + S - 20;
        g.fillStyle = '#333'; g.font = '18px sans-serif'; g.textAlign = 'center'; g.fillText(name, x, Math.floor(i / 7) * (S + 20) + 18);
        g.strokeStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.moveTo(x - S / 2 + 10, y); g.lineTo(x + S / 2 - 10, y); g.stroke();
        if (!st) { const im = IMG[sp]; const k = 200 / Math.max(im.width, im.height); g.drawImage(im, x - im.width * k / 2, y - im.height * k, im.width * k, im.height * k); return; }
        const s2 = Object.assign({}, st); const t = st.tt || 0.3; drawCreature(g, sp, x, y, 200 / ((SPECIES[sp].scale) || 1), { t, skel: s2, noBlink: true });
      });
      return cv.toDataURL('image/jpeg', 0.85);
    }, [sp, COLS]);
    fs.writeFileSync(`${OUT}/${sp}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(errs.length ? 'ERR ' + errs.slice(0, 5).join(' | ') : 'ok'); await b.close();
})();
