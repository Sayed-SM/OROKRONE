/**
 * UI primitives — icons (Lucide geometry, the icon system used by 21st.dev),
 * toasts, accessible dialogs, star ratings, DOM helpers.
 */
import { esc } from '../lib/validate.js';

const P = {
  bag: '<path d="M6 7h12l1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  heart: '<path d="M12 20.5s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.6a5.2 5.2 0 0 1 9.3 4.9c-1.8 4.3-9.3 9-9.3 9Z"/>',
  compare: '<path d="M12 3v18M7 6 3 12l4 6M17 6l4 6-4 6M3 12h6m6 0h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18Z"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m14 6-6 6 6 6"/>',
  chevronRight: '<path d="m10 6 6 6-6 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  star: '<path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.9l6.1-.8L12 3.5Z"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.5 3.5 7.7 7.5 9 4-1.3 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  package: '<path d="M12 3 3.5 7v10L12 21l8.5-4V7L12 3Z"/><path d="M3.5 7 12 11l8.5-4M12 11v10"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.2 2.8 2.8L16.5 9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6m4-6v6"/>',
  edit: '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  sliders: '<path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  phone: '<path d="M6 3h4l1.5 5-2.5 1.5a12 12 0 0 0 5.5 5.5L16 12.5l5 1.5v4a2.5 2.5 0 0 1-2.7 2.5C10 19.7 4.3 14 3.5 5.7A2.5 2.5 0 0 1 6 3Z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  sparkle: '<path d="M12 3v5m0 8v5M3 12h5m8 0h5M6 6l3 3m6 6 3 3M18 6l-3 3m-6 6-3 3"/>',
  box: '<path d="M12 3 3.5 7v10L12 21l8.5-4V7L12 3Z"/><path d="M12 11v10M7.5 5l9 4"/>',
  chart: '<path d="M4 20V4m0 16h16"/><path d="M8 16v-5m4 5V8m4 8v-3"/>',
  tag: '<path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.5" cy="8" r="1.4"/>',
  message: '<path d="M21 12a8 8 0 0 1-8 8H4l2-3.5A8 8 0 1 1 21 12Z"/>',
  logout: '<path d="M14 4H6v16h8M10 12h11m-4-4 4 4-4 4"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4m0 3v.5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
  pause: '<path d="M8 4.5v15M16 4.5v15"/>',
  home: '<path d="m3.5 11 8.5-7 8.5 7M6 9.5V20h12V9.5"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h5M3 9.5h18"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || P.box}</svg>`;
}
export const iconNames = Object.keys(P);

/* --------------------------------- helpers -------------------------------- */
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
export const debounce = (fn, ms = 250) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

/* ---------------------------------- toast --------------------------------- */
export function toast(message, { type = 'success', duration = 3400 } = {}) {
  let host = qs('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle', 'icon-sm')}<span>${esc(message)}</span>`;
  host.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 350);
  }, duration);
}

/* --------------------------------- dialog --------------------------------- */
let lastFocus = null;

export function dialog({ title = '', content = '', size = 'md', onClose } = {}) {
  lastFocus = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog dialog-${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1">
      <button class="dialog-close icon-btn" data-close aria-label="close">${icon('x')}</button>
      <div class="dialog-body">${content}</div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 220);
    document.removeEventListener('keydown', onKey);
    lastFocus?.focus?.();
    onClose?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const focusables = qsa('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', overlay)
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    overlay.querySelector('.dialog-close').focus();
  });
  return { close, el: overlay };
}

export function confirmDialog(message, { confirmLabel = 'OK', cancelLabel = '×' } = {}) {
  return new Promise((resolve) => {
    const dlg = dialog({
      title: message, size: 'sm',
      content: `
        <p class="dialog-message">${esc(message)}</p>
        <div class="cluster" style="justify-content:flex-end;margin-top:1.5rem">
          <button class="btn btn-ghost" data-close>${esc(cancelLabel)}</button>
          <button class="btn btn-primary" data-confirm>${esc(confirmLabel)}</button>
        </div>`,
      onClose: () => resolve(false),
    });
    dlg.el.querySelector('[data-confirm]').addEventListener('click', () => {
      resolve(true);
      dlg.el.querySelector('[data-close]').click();
    });
  });
}

/* ---------------------------------- rating --------------------------------- */
export function stars(rating, { count = null } = {}) {
  const full = Math.round(rating);
  const art = Array.from({ length: 5 }, (_, i) =>
    `<svg class="icon icon-sm star ${i < full ? 'is-on' : ''}" viewBox="0 0 24 24" aria-hidden="true">${P.star}</svg>`).join('');
  return `<span class="stars" role="img" aria-label="${rating} / 5">${art}</span>${count != null ? `<span class="stars-count">(${count})</span>` : ''}`;
}

export function badge(text, tone = 'gold') {
  return `<span class="badge badge-${tone}">${esc(text)}</span>`;
}

export function emptyState({ iconName = 'box', title, hint = '', action = '' }) {
  return `<div class="empty-state">
    <div class="empty-icon">${icon(iconName, 'icon-lg')}</div>
    <h3>${esc(title)}</h3>
    ${hint ? `<p class="muted">${esc(hint)}</p>` : ''}
    ${action}
  </div>`;
}

export function skeletonCards(n = 8) {
  return Array.from({ length: n }, () => `
    <div class="product-card skeleton-card">
      <div class="skeleton skeleton-art"></div>
      <div class="skeleton skeleton-line" style="width:60%"></div>
      <div class="skeleton skeleton-line" style="width:40%"></div>
    </div>`).join('');
}
