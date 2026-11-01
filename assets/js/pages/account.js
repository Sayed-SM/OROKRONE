import { initI18n, t, L, onLangChange, formatDate } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, toast, qs, emptyState } from '../components/ui.js';
import { auth } from '../lib/auth.js';
import { myOrders } from '../lib/db.js';
import { money } from '../lib/pricing.js';
import { esc } from '../lib/validate.js';

let user = null;

const statusBadge = (status) => {
  const tone = { delivered: 'success', cancelled: 'danger', shipped: 'gold', confirmed: 'gold', pending: 'muted' }[status] || 'muted';
  return `<span class="badge badge-${tone}">${t(`track.${status}`)}</span>`;
};

async function render() {
  user = await auth.user();
  const host = qs('#account-content');
  if (!user) {
    host.innerHTML = emptyState({
      iconName: 'user', title: t('account.guestTitle'), hint: t('account.guestLead'),
      action: `<div class="cluster"><a class="btn btn-gold" href="auth.html">${t('actions.login')}</a>
        <a class="btn btn-outline" href="track.html">${t('nav.track')}</a></div>`,
    });
    return;
  }
  const orders = await myOrders();
  host.innerHTML = `
    <div class="order-card">
      <div class="order-card-head">
        <div><strong>${esc(user.user_metadata?.full_name || user.email)}</strong>
          <p class="muted small" dir="ltr">${esc(user.email)}</p></div>
        <button class="btn btn-outline btn-sm" id="logout-btn">${icon('logout', 'icon-sm')}<span>${t('actions.logout')}</span></button>
      </div>
    </div>
    <h2 class="section-title display">${t('account.orders')}</h2>
    ${orders.length ? orders.map((order) => `
      <article class="order-card">
        <div class="order-card-head">
          <div><strong>${esc(order.order_no)}</strong><p class="muted small">${formatDate(order.created_at)}</p></div>
          ${statusBadge(order.status)}
        </div>
        <div class="order-lines">
          ${(order.items || order.order_items || []).map((it) => `<div>• ${esc(L(it, 'name'))} × ${it.qty}</div>`).join('')}
        </div>
        <div class="order-card-head">
          <strong>${money(order.total)}</strong>
          <a class="btn btn-outline btn-sm" href="track.html?code=${encodeURIComponent(order.tracking_code)}">${icon('truck', 'icon-sm')} ${t('nav.track')}</a>
        </div>
      </article>`).join('') : `<p class="notice">${icon('package')}<span>${t('account.noOrders')}</span></p>`}`;

  qs('#logout-btn').addEventListener('click', async () => {
    await auth.signOut();
    toast(t('auth.loggedOut'));
    render();
  });
}

async function init() {
  initI18n();
  mountChrome({ active: 'account' });
  await render();
  onLangChange(render);
}

document.addEventListener('DOMContentLoaded', init);
