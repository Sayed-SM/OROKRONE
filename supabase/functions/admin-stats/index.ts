import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((x) => x.trim()).filter(Boolean);
const corsFor = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && (allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ? origin : 'null',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin',
});

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.headers.get('origin') && corsHeaders['Access-Control-Allow-Origin'] === 'null') return Response.json({ error: 'origin_not_allowed' }, { status: 403, headers: corsHeaders });
  if (req.method !== 'GET') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return Response.json({ error: 'unauthorized' }, { status: 401, headers: corsHeaders });
  const supabase = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: corsHeaders });
  const { data: admin, error: roleError } = await supabase.rpc('is_admin');
  if (roleError || !admin) return Response.json({ error: 'forbidden' }, { status: 403, headers: corsHeaders });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30));
  const { data, error } = await supabase.rpc('admin_stats', { p_days: days });
  if (error) return Response.json({ error: 'stats_unavailable' }, { status: 500, headers: corsHeaders });
  return Response.json(data, { headers: corsHeaders });
});
