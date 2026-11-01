const WATCH_IMAGE = /^assets\/img\/watches\/[\w.-]+\.(?:jpe?g|png|webp|avif|gif)$/i;
const SAFE_ID = /^[a-z0-9_-]{1,48}$/i;
const SAFE_ICONS = new Set(['wallet', 'truck', 'shield', 'award', 'clock', 'checkCircle', 'pin', 'star']);

export const DEFAULT_STOREFRONT_SETTINGS = Object.freeze({
  announcement: {
    enabled: true,
    text_ar: 'خصم 10% على أول طلب لك مع كود WELCOME10 — وشحن مجاني للطلبات فوق 25,000 ج.م.',
    text_en: '10% off your first order with code WELCOME10 — and free shipping on orders over EGP 25,000.',
  },
  trust: [
    { id: 'cod', icon: 'wallet', enabled: true, title_ar: 'الدفع عند الاستلام', description_ar: 'افحص طلبك أولاً، ثم ادفع.', title_en: 'Cash on delivery', description_en: 'Inspect your order first, then pay.' },
    { id: 'shipping', icon: 'truck', enabled: true, title_ar: 'شحن لكل المحافظات', description_ar: 'توصيل محلي سريع ومؤمّن.', title_en: 'Nationwide delivery', description_en: 'Fast, insured local shipping.' },
    { id: 'warranty', icon: 'shield', enabled: true, title_ar: 'ضمان سنتين', description_ar: 'على الحركة والصناعة.', title_en: 'Two-year warranty', description_en: 'Movement and craftsmanship.' },
    { id: 'authentic', icon: 'award', enabled: true, title_ar: 'أصلي 100%', description_ar: 'فحص 27 نقطة لكل قطعة.', title_en: '100% authentic', description_en: '27-point check on every piece.' },
  ],
  craft: {
    heading_ar: 'صناعة تُرى قبل أن تُقرأ',
    heading_en: 'Craft you can see before you read',
    lead_ar: 'كل ساعة تمر بفحص من 27 نقطة قبل أن تصلك: دقة الحركة، مقاومة الماء، وسلامة التشطيب.',
    lead_en: 'Every watch passes a 27-point inspection before it reaches you: movement accuracy, water resistance and finishing.',
    image_url: '',
    features: [
      { id: 'movement', icon: 'clock', title_ar: 'حركة مضبوطة', description_ar: 'معايرة دقة الحركة على 5 أوضاع مختلفة.', title_en: 'Regulated movement', description_en: 'Accuracy checked in five positions.' },
      { id: 'materials', icon: 'shield', title_ar: 'خامات أصلية', description_ar: 'فولاذ 316L، زفير مقاوم للخدش، وجلد طبيعي مدبوغ.', title_en: 'Honest materials', description_en: '316L steel, scratch-resistant sapphire and genuine leather.' },
      { id: 'warranty', icon: 'award', title_ar: 'ضمان سنتان', description_ar: 'ضمان دولي وخدمة صيانة معتمدة داخل مصر.', title_en: 'Two-year warranty', description_en: 'International warranty and certified service in Egypt.' },
    ],
    stats: [
      { id: 'years', value: '12', suffix: '', label_ar: 'عاماً من الخبرة', label_en: 'Years of expertise' },
      { id: 'pieces', value: '4800', suffix: '+', label_ar: 'قطعة أصلية', label_en: 'Authentic pieces' },
      { id: 'clients', value: '3200', suffix: '+', label_ar: 'عميل سعيد', label_en: 'Happy clients' },
      { id: 'cities', value: '27', suffix: '', label_ar: 'محافظة نغطيها', label_en: 'Governorates served' },
    ],
  },
  showcase: {
    heading_ar: 'الوقتُ يستحق أن يُقتنى',
    heading_en: 'Time deserves to be owned',
    lead_ar: 'ادخل صالة أوروكرون: ساعات منتقاة على منصّات متدرجة بضوء وظلال واقعية. مرّر للاستكشاف واضغط للتفاصيل.',
    lead_en: 'Step into OROKRONE: hand-picked watches on tiered podiums, shaped by studio light. Hover to explore; select for details.',
    backgroundImage: '',
    theme: 'light',
    productIds: null,
  },
});

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value, fallback, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function imageReference(value) {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (!raw) return '';
  if (/[\u0000-\u001f\\"'()<>]/.test(raw)) return '';
  if (WATCH_IMAGE.test(raw) && !raw.split('/').includes('..')) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href.slice(0, 500);
  } catch { /* only absolute HTTPS URLs and known local watch assets are accepted */ }
  return '';
}

function normalizeItems(value, defaults, max, kind) {
  const source = Array.isArray(value) ? value.slice(0, max) : defaults;
  return source.map((item, index) => {
    const raw = record(item);
    const fallback = defaults[index] || {};
    const id = SAFE_ID.test(String(raw.id || '')) ? String(raw.id) : fallback.id;
    const normalized = {
      id,
      enabled: typeof raw.enabled === 'boolean' ? raw.enabled : (fallback.enabled ?? true),
    };
    if (kind === 'trust' || kind === 'feature') {
      normalized.icon = SAFE_ICONS.has(raw.icon) ? raw.icon : (fallback.icon || 'shield');
      for (const field of ['title_ar', 'description_ar', 'title_en', 'description_en']) {
        normalized[field] = text(raw[field], fallback[field] || '', field.startsWith('description') ? 240 : 120);
      }
    } else {
      normalized.value = /^[0-9]{1,8}$/.test(String(raw.value ?? '')) ? String(raw.value) : String(fallback.value || '0');
      normalized.suffix = text(raw.suffix, fallback.suffix || '', 4);
      normalized.label_ar = text(raw.label_ar, fallback.label_ar || '', 80);
      normalized.label_en = text(raw.label_en, fallback.label_en || '', 80);
    }
    return normalized;
  });
}

export function normalizeStorefrontSettings(value) {
  const raw = record(value);
  const announcement = record(raw.announcement);
  const craft = record(raw.craft);
  const showcase = record(raw.showcase);
  const ids = Array.isArray(showcase.productIds)
    ? [...new Set(showcase.productIds.filter((id) => typeof id === 'string' && SAFE_ID.test(id)))].slice(0, 8)
    : null;

  return {
    announcement: {
      enabled: typeof announcement.enabled === 'boolean' ? announcement.enabled : DEFAULT_STOREFRONT_SETTINGS.announcement.enabled,
      text_ar: text(announcement.text_ar, DEFAULT_STOREFRONT_SETTINGS.announcement.text_ar, 240),
      text_en: text(announcement.text_en, DEFAULT_STOREFRONT_SETTINGS.announcement.text_en, 240),
    },
    trust: normalizeItems(raw.trust, DEFAULT_STOREFRONT_SETTINGS.trust, 8, 'trust'),
    craft: {
      heading_ar: text(craft.heading_ar, DEFAULT_STOREFRONT_SETTINGS.craft.heading_ar, 120),
      heading_en: text(craft.heading_en, DEFAULT_STOREFRONT_SETTINGS.craft.heading_en, 120),
      lead_ar: text(craft.lead_ar, DEFAULT_STOREFRONT_SETTINGS.craft.lead_ar, 500),
      lead_en: text(craft.lead_en, DEFAULT_STOREFRONT_SETTINGS.craft.lead_en, 500),
      image_url: imageReference(craft.image_url),
      features: normalizeItems(craft.features, DEFAULT_STOREFRONT_SETTINGS.craft.features, 6, 'feature'),
      stats: normalizeItems(craft.stats, DEFAULT_STOREFRONT_SETTINGS.craft.stats, 6, 'stat'),
    },
    showcase: {
      heading_ar: text(showcase.heading_ar, DEFAULT_STOREFRONT_SETTINGS.showcase.heading_ar, 120),
      heading_en: text(showcase.heading_en, DEFAULT_STOREFRONT_SETTINGS.showcase.heading_en, 120),
      lead_ar: text(showcase.lead_ar, DEFAULT_STOREFRONT_SETTINGS.showcase.lead_ar, 500),
      lead_en: text(showcase.lead_en, DEFAULT_STOREFRONT_SETTINGS.showcase.lead_en, 500),
      backgroundImage: imageReference(showcase.backgroundImage),
      theme: showcase.theme === 'dark' ? 'dark' : 'light',
      productIds: ids,
    },
  };
}

export function migrateLegacyShowcaseSettings(value) {
  const legacy = record(value);
  const hasShowcaseValues = ['heading_ar', 'heading_en', 'lead_ar', 'lead_en', 'backgroundImage', 'theme', 'productIds']
    .some((key) => Object.hasOwn(legacy, key));
  if (!hasShowcaseValues) return null;

  let backgroundImage = typeof legacy.backgroundImage === 'string' ? legacy.backgroundImage.trim() : '';
  if (/^[\w.-]+\.jpe?g$/i.test(backgroundImage) && !backgroundImage.includes('..')) {
    backgroundImage = `assets/img/watches/${backgroundImage}`;
  } else if (backgroundImage.startsWith('./assets/')) {
    backgroundImage = backgroundImage.slice(2);
  }

  return normalizeStorefrontSettings({
    showcase: {
      heading_ar: legacy.heading_ar,
      heading_en: legacy.heading_en,
      lead_ar: legacy.lead_ar,
      lead_en: legacy.lead_en,
      backgroundImage,
      theme: legacy.theme,
      productIds: legacy.productIds,
    },
  });
}
