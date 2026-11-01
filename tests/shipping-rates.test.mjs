import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeShippingRate, activeShippingRates } from '../assets/js/lib/shipping-rates.js';

test('normalizes a valid shipping rate and numeric fee', () => {
  assert.deepEqual(normalizeShippingRate({
    governorate: '  القاهرة ', governorate_en: ' Cairo ', fee: '60', active: true,
  }), { governorate: 'القاهرة', governorate_en: 'Cairo', fee: 60, active: true });
});

test('rejects blank names and negative or non-finite shipping fees', () => {
  for (const rate of [
    { governorate: '', governorate_en: 'Cairo', fee: 60 },
    { governorate: 'Cairo', governorate_en: '', fee: 60 },
    { governorate: 'Cairo', governorate_en: 'Cairo', fee: -1 },
    { governorate: 'Cairo', governorate_en: 'Cairo', fee: 'not-a-number' },
  ]) assert.throws(() => normalizeShippingRate(rate));
});

test('active shipping choices exclude disabled rates without inventing fallbacks', () => {
  assert.deepEqual(activeShippingRates([
    { governorate: 'القاهرة', active: true },
    { governorate: 'مطروح', active: false },
  ]), [{ governorate: 'القاهرة', active: true }]);
  assert.deepEqual(activeShippingRates([]), []);
});
