import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome, setAnnouncementSettings } from '../components/header.js';
import { initShowcase } from '../components/showcase.js';
import { productCard, bindProductCards } from '../components/product-card.js';
import { icon, stars, toast, skeletonCards, qs } from '../components/ui.js';
import { observeReveals } from '../lib/spring.js';
import { listProducts, getMode } from '../lib/db.js';
import { SEED_REVIEWS } from '../lib/seed.js';
import { productArt } from '../lib/watch-svg.js';
import { getStorefrontSettings } from '../lib/storefront-settings.js';
import { esc, isEmail } from '../lib/validate.js';
import { plainNumber } from '../lib/pricing.js';
import { initMotion } from '../lib/motion.js';

let products = [];
let storefrontSettings = null;

function renderTrust() {
  const active = (storefrontSettings?.trust || []).filter((item) => item.enabled);
  const items = active.map((item) => `
    <div class="trust-item">${icon(item.icon, 'icon-lg')}<div><strong>${esc(item[`title_${document.documentElement.lang}`])}</strong><p class="muted small">${esc(item[`description_${document.documentElement.lang}`])}</p></div></div>`).join('');
  const host = qs('#trust-strip');
  host.hidden = !active.length;
  host.innerHTML = active.length ? `<div class="trust-strip-track">${items}${items}</div>` : '';
}

function renderFeatured() {
  const grid = qs('#featured-grid');
  const featured = [...products].sort((a, b) => (b.featured - a.featured) || b.rating_avg - a.rating_avg).slice(0, 8);
  grid.innerHTML = featured.map((p) => productCard(p, { reveal: true })).join('');
  observeReveals(grid);
}

function renderCollections() {
  const categories = [
    ['classic', 'home.classic', 'p-heritage-champagne'],
    ['sport', 'home.sport', 'p-abyss-diver-300'],
    ['ladies', 'home.ladies', 'p-luna-pearl-rose'],
    ['accessories', 'home.accessories', 'p-atelier-roll'],
  ];
  qs('#collections-grid').innerHTML = categories.map(([slug, label, sampleId]) => {
    const sample = products.find((p) => p.id === sampleId) || products[0];
    const count = products.filter((p) => p.category === slug).length;
    return `
      <a class="collection-card reveal" href="shop.html?category=${slug}">
        <span class="collection-art">${sample ? productArt(sample) : ''}</span>
        <span class="collection-meta">
          <strong data-i18n="${label}">${t(label)}</strong>
          <span class="muted small">${plainNumber(count)} ${t('shop.results', { n: '' }).trim()}</span>
          <span class="collection-cta">${t('actions.discover')} ${icon('arrow', 'icon-sm')}</span>
        </span>
      </a>`;
  }).join('');
  observeReveals(qs('#collections-grid'));
}

function renderCraft() {
  const craft = storefrontSettings?.craft;
  const hero = products.find((p) => p.id === 'p-royale-twotone-white') || products[0];
  const lang = document.documentElement.lang;
  const art = craft?.image_url
    ? `<img class="watch-art watch-photo" src="${esc(craft.image_url)}" alt="${esc(craft[`heading_${lang}`])}" width="600" height="720" loading="lazy">`
    : (hero ? productArt(hero, { width: 320, height: 540 }) : '');
  qs('#craft-art').innerHTML = art ? `<div class="craft-art-frame">${art}</div>` : '';
  qs('.craft-copy .eyebrow').textContent = lang === 'ar' ? 'فحص دقيق لكل قطعة' : 'A careful check on every piece';
  qs('.craft-copy h2').textContent = craft?.[`heading_${lang}`] || '';
  qs('.craft-copy .lead').textContent = craft?.[`lead_${lang}`] || '';
  qs('#craft-features').innerHTML = (craft?.features || []).filter((item) => item.enabled).map((item) => `
    <div class="craft-feature">${icon(item.icon)}<div><strong>${esc(item[`title_${lang}`])}</strong><p class="muted small">${esc(item[`description_${lang}`])}</p></div></div>`).join('');
  qs('#stats-row').innerHTML = (craft?.stats || []).filter((item) => item.enabled).map((item) => `
    <div class="stat"><strong>${plainNumber(Number(item.value) || 0)}${esc(item.suffix)}</strong><span class="muted small">${esc(item[`label_${lang}`])}</span></div>`).join('');
}

function renderTestimonials() {
  const samples = [SEED_REVIEWS[0], SEED_REVIEWS[2], SEED_REVIEWS[5]];
  qs('#testimonials-grid').innerHTML = samples.map((r) => `
    <figure class="testimonial reveal">
      ${stars(r.rating)}
      <blockquote>“${esc(r.body)}”</blockquote>
      <figcaption>${esc(r.author)}<span class="muted small">${icon('checkCircle', 'icon-sm')} ${t('trust.authentic')}</span></figcaption>
    </figure>`).join('');
  observeReveals(qs('#testimonials-grid'));
}

function renderDynamic() {
  renderTrust();
  renderFeatured();
  renderCollections();
  renderCraft();
  renderTestimonials();
}

function renderShowcaseCopy() {
  const showcase = storefrontSettings?.showcase;
  if (!showcase) return;
  const lang = document.documentElement.lang;
  const heading = qs('.showcase-hero h1');
  const lead = qs('.showcase-hero .lead');
  if (heading) heading.textContent = showcase[`heading_${lang}`];
  if (lead) lead.textContent = showcase[`lead_${lang}`];
  const section = qs('#showcase');
  if (!section) return;
  section.dataset.theme = showcase.theme;
  if (showcase.backgroundImage) {
    const resolved = new URL(showcase.backgroundImage, location.href).href;
    section.style.backgroundImage = `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.62)), url(${JSON.stringify(resolved)})`;
    section.style.backgroundSize = 'cover';
    section.style.backgroundPosition = 'center';
  } else {
    section.style.backgroundImage = '';
    section.style.backgroundSize = '';
    section.style.backgroundPosition = '';
  }
}

async function init() {
  initI18n();
  mountChrome({ active: 'home' });
  qs('#featured-grid').innerHTML = skeletonCards(8);
  document.querySelectorAll('.stage-nav').forEach((btn, i) => {
    btn.innerHTML = icon(i === 0 ? 'chevronRight' : 'chevronLeft');
  });
  document.querySelector('[data-stage-prev]').innerHTML = icon('chevronRight');
  document.querySelector('[data-stage-next]').innerHTML = icon('chevronLeft');
  document.querySelector('.autoplay-btn').innerHTML = icon('pause');

  [products, storefrontSettings] = await Promise.all([listProducts(), getStorefrontSettings()]);
  setAnnouncementSettings(storefrontSettings.announcement);
  renderShowcaseCopy();
  const selected = storefrontSettings.showcase.productIds === null
    ? products.filter((p) => p.featured && !p.design?.accessory)
    : storefrontSettings.showcase.productIds.map((id) => products.find((p) => p.id === id)).filter((p) => p && !p.design?.accessory);
  initShowcase(qs('#stage'), selected);
  renderDynamic();
  observeReveals();
  initMotion();
  bindProductCards(document, (id) => products.find((p) => p.id === id));
  onLangChange(() => {
    setAnnouncementSettings(storefrontSettings.announcement);
    renderShowcaseCopy();
    renderDynamic();
  });
  window.addEventListener('storefront-settings:change', () => location.reload());
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('orokrone:storefront-settings');
    channel.addEventListener('message', () => location.reload());
  }
  if (getMode() === 'local') console.info('[orokrone] demo/local data mode');

  qs('#copy-coupon').addEventListener('click', async () => {
    let copied = false;
    try { await navigator.clipboard.writeText('WELCOME10'); copied = true; } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = 'WELCOME10';
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copied = true;
      } catch { /* ignore */ }
    }
    toast(copied ? t('home.copied') : 'WELCOME10', { type: copied ? 'success' : 'info' });
  });
  qs('#newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    if (!isEmail(email)) { toast(t('validation.email'), { type: 'error' }); return; }
    e.target.reset();
    toast(t('home.newsletterDone'));
  });
}

document.addEventListener('DOMContentLoaded', init);
