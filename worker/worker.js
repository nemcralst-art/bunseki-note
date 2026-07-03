const UPSTREAM = 'https://note.com';
const ALLOWED_ORIGIN = 'https://nemcralst-art.github.io';

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'GET' || !path.startsWith('/api/')) {
      return new Response('forbidden', { status: 403, headers: cors });
    }
    const r = await fetch(UPSTREAM + path, { headers: { accept: 'application/json' } });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { ...cors, 'content-type': r.headers.get('content-type') || 'application/json' },
    });
  },
};
