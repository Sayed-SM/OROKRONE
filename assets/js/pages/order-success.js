import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, toast, qs } from '../components/ui.js';
import { money } from '../lib/pricing.js';
import { esc } from '../lib/validate.js';

let order = null;
function renderSuccess() {
  qs('#success-content').innerHTML = `
    <div class="success-icon">${icon('check')}</div>
    <h1 class="display">${t('checkout.success')}</h1>
    <p class="muted">${t('track.pendingD')}</p>
    ${order ? `
      <div class="code-box">
        <span class="muted small">${t('checkout.orderNo')}</span>
        <code>${esc(order.order_no)}</code>
        <hr style="border:none;border-top:1px solid var(--border)">
        <span class="muted small">${t('checkout.trackingCode')}</span>
        <code>${esc(order.tracking_code)}</code>
        ${order.total ? `<strong>${money(order.total)}</strong>` : ''}
        <button class="btn btn-outline btn-sm" id="copy-track">${icon('copy', 'icon-sm')}<span>${t('product.share')}</span></button>
      </div>
      <p class="notice">${icon('truck')}<span>${t('checkout.keepCode')}</span></p>
      <div class="cluster" style="justify-content:center">
        <a class="btn btn-gold" href="track.html?code=${encodeURIComponent(order.tracking_code)}">${t('checkout.goTrack')}</a>
        <a class="btn btn-outline" href="index.html">${t('checkout.backHome')}</a>
      </div>` : `
      <div class="cluster" style="justify-content:center">
        <a class="btn btn-gold" href="track.html">${t('checkout.goTrack')}</a>
        <a class="btn btn-outline" href="index.html">${t('checkout.backHome')}</a>
      </div>`}`;

  qs('#copy-track')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(order.tracking_code); } catch { /* ignore */ }
    toast(t('home.copied'));
  });
}

function init() {
  initI18n();
  mountChrome({ active: 'cart' });
  try { order = JSON.parse(sessionStorage.getItem('orokrone.lastOrder')); } catch { /* ignore */ }
  renderSuccess();
  onLangChange(renderSuccess);
}

document.addEventListener('DOMContentLoaded', init);
