/**
 * OROKRONE — Runtime configuration.
 * The anon key is a PUBLIC key by design (Supabase RLS protects the data).
 * NEVER put the service_role key in any file under assets/.
 */
export const CONFIG = {
  SUPABASE_URL: 'https://libbbemuwtmgdtfztwaa.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYmJiZW11d3RtZ2R0Znp0d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDkzMTUsImV4cCI6MjEwOTAyNTMxNX0.5vQnDugnAhCUafHNhSCWugip9Si6QfBe0JqJABpIR20',

  STORE_NAME: 'OROKRONE',
  STORE_NAME_AR: 'أوروكرون',
  CURRENCY: 'EGP',
  LOCALE_AR: 'ar-EG',
  LOCALE_EN: 'en-EG',

  /* Local shipping only (Egypt). COD only. */
  COUNTRY: 'EG',
  PAYMENT_METHOD: 'cod',
  FREE_SHIPPING_OVER: 25000,
  DEFAULT_SHIPPING: 85,
  SUPPORT_PHONE: '01000000000',
  SUPPORT_EMAIL: 'care@orokrone.example',
  MAX_COMPARE: 4,
  MAX_QTY_PER_ITEM: 5,
  AUTPLAY_MS: 5200,
};

export const STORAGE_KEYS = {
  lang: 'orokrone.lang',
  cart: 'orokrone.cart.v1',
  wishlist: 'orokrone.wishlist.v1',
  compare: 'orokrone.compare.v1',
  coupon: 'orokrone.coupon.v1',
  demoOrders: 'orokrone.demo.orders.v1',
  demoReviews: 'orokrone.demo.reviews.v1',
  demoUser: 'orokrone.demo.user.v1',
  demoProducts: 'orokrone.demo.products.v1',
  demoShippingRates: 'orokrone.demo.shipping-rates.v1',
  demoStorefrontSettings: 'orokrone.demo.storefront-settings.v1',
};
