/**
 * Data access layer.
 * Remote: Supabase (RLS-protected tables, security-definer RPCs, Edge Functions).
 * Local : full offline mirror (seed + localStorage) so the storefront works
 *         before migrations are applied — every feature stays testable.
 */
import { getSupabase } from './supabase-client.js';
import { SEED_PRODUCTS, SEED_REVIEWS, SEED_COUPONS, SHIPPING_RATES } from './seed.js';
import { STORAGE_KEYS, CONFIG } from './config.js';
import { computeTotals } from './pricing.js';
import { cleanText } from './validate.js';

let mode = null;
export const getMode = () => mode || 'local';

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ------------------------------- local store ------------------------------ */
const localProducts = () => readJSON(STORAGE_KEYS.demoProducts, SEED_PRODUCTS);
const saveLocalProducts = (items) => writeJSON(STORAGE_KEYS.demoProducts, items);
const localOrders = () => readJSON(STORAGE_KEYS.demoOrders, []);
const saveLocalOrders = (items) => writeJSON(STORAGE_KEYS.demoOrders, items);
const localReviews = () => [...readJSON(STORAGE_KEYS.demoReviews, []), ...SEED_REVIEWS];

async function withRemote(remoteFn, localFn) {
  // Once a table has positively proved the backend is usable, never silently
  // downgrade a failed mutation to localStorage (especially orders/admin writes).
  if (mode === 'local') return localFn();
  const sb = await getSupabase();
  if (sb) {
    try {
      const result = await remoteFn(sb);
      mode = 'remote';
      return result;
    } catch (err) {
      if (mode === 'remote') throw err;
      console.warn('[orokrone/db] remote call failed, using local data:', err.message || err);
      mode = 'local';
    }
  }
  mode = 'local';
  return localFn();
}

const applyFilters = (items, f = {}) => {
  let out = items.filter((p) => f.includeInactive ? true : p.active !== false);
  if (f.category) out = out.filter((p) => p.category === f.category);
  if (f.brand) out = out.filter((p) => p.brand === f.brand);
  if (f.strap) out = out.filter((p) => (p.design?.strap || '').includes(f.strap));
  if (f.inStock) out = out.filter((p) => p.stock > 0);
  if (f.onSale) out = out.filter((p) => p.old_price > p.price);
  if (f.minPrice != null) out = out.filter((p) => p.price >= f.minPrice);
  if (f.maxPrice != null) out = out.filter((p) => p.price <= f.maxPrice);
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter((p) => [p.name_ar, p.name_en, p.brand, p.sku]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }
  const sorters = {
    featured: (a, b) => (b.featured - a.featured) || b.rating_avg - a.rating_avg,
    new: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating_avg - a.rating_avg,
  };
  return out.sort(sorters[f.sort] || sorters.featured);
};

/* -------------------------------- products -------------------------------- */
export async function listProducts(filters = {}) {
  return withRemote(async (sb) => {
    let q = sb.from('products').select('*');
    if (!filters.includeInactive) q = q.eq('active', true);
    if (filters.category) q = q.eq('category', filters.category);
    if (filters.brand) q = q.eq('brand', filters.brand);
    if (filters.inStock) q = q.gt('stock', 0);
    if (filters.q) q = q.or(`name_ar.ilike.%${filters.q}%,name_en.ilike.%${filters.q}%`);
    const { data, error } = await q.limit(200);
    if (error) throw error;
    return applyFilters(data || [], filters);
  }, () => applyFilters(localProducts(), filters));
}

export async function getProduct(slugOrId) {
  return withRemote(async (sb) => {
    const { data, error } = await sb.from('products').select('*')
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`).maybeSingle();
    if (error) throw error;
    return data;
  }, () => localProducts().find((p) => p.slug === slugOrId || p.id === slugOrId) || null);
}

export async function getProductsByIds(ids = []) {
  if (!ids.length) return [];
  const all = await listProducts({ includeInactive: true });
  return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean);
}

export async function getRelated(product, limit = 4) {
  const all = await listProducts();
  return all.filter((p) => p.id !== product.id)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category))
    .slice(0, limit);
}

export async function getShippingRates() {
  return withRemote(async (sb) => {
    const { data, error } = await sb.from('shipping_rates').select('*').eq('active', true).order('governorate');
    if (error) throw error;
    return data?.length ? data : SHIPPING_RATES;
  }, () => SHIPPING_RATES);
}

/* --------------------------------- reviews -------------------------------- */
export async function getReviews(productId) {
  return withRemote(async (sb) => {
    const { data, error } = await sb.from('reviews').select('*')
      .eq('product_id', productId).eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, () => localReviews().filter((r) => r.product_id === productId && r.approved));
}

export async function submitReview(review) {
  const payload = {
    product_id: review.product_id,
    author: cleanText(review.author, 60),
    rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
    title: cleanText(review.title, 90),
    body: cleanText(review.body, 1200),
    approved: false,
  };
  return withRemote(async (sb) => {
    const { error } = await sb.from('reviews').insert(payload);
    if (error) throw error;
    return { ok: true };
  }, () => {
    const pending = readJSON(STORAGE_KEYS.demoReviews, []);
    pending.unshift({ ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() });
    writeJSON(STORAGE_KEYS.demoReviews, pending);
    return { ok: true };
  });
}

/* --------------------------------- coupons -------------------------------- */
export async function applyCoupon(code, subtotal) {
  const normalized = cleanText(code, 24).toUpperCase();
  if (!normalized) throw new Error('empty');
  return withRemote(async (sb) => {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({ code: normalized, subtotal }),
      });
      if (response.ok) {
        const result = await response.json();
        if (!result.valid) throw new Error(result.reason || 'invalid');
        return result.coupon;
      }
      if (![404, 405, 501].includes(response.status)) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || result.reason || 'invalid');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'TypeError' && error.message !== 'Failed to fetch' && error.message !== 'NetworkError when attempting to fetch resource.') throw error;
      // Function not deployed/reachable yet: validate through the protected SQL RPC.
    }
    const { data, error } = await sb.rpc('validate_coupon', { p_code: normalized, p_subtotal: subtotal });
    if (error) throw error;
    if (!data?.valid) throw new Error(data?.reason || 'invalid');
    return data.coupon;
  }, () => {
    const coupon = SEED_COUPONS.find((c) => c.code === normalized && c.active);
    if (!coupon) throw new Error('invalid');
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error('expired');
    if (subtotal < coupon.min_subtotal) throw new Error('min');
    return coupon;
  });
}

/* --------------------------------- orders --------------------------------- */
const randomCode = (prefix, len = 6) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return `${prefix}-${Array.from(buf, (n) => alphabet[n % alphabet.length]).join('')}`;
};

export async function placeOrder(payload) {
  const body = {
    customer: {
      name: cleanText(payload.customer.name, 90),
      phone: cleanText(payload.customer.phone, 20),
      email: cleanText(payload.customer.email || '', 120),
      governorate: cleanText(payload.customer.governorate, 60),
      city: cleanText(payload.customer.city, 90),
      address: cleanText(payload.customer.address, 400),
      notes: cleanText(payload.customer.notes || '', 500),
    },
    items: payload.items.map((it) => ({ id: it.id, qty: Math.max(1, Math.min(it.qty, CONFIG.MAX_QTY_PER_ITEM)) })),
    coupon_code: payload.coupon_code ? cleanText(payload.coupon_code, 24).toUpperCase() : null,
  };

  const createLocally = () => {
    const products = localProducts();
    const items = body.items.map((it) => {
      const product = products.find((p) => p.id === it.id);
      if (!product || product.stock < it.qty) throw new Error('out_of_stock');
      return { ...it, price: product.price, name_ar: product.name_ar, name_en: product.name_en, design: product.design, slug: product.slug };
    });
    const coupon = body.coupon_code ? SEED_COUPONS.find((c) => c.code === body.coupon_code) : null;
    const totals = computeTotals({ items, coupon, governorate: body.customer.governorate, rates: SHIPPING_RATES });
    const order = {
      id: `local-${Date.now()}`,
      order_no: `ORK-${new Date().getFullYear()}-${String(localOrders().length + 1).padStart(4, '0')}`,
      tracking_code: randomCode('ORK'),
      ...body.customer, ...totals,
      coupon_code: coupon?.code || null,
      payment_method: 'cod', status: 'pending',
      created_at: new Date().toISOString(), items,
    };
    saveLocalOrders([order, ...localOrders()]);
    saveLocalProducts(products.map((p) => {
      const bought = items.find((it) => it.id === p.id);
      return bought ? { ...p, stock: p.stock - bought.qty } : p;
    }));
    return { order_no: order.order_no, tracking_code: order.tracking_code, total: order.total };
  };

  if (mode === 'local') {
    if (['localhost', '127.0.0.1'].includes(location.hostname)) return createLocally();
    throw new Error('backend_unavailable');
  }
  const sb = await getSupabase();
  if (!sb) {
    mode = 'local';
    if (['localhost', '127.0.0.1'].includes(location.hostname)) return createLocally();
    throw new Error('backend_unavailable');
  }
  try {
    mode = 'remote';
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${(await sb.auth.getSession()).data.session?.access_token || CONFIG.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || (res.status === 404 ? 'place_order_function_not_deployed' : 'order_failed'));
    }
    return res.json();
  } catch (error) {
    throw error;
  }
}

export async function trackOrder(code) {
  const normalized = cleanText(code, 24).toUpperCase();
  return withRemote(async (sb) => {
    const { data, error } = await sb.rpc('track_order', { p_code: normalized });
    if (error) throw error;
    return data || null;
  }, () => {
    const order = localOrders().find((o) => o.tracking_code === normalized);
    return order ? {
      order_no: order.order_no, status: order.status, created_at: order.created_at,
      total: order.total, governorate: order.governorate,
      items: order.items.map((it) => ({ name_ar: it.name_ar, name_en: it.name_en, qty: it.qty, price: it.price })),
    } : null;
  });
}

export async function myOrders() {
  return withRemote(async (sb) => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return [];
    const { data, error } = await sb.from('orders').select('*, order_items(*)')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, () => localOrders());
}

/* ---------------------------------- admin --------------------------------- */
export const admin = {
  async saveProduct(product) {
    return withRemote(async (sb) => {
      const { data, error } = await sb.from('products').upsert(product).select().single();
      if (error) throw error;
      return data;
    }, () => {
      const products = localProducts();
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx >= 0) products[idx] = { ...products[idx], ...product };
      else products.unshift({ rating_avg: 0, rating_count: 0, created_at: new Date().toISOString(), ...product });
      saveLocalProducts(products);
      return product;
    });
  },

  async deleteProduct(id) {
    return withRemote(async (sb) => {
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }, () => { saveLocalProducts(localProducts().filter((p) => p.id !== id)); return { ok: true }; });
  },

  async adjustStock(id, delta) {
    return withRemote(async (sb) => {
      const { data, error } = await sb.rpc('adjust_stock', { p_id: id, p_delta: delta });
      if (error) throw error;
      return data;
    }, () => {
      const products = localProducts();
      const product = products.find((p) => p.id === id);
      product.stock = Math.max(0, product.stock + delta);
      saveLocalProducts(products);
      return product.stock;
    });
  },

  async listOrders() {
    return withRemote(async (sb) => {
      const { data, error } = await sb.from('orders').select('*, order_items(*)')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    }, () => localOrders());
  },

  async updateOrderStatus(id, status) {
    return withRemote(async (sb) => {
      const { error } = await sb.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      return { ok: true };
    }, () => {
      saveLocalOrders(localOrders().map((o) => (o.id === id ? { ...o, status } : o)));
      return { ok: true };
    });
  },

  async listCoupons() {
    return withRemote(async (sb) => {
      const { data, error } = await sb.from('coupons').select('*').order('code');
      if (error) throw error;
      return data || [];
    }, () => SEED_COUPONS);
  },

  async saveCoupon(coupon) {
    return withRemote(async (sb) => {
      const { error } = await sb.from('coupons').upsert(coupon);
      if (error) throw error;
      return { ok: true };
    }, () => {
      const idx = SEED_COUPONS.findIndex((c) => c.code === coupon.code);
      if (idx >= 0) SEED_COUPONS[idx] = { ...SEED_COUPONS[idx], ...coupon };
      else SEED_COUPONS.push(coupon);
      return { ok: true };
    });
  },

  async deleteCoupon(code) {
    return withRemote(async (sb) => {
      const { error } = await sb.from('coupons').delete().eq('code', code);
      if (error) throw error;
      return { ok: true };
    }, () => {
      const idx = SEED_COUPONS.findIndex((c) => c.code === code);
      if (idx >= 0) SEED_COUPONS.splice(idx, 1);
      return { ok: true };
    });
  },

  async listReviews() {
    return withRemote(async (sb) => {
      const { data, error } = await sb.from('reviews').select('*, products(name_ar, name_en)')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    }, () => localReviews().map((r) => ({
      ...r, products: localProducts().find((p) => p.id === r.product_id),
    })));
  },

  async setReviewApproval(id, approved) {
    return withRemote(async (sb) => {
      const { error } = await sb.from('reviews').update({ approved }).eq('id', id);
      if (error) throw error;
      return { ok: true };
    }, () => {
      const pending = readJSON(STORAGE_KEYS.demoReviews, []);
      writeJSON(STORAGE_KEYS.demoReviews, pending.map((r) => (r.id === id ? { ...r, approved } : r)));
      const seeded = SEED_REVIEWS.find((r) => r.id === id);
      if (seeded) seeded.approved = approved;
      return { ok: true };
    });
  },

  async stats() {
    return withRemote(async (sb) => {
      const { data, error } = await sb.from('orders').select('*, order_items(*)')
        .order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return computeStats(data || [], await listProducts({ includeInactive: true }));
    }, () => computeStats(localOrders(), localProducts()));
  },
};

function computeStats(orders, products) {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const revenue = valid.reduce((n, o) => n + Number(o.total || 0), 0);
  const units = valid.reduce((n, o) => n + (o.items || o.order_items || []).reduce((m, it) => m + it.qty, 0), 0);
  const byDay = {};
  valid.forEach((o) => {
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + Number(o.total || 0);
  });
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, value: byDay[key] || 0 });
  }
  const byStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    .map((status) => ({ status, value: orders.filter((o) => o.status === status).length }));
  const sold = {};
  valid.forEach((o) => (o.items || o.order_items || []).forEach((it) => {
    const key = it.name_en || it.name_ar || it.product_id;
    sold[key] = (sold[key] || 0) + it.qty;
  }));
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, value]) => ({ name, value }));
  return {
    revenue, orders: orders.length, units,
    avg: valid.length ? revenue / valid.length : 0,
    days, byStatus, top,
    lowStock: products.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock).slice(0, 6),
    recent: orders.slice(0, 8),
  };
}
