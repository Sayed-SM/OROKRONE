import { initI18n, t, L, formatDate, onLangChange } from '../../i18n/i18n.js';
import { auth } from '../../lib/auth.js';
import { admin, listProducts, getMode } from '../../lib/db.js';
import { mountAdmin } from '../../../../admin/layout.js';
import { icon, toast, dialog, confirmDialog } from '../../components/ui.js';
import { areaChart, barChart, donutChart } from '../../components/charts.js';
import { loadShowcaseSettings, saveShowcaseSettings, resetShowcaseSettings } from '../../lib/showcase-settings.js';
import { productArt } from '../../lib/watch-svg.js';
import { money, plainNumber } from '../../lib/pricing.js';
import { esc } from '../../lib/validate.js';

const page = document.body.dataset.adminPage || 'dashboard';
let host = null;
const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const categories = ['classic', 'sport', 'ladies', 'accessories'];
const imageOptions = ['', 'w1.jpg', 'w2.jpg', 'w3.jpg', 'w4.jpg', 'w5.jpg', 'w6.jpg', 'w7.jpg', 'w8.jpg', 'w9.jpg', 'w10.jpg'];

async function guard() {
  if (!(await auth.isAdmin())) { location.replace('login.html'); return false; }
  return true;
}

function moneyCell(value) { return `<strong dir="ltr">${money(value || 0)}</strong>`; }
function statusBadge(status) {
  const tone = { delivered: 'success', shipped: 'gold', confirmed: 'gold', cancelled: 'danger', pending: 'muted' }[status] || 'muted';
  return `<span class="badge badge-${tone}">${t(`track.${status}`)}</span>`;
}
function pageToolbar(title, action = '') {
  return `<div class="admin-toolbar"><h2>${title}</h2>${action}</div>`;
}
function table(headers, rows) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="center muted">${t('admin.noData')}</td></tr>`}</tbody></table></div>`;
}

async function renderDashboard() {
  const stats = await admin.stats();
  host.innerHTML = `
    <div class="admin-toolbar"><div><p class="muted small">${t('admin.last30')}</p><h2>${t('admin.dashboard')}</h2></div>
      <span class="badge badge-muted">${getMode() === 'remote' ? 'SUPABASE LIVE' : 'LOCAL DEMO'}</span></div>
    <section class="admin-kpis">
      ${[
        ['wallet', 'admin.revenue', money(stats.revenue)],
        ['bag', 'admin.ordersCount', plainNumber(stats.orders)],
        ['chart', 'admin.avgOrder', money(stats.avg)],
        ['package', 'admin.unitsSold', plainNumber(stats.units)],
      ].map(([ic, label, value]) => `<article class="admin-kpi"><div class="admin-kpi-head"><span>${t(label)}</span><span class="admin-kpi-icon">${icon(ic)}</span></div><strong>${value}</strong><small>${t('admin.last30')}</small></article>`).join('')}
    </section>
    <section class="admin-chart-grid">
      <article class="admin-card"><h2>${t('admin.salesChart')}</h2><div id="admin-sales-chart"></div></article>
      <article class="admin-card"><h2>${t('admin.statusDist')}</h2><div id="admin-status-chart"></div></article>
    </section>
    <section class="admin-chart-grid secondary">
      <article class="admin-card"><h2>${t('admin.topProducts')}</h2><div id="admin-top-chart"></div></article>
      <article class="admin-card"><h2>${t('admin.lowStock')}</h2><div class="admin-low-stock">${stats.lowStock.length ? stats.lowStock.map((p) => `<a href="inventory.html"><span>${esc(L(p, 'name'))}</span><strong>${plainNumber(p.stock)} ${t('admin.stock')}</strong></a>`).join('') : `<p class="muted">${t('admin.noData')}</p>`}</div></article>
    </section>
    <article class="admin-card"><h2>${t('admin.recentOrders')}</h2>${table(
      [t('admin.date'), t('admin.customer'), t('admin.governorate'), t('admin.total'), t('admin.status')],
      stats.recent.map((o) => `<tr><td>${formatDate(o.created_at)}</td><td>${esc(o.name || o.customer_name || '—')}</td><td>${esc(o.governorate || '—')}</td><td>${moneyCell(o.total)}</td><td>${statusBadge(o.status)}</td></tr>`).join(''),
    )}</article>`;
  areaChart(host.querySelector('#admin-sales-chart'), stats.days);
  donutChart(host.querySelector('#admin-status-chart'), stats.byStatus);
  barChart(host.querySelector('#admin-top-chart'), stats.top);
}

async function renderProducts() {
  const products = await listProducts({ includeInactive: true });
  host.innerHTML = `${pageToolbar(t('admin.products'), `<button class="btn btn-gold btn-sm" data-new-product>${icon('plus', 'icon-sm')} ${t('admin.newProduct')}</button>`)}
    <article class="admin-card"><div class="admin-toolbar"><input class="admin-search" data-product-search placeholder="${t('shop.search')}" aria-label="search"><span class="muted small">${plainNumber(products.length)} ${t('shop.results', { n: '' })}</span></div>
      <div id="products-table">${renderProductsTable(products)}</div></article>`;
  host.querySelector('[data-product-search]').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    host.querySelector('#products-table').innerHTML = renderProductsTable(products.filter((p) => [p.name_ar, p.name_en, p.sku].some((x) => String(x || '').toLowerCase().includes(q))));
  });
  host.querySelector('[data-new-product]').addEventListener('click', () => productDialog());
  host.querySelector('#products-table').addEventListener('click', (e) => productTableAction(e, products));
}

function renderProductsTable(products) {
  return table([t('admin.products'), t('admin.category'), t('admin.price'), t('admin.stock'), t('admin.status'), ''], products.map((p) => `<tr>
    <td><div class="admin-product-cell"><span class="admin-product-thumb">${productArt(p)}</span><span><strong>${esc(L(p, 'name'))}</strong><small>${esc(p.sku)}</small></span></div></td>
    <td>${t(`home.${p.category}`)}</td><td>${moneyCell(p.price)}</td><td>${plainNumber(p.stock)}</td>
    <td>${p.active ? `<span class="badge badge-success">${t('admin.active')}</span>` : `<span class="badge badge-muted">${t('actions.hidden') || 'Hidden'}</span>`}</td>
    <td><div class="admin-table-actions"><button class="icon-btn" data-edit="${esc(p.id)}" aria-label="${t('actions.edit')}">${icon('edit')}</button><button class="icon-btn" data-delete="${esc(p.id)}" aria-label="${t('actions.remove')}">${icon('trash')}</button></div></td>
  </tr>`).join(''));
}

async function productTableAction(event, products) {
  const edit = event.target.closest('[data-edit]');
  const del = event.target.closest('[data-delete]');
  if (edit) productDialog(products.find((p) => p.id === edit.dataset.edit));
  if (del) {
    const product = products.find((p) => p.id === del.dataset.delete);
    if (!await confirmDialog(t('admin.confirmDelete'), { confirmLabel: t('actions.remove'), cancelLabel: t('actions.cancel') })) return;
    try { await admin.deleteProduct(product.id); toast(t('admin.deleted')); await renderProducts(); }
    catch { toast(t('toast.error'), { type: 'error' }); }
  }
}

function productDialog(product = {}) {
  const isNew = !product.id;
  const id = product.id || `p-custom-${crypto.randomUUID()}`;
  const opts = (values, selected, labels = {}) => values.map((v) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(labels[v] || v || '—')}</option>`).join('');
  const content = `
    <h2 class="display" style="font-size:1.7rem;margin-block-end:1rem">${t(isNew ? 'admin.newProduct' : 'admin.editProduct')}</h2>
    <form class="admin-product-form" id="admin-product-form">
      <div class="field"><label>${t('admin.nameAr')}</label><input name="name_ar" value="${esc(product.name_ar || '')}" required maxlength="120"></div>
      <div class="field"><label>${t('admin.nameEn')}</label><input name="name_en" value="${esc(product.name_en || '')}" required maxlength="120"></div>
      <div class="field"><label>SKU</label><input name="sku" value="${esc(product.sku || '')}" required maxlength="48"></div>
      <div class="field"><label>${t('admin.category')}</label><select name="category">${opts(categories, product.category || 'classic', Object.fromEntries(categories.map((c) => [c, t(`home.${c}`)])))}</select></div>
      <div class="field"><label>${t('admin.price')}</label><input name="price" type="number" min="0" step="1" value="${product.price || ''}" required></div>
      <div class="field"><label>${t('admin.oldPrice')}</label><input name="old_price" type="number" min="0" step="1" value="${product.old_price || ''}"></div>
      <div class="field"><label>${t('admin.stock')}</label><input name="stock" type="number" min="0" step="1" value="${product.stock ?? 0}" required></div>
      <div class="field"><label>${t('admin.brand')}</label><input name="brand" value="${esc(product.brand || '')}" required maxlength="60"></div>
      <div class="field wide"><label>Image file</label><select name="image_path">${opts(imageOptions, product.image_path || '')}</select></div>
      <label class="checkbox-line"><input name="active" type="checkbox" ${product.active !== false ? 'checked' : ''}><span>${t('admin.active')}</span></label>
      <label class="checkbox-line"><input name="featured" type="checkbox" ${product.featured ? 'checked' : ''}><span>${t('admin.featured')}</span></label>
      <div class="field wide"><label>${t('product.description')} (AR)</label><textarea name="description_ar" maxlength="1200">${esc(product.description_ar || '')}</textarea></div>
      <div class="field wide"><label>${t('product.description')} (EN)</label><textarea name="description_en" maxlength="1200">${esc(product.description_en || '')}</textarea></div>
      <div class="cluster wide" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-close>${t('actions.cancel')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
    </form>`;
  const dlg = dialog({ title: t(isNew ? 'admin.newProduct' : 'admin.editProduct'), content, size: 'lg' });
  dlg.el.querySelector('[data-close]').addEventListener('click', dlg.close);
  dlg.el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = (key) => String(fd.get(key) || '').trim();
    const data = {
      id, slug: (product.slug || text('name_en')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name_ar: text('name_ar'), name_en: text('name_en'), sku: text('sku'), brand: text('brand'), category: text('category'),
      price: Number(fd.get('price')), old_price: fd.get('old_price') ? Number(fd.get('old_price')) : null,
      stock: Math.max(0, Math.floor(Number(fd.get('stock')) || 0)), active: fd.has('active'), featured: fd.has('featured'),
      image_path: text('image_path') || null, description_ar: text('description_ar'), description_en: text('description_en'),
      design: product.design || { case: 'steel', dial: 'black', strap: 'bracelet', style: 'dress' },
      specs: product.specs || { case_size: '40 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير', glass_en: 'Sapphire', water: '50 m', strap_ar: 'فولاذ', strap_en: 'Steel' },
    };
    const submit = e.currentTarget.querySelector('[type="submit"]');
    submit.classList.add('is-loading'); submit.disabled = true;
    try { await admin.saveProduct(data); dlg.close(); toast(t('admin.saved')); await renderProducts(); }
    catch (err) { console.error(err); toast(t('toast.error'), { type: 'error' }); submit.classList.remove('is-loading'); submit.disabled = false; }
  });
}

async function renderInventory() {
  const products = await listProducts({ includeInactive: true });
  const rows = products.map((p) => `<tr>
    <td><div class="admin-product-cell"><span class="admin-product-thumb">${productArt(p)}</span><span><strong>${esc(L(p, 'name'))}</strong><small>${esc(p.sku)}</small></span></div></td>
    <td>${p.stock <= 3 ? `<span class="badge badge-danger">${plainNumber(p.stock)}</span>` : plainNumber(p.stock)}</td>
    <td><div class="admin-table-actions"><button class="icon-btn" data-adjust="-1" data-id="${esc(p.id)}" aria-label="-">${icon('minus')}</button><button class="icon-btn" data-adjust="1" data-id="${esc(p.id)}" aria-label="+">${icon('plus')}</button><button class="btn btn-outline btn-sm" data-set-stock="${esc(p.id)}">${t('admin.adjust')}</button></div></td>
    <td>${t(`home.${p.category}`)}</td><td>${p.active ? t('admin.active') : '—'}</td>
  </tr>`).join('');
  host.innerHTML = `${pageToolbar(t('admin.inventory'))}<article class="admin-card">${table([t('admin.products'), t('admin.currentStock'), t('admin.adjust'), t('admin.category'), t('admin.status')], rows)}</article>`;
  if (!host.dataset.inventoryEvents) {
    host.dataset.inventoryEvents = 'true';
    host.addEventListener('click', inventoryAction);
  }
}

async function inventoryAction(event) {
  const adjust = event.target.closest('[data-adjust]');
  const set = event.target.closest('[data-set-stock]');
  if (!adjust && !set) return;
  try {
    if (adjust) await admin.adjustStock(adjust.dataset.id, Number(adjust.dataset.adjust));
    if (set) {
      const products = await listProducts({ includeInactive: true });
      const product = products.find((x) => x.id === set.dataset.setStock);
      const dlg = dialog({ title: t('admin.currentStock'), size: 'sm', content: `
        <form id="stock-adjust-form">
          <p class="muted">${esc(L(product, 'name'))}</p>
          <div class="field"><label for="stock-target">${t('admin.currentStock')}</label>
            <input id="stock-target" name="stock" type="number" min="0" max="100000" value="${product.stock}" required></div>
          <div class="cluster" style="justify-content:flex-end"><button class="btn btn-ghost" type="button" data-cancel>${t('actions.cancel')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
        </form>` });
      dlg.el.querySelector('[data-cancel]').addEventListener('click', dlg.close);
      dlg.el.querySelector('form').addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();
        const input = Number(new FormData(submitEvent.currentTarget).get('stock'));
        if (!Number.isInteger(input) || input < 0 || input > 100000) return;
        try { await admin.adjustStock(product.id, input - product.stock); dlg.close(); toast(t('admin.stockAdjusted')); await renderInventory(); }
        catch { toast(t('toast.error'), { type: 'error' }); }
      });
      return;
    }
    toast(t('admin.stockAdjusted'));
  } catch { toast(t('toast.error'), { type: 'error' }); }
  await renderInventory();
}

async function renderOrders() {
  const orders = await admin.listOrders();
  const rows = orders.map((o) => `<tr>
    <td><strong dir="ltr">${esc(o.order_no || o.id)}</strong><small class="muted" style="display:block">${esc(o.tracking_code || '')}</small></td>
    <td>${esc(o.name || o.customer_name || '—')}<small class="muted" style="display:block" dir="ltr">${esc(o.phone || '')}</small></td>
    <td>${esc(o.governorate || '—')}</td><td>${moneyCell(o.total)}</td><td>${formatDate(o.created_at)}</td>
    <td><select class="admin-inline-select" data-order-status="${esc(o.id)}">${statusOptions.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${t(`track.${s}`)}</option>`).join('')}</select></td>
  </tr>`).join('');
  host.innerHTML = `${pageToolbar(t('admin.orders'))}<article class="admin-card">${table([t('checkout.orderNo'), t('admin.customer'), t('admin.governorate'), t('admin.total'), t('admin.date'), t('admin.status')], rows)}</article>`;
  host.querySelectorAll('[data-order-status]').forEach((select) => select.addEventListener('change', async () => {
    try { await admin.updateOrderStatus(select.dataset.orderStatus, select.value); toast(t('admin.saved')); }
    catch { toast(t('toast.error'), { type: 'error' }); }
  }));
}

async function renderCoupons() {
  const coupons = await admin.listCoupons();
  const rows = coupons.map((c) => `<tr><td><code>${esc(c.code)}</code></td><td>${t(`admin.${c.type}`)}</td><td>${c.type === 'percent' ? `${c.value}%` : money(c.value)}</td>
    <td>${money(c.min_subtotal || 0)}</td><td>${c.usage_limit ? `${c.used_count || 0}/${c.usage_limit}` : '—'}</td>
    <td>${c.active ? `<span class="badge badge-success">${t('admin.active')}</span>` : `<span class="badge badge-muted">—</span>`}</td>
    <td><button class="icon-btn" data-coupon-delete="${esc(c.code)}" aria-label="${t('actions.remove')}">${icon('trash')}</button></td></tr>`).join('');
  host.innerHTML = `${pageToolbar(t('admin.coupons'), `<button class="btn btn-gold btn-sm" data-new-coupon>${icon('plus', 'icon-sm')} ${t('actions.add')}</button>`)}<article class="admin-card">${table([t('admin.code'), t('admin.type'), t('admin.value'), t('admin.minSubtotal'), t('admin.usageLimit'), t('admin.status'), ''], rows)}</article>`;
  host.querySelector('[data-new-coupon]').addEventListener('click', () => couponDialog());
  host.querySelectorAll('[data-coupon-delete]').forEach((button) => button.addEventListener('click', async () => {
    if (!await confirmDialog(t('admin.confirmDelete'), { confirmLabel: t('actions.remove'), cancelLabel: t('actions.cancel') })) return;
    try { await admin.deleteCoupon(button.dataset.couponDelete); toast(t('admin.deleted')); await renderCoupons(); }
    catch { toast(t('toast.error'), { type: 'error' }); }
  }));
}

function couponDialog() {
  const dlg = dialog({ title: t('admin.newProduct'), size: 'sm', content: `
    <h2 class="display" style="margin-block-end:1rem">${t('admin.coupons')}</h2>
    <form id="coupon-form">
      <div class="field"><label>${t('admin.code')}</label><input name="code" required maxlength="24" pattern="[A-Za-z0-9_-]+"></div>
      <div class="field"><label>${t('admin.type')}</label><select name="type"><option value="percent">${t('admin.percent')}</option><option value="fixed">${t('admin.fixed')}</option></select></div>
      <div class="field"><label>${t('admin.value')}</label><input name="value" type="number" min="1" required></div>
      <div class="field"><label>${t('admin.minSubtotal')}</label><input name="min_subtotal" type="number" min="0" value="0"></div>
      <div class="field"><label>${t('admin.usageLimit')}</label><input name="usage_limit" type="number" min="1"></div>
      <label class="checkbox-line"><input name="active" type="checkbox" checked><span>${t('admin.active')}</span></label>
      <button class="btn btn-gold btn-block" type="submit">${t('actions.save')}</button>
    </form>` });
  dlg.el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const coupon = { code: String(fd.get('code')).trim().toUpperCase(), type: String(fd.get('type')), value: Number(fd.get('value')), min_subtotal: Number(fd.get('min_subtotal')) || 0, usage_limit: fd.get('usage_limit') ? Number(fd.get('usage_limit')) : null, max_discount: null, expires_at: null, used_count: 0, active: fd.has('active') };
    try { await admin.saveCoupon(coupon); dlg.close(); toast(t('admin.saved')); await renderCoupons(); }
    catch { toast(t('toast.error'), { type: 'error' }); }
  });
}

async function renderReviews() {
  const reviews = await admin.listReviews();
  const rows = reviews.map((r) => `<tr><td>${esc(r.author)}</td><td>${esc(r.products ? L(r.products, 'name') : r.product_id)}</td>
    <td>${'★'.repeat(Math.max(0, Math.min(5, r.rating)))}</td><td><strong>${esc(r.title)}</strong><small class="muted" style="display:block">${esc(r.body)}</small></td>
    <td>${r.approved ? `<span class="badge badge-success">${t('admin.published')}</span>` : `<span class="badge badge-muted">${t('admin.pending')}</span>`}</td>
    <td><div class="admin-table-actions"><button class="btn btn-outline btn-sm" data-review="${esc(r.id)}" data-approved="true">${t('admin.approve')}</button><button class="btn btn-ghost btn-sm" data-review="${esc(r.id)}" data-approved="false">${t('admin.reject')}</button></div></td></tr>`).join('');
  host.innerHTML = `${pageToolbar(t('admin.reviews'))}<article class="admin-card">${table([t('product.reviewName'), t('admin.products'), t('compare.rating'), t('product.reviews'), t('admin.status'), ''], rows)}</article>`;
  host.querySelectorAll('[data-review]').forEach((button) => button.addEventListener('click', async () => {
    try { await admin.setReviewApproval(button.dataset.review, button.dataset.approved === 'true'); toast(t('admin.saved')); await renderReviews(); }
    catch { toast(t('toast.error'), { type: 'error' }); }
  }));
}

async function renderShowcase() {
  const settings = loadShowcaseSettings();
  const products = await listProducts({ includeInactive: true });
  const selected = new Set(settings.productIds);
  host.innerHTML = `${pageToolbar(t('admin.showcase') || 'Showcase', `<button class="btn btn-gold btn-sm" data-save-showcase>${icon('check', 'icon-sm')} ${t('actions.save')}</button>`)}
    <article class="admin-card">
      <p class="muted small">هذه الإعدادات محفوظة على هذا المتصفح (محلياً) وتُطبق فوراً على الصفحة الرئيسية. لنشرها لجميع الزوار، خزّنها في Supabase أو ملف إعداد.</p>
      <form class="admin-product-form" id="showcase-form">
        <div class="field"><label>${t('admin.nameAr')}</label><input name="heading_ar" value="${esc(settings.heading_ar)}" required maxlength="120"></div>
        <div class="field"><label>${t('admin.nameEn')}</label><input name="heading_en" value="${esc(settings.heading_en)}" required maxlength="120"></div>
        <div class="field wide"><label>${t('home.heroLead')} (AR)</label><textarea name="lead_ar" maxlength="260">${esc(settings.lead_ar)}</textarea></div>
        <div class="field wide"><label>${t('home.heroLead')} (EN)</label><textarea name="lead_en" maxlength="260">${esc(settings.lead_en)}</textarea></div>
        <div class="field"><label>Theme</label><select name="theme">${['dark', 'light'].map((theme) => `<option value="${theme}" ${theme === settings.theme ? 'selected' : ''}>${theme}</option>`).join('')}</select></div>
        <div class="field"><label>Background image URL</label><input name="backgroundImage" value="${esc(settings.backgroundImage)}" placeholder="https://... or assets/img/watches/hero.jpg" maxlength="500"></div>
        <div class="field wide"><label>Featured watches</label><div class="filter-options" style="max-block-size:260px;overflow:auto;padding:.5rem;border:1px solid #ddd;border-radius:12px">
          ${products.map((product) => `<label class="checkbox-line" style="min-inline-size:220px"><input type="checkbox" name="productIds" value="${esc(product.id)}" ${selected.has(product.id) ? 'checked' : ''}>${esc(L(product, 'name'))}</label>`).join('')}
        </div></div>
        <div class="cluster wide" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-reset-showcase>${t('actions.clear')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
      </form>
    </article>`;
  const form = host.querySelector('#showcase-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    saveShowcaseSettings({
      heading_ar: fd.get('heading_ar'), heading_en: fd.get('heading_en'),
      lead_ar: fd.get('lead_ar'), lead_en: fd.get('lead_en'),
      theme: fd.get('theme'), backgroundImage: fd.get('backgroundImage'),
      productIds: fd.getAll('productIds'),
    });
    toast(t('admin.saved'));
  });
  host.querySelector('[data-reset-showcase]').addEventListener('click', () => {
    resetShowcaseSettings();
    toast(t('actions.clear'));
    renderShowcase();
  });
  host.querySelector('[data-save-showcase]').addEventListener('click', () => form.requestSubmit());
}

async function init() {
  initI18n();
  if (!(await guard())) return;
  mountAdmin(page);
  host = document.querySelector('#admin-content');
  const renderers = { dashboard: renderDashboard, products: renderProducts, inventory: renderInventory, orders: renderOrders, coupons: renderCoupons, reviews: renderReviews, showcase: renderShowcase };
  try { await (renderers[page] || renderDashboard)(); }
  catch (error) { console.error('[admin]', error); host.innerHTML = `<p class="notice">${icon('alert')}<span>${t('toast.error')}</span></p>`; }
  onLangChange(() => (renderers[page] || renderDashboard)());
}

document.addEventListener('DOMContentLoaded', init);
