import { t, applyI18n, toggleLang, getLang, onLangChange } from '../i18n/i18n.js';
import { cart } from '../lib/cart.js';
import { wishlist } from '../lib/wishlist.js';
import { compare } from '../lib/compare.js';
import { CONFIG } from '../lib/config.js';
import { icon } from './ui.js';

const LOGO = `<svg class="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
  <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="2"/>
  <circle cx="20" cy="20" r="12.5" stroke="currentColor" stroke-width="1" opacity=".45"/>
  <path d="M20 12v8l5.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M20 1v4M20 35v4M1 20h4M35 20h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

function headerHTML(active) {
  const link = (href, key, name) => `<a href="${href}" class="${active === name ? 'is-active' : ''}" data-i18n="${key}">${t(key)}</a>`;
  return `
  <div class="announce" data-i18n-attr="aria-label:home.offerTitle">
    <span data-i18n="home.offerLead">${t('home.offerLead')}</span>
  </div>
  <header class="site-header">
    <div class="container header-inner">
      <button class="icon-btn nav-toggle" data-drawer-open aria-label="${t('nav.menu')}">${icon('menu')}</button>
      <a class="brand" href="index.html" aria-label="${CONFIG.STORE_NAME}">
        ${LOGO}
        <span>${getLang() === 'ar' ? CONFIG.STORE_NAME_AR : CONFIG.STORE_NAME}<small data-i18n="brandTagline">${t('brandTagline')}</small></span>
      </a>
      <nav class="main-nav" aria-label="main">
        ${link('index.html', 'nav.home', 'home')}
        ${link('index.html#showcase', 'nav.showcase', 'showcase')}
        ${link('shop.html', 'nav.shop', 'shop')}
        ${link('compare.html', 'nav.compare', 'compare')}
        ${link('track.html', 'nav.track', 'track')}
      </nav>
      <div class="header-actions">
        <a class="icon-btn" href="shop.html" aria-label="${t('nav.search')}">${icon('search')}</a>
        <button class="icon-btn lang-btn" data-lang-toggle>${icon('globe', 'icon-sm')}<span>${getLang() === 'ar' ? 'EN' : 'عربي'}</span></button>
        <a class="icon-btn account-link" href="account.html" aria-label="${t('nav.account')}">${icon('user')}</a>
        <a class="icon-btn" href="wishlist.html" aria-label="${t('nav.wishlist')}">${icon('heart')}<span class="cart-badge" data-badge="wishlist"></span></a>
        <a class="icon-btn" href="compare.html" aria-label="${t('nav.compare')}">${icon('compare')}<span class="cart-badge" data-badge="compare"></span></a>
        <a class="icon-btn" href="cart.html" aria-label="${t('nav.cart')}">${icon('bag')}<span class="cart-badge" data-badge="cart"></span></a>
      </div>
    </div>
  </header>
  <div class="mobile-drawer" id="mobile-drawer">
    <div class="drawer-scrim" data-drawer-close></div>
    <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="${t('nav.menu')}">
      <button class="icon-btn" data-drawer-close aria-label="${t('nav.close')}">${icon('x')}</button>
      <a href="index.html">${icon('home')}<span data-i18n="nav.home">${t('nav.home')}</span></a>
      <a href="shop.html">${icon('grid')}<span data-i18n="nav.shop">${t('nav.shop')}</span></a>
      <a href="wishlist.html">${icon('heart')}<span data-i18n="nav.wishlist">${t('nav.wishlist')}</span></a>
      <a href="compare.html">${icon('compare')}<span data-i18n="nav.compare">${t('nav.compare')}</span></a>
      <a href="track.html">${icon('truck')}<span data-i18n="nav.track">${t('nav.track')}</span></a>
      <a href="account.html">${icon('user')}<span data-i18n="nav.account">${t('nav.account')}</span></a>
      <a href="admin/login.html">${icon('lock')}<span data-i18n="nav.admin">${t('nav.admin')}</span></a>
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="footer-brand">${getLang() === 'ar' ? CONFIG.STORE_NAME_AR : CONFIG.STORE_NAME}</div>
        <p class="footer-about" data-i18n="footer.about">${t('footer.about')}</p>
      </div>
      <div>
        <h2 data-i18n="footer.shop">${t('footer.shop')}</h2>
        <a href="shop.html" data-i18n="shop.all">${t('shop.all')}</a>
        <a href="shop.html?category=classic" data-i18n="home.classic">${t('home.classic')}</a>
        <a href="shop.html?category=sport" data-i18n="home.sport">${t('home.sport')}</a>
        <a href="shop.html?category=ladies" data-i18n="home.ladies">${t('home.ladies')}</a>
        <a href="shop.html?category=accessories" data-i18n="home.accessories">${t('home.accessories')}</a>
      </div>
      <div>
        <h2 data-i18n="footer.support">${t('footer.support')}</h2>
        <a href="track.html" data-i18n="nav.track">${t('nav.track')}</a>
        <a href="account.html" data-i18n="nav.account">${t('nav.account')}</a>
        <a href="cart.html" data-i18n="nav.cart">${t('nav.cart')}</a>
        <a href="wishlist.html" data-i18n="nav.wishlist">${t('nav.wishlist')}</a>
      </div>
      <div>
        <h2 data-i18n="footer.contact">${t('footer.contact')}</h2>
        <div class="footer-contact">
          <div>${icon('phone', 'icon-sm')}<span dir="ltr">${CONFIG.SUPPORT_PHONE}</span></div>
          <div>${icon('mail', 'icon-sm')}<span>${CONFIG.SUPPORT_EMAIL}</span></div>
          <div>${icon('clock', 'icon-sm')}<span data-i18n="footer.hours">${t('footer.hours')}</span></div>
          <div>${icon('pin', 'icon-sm')}<span data-i18n="footer.madeIn">${t('footer.madeIn')}</span></div>
        </div>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© <span data-year></span> ${CONFIG.STORE_NAME} — <span data-i18n="footer.rights">${t('footer.rights')}</span></span>

    </div>
  </footer>`;
}

export function updateBadges() {
  const counts = { cart: cart.count(), wishlist: wishlist.count(), compare: compare.count() };
  Object.entries(counts).forEach(([key, value]) => {
    document.querySelectorAll(`[data-badge="${key}"]`).forEach((el) => {
      el.textContent = value ? String(value) : '';
      el.dataset.count = String(value);
    });
  });
}

export function mountChrome({ active = '', base = '' } = {}) {
  const headerHost = document.getElementById('site-header');
  const footerHost = document.getElementById('site-footer');
  const render = () => {
    if (headerHost) headerHost.innerHTML = headerHTML(active);
    if (footerHost) footerHost.innerHTML = footerHTML(base);
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    bindChromeEvents();
    applyI18n();
    updateBadges();
  };

  const bindChromeEvents = () => {
    headerHost?.querySelector('[data-lang-toggle]')?.addEventListener('click', toggleLang);
    const drawer = document.getElementById('mobile-drawer');
    headerHost?.querySelectorAll('[data-drawer-open]').forEach((btn) => btn.addEventListener('click', () => {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }));
    headerHost?.querySelectorAll('[data-drawer-close]').forEach((btn) => btn.addEventListener('click', () => {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  };

  render();
  onLangChange(render);
  ['cart:change', 'wishlist:change', 'compare:change'].forEach((evt) => window.addEventListener(evt, updateBadges));
}
