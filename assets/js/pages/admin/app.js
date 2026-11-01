import { initI18n, t, L, formatDate, onLangChange } from '../../i18n/i18n.js';
import { auth } from '../../lib/auth.js';
import { admin, listProducts, getMode } from '../../lib/db.js';
import { mountAdmin } from '../../../../admin/layout.js';
import { icon, toast, dialog, confirmDialog } from '../../components/ui.js';
import { areaChart, barChart, donutChart } from '../../components/charts.js';
import { productArt } from '../../lib/watch-svg.js';
import { money, plainNumber } from '../../lib/pricing.js';
import { esc } from '../../lib/validate.js';
import { getStorefrontSettings, getStorefrontSettingsStatus, saveStorefrontSettings } from '../../lib/storefront-settings.js';
import { DEFAULT_STOREFRONT_SETTINGS } from '../../lib/storefront-settings-schema.js';

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
      <div class="field wide"><label>Image</label>
  <div style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
    ${product.image_path ? `<img src="${esc(product.image_path)}" alt="" style="max-block-size:80px;border-radius:var(--r-sm);border:1px solid var(--border)" class="admin-image-preview">` : '<span class="muted small admin-no-image">No image</span>'}
    <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp" style="flex:1">
    <button type="button" class="btn btn-ghost btn-sm" data-remove-image ${!product.image_path ? 'hidden' : ''}>Remove</button>
  </div>
  <input type="hidden" name="image_path" value="${esc(product.image_path || '')}">
</div>
      <label class="checkbox-line"><input name="active" type="checkbox" ${product.active !== false ? 'checked' : ''}><span>${t('admin.active')}</span></label>
      <label class="checkbox-line"><input name="featured" type="checkbox" ${product.featured ? 'checked' : ''}><span>${t('admin.featured')}</span></label>
      <div class="field wide"><label>${t('product.description')} (AR)</label><textarea name="description_ar" maxlength="1200">${esc(product.description_ar || '')}</textarea></div>
      <div class="field wide"><label>${t('product.description')} (EN)</label><textarea name="description_en" maxlength="1200">${esc(product.description_en || '')}</textarea></div>
      <div class="cluster wide" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-close>${t('actions.cancel')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
    </form>`;
  const dlg = dialog({ title: t(isNew ? 'admin.newProduct' : 'admin.editProduct'), content, size: 'lg' });
  dlg.el.querySelector('[data-close]').addEventListener('click', dlg.close);

  const removeImgBtn = dlg.el.querySelector('[data-remove-image]');
  if (removeImgBtn) {
    removeImgBtn.addEventListener('click', () => {
      removeImgBtn.dataset.removed = 'true';
      removeImgBtn.hidden = true;
      const preview = dlg.el.querySelector('.admin-image-preview');
      if (preview) preview.style.display = 'none';
    });
  }

  const fileInput = dlg.el.querySelector('input[name="image_file"]');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const preview = dlg.el.querySelector('.admin-image-preview');
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = '';
      }
      if (removeImgBtn) removeImgBtn.hidden = false;
    });
  }

  dlg.el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = (key) => String(fd.get(key) || '').trim();
    const submitBtn = e.currentTarget.querySelector('[type="submit"]');
    submitBtn.classList.add('is-loading'); submitBtn.disabled = true;

    const removeBtn = dlg.el.querySelector('[data-remove-image]');
    const fileInput = e.currentTarget.querySelector('input[name="image_file"]');
    let imagePath = text('image_path') || null;

    if (removeBtn && removeBtn.dataset.removed === 'true') {
      if (imagePath) { try { await admin.deleteImage(imagePath); } catch { /* ignore */ } }
      imagePath = null;
    }

    const file = fileInput?.files?.[0];
    if (file) {
      try {
        const result = await admin.uploadImage(id, file);
        if (imagePath && imagePath !== result.url) {
          try { await admin.deleteImage(imagePath); } catch { /* ignore */ }
        }
        imagePath = result.url;
      } catch (err) {
        console.error('[admin] image upload failed:', err);
        toast(t('toast.error'), { type: 'error' });
        submitBtn.classList.remove('is-loading'); submitBtn.disabled = false;
        return;
      }
    }

    const data = {
      id, slug: (product.slug || text('name_en')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name_ar: text('name_ar'), name_en: text('name_en'), sku: text('sku'), brand: text('brand'), category: text('category'),
      price: Number(fd.get('price')), old_price: fd.get('old_price') ? Number(fd.get('old_price')) : null,
      stock: Math.max(0, Math.floor(Number(fd.get('stock')) || 0)), active: fd.has('active'), featured: fd.has('featured'),
      image_path: imagePath, description_ar: text('description_ar'), description_en: text('description_en'),
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

function settingsNotice() {
  const status = getStorefrontSettingsStatus();
  if (status === 'migration-required') return `<p class="notice admin-settings-warning" role="status">${icon('alert')}<span>${t('admin.settingsMigrationRequired')}</span></p>`;
  if (status === 'local-demo') return `<p class="notice admin-settings-warning" role="status">${icon('alert')}<span>${t('admin.settingsLocalDemo')}</span></p>`;
  if (status === 'backend-unavailable') return `<p class="notice admin-settings-warning" role="status">${icon('alert')}<span>${t('admin.settingsBackendUnavailable')}</span></p>`;
  return `<p class="notice admin-settings-live" role="status">${icon('checkCircle')}<span>${t('admin.settingsStoredInSupabase')}</span></p>`;
}

function settingsBadge() {
  const status = getStorefrontSettingsStatus();
  if (status === 'remote') return `<span class="badge badge-success">${t('admin.settingsRemoteLabel')}</span>`;
  if (status === 'local-demo') return `<span class="badge badge-muted">${t('admin.settingsLocalLabel')}</span>`;
  return `<span class="badge badge-muted">${t('admin.settingsNotConnected')}</span>`;
}

function settingsTextField(label, name, value, { wide = false, textarea = false, max = 500 } = {}) {
  const field = textarea
    ? `<textarea name="${name}" maxlength="${max}">${esc(value || '')}</textarea>`
    : `<input name="${name}" value="${esc(value || '')}" maxlength="${max}">`;
  return `<div class="field${wide ? ' wide' : ''}"><label>${label}</label>${field}</div>`;
}

async function renderContent() {
  const settings = await getStorefrontSettings();
  const { announcement, trust, craft } = settings;
  host.innerHTML = `${pageToolbar(t('admin.content'), settingsBadge())}
    ${settingsNotice()}
    <form id="store-content-form" class="store-content-form">
      <article class="admin-card"><h2>${t('admin.announcement')}</h2>
        <label class="checkbox-line"><input name="announcement_enabled" type="checkbox" ${announcement.enabled ? 'checked' : ''}><span>${t('admin.visible')}</span></label>
        <div class="admin-product-form">
          ${settingsTextField(`${t('admin.textAr')} — AR`, 'announcement_text_ar', announcement.text_ar, { wide: true, max: 240 })}
          ${settingsTextField(`${t('admin.textEn')} — EN`, 'announcement_text_en', announcement.text_en, { wide: true, max: 240 })}
        </div>
      </article>
      <article class="admin-card"><h2>${t('admin.trustStrip')}</h2><p class="muted small">${t('admin.editTrustHint')}</p>
        <div class="store-content-list">${trust.map((item, index) => `<section class="store-content-item">
          <input type="hidden" name="trust_${index}_id" value="${esc(item.id)}">
          <label class="checkbox-line"><input name="trust_${index}_enabled" type="checkbox" ${item.enabled ? 'checked' : ''}><span>${t('admin.visible')}</span></label>
          <div class="admin-product-form">
            ${settingsTextField(`${t('admin.title')} — AR`, `trust_${index}_title_ar`, item.title_ar, { max: 120 })}
            ${settingsTextField(`${t('admin.description')} — AR`, `trust_${index}_description_ar`, item.description_ar, { textarea: true, max: 240 })}
            ${settingsTextField(`${t('admin.title')} — EN`, `trust_${index}_title_en`, item.title_en, { max: 120 })}
            ${settingsTextField(`${t('admin.description')} — EN`, `trust_${index}_description_en`, item.description_en, { textarea: true, max: 240 })}
          </div>
        </section>`).join('')}</div>
      </article>
      <article class="admin-card"><h2>${t('admin.craftSection')}</h2>
        <div class="admin-product-form">
          ${settingsTextField(`${t('admin.title')} — AR`, 'craft_heading_ar', craft.heading_ar, { max: 120 })}
          ${settingsTextField(`${t('admin.title')} — EN`, 'craft_heading_en', craft.heading_en, { max: 120 })}
          ${settingsTextField(`${t('admin.description')} — AR`, 'craft_lead_ar', craft.lead_ar, { wide: true, textarea: true, max: 500 })}
          ${settingsTextField(`${t('admin.description')} — EN`, 'craft_lead_en', craft.lead_en, { wide: true, textarea: true, max: 500 })}
          <div class="field wide"><label>${t('admin.craftImage')}</label>
            <div class="store-image-control">
              ${craft.image_url ? `<img src="${esc(craft.image_url)}" alt="${t('admin.craftImage')}" data-craft-preview>` : `<span class="muted small" data-craft-empty>${t('admin.defaultImageUsed')}</span>`}
              <input type="file" name="craft_image_file" accept="image/jpeg,image/png,image/webp">
              <input type="hidden" name="craft_image_url" value="${esc(craft.image_url)}">
              <button type="button" class="btn btn-ghost btn-sm" data-clear-craft-image ${craft.image_url ? '' : 'hidden'}>${t('admin.removeImage')}</button>
            </div>
          </div>
        </div>
        <h3>${t('admin.features')}</h3>
        <div class="store-content-list">${craft.features.map((item, index) => `<section class="store-content-item">
          <input type="hidden" name="feature_${index}_id" value="${esc(item.id)}">
          <label class="checkbox-line"><input name="feature_${index}_enabled" type="checkbox" ${item.enabled ? 'checked' : ''}><span>${t('admin.visible')}</span></label>
          <div class="admin-product-form">
            ${settingsTextField(`${t('admin.title')} — AR`, `feature_${index}_title_ar`, item.title_ar, { max: 120 })}
            ${settingsTextField(`${t('admin.description')} — AR`, `feature_${index}_description_ar`, item.description_ar, { textarea: true, max: 240 })}
            ${settingsTextField(`${t('admin.title')} — EN`, `feature_${index}_title_en`, item.title_en, { max: 120 })}
            ${settingsTextField(`${t('admin.description')} — EN`, `feature_${index}_description_en`, item.description_en, { textarea: true, max: 240 })}
          </div>
        </section>`).join('')}</div>
        <h3>${t('admin.stats')}</h3>
        <div class="admin-product-form">${craft.stats.map((item, index) => `
          <input type="hidden" name="stat_${index}_id" value="${esc(item.id)}">
          <div class="field"><label>${t('admin.statValue')}</label><input name="stat_${index}_value" type="number" min="0" max="99999999" value="${esc(item.value)}"></div>
          ${settingsTextField(`${t('admin.label')} — AR`, `stat_${index}_label_ar`, item.label_ar, { max: 80 })}
          ${settingsTextField(`${t('admin.label')} — EN`, `stat_${index}_label_en`, item.label_en, { max: 80 })}
        `).join('')}</div>
      </article>
      <div class="admin-form-actions"><button class="btn btn-gold" type="submit">${icon('check', 'icon-sm')} ${t('actions.save')}</button></div>
    </form>`;

  const form = host.querySelector('#store-content-form');
  const imageInput = form.querySelector('[name="craft_image_file"]');
  const imageUrl = form.querySelector('[name="craft_image_url"]');
  const clearImage = form.querySelector('[data-clear-craft-image]');
  let imageRemoved = false;
  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    let preview = form.querySelector('[data-craft-preview]');
    if (!preview) {
      preview = document.createElement('img');
      preview.dataset.craftPreview = '';
      preview.alt = t('admin.craftImage');
      form.querySelector('.store-image-control').prepend(preview);
    }
    preview.src = URL.createObjectURL(file);
    form.querySelector('[data-craft-empty]')?.remove();
    clearImage.hidden = false;
    imageRemoved = false;
  });
  clearImage.addEventListener('click', () => {
    imageRemoved = true;
    imageUrl.value = '';
    imageInput.value = '';
    form.querySelector('[data-craft-preview]')?.remove();
    if (!form.querySelector('[data-craft-empty]')) {
      const empty = document.createElement('span');
      empty.className = 'muted small'; empty.dataset.craftEmpty = '';
      empty.textContent = t('admin.defaultImageUsed');
      form.querySelector('.store-image-control').prepend(empty);
    }
    clearImage.hidden = true;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const fd = new FormData(form);
    const next = {
      ...settings,
      announcement: {
        enabled: fd.has('announcement_enabled'),
        text_ar: fd.get('announcement_text_ar'), text_en: fd.get('announcement_text_en'),
      },
      trust: trust.map((item, index) => ({
        ...item, enabled: fd.has(`trust_${index}_enabled`),
        title_ar: fd.get(`trust_${index}_title_ar`), description_ar: fd.get(`trust_${index}_description_ar`),
        title_en: fd.get(`trust_${index}_title_en`), description_en: fd.get(`trust_${index}_description_en`),
      })),
      craft: {
        ...craft,
        heading_ar: fd.get('craft_heading_ar'), heading_en: fd.get('craft_heading_en'),
        lead_ar: fd.get('craft_lead_ar'), lead_en: fd.get('craft_lead_en'),
        image_url: imageRemoved ? '' : imageUrl.value,
        features: craft.features.map((item, index) => ({
          ...item, enabled: fd.has(`feature_${index}_enabled`),
          title_ar: fd.get(`feature_${index}_title_ar`), description_ar: fd.get(`feature_${index}_description_ar`),
          title_en: fd.get(`feature_${index}_title_en`), description_en: fd.get(`feature_${index}_description_en`),
        })),
        stats: craft.stats.map((item, index) => ({
          ...item, value: fd.get(`stat_${index}_value`),
          label_ar: fd.get(`stat_${index}_label_ar`), label_en: fd.get(`stat_${index}_label_en`),
        })),
      },
    };
    let uploaded = null;
    try {
      const file = imageInput.files?.[0];
      if (file) {
        if (getStorefrontSettingsStatus() !== 'remote') {
          throw new Error(getStorefrontSettingsStatus() === 'migration-required'
            ? 'storefront_settings_migration_required' : 'storefront_settings_backend_unavailable');
        }
        if (file.size > 5 * 1024 * 1024) throw new Error('image_too_large');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('invalid_image_type');
        uploaded = await admin.uploadImage('storefront/craft', file);
        next.craft.image_url = uploaded.url;
      }
      await saveStorefrontSettings(next);
      if (craft.image_url && craft.image_url !== next.craft.image_url) await admin.deleteImage(craft.image_url);
      toast(t('admin.saved'));
      await renderContent();
    } catch (error) {
      if (uploaded) await admin.deleteImage(uploaded.url);
      const message = error.message === 'storefront_settings_migration_required' ? t('admin.settingsMigrationRequired')
        : error.message === 'storefront_settings_backend_unavailable' ? t('admin.settingsBackendUnavailable')
          : error.code === '42501' ? t('admin.notAdmin')
          : error.message === 'image_too_large' ? t('admin.imageTooLarge')
            : error.message === 'invalid_image_type' ? t('admin.imageTypeInvalid') : t('toast.error');
      toast(message, { type: 'error' });
      submit.disabled = false;
    }
  });
}

async function renderShipping() {
  const rates = await admin.listShippingRates();
  const rows = rates.map((rate) => `<tr>
    <td>${esc(rate.governorate)}</td><td>${esc(rate.governorate_en)}</td><td>${moneyCell(rate.fee)}</td>
    <td>${rate.active ? `<span class="badge badge-success">${t('admin.active')}</span>` : `<span class="badge badge-muted">${t('admin.inactive')}</span>`}</td>
    <td><div class="admin-table-actions">
      <button class="icon-btn" data-rate-edit="${esc(rate.governorate)}" aria-label="${t('actions.edit')}">${icon('edit')}</button>
      <button class="btn btn-outline btn-sm" data-rate-toggle="${esc(rate.governorate)}">${rate.active ? t('admin.deactivate') : t('admin.activate')}</button>
      <button class="icon-btn" data-rate-delete="${esc(rate.governorate)}" aria-label="${t('actions.remove')}">${icon('trash')}</button>
    </div></td></tr>`).join('');
  host.innerHTML = `${pageToolbar(t('admin.shipping'), `<button class="btn btn-gold btn-sm" data-new-rate>${icon('plus', 'icon-sm')} ${t('admin.addGovernorate')}</button>`)}
    <p class="muted small">${getMode() === 'remote' ? t('admin.shippingDatabaseNote') : t('toast.offline')}</p>
    <article class="admin-card">${table([t('admin.governorate'), t('admin.governorateEn'), t('admin.shippingFee'), t('admin.status'), ''], rows)}</article>`;

  host.querySelector('[data-new-rate]').addEventListener('click', () => shippingRateDialog());
  host.querySelector('[data-rate-edit]')?.closest('table')?.addEventListener('click', async (event) => {
    const edit = event.target.closest('[data-rate-edit]');
    const toggle = event.target.closest('[data-rate-toggle]');
    const remove = event.target.closest('[data-rate-delete]');
    if (edit) {
      shippingRateDialog(rates.find((rate) => rate.governorate === edit.dataset.rateEdit));
      return;
    }
    if (toggle) {
      const rate = rates.find((item) => item.governorate === toggle.dataset.rateToggle);
      if (rate.active && rates.filter((item) => item.active).length <= 1) {
        toast(t('admin.keepOneShippingRate'), { type: 'error' }); return;
      }
      try { await admin.saveShippingRate({ ...rate, active: !rate.active }, rate.governorate); toast(t('admin.saved')); await renderShipping(); }
      catch { toast(t('toast.error'), { type: 'error' }); }
    }
    if (remove) {
      const rate = rates.find((item) => item.governorate === remove.dataset.rateDelete);
      if (rate.active && rates.filter((item) => item.active).length <= 1) {
        toast(t('admin.keepOneShippingRate'), { type: 'error' }); return;
      }
      if (!await confirmDialog(t('admin.confirmDelete'), { confirmLabel: t('actions.remove'), cancelLabel: t('actions.cancel') })) return;
      try { await admin.deleteShippingRate(rate.governorate); toast(t('admin.deleted')); await renderShipping(); }
      catch { toast(t('toast.error'), { type: 'error' }); }
    }
  });
}

function shippingRateDialog(rate = {}) {
  const original = rate.governorate || '';
  const dlg = dialog({
    title: t(original ? 'admin.editGovernorate' : 'admin.addGovernorate'),
    content: `<form id="shipping-rate-form" class="admin-product-form">
      <label class="field"><span>${t('admin.governorate')} — AR</span><input name="governorate" value="${esc(rate.governorate || '')}" required minlength="2" maxlength="80"></label>
      <label class="field"><span>${t('admin.governorateEn')} — EN</span><input name="governorate_en" value="${esc(rate.governorate_en || '')}" required minlength="2" maxlength="80"></label>
      <label class="field"><span>${t('admin.shippingFee')}</span><input name="fee" type="number" min="0" max="100000" step="0.01" value="${rate.fee ?? 0}" required></label>
      <label class="checkbox-line"><input name="active" type="checkbox" ${rate.active !== false ? 'checked' : ''}><span>${t('admin.active')}</span></label>
      <div class="cluster wide" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-rate-cancel>${t('actions.cancel')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
    </form>`,
  });
  dlg.el.querySelector('[data-rate-cancel]').addEventListener('click', dlg.close);
  dlg.el.querySelector('#shipping-rate-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const fd = new FormData(form);
    try {
      await admin.saveShippingRate({
        governorate: fd.get('governorate'), governorate_en: fd.get('governorate_en'),
        fee: fd.get('fee'), active: fd.has('active'),
      }, original);
      dlg.close(); toast(t('admin.saved')); await renderShipping();
    } catch (error) {
      toast(error.message === 'governorate_exists' ? t('admin.governorateExists') : t('toast.error'), { type: 'error' });
      submit.disabled = false;
    }
  });
}

async function renderShowcase() {
  const settings = await getStorefrontSettings();
  const showcase = settings.showcase;
  const products = await listProducts({ includeInactive: true });
  const defaultIds = products.filter((product) => product.featured && !product.design?.accessory).map((product) => product.id);
  const selected = new Set(showcase.productIds === null ? defaultIds : showcase.productIds);
  host.innerHTML = `${pageToolbar(t('admin.showcase'), `${settingsBadge()} <button class="btn btn-gold btn-sm" data-save-showcase>${icon('check', 'icon-sm')} ${t('actions.save')}</button>`)}
    ${settingsNotice()}
    <article class="admin-card">
      <form class="admin-product-form" id="showcase-form">
        <div class="field"><label>${t('admin.nameAr')}</label><input name="heading_ar" value="${esc(showcase.heading_ar)}" required maxlength="120"></div>
        <div class="field"><label>${t('admin.nameEn')}</label><input name="heading_en" value="${esc(showcase.heading_en)}" required maxlength="120"></div>
        <div class="field wide"><label>${t('home.heroLead')} — AR</label><textarea name="lead_ar" maxlength="500">${esc(showcase.lead_ar)}</textarea></div>
        <div class="field wide"><label>${t('home.heroLead')} — EN</label><textarea name="lead_en" maxlength="500">${esc(showcase.lead_en)}</textarea></div>
        <div class="field"><label>${t('admin.theme')}</label><select name="theme"><option value="light" ${showcase.theme === 'light' ? 'selected' : ''}>${t('admin.light')}</option><option value="dark" ${showcase.theme === 'dark' ? 'selected' : ''}>${t('admin.dark')}</option></select></div>
        <div class="field wide"><label>${t('admin.showcaseBackground')}</label>
          <div class="store-image-control">
            ${showcase.backgroundImage ? `<img src="${esc(showcase.backgroundImage)}" alt="${t('admin.showcaseBackground')}" data-showcase-preview>` : `<span class="muted small" data-showcase-empty>${t('admin.defaultImageUsed')}</span>`}
            <input type="file" name="background_file" accept="image/jpeg,image/png,image/webp">
            <input type="hidden" name="backgroundImage" value="${esc(showcase.backgroundImage)}">
            <button type="button" class="btn btn-ghost btn-sm" data-remove-background ${showcase.backgroundImage ? '' : 'hidden'}>${t('admin.removeImage')}</button>
          </div>
        </div>
        <div class="field wide"><label>${t('admin.showcaseProducts')}</label><div class="showcase-product-list">
          ${products.filter((product) => !product.design?.accessory).map((product) => `<label class="checkbox-line"><input type="checkbox" name="productIds" value="${esc(product.id)}" ${selected.has(product.id) ? 'checked' : ''}>${productArt(product, { width: 48, height: 58 })}<span>${esc(L(product, 'name'))}</span></label>`).join('')}
        </div><small class="muted">${t('admin.emptyShowcaseHint')}</small></div>
        <div class="cluster wide" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" data-reset-showcase>${t('admin.resetShowcase')}</button><button class="btn btn-gold" type="submit">${t('actions.save')}</button></div>
      </form>
    </article>`;
  const form = host.querySelector('#showcase-form');
  const fileInput = form.querySelector('[name="background_file"]');
  const backgroundInput = form.querySelector('[name="backgroundImage"]');
  const removeBackground = form.querySelector('[data-remove-background]');
  let backgroundRemoved = false;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    let preview = form.querySelector('[data-showcase-preview]');
    if (!preview) {
      preview = document.createElement('img');
      preview.dataset.showcasePreview = '';
      preview.alt = t('admin.showcaseBackground');
      form.querySelector('.store-image-control').prepend(preview);
    }
    preview.src = URL.createObjectURL(file);
    form.querySelector('[data-showcase-empty]')?.remove();
    removeBackground.hidden = false;
    backgroundRemoved = false;
  });
  removeBackground.addEventListener('click', () => {
    backgroundRemoved = true;
    backgroundInput.value = '';
    fileInput.value = '';
    form.querySelector('[data-showcase-preview]')?.remove();
    if (!form.querySelector('[data-showcase-empty]')) {
      const empty = document.createElement('span');
      empty.className = 'muted small'; empty.dataset.showcaseEmpty = '';
      empty.textContent = t('admin.defaultImageUsed');
      form.querySelector('.store-image-control').prepend(empty);
    }
    removeBackground.hidden = true;
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const fd = new FormData(form);
    const next = { ...settings, showcase: {
      ...showcase,
      heading_ar: fd.get('heading_ar'), heading_en: fd.get('heading_en'),
      lead_ar: fd.get('lead_ar'), lead_en: fd.get('lead_en'),
      theme: fd.get('theme'), backgroundImage: backgroundRemoved ? '' : backgroundInput.value,
      productIds: fd.getAll('productIds'),
    } };
    let uploaded = null;
    try {
      const file = fileInput.files?.[0];
      if (file) {
        if (getStorefrontSettingsStatus() !== 'remote') {
          throw new Error(getStorefrontSettingsStatus() === 'migration-required'
            ? 'storefront_settings_migration_required' : 'storefront_settings_backend_unavailable');
        }
        if (file.size > 5 * 1024 * 1024) throw new Error('image_too_large');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('invalid_image_type');
        uploaded = await admin.uploadImage('storefront/showcase', file);
        next.showcase.backgroundImage = uploaded.url;
      }
      await saveStorefrontSettings(next);
      if (showcase.backgroundImage && showcase.backgroundImage !== next.showcase.backgroundImage) await admin.deleteImage(showcase.backgroundImage);
      toast(t('admin.saved'));
      await renderShowcase();
    } catch (error) {
      if (uploaded) await admin.deleteImage(uploaded.url);
      const message = error.message === 'storefront_settings_migration_required' ? t('admin.settingsMigrationRequired')
        : error.message === 'storefront_settings_backend_unavailable' ? t('admin.settingsBackendUnavailable')
          : error.code === '42501' ? t('admin.notAdmin')
          : error.message === 'image_too_large' ? t('admin.imageTooLarge')
            : error.message === 'invalid_image_type' ? t('admin.imageTypeInvalid') : t('toast.error');
      toast(message, { type: 'error' });
      submit.disabled = false;
    }
  });
  host.querySelector('[data-reset-showcase]').addEventListener('click', async () => {
    try {
      await saveStorefrontSettings({ ...settings, showcase: DEFAULT_STOREFRONT_SETTINGS.showcase });
      if (showcase.backgroundImage) await admin.deleteImage(showcase.backgroundImage);
      toast(t('admin.saved'));
      await renderShowcase();
    } catch (error) {
      const message = error.message === 'storefront_settings_migration_required' ? t('admin.settingsMigrationRequired')
        : error.message === 'storefront_settings_backend_unavailable' ? t('admin.settingsBackendUnavailable')
          : error.code === '42501' ? t('admin.notAdmin') : t('toast.error');
      toast(message, { type: 'error' });
    }
  });
  host.querySelector('[data-save-showcase]').addEventListener('click', () => form.requestSubmit());
}

async function init() {
  initI18n();
  if (!(await guard())) return;
  mountAdmin(page);
  host = document.querySelector('#admin-content');
  const renderers = { dashboard: renderDashboard, products: renderProducts, inventory: renderInventory, orders: renderOrders, coupons: renderCoupons, reviews: renderReviews, showcase: renderShowcase, content: renderContent, shipping: renderShipping };
  try { await (renderers[page] || renderDashboard)(); }
  catch (error) { console.error('[admin]', error); host.innerHTML = `<p class="notice">${icon('alert')}<span>${t('toast.error')}</span></p>`; }
  onLangChange(() => (renderers[page] || renderDashboard)());
}

document.addEventListener('DOMContentLoaded', init);
