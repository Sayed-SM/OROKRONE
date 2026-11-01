import { t } from '../i18n/i18n.js';

/** Escape untrusted text before it ever reaches innerHTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;',
  }[c]));
}

export const isEgyptianPhone = (v) => /^01[0125][0-9]{8}$/.test(String(v).replace(/[\s-]/g, ''));
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export const cleanText = (v, max = 500) =>
  Array.from(String(v ?? '').trim())
    .filter((ch) => ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127)
    .join('')
    .slice(0, max);

export const validators = {
  required: (v) => (String(v ?? '').trim() ? '' : t('validation.required')),
  phone: (v) => (isEgyptianPhone(v) ? '' : t('validation.phone')),
  email: (v) => (!v || isEmail(v) ? '' : t('validation.email')),
  emailRequired: (v) => (isEmail(v) ? '' : t('validation.email')),
  password: (v) => (String(v).length >= 6 ? '' : t('validation.password')),
  name: (v) => (String(v).trim().length >= 3 ? '' : t('validation.short')),
};

export function fieldError(input, message) {
  const field = input.closest('.field') || input.parentElement;
  let hint = field.querySelector('.field-error');
  if (!hint) {
    hint = document.createElement('p');
    hint.className = 'field-error';
    hint.setAttribute('role', 'alert');
    field.appendChild(hint);
  }
  hint.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  field.classList.toggle('has-error', Boolean(message));
}

/** Validate a form against {name: [validators]}; paints inline errors. */
export function validateForm(form, rules) {
  let firstInvalid = null;
  const values = {};
  Object.entries(rules).forEach(([name, checks]) => {
    const input = form.elements[name];
    if (!input) return;
    const value = input.value;
    values[name] = typeof value === 'string' ? value.trim() : value;
    const message = checks.map((check) => check(value)).find(Boolean) || '';
    fieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return { valid: !firstInvalid, values };
}

export function clampQty(qty, product, maxPerItem) {
  const max = Math.min(product.stock || 0, maxPerItem);
  return Math.max(0, Math.min(Math.floor(qty) || 1, max));
}
