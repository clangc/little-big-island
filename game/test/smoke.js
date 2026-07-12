/* ------------------------------------------------------------------
   The Island Explorer — smoke test + screenshot harness
   Loads the built site/ in a real headless Chromium, drives it into
   the first-person scene, asserts nothing exploded, and drops
   screenshots into test/shots/ so graphics changes can be judged by eye.

   Usage:  node test/smoke.js            (builds shots at a few scenes)
           NODE_PATH=$(npm root -g) node test/smoke.js
------------------------------------------------------------------ */
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  try { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }
  catch (e2) { console.error('playwright not found. Try: NODE_PATH=$(npm root -g) node test/smoke.js'); process.exit(2); }
}

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

// --- tiny static file server for site/ (so fetch()/manifest works) ---
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json',
  '.png':'image/png', '.webmanifest':'application/manifest+json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rq) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      const f = path.join(SITE, p);
      if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        rq.writeHead(404); rq.end('nope'); return;
      }
      rq.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rq);
    });
    srv.listen(0, () => res(srv));
  });
}

async function nonBlank(page) {
  // returns fraction of sampled pixels that differ from the top-left pixel
  return page.evaluate(() => {
    const c = document.getElementById('c');
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h).data;
    const r0 = d[0], g0 = d[1], b0 = d[2];
    let diff = 0, n = 0;
    for (let y = 0; y < h; y += 17) for (let x = 0; x < w; x += 17) {
      const i = (y * w + x) * 4; n++;
      if (Math.abs(d[i]-r0)+Math.abs(d[i+1]-g0)+Math.abs(d[i+2]-b0) > 24) diff++;
    }
    return diff / n;
  });
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--no-sandbox'],
  });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  const fail = m => { console.error('✗ ' + m); browser.close(); srv.close(); process.exit(1); };

  await page.goto(base, { waitUntil: 'networkidle' });

  // start modal should be present
  await page.waitForSelector('#f_go', { timeout: 8000 }).catch(() => fail('start screen never appeared'));
  await page.fill('#f_name', 'Vera');
  await page.fill('#f_island', 'The Giggling Cove');
  await page.screenshot({ path: path.join(SHOTS, '0-start.png') });

  await page.click('#f_go');
  // wait for FP scene ( `scene` is a top-level lexical global, not window.scene )
  await page.waitForFunction(() => { try { return scene === 'fp'; } catch (e) { return document.getElementById('topbar').style.display === 'flex'; } },
    { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1400); // let the world build + a few animation frames

  const scene = await page.evaluate(() => { try { return scene; } catch (e) { return document.getElementById('topbar').style.display === 'flex' ? 'fp' : 'unknown'; } });
  if (scene !== 'fp') fail('did not reach first-person scene (scene=' + scene + ')');

  // save key must exist
  const hasKey = await page.evaluate(() => !!localStorage.getItem('tlbi_explorer_v2'));
  if (!hasKey) fail('localStorage key tlbi_explorer_v2 was not written');

  // canvas must not be blank
  const frac = await nonBlank(page);
  if (frac < 0.05) fail('first-person canvas looks blank (diff fraction ' + frac.toFixed(3) + ')');

  await page.screenshot({ path: path.join(SHOTS, '1-firstperson.png') });

  // turn a bit and walk to get a different framing
  await page.evaluate(() => { try { player.ang += 0.7; } catch (e) {} });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, '2-turned.png') });

  // sprite gallery — composite key sprites onto an overlay canvas for eyeball review
  await page.evaluate(() => {
    const keys = ['bright','kazoo','patch','grit','shaky','thread',
                  'blossom','hibiscus','sunflower','rose','tulip','daisy',
                  'fox','deer','owl','cat'];
    const cols = 6, cell = 170;
    const rows = Math.ceil(keys.length / cols);
    const cv = document.createElement('canvas');
    cv.id = '__gallery';
    cv.width = cols * cell; cv.height = rows * cell;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:' + cv.width + 'px;height:' + cv.height + 'px';
    const g = cv.getContext('2d');
    g.fillStyle = '#eaf3ee'; g.fillRect(0, 0, cv.width, cv.height);
    keys.forEach((k, i) => {
      const sp = SPR[k]; if (!sp) return;
      const cx = (i % cols) * cell + cell / 2, cy = Math.floor(i / cols) * cell + cell / 2 - 8;
      const s = cell * 0.66, w = s * sp.width / sp.height, h = s;
      g.imageSmoothingEnabled = true;
      g.drawImage(sp, cx - w / 2, cy - h / 2, w, h);
      g.fillStyle = '#31404b'; g.font = '15px Georgia'; g.textAlign = 'center';
      g.fillText(k, cx, Math.floor(i / cols) * cell + cell - 10);
    });
    document.body.appendChild(cv);
  });
  await page.waitForTimeout(120);
  const gal = await page.$('#__gallery');
  if (gal) await gal.screenshot({ path: path.join(SHOTS, '3-sprites.png') });
  await page.evaluate(() => { const e = document.getElementById('__gallery'); if (e) e.remove(); });
  await page.waitForTimeout(120);

  // exercise the Build (fly) view + placing a sprite — paths touched by the overhaul
  await page.evaluate(() => { try { selItem = ITEMS.findIndex(i => i.k === 'tree'); selIsFurn = false; } catch (e) {} });
  await page.click('#btn_build').catch(() => {});
  await page.waitForTimeout(500);
  const buildScene = await page.evaluate(() => { try { return scene; } catch (e) { return '?'; } });
  if (buildScene !== 'build') fail('Build (fly) view did not open (scene=' + buildScene + ')');
  await page.evaluate(() => { try { placeAt(player.x + 40, player.y); } catch (e) {} });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '4-build.png') });
  const placed = await page.evaluate(() => { try { return P.placed.length; } catch (e) { return -1; } });
  if (placed < 1) fail('placing a sprite in Build view did not work (placed=' + placed + ')');

  if (errors.length) {
    console.error('✗ runtime errors:\n  ' + errors.join('\n  '));
    await browser.close(); srv.close(); process.exit(1);
  }
  console.log('  build view OK, placed ' + placed + ' sprite(s)');

  console.log('✓ smoke OK — scene=fp, save key present, canvas non-blank (' + (frac*100).toFixed(0) + '% varied)');
  console.log('  shots → ' + path.relative(ROOT, SHOTS) + '/');
  await browser.close();
  srv.close();
})().catch(e => { console.error(e); process.exit(1); });
