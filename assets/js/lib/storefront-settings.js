import { getSupabase } from './supabase-client.js';
import { auth } from './auth.js';
import { STORAGE_KEYS } from './config.js';
import { SHOWCASE_STORAGE_KEY } from './showcase-settings.js';
import {
  DEFAULT_STOREFRONT_SETTINGS,
  migrateLegacyShowcaseSettings,
  normalizeStorefrontSettings,
} from './storefront-settings-schema.js';

let status = 'not-loaded';

function localDemoHost() {
  return typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname);
}

async function demoSettings() {
  if (!localDemoHost()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.demoStorefrontSettings));
    if (value && typeof value === 'object') return value;
  } catch { /* read legacy localhost settings below */ }
  try {
    return migrateLegacyShowcaseSettings(JSON.parse(localStorage.getItem(SHOWCASE_STORAGE_KEY)));
  } catch { return null; }
}

function isMissingSettingsTable(error) {
  return error?.code === 'PGRST205' || /storefront_settings.*schema cache/i.test(error?.message || '');
}

export function getStorefrontSettingsStatus() {
  return status;
}

export async function getStorefrontSettings() {
  const local = await demoSettings();
  if (local) {
    status = 'local-demo';
    return normalizeStorefrontSettings(local);
  }
  const sb = await getSupabase();
  if (!sb) {
    status = 'backend-unavailable';
    return normalizeStorefrontSettings(DEFAULT_STOREFRONT_SETTINGS);
  }

  const { data, error } = await sb.from('storefront_settings').select('settings')
    .eq('id', 'storefront').maybeSingle();
  if (error) {
    status = isMissingSettingsTable(error) ? 'migration-required' : 'backend-unavailable';
    if (!isMissingSettingsTable(error)) console.warn('[orokrone/settings] Could not load storefront settings:', error.message);
    const fallback = await demoSettings();
    if (fallback) {
      status = 'local-demo';
      return normalizeStorefrontSettings(fallback);
    }
    return normalizeStorefrontSettings(DEFAULT_STOREFRONT_SETTINGS);
  }

  status = 'remote';
  return normalizeStorefrontSettings(data?.settings || DEFAULT_STOREFRONT_SETTINGS);
}

export async function saveStorefrontSettings(value) {
  const settings = normalizeStorefrontSettings(value);
  const user = localDemoHost() ? await auth.user() : null;
  if (user?.id === 'demo-admin' && user.role === 'admin') {
    localStorage.setItem(STORAGE_KEYS.demoStorefrontSettings, JSON.stringify(settings));
    status = 'local-demo';
    window.dispatchEvent(new CustomEvent('storefront-settings:change', { detail: settings }));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('orokrone:storefront-settings');
      channel.postMessage({ saved: true });
      channel.close();
    }
    return settings;
  }
  const sb = await getSupabase();
  if (!sb) throw new Error('storefront_settings_backend_unavailable');

  const { error } = await sb.from('storefront_settings').upsert({
    id: 'storefront',
    settings,
    updated_at: new Date().toISOString(),
  }).select('id').single();

  if (error) {
    if (isMissingSettingsTable(error)) {
      status = 'migration-required';
      throw new Error('storefront_settings_migration_required');
    }
    throw error;
  }

  status = 'remote';
  window.dispatchEvent(new CustomEvent('storefront-settings:change', { detail: settings }));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('orokrone:storefront-settings');
    channel.postMessage({ saved: true });
    channel.close();
  }
  return settings;
}
