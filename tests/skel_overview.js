// 全部灵兽骨骼动作总览：每行一只，列 = 原画/待机/走路/攻击命中/招牌/奥义/受击/倒下
const { chromium } = require('playwright-core'); const fs = require('fs');
const URL = process.env.URL || 'http://localhost:8765/'; const OUT = process.env.OUT || '/tmp/skelov';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL); await page.waitForTimeout(1500);
  const SPS = await page.evaluate(() => Object.keys(SPECIES));
  await page.evaluate(sps => sps.forEach(sp => skelLoad(sp)), SPS);
  for (let i = 0; i < 60; i++) { const n = await page.evaluate(sps => sps.filter(sp => !skelReady(sp)).join(','), SPS); if (!n) break; if (i % 10 === 9) console.log('waiting', n); await page.waitForTimeout(500); }
  const COLS = [['原画', null], ['待机', { clip: 'idle', fid: false }], ['走路', { clip: 'idle', walk: 1, tt: 0.125 }], ['攻击', { clip: 'attack', u: 0.47 }], ['招牌', { clip: 'special', u: 0.45 }], ['奥义', { clip: 'ult', u: 0.5 }], ['击飞', { clip: 'knock', u: 0.25 }], ['胜利', { clip: 'victory', u: 0.13 }], ['倒下', { clip: 'faint', u: 0.9 }]];
  for (let k = 0; k < SPS.length; k += 8) {
    const grp = SPS.slice(k, k + 8);
    const url = await page.evaluate(([grp, COLS]) => {
      const S = 200, cv = document.createElement('canvas'); cv.width = S * COLS.length + 90; cv.height = S * grp.length + 30; const g = cv.getContext('2d'); g.fillStyle = '#dfe6dc'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#333'; g.font = '16px sans-serif'; g.textAlign = 'center'; COLS.forEach(([n], i) => g.fillText(n, 90 + i * S + S / 2, 20));
      grp.forEach((sp, r) => {
        g.textAlign = 'left'; g.fillStyle = '#333'; g.fillText(sp + (RIGS[sp] ? '' : ' ✗'), 4, 30 + r * S + S / 2);
        COLS.forEach(([name, st], i) => {
          const x = 90 + i * S + S / 2, y = 30 + r * S + S - 18;
          if (!st) { const im = IMG[sp]; const kk = 160 / Math.max(im.width, im.height); g.drawImage(im, x - im.width * kk / 2, y - im.height * kk, im.width * kk, im.height * kk); return; }
          drawCreature(g, sp, x, y, 160 / ((SPECIES[sp].scale) || 1), { t: st.tt || 0.3, skel: Object.assign({}, st), noBlink: true });
        });
      });
      return cv.toDataURL('image/jpeg', 0.82);
    }, [grp, COLS]);
    fs.writeFileSync(`${OUT}/ov_${k / 8}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(errs.length ? 'ERR ' + errs.slice(0, 5).join(' | ') : 'ok'); await b.close();
})();
