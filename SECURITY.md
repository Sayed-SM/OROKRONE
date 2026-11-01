# Security notes

## Boundaries implemented

- The browser contains only the Supabase **anon** key (public by design). Never add a `service_role` key to `assets/`, HTML, source maps, or client configuration.
- RLS is enabled for every public table. Guest clients cannot directly insert orders, read other customers' orders, or access coupons. Public product/shipping reads and pending review submissions are constrained by policies.
- Order placement re-reads current product prices and stock inside a transaction, locks product rows, calculates coupon/shipping totals on the server, decrements inventory atomically, and only accepts COD.
- Tracking returns no customer name, email, phone, or street address. Database tracking codes use UUID v4 entropy (122 random bits); shorter local demo codes never leave localStorage.
- Admin role comes only from `profiles.role`; signup metadata cannot assign a role. Promote a trusted, already-registered user manually from the Supabase SQL editor.
- User input is bounded/validated; text inserted into markup is escaped. Password/session handling is delegated to Supabase Auth.
- `admin/login.html`'s demo credentials work only on `localhost` / `127.0.0.1`; they are removed from the production login page.
- `security-headers.conf` contains a starting CSP and browser security-header set. Set the final production origin and Supabase URL before deployment.

## Before going live

1. Run migrations in order (`001_schema.sql` … `004_seed.sql`) in the Supabase SQL editor and verify RLS with both an anon client and a non-admin authenticated user.
2. Create the real admin account through Supabase Auth, then set its profile role from the SQL editor:

   ```sql
   update public.profiles p set role = 'admin'
   from auth.users u where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL';
   ```

3. Deploy the Edge Functions. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Edge only), and `ALLOWED_ORIGINS` using Supabase secrets. Never commit those secrets.
4. Configure Auth redirect URLs, email confirmation, password rules, CAPTCHA/abuse controls, backups, and monitoring in Supabase.
5. Add durable edge/WAF rate limiting for order, coupon and review endpoints. The included Edge order limiter is in-memory and is only a supplementary safeguard, not a distributed limiter.
6. Replace all editorial sample photos and demo product claims with verified product photos, real stock, warranty terms, phone/email and shipping prices.
7. Have an independent security review and test restore/incident procedures. No web application can honestly promise “complete security.”

## Data / privacy

Order contact details are stored in `orders`, visible only to the owner and admins through RLS. Configure a retention policy and privacy notice appropriate to your business and local law before accepting live orders.
