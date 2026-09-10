// Divine Hub — Divine Guide proxy worker (Cloudflare, free tier)
// Holds the Gemini API key as a worker secret (GEMINI_API_KEY).
// CORS-locked to the GitHub Pages origin. Best-effort per-IP rate limit
// (in-memory per isolate; no KV/D1 so the API token needs only Workers Scripts Edit).

const ALLOWED_ORIGINS = new Set([
  'https://ankitsamriwal.github.io',
  'https://roadtodivinity.vercel.app',
  'https://prarthana-six.vercel.app',
  'https://aajkyapehnu.vercel.app',
  'https://aajkyakhau.vercel.app'
]);
const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
const RATE_LIMIT = 20;          // requests
const RATE_WINDOW_MS = 3600000; // per hour, per IP, per isolate (best effort)

const buckets = new Map(); // ip -> {start, count}

/* ---- Aaj Kya Khau grocery push: cron trigger + Web Push (VAPID) + KV ---- */
// KHAU_KV binding + VAPID_JWK secret + VAPID_PUB var are provisioned by deploy-worker.yml.
const PUSH_KEY = '1OI7dIZ5gi9od8fMsp6xBeMo16iYSfS2';
function b64urlBytes(buf){let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64urlStr(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function vapidJwt(endpoint, env){
  const aud = new URL(endpoint).origin;
  const header = b64urlStr(JSON.stringify({typ:'JWT',alg:'ES256'}));
  const claims = b64urlStr(JSON.stringify({aud:aud, exp: Math.floor(Date.now()/1000)+43200, sub:'mailto:ankitsamriwal@gmail.com'}));
  const input = header+'.'+claims;
  const jwk = JSON.parse(env.VAPID_JWK);
  const key = await crypto.subtle.importKey('jwk', jwk, {name:'ECDSA', namedCurve:'P-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign({name:'ECDSA', hash:'SHA-256'}, key, new TextEncoder().encode(input));
  return input+'.'+b64urlBytes(sig);
}
async function sendGroceryPush(env){
  if(!env.KHAU_KV || !env.VAPID_JWK || !env.VAPID_PUB) return {skipped:'missing_env'};
  const [sub, list] = await Promise.all([env.KHAU_KV.get('subscription','json'), env.KHAU_KV.get('list','json')]);
  if(!sub || !sub.endpoint) return {skipped:'no_subscription'};
  const jwt = await vapidJwt(sub.endpoint, env);
  const res = await fetch(sub.endpoint, {method:'POST', headers:{'Authorization':'vapid t='+jwt+', k='+env.VAPID_PUB, 'TTL':'86400'}});
  if(res.status===404 || res.status===410) await env.KHAU_KV.delete('subscription'); // stale sub
  return {status:res.status, date:(list&&list.date)||null, meals:(list&&list.meals)||null, items:(list&&list.items&&list.items.length)||0};
}
function pushKeyOk(request){ return request.headers.get('x-push-key') === PUSH_KEY; }
async function handlePushRoute(request, env, url, headers){
  const json = (o, st) => new Response(JSON.stringify(o), { status: st||200, headers: { ...headers, 'Content-Type': 'application/json' } });
  if(url.pathname === '/subscribe' && request.method === 'POST'){
    if(!pushKeyOk(request)) return json({error:'bad_key'}, 401);
    let sub; try{ sub = await request.json(); }catch{ return json({error:'bad_json'}, 400); }
    if(!sub || !sub.endpoint || !sub.keys) return json({error:'bad_subscription'}, 400);
    await env.KHAU_KV.put('subscription', JSON.stringify(sub));
    return json({ok:true});
  }
  if(url.pathname === '/sync' && request.method === 'POST'){
    if(!pushKeyOk(request)) return json({error:'bad_key'}, 401);
    let d; try{ d = await request.json(); }catch{ return json({error:'bad_json'}, 400); }
    const meals = Array.isArray(d.meals) ? d.meals.map(String).slice(0,4) : [];
    const items = Array.isArray(d.items) ? d.items.map(String).slice(0,60) : [];
    await env.KHAU_KV.put('list', JSON.stringify({date:String(d.date||''), meals, items, savedAt:Date.now()}));
    return json({ok:true, meals:meals.length, items:items.length});
  }
  if(url.pathname === '/push-data' && request.method === 'GET'){
    if(!pushKeyOk(request)) return json({error:'bad_key'}, 401);
    const list = await env.KHAU_KV.get('list', 'json');
    return json(list || {meals:[], items:[]});
  }
  if(url.pathname === '/debug-push' && request.method === 'GET'){
    if(!pushKeyOk(request)) return json({error:'bad_key'}, 401);
    return json(await sendGroceryPush(env));
  }
  return null;
}

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-push-key',
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
    if (url.pathname.startsWith('/subscribe') || url.pathname.startsWith('/sync') || url.pathname.startsWith('/push-data') || url.pathname.startsWith('/debug-push')) {
      try { const r = await handlePushRoute(request, env, url, headers); if (r) return r; } catch (e) { return new Response(JSON.stringify({ error: 'push_route_error', detail: String(e && e.message || e).slice(0, 200) }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }); }
    }
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
    let imgCount = 0;
    const contents = Array.isArray(body.contents) ? body.contents.slice(-10).map(c => {
      const parts = Array.isArray(c.parts) ? c.parts.slice(0, 4).map(p => {
        if (p && p.inline_data && typeof p.inline_data.data === 'string') {
          const mt = String(p.inline_data.mime_type || p.inline_data.mimeType || '');
          if (!/^image\/(jpeg|png|webp)$/.test(mt) || imgCount >= 2) return null;
          imgCount++;
          return { inline_data: { mime_type: mt, data: p.inline_data.data.slice(0, 1500000) } };
        }
        const t = String((p && p.text) || '').slice(0, 4000);
        return t ? { text: t } : null;
      }).filter(Boolean) : [];
      return { role: c.role === 'model' ? 'model' : 'user', parts };
    }).filter(c => c.parts.length) : [];
    if (!contents.length || !sys) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });

    const payload = {
      system_instruction: { parts: [{ text: sys }] },
      contents: contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 2500 }
    };

    let lastErr = 'llm_unavailable';
    const attempts = [];
    for (const model of MODELS) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(env.GEMINI_API_KEY), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let msg = '';
          try { const eb = await res.json(); msg = eb && eb.error && eb.error.message ? String(eb.error.message).slice(0, 160) : ''; } catch (e) {}
          attempts.push(model + ':' + res.status + (msg ? ' ' + msg : ''));
          lastErr = 'gemini_http_' + res.status; continue;
        }
        attempts.push(model + ':' + res.status);
        const data = await res.json();
        const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts.map(p => p.text).join('');
        if (text && text.trim()) {
          return new Response(JSON.stringify({ text: text.trim() }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
        lastErr = 'empty_response';
      } catch (e) { lastErr = 'fetch_error'; }
    }
    // all models failed - ask Gemini which models this key can use
    let available = null;
    try {
      const lr = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(env.GEMINI_API_KEY) + '&pageSize=100');
      const ld = await lr.json();
      if (lr.ok && ld && ld.models) {
        available = ld.models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
      } else { available = ['list_failed_' + lr.status]; }
    } catch (e) { available = ['list_error']; }
    return new Response(JSON.stringify({ error: lastErr, attempts: attempts, available_models: available }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
  },
  // 04:00 UTC = 08:00 Asia/Dubai: push tomorrow's meals + grocery list
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendGroceryPush(env));
  }
};
