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
