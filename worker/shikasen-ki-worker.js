/**
 * Shikasen KI-Vermittler — Cloudflare Worker
 * ------------------------------------------------------------
 * Nimmt Chat-Anfragen der Shikasen-App entgegen, prüft den
 * Zugangscode und leitet sie mit DEINEM OpenAI-Schlüssel weiter.
 * Der Schlüssel bleibt hier auf dem Server und ist nie in der App.
 *
 * Einstellungen (Cloudflare → Worker → Settings → Variables and Secrets):
 *   OPENAI_API_KEY   (Secret)  dein Schlüssel, beginnt mit sk-…
 *   ACCESS_CODES     (Secret)  ein oder mehrere Codes, mit Komma getrennt,
 *                              z. B.  carlos-2026,freunde-tokyo
 *   DAILY_LIMIT      (Text, optional)  max. Anfragen pro Code und Tag, Standard 200
 *   ALLOWED_MODELS   (Text, optional)  Standard: gpt-4.1-mini,gpt-4.1
 *
 * Optional für das Tageslimit: einen KV-Namespace mit dem Namen USAGE
 * an den Worker binden (Bindings → KV namespace → Variable name: USAGE).
 * Ohne KV funktioniert alles, nur ohne Tageslimit.
 */

const DEFAULT_MODELS = ['gpt-4.1-mini', 'gpt-4.1'];
const MAX_BODY_BYTES = 200_000;      // schützt vor riesigen Anfragen
const MAX_OUTPUT_TOKENS = 1500;      // Obergrenze pro Antwort

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code',
    'Access-Control-Max-Age': '86400',
    ...extra,
  };
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: cors({ 'Content-Type': 'application/json; charset=utf-8' }),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/') {
      return json(200, { ok: true, service: 'shikasen-ki' });
    }
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return json(404, { error: 'Not found' });
    }

    if (!env.OPENAI_API_KEY) return json(500, { error: 'Server: OPENAI_API_KEY fehlt.' });

    // --- Zugangscode prüfen ---
    const codes = String(env.ACCESS_CODES || '').split(',').map(s => s.trim()).filter(Boolean);
    const code = (request.headers.get('X-Access-Code') || '').trim();
    if (!codes.length || !codes.includes(code)) {
      return json(401, { error: 'Falscher oder fehlender Zugangscode.' });
    }

    // --- Tageslimit (nur mit KV-Binding USAGE) ---
    if (env.USAGE) {
      const limit = parseInt(env.DAILY_LIMIT || '200', 10);
      const day = new Date().toISOString().slice(0, 10);
      const key = `${day}:${code}`;
      const used = parseInt((await env.USAGE.get(key)) || '0', 10);
      if (used >= limit) return json(429, { error: `Tageslimit erreicht (${limit}). Morgen geht's weiter.` });
      await env.USAGE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
    }

    // --- Anfrage prüfen ---
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'Anfrage zu groß.' });
    let body;
    try { body = JSON.parse(raw); } catch { return json(400, { error: 'Ungültiges JSON.' }); }

    const allowed = String(env.ALLOWED_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
    const models = allowed.length ? allowed : DEFAULT_MODELS;
    if (!models.includes(body.model)) body.model = models[0];
    if (!Array.isArray(body.messages)) return json(400, { error: 'messages fehlt.' });

    body.max_completion_tokens = Math.min(body.max_completion_tokens || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS);
    delete body.max_tokens;

    // --- An OpenAI weiterleiten (Streaming wird durchgereicht) ---
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: cors({
        'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream',
        'Cache-Control': 'no-cache',
      }),
    });
  },
};
