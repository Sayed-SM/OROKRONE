import { L, t } from '../i18n/i18n.js';
import { money, discountPercent } from '../lib/pricing.js';
import { productArt } from '../lib/watch-svg.js';
import { cart } from '../lib/cart.js';
import { wishlist } from '../lib/wishlist.js';
import { compare } from '../lib/compare.js';
import { icon, stars, toast } from './ui.js';
import { esc } from '../lib/validate.js';

export function productCard(p, { reveal = false } = {}) {
  const off = discountPercent(p);
  const wished = wishlist.has(p.id);
  const compared = compare.has(p.id);
  const out = p.stock <= 0;
  return `
  <article class="product-card ${reveal ? 'reveal' : ''}" data-product="${esc(p.id)}">
    <a class="product-art" href="product.html?slug=${encodeURIComponent(p.slug)}" aria-label="${esc(L(p, 'name'))}">
      <span class="art-halo"></span>
      ${productArt(p, { width: 220, height: 360 })}
    </a>
    <div class="product-flags">
      ${off ? `<span class="badge badge-sale">-${off}%</span>` : ''}
      ${p.featured && !off ? `<span class="badge badge-gold">${icon('sparkle', 'icon-sm')}</span>` : ''}
    </div>
    <button class="icon-btn wish-btn ${wished ? 'is-active' : ''}" data-wish="${esc(p.id)}"
      aria-pressed="${wished}" aria-label="${esc(t('nav.wishlist'))}">${icon('heart')}</button>
    <div class="product-info">
      <span class="product-brand">${esc(p.brand)}</span>
      <h3 class="product-name"><a href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(L(p, 'name'))}</a></h3>
      <div class="product-rating">${stars(p.rating_avg, { count: p.rating_count })}</div>
      <div class="product-price">
        <strong>${money(p.price)}</strong>
        ${p.old_price ? `<del>${money(p.old_price)}</del>` : ''}
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-sm" data-add="${esc(p.id)}" ${out ? 'disabled' : ''}>
          ${icon('bag', 'icon-sm')}<span>${esc(out ? t('product.outOfStock') : t('actions.addToCart'))}</span>
        </button>
        <button class="icon-btn compare-btn ${compared ? 'is-active' : ''}" data-compare="${esc(p.id)}"
          aria-pressed="${compared}" title="${esc(t('product.compareAdd'))}">${icon('compare')}</button>
      </div>
    </div>
  </article>`;
}

/** Shared card behaviour; `resolve(id)` returns the product from the page's dataset. */
export function bindProductCards(root, resolve) {
  root.addEventListener('click', (e) => {
    const wishBtn = e.target.closest('[data-wish]');
    const addBtn = e.target.closest('[data-add]');
    const compareBtn = e.target.closest('[data-compare]');
    if (wishBtn) {
      const res = wishlist.toggle(wishBtn.dataset.wish);
      wishBtn.classList.toggle('is-active', res.added);
      wishBtn.setAttribute('aria-pressed', String(res.added));
      toast(t(res.added ? 'toast.wishlistAdd' : 'toast.wishlistRemove'));
    }
    if (compareBtn) {
      const res = compare.toggle(compareBtn.dataset.compare);
      if (res.full) { toast(t('compare.maxReached'), { type: 'error' }); return; }
      compareBtn.classList.toggle('is-active', res.added);
      toast(t(res.added ? 'toast.compareAdd' : 'toast.compareRemove'));
    }
    if (addBtn) {
      const product = resolve(addBtn.dataset.add);
      if (!product) return;
      const res = cart.add(product, 1);
      if (!res.ok) { toast(t('product.outOfStock'), { type: 'error' }); return; }
      toast(t('actions.added'));
      addBtn.classList.add('is-added');
      setTimeout(() => addBtn.classList.remove('is-added'), 900);
    }
  });
}
