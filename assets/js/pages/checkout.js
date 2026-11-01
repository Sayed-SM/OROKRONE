import { initI18n, t, L, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, toast, qs, emptyState } from '../components/ui.js';
import { cart, couponStore } from '../lib/cart.js';
import { placeOrder, getShippingRates } from '../lib/db.js';
import { money, computeTotals, plainNumber } from '../lib/pricing.js';
import { productArt } from '../lib/watch-svg.js';
import { validateForm, validators, esc } from '../lib/validate.js';

let rates = [];
let coupon = couponStore.get();

const totalsNow = () => computeTotals({
  items: cart.items(), coupon,
  governorate: qs('#governorate')?.value || null, rates,
});

function renderSummary() {
  const items = cart.items();
  const totals = totalsNow();
  qs('#checkout-summary').innerHTML = `
    <h2>${t('cart.summary')}</h2>
    <div class="mini-order">
      ${items.map((it) => `
        <div class="mini-order-item">
          ${productArt(it)}
          <div><div class="small">${esc(L(it, 'name'))}</div><span class="qty">× ${plainNumber(it.qty)}</span></div>
          <strong>${money(it.price * it.qty)}</strong>
        </div>`).join('')}
    </div>
    <div class="summary-row"><span>${t('cart.subtotal')}</span><strong>${money(totals.subtotal)}</strong></div>
    ${totals.discount ? `<div class="summary-row discount"><span>${t('cart.discount')} (${esc(coupon.code)})</span><strong>- ${money(totals.discount)}</strong></div>` : ''}
    <div class="summary-row"><span>${t('cart.shipping')}</span><strong>${totals.shipping === 0 ? t('cart.freeShipping') : money(totals.shipping)}</strong></div>
    <div class="summary-row total"><span>${t('cart.total')}</span><strong>${money(totals.total)}</strong></div>
    <button class="btn btn-gold btn-block btn-lg" id="place-order" type="submit" form="checkout-form">
      ${icon('check', 'icon-sm')}<span>${t('actions.placeOrder')}</span>
    </button>
    <p class="small muted center">${t('checkout.summaryNote')}</p>`;
}

function renderStatics() {
  qs('#contact-title').innerHTML = `${icon('user')}<span>${t('checkout.contact')}</span>`;
  qs('#address-title').innerHTML = `${icon('pin')}<span>${t('checkout.address')}</span>`;
  qs('#payment-title').innerHTML = `${icon('wallet')}<span>${t('checkout.payment')}</span>`;
  qs('#payment-option').innerHTML = `${icon('wallet', 'icon-lg')}<div><strong>${t('checkout.cod')}</strong><p class="muted small">${t('checkout.codD')}</p></div>`;
  const select = qs('#governorate');
  const current = select.value;
  select.innerHTML = rates.map((r) => `
    <option value="${esc(r.governorate)}" data-fee="${r.fee}">
      ${document.documentElement.lang === 'ar' ? r.governorate : r.governorate_en} — ${r.fee ? money(r.fee) : ''}
    </option>`).join('');
  select.value = current || rates[0].governorate;
}

async function init() {
  initI18n();
  mountChrome({ active: 'cart' });
  rates = await getShippingRates();

  if (!cart.items().length) {
    qs('#checkout-layout').classList.add('hidden');
    qs('#checkout-empty').innerHTML = emptyState({
      iconName: 'bag', title: t('checkout.emptyCart'),
      action: `<a class="btn btn-gold" href="shop.html">${t('actions.shopNow')}</a>`,
    });
    return;
  }

  renderStatics();
  renderSummary();
  qs('#governorate').addEventListener('change', renderSummary);
  window.addEventListener('cart:change', renderSummary);
  onLangChange(() => { renderStatics(); renderSummary(); });

  qs('#checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { valid, values } = validateForm(e.target, {
      name: [validators.required, validators.name],
      phone: [validators.required, validators.phone],
      email: [validators.email],
      governorate: [validators.required],
      city: [validators.required],
      address: [validators.required, validators.name],
    });
    if (!valid) { toast(t('validation.required'), { type: 'error' }); return; }

    const btn = qs('#place-order');
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      const result = await placeOrder({
        customer: values,
        items: cart.items(),
        coupon_code: coupon?.code || null,
      });
      sessionStorage.setItem('orokrone.lastOrder', JSON.stringify(result));
      cart.clear();
      couponStore.set(null);
      location.href = 'order-success.html';
    } catch (err) {
      console.error('[checkout]', err);
      const message = err.message === 'out_of_stock' ? t('product.outOfStock')
        : err.message === 'backend_unavailable' || err.message === 'place_order_function_not_deployed'
          ? t('checkout.backendUnavailable') : t('toast.error');
      toast(message, { type: 'error' });
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
