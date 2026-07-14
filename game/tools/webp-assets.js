/* Re-encode the 3D game's textures as WebP into assets/web/ (much smaller
   on phone connections). The 2.5D game keeps reading the PNGs untouched.
   Run: NODE_PATH=<playwright dir> node tools/webp-assets.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets');
const OUT = path.join(SRC, 'web');
const NAMES = ['grass_ground','tree','pine','tree_autumn','house','rock',
  'bright','kazoo','patch','grit','shaky','thread','hands'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await b.newPage();
  for (const n of NAMES) {
    const png = fs.readFileSync(path.join(SRC, n + '.png'));
    const durl = await page.evaluate(async (src) => {
      const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.82);
    }, 'data:image/png;base64,' + png.toString('base64'));
    const buf = Buffer.from(durl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(OUT, n + '.webp'), buf);
    console.log(' ', n + '.webp', Math.round(png.length / 1024) + 'K →', Math.round(buf.length / 1024) + 'K');
  }
  await b.close();
  console.log('done.');
})().catch(e => { console.error(e); process.exit(1); });
