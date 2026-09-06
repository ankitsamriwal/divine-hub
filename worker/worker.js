// Divine Hub — Divine Guide proxy worker (Cloudflare, free tier)
// Holds the Gemini API key as a worker secret (GEMINI_API_KEY).
// CORS-locked to the GitHub Pages origin. Best-effort per-IP rate limit
// (in-memory per isolate; no KV/D1 so the API token needs only Workers Scripts Edit).

const ALLOWED_ORIGINS = new Set([
  'https://ankitsamriwal.github.io',
  'https://prarthana.vercel.app'
]);
const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
const RATE_LIMIT = 20;          // requests
const RATE_WINDOW_MS = 3600000; // per hour, per IP, per isolate (best effort)

const buckets = new Map(); // ip -> {start, count}

function rateOk(ip) {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now - b.start > RATE_WINDOW_MS) { b = { start: now, count: 0 }; buckets.set(ip, b); }
  if (buckets.size > 5000) buckets.clear(); // bound memory
  b.count++;
  return b.count <= RATE_LIMIT;
}

function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.has(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: 'forbidden_origin' }), { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!rateOk(ip)) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }); }
    if (!body || typeof body !== 'object') return new Response(JSON.stringify({ error: 'bad_body' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });

    // Constrain what the public can send: capped history, fixed generation config.
    const sys = (body.system_instruction && body.system_instruction.parts && body.system_instruction.parts[0] && String(body.system_instruction.parts[0].text || '')).slice(0, 45000);
    const contents = Array.isArray(body.contents) ? body.contents.slice(-10).map(c => ({
      role: c.role === 'model' ? 'model' : 'user',
      parts: [{ text: String((c.parts && c.parts[0] && c.parts[0].text) || '').slice(0, 4000) }]
    })).filter(c => c.parts[0].text) : [];
    if (!contents.length || !sys) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });

    const payload = {
      system_instruction: { parts: [{ text: sys }] },
      contents: contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 600 }
    };

    let lastErr = 'llm_unavailable';
    for (const model of MODELS) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(env.GEMINI_API_KEY), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) { lastErr = 'gemini_http_' + res.status; continue; }
        const data = await res.json();
        const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts.map(p => p.text).join('');
        if (text && text.trim()) {
          return new Response(JSON.stringify({ text: text.trim() }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
        lastErr = 'empty_response';
      } catch (e) { lastErr = 'fetch_error'; }
    }
    return new Response(JSON.stringify({ error: lastErr }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
};
