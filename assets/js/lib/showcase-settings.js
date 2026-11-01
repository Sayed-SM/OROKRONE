export const SHOWCASE_STORAGE_KEY = 'orokrone.showcase.v1';

export const DEFAULT_SHOWCASE = {
  heading_ar: 'الوقتُ يستحق أن يُقتنى',
  heading_en: 'Time deserves to be owned',
  lead_ar: 'ادخل صالة أوروكرون: ساعات منتقاة على منصّات متدرجة بضوء وظلال واقعية. مرّر للاستكشاف واضغط للتفاصيل.',
  lead_en: 'Step into OROKRONE: hand-picked watches on tiered podiums, shaped by studio light. Hover to explore; select for details.',
  backgroundImage: '',
  theme: 'light',
  productIds: [],
};

export function loadShowcaseSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SHOWCASE_STORAGE_KEY));
    if (stored && typeof stored === 'object') return { ...DEFAULT_SHOWCASE, ...stored };
  } catch { /* ignore malformed local data */ }
  return { ...DEFAULT_SHOWCASE };
}

export function saveShowcaseSettings(settings) {
  const safe = {
    heading_ar: String(settings.heading_ar || '').trim().slice(0, 120),
    heading_en: String(settings.heading_en || '').trim().slice(0, 120),
    lead_ar: String(settings.lead_ar || '').trim().slice(0, 260),
    lead_en: String(settings.lead_en || '').trim().slice(0, 260),
    backgroundImage: String(settings.backgroundImage || '').trim().slice(0, 500),
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    productIds: Array.isArray(settings.productIds) ? settings.productIds.filter(Boolean).slice(0, 8) : [],
  };
  localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent('showcase:change', { detail: safe }));
  return safe;
}

export function resetShowcaseSettings() {
  localStorage.removeItem(SHOWCASE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('showcase:change', { detail: DEFAULT_SHOWCASE }));
  return { ...DEFAULT_SHOWCASE };
}
