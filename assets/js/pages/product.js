import { initI18n, t, L, onLangChange, formatDate } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { productCard, bindProductCards } from '../components/product-card.js';
import { icon, stars, toast, qs, emptyState } from '../components/ui.js';
import { getProduct, getReviews, submitReview, getRelated, listProducts } from '../lib/db.js';
import { productArt } from '../lib/watch-svg.js';
import { money, discountPercent, stockLabel, plainNumber } from '../lib/pricing.js';
import { cart } from '../lib/cart.js';
import { wishlist } from '../lib/wishlist.js';
import { compare } from '../lib/compare.js';
import { validateForm, validators, esc } from '../lib/validate.js';

let product = null;
let reviews = [];
let related = [];
let qty = 1;
let selectedRating = 5;

function renderProduct() {
  if (!product) {
    qs('#product-layout').innerHTML = emptyState({
      iconName: 'search', title: t('shop.empty'),
      action: `<a class="btn btn-gold" href="shop.html">${t('actions.continue')}</a>`,
    });
    qs('#reviews-section').classList.add('hidden');
    qs('#related-section').classList.add('hidden');
    return;
  }
  document.title = `${L(product, 'name')} | ${t('brand')}`;
  const off = discountPercent(product);
  const stock = stockLabel(product);
  const specs = product.specs || {};
  qs('#breadcrumbs').innerHTML = `
    <a href="index.html">${t('nav.home')}</a><span>/</span>
    <a href="shop.html">${t('nav.shop')}</a><span>/</span>
    <a href="shop.html?category=${esc(product.category)}">${t(`home.${product.category}`)}</a><span>/</span>
    <span>${esc(L(product, 'name'))}</span>`;

  qs('#product-layout').innerHTML = `
    <div class="product-gallery">
      <div class="gallery-frame">
        ${off ? `<span class="badge badge-sale gallery-badge">-${off}%</span>` : ''}
        ${productArt(product, { width: 380, height: 620 })}
      </div>
      <div class="gallery-note">
        <span>${icon('shield', 'icon-sm')} ${t('trust.authentic')}</span>
        <span>${icon('award', 'icon-sm')} ${t('trust.warranty')}</span>
      </div>
    </div>
    <div class="product-info-panel">
      <div>
        <span class="eyebrow">${esc(product.brand)}</span>
        <h1>${esc(L(product, 'name'))}</h1>
      </div>
      <div class="product-meta-line">
        ${stars(product.rating_avg)}
        <span>${t('product.basedOn', { n: plainNumber(product.rating_count) })}</span>
        <span>·</span><span>${t('product.sku')}: ${esc(product.sku)}</span>
      </div>
      <div class="product-price-line">
        <strong>${money(product.price)}</strong>
        ${product.old_price ? `<del>${money(product.old_price)}</del><span class="badge badge-sale">-${off}%</span>` : ''}
      </div>
      <p class="stock-line ${stock.tone}">${esc(stock.text)}</p>
      <p class="muted">${esc(L(product, 'description'))}</p>
      <div class="buy-row">
        <div class="qty-stepper" aria-label="${t('product.qty')}">
          <button type="button" id="qty-minus" aria-label="-">${icon('minus', 'icon-sm')}</button>
          <output id="qty-value">${plainNumber(qty)}</output>
          <button type="button" id="qty-plus" aria-label="+">${icon('plus', 'icon-sm')}</button>
        </div>
        <button class="btn btn-gold" id="add-cart" ${product.stock <= 0 ? 'disabled' : ''}>
          ${icon('bag', 'icon-sm')}<span>${t('actions.addToCart')}</span>
        </button>
        <button class="btn btn-primary" id="buy-now" ${product.stock <= 0 ? 'disabled' : ''}>${t('actions.buyNow')}</button>
      </div>
      <div class="secondary-actions">
        <button class="btn btn-outline btn-sm" id="wish-toggle">${icon('heart', 'icon-sm')}<span>${t('nav.wishlist')}</span></button>
        <button class="btn btn-outline btn-sm" id="compare-toggle">${icon('compare', 'icon-sm')}<span>${t('product.compareAdd')}</span></button>
        <button class="btn btn-ghost btn-sm" id="share-btn">${icon('copy', 'icon-sm')}<span>${t('product.share')}</span></button>
      </div>
      <div class="spec-table">
        <div><span>${t('product.caseSize')}</span><strong>${esc(specs.case_size || '—')}</strong></div>
        <div><span>${t('product.movement')}</span><strong>${esc(L(specs, 'movement'))}</strong></div>
        <div><span>${t('product.glass')}</span><strong>${esc(L(specs, 'glass'))}</strong></div>
        <div><span>${t('product.water')}</span><strong>${esc(specs.water || '—')}</strong></div>
        <div><span>${t('product.strap')}</span><strong>${esc(L(specs, 'strap'))}</strong></div>
        <div><span>${t('product.warranty')}</span><strong>${t('product.years2')}</strong></div>
      </div>
      <details class="acc" open>
        <summary>${t('product.delivery')}</summary>
        <p>${t('product.deliveryD')}</p>
      </details>
    </div>`;

  syncToggles();
  qs('#qty-minus').addEventListener('click', () => setQty(qty - 1));
  qs('#qty-plus').addEventListener('click', () => setQty(qty + 1));
  qs('#add-cart').addEventListener('click', () => {
    const res = cart.add(product, qty);
    if (!res.ok) { toast(t('product.outOfStock'), { type: 'error' }); return; }
    toast(t('actions.added'));
  });
  qs('#buy-now').addEventListener('click', () => {
    cart.add(product, qty);
    location.href = 'checkout.html';
  });
  qs('#wish-toggle').addEventListener('click', () => {
    const res = wishlist.toggle(product.id);
    toast(t(res.added ? 'toast.wishlistAdd' : 'toast.wishlistRemove'));
    syncToggles();
  });
  qs('#compare-toggle').addEventListener('click', () => {
    const res = compare.toggle(product.id);
    if (res.full) { toast(t('compare.maxReached'), { type: 'error' }); return; }
    toast(t(res.added ? 'toast.compareAdd' : 'toast.compareRemove'));
    syncToggles();
  });
  qs('#share-btn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); } catch { /* ignore */ }
    toast(t('product.linkCopied'));
  });
}

function setQty(value) {
  qty = Math.max(1, Math.min(value, Math.min(product.stock, 5)));
  qs('#qty-value').textContent = plainNumber(qty);
}

function syncToggles() {
  const wished = wishlist.has(product.id);
  qs('#wish-toggle')?.classList.toggle('is-added', wished);
  const compared = compare.has(product.id);
  const btn = qs('#compare-toggle');
  if (btn) btn.querySelector('span').textContent = t(compared ? 'product.compareRemove' : 'product.compareAdd');
}

function renderReviews() {
  const host = qs('#reviews-list');
  if (!reviews.length) {
    host.innerHTML = `<p class="notice">${icon('message')}<span>${t('product.noReviews')}</span></p>`;
    return;
  }
  const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  host.innerHTML = `
    <div class="review-card" style="display:flex;justify-content:space-between;align-items:center">
      <div><strong style="font-size:2rem;font-family:var(--font-latin-display)">${avg.toFixed(1)}</strong>${stars(avg)}</div>
      <span class="muted">${t('product.basedOn', { n: plainNumber(reviews.length) })}</span>
    </div>
    ${reviews.map((r) => `
      <article class="review-card">
        <div class="review-head"><strong>${esc(r.title)}</strong>${stars(r.rating)}</div>
        <span class="review-author">${esc(r.author)}</span>
        <p class="muted">${esc(r.body)}</p>
        <span class="small muted">${formatDate(r.created_at)}</span>
      </article>`).join('')}`;
}

function renderRatingInput() {
  qs('#rating-input').innerHTML = Array.from({ length: 5 }, (_, i) => `
    <button type="button" data-rate="${i + 1}" role="radio" aria-checked="${selectedRating === i + 1}" aria-label="${i + 1}">
      <svg class="icon star ${i < selectedRating ? 'is-on' : ''}" viewBox="0 0 24 24">
        <path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.9l6.1-.8L12 3.5Z"/>
      </svg></button>`).join('');
}

async function loadReviews() {
  reviews = await getReviews(product.id);
  renderReviews();
}

async function init() {
  initI18n();
  mountChrome({ active: 'shop' });
  const slug = new URLSearchParams(location.search).get('slug');
  product = slug ? await getProduct(slug) : null;
  renderProduct();
  renderRatingInput();
  if (!product) return;

  await loadReviews();
  related = await getRelated(product, 4);
  qs('#related-grid').innerHTML = related.map((p) => productCard(p)).join('');
  const all = await listProducts();
  bindProductCards(qs('#related-grid'), (id) => all.find((p) => p.id === id));

  qs('#rating-input').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rate]');
    if (!btn) return;
    selectedRating = Number(btn.dataset.rate);
    renderRatingInput();
  });
  qs('#review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { valid, values } = validateForm(e.target, {
      author: [validators.required, validators.name],
      title: [validators.required],
      body: [validators.required, validators.name],
    });
    if (!valid) return;
    const btn = e.target.querySelector('[type=submit]');
    btn.classList.add('is-loading');
    try {
      await submitReview({ ...values, rating: selectedRating, product_id: product.id });
      e.target.reset();
      selectedRating = 5;
      renderRatingInput();
      toast(t('product.reviewSent'));
    } catch {
      toast(t('toast.error'), { type: 'error' });
    } finally {
      btn.classList.remove('is-loading');
    }
  });

  onLangChange(() => {
    renderProduct(); renderReviews(); renderRatingInput();
    qs('#related-grid').innerHTML = related.map((item) => productCard(item)).join('');
  });
}

document.addEventListener('DOMContentLoaded', init);
