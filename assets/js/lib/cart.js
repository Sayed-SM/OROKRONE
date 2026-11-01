import { STORAGE_KEYS, CONFIG } from './config.js';

const read = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || []; }
  catch { return []; }
};
const write = (items) => {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
};

export const cart = {
  items: read,
  count: () => read().reduce((n, it) => n + it.qty, 0),
  has: (id) => read().some((it) => it.id === id),
  get: (id) => read().find((it) => it.id === id),

  add(product, qty = 1) {
    const items = read();
    const found = items.find((it) => it.id === product.id);
    const max = Math.min(product.stock, CONFIG.MAX_QTY_PER_ITEM);
    if (max <= 0) return { ok: false, reason: 'stock' };
    if (found) {
      found.qty = Math.min(found.qty + qty, max);
      found.price = product.price; found.stock = product.stock;
    } else {
      items.push({
        id: product.id, slug: product.slug, qty: Math.min(qty, max),
        name_ar: product.name_ar, name_en: product.name_en,
        price: product.price, old_price: product.old_price ?? null,
        design: product.design, category: product.category, stock: product.stock,
      });
    }
    write(items);
    return { ok: true };
  },

  setQty(id, qty) {
    const items = read();
    const item = items.find((it) => it.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(qty, Math.min(item.stock, CONFIG.MAX_QTY_PER_ITEM)));
    write(items);
  },

  remove(id) { write(read().filter((it) => it.id !== id)); },
  clear() { write([]); },

  /** Refresh price/stock snapshots from the live catalogue (never trusted for billing). */
  sync(products) {
    const items = read().map((it) => {
      const live = products.find((p) => p.id === it.id);
      return live ? { ...it, price: live.price, stock: live.stock, old_price: live.old_price } : it;
    }).filter((it) => it.stock > 0);
    write(items);
  },
};

export const couponStore = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.coupon)); }
    catch { return null; }
  },
  set: (coupon) => {
    if (coupon) localStorage.setItem(STORAGE_KEYS.coupon, JSON.stringify(coupon));
    else localStorage.removeItem(STORAGE_KEYS.coupon);
    window.dispatchEvent(new CustomEvent('coupon:change'));
  },
};
