# Shikasen 鹿 · 新幹線

Carlos' Japan-Reisenotizbuch: Empfehlungen, Karte, Route, Tagesplan, Eki-Stempelheft, KI-Reiseassistent.

## Veröffentlichen
Netlify ist mit diesem Repo verbunden: jeder Push auf `main` geht automatisch live.
Vorher in `sw.js` die `VERSION` erhöhen, damit die App auf dem iPhone „Neue Version“ anzeigt.

## Daten bearbeiten
```
python3 tools/places.py export   # erzeugt places.json
# places.json bearbeiten
python3 tools/places.py import   # schreibt zurück in index.html
```

## KI-Chat
Siehe `worker/shikasen-ki-worker.js` (Cloudflare Worker, Anleitung im Datei-Kopf).
