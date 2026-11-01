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

const totalsNow = () => {
  const totals = computeTotals({
    items: cart.items(), coupon,
    governorate: qs('#governorate')?.value || null, rates,
  });
  return rates.length ? totals : { ...totals, shipping: 0, total: Math.max(0, totals.subtotal - totals.discount) };
};

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
     <div class="summary-row"><span>${t('cart.shipping')}</span><strong>${!rates.length ? t('checkout.noShippingRates') : totals.shipping === 0 ? t('cart.freeShipping') : money(totals.shipping)}</strong></div>
    <div class="summary-row total"><span>${t('cart.total')}</span><strong>${money(totals.total)}</strong></div>
     <button class="btn btn-gold btn-block btn-lg" id="place-order" type="submit" form="checkout-form" ${rates.length ? '' : 'disabled'}>
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
  const current = select.value || (rates[0]?.governorate || '');
  select.innerHTML = rates.map((r) => `
    <option value="${esc(r.governorate)}" data-fee="${r.fee}">
      ${document.documentElement.lang === 'ar' ? r.governorate : r.governorate_en} — ${r.fee ? money(r.fee) : ''}
    </option>`).join('');
  select.value = rates.some((rate) => rate.governorate === current) ? current : '';

  // Render custom governorate dropdown
  const list = qs('#gov-list');
  if (list) {
    list.innerHTML = rates.map((r) => `
      <div class="gov-option" data-value="${esc(r.governorate)}" role="option" tabindex="-1">
        <span>${document.documentElement.lang === 'ar' ? r.governorate : r.governorate_en}</span>
        <span class="gov-fee">${r.fee ? money(r.fee) : t('cart.freeShipping')}</span>
      </div>`).join('');
  }
  const label = qs('#gov-label');
  const trigger = qs('#gov-trigger');
  const status = qs('#gov-status');
  if (status) {
    status.hidden = rates.length > 0;
    status.textContent = t('checkout.noShippingRates');
  }
  if (trigger) trigger.disabled = rates.length === 0;
  if (label && !rates.length) label.textContent = t('checkout.noShippingRates');
  const selectedRate = rates.find((r) => r.governorate === current);
  if (label && selectedRate) {
    label.textContent = document.documentElement.lang === 'ar' ? selectedRate.governorate : selectedRate.governorate_en;
  }
}

// Governorate dropdown logic
function initGovDropdown() {
  const trigger = qs('#gov-trigger');
  const panel = qs('#gov-panel');
  const search = qs('#gov-search');
  const list = qs('#gov-list');
  const label = qs('#gov-label');
  const select = qs('#governorate');
  if (!trigger || !panel || !list) return;

  function open() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (search) { search.value = ''; search.focus(); }
    filterList('');
  }
  function close({ restoreFocus = false } = {}) {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }
  function selectGov(value) {
    select.value = value;
    const rate = rates.find((r) => r.governorate === value);
    if (label && rate) label.textContent = document.documentElement.lang === 'ar' ? rate.governorate : rate.governorate_en;
    list.querySelectorAll('.gov-option').forEach((opt) => {
      opt.classList.toggle('is-selected', opt.dataset.value === value);
    });
    close({ restoreFocus: true });
    renderSummary();
  }
  function filterList(q) {
    const lower = q.toLowerCase();
    let visible = 0;
    list.querySelectorAll('.gov-option').forEach((opt) => {
      const text = opt.textContent.toLowerCase();
      const show = !q || text.includes(lower);
      opt.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    let empty = list.querySelector('.gov-empty');
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'gov-empty';
        empty.textContent = 'لا توجد نتائج';
        list.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  trigger.addEventListener('click', () => {
    if (panel.hidden) open(); else close();
  });
  if (search) {
    search.addEventListener('input', (e) => filterList(e.target.value));
    search.addEventListener('keydown', (e) => {
      const visible = [...list.querySelectorAll('.gov-option:not([style*="display: none"])')];
      if (e.key === 'ArrowDown') { e.preventDefault(); visible[0]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); visible.at(-1)?.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close({ restoreFocus: true }); }
    });
  }
  list.addEventListener('click', (e) => {
    const opt = e.target.closest('.gov-option');
    if (opt) selectGov(opt.dataset.value);
  });
  list.addEventListener('keydown', (e) => {
    const opts = [...list.querySelectorAll('.gov-option:not([style*="display: none"])')];
    const idx = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(idx + 1, opts.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(idx - 1, 0)]?.focus(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (document.activeElement?.dataset?.value) selectGov(document.activeElement.dataset.value); }
    else if (e.key === 'Escape') { e.preventDefault(); close({ restoreFocus: true }); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.gov-selector') && !panel.hidden) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close({ restoreFocus: true });
    else if (e.key === 'Tab' && !panel.hidden) close();
  });
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
  initGovDropdown();
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
        : err.message === 'shipping_unavailable' ? t('checkout.noShippingRates')
        : err.message === 'backend_unavailable' || err.message === 'place_order_function_not_deployed'
          ? t('checkout.backendUnavailable') : t('toast.error');
      toast(message, { type: 'error' });
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
