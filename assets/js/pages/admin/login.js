import { initI18n, t, toggleLang } from '../../i18n/i18n.js';
import { auth } from '../../lib/auth.js';
import { toast } from '../../components/ui.js';

async function init() {
  initI18n();
  document.querySelector('[data-lang-toggle]').addEventListener('click', toggleLang);
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    document.querySelector('.admin-demo-hint').hidden = false;
  } else {
    document.querySelector('.admin-demo-hint')?.remove();
  }
  if (await auth.isAdmin()) { location.replace('index.html'); return; }
  const form = document.querySelector('#admin-login-form');
  const error = document.querySelector('#admin-login-error');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const fields = new FormData(form);
    const button = form.querySelector('[type="submit"]');
    button.classList.add('is-loading'); button.disabled = true;
    try {
      await auth.signIn(String(fields.get('email')).trim(), String(fields.get('password')));
      if (!(await auth.isAdmin())) {
        await auth.signOut();
        error.textContent = t('admin.notAdmin');
        return;
      }
      location.replace('index.html');
    } catch {
      error.textContent = t('toast.error');
    } finally {
      button.classList.remove('is-loading'); button.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
