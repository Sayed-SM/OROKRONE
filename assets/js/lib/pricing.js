/** Money + totals. All order math is re-validated server-side in place_order. */
import { CONFIG } from './config.js';
import { getLocale, t } from '../i18n/i18n.js';

export function money(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency', currency: CONFIG.CURRENCY, maximumFractionDigits: 0,
  }).format(n);
}

export function plainNumber(value) {
  return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function calcCoupon(coupon, subtotal) {
  if (!coupon) return 0;
  if (subtotal < (coupon.min_subtotal || 0)) return 0;
  let discount = coupon.type === 'percent'
    ? subtotal * (coupon.value / 100)
    : coupon.value;
  if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  return Math.max(0, Math.min(Math.round(discount), subtotal));
}

export function shippingFee(governorate, rates = [], afterDiscount = 0) {
  if (afterDiscount >= CONFIG.FREE_SHIPPING_OVER) return 0;
  const rate = rates.find((r) => r.governorate === governorate);
  return rate ? rate.fee : CONFIG.DEFAULT_SHIPPING;
}

export function computeTotals({ items = [], coupon = null, governorate = null, rates = [] }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const discount = calcCoupon(coupon, subtotal);
  const shipping = items.length === 0 ? 0 : shippingFee(governorate, rates, subtotal - discount);
  return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
}

export function discountPercent(product) {
  if (!product.old_price || product.old_price <= product.price) return 0;
  return Math.round((1 - product.price / product.old_price) * 100);
}

export function stockLabel(product) {
  if (product.stock <= 0) return { text: t('product.outOfStock'), tone: 'danger' };
  if (product.stock <= 3) return { text: t('product.lowStock', { n: plainNumber(product.stock) }), tone: 'warn' };
  return { text: t('product.inStock', { n: plainNumber(product.stock) }), tone: 'ok' };
}
