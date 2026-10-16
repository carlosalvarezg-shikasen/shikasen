# Shikasen – Hinweise für Claude / Agenten

Persönliche Japan-Reise-App von Carlos (PWA, eine Datei). Wird über Netlify aus diesem Repo veröffentlicht.

## Struktur
- `index.html` – komplette App (HTML, CSS, JS, Bilder als data-URIs). Ortsdaten stehen in einer Zeile `window.JAPAN_DATA = [...]`.
- `sw.js` – Service Worker (Offline). Bei jeder Veröffentlichung `VERSION` erhöhen.
- `tools/places.py` – Ortsdaten exportieren/importieren (`export` → `places.json`, `import` → zurück in `index.html`). `places.json` nicht committen.
- `worker/` – Cloudflare Worker für den KI-Chat (Schlüssel liegt bei Cloudflare, nie im Repo).

## Ortsdaten (ein Eintrag)
`id, name, category, city, region, address, station, lat, lng, homepage,`
`description_en/_de/_es, recommendation_en/_de/_es` (dazu `description`/`recommendation` = englische Fassung).
Kategorien: Place, Restaurant, Café, Bar/Izakaya, Onsen/Sento, Store, Stationary, Video games, Flea market, Kyudo, Food, Special experience.
Städte: Tokyo, Osaka, Kyoto, Nikko, Kanazawa, Kyushu, Okinawa, Nagoya, Niigata, Aomori.

## Regeln für Datenpflege
- IDs nie ändern oder neu vergeben (Favoriten, Stempel und Notizen der Nutzer hängen daran). Neue Orte bekommen max(id)+1.
- Carlos' eigene Sätze und Meinungen in den Tipps behalten; nur belegte Fakten ergänzen (Quelle in der PR nennen). Kein „⚠️ verify“, keine Etiketten.
- Geschlossene Orte nicht still löschen, sondern in der PR auflisten und Carlos entscheiden lassen.
- Tipps: du-Form (DE), tú (ES), 2–4 Sätze, max. ca. 300 Zeichen.
- Änderungen immer als Pull Request mit Zusammenfassung (geändert / umgezogen / geschlossen / unklar), nie direkt auf `main`.
