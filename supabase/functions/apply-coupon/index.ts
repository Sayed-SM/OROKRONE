import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((x) => x.trim()).filter(Boolean);
const headersFor = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ? origin : 'null',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
});

Deno.serve(async (req) => {
  const headers = headersFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers });
  if (headers['Access-Control-Allow-Origin'] === 'null' && req.headers.get('origin')) return Response.json({ error: 'origin_not_allowed' }, { status: 403, headers });
  try {
    const { code, subtotal } = await req.json();
    if (typeof code !== 'string' || code.length > 24 || !Number.isFinite(subtotal) || subtotal < 0) return Response.json({ error: 'invalid' }, { status: 400, headers });
    const supabase = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: code.toUpperCase(), p_subtotal: subtotal });
    if (error) throw error;
    if (!data?.valid) return Response.json({ valid: false, reason: data?.reason || 'invalid' }, { status: 200, headers });
    return Response.json({ valid: true, coupon: data.coupon }, { headers });
  } catch {
    return Response.json({ error: 'coupon_check_failed' }, { status: 400, headers });
  }
});
