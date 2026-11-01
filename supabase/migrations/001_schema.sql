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
