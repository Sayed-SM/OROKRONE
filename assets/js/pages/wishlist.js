import { initI18n, t, onLangChange } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { productCard, bindProductCards } from '../components/product-card.js';
import { qs, emptyState } from '../components/ui.js';
import { wishlist } from '../lib/wishlist.js';
import { getProductsByIds } from '../lib/db.js';

let products = [];

async function render() {
  products = await getProductsByIds(wishlist.ids());
  const host = qs('#wishlist-content');
  if (!products.length) {
    host.innerHTML = emptyState({
      iconName: 'heart', title: t('wishlist.empty'), hint: t('wishlist.hint'),
      action: `<a class="btn btn-gold" href="shop.html">${t('actions.shopNow')}</a>`,
    });
    return;
  }
  host.innerHTML = `<div class="product-grid">${products.map((p) => productCard(p)).join('')}</div>`;
}

async function init() {
  initI18n();
  mountChrome({ active: 'wishlist' });
  await render();
  bindProductCards(document, (id) => products.find((p) => p.id === id));
  window.addEventListener('wishlist:change', render);
  onLangChange(render);
}

document.addEventListener('DOMContentLoaded', init);
