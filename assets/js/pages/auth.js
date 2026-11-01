import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { toast, qs } from '../components/ui.js';
import { auth } from '../lib/auth.js';
import { validateForm, validators } from '../lib/validate.js';

let mode = 'login';

function setMode(next) {
  mode = next;
  const isLogin = mode === 'login';
  qs('#tab-login').classList.toggle('is-active', isLogin);
  qs('#tab-register').classList.toggle('is-active', !isLogin);
  qs('#name-field').classList.toggle('hidden', isLogin);
  qs('#auth-title').textContent = t(isLogin ? 'auth.welcome' : 'auth.create');
  qs('#auth-lead').textContent = t(isLogin ? 'auth.loginLead' : 'auth.registerLead');
  qs('#auth-submit').textContent = t(isLogin ? 'actions.login' : 'actions.register');
}

function init() {
  initI18n();
  mountChrome({ active: 'account' });
  qs('#tab-login').addEventListener('click', () => setMode('login'));
  qs('#tab-register').addEventListener('click', () => setMode('register'));

  qs('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rules = {
      email: [validators.required, validators.emailRequired],
      password: [validators.required, validators.password],
    };
    if (mode === 'register') rules.name = [validators.required, validators.name];
    const { valid, values } = validateForm(e.target, rules);
    if (!valid) return;

    const btn = qs('#auth-submit');
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      if (mode === 'login') {
        await auth.signIn(values.email, values.password);
        toast(t('auth.loggedIn'));
      } else {
        const result = await auth.signUp(values.email, values.password, values.name);
        if (result.needsConfirmation) {
          toast(t('auth.checkEmail'));
          setMode('login');
          return;
        }
        toast(t('auth.loggedIn'));
      }
      const next = new URLSearchParams(location.search).get('next');
      location.href = next && /^[\w-]+\.html$/.test(next) ? next : 'account.html';
    } catch (err) {
      console.error('[auth]', err);
      toast(t('toast.error'), { type: 'error' });
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
  onLangChange(() => setMode(mode));
}

document.addEventListener('DOMContentLoaded', init);
