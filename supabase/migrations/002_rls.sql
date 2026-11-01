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
