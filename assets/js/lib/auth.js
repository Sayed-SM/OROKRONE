import { getSupabase } from './supabase-client.js';
import { STORAGE_KEYS } from './config.js';

/** Demo-only credentials for local mode (never valid against Supabase). */
export const DEMO_ADMIN = { email: 'admin@orokrone.demo', password: 'admin1234' };

const localDemoAllowed = ['localhost', '127.0.0.1'].includes(location.hostname);

const demoUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.demoUser)); } catch { return null; }
};
const setDemoUser = (user) => {
  if (user) localStorage.setItem(STORAGE_KEYS.demoUser, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.demoUser);
  window.dispatchEvent(new CustomEvent('auth:change', { detail: user }));
};

export const auth = {
  async user() {
    const sb = await getSupabase();
    if (sb) {
      try {
        const { data } = await sb.auth.getUser();
        if (data?.user) return data.user;
      } catch { /* fall through to demo session */ }
    }
    return localDemoAllowed ? demoUser() : null;
  },

  async session() {
    const sb = await getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  },

  async signIn(email, password) {
    const sb = await getSupabase();
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        window.dispatchEvent(new CustomEvent('auth:change', { detail: data.user }));
        return { user: data.user };
      }
      if (error && error.status !== 400) console.warn('[auth] remote sign-in failed:', error.message);
      if (email.toLowerCase() !== DEMO_ADMIN.email) {
        // Real backend answered and rejected: surface the real error.
        if (error && error.status === 400) throw error;
      }
    }
    // Local demo fallback
    if (localDemoAllowed && email.toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      const user = { id: 'demo-admin', email, role: 'admin', user_metadata: { full_name: 'Store Manager' } };
      setDemoUser(user);
      return { user };
    }
    if (localDemoAllowed && email.toLowerCase() === DEMO_ADMIN.email) throw new Error('invalid_credentials');
    if (localDemoAllowed && email && password.length >= 6) {
      const user = { id: `demo-${email}`, email, role: 'customer', user_metadata: { full_name: email.split('@')[0] } };
      setDemoUser(user);
      return { user };
    }
    throw new Error('invalid_credentials');
  },

  async signUp(email, password, fullName) {
    const sb = await getSupabase();
    if (sb) {
      const { data, error } = await sb.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return { user: data.user, needsConfirmation: !data.session };
    }
    const user = { id: `demo-${email}`, email, role: 'customer', user_metadata: { full_name: fullName } };
    setDemoUser(user);
    return { user };
  },

  async signOut() {
    const sb = await getSupabase();
    if (sb) { try { await sb.auth.signOut(); } catch { /* ignore */ } }
    setDemoUser(null);
    window.dispatchEvent(new CustomEvent('auth:change', { detail: null }));
  },

  /** Role is read from the profiles table (RLS), never from user input. */
  async isAdmin() {
    const sb = await getSupabase();
    const user = await this.user();
    if (!user) return false;
    if (sb && !user.id.startsWith('demo')) {
      try {
        const { data, error } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (!error && data) return data.role === 'admin';
      } catch { /* ignore */ }
    }
    return localDemoAllowed && String(user.id).startsWith('demo-') && user.role === 'admin';
  },

  onChange(fn) {
    window.addEventListener('auth:change', () => fn());
    getSupabase().then((sb) => sb?.auth.onAuthStateChange(() => fn()));
  },
};
