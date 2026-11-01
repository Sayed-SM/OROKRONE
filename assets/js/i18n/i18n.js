import { CONFIG, STORAGE_KEYS } from '../lib/config.js';
import { ar } from './ar.js';
import { en } from './en.js';

const DICTS = { ar, en };
let lang = localStorage.getItem(STORAGE_KEYS.lang) || 'ar';
const listeners = new Set();

export function getLang() { return lang; }
export function isRTL() { return lang === 'ar'; }
export function getLocale() { return lang === 'ar' ? CONFIG.LOCALE_AR : CONFIG.LOCALE_EN; }

/** t('nav.shop') — dot-path lookup with {var} interpolation */
export function t(path, vars = {}) {
  const dict = DICTS[lang] || ar;
  let value = path.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);
  if (value == null) value = path.split('.').reduce((o, k) => (o == null ? o : o[k]), en);
  if (value == null) return path;
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

/** Pick localized field: p.name_ar / p.name_en */
export function L(obj, field) {
  if (!obj) return '';
  return obj[`${field}_${lang}`] ?? obj[`${field}_ar`] ?? obj[field] ?? '';
}

export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setLang(next) {
  if (!DICTS[next]) return;
  lang = next;
  localStorage.setItem(STORAGE_KEYS.lang, next);
  applyDocumentLang();
  applyI18n();
  listeners.forEach((fn) => fn(next));
}

export function toggleLang() { setLang(lang === 'ar' ? 'en' : 'ar'); }

export function applyDocumentLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
}

/** Translate static markup: data-i18n="nav.shop" / data-i18n-attr="placeholder:search.ph" */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((node) => {
    const value = t(node.dataset.i18n);
    if (typeof value === 'string') node.textContent = value;
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    node.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) node.setAttribute(attr, t(key));
    });
  });
}

export function initI18n() { applyDocumentLang(); applyI18n(); }

export function formatNumber(n, opts = {}) {
  return new Intl.NumberFormat(getLocale(), opts).format(n);
}
export function formatDate(value, opts = { dateStyle: 'medium' }) {
  try { return new Intl.DateTimeFormat(getLocale(), opts).format(new Date(value)); }
  catch { return String(value); }
}
