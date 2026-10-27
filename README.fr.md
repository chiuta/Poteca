# Poteca — visionneuse et éditeur de traces GPX

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version :** 2.1.0 · **Dernière mise à jour :** 2026-10-27

**État:** stable · **Hors ligne:** complet ; internet requis uniquement pour la carte OpenStreetMap facultative (désactivée par défaut)

Langues de l'interface : **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

Poteca ouvre des traces GPX, GeoJSON, KML et CSV, les affiche sur une carte locale (par défaut sans fond de carte), calcule des statistiques (distance, dénivelé positif/négatif, temps en mouvement et à l'arrêt, vitesses, pentes, tours par kilomètre/mile), présente un profil altimétrique interactif synchronisé avec la carte et permet d'éditer les traces (découpe, scission, fusion, inversion, simplification, suppression des sauts GPS, points manuels, waypoints) et de les exporter. Tout s'exécute dans le navigateur, hors ligne.

![capture d'écran](screenshot.fr.png)

La capture montre des données de démonstration synthétiques (« Charger un exemple »), générées localement ; ce ne sont pas des traces réelles.

**Application en ligne :** https://chiuta.github.io/apps/Poteca/

## Mode d'emploi

1. **Ouvrir des fichiers** (ou les glisser dans la page) : plusieurs fichiers à la fois. Le journal d'import indique ce qui a été lu, ce qui a été ignoré et pourquoi.
2. Onglet **Traces** : visibilité, couleur, nom, suppression. **Statistiques** : les valeurs, la différence entre le dénivelé positif lissé et brut, le tableau des tours (km ou miles) et le tableau des segments. Les paramètres (lissage, seuil de montée, seuil d'arrêt) sont modifiables.
3. **Carte** : molette de la souris / pincement / `+` `−` pour zoomer, glisser ou flèches pour se déplacer, `0` pour recadrer. Modes : navigation, ajouter un point, déplacer un point, supprimer un point, waypoint.
4. **Profil** : un clic ou les flèches (Maj = grand pas) déplacent le curseur, en synchronisation avec la carte ; coloration selon la pente, la vitesse ou la fréquence cardiaque ; marquer A et B pour découper/extraire/scinder.
5. Onglet **Édition** : découpe sur un intervalle, scission, fusion, inversion, simplification de Douglas–Peucker (avec affichage préalable du nombre de points obtenu), suppression des sauts GPS, décalage horaire, comparaison de deux traces.
6. Onglet **Couches** : couches GeoJSON personnelles et images géoréférencées (image + 2 points de contrôle ou emprise manuelle).
7. Onglet **Export** : GPX 1.1, GeoJSON, KML, CSV ; SVG/PNG pour la carte et le profil ; impression avec légende ; zone de confidentialité (coupe les N premiers/derniers mètres à l'export).
8. Onglet **Session** : sauvegarde `.fff.json`, import, « Tout supprimer ».

## Ce qu'elle ne fait PAS, et limites

- **Pas de fond de carte par défaut.** Elle ne télécharge aucune tuile sauf si vous activez la carte OpenStreetMap facultative (voir plus bas). On ne voit que les traces, la grille adaptative, l'échelle et les couches que vous chargez vous-même.
- Images d'arrière-plan : PNG/JPEG/WebP avec deux points de contrôle ou une emprise manuelle, en projection Web Mercator ; le GeoTIFF **n'est pas** lu, la rotation n'est pas corrigée.
- Les statistiques de dénivelé dépendent du lissage et du seuil ; les valeurs sont des estimations (l'altitude GPS est bruitée). Poteca affiche aussi la valeur brute à titre de comparaison.
- La distance est calculée par haversine (sphère R = 6 371 008,8 m) ; Vincenty (WGS84) est optionnel et peut différer jusqu'à ~0,3 %.
- La suppression des sauts est heuristique : vérifiez le résultat sur la carte avant d'enregistrer.
- La comparaison de deux traces ne fonctionne que sur les portions communes (proximité spatiale) ; les écarts de temps exigent que les deux traces comportent l'heure.
- Fichiers très volumineux : 200 000 points (~21 Mo de GPX) s'importent en quelques secondes (dans notre test, ≈3 s dans l'application), mais l'interface peut se figer brièvement (jusqu'à ~2 s) lors des opérations lourdes. Les fichiers GPX de plus de ~4 Mo ne sont plus vérifiés quant à la bonne formation XML ; ils sont lus de façon tolérante.
- La mémoire du navigateur limite le nombre total de points ; une grande session est enregistrée compressée dans IndexedDB (localStorage uniquement pour les petites sessions). Si l'enregistrement échoue, l'état « non enregistré » s'affiche.
- Pas de conversion de datum, de MGRS/UTM, d'itinéraires sur route ni de synchronisation avec des appareils GPS.
- Les traductions sont automatiques (voir plus bas).

## Confidentialité

Elle s'exécute localement et n'envoie rien. La CSP bloque toute connexion réseau (`connect-src 'none'`) ; la seule exception est `img-src` pour tile.openstreetmap.org, utilisée UNIQUEMENT si vous activez manuellement la carte OpenStreetMap facultative (désactivée par défaut). Vos fichiers ne quittent pas l'appareil. Seuls la session (localStorage/IndexedDB, clés préfixées `fff.poteca.`) et les préférences (langue, thème) sont enregistrées localement. « Tout supprimer » efface tout. La zone de confidentialité coupe le début et la fin de la trace à l'export (par ex. pour ne pas révéler l'adresse de votre domicile).

## Formats acceptés

- **GPX 1.0 et 1.1** : `trk`/`trkseg`, `rte`, `wpt` ; extensions Garmin TrackPointExtension (`hr`, `cad`, `atemp`) ; préfixes d'espaces de noms ; sans `time`/`ele` ; XML tronqué (on récupère ce qui peut l'être).
- **GeoJSON** (Point, LineString, MultiLineString, Polygon → couche), **KML** (Placemark avec LineString/Point/gx:Track), **CSV** (séparateur et en-tête détectés, virgule décimale, regroupement par trace).
- Export : GPX 1.1 (vérifié dans les tests avec un analyseur indépendant), GeoJSON, KML, CSV, SVG, PNG.

## Aspects techniques

Un seul fichier `index.html`, sans bibliothèque externe. Projections locales Web Mercator et équirectangulaire ; dessin sur canvas, avec le même chemin de dessin pour l'export SVG/PNG et l'impression. Profil SVG accessible (rôle `slider`). Lissage de l'altitude sur une fenêtre de distance, dénivelé positif/négatif avec hystérésis, vitesse maximale sur une fenêtre de 5 s, Douglas–Peucker itératif. Session empaquetée en deltas entiers et compressée en gzip. CSP stricte : `script-src` avec hash sha256, sans `eval`, sans gestionnaires en ligne, `connect-src 'none'` ; aucun assouplissement n'a été nécessaire (`worker-src blob:` et `img-src data: blob:` proviennent du modèle commun). Les tests (`tests/test.mjs`, Playwright, réseau bloqué, CSP appliquée) vérifient les statistiques par rapport à des valeurs analytiques, les allers-retours GPX/GeoJSON/KML, la tolérance de simplification, l'accessibilité (axe-core, 0 violation) et les performances à 200 000 points.

## Tiers

Aucun code tiers.

## Traductions

L'interface existe en 8 langues : le roumain (par défaut) et l'anglais, rédigés par l'auteur ; le français, l'italien, l'espagnol, le portugais, le hongrois et l'allemand sont des traductions automatiques, non vérifiées par des locuteurs natifs.

## Licence

MIT — voir le fichier `LICENSE` à la racine du dépôt.

## Fond de carte OpenStreetMap (facultatif)

Dans l’onglet **Couches** se trouve la case **Afficher la carte OpenStreetMap**.

- **Désactivée par défaut** et **non enregistrée** : à chaque ouverture de l’application, elle est de nouveau désactivée. L’activer demande une confirmation explicite.
- **Avertissement réseau :** tant qu’elle est active, Poteca demande des tuiles PNG de 256×256 px à `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Le serveur OpenStreetMap voit votre adresse IP, votre navigateur, la page d’origine de la requête (Referer) et les coordonnées des tuiles (approximativement la zone et le niveau de zoom). **Vos traces, waypoints et fichiers ne sont pas envoyés.**
- CSP : `connect-src 'none'` reste inchangé ; seule `img-src` reçoit `https://tile.openstreetmap.org` (également déclaré dans `fff-info`/`app.json`, `egress`). Sans activation, l’application ne fait aucune requête.
- Affichée uniquement en projection **Web Mercator** et seulement à l’écran : **absente des exports SVG/PNG et de l’impression**. Attribution sur la carte : © OpenStreetMap ; données © les contributeurs d’OpenStreetMap (ODbL). L’usage des tuiles suit la [politique d’utilisation des tuiles OSM](https://operations.osmfoundation.org/policies/tiles/) : seulement les tuiles de la zone visible (64 au plus), pas de préchargement en masse ; le serveur public peut bloquer les requêtes sans Referer (p. ex. ouverture depuis `file://`).
- Hors ligne ou réseau bloqué, les tuiles n’apparaissent pas (un message d’erreur s’affiche) ; le reste de l’application fonctionne normalement.

## Correction d’altitude par modèle numérique de terrain (MNT) : prévu

**Non implémenté.** Corriger l’altitude GPS avec un MNT (SRTM, Copernicus, etc.) est impossible hors ligne dans un seul fichier sans embarquer des données de relief (de dizaines de Mo à des Go) ni recourir à un service en ligne supplémentaire, ce qui ajouterait une seconde destination réseau. Cela reste à la feuille de route ; en attendant, Poteca montre la montée lissée et la valeur brute et ne prétend pas à une précision supérieure à celle des données GPS.

## Historique
- **2.1.0 — 2026-10-27 :** fond de carte **OpenStreetMap facultatif** (désactivé par défaut, non enregistré, avec confirmation et avertissement réseau ; seulement `img-src` vers tile.openstreetmap.org) ; correction d’altitude par MNT : prévu ; lignes État/Hors ligne ; CHANGELOG.md (précédente : v2.0.0).

- 1.0.0 — 2026-10-14 : première version.
