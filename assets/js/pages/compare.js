import { initI18n, t, L, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { icon, stars, toast, qs, emptyState } from '../components/ui.js';
import { compare } from '../lib/compare.js';
import { getProductsByIds } from '../lib/db.js';
import { productArt } from '../lib/watch-svg.js';
import { money, stockLabel } from '../lib/pricing.js';
import { cart } from '../lib/cart.js';
import { esc } from '../lib/validate.js';

let products = [];

async function render() {
  products = await getProductsByIds(compare.ids());
  const host = qs('#compare-content');
  if (products.length < 2) {
    host.innerHTML = emptyState({
      iconName: 'compare', title: t('compare.empty'), hint: t('compare.hint'),
      action: `<a class="btn btn-gold" href="shop.html">${t('actions.shopNow')}</a>`,
    });
    return;
  }
  const row = (label, fn) => `
    <tr><td>${label}</td>${products.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;

  host.innerHTML = `
    <div class="compare-scroll">
      <table class="compare-table">
        <thead><tr><th></th>${products.map((p) => `
          <th>
            <a href="product.html?slug=${encodeURIComponent(p.slug)}">${productArt(p)}</a>
            <div>${esc(L(p, 'name'))}</div>
            <button class="btn btn-ghost btn-sm" data-remove="${esc(p.id)}">${icon('x', 'icon-sm')} ${t('actions.remove')}</button>
          </th>`).join('')}</tr></thead>
        <tbody>
          ${row(t('compare.price'), (p) => `<strong>${money(p.price)}</strong>${p.old_price ? `<br><del class="muted small">${money(p.old_price)}</del>` : ''}`)}
          ${row(t('compare.rating'), (p) => stars(p.rating_avg, { count: p.rating_count }))}
          ${row(t('shop.category'), (p) => t(`home.${p.category}`))}
          ${row(t('shop.brand'), (p) => esc(p.brand))}
          ${row(t('product.caseSize'), (p) => esc(p.specs?.case_size || '—'))}
          ${row(t('product.movement'), (p) => esc(L(p.specs || {}, 'movement')))}
          ${row(t('product.glass'), (p) => esc(L(p.specs || {}, 'glass')))}
          ${row(t('product.water'), (p) => esc(p.specs?.water || '—'))}
          ${row(t('product.strap'), (p) => esc(L(p.specs || {}, 'strap')))}
          ${row(t('admin.stock'), (p) => `<span class="stock-line ${stockLabel(p).tone}">${esc(stockLabel(p).text)}</span>`)}
          ${row('', (p) => `<button class="btn btn-gold btn-sm" data-add="${esc(p.id)}" ${p.stock <= 0 ? 'disabled' : ''}>${icon('bag', 'icon-sm')} ${t('actions.addToCart')}</button>`)}
        </tbody>
      </table>
    </div>`;
}

async function init() {
  initI18n();
  mountChrome({ active: 'compare' });
  await render();
  qs('#compare-content').addEventListener('click', async (e) => {
    const remove = e.target.closest('[data-remove]');
    const add = e.target.closest('[data-add]');
    if (remove) { compare.remove(remove.dataset.remove); await render(); }
    if (add) {
      const product = products.find((p) => p.id === add.dataset.add);
      if (product) { cart.add(product, 1); toast(t('actions.added')); }
    }
  });
  window.addEventListener('compare:change', render);
  onLangChange(render);
}

document.addEventListener('DOMContentLoaded', init);
