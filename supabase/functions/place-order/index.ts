import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((x) => x.trim()).filter(Boolean);
const hits = new Map<string, { count: number; until: number }>();
const cors = (origin: string | null) => {
  const safeOrigin = origin && (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers });
  if (req.headers.get('origin') && headers['Access-Control-Allow-Origin'] === 'null') return Response.json({ error: 'origin_not_allowed' }, { status: 403, headers });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const previous = hits.get(ip);
  if (previous && previous.until > now && previous.count >= 8) return Response.json({ error: 'rate_limited' }, { status: 429, headers });
  hits.set(ip, !previous || previous.until <= now ? { count: 1, until: now + 60_000 } : { ...previous, count: previous.count + 1 });
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).byteLength > 16_000) return Response.json({ error: 'payload_too_large' }, { status: 413, headers });
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 20) {
      return Response.json({ error: 'invalid_payload' }, { status: 400, headers });
    }
    const authHeader = req.headers.get('Authorization') || `Bearer ${ANON}`;
    let userId: string | null = null;
    if (authHeader !== `Bearer ${ANON}`) {
      const authClient = createClient(URL, ANON, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) return Response.json({ error: 'unauthorized' }, { status: 401, headers });
      userId = user.id;
    }
    const supabase = createClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${SERVICE}` } },
    });
    const { data, error } = await supabase.rpc('place_order', { p_payload: payload, p_user_id: userId });
    if (error) {
      const known = ['out_of_stock', 'product_unavailable', 'invalid_coupon', 'invalid_customer', 'invalid_email', 'invalid_qty', 'invalid_items'];
      const code = known.find((x) => error.message.includes(x)) || 'order_failed';
      const status = code === 'out_of_stock' || code === 'product_unavailable' ? 409 : 400;
      return Response.json({ error: code }, { status, headers });
    }
    return Response.json(data, { status: 201, headers });
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400, headers });
  }
});
