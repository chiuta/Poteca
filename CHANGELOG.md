# Jurnal de modificări — Poteca

Format: [SemVer](https://semver.org/lang/ro/) MAJOR.MINOR.PATCH.

## 2.3.5 — 2026-11-08

Previzualizarea simplificării arată și variația distanței și a urcării față de traseul original (calculată pe o copie, fără a modifica traseul); cheie nouă `s_delta` în 8 limbi.

## 2.3.2 — 2026-11-03

- Corectat: constanta de versiune din cod (GPX `creator`, filigran pe hartă, raport) era 2.3.0; urmează acum `app.json`.

## 2.3.1 — 2026-11-03

Etapa 4: jurnal de teren geolocalizat comun (plicul geo/journal, export GeoJSON/GPX), cu atlas în Arhiva fără frontiere

## 2.3.0 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.3.0 — 2026-11-01

- Corectat: adaptorul «Trimite la…» nu mai aruncă eroare când kitul FFF lipsește (gardian pe fiecare bloc; găsit de testul «fără kit» din CI).

Nou: «Trimite la…» (fff-kit, modulul FFF.bridge) — după orice export de fișier (GPX, ICS, CSV, Markdown) apare butonul «Trimite la…» către aplicațiile compatibile, iar importul de fișiere al aplicației primește plicuri .fff.json trimise de ele, cu confirmare înainte de import. Fără rețea, fără telemetrie.

## 2.2.0 — 2026-10-27 (anterior: 2.1.0)

Altitudine din DEM furnizat de utilizator:
- Fieldset nou în fila Editare: încarci fișiere SRTM `.hgt` (3″/1″, nume de forma N45E026.hgt); altitudinea punctelor acoperite este înlocuită cu valoarea interpolată biliniar; „void" și zonele fără dală rămân neschimbate; Ctrl+Z; raport cu diferența medie DEM − GPS. Nimic încorporat, nimic salvat, nicio cerere de rețea.
- Test nou `tests/dem.test.mjs` (19 verificări) cu dale SINTETICE, nu cu SRTM real; precizia verticală nu e garantată. Texte noi în 8 limbi (fr/it/es/pt/hu/de: traducere automată).
- README (8 limbi): secțiunea „DEM: planificat" înlocuită cu descrierea funcției și a limitelor.

---

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
