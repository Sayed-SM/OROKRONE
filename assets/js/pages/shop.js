import { initI18n, t, onLangChange, L } from '../i18n/i18n.js';
import { mountChrome } from '../components/header.js';
import { productCard, bindProductCards } from '../components/product-card.js';
import { icon, qs, debounce, emptyState, skeletonCards } from '../components/ui.js';
import { observeReveals } from '../lib/spring.js';
import { listProducts } from '../lib/db.js';
import { plainNumber } from '../lib/pricing.js';

const params = new URLSearchParams(location.search);
const SORT_OPTIONS = [
  ['featured', 'shop.sortFeatured'], ['new', 'shop.sortNew'],
  ['price_asc', 'shop.sortPriceAsc'], ['price_desc', 'shop.sortPriceDesc'], ['rating', 'shop.sortRating'],
];
const validSorts = new Set(SORT_OPTIONS.map(([value]) => value));
const state = {
  q: params.get('q') || '',
  category: params.get('category') || '',
  brand: '',
  strap: '',
  minPrice: null,
  maxPrice: null,
  inStock: false,
  onSale: false,
  sort: validSorts.has(params.get('sort')) ? params.get('sort') : 'featured',
};
let products = [];

const STRAPS = [
  ['leather', { ar: 'جلد', en: 'Leather' }],
  ['bracelet', { ar: 'فولاذ', en: 'Steel' }],
  ['twotone', { ar: 'ثنائي اللون', en: 'Two-tone' }],
  ['mesh', { ar: 'شبكي', en: 'Mesh' }],
  ['nato', { ar: 'ناتو', en: 'NATO' }],
];

function filtered() {
  return products.filter((p) => {
    if (state.category && p.category !== state.category) return false;
    if (state.brand && p.brand !== state.brand) return false;
    if (state.strap && !(p.design?.strap || '').includes(state.strap)) return false;
    if (state.inStock && p.stock <= 0) return false;
    if (state.onSale && !(p.old_price > p.price)) return false;
    if (state.minPrice != null && p.price < state.minPrice) return false;
    if (state.maxPrice != null && p.price > state.maxPrice) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      if (![p.name_ar, p.name_en, p.brand, p.sku].some((v) => String(v || '').toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (state.sort) {
      case 'new': return new Date(b.created_at) - new Date(a.created_at);
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'rating': return b.rating_avg - a.rating_avg;
      default: return (b.featured - a.featured) || b.rating_avg - a.rating_avg;
    }
  });
}

function renderFilters() {
  const categories = [['', 'shop.all'], ['classic', 'home.classic'], ['sport', 'home.sport'], ['ladies', 'home.ladies'], ['accessories', 'home.accessories']];
  qs('#filter-category').innerHTML = categories.map(([value, key]) =>
    `<button class="chip ${state.category === value ? 'is-active' : ''}" data-filter="category" data-value="${value}">${t(key)}</button>`).join('');
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  qs('#filter-brand').innerHTML = ['', ...brands].map((brand) =>
    `<button class="chip ${state.brand === brand ? 'is-active' : ''}" data-filter="brand" data-value="${brand}">${brand || t('shop.all')}</button>`).join('');
  qs('#filter-strap').innerHTML = [['', null], ...STRAPS].map(([value, label]) => {
    const text = label ? (document.documentElement.lang === 'ar' ? label.ar : label.en) : t('shop.all');
    return `<button class="chip ${state.strap === value ? 'is-active' : ''}" data-filter="strap" data-value="${value}">${text}</button>`;
  }).join('');
}

function renderGrid() {
  const items = filtered();
  qs('#results-count').textContent = t('shop.results', { n: plainNumber(items.length) });
  qs('#shop-grid').innerHTML = items.map((p) => productCard(p)).join('');
  qs('#shop-empty').innerHTML = items.length ? '' : emptyState({
    iconName: 'search', title: t('shop.empty'), hint: t('shop.emptyHint'),
    action: `<button class="btn btn-outline" id="empty-reset">${t('shop.reset')}</button>`,
  });
  qs('#empty-reset')?.addEventListener('click', resetFilters);
  const url = new URL(location.href);
  url.search = '';
  if (state.category) url.searchParams.set('category', state.category);
  if (state.q) url.searchParams.set('q', state.q);
  if (state.sort !== 'featured') url.searchParams.set('sort', state.sort);
  history.replaceState(null, '', url);
}

function renderSortOptions() {
  const value = qs('#shop-sort');
  const label = qs('#shop-sort-value');
  const trigger = qs('#shop-sort-trigger');
  const options = qs('#shop-sort-options');
  if (!value || !label || !trigger || !options) return;
  value.value = state.sort;
  const current = SORT_OPTIONS.find(([sort]) => sort === state.sort) || SORT_OPTIONS[0];
  const wasOpen = !options.hidden;
  label.textContent = t(current[1]);
  trigger.setAttribute('aria-label', `${t('shop.sort')}: ${t(current[1])}`);
  options.setAttribute('aria-label', t('shop.sort'));
  options.innerHTML = SORT_OPTIONS.map(([sort, key]) => `
    <button class="sort-option" type="button" role="menuitemradio" aria-checked="${sort === state.sort}" tabindex="-1" data-sort="${sort}">${t(key)}</button>`).join('');
  if (wasOpen) options.querySelector(`[data-sort="${state.sort}"]`)?.focus();
}

function closeSortMenu({ restoreFocus = false } = {}) {
  const menu = qs('#shop-sort-options');
  const trigger = qs('#shop-sort-trigger');
  if (!menu || !trigger || menu.hidden) return;
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) trigger.focus();
}

function chooseSort(value) {
  if (!validSorts.has(value)) return;
  state.sort = value;
  renderSortOptions();
  closeSortMenu({ restoreFocus: true });
  renderGrid();
}

function bindSortMenu() {
  const control = qs('#shop-sort-control');
  const trigger = qs('#shop-sort-trigger');
  const menu = qs('#shop-sort-options');
  if (!control || !trigger || !menu) return;

  const open = () => {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    menu.querySelector(`[data-sort="${state.sort}"]`)?.focus();
  };
  trigger.addEventListener('click', () => menu.hidden ? open() : closeSortMenu());
  trigger.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); open(); }
    else if (event.key === 'Escape') closeSortMenu();
  });
  menu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-sort]');
    if (option) chooseSort(option.dataset.sort);
  });
  menu.addEventListener('keydown', (event) => {
    const options = [...menu.querySelectorAll('[role="menuitemradio"]')];
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); options[Math.min(index + 1, options.length - 1)]?.focus(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); options[Math.max(index - 1, 0)]?.focus(); }
    else if (event.key === 'Home') { event.preventDefault(); options[0]?.focus(); }
    else if (event.key === 'End') { event.preventDefault(); options.at(-1)?.focus(); }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = document.activeElement.closest('[data-sort]');
      if (option) chooseSort(option.dataset.sort);
    } else if (event.key === 'Escape') { event.preventDefault(); closeSortMenu({ restoreFocus: true }); }
    else if (event.key === 'Tab') closeSortMenu();
  });
  document.addEventListener('click', (event) => {
    if (!control.contains(event.target)) closeSortMenu();
  });
}

function resetFilters() {
  Object.assign(state, { q: '', category: '', brand: '', strap: '', minPrice: null, maxPrice: null, inStock: false, onSale: false });
  qs('#shop-search').value = '';
  qs('#price-min').value = '';
  qs('#price-max').value = '';
  qs('#filter-instock').checked = false;
  qs('#filter-onsale').checked = false;
  renderFilters();
  renderGrid();
}

async function init() {
  initI18n();
  mountChrome({ active: 'shop' });
  qs('#shop-grid').innerHTML = skeletonCards(8);
  qs('#filters-toggle').innerHTML = `${icon('filter', 'icon-sm')}<span>${t('shop.filters')}</span>`;
  qs('.input-with-icon').insertAdjacentHTML('afterbegin', icon('search'));
  qs('#shop-search').value = state.q;
  renderSortOptions();

  products = await listProducts();
  renderFilters();
  renderGrid();
  bindProductCards(document, (id) => products.find((p) => p.id === id));
  onLangChange(() => { renderFilters(); renderSortOptions(); renderGrid(); });

  qs('#shop-search').addEventListener('input', debounce((e) => { state.q = e.target.value.trim(); renderGrid(); }, 220));
  bindSortMenu();
  qs('#filters-panel').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    state[chip.dataset.filter] = chip.dataset.value;
    renderFilters();
    renderGrid();
  });
  qs('#price-min').addEventListener('input', debounce((e) => { state.minPrice = e.target.value ? Number(e.target.value) : null; renderGrid(); }, 350));
  qs('#price-max').addEventListener('input', debounce((e) => { state.maxPrice = e.target.value ? Number(e.target.value) : null; renderGrid(); }, 350));
  qs('#filter-instock').addEventListener('change', (e) => { state.inStock = e.target.checked; renderGrid(); });
  qs('#filter-onsale').addEventListener('change', (e) => { state.onSale = e.target.checked; renderGrid(); });
  qs('#reset-filters').addEventListener('click', resetFilters);
  qs('#filters-toggle').addEventListener('click', () => qs('#filters-panel').classList.toggle('is-open'));
  observeReveals();
}

document.addEventListener('DOMContentLoaded', init);
