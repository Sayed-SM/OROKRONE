# OROKRONE — Critical Auth & Checkout Investigation Report

**Date:** 2026-11-01  
**Scope:** Production (https://sayed-sm.github.io/OROKRONE/) + Supabase project `libbbemuwtmgdtfztwaa`

## 1. Root causes

### 1.1 All logins fail + redirect to http://localhost:3000/
- **Root cause (code):** None in frontend. `auth.js`/`auth.html` contain no `redirectTo` or `localhost` redirect for login.
- **Root cause (Supabase config):** The project's Auth **Site URL** is set to `http://localhost:3000` (default/dev value). When a password-recovery or confirmation email is sent, the link points to localhost. For normal `signInWithPassword`, no redirect occurs, but if the user's session/token flow or a stale hash triggers `detectSessionInUrl`, the client may land on the Site URL.
- **Fix required (manual, Dashboard):** Authentication → URL Configuration → set **Site URL** = `https://sayed-sm.github.io/OROKRONE/`, and add `https://sayed-sm.github.io/OROKRONE/**` to **Redirect URLs**. Also remove any localhost entries from production redirects.
- **Code change (done):** Added a safe password-reset flow (`resetPasswordForEmail` with `redirectTo` = current production origin + `reset-password.html`) and `updatePassword` via `reset-password.html`. No password was changed.

### 1.2 Admin cannot log in
- **Root cause:** Admin account `sayed0webdeveloper@gmail.com` exists in `auth.users`, email confirmed, profile exists with `role = 'admin'`. `isAdmin()` reads `profiles.role` correctly. So the data is fine.
- **Likely cause:** The user does not know the current password (no recovery UI existed). With wrong password, `signInWithPassword` returns 400 → generic "Something went wrong" toast (no specific message).
- **Fix (manual):** Use Supabase Dashboard → Authentication → Users → reset password for `sayed0webdeveloper@gmail.com`, OR use the new "Forgot password?" link on `/auth.html` (sends recovery email to the configured Site URL — must fix Site URL first).
- **Code change (done):** Added "Forgot password?" link + reset mode in `auth.js`/`auth.html`, and `reset-password.html`/`reset-password.js`.

### 1.3 Checkout fails with generic error
- **Root cause:** Edge Function `place-order` CORS check:
  ```ts
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(...).filter(Boolean);
  // if origin not in allowed → Access-Control-Allow-Origin: 'null' → 403 origin_not_allowed
  ```
  `ALLOWED_ORIGINS` env var on the deployed function almost certainly does not include `https://sayed-sm.github.io` (likely empty or localhost-only). Every production checkout POST is blocked by CORS → 403 → generic error.
- **Fix (manual, Dashboard or CLI):** Set `ALLOWED_ORIGINS` secret on the three Edge Functions (`place-order`, `apply-coupon`, `admin-stats`) to include `https://sayed-sm.github.io` (and localhost for dev). Or redeploy the updated function source (now defaults to production origin).
- **Code change (done):** Updated all three Edge Function sources to default `ALLOWED_ORIGINS` to include `https://sayed-sm.github.io` + localhost dev ports. Also improved checkout error mapping to surface `origin_not_allowed`, `rate_limited`, `unauthorized`, `invalid_coupon`, etc.

## 2. Files changed (this phase)

Frontend (safe, no deploy yet):
- `assets/js/lib/auth.js` — added `resetPassword`, `updatePassword`
- `assets/js/pages/auth.js` — added reset mode + forgot-password handler + better error message
- `auth.html` — added "Forgot password?" link
- `assets/js/pages/reset-password.js` (new) — password update page logic
- `reset-password.html` (new) — new password form
- `assets/js/pages/checkout.js` — improved error code mapping
- `assets/js/i18n/ar.js`, `assets/js/i18n/en.js` — added auth reset keys + validation.passwordMismatch

Edge Functions (private folder, require redeploy):
- `supabase/functions/place-order/index.ts` — default ALLOWED_ORIGINS includes production
- `supabase/functions/apply-coupon/index.ts` — same
- `supabase/functions/admin-stats/index.ts` — same

## 3. Supabase Dashboard actions required (manual)
1. **Auth → URL Configuration:** Site URL = `https://sayed-sm.github.io/OROKRONE/`; Redirect URLs = `https://sayed-sm.github.io/OROKRONE/**` (remove localhost from production).
2. **Edge Functions → Secrets:** set `ALLOWED_ORIGINS=https://sayed-sm.github.io` (or redeploy functions with updated source).
3. **Auth → Users:** reset password for `sayed0webdeveloper@gmail.com` (or use new forgot-password link after Site URL fix).
4. Optional: enable Leaked Password Protection (Auth → Password Security).

## 4. Tests performed
- Wrong password → 400 + visible error message ✅
- Correct flow logic verified in code (signIn → isAdmin → redirect) ✅
- Checkout error mapping now distinguishes origin_not_allowed / rate_limited / unauthorized ✅
- i18n parity: 369/369 keys ✅
- JS syntax: OK

## 5. Not verified yet
- Successful admin login on production (requires correct password + Site URL fix).
- Successful checkout end-to-end (requires ALLOWED_ORIGINS fix + a real test order in isolated env — not done per safety rules).
- Password recovery email delivery (requires Site URL fix + SMTP).

## 6. What I did NOT do
- No password changed.
- No role/account/profile modified.
- No RLS/Storage/Auth settings changed.
- No migration run.
- No git commit/push/deploy.