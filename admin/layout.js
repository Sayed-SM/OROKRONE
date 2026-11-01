import { t, getLang } from '../assets/js/i18n/i18n.js';
import { icon } from '../assets/js/components/ui.js';

const LINKS = [
  ['index.html', 'dashboard', 'chart'],
  ['showcase.html', 'showcase', 'sparkle'],
  ['products.html', 'products', 'box'],
  ['inventory.html', 'inventory', 'package'],
  ['orders.html', 'orders', 'bag'],
  ['coupons.html', 'coupons', 'tag'],
  ['reviews.html', 'reviews', 'message'],
];

export function mountAdmin(page) {
  const root = document.querySelector('[data-admin-root]');
  root.innerHTML = `
    <button class="admin-sidebar-scrim" data-admin-close aria-label="${t('nav.close')}"></button>
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-sidebar-head">
        <a class="admin-brand" href="index.html"><span class="admin-brand-mark">◷</span><span>OROKRONE<small>CONTROL ROOM</small></span></a>
        <button class="icon-btn admin-sidebar-close" type="button" data-admin-close aria-label="${t('nav.close')}" title="${t('nav.close')}">${icon('x')}</button>
      </div>
      <div class="admin-profile"><span class="admin-avatar">O</span><div><strong>OROKRONE</strong><small>Store manager</small></div></div>
      <nav class="admin-nav" aria-label="Admin">
        ${LINKS.map(([href, key, ic]) => `<a href="${href}" aria-label="${t(`admin.${key}`)}" title="${t(`admin.${key}`)}" class="${page === key ? 'is-active' : ''}">${icon(ic)}<span>${t(`admin.${key}`)}</span></a>`).join('')}
      </nav>
      <div class="admin-side-bottom">
        <a href="../index.html" aria-label="${t('admin.storefront')}" title="${t('admin.storefront')}">${icon('home')}<span>${t('admin.storefront')}</span></a>
        <button type="button" data-admin-lang aria-label="${getLang() === 'ar' ? 'English' : 'العربية'}" title="${getLang() === 'ar' ? 'English' : 'العربية'}">${icon('globe')}<span>${getLang() === 'ar' ? 'English' : 'العربية'}</span></button>
        <button type="button" data-admin-logout aria-label="${t('actions.logout')}" title="${t('actions.logout')}">${icon('logout')}<span>${t('actions.logout')}</span></button>
      </div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar">
        <button class="icon-btn admin-menu-toggle" data-admin-menu aria-label="${t('nav.menu')}" aria-expanded="true">${icon('menu')}</button>
        <div><span class="admin-breadcrumb">${t('admin.dashboard')}</span><h1>${t(`admin.${page}`)}</h1></div>
        <div class="admin-top-actions"><span class="admin-live"><i></i> ${getLang() === 'ar' ? 'مباشر' : 'Live'}</span><a class="btn btn-outline btn-sm" href="../index.html">${icon('eye', 'icon-sm')} ${t('admin.storefront')}</a></div>
      </header>
      <main class="admin-content" id="admin-content"></main>
    </div>`;

  root.querySelector('[data-admin-lang]').addEventListener('click', () => {
    localStorage.setItem('orokrone.lang', getLang() === 'ar' ? 'en' : 'ar');
    location.reload();
  });
  const menuButton = root.querySelector('[data-admin-menu]');
  const setMenuState = (open) => {
    const mobile = matchMedia('(max-width: 760px)').matches;
    root.classList.toggle('menu-open', mobile && open);
    root.classList.toggle('sidebar-collapsed', !mobile && !open);
    menuButton.setAttribute('aria-expanded', String(open));
  };
  menuButton.addEventListener('click', () => {
    const mobile = matchMedia('(max-width: 760px)').matches;
    const open = mobile ? !root.classList.contains('menu-open') : root.classList.contains('sidebar-collapsed');
    setMenuState(open);
  });
  root.querySelectorAll('[data-admin-close]').forEach((button) => button.addEventListener('click', () => setMenuState(false)));
  const viewport = matchMedia('(max-width: 760px)');
  viewport.addEventListener?.('change', () => {
    root.classList.remove('menu-open', 'sidebar-collapsed');
    menuButton.setAttribute('aria-expanded', 'true');
  });
  root.querySelector('[data-admin-logout]').addEventListener('click', async () => {
    const { auth } = await import('../assets/js/lib/auth.js');
    await auth.signOut();
    location.href = 'login.html';
  });
}
