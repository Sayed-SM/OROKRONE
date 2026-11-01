import { initI18n, t, L, onLangChange, formatDate } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, qs } from '../components/ui.js';
import { trackOrder } from '../lib/db.js';
import { money } from '../lib/pricing.js';
import { esc } from '../lib/validate.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'];
let lastResult = null;

function renderResult() {
  const host = qs('#track-result');
  if (!lastResult) { host.innerHTML = ''; return; }
  if (lastResult === 'not-found') {
    host.innerHTML = `<p class="notice" style="background:var(--danger-bg);border-color:var(--danger);color:var(--danger)">
      ${icon('alert')}<span>${t('track.notFound')}</span></p>`;
    return;
  }
  const order = lastResult;
  const currentIndex = STATUSES.indexOf(order.status);
  const cancelled = order.status === 'cancelled';
  host.innerHTML = `
    <div class="track-meta">
      <div><span>${t('checkout.orderNo')}</span><strong>${esc(order.order_no)}</strong></div>
      <div><span>${t('track.placedAt')}</span><strong>${formatDate(order.created_at)}</strong></div>
      ${order.governorate ? `<div><span>${t('checkout.governorate')}</span><strong>${esc(order.governorate)}</strong></div>` : ''}
      <div><span>${t('cart.total')}</span><strong>${money(order.total)}</strong></div>
      <div><span>${t('checkout.cod')}</span><strong>${icon('checkCircle')}</strong></div>
    </div>
    ${cancelled ? `<p class="notice" style="background:var(--danger-bg);border-color:var(--danger);color:var(--danger)">
      ${icon('alert')}<span>${t('track.cancelledD')}</span></p>` : `
      <div class="timeline">
        ${STATUSES.map((status, i) => {
          const state = i < currentIndex ? 'is-done' : i === currentIndex ? 'is-current' : 'is-pending';
          return `<div class="tl-item ${state}">
            <div class="tl-dot">${icon(i < currentIndex ? 'check' : ['clock', 'package', 'truck', 'checkCircle'][i], 'icon-sm')}</div>
            <div><h4>${t(`track.${status}`)}</h4><p>${t(`track.${status}D`)}</p></div>
          </div>`;
        }).join('')}
      </div>`}
    ${order.items?.length ? `
      <ul class="order-items-mini">
        ${order.items.map((it) => `<li><span>${esc(L(it, 'name'))} × ${it.qty}</span><strong>${money(it.price * it.qty)}</strong></li>`).join('')}
      </ul>` : ''}`;
}

async function lookup(code) {
  const btn = qs('#track-form button');
  btn.classList.add('is-loading');
  try {
    lastResult = (await trackOrder(code)) || 'not-found';
  } catch {
    lastResult = 'not-found';
  } finally {
    btn.classList.remove('is-loading');
    renderResult();
  }
}

function init() {
  initI18n();
  mountChrome({ active: 'track' });
  const prefill = new URLSearchParams(location.search).get('code');
  if (prefill) { qs('#track-code').value = prefill; lookup(prefill); }
  qs('#track-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = qs('#track-code').value.trim();
    if (code) lookup(code);
  });
  onLangChange(renderResult);
}

document.addEventListener('DOMContentLoaded', init);
