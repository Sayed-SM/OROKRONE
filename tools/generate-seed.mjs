import { writeFile } from 'node:fs/promises';
import { SEED_PRODUCTS, SEED_REVIEWS, SEED_COUPONS, SHIPPING_RATES } from '../assets/js/lib/seed.js';
const q = (v) => v == null ? 'null' : `'${String(v).replaceAll("'", "''")}'`;
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const b = (v) => v ? 'true' : 'false';
const products = SEED_PRODUCTS.map(p => `(${[q(p.id),q(p.slug),q(p.sku),q(p.name_ar),q(p.name_en),q(p.brand),q(p.category),p.price,p.old_price ?? 'null',p.stock,b(p.featured),b(p.active),q(p.image_path || null),j(p.design),j(p.specs),q(p.description_ar),q(p.description_en),p.rating_avg,p.rating_count,q(p.created_at)].join(', ')})`).join(',\n');
const coupons = SEED_COUPONS.map(c => `(${[q(c.code),q(c.type),c.value,c.min_subtotal || 0,c.max_discount ?? 'null',q(c.expires_at || null),c.usage_limit ?? 'null',c.used_count || 0,b(c.active)].join(', ')})`).join(',\n');
const shipping = SHIPPING_RATES.map(r => `(${q(r.governorate)},${q(r.governorate_en)},${r.fee},${b(r.active)})`).join(',\n');
const reviews = SEED_REVIEWS.map(r => `(${[q(r.id),q(r.product_id),q(r.author),r.rating,q(r.title),q(r.body),b(r.approved),q(r.created_at)].join(', ')})`).join(',\n');
const sql = `-- Generated from assets/js/lib/seed.js. Run npm run seed:sql to refresh.
insert into public.products(id,slug,sku,name_ar,name_en,brand,category,price,old_price,stock,featured,active,image_path,design,specs,description_ar,description_en,rating_avg,rating_count,created_at)
values\n${products}
on conflict(id) do update set slug=excluded.slug,sku=excluded.sku,name_ar=excluded.name_ar,name_en=excluded.name_en,brand=excluded.brand,category=excluded.category,price=excluded.price,old_price=excluded.old_price,stock=excluded.stock,featured=excluded.featured,active=excluded.active,image_path=excluded.image_path,design=excluded.design,specs=excluded.specs,description_ar=excluded.description_ar,description_en=excluded.description_en,rating_avg=excluded.rating_avg,rating_count=excluded.rating_count;

insert into public.coupons(code,type,value,min_subtotal,max_discount,expires_at,usage_limit,used_count,active)
values\n${coupons}
on conflict(code) do nothing;

insert into public.shipping_rates(governorate,governorate_en,fee,active)
values\n${shipping}
on conflict(governorate) do update set governorate_en=excluded.governorate_en,fee=excluded.fee,active=excluded.active;

insert into public.reviews(id,product_id,author,rating,title,body,approved,created_at)
values\n${reviews}
on conflict(id) do nothing;
`;
await writeFile(new URL('../supabase/migrations/004_seed.sql', import.meta.url), sql, 'utf8');
console.log(`Seed created: ${SEED_PRODUCTS.length} products, ${SEED_COUPONS.length} coupons, ${SHIPPING_RATES.length} shipping zones, ${SEED_REVIEWS.length} reviews.`);
