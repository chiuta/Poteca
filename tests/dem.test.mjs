// Poteca 2.2 — altitudine din DEM furnizat de utilizator (SRTM .hgt). Datele de test sunt SINTETICE (plan înclinat), generate aici;
// nu sunt date SRTM reale și nu validează precizia SRTM. Rulare: node tests/dem.test.mjs  (PW_ROOT, CHROMIUM_PATH; rețea blocată)
import {createRequire} from 'module'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require('playwright');
const APP = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok   ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };
// dală 3″ (1201×1201 int16 big-endian, rândul 0 = nord): z = 500 + 800·(lat−la0) + 300·(lon−lo0), rotunjit (eroare ≤ 0,5 m)
function hgt(la0, lo0, voidAt) {
  const N = 1201, b = Buffer.alloc(N * N * 2);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const lat = la0 + 1 - i / (N - 1), lon = lo0 + j / (N - 1); b.writeInt16BE(voidAt && voidAt(i, j) ? -32768 : Math.round(500 + 800 * (lat - la0) + 300 * (lon - lo0)), (i * N + j) * 2); }
  return b;
}
const z = (la, lo, la0, lo0) => 500 + 800 * (la - la0) + 300 * (lo - lo0);
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1280, height: 800}, locale: 'ro-RO'}); const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { errs.push('dialog:' + d.message()); d.dismiss(); });
await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective)); });
await p.goto(APP); await p.waitForFunction(() => window.Poteca, null, {timeout: 20000}); await p.waitForTimeout(500);

console.log('--- funcții pure');
const T1 = hgt(45, 26), T2 = hgt(46, 26, (i, j) => i >= 600 && i <= 602 && j >= 600 && j <= 602);
const arr = x => x.toString('base64');
const r = await p.evaluate(async ([b1, b2]) => {
  const P = Poteca, u8 = a => Uint8Array.from(atob(a), c => c.charCodeAt(0)).buffer;
  const k1 = P.demAdd('N45E026.hgt', u8(b1)), k2 = P.demAdd('n46e026.HGT', u8(b2)), bad1 = P.demAdd('foo.hgt', u8(b1)), bad2 = P.demAdd('N45E026.hgt', new ArrayBuffer(100));
  return { k1, k2, bad1, bad2, n: P.dem.tiles.size,
    a: P.demSample(45.5, 26.5), b: P.demSample(45.123456, 26.987654), edge: P.demSample(45.999999, 26.0000001), outside: P.demSample(47.2, 26.3), nan: P.demSample(NaN, 26.3),
    nextTile: P.demSample(46.25, 26.5), voidCell: P.demSample(46 + 1 - 601 / 1200, 26 + 601 / 1200) };
}, [arr(T1), arr(T2)]);
t('două dale încărcate, chei corecte (N45E026, N46E026); nume/dimensiune greșite respinse', r.k1 === 'N45E026' && r.k2 === 'N46E026' && r.bad1 === null && r.bad2 === null && r.n === 2, r);
t('interpolare biliniară = planul (±0,6 m, rotunjirea int16)', Math.abs(r.a - z(45.5, 26.5, 45, 26)) < 0.6 && Math.abs(r.b - z(45.123456, 26.987654, 45, 26)) < 0.6, [r.a, r.b]);
t('colț de dală (lat apropiat de 46): valid și continuu', Math.abs(r.edge - z(45.999999, 26.0000001, 45, 26)) < 0.6, r.edge);
t('a doua dală folosită pentru lat ≥ 46', Math.abs(r.nextTile - z(46.25, 26.5, 46, 26)) < 0.6, r.nextTile);
t('în afara dalelor, NaN invalid și celulă „void” → NaN (nu se inventează)', Number.isNaN(r.outside) && Number.isNaN(r.nan) && Number.isNaN(r.voidCell), [r.outside, r.nan, r.voidCell]);

console.log('--- în interfață: încărcare, corectare, undo');
const PTS = [[45.2, 26.1, 1000], [45.6, 26.4, null], [46.3, 26.7, 20], [47.5, 26.2, 30], [45.3, 26.5, 40]];
const gpx = '<?xml version="1.0"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>T</name><trkseg>' + PTS.map(q => '<trkpt lat="' + q[0] + '" lon="' + q[1] + '">' + (q[2] === null ? '' : '<ele>' + q[2] + '</ele>') + '</trkpt>').join('') + '</trkseg></trk></gpx>';
await p.setInputFiles('#file-in', [{name: 't.gpx', mimeType: 'application/gpx+xml', buffer: Buffer.from(gpx)}]); await p.waitForTimeout(800);
await p.evaluate(() => { const tr = Poteca.S.tracks[0]; Poteca.S.sel = tr.id; });
await p.click('#tab-edit');
await p.setInputFiles('#dem-in', [{name: 'N45E026.hgt', mimeType: 'application/octet-stream', buffer: T1}, {name: 'N46E026.hgt', mimeType: 'application/octet-stream', buffer: T2}, {name: 'readme.txt', mimeType: 'text/plain', buffer: Buffer.from('x')}]);
await p.waitForTimeout(600);
const sum = await p.textContent('#dem-sum'), st = await p.textContent('#status');
t('rezumat: 2 dale (N45E026, N46E026) și 1 fișier ignorat anunțat', /2 .*N45E026, N46E026/.test(sum) && /1 fișier/.test(st + (await p.evaluate(() => document.body.innerText))), [sum, st]);
await p.click('#e-demapply'); await p.waitForTimeout(400);
const e = await p.evaluate(() => Array.from(Poteca.selTrack().ele));
t('punctele 0, 1, 2, 4 corectate din plan; punctul 3 (lat 47,5, fără dală) rămâne 30', Math.abs(e[0] - z(45.2, 26.1, 45, 26)) < 0.6 && Math.abs(e[1] - z(45.6, 26.4, 45, 26)) < 0.6 && Math.abs(e[2] - z(46.3, 26.7, 46, 26)) < 0.6 && e[3] === 30 && Math.abs(e[4] - z(45.3, 26.5, 45, 26)) < 0.6, e);
t('mesaj: 4 din 5 puncte și diferența medie DEM − GPS (doar unde existau ambele)', /4 din 5/.test(await p.textContent('#status')) && /DEM . GPS/.test(await p.textContent('#status')), await p.textContent('#status'));
await p.keyboard.press('Control+z'); await p.waitForTimeout(300);
const e2 = await p.evaluate(() => Array.from(Poteca.selTrack().ele));
t('Ctrl+Z restaurează altitudinile originale', e2[0] === 1000 && Number.isNaN(e2[1]) && e2[2] === 20 && e2[3] === 30 && e2[4] === 40, e2);
await p.evaluate(() => { Poteca.dem.tiles.clear(); }); await p.click('#e-demapply'); await p.waitForTimeout(200);
t('fără dale încărcate: mesaj, nicio modificare', /\.hgt/.test(await p.textContent('#status')) && (await p.evaluate(() => Poteca.selTrack().ele[0])) === 1000);
const stored = await p.evaluate(() => JSON.stringify(Object.keys(localStorage)) + (document.body.innerHTML.match(/dem-in/g) || []).length);
t('dalele nu se salvează în stocare (nicio cheie cu „dem”)', !/dem/i.test(JSON.stringify(Object.keys(await p.evaluate(() => ({...localStorage}))))), stored);
t('0 cereri de rețea, 0 erori JS, 0 încălcări CSP', net.length === 0 && errs.length === 0 && (await p.evaluate(() => window.__csp)).length === 0, [net, errs]);

console.log('--- limbi');
for (const l of ['en', 'fr', 'it', 'es', 'pt', 'hu', 'de']) {
  await p.selectOption('#sel-lang', l); await p.waitForTimeout(200);
  const leg = await p.evaluate(() => document.querySelector('[data-i18n="dem_t"]').textContent);
  t(l + ': legenda tradusă, nu româna', leg !== 'Altitudine din DEM (fișiere .hgt de la tine)' && leg.length > 8, leg);
}
await b.close(); console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
