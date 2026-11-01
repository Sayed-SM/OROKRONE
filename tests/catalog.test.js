import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PRODUCTS, SEED_REVIEWS, SEED_COUPONS, SHIPPING_RATES } from '../assets/js/lib/seed.js';

test('catalog IDs, slugs and SKUs are unique', () => {
  for (const field of ['id', 'slug', 'sku']) {
    const values = SEED_PRODUCTS.map((product) => product[field]);
    assert.equal(new Set(values).size, values.length, `${field} values are unique`);
  }
});

test('all products have valid prices and non-negative inventory', () => {
  assert.ok(SEED_PRODUCTS.length >= 10);
  for (const product of SEED_PRODUCTS) {
    assert.ok(product.price > 0, product.id);
    assert.ok(product.stock >= 0, product.id);
    if (product.old_price != null) assert.ok(product.old_price > product.price, product.id);
    assert.ok(['classic', 'sport', 'ladies', 'accessories'].includes(product.category), product.id);
  }
});

test('every sample review and coupon references valid data', () => {
  const ids = new Set(SEED_PRODUCTS.map((product) => product.id));
  assert.ok(SEED_REVIEWS.length >= 5);
  for (const review of SEED_REVIEWS) {
    assert.ok(ids.has(review.product_id), review.id);
    assert.ok(review.rating >= 1 && review.rating <= 5, review.id);
  }
  assert.ok(SEED_COUPONS.some((coupon) => coupon.code === 'WELCOME10'));
});

test('shipping rates cover Egypt only and have non-negative fees', () => {
  assert.equal(SHIPPING_RATES.length, 27);
  for (const rate of SHIPPING_RATES) assert.ok(rate.fee >= 0 && rate.governorate && rate.governorate_en);
});
