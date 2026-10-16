#!/usr/bin/env python3
"""Ortsdaten aus index.html holen bzw. zurückschreiben.

  python3 tools/places.py export   ->  places.json (zum Bearbeiten)
  python3 tools/places.py import   ->  schreibt places.json zurück in index.html
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
JSON = ROOT / "places.json"
MARK = "window.JAPAN_DATA = "

def split():
    s = HTML.read_text(encoding="utf-8")
    i = s.index(MARK) + len(MARK)
    j = s.index("\n", i)
    raw = s[i:j].rstrip()
    semi = raw.endswith(";")
    return s, i, j, json.loads(raw.rstrip(";")), semi

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    s, i, j, data, semi = split()
    if cmd == "export":
        JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{len(data)} Orte -> {JSON.name}")
    elif cmd == "import":
        new = json.loads(JSON.read_text(encoding="utf-8"))
        ids = [e["id"] for e in new]
        assert len(ids) == len(set(ids)), "doppelte IDs"
        for e in new:
            for k in ("id", "name", "category", "city", "lat", "lng"):
                assert k in e, f"Feld {k} fehlt bei {e.get('name')}"
        out = s[:i] + json.dumps(new, ensure_ascii=False) + (";" if semi else "") + s[j:]
        HTML.write_text(out, encoding="utf-8")
        print(f"{len(new)} Orte in index.html geschrieben")
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
