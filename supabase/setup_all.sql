-- OROKRONE full setup. Paste this whole file into Supabase > SQL Editor and Run once.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS.
-- ===== supabase/migrations/001_schema.sql =====
-- OROKRONE schema. Run in Supabase SQL Editor; prices are EGP.
create extension if not exists pgcrypto;
create sequence if not exists public.order_no_seq;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', role text not null default 'customer' check (role in ('customer','admin')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
 id text primary key, slug text not null unique, sku text not null unique,
 name_ar text not null, name_en text not null, brand text not null,
 category text not null check (category in ('classic','sport','ladies','accessories')),
 price numeric(12,2) not null check (price >= 0), old_price numeric(12,2) check (old_price is null or old_price >= price),
 stock integer not null default 0 check (stock >= 0), featured boolean not null default false, active boolean not null default true,
 image_path text, design jsonb not null default '{}'::jsonb, specs jsonb not null default '{}'::jsonb,
 description_ar text not null default '', description_en text not null default '',
 rating_avg numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
 rating_count integer not null default 0 check (rating_count >= 0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.coupons (
 code text primary key check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,24}$'),
 type text not null check (type in ('percent','fixed')), value numeric(12,2) not null check (value > 0),
 min_subtotal numeric(12,2) not null default 0 check (min_subtotal >= 0),
 max_discount numeric(12,2) check (max_discount is null or max_discount >= 0), expires_at timestamptz,
 usage_limit integer check (usage_limit is null or usage_limit > 0), used_count integer not null default 0 check (used_count >= 0),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.shipping_rates (
 governorate text primary key, governorate_en text not null, fee numeric(10,2) not null check (fee >= 0), active boolean not null default true
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), order_no text not null unique, tracking_code text not null unique,
 user_id uuid references auth.users(id) on delete set null,
 name text not null check (char_length(name) between 3 and 90), phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
 email text not null default '' check (email = '' or char_length(email) <= 120), governorate text not null,
 city text not null check (char_length(city) between 1 and 90), address text not null check (char_length(address) between 1 and 400),
 notes text not null default '' check (char_length(notes) <= 500),
 subtotal numeric(12,2) not null check (subtotal >= 0), discount numeric(12,2) not null default 0 check (discount >= 0),
 shipping numeric(12,2) not null default 0 check (shipping >= 0), total numeric(12,2) not null check (total >= 0),
 coupon_code text references public.coupons(code) on delete set null,
 payment_method text not null default 'cod' check (payment_method = 'cod'),
 status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 product_id text references public.products(id) on delete set null, name_ar text not null, name_en text not null, sku text not null,
 unit_price numeric(12,2) not null check (unit_price >= 0), qty integer not null check (qty between 1 and 5),
 line_total numeric(12,2) generated always as (unit_price * qty) stored
);
create table if not exists public.reviews (
 id text primary key default gen_random_uuid()::text, product_id text not null references public.products(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null, author text not null check (char_length(author) between 3 and 60),
 rating smallint not null check (rating between 1 and 5), title text not null check (char_length(title) between 2 and 90),
 body text not null check (char_length(body) between 3 and 1200), approved boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists products_active_category_idx on public.products(active,category);
create index if not exists products_featured_idx on public.products(featured desc,created_at desc) where active;
create index if not exists orders_user_created_idx on public.orders(user_id,created_at desc);
create index if not exists orders_status_created_idx on public.orders(status,created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists reviews_product_approved_idx on public.reviews(product_id,approved,created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- All new accounts start as customer; never accept a role from client metadata.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'customer') on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();


-- ===== supabase/migrations/002_rls.sql =====
-- OROKRONE Row Level Security. Policies, not client code, are the security boundary.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists profile_read_own on public.profiles;
create policy profile_read_own on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());
drop policy if exists profile_update_own on public.profiles;
create policy profile_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'customer');
drop policy if exists profile_admin_all on public.profiles;
create policy profile_admin_all on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (active or public.is_admin());
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists shipping_public_read on public.shipping_rates;
create policy shipping_public_read on public.shipping_rates for select to anon, authenticated using (active or public.is_admin());
drop policy if exists shipping_admin_all on public.shipping_rates;
create policy shipping_admin_all on public.shipping_rates for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists orders_read_owner_admin on public.orders;
create policy orders_read_owner_admin on public.orders for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- No direct guest insert/update/delete. Use validated place_order RPC only.

drop policy if exists order_items_read_owner_admin on public.order_items;
create policy order_items_read_owner_admin on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_admin())));
drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists reviews_public_read_approved on public.reviews;
create policy reviews_public_read_approved on public.reviews for select to anon, authenticated using (approved or public.is_admin());
drop policy if exists reviews_public_insert_pending on public.reviews;
create policy reviews_public_insert_pending on public.reviews for insert to anon, authenticated
with check (approved = false and (user_id is null or user_id = (select auth.uid())));
drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.products, public.shipping_rates, public.reviews to anon, authenticated;
grant insert on public.reviews to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.orders, public.order_items to authenticated;
grant insert, update, delete on public.products, public.coupons, public.shipping_rates, public.reviews, public.profiles, public.order_items to authenticated;
-- Table privileges do not bypass RLS. Anon has no order table access.


-- ===== supabase/migrations/003_functions.sql =====
-- OROKRONE server-authoritative business logic. Never trust browser prices or stock.

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.coupons%rowtype;
begin
 if p_code is null or length(p_code) > 24 or p_subtotal is null or p_subtotal < 0 then
   return jsonb_build_object('valid',false,'reason','invalid');
 end if;
 select * into c from public.coupons where code = upper(p_code) and active;
 if not found then return jsonb_build_object('valid',false,'reason','invalid'); end if;
 if c.expires_at is not null and c.expires_at <= now() then return jsonb_build_object('valid',false,'reason','expired'); end if;
 if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('valid',false,'reason','limit'); end if;
 if p_subtotal < c.min_subtotal then return jsonb_build_object('valid',false,'reason','min'); end if;
 return jsonb_build_object('valid',true,'coupon',jsonb_build_object(
   'code',c.code,'type',c.type,'value',c.value,'min_subtotal',c.min_subtotal,
   'max_discount',c.max_discount,'expires_at',c.expires_at,'usage_limit',c.usage_limit,'used_count',c.used_count));
end;
$$;
revoke all on function public.validate_coupon(text,numeric) from public;
grant execute on function public.validate_coupon(text,numeric) to anon, authenticated;

create or replace function public.place_order(p_payload jsonb, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 v_customer jsonb; v_items jsonb; v_item jsonb; v_product public.products%rowtype; v_coupon public.coupons%rowtype;
 v_order_id uuid; v_order_no text; v_tracking text; v_name text; v_phone text; v_email text;
 v_governorate text; v_city text; v_address text; v_notes text; v_coupon_code text; v_qty integer;
 v_subtotal numeric(12,2) := 0; v_discount numeric(12,2) := 0; v_shipping numeric(12,2) := 85; v_total numeric(12,2);
begin
 if p_payload is null or pg_column_size(p_payload) > 16000 then raise exception 'invalid_payload'; end if;
 v_customer := p_payload->'customer'; v_items := p_payload->'items';
 if jsonb_typeof(v_customer) <> 'object' or jsonb_typeof(v_items) <> 'array' then raise exception 'invalid_payload'; end if;
 if jsonb_array_length(v_items) < 1 or jsonb_array_length(v_items) > 20 then raise exception 'invalid_items'; end if;
 v_name := left(btrim(coalesce(v_customer->>'name','')),90);
 v_phone := regexp_replace(coalesce(v_customer->>'phone',''),'[ -]','','g');
 v_email := left(btrim(coalesce(v_customer->>'email','')),120);
 v_governorate := left(btrim(coalesce(v_customer->>'governorate','')),60);
 v_city := left(btrim(coalesce(v_customer->>'city','')),90);
 v_address := left(btrim(coalesce(v_customer->>'address','')),400);
 v_notes := left(btrim(coalesce(v_customer->>'notes','')),500);
 if length(v_name) < 3 or v_phone !~ '^01[0125][0-9]{8}$' or length(v_governorate) < 2 or length(v_city) < 1 or length(v_address) < 3 then
   raise exception 'invalid_customer';
 end if;
 if v_email <> '' and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then raise exception 'invalid_email'; end if;

 -- First lock all products and compute authoritative subtotal, preventing oversell.
 for v_item in select value from jsonb_array_elements(v_items) loop
   if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'id','') = '' or coalesce(v_item->>'qty','') !~ '^[1-5]$' then
     raise exception 'invalid_item';
   end if;
   v_qty := (v_item->>'qty')::integer;
   select * into v_product from public.products where id = v_item->>'id' and active = true for update;
   if not found then raise exception 'product_unavailable'; end if;
   if v_product.stock < v_qty then raise exception 'out_of_stock'; end if;
   v_subtotal := v_subtotal + v_product.price * v_qty;
 end loop;

 v_coupon_code := nullif(upper(left(btrim(coalesce(p_payload->>'coupon_code','')),24)),'');
 if v_coupon_code is not null then
   select * into v_coupon from public.coupons where code = v_coupon_code and active for update;
   if not found or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
      or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
      or v_subtotal < v_coupon.min_subtotal then raise exception 'invalid_coupon'; end if;
   if v_coupon.type = 'percent' then v_discount := round(v_subtotal * v_coupon.value / 100,2); else v_discount := v_coupon.value; end if;
   if v_coupon.max_discount is not null then v_discount := least(v_discount,v_coupon.max_discount); end if;
   v_discount := least(v_discount,v_subtotal);
 end if;
 select fee into v_shipping from public.shipping_rates where governorate = v_governorate and active;
 if not found then v_shipping := 85; end if;
 if v_subtotal - v_discount >= 25000 then v_shipping := 0; end if;
 v_total := greatest(0,v_subtotal - v_discount + v_shipping);
 v_order_no := 'ORK-' || to_char(now() at time zone 'UTC','YYYYMMDD') || '-' || lpad(nextval('public.order_no_seq')::text,5,'0');
 v_tracking := 'ORK-' || upper(replace(gen_random_uuid()::text,'-',''));

 insert into public.orders(order_no,tracking_code,user_id,name,phone,email,governorate,city,address,notes,subtotal,discount,shipping,total,coupon_code,payment_method,status)
 values(v_order_no,v_tracking,p_user_id,v_name,v_phone,v_email,v_governorate,v_city,v_address,v_notes,v_subtotal,v_discount,v_shipping,v_total,v_coupon_code,'cod','pending')
 returning id into v_order_id;

 for v_item in select value from jsonb_array_elements(v_items) loop
   v_qty := (v_item->>'qty')::integer;
   select * into v_product from public.products where id = v_item->>'id' and active = true for update;
   update public.products set stock = stock - v_qty where id = v_product.id;
   insert into public.order_items(order_id,product_id,name_ar,name_en,sku,unit_price,qty)
   values(v_order_id,v_product.id,v_product.name_ar,v_product.name_en,v_product.sku,v_product.price,v_qty);
 end loop;
 if v_coupon_code is not null then update public.coupons set used_count = used_count + 1 where code = v_coupon_code; end if;
 return jsonb_build_object('order_no',v_order_no,'tracking_code',v_tracking,'total',v_total);
end;
$$;
revoke all on function public.place_order(jsonb,uuid) from public;
grant execute on function public.place_order(jsonb,uuid) to service_role;

create or replace function public.track_order(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype; v_items jsonb;
begin
 if p_code is null or length(p_code) > 24 then return null; end if;
 select * into v_order from public.orders where tracking_code = upper(btrim(p_code));
 if not found then return null; end if;
 select coalesce(jsonb_agg(jsonb_build_object('name_ar',oi.name_ar,'name_en',oi.name_en,'qty',oi.qty,'price',oi.unit_price)),'[]'::jsonb)
 into v_items from public.order_items oi where oi.order_id = v_order.id;
 return jsonb_build_object('order_no',v_order.order_no,'status',v_order.status,'created_at',v_order.created_at,'total',v_order.total,'governorate',v_order.governorate,'items',v_items);
end;
$$;
revoke all on function public.track_order(text) from public;
grant execute on function public.track_order(text) to anon, authenticated;

create or replace function public.adjust_stock(p_id text,p_delta integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_stock integer;
begin
 if not public.is_admin() then raise exception 'admin_required'; end if;
 if p_delta is null or abs(p_delta) > 100000 then raise exception 'invalid_delta'; end if;
 update public.products set stock = greatest(0,stock + p_delta) where id = p_id returning stock into v_stock;
 if not found then raise exception 'product_not_found'; end if;
 return v_stock;
end;
$$;
revoke all on function public.adjust_stock(text,integer) from public;
grant execute on function public.adjust_stock(text,integer) to authenticated;

create or replace function public.admin_stats(p_days integer default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb; v_days integer := greatest(1,least(coalesce(p_days,30),365));
begin
 if not public.is_admin() then raise exception 'admin_required'; end if;
 select jsonb_build_object(
   'orders',count(*),'revenue',coalesce(sum(total) filter(where status <> 'cancelled'),0),
   'units',coalesce((select sum(oi.qty) from public.order_items oi join public.orders o on o.id=oi.order_id where o.created_at >= now() - make_interval(days => v_days) and o.status <> 'cancelled'),0)
 ) into result from public.orders where created_at >= now() - make_interval(days => v_days);
 return result;
end;
$$;
revoke all on function public.admin_stats(integer) from public;
grant execute on function public.admin_stats(integer) to authenticated;


-- ===== supabase/migrations/004_seed.sql =====
-- Generated from assets/js/lib/seed.js. Run npm run seed:sql to refresh.
insert into public.products(id,slug,sku,name_ar,name_en,brand,category,price,old_price,stock,featured,active,image_path,design,specs,description_ar,description_en,rating_avg,rating_count,created_at)
values
('p-heritage-champagne', 'heritage-38-champagne', 'ORK-H38-GLD', 'هيريتاج 38 شامبين', 'Heritage 38 Champagne', 'Heritage', 'classic', 42500, 49000, 6, true, true, null, '{"case":"gold","dial":"champagne","strap":"leather-brown","style":"dress"}'::jsonb, '{"case_size":"38 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير مضاد للانعكاس","glass_en":"Anti-reflective sapphire","water":"50 m","strap_ar":"جلد تمساح بني","strap_en":"Brown alligator leather"}'::jsonb, 'علبة ذهبية مصقولة بقطر 38 مم، ميناء شامبين بنقشة أشعة الشمس، وعقارب ورقية رفيعة. قطعة كلاسيكية هادئة تليق بالبدلة الرسمية وبالمناسبات.', 'A polished 38 mm gold case, a champagne sunray dial and slim leaf hands. A quiet classic made for tailoring and evenings.', 4.8, 26, '2026-08-02T10:00:00Z'),
('p-royale-twotone-white', 'royale-two-tone-41-white', 'ORK-R41-TTW', 'رويال تو-تون 41 أبيض', 'Royale Two-Tone 41 White', 'Royale', 'classic', 58000, null, 4, true, true, null, '{"case":"twotone","dial":"white","strap":"twotone","style":"dress"}'::jsonb, '{"case_size":"41 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير","glass_en":"Sapphire","water":"100 m","strap_ar":"جوبيلي فولاذ وذهب","strap_en":"Steel & gold jubilee"}'::jsonb, 'إطار ذهبي مخدّد وميناء أبيض ناصع مع مؤشرات ذهبية مطبّقة، وسوار جوبيلي ثنائي اللون يجمع الفولاذ والذهب في تناغم فاخر.', 'A fluted gold bezel over a crisp white dial with applied gold markers, on a two-tone jubilee bracelet in steel and gold.', 4.9, 18, '2026-08-20T10:00:00Z'),
('p-vitesse-chrono-steel', 'vitesse-chronograph-steel', 'ORK-VCH-STL', 'فيتيس كرونوغراف فولاذ', 'Vitesse Chronograph Steel', 'Vitesse', 'sport', 36750, null, 9, true, true, null, '{"case":"steel","dial":"black","strap":"bracelet","style":"chrono"}'::jsonb, '{"case_size":"42 mm","movement_ar":"كرونوغراف كوارتز","movement_en":"Quartz chronograph","glass_ar":"زفير","glass_en":"Sapphire","water":"100 m","strap_ar":"فولاذ 316L","strap_en":"316L steel"}'::jsonb, 'كرونوغراف رياضي بميناء أسود مطفي وثلاث عدادات غائرة، علبة فولاذية بصقل متباين وسوار أويستر متين.', 'A sporting chronograph with a matte black dial and three recessed counters, a brushed-and-polished steel case and a solid oyster bracelet.', 4.7, 31, '2026-07-11T10:00:00Z'),
('p-heritage-navy-rose', 'heritage-40-rose-navy', 'ORK-H40-RSN', 'هيريتاج 40 روز كحلي', 'Heritage 40 Rose Navy', 'Heritage', 'classic', 47200, null, 5, false, true, null, '{"case":"rose","dial":"navy","strap":"leather-blue","style":"dress"}'::jsonb, '{"case_size":"40 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير مضاد للانعكاس","glass_en":"Anti-reflective sapphire","water":"50 m","strap_ar":"جلد عجل كحلي","strap_en":"Navy calfskin"}'::jsonb, 'ذهب وردي دافئ يحيط بميناء كحلي عميق يتغيّر لونه مع الضوء، مع سوار جلد عجل كحلي مخيط يدوياً.', 'Warm rose gold around a deep navy dial that shifts with the light, on a hand-stitched navy calfskin strap.', 4.6, 12, '2026-09-01T10:00:00Z'),
('p-abyss-diver-300', 'abyss-300m-diver', 'ORK-AB3-BLK', 'أبيس غواص 300 متر', 'Abyss 300 m Diver', 'Abyss', 'sport', 52900, 59900, 3, true, true, null, '{"case":"steel","dial":"black","strap":"bracelet","style":"diver"}'::jsonb, '{"case_size":"43 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير مقاوم للخدش","glass_en":"Scratch-resistant sapphire","water":"300 m","strap_ar":"فولاذ مع وصلة غوص","strap_en":"Steel with dive extension"}'::jsonb, 'غواصة احترافية بإطار سيراميك دوّار أحادي الاتجاه، مؤشرات مضيئة قوية، ومقاومة ماء حتى 300 متر.', 'A professional diver with a unidirectional ceramic bezel, powerful luminous markers and 300 m water resistance.', 4.9, 22, '2026-08-29T10:00:00Z'),
('p-atlas-minimal-mesh', 'atlas-minimal-36-mesh', 'ORK-AT3-MSH', 'أطلس مينيمال 36 شبكي', 'Atlas Minimal 36 Mesh', 'Atlas', 'classic', 21400, null, 12, false, true, null, '{"case":"steel","dial":"white","strap":"mesh","style":"minimal"}'::jsonb, '{"case_size":"36 mm","movement_ar":"كوارتز ياباني","movement_en":"Japanese quartz","glass_ar":"مينيرال مقوّى","glass_en":"Hardened mineral","water":"30 m","strap_ar":"ميلانيز شبكي","strap_en":"Milanese mesh"}'::jsonb, 'تصميم اسكندنافي نظيف بعلبة نحيفة 7.2 مم وميناء عاجي هادئ، على سوار ميلانيز شبكي مريح.', 'A clean Scandinavian design with a 7.2 mm slim case and a calm ivory dial, on a comfortable milanese mesh.', 4.5, 40, '2026-06-18T10:00:00Z'),
('p-royale-chrono-gold', 'royale-chrono-cream-gold', 'ORK-RCH-GLD', 'رويال كرونو كريمي ذهبي', 'Royale Chrono Cream Gold', 'Royale', 'sport', 63000, 71000, 2, true, true, null, '{"case":"gold","dial":"cream","strap":"leather-black","style":"chrono"}'::jsonb, '{"case_size":"41 mm","movement_ar":"كرونوغراف أوتوماتيك","movement_en":"Automatic chronograph","glass_ar":"زفير","glass_en":"Sapphire","water":"50 m","strap_ar":"جلد تمساح أسود","strap_en":"Black alligator leather"}'::jsonb, 'كرونوغراف بعلبة ذهبية وميناء كريمي لاكيه وثلاث عدادات عاجية، على جلد تمساح أسود فاخر.', 'A gold-cased chronograph with a cream lacquered dial and three ivory counters, on black alligator leather.', 4.8, 9, '2026-09-15T10:00:00Z'),
('p-royale-twotone-black', 'royale-two-tone-41-black', 'ORK-R41-TTB', 'رويال تو-تون 41 أسود', 'Royale Two-Tone 41 Black', 'Royale', 'classic', 61500, null, 4, false, true, null, '{"case":"twotone","dial":"black","strap":"twotone","style":"dress"}'::jsonb, '{"case_size":"41 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير","glass_en":"Sapphire","water":"100 m","strap_ar":"برزيدنت فولاذ وذهب","strap_en":"Steel & gold president"}'::jsonb, 'ميناء أسود بلمعان أشعة الشمس مع مؤشرات ذهبية، وإطار مخدّد وسوار برزيدنت ثنائي اللون.', 'A black sunray dial with gold markers, a fluted bezel and a two-tone president bracelet.', 4.7, 14, '2026-07-30T10:00:00Z'),
('p-atlas-pilot-nato', 'atlas-pilot-field-42', 'ORK-AP4-NAT', 'أطلس بايلوت فيلد 42', 'Atlas Pilot Field 42', 'Atlas', 'sport', 24900, null, 8, false, true, null, '{"case":"black","dial":"black","strap":"nato","style":"pilot"}'::jsonb, '{"case_size":"42 mm","movement_ar":"أوتوماتيك","movement_en":"Automatic","glass_ar":"زفير","glass_en":"Sapphire","water":"100 m","strap_ar":"ناتو قماش زيتوني","strap_en":"Olive canvas NATO"}'::jsonb, 'ساعة طيار بعلبة سوداء مطفية وأرقام مضيئة كبيرة وتاج عريض، على سوار ناتو قماشي بلون زيتوني.', 'A pilot watch with a matte black case, large luminous numerals and an oversized crown, on an olive canvas NATO.', 4.4, 17, '2026-09-08T10:00:00Z'),
('p-luna-pearl-rose', 'luna-pearl-rose-30', 'ORK-LN3-PRL', 'لونا بيرل روز 30', 'Luna Pearl Rose 30', 'Luna', 'ladies', 39800, null, 7, true, true, null, '{"case":"rose","dial":"pearl","strap":"rose-bracelet","style":"ladies"}'::jsonb, '{"case_size":"30 mm","movement_ar":"كوارتز سويسري","movement_en":"Swiss quartz","glass_ar":"زفير","glass_en":"Sapphire","water":"30 m","strap_ar":"سوار روز جولد","strap_en":"Rose gold bracelet"}'::jsonb, 'علبة روز جولد نحيفة بقطر 30 مم حول ميناء من عرق اللؤلؤ الطبيعي ومؤشرات مرصّعة، بسوار ذهبي وردي رقيق.', 'A slim 30 mm rose gold case around natural mother of pearl with set markers, on a delicate rose gold bracelet.', 5, 11, '2026-09-20T10:00:00Z'),
('p-atelier-roll', 'atelier-leather-watch-roll', 'ORK-ACC-ROL', 'أتيليه رول جلد للساعات', 'Atelier Leather Watch Roll', 'Atelier', 'accessories', 3450, 4200, 15, false, true, null, '{"accessory":"roll"}'::jsonb, '{"case_size":"3 قطع","movement_ar":"—","movement_en":"—","glass_ar":"—","glass_en":"—","water":"—","strap_ar":"جلد طبيعي مدبوغ","strap_en":"Full-grain leather"}'::jsonb, 'رول جلد طبيعي بلون الكونياك ببطانة سويد، يتسع لثلاث ساعات مع وسائد قابلة للفصل وإكسسوار نحاسي.', 'A cognac full-grain leather roll with suede lining, holding three watches on removable cushions with brass hardware.', 4.8, 33, '2026-06-01T10:00:00Z'),
('p-atelier-straps', 'atelier-strap-set', 'ORK-ACC-STR', 'أطقم أساور أتيليه الجلدية', 'Atelier Leather Strap Set', 'Atelier', 'accessories', 1850, null, 20, false, true, null, '{"accessory":"straps"}'::jsonb, '{"case_size":"20/22 mm","movement_ar":"—","movement_en":"—","glass_ar":"—","glass_en":"—","water":"—","strap_ar":"جلد طبيعي","strap_en":"Genuine leather"}'::jsonb, 'ثلاثة أساور جلد طبيعي — أسود وبني داكن وعنابي — بمقاس 20/22 مم مع قضبان تحرير سريع.', 'Three genuine leather straps — black, dark brown and burgundy — in 20/22 mm with quick-release spring bars.', 4.6, 21, '2026-06-05T10:00:00Z'),
('p-atelier-winder', 'atelier-automatic-winder', 'ORK-ACC-WND', 'أتيليه لفّاف أوتوماتيك', 'Atelier Automatic Winder', 'Atelier', 'accessories', 7900, null, 6, false, true, null, '{"accessory":"winder"}'::jsonb, '{"case_size":"ساعة واحدة","movement_ar":"4 برامج","movement_en":"4 programs","glass_ar":"واجهة زجاجية","glass_en":"Glass front","water":"—","strap_ar":"خشب وجلد سويد","strap_en":"Wood & suede"}'::jsonb, 'لفّاف ساعات أوتوماتيك بخشب أسود مطفي وإطار ذهبي مصقول، محرك صامت بأربعة برامج دوران.', 'An automatic watch winder in matte black wood with brushed gold trim, a silent motor and four rotation programs.', 4.7, 8, '2026-07-02T10:00:00Z')
on conflict(id) do update set slug=excluded.slug,sku=excluded.sku,name_ar=excluded.name_ar,name_en=excluded.name_en,brand=excluded.brand,category=excluded.category,price=excluded.price,old_price=excluded.old_price,stock=excluded.stock,featured=excluded.featured,active=excluded.active,image_path=excluded.image_path,design=excluded.design,specs=excluded.specs,description_ar=excluded.description_ar,description_en=excluded.description_en,rating_avg=excluded.rating_avg,rating_count=excluded.rating_count;

insert into public.coupons(code,type,value,min_subtotal,max_discount,expires_at,usage_limit,used_count,active)
values
('WELCOME10', 'percent', 10, 5000, 5000, null, null, 0, true),
('LUXE500', 'fixed', 500, 10000, null, null, 500, 0, true),
('VIP15', 'percent', 15, 50000, 15000, null, 100, 0, true)
on conflict(code) do nothing;

insert into public.shipping_rates(governorate,governorate_en,fee,active)
values
('القاهرة','Cairo',60,true),
('الجيزة','Giza',60,true),
('القليوبية','Qalyubia',65,true),
('الإسكندرية','Alexandria',75,true),
('البحيرة','Beheira',85,true),
('مطروح','Matrouh',120,true),
('دمياط','Damietta',85,true),
('الدقهلية','Dakahlia',80,true),
('كفر الشيخ','Kafr El Sheikh',90,true),
('الغربية','Gharbia',80,true),
('المنوفية','Monufia',85,true),
('الشرقية','Sharqia',80,true),
('بورسعيد','Port Said',85,true),
('الإسماعيلية','Ismailia',85,true),
('السويس','Suez',85,true),
('شمال سيناء','North Sinai',140,true),
('جنوب سيناء','South Sinai',140,true),
('الفيوم','Fayoum',90,true),
('بني سويف','Beni Suef',95,true),
('المنيا','Minya',100,true),
('أسيوط','Assiut',105,true),
('سوهاج','Sohag',110,true),
('قنا','Qena',115,true),
('الأقصر','Luxor',120,true),
('أسوان','Aswan',125,true),
('البحر الأحمر','Red Sea',130,true),
('الوادي الجديد','New Valley',140,true)
on conflict(governorate) do update set governorate_en=excluded.governorate_en,fee=excluded.fee,active=excluded.active;

insert into public.reviews(id,product_id,author,rating,title,body,approved,created_at)
values
('r1', 'p-heritage-champagne', 'أحمد سامي', 5, 'أنيقة أكثر من الصور', 'التشطيب ممتاز والميناء الشامبين بيتغيّر مع النور. التوصيل للقاهرة خلال يومين والدفع عند الاستلام مريح جداً.', true, '2026-09-22T10:00:00Z'),
('r2', 'p-heritage-champagne', 'Mona K.', 5, 'هدية مثالية', 'اشتريتها هدية لوالدي، التغليف فاخر والساعة أصلية بضمان. تجربة شراء راقية.', true, '2026-09-28T10:00:00Z'),
('r3', 'p-royale-twotone-white', 'كريم فؤاد', 5, 'حضور قوي على المعصم', 'السوار الجوبيلي مريح جداً والإطار المخدّد بيلمع بشكل راقي. تستاهل سعرها.', true, '2026-10-01T10:00:00Z'),
('r4', 'p-vitesse-chrono-steel', 'Omar T.', 4, 'كرونوغراف عملي', 'العدادات دقيقة والسوار ثقيل بإحساس جودة. كنت أفضّل مقاومة ماء أعلى لكن ممتازة للاستخدام اليومي.', true, '2026-09-12T10:00:00Z'),
('r5', 'p-abyss-diver-300', 'يوسف عادل', 5, 'غواصة حقيقية', 'جربتها في الغردقة، الإضاءة ممتازة والإطار السيراميك ثابت. أفضل شراء هذه السنة.', true, '2026-10-04T10:00:00Z'),
('r6', 'p-luna-pearl-rose', 'Sarah M.', 5, 'رقيقة جداً', 'عرق اللؤلؤ طبيعي وفعلاً كل قطعة ليها لون مختلف شوية. مقاس 30 مم مثالي.', true, '2026-10-08T10:00:00Z'),
('r7', 'p-atelier-roll', 'حسن مصطفى', 5, 'جودة الجلد ممتازة', 'الخياطة نظيفة والبطانة سويد ناعمة، بحافظ فيها على ساعاتي أثناء السفر.', true, '2026-08-19T10:00:00Z')
on conflict(id) do nothing;

