/* Process uploaded Higgsfield PNGs into game-ready assets:
   - key out the white background (feathered) for object sprites
   - crop the six companions out of the cast lineup
   - copy full-frame art (sky, grass) as-is
   Run: NODE_PATH=$(npm root -g) node tools/process-assets.js */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const U = '/root/.claude/uploads/b793b728-2f0d-556f-94f9-f21bc4452495/';
const OUT = path.join(__dirname, '..', 'assets');
const up = {
  pine:   U + 'f146f653-IMG_1223.png',
  autumn: U + '72bbdfee-IMG_1224.png',
  tree:   U + '111071fe-IMG_1225.png',
  grass:  U + 'ce9c7072-IMG_1226.png',
  sky:    U + 'cbf9fb2e-IMG_1227.png',
  cast:   U + '7aeed3bd-IMG_1220.png',
  cave:   U + '406c472f-IMG_1221.png',
  hands:  U + 'ace345c0-IMG_1229.png',
  cottage: U + 'b60bde11-IMG_1222.png',
  boulder: U + '04757d84-IMG_1233.png',
  scenery: U + '67e3cea7-IMG_1234.png',
};
const dataUrl = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const save = (name, durl) => { fs.writeFileSync(path.join(OUT, name), Buffer.from(durl.split(',')[1], 'base64')); console.log('  wrote', name); };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await b.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  // white-key a single object sprite → transparent PNG (trimmed to content), capped size
  async function keyObject(name, file, thresh = 62, maxDim = 720) {
    const durl = await page.evaluate(async ({ src, T, maxDim }) => {
      const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
      let minx = c.width, miny = c.height, maxx = 0, maxy = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const dr = 255 - a[i], dg = 255 - a[i + 1], db = 255 - a[i + 2];
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        let al = dist / T; if (al > 1) al = 1;
        al = al*al*(3-2*al); a[i + 3] = Math.round(al * 255);
          if (al > 0.02 && al < 0.999) { const inv=(1-al)*255;
            a[i]=Math.min(255,Math.max(0,(a[i]-inv)/al));
            a[i+1]=Math.min(255,Math.max(0,(a[i+1]-inv)/al));
            a[i+2]=Math.min(255,Math.max(0,(a[i+2]-inv)/al)); }
        if (a[i + 3] > 24) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
      }
      g.putImageData(d, 0, 0);
      // trim to content bbox with small padding
      const pad = 6;
      minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad);
      maxx = Math.min(c.width - 1, maxx + pad); maxy = Math.min(c.height - 1, maxy + pad);
      const w = maxx - minx + 1, h = maxy - miny + 1;
      const s = Math.min(1, maxDim / Math.max(w, h));
      const ow = Math.max(1, Math.round(w * s)), oh = Math.max(1, Math.round(h * s));
      const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
      const og = oc.getContext('2d'); og.imageSmoothingQuality = 'high';
      og.drawImage(c, minx, miny, w, h, 0, 0, ow, oh);
      return oc.toDataURL('image/png');
    }, { src: dataUrl(file), T: thresh, maxDim });
    save(name + '.png', durl);
  }

  // crop the cast lineup into six characters using fixed fractional x-boxes
  // (box edges sit in the white gaps between characters); then key white + trim.
  async function keyCast(file, boxes, T = 62, lowCut = 0) {
    const durls = await page.evaluate(async ({ src, boxes, T, lowCut }) => {
      const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const w = img.width, h = img.height;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0);
      const out = {};
      for (const b of boxes) {
        const bx0 = Math.round(b.x0 * w), bx1 = Math.round(b.x1 * w), bw = bx1 - bx0;
        const by0 = Math.round((b.y0 || 0) * h), by1 = Math.round((b.y1 || 1) * h), bh = by1 - by0;
        const tc = document.createElement('canvas'); tc.width = bw; tc.height = bh;
        const tg = tc.getContext('2d'); tg.drawImage(c, bx0, by0, bw, bh, 0, 0, bw, bh);
        const d = tg.getImageData(0, 0, bw, bh), a = d.data;
        // key white → alpha
        for (let i = 0; i < a.length; i += 4) {
          const dr = 255 - a[i], dg = 255 - a[i + 1], db = 255 - a[i + 2];
          let al = Math.sqrt(dr * dr + dg * dg + db * db) / T; if (al > 1) al = 1;
          al = al*al*(3-2*al); if (al < lowCut) al = 0; a[i + 3] = Math.round(al * 255);
          if (al > 0.02 && al < 0.999) { const inv=(1-al)*255;
            a[i]=Math.min(255,Math.max(0,(a[i]-inv)/al));
            a[i+1]=Math.min(255,Math.max(0,(a[i+1]-inv)/al));
            a[i+2]=Math.min(255,Math.max(0,(a[i+2]-inv)/al)); }
        }
        // keep only the largest connected blob (drops neighbour slivers at the edges)
        const h2 = bh;
        const N = bw * h2, lab = new Int32Array(N).fill(-1), stack = new Int32Array(N);
        let best = -1, bestSize = 0, comp = 0;
        for (let p = 0; p < N; p++) {
          if (a[p * 4 + 3] <= 70 || lab[p] !== -1) continue;
          let sp = 0; stack[sp++] = p; lab[p] = comp; let size = 0;
          while (sp > 0) {
            const q = stack[--sp]; size++;
            const qx = q % bw, qy = (q / bw) | 0;
            if (qx > 0 && a[(q - 1) * 4 + 3] > 70 && lab[q - 1] === -1) { lab[q - 1] = comp; stack[sp++] = q - 1; }
            if (qx < bw - 1 && a[(q + 1) * 4 + 3] > 70 && lab[q + 1] === -1) { lab[q + 1] = comp; stack[sp++] = q + 1; }
            if (qy > 0 && a[(q - bw) * 4 + 3] > 70 && lab[q - bw] === -1) { lab[q - bw] = comp; stack[sp++] = q - bw; }
            if (qy < h2 - 1 && a[(q + bw) * 4 + 3] > 70 && lab[q + bw] === -1) { lab[q + bw] = comp; stack[sp++] = q + bw; }
          }
          if (size > bestSize) { bestSize = size; best = comp; }
          comp++;
        }
        let minx = bw, miny = h2, maxx = 0, maxy = 0;
        for (let y = 0; y < h2; y++) for (let x = 0; x < bw; x++) {
          const p = y * bw + x;
          if (!b.keepAll && lab[p] !== best) { a[p * 4 + 3] = 0; }              // erase everything but the main character
          else { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
        }
        tg.putImageData(d, 0, 0);
        const pad = 8;
        minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad);
        maxx = Math.min(bw - 1, maxx + pad); maxy = Math.min(h2 - 1, maxy + pad);
        const cw = maxx - minx + 1, ch = maxy - miny + 1;
        const s = Math.min(1, 760 / Math.max(cw, ch));
        const ow = Math.max(1, Math.round(cw * s)), oh = Math.max(1, Math.round(ch * s));
        const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
        const og2 = oc.getContext('2d'); og2.imageSmoothingQuality = 'high';
        og2.drawImage(tc, minx, miny, cw, ch, 0, 0, ow, oh);
        out[b.name] = oc.toDataURL('image/png');
      }
      return out;
    }, { src: dataUrl(file), boxes, T, lowCut });
    for (const b of boxes) if (durls[b.name]) save(b.name + '.png', durls[b.name]);
  }

  console.log('· object sprites');
  await keyObject('tree', up.tree);
  await keyObject('pine', up.pine);
  await keyObject('tree_autumn', up.autumn);
  await keyObject('cave', up.cave, 90);
  await keyObject('house', up.cottage);
  await keyObject('rock', up.boulder);

  console.log('· hands (keep full frame, just key white)');
  {
    const durl = await page.evaluate(async ({ src }) => {
      const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
      for (let i = 0; i < a.length; i += 4) { const dr = 255 - a[i], dg = 255 - a[i + 1], db = 255 - a[i + 2]; let al = Math.sqrt(dr * dr + dg * dg + db * db) / 60; if (al > 1) al = 1; al = al*al*(3-2*al); a[i + 3] = Math.round(al * 255);
          if (al > 0.02 && al < 0.999) { const inv=(1-al)*255;
            a[i]=Math.min(255,Math.max(0,(a[i]-inv)/al));
            a[i+1]=Math.min(255,Math.max(0,(a[i+1]-inv)/al));
            a[i+2]=Math.min(255,Math.max(0,(a[i+2]-inv)/al)); } }
      g.putImageData(d, 0, 0);
      const s = Math.min(1, 1100 / c.width);
      const oc = document.createElement('canvas'); oc.width = Math.round(c.width * s); oc.height = Math.round(c.height * s);
      const og = oc.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(c, 0, 0, oc.width, oc.height);
      return oc.toDataURL('image/png');
    }, { src: dataUrl(up.hands) });
    save('hands.png', durl);
  }

  console.log('· full-frame art (resized)');
  async function resizeSave(name, file, maxW) {
    const durl = await page.evaluate(async ({ src, maxW }) => {
      const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const s = Math.min(1, maxW / img.width);
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    }, { src: dataUrl(file), maxW });
    save(name, durl);
  }
  await resizeSave('sky.png', up.sky, 1600);
  await resizeSave('grass_ground.png', up.grass, 1024);
  await resizeSave('scenery.png', up.scenery, 1800);

  console.log('· FINAL CG cast — all six from approved solo sheets');
  const CGB = U + '9d1d43f8-IMG_1251.png';
  const CGK = U + 'f1c7e141-IMG_1252.png';
  const CGP = U + '8bda61d6-IMG_1255.png';
  const CGG = U + '9e99cc79-IMG_1256.png';
  const CGS = U + '30d0fc34-IMG_1258.png';
  const CGT = U + '644e2bfc-5917b51c03d5470d80efa44c7ce5a4bb.jpeg';
  await keyCast(CGB, [ { name: 'bright', x0: 0.0, x1: 1.0 } ], 85, 0.24);
  await keyCast(CGK, [ { name: 'kazoo', x0: 0.0, x1: 1.0 } ], 85, 0.24);
  await keyCast(CGP, [ { name: 'patch', x0: 0.0, x1: 1.0 } ], 85, 0.24);
  await keyCast(CGG, [ { name: 'grit', x0: 0.0, x1: 1.0 } ], 85, 0.24);
  await keyCast(CGS, [ { name: 'shaky', x0: 0.0, x1: 1.0, keepAll: true } ], 85, 0.24);
  await keyCast(CGT, [ { name: 'thread', x0: 0.0, x1: 1.0, keepAll: true } ], 85, 0.24); // keepAll: floating ember motes
  // (retired) painterly-lineup cast cut — superseded by the FINAL CG cast above

  await b.close();
  console.log('done.');
})().catch(e => { console.error(e); process.exit(1); });
