import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { CONFIG } from './config.js';

let client = null;
let broken = false;

/** Returns a shared Supabase client, or null when the backend is unreachable. */
export async function getSupabase() {
  if (broken) return null;
  if (client) return client;
  try {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return null;
    client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { headers: { 'x-client-info': 'orokrone-storefront' } },
    });
    return client;
  } catch (err) {
    console.warn('[orokrone] Supabase unavailable, local mode', err);
    broken = true;
    return null;
  }
}

export function markBackendBroken() { broken = true; }
export function isBackendBroken() { return broken; }
