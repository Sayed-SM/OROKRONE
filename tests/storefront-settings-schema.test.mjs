import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STOREFRONT_SETTINGS,
  migrateLegacyShowcaseSettings,
  normalizeStorefrontSettings,
} from '../assets/js/lib/storefront-settings-schema.js';

test('settings normalization retains bilingual copy and intentional empty showroom selection', () => {
  const settings = normalizeStorefrontSettings({
    announcement: { text_ar: '  عروض اليوم  ', text_en: 'Today only' },
    showcase: { productIds: [] },
  });

  assert.equal(settings.announcement.text_ar, 'عروض اليوم');
  assert.equal(settings.announcement.text_en, 'Today only');
  assert.deepEqual(settings.showcase.productIds, []);
  assert.equal(settings.craft.heading_ar, DEFAULT_STOREFRONT_SETTINGS.craft.heading_ar);
});

test('malformed settings merge safely with defaults and unsafe image URLs are discarded', () => {
  const settings = normalizeStorefrontSettings({
    announcement: 'invalid',
    trust: [{ title_ar: '<b>text</b>', icon: '<script>' }],
    showcase: { backgroundImage: 'javascript:alert(1)', productIds: 'all' },
  });

  assert.equal(settings.announcement.text_ar, DEFAULT_STOREFRONT_SETTINGS.announcement.text_ar);
  assert.equal(settings.trust[0].title_ar, '<b>text</b>');
  assert.equal(settings.trust[0].icon, DEFAULT_STOREFRONT_SETTINGS.trust[0].icon);
  assert.equal(settings.showcase.backgroundImage, '');
  assert.equal(settings.showcase.productIds, null);
});

test('valid secure storage URLs and local watch images are retained', () => {
  const hosted = 'https://libbbemuwtmgdtfztwaa.supabase.co/storage/v1/object/public/product-images/showcase/hero.webp';
  const settings = normalizeStorefrontSettings({ showcase: { backgroundImage: hosted } });
  const local = normalizeStorefrontSettings({ craft: { image_url: 'assets/img/watches/craft.jpg' } });

  assert.equal(settings.showcase.backgroundImage, hosted);
  assert.equal(local.craft.image_url, 'assets/img/watches/craft.jpg');
});

test('legacy local showcase values map into the new local settings shape without changing empty selection', () => {
  const migrated = migrateLegacyShowcaseSettings({
    heading_ar: 'الوقت', heading_en: 'Time',
    lead_ar: 'وصف قديم', lead_en: 'Legacy copy',
    backgroundImage: 'assets/img/watches/hero.jpg', theme: 'dark', productIds: [],
  });

  assert.equal(migrated.showcase.heading_ar, 'الوقت');
  assert.equal(migrated.showcase.backgroundImage, 'assets/img/watches/hero.jpg');
  assert.deepEqual(migrated.showcase.productIds, []);
  assert.equal(migrated.trust.length, DEFAULT_STOREFRONT_SETTINGS.trust.length);
});
