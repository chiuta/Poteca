// Poteca 2.1 — harta de bază OpenStreetMap OPȚIONALĂ: oprită implicit, cu confirmare, doar în Web Mercator, absentă din exporturi, nesalvată.
// Rulare: node tests/osm.test.mjs   (Playwright din /opt/node-tools, Chromium din /opt/pw-browsers; rețeaua reală este blocată, dalele sunt simulate local)
import {createRequire} from 'module';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || '/opt/node-tools/package.json');
const {chromium} = require('playwright');
const APP = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0;
const t = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
// PNG 4×4 uni (albastru #3366cc), generat local
function png(r, g, b) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (buf) => { let c = 0xFFFFFFFF; for (const x of buf) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(4, 0); ihdr.writeUInt32BE(4, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.concat(Array.from({length: 4}, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({length: 4}, () => [r, g, b]).flat())])));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const TILE = png(0x33, 0x66, 0xcc);
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
async function open(mode) {   // mode: 'ok' = dalele sunt servite local (cu CORS), 'fail' = conexiune refuzată
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, locale: 'ro-RO', acceptDownloads: true});
  const net = [], other = [];
  await ctx.route(/^https?:/, (r) => {
    const u = r.request().url();
    if (/^https:\/\/tile\.openstreetmap\.org\//.test(u)) { net.push(u); return mode === 'ok' ? r.fulfill({status: 200, contentType: 'image/png', headers: {'access-control-allow-origin': '*'}, body: TILE}) : mode === 'nocors' ? r.fulfill({status: 200, contentType: 'image/png', body: TILE}) : r.abort(); }
    other.push(u); r.abort();
  });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  await p.goto(APP); await p.waitForSelector('body[data-ready]');
  await p.click('#btn-demo'); await p.waitForTimeout(500);
  return {ctx, p, net, other, errs};
}

console.log('--- implicit: oprită, fără rețea, CSP strict');
{
  const {ctx, p, net, other, errs} = await open('ok');
  const html = fs.readFileSync(APP.replace('file://', ''), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  t('CSP: img-src permite DOAR tile.openstreetmap.org, connect-src rămâne none', /img-src 'self' data: blob: https:\/\/tile\.openstreetmap\.org;/.test(csp) && /connect-src 'none'/.test(csp) && (csp.match(/https?:\/\//g) || []).length === 1, csp);
  await p.click('#tab-layers'); await p.waitForTimeout(200);
  t('caseta există, este debifată', await p.$('#l-osm') !== null && !(await p.isChecked('#l-osm')));
  t('avertisment vizibil (cereri de rețea, IP, nu se trimit traseele, nu se salvează)', /cereri de rețea/.test(await p.textContent('#l-osm-warn')) && /IP/.test(await p.textContent('#l-osm-warn')) && /NU se trimit/.test(await p.textContent('#l-osm-warn')));
  await p.waitForTimeout(500);
  t('zero cereri (nici OSM, nici altele) cât timp e oprită', net.length === 0 && other.length === 0, {net, other});
  t('nota hărții: „Fără hartă de bază”', /Fără hartă de bază/.test(await p.textContent('#map-note')));
  await ctx.close();
}

console.log('--- activare cu confirmare');
{
  const {ctx, p, net, other, errs} = await open('ok');
  await p.click('#tab-layers');
  await p.click('#l-osm'); await p.waitForTimeout(300);
  t('apare dialogul de confirmare cu mențiunea rețelei', await p.$eval('#dlg-confirm', (d) => d.open) && /tile\.openstreetmap\.org/.test(await p.textContent('#dc-msg')));
  await p.click('#dc-cancel'); await p.waitForTimeout(400);
  t('„Anulează”: caseta revine debifată, zero cereri', !(await p.isChecked('#l-osm')) && net.length === 0, net);
  await p.click('#l-osm'); await p.waitForTimeout(300); await p.click('#dc-ok'); await p.waitForTimeout(1500);
  t('după confirmare: caseta bifată, cereri doar către tile.openstreetmap.org', (await p.isChecked('#l-osm')) && net.length > 0 && other.length === 0, {n: net.length, other});
  t('URL-uri strict /z/x/y.png (fără traseu, coordonate sau alte date)', net.every((u) => /^https:\/\/tile\.openstreetmap\.org\/\d{1,2}\/\d+\/\d+\.png$/.test(u)), net.slice(0, 3));
  const v = await p.evaluate(() => Poteca.view());
  const z = +net[0].split('/')[3], n = 2 ** z;
  const cx = Math.floor(v.cx * n), cy = Math.floor(v.cy * n);
  t('zoom potrivit scării (dală ~181–362 px) și dala din centru este cerută', Math.abs(Math.log2(v.scale / 256) - z) <= 0.51 && net.includes(`https://tile.openstreetmap.org/${z}/${cx}/${cy}.png`), {z, cx, cy, scale: v.scale});
  t('cel mult 64 de dale distincte', new Set(net).size <= 64, new Set(net).size);
  const px = await p.evaluate(() => { const c = document.getElementById('map'), x = c.getContext('2d'); const d = x.getImageData(4 * (window.devicePixelRatio || 1), 4 * (window.devicePixelRatio || 1), 1, 1).data; return [d[0], d[1], d[2]]; });
  t('dalele sunt desenate (pixel albastru din dală în colț)', Math.abs(px[0] - 0x33) < 6 && Math.abs(px[1] - 0x66) < 6 && Math.abs(px[2] - 0xcc) < 6, px);
  const tainted = await p.evaluate(() => { try { document.getElementById('map').toDataURL(); return false; } catch (e) { return true; } });
  t('canvasul nu este „tainted” (crossOrigin=anonymous)', !tainted);
  t('nota, subsolul și eticheta ARIA anunță harta online + atribuire', /OpenStreetMap/.test(await p.textContent('#map-note')) && /tile\.openstreetmap\.org/.test(await p.textContent('#app-foot')) && /OpenStreetMap/.test(await p.getAttribute('#map', 'aria-label')) && !/Fără rețea|local, fără rețea/.test(await p.textContent('#app-sub')));
  const svg = await p.evaluate(() => Poteca.mapSvgString());
  t('SVG-ul exportat NU conține dale / gazde externe', !/tile\.openstreetmap|<image/.test(svg));
  // proiecția ECR: fără dale noi, notă explicativă
  const before = net.length;
  await p.selectOption('#sel-proj', 'equi'); await p.waitForTimeout(600);
  const noteEq = await p.textContent('#map-note');
  t('Web Mercator doar: în ECR nota explică, nu se cer dale noi', /Web Mercator/.test(noteEq) && net.length === before, {noteEq, before, now: net.length});
  await p.selectOption('#sel-proj', 'merc'); await p.waitForTimeout(400);
  // dezactivare
  await p.click('#tab-layers'); await p.click('#l-osm'); await p.waitForTimeout(300);
  const n2 = net.length;
  await p.evaluate(() => { const V = Poteca.view(); Poteca.S.view.cx += 0.2; Poteca.S.view.cy += 0.2; });
  await p.mouse.wheel(0, -400); await p.waitForTimeout(700);
  t('dezactivare: nota revine, nicio cerere nouă după deplasare/zoom', /Fără hartă de bază/.test(await p.textContent('#map-note')) && net.length === n2 && !(await p.isChecked('#l-osm')), {n2, now: net.length});
  t('zero erori JS / încălcări CSP', errs.length === 0 && (await p.evaluate(() => window.__csp)).length === 0, {errs, csp: await p.evaluate(() => window.__csp)});
  await ctx.close();
}

console.log('--- nesalvată, limbi, erori de rețea');
{
  const {ctx, p, net} = await open('ok');
  await p.click('#tab-layers'); await p.click('#l-osm'); await p.waitForTimeout(200); await p.click('#dc-ok'); await p.waitForTimeout(800);
  await p.evaluate(() => Poteca.saveNow && Poteca.saveNow()); await p.waitForTimeout(300);
  await p.reload(); await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(500);
  await p.click('#tab-layers');
  t('după reîncărcare harta este din nou oprită (starea nu se salvează)', !(await p.isChecked('#l-osm')));
  for (const l of ['en', 'fr', 'it', 'es', 'pt', 'hu', 'de']) {
    await p.selectOption('#sel-lang', l); await p.waitForTimeout(150);
    const w = await p.textContent('#l-osm-warn'), c = await p.textContent('[data-i18n="l_osm_on"]');
    if (!(/tile\.openstreetmap\.org/.test(w) && c.length > 10 && !/Afișează harta/.test(c))) t('traducere ' + l, false, {w: w.slice(0, 40), c});
    else t('traducere ' + l + ' (avertisment cu gazda + etichetă)', true);
  }
  await ctx.close();
}
{
  const {ctx, p, net, errs} = await open('fail');
  await p.click('#tab-layers'); await p.click('#l-osm'); await p.waitForTimeout(200); await p.click('#dc-ok'); await p.waitForTimeout(1500);
  t('dale refuzate: mesaj de eroare afișat, aplicația rămâne funcțională', /OpenStreetMap/.test(await p.textContent('#status')) && (await p.evaluate(() => Poteca.S.tracks.length)) > 0, await p.textContent('#status'));
  t('fără erori JS', errs.length === 0, errs);
  await ctx.close();
}
{
  const {ctx, p, net, errs} = await open('nocors');
  await p.click('#tab-layers'); await p.click('#l-osm'); await p.waitForTimeout(200); await p.click('#dc-ok'); await p.waitForTimeout(2000);
  const px = await p.evaluate(() => { const c = document.getElementById('map'), x = c.getContext('2d'); const k = window.devicePixelRatio || 1; const d = x.getImageData(4 * k, 4 * k, 1, 1).data; return [d[0], d[1], d[2]]; });
  t('server fără CORS: a doua încercare (fără crossOrigin) afișează totuși dalele', Math.abs(px[2] - 0xcc) < 6 && net.length >= 2, {px, n: net.length});
  t('fără mesaj de eroare și fără erori JS', !/OpenStreetMap/.test(await p.textContent('#status')) && errs.length === 0, errs);
  await ctx.close();
}
await b.close();
console.log(`\nPoteca osm: ${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
