# OROKRONE · أوروكرون

متجر ساعات وإكسسوارات فاخر، واجهة HTML/CSS/JavaScript بلا build step، مع متجر عربي RTL/إنجليزي LTR، صور ساعات بالأبيض والأسود، منصة عرض متعددة المستويات، انتقال Spring، مخزون وسلة ومفضلة ومقارنة وتقييمات وكوبونات، COD، تتبع محلي، ولوحة إدارة.

## التشغيل والمعاينة

يتطلب Node.js فقط (على Windows PowerShell يمكن تشغيله مباشرة):

```sh
node serve.mjs 4173
```

افتح `http://localhost:4173`. يعمل المتجر فوراً بكتالوج تجريبي و`localStorage` حتى لو لم تُجهّز قاعدة البيانات بعد. بيانات الدخول التجريبية على `localhost` فقط:

- `admin@orokrone.demo`
- `admin1234`

هذه البيانات محلية للتجربة وليست حساباً على Supabase، ولن تعمل على نطاق منشور.

## Supabase

المشروع موصل بعنوان Supabase ومفتاح **anon/public** الذي زوّدني به المستخدم في `assets/js/lib/config.js`. المفتاح العام ليس سراً؛ لا تضع `service_role` هناك مطلقاً. نتيجة المعاينة الحالية تؤكد أن مشروع Supabase لا يحتوي جدول `products` بعد، لذلك يظهر تحذير الاتصال ويستمر الموقع بالبيانات التجريبية المحلية.

لتفعيل البيانات الحقيقية، شغّل بالترتيب في **Supabase → SQL Editor**:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_seed.sql`

ثم أنشئ حساب المدير عبر `auth.html`، وبعدها رقِّ الحساب يدوياً من SQL Editor (استبدل البريد):

```sql
update public.profiles p set role = 'admin'
from auth.users u where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL';
```

انشر وظائف `place-order`, `apply-coupon`, `admin-stats`. الأسرار المطلوبة موضحة في `SECURITY.md`; خزّن `SUPABASE_SERVICE_ROLE_KEY` كـ Supabase Edge secret فقط. طبّق `security-headers.conf` على الاستضافة بعد مراجعة النطاقات النهائية. إتمام الطلب الحقيقي يتطلب نشر `place-order`؛ لا يوجد fallback يكتب الطلبات الإنتاجية محلياً أو يستدعي RPC عاماً.

لتحديث ملف seed من الكتالوج التجريبي: `npm run seed:sql` (أو `npm.cmd run seed:sql` في PowerShell). الاختبارات: `npm.cmd test`.

## الصفحات

- المتجر: `index.html`, `shop.html`, `product.html`
- الشراء: `cart.html`, `wishlist.html`, `compare.html`, `checkout.html`, `order-success.html`
- الحساب: `auth.html`, `account.html`, `track.html`
- الإدارة: `admin/login.html`, `admin/index.html`, `admin/products.html`, `admin/inventory.html`, `admin/orders.html`, `admin/coupons.html`, `admin/reviews.html`

## التصميم والأدوات

- الواجهة Monochrome: أبيض/أسود ورمادي، Typography عربية/لاتينية، اتجاه ديناميكي RTL/LTR.
- الحركة: Spring physics في منصة العرض، autoplay قابل للإيقاف، hover/lift، reveal عند الظهور، دوران شعار، tilt خفيف للبطاقات، تقدم التمرير، احترام `prefers-reduced-motion`.
- الرسوم البيانية SVG مصغّرة لتقليل الاعتماديات؛ CSS/JS/HTML عادي.
- مهارات `frontend-design`, `ui-ux-pro-max`, `design-system`, `ui-styling` طُبقت أثناء التنفيذ. لم يتصل 21st.dev MCP أو dataviz أو security/code review أو مجموعة `preview_*` في بيئة الجلسة؛ استُخدمت أيقونات SVG بأسلوب Lucide، ورسوم SVG داخلية، ومراجعة يدوية، وأدوات المتصفح المتاحة بدلاً منها. هذا بديل موثق وليس ادعاء استخدام 21st.dev.

## قبل الإطلاق التجاري

المنتجات والأسعار والمراجعات صور **تجريبية**، وصور Unsplash استرشادية وليست صورة مؤكدة لرقم SKU نفسه. استبدلها بصورك المصرّح بها، وأدخل المخزون والضمان والأسعار الفعلية، وحدّث الهاتف والبريد والشحن. راجع `ASSET_SOURCES.md` و`SECURITY.md`.
