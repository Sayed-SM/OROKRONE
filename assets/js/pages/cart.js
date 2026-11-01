import { initI18n, t, L, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, toast, qs, emptyState } from '../components/ui.js';
import { cart, couponStore } from '../lib/cart.js';
import { listProducts, applyCoupon, getShippingRates } from '../lib/db.js';
import { money, computeTotals, plainNumber } from '../lib/pricing.js';
import { productArt } from '../lib/watch-svg.js';
import { CONFIG } from '../lib/config.js';
import { esc } from '../lib/validate.js';

let coupon = couponStore.get();
let rates = [];

function render() {
  const items = cart.items();
  const host = qs('#cart-layout');
  if (!items.length) {
    coupon = null;
    host.innerHTML = emptyState({
      iconName: 'bag', title: t('cart.empty'), hint: t('cart.emptyHint'),
      action: `<a class="btn btn-gold" href="shop.html">${t('actions.shopNow')}</a>`,
    });
    return;
  }
  const totals = computeTotals({ items, coupon, rates });
  const remaining = CONFIG.FREE_SHIPPING_OVER - (totals.subtotal - totals.discount);

  host.innerHTML = `
    <div class="cart-items">
      ${items.map((it) => `
        <article class="cart-item" data-id="${esc(it.id)}">
          <a class="cart-item-art" href="product.html?slug=${encodeURIComponent(it.slug)}">${productArt(it)}</a>
          <div class="cart-item-info">
            <h3><a href="product.html?slug=${encodeURIComponent(it.slug)}">${esc(L(it, 'name'))}</a></h3>
            <span class="muted small">${money(it.price)}</span>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button data-dec aria-label="-">${icon('minus', 'icon-sm')}</button>
                <output>${plainNumber(it.qty)}</output>
                <button data-inc aria-label="+">${icon('plus', 'icon-sm')}</button>
              </div>
              <button class="btn btn-ghost btn-sm" data-remove>${icon('trash', 'icon-sm')}<span>${t('actions.remove')}</span></button>
            </div>
          </div>
          <div class="cart-item-total"><strong>${money(it.price * it.qty)}</strong></div>
        </article>`).join('')}
      <button class="btn btn-ghost btn-sm" id="clear-cart">${icon('trash', 'icon-sm')}<span>${t('actions.clear')}</span></button>
    </div>
    <aside class="summary-card">
      <h2>${t('cart.summary')}</h2>
      ${coupon ? `
        <div class="applied-coupon"><span>${icon('tag', 'icon-sm')} ${esc(coupon.code)}</span>
          <button class="icon-btn" id="remove-coupon" aria-label="${t('actions.remove')}">${icon('x', 'icon-sm')}</button></div>`
      : `
        <form class="coupon-row" id="coupon-form">
          <input name="code" placeholder="${t('cart.couponPh')}" aria-label="${t('cart.coupon')}" maxlength="24" required>
          <button class="btn btn-outline btn-sm" type="submit">${t('actions.apply')}</button>
        </form>`}
      <div class="summary-row"><span>${t('cart.subtotal')}</span><strong>${money(totals.subtotal)}</strong></div>
      ${totals.discount ? `<div class="summary-row discount"><span>${t('cart.discount')}</span><strong>- ${money(totals.discount)}</strong></div>` : ''}
      <div class="summary-row"><span>${t('cart.shipping')}</span><span class="small muted">${totals.shipping === 0 ? t('cart.freeShipping') : t('cart.shippingAtCheckout')}</span></div>
      ${remaining > 0 ? `<p class="notice">${icon('truck')}<span>${t('cart.freeShippingHint', { v: money(remaining) })}</span></p>` : ''}
      <div class="summary-row total"><span>${t('cart.total')}</span><strong>${money(totals.subtotal - totals.discount)}</strong></div>
      <a class="btn btn-gold btn-block btn-lg" href="checkout.html">${t('actions.checkout')}</a>
      <a class="btn btn-ghost btn-block" href="shop.html">${t('actions.continue')}</a>
    </aside>`;

  host.querySelectorAll('.cart-item').forEach((row) => {
    const id = row.dataset.id;
    const item = items.find((it) => it.id === id);
    row.querySelector('[data-inc]').addEventListener('click', () => { cart.setQty(id, item.qty + 1); render(); });
    row.querySelector('[data-dec]').addEventListener('click', () => { cart.setQty(id, item.qty - 1); render(); });
    row.querySelector('[data-remove]').addEventListener('click', () => { cart.remove(id); render(); });
  });
  qs('#clear-cart').addEventListener('click', () => { cart.clear(); couponStore.set(null); coupon = null; render(); });
  qs('#coupon-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get('code');
    const btn = e.target.querySelector('button');
    btn.classList.add('is-loading');
    try {
      coupon = await applyCoupon(code, totals.subtotal);
      couponStore.set(coupon);
      toast(t('cart.couponApplied', { v: money(computeTotals({ items, coupon, rates }).discount) }));
      render();
    } catch {
      toast(t('cart.couponInvalid'), { type: 'error' });
    } finally {
      btn.classList.remove('is-loading');
    }
  });
  qs('#remove-coupon')?.addEventListener('click', () => { coupon = null; couponStore.set(null); render(); });
}

async function init() {
  initI18n();
  mountChrome({ active: 'cart' });
  [rates] = await Promise.all([getShippingRates()]);
  const products = await listProducts();
  cart.sync(products);
  coupon = couponStore.get();
  render();
  onLangChange(render);
}

document.addEventListener('DOMContentLoaded', init);
