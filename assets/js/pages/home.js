import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { initShowcase } from '../components/showcase.js';
import { productCard, bindProductCards } from '../components/product-card.js';
import { icon, stars, toast, skeletonCards, qs } from '../components/ui.js';
import { observeReveals } from '../lib/spring.js';
import { listProducts, getMode } from '../lib/db.js';
import { SEED_REVIEWS } from '../lib/seed.js';
import { productArt } from '../lib/watch-svg.js';
import { loadShowcaseSettings } from '../lib/showcase-settings.js';
import { esc, isEmail } from '../lib/validate.js';
import { plainNumber } from '../lib/pricing.js';
import { initMotion } from '../lib/motion.js';

let products = [];

function renderTrust() {
  const items = [
    ['wallet', 'trust.cod', 'trust.codD'],
    ['truck', 'trust.shipping', 'trust.shippingD'],
    ['shield', 'trust.warranty', 'trust.warrantyD'],
    ['award', 'trust.authentic', 'trust.authenticD'],
  ].map(([ic, title, desc]) => `
    <div class="trust-item">${icon(ic, 'icon-lg')}<div><strong data-i18n="${title}">${t(title)}</strong><p class="muted small" data-i18n="${desc}">${t(desc)}</p></div></div>`).join('');
  qs('#trust-strip').innerHTML = `<div class="trust-strip-track">${items}${items}</div>`;
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
  const hero = products.find((p) => p.id === 'p-royale-twotone-white') || products[0];
  if (hero) qs('#craft-art').innerHTML = `<div class="craft-art-frame">${productArt(hero, { width: 320, height: 540 })}</div>`;
  qs('#craft-features').innerHTML = [
    ['clock', 'home.craft1T', 'home.craft1D'],
    ['shield', 'home.craft2T', 'home.craft2D'],
    ['award', 'home.craft3T', 'home.craft3D'],
  ].map(([ic, title, desc]) => `
    <div class="craft-feature">${icon(ic)}<div><strong data-i18n="${title}">${t(title)}</strong><p class="muted small" data-i18n="${desc}">${t(desc)}</p></div></div>`).join('');
  qs('#stats-row').innerHTML = [
    [12, 'home.statsYears'], [4800, 'home.statsPieces'], [3200, 'home.statsClients'], [27, 'home.statsCities'],
  ].map(([value, label]) => `
    <div class="stat"><strong>${plainNumber(value)}${value === 4800 || value === 3200 ? '+' : ''}</strong><span class="muted small" data-i18n="${label}">${t(label)}</span></div>`).join('');
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

  products = await listProducts();
  const showcase = loadShowcaseSettings();
  const heading = qs('.showcase-hero h1');
  const lead = qs('.showcase-hero .lead');
  if (heading) heading.textContent = document.documentElement.lang === 'ar' ? showcase.heading_ar : showcase.heading_en;
  if (lead) lead.textContent = document.documentElement.lang === 'ar' ? showcase.lead_ar : showcase.lead_en;
  const showcaseSection = qs('#showcase');
  if (showcase.backgroundImage) {\n    const safeBg = String(showcase.backgroundImage).replace(/[\"'()\\s]/g, '');\n    if (safeBg) {\n      showcaseSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.62)), url(\"${safeBg}\")`;\n      showcaseSection.style.backgroundSize = 'cover';\n      showcaseSection.style.backgroundPosition = 'center';\n    }\n  } else {","oldString":"if (showcase.backgroundImage) {\n    showcaseSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.62)), url(\"${showcase.backgroundImage}\")`;\n    showcaseSection.style.backgroundSize = 'cover';\n    showcaseSection.style.backgroundPosition = 'center';\n  } else {","path":"C:\\Users\\opencode2.SAYED\\OROKRONE\\assets\\js\\pages\\home.js
    showcaseSection.style.backgroundImage = '';
    showcaseSection.style.backgroundSize = '';
    showcaseSection.style.backgroundPosition = '';
  }
  showcaseSection.dataset.theme = showcase.theme;
  const selected = showcase.productIds.length
    ? showcase.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean)
    : products.filter((p) => p.featured);
  initShowcase(qs('#stage'), selected.length ? selected : products.slice(0, 6));
  renderDynamic();
  observeReveals();
  initMotion();
  qs('#trust-strip').innerHTML = `<div class="trust-strip-track">${qs('#trust-strip').innerHTML}${qs('#trust-strip').innerHTML}</div>`;
  bindProductCards(document, (id) => products.find((p) => p.id === id));
  onLangChange(() => {
    const next = loadShowcaseSettings();
    qs('.showcase-hero h1').textContent = document.documentElement.lang === 'ar' ? next.heading_ar : next.heading_en;
    qs('.showcase-hero .lead').textContent = document.documentElement.lang === 'ar' ? next.lead_ar : next.lead_en;
    renderDynamic();
    qs('#trust-strip').innerHTML = `<div class="trust-strip-track">${qs('#trust-strip').innerHTML}${qs('#trust-strip').innerHTML}</div>`;
  });
  window.addEventListener('showcase:change', () => location.reload());
  onLangChange(renderDynamic);
  if (getMode() === 'local') console.info('[orokrone] demo/local data mode');

  qs('#copy-coupon').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('WELCOME10'); } catch { /* clipboard may be blocked */ }
    toast(t('home.copied'));
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
