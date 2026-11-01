import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { toast, qs } from '../components/ui.js';
import { auth } from '../lib/auth.js';
import { validateForm, validators } from '../lib/validate.js';

async function init() {
  initI18n();
  mountChrome({ active: 'account' });
  const form = qs('#reset-form');
  const error = qs('#reset-error');

  // Supabase puts the recovery session in the URL hash; detectSessionInUrl handles it.
  const sb = await (await import('../lib/supabase-client.js')).getSupabase();
  if (sb) {
    try { await sb.auth.getSession(); } catch { /* ignore */ }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const { valid, values } = validateForm(e.target, {
      password: [validators.required, validators.password],
      confirm: [validators.required],
    });
    if (!valid) return;
    if (values.password !== values.confirm) {
      error.textContent = t('validation.passwordMismatch');
      return;
    }
    const btn = qs('#reset-submit');
    btn.classList.add('is-loading'); btn.disabled = true;
    try {
      await auth.updatePassword(values.password);
      toast(t('auth.passwordUpdated'));
      setTimeout(() => { location.href = 'account.html'; }, 1200);
    } catch (err) {
      console.error('[reset-password]', err);
      error.textContent = t('toast.error');
      btn.classList.remove('is-loading'); btn.disabled = false;
    }
  });
  onLangChange(() => {});
}

document.addEventListener('DOMContentLoaded', init);