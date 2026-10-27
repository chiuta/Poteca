# Jurnal de modificări — Poteca

Format: [SemVer](https://semver.org/lang/ro/) MAJOR.MINOR.PATCH.

## 2.1.0 — 2026-10-27 (anterior: v2.0.0)

Stare: stabil · Offline: cere internet doar pentru harta OpenStreetMap opțională (oprită implicit)

Aplicat după mini-recenzia din 2026-10-27.

### Adăugat / modificat
- **Hartă de bază OpenStreetMap OPȚIONALĂ** (fila Straturi → „Afișează harta OpenStreetMap”): **oprită implicit**, **nesalvată** (la fiecare deschidere e din nou oprită), activare doar după o **confirmare explicită** cu avertisment de rețea (adresa IP, browserul, Referer-ul și coordonatele dalelor ajung la serverul OSM; traseele NU se trimit).
- Dale PNG 256×256 de la `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, doar pentru zona vizibilă (cel mult 64 de dale, cache LRU de 256), `crossOrigin=anonymous` (canvasul rămâne netaintat), atribuire „© OpenStreetMap contributors” pe hartă; dacă serverul nu răspunde cu CORS, a doua încercare se face fără `crossOrigin`. Apare doar în **Web Mercator** și doar pe ecran: **nu intră în exporturile SVG/PNG și în tipărire**.
- CSP: `connect-src 'none'` neschimbat; doar `img-src` primește `https://tile.openstreetmap.org` (apare în `egress` din `fff-info`/`app.json` și în panoul de transparență). Fără activare, 0 cereri de rețea (verificat în test).
- Textele care afirmau „fără hartă de bază / fără rețea” (descriere, notă, subsol, etichetă ARIA, dialogul „Despre”, limite) sunt acum „implicit” și se schimbă dinamic cât timp harta OSM e activă; tot în 8 limbi.
- README (8 limbi): secțiunile „Hartă de bază OpenStreetMap (opțională)” și „Corecția altitudinii cu DEM: planificat”, politica de rețea/CSP actualizată; „Stare: stabil · Offline: complet; cere internet doar pentru harta OSM opțională”.
- Teste: `tests/osm.test.mjs` (30 de verificări, dale simulate local, inclusiv server fără CORS); `tests/test.mjs` G3 actualizat (singura gazdă externă permisă în cod: tile.openstreetmap.org); versiune 2.1.0.

### Neimplementat
- **Corecția altitudinii cu DEM: planificat.** Nu se poate face offline într-un singur fișier fără a încorpora date de teren (zeci de MB–GB) sau fără un serviciu online suplimentar (a doua destinație de rețea). Descris în README.
- Harta OSM nu apare în exporturile SVG/PNG și la tipărire (ar cere atribuire în export și încărcarea dalelor într-un canvas/SVG separat); doar pe ecran.
- Starea hărții OSM nu se salvează între sesiuni (intenționat: oprită implicit la fiecare deschidere).
- Serverul public OSM poate refuza cereri fără Referer (deschidere din `file://`); testat doar cu dale simulate local, nu cu serverul real.

## 2.0.0
- Versiunea anterioară (vezi istoricul din README).
