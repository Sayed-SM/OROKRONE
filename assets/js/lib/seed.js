/**
 * Seed catalogue — mirrors supabase/migrations/004_seed.sql exactly.
 * Used as the offline/demo data source and as the local-mode admin dataset.
 * `design` drives the procedural SVG watch renderer (no bitmap assets).
 */
export const SEED_PRODUCTS = [
  {
    id: 'p-heritage-champagne', slug: 'heritage-38-champagne', sku: 'ORK-H38-GLD',
    name_ar: 'هيريتاج 38 شامبين', name_en: 'Heritage 38 Champagne',
    brand: 'Heritage', category: 'classic', price: 42500, old_price: 49000, stock: 6,
    featured: true, active: true, rating_avg: 4.8, rating_count: 26, created_at: '2026-08-02T10:00:00Z',
    description_ar: 'علبة ذهبية مصقولة بقطر 38 مم، ميناء شامبين بنقشة أشعة الشمس، وعقارب ورقية رفيعة. قطعة كلاسيكية هادئة تليق بالبدلة الرسمية وبالمناسبات.',
    description_en: 'A polished 38 mm gold case, a champagne sunray dial and slim leaf hands. A quiet classic made for tailoring and evenings.',
    design: { case: 'gold', dial: 'champagne', strap: 'leather-brown', style: 'dress' },
    specs: { case_size: '38 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير مضاد للانعكاس', glass_en: 'Anti-reflective sapphire', water: '50 m', strap_ar: 'جلد تمساح بني', strap_en: 'Brown alligator leather' },
  },
  {
    id: 'p-royale-twotone-white', slug: 'royale-two-tone-41-white', sku: 'ORK-R41-TTW',
    name_ar: 'رويال تو-تون 41 أبيض', name_en: 'Royale Two-Tone 41 White',
    brand: 'Royale', category: 'classic', price: 58000, old_price: null, stock: 4,
    featured: true, active: true, rating_avg: 4.9, rating_count: 18, created_at: '2026-08-20T10:00:00Z',
    description_ar: 'إطار ذهبي مخدّد وميناء أبيض ناصع مع مؤشرات ذهبية مطبّقة، وسوار جوبيلي ثنائي اللون يجمع الفولاذ والذهب في تناغم فاخر.',
    description_en: 'A fluted gold bezel over a crisp white dial with applied gold markers, on a two-tone jubilee bracelet in steel and gold.',
    design: { case: 'twotone', dial: 'white', strap: 'twotone', style: 'dress' },
    specs: { case_size: '41 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير', glass_en: 'Sapphire', water: '100 m', strap_ar: 'جوبيلي فولاذ وذهب', strap_en: 'Steel & gold jubilee' },
  },
  {
    id: 'p-vitesse-chrono-steel', slug: 'vitesse-chronograph-steel', sku: 'ORK-VCH-STL',
    name_ar: 'فيتيس كرونوغراف فولاذ', name_en: 'Vitesse Chronograph Steel',
    brand: 'Vitesse', category: 'sport', price: 36750, old_price: null, stock: 9,
    featured: true, active: true, rating_avg: 4.7, rating_count: 31, created_at: '2026-07-11T10:00:00Z',
    description_ar: 'كرونوغراف رياضي بميناء أسود مطفي وثلاث عدادات غائرة، علبة فولاذية بصقل متباين وسوار أويستر متين.',
    description_en: 'A sporting chronograph with a matte black dial and three recessed counters, a brushed-and-polished steel case and a solid oyster bracelet.',
    design: { case: 'steel', dial: 'black', strap: 'bracelet', style: 'chrono' },
    specs: { case_size: '42 mm', movement_ar: 'كرونوغراف كوارتز', movement_en: 'Quartz chronograph', glass_ar: 'زفير', glass_en: 'Sapphire', water: '100 m', strap_ar: 'فولاذ 316L', strap_en: '316L steel' },
  },
  {
    id: 'p-heritage-navy-rose', slug: 'heritage-40-rose-navy', sku: 'ORK-H40-RSN',
    name_ar: 'هيريتاج 40 روز كحلي', name_en: 'Heritage 40 Rose Navy',
    brand: 'Heritage', category: 'classic', price: 47200, old_price: null, stock: 5,
    featured: false, active: true, rating_avg: 4.6, rating_count: 12, created_at: '2026-09-01T10:00:00Z',
    description_ar: 'ذهب وردي دافئ يحيط بميناء كحلي عميق يتغيّر لونه مع الضوء، مع سوار جلد عجل كحلي مخيط يدوياً.',
    description_en: 'Warm rose gold around a deep navy dial that shifts with the light, on a hand-stitched navy calfskin strap.',
    design: { case: 'rose', dial: 'navy', strap: 'leather-blue', style: 'dress' },
    specs: { case_size: '40 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير مضاد للانعكاس', glass_en: 'Anti-reflective sapphire', water: '50 m', strap_ar: 'جلد عجل كحلي', strap_en: 'Navy calfskin' },
  },
  {
    id: 'p-abyss-diver-300', slug: 'abyss-300m-diver', sku: 'ORK-AB3-BLK',
    name_ar: 'أبيس غواص 300 متر', name_en: 'Abyss 300 m Diver',
    brand: 'Abyss', category: 'sport', price: 52900, old_price: 59900, stock: 3,
    featured: true, active: true, rating_avg: 4.9, rating_count: 22, created_at: '2026-08-29T10:00:00Z',
    description_ar: 'غواصة احترافية بإطار سيراميك دوّار أحادي الاتجاه، مؤشرات مضيئة قوية، ومقاومة ماء حتى 300 متر.',
    description_en: 'A professional diver with a unidirectional ceramic bezel, powerful luminous markers and 300 m water resistance.',
    design: { case: 'steel', dial: 'black', strap: 'bracelet', style: 'diver' },
    specs: { case_size: '43 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير مقاوم للخدش', glass_en: 'Scratch-resistant sapphire', water: '300 m', strap_ar: 'فولاذ مع وصلة غوص', strap_en: 'Steel with dive extension' },
  },
  {
    id: 'p-atlas-minimal-mesh', slug: 'atlas-minimal-36-mesh', sku: 'ORK-AT3-MSH',
    name_ar: 'أطلس مينيمال 36 شبكي', name_en: 'Atlas Minimal 36 Mesh',
    brand: 'Atlas', category: 'classic', price: 21400, old_price: null, stock: 12,
    featured: false, active: true, rating_avg: 4.5, rating_count: 40, created_at: '2026-06-18T10:00:00Z',
    description_ar: 'تصميم اسكندنافي نظيف بعلبة نحيفة 7.2 مم وميناء عاجي هادئ، على سوار ميلانيز شبكي مريح.',
    description_en: 'A clean Scandinavian design with a 7.2 mm slim case and a calm ivory dial, on a comfortable milanese mesh.',
    design: { case: 'steel', dial: 'white', strap: 'mesh', style: 'minimal' },
    specs: { case_size: '36 mm', movement_ar: 'كوارتز ياباني', movement_en: 'Japanese quartz', glass_ar: 'مينيرال مقوّى', glass_en: 'Hardened mineral', water: '30 m', strap_ar: 'ميلانيز شبكي', strap_en: 'Milanese mesh' },
  },
  {
    id: 'p-royale-chrono-gold', slug: 'royale-chrono-cream-gold', sku: 'ORK-RCH-GLD',
    name_ar: 'رويال كرونو كريمي ذهبي', name_en: 'Royale Chrono Cream Gold',
    brand: 'Royale', category: 'sport', price: 63000, old_price: 71000, stock: 2,
    featured: true, active: true, rating_avg: 4.8, rating_count: 9, created_at: '2026-09-15T10:00:00Z',
    description_ar: 'كرونوغراف بعلبة ذهبية وميناء كريمي لاكيه وثلاث عدادات عاجية، على جلد تمساح أسود فاخر.',
    description_en: 'A gold-cased chronograph with a cream lacquered dial and three ivory counters, on black alligator leather.',
    design: { case: 'gold', dial: 'cream', strap: 'leather-black', style: 'chrono' },
    specs: { case_size: '41 mm', movement_ar: 'كرونوغراف أوتوماتيك', movement_en: 'Automatic chronograph', glass_ar: 'زفير', glass_en: 'Sapphire', water: '50 m', strap_ar: 'جلد تمساح أسود', strap_en: 'Black alligator leather' },
  },
  {
    id: 'p-royale-twotone-black', slug: 'royale-two-tone-41-black', sku: 'ORK-R41-TTB',
    name_ar: 'رويال تو-تون 41 أسود', name_en: 'Royale Two-Tone 41 Black',
    brand: 'Royale', category: 'classic', price: 61500, old_price: null, stock: 4,
    featured: false, active: true, rating_avg: 4.7, rating_count: 14, created_at: '2026-07-30T10:00:00Z',
    description_ar: 'ميناء أسود بلمعان أشعة الشمس مع مؤشرات ذهبية، وإطار مخدّد وسوار برزيدنت ثنائي اللون.',
    description_en: 'A black sunray dial with gold markers, a fluted bezel and a two-tone president bracelet.',
    design: { case: 'twotone', dial: 'black', strap: 'twotone', style: 'dress' },
    specs: { case_size: '41 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير', glass_en: 'Sapphire', water: '100 m', strap_ar: 'برزيدنت فولاذ وذهب', strap_en: 'Steel & gold president' },
  },
  {
    id: 'p-atlas-pilot-nato', slug: 'atlas-pilot-field-42', sku: 'ORK-AP4-NAT',
    name_ar: 'أطلس بايلوت فيلد 42', name_en: 'Atlas Pilot Field 42',
    brand: 'Atlas', category: 'sport', price: 24900, old_price: null, stock: 8,
    featured: false, active: true, rating_avg: 4.4, rating_count: 17, created_at: '2026-09-08T10:00:00Z',
    description_ar: 'ساعة طيار بعلبة سوداء مطفية وأرقام مضيئة كبيرة وتاج عريض، على سوار ناتو قماشي بلون زيتوني.',
    description_en: 'A pilot watch with a matte black case, large luminous numerals and an oversized crown, on an olive canvas NATO.',
    design: { case: 'black', dial: 'black', strap: 'nato', style: 'pilot' },
    specs: { case_size: '42 mm', movement_ar: 'أوتوماتيك', movement_en: 'Automatic', glass_ar: 'زفير', glass_en: 'Sapphire', water: '100 m', strap_ar: 'ناتو قماش زيتوني', strap_en: 'Olive canvas NATO' },
  },
  {
    id: 'p-luna-pearl-rose', slug: 'luna-pearl-rose-30', sku: 'ORK-LN3-PRL',
    name_ar: 'لونا بيرل روز 30', name_en: 'Luna Pearl Rose 30',
    brand: 'Luna', category: 'ladies', price: 39800, old_price: null, stock: 7,
    featured: true, active: true, rating_avg: 5, rating_count: 11, created_at: '2026-09-20T10:00:00Z',
    description_ar: 'علبة روز جولد نحيفة بقطر 30 مم حول ميناء من عرق اللؤلؤ الطبيعي ومؤشرات مرصّعة، بسوار ذهبي وردي رقيق.',
    description_en: 'A slim 30 mm rose gold case around natural mother of pearl with set markers, on a delicate rose gold bracelet.',
    design: { case: 'rose', dial: 'pearl', strap: 'rose-bracelet', style: 'ladies' },
    specs: { case_size: '30 mm', movement_ar: 'كوارتز سويسري', movement_en: 'Swiss quartz', glass_ar: 'زفير', glass_en: 'Sapphire', water: '30 m', strap_ar: 'سوار روز جولد', strap_en: 'Rose gold bracelet' },
  },
  {
    id: 'p-atelier-roll', slug: 'atelier-leather-watch-roll', sku: 'ORK-ACC-ROL',
    name_ar: 'أتيليه رول جلد للساعات', name_en: 'Atelier Leather Watch Roll',
    brand: 'Atelier', category: 'accessories', price: 3450, old_price: 4200, stock: 15,
    featured: false, active: true, rating_avg: 4.8, rating_count: 33, created_at: '2026-06-01T10:00:00Z',
    description_ar: 'رول جلد طبيعي بلون الكونياك ببطانة سويد، يتسع لثلاث ساعات مع وسائد قابلة للفصل وإكسسوار نحاسي.',
    description_en: 'A cognac full-grain leather roll with suede lining, holding three watches on removable cushions with brass hardware.',
    design: { accessory: 'roll' },
    specs: { case_size: '3 قطع', movement_ar: '—', movement_en: '—', glass_ar: '—', glass_en: '—', water: '—', strap_ar: 'جلد طبيعي مدبوغ', strap_en: 'Full-grain leather' },
  },
  {
    id: 'p-atelier-straps', slug: 'atelier-strap-set', sku: 'ORK-ACC-STR',
    name_ar: 'أطقم أساور أتيليه الجلدية', name_en: 'Atelier Leather Strap Set',
    brand: 'Atelier', category: 'accessories', price: 1850, old_price: null, stock: 20,
    featured: false, active: true, rating_avg: 4.6, rating_count: 21, created_at: '2026-06-05T10:00:00Z',
    description_ar: 'ثلاثة أساور جلد طبيعي — أسود وبني داكن وعنابي — بمقاس 20/22 مم مع قضبان تحرير سريع.',
    description_en: 'Three genuine leather straps — black, dark brown and burgundy — in 20/22 mm with quick-release spring bars.',
    design: { accessory: 'straps' },
    specs: { case_size: '20/22 mm', movement_ar: '—', movement_en: '—', glass_ar: '—', glass_en: '—', water: '—', strap_ar: 'جلد طبيعي', strap_en: 'Genuine leather' },
  },
  {
    id: 'p-atelier-winder', slug: 'atelier-automatic-winder', sku: 'ORK-ACC-WND',
    name_ar: 'أتيليه لفّاف أوتوماتيك', name_en: 'Atelier Automatic Winder',
    brand: 'Atelier', category: 'accessories', price: 7900, old_price: null, stock: 6,
    featured: false, active: true, rating_avg: 4.7, rating_count: 8, created_at: '2026-07-02T10:00:00Z',
    description_ar: 'لفّاف ساعات أوتوماتيك بخشب أسود مطفي وإطار ذهبي مصقول، محرك صامت بأربعة برامج دوران.',
    description_en: 'An automatic watch winder in matte black wood with brushed gold trim, a silent motor and four rotation programs.',
    design: { accessory: 'winder' },
    specs: { case_size: 'ساعة واحدة', movement_ar: '4 برامج', movement_en: '4 programs', glass_ar: 'واجهة زجاجية', glass_en: 'Glass front', water: '—', strap_ar: 'خشب وجلد سويد', strap_en: 'Wood & suede' },
  },
];

export const SEED_REVIEWS = [
  { id: 'r1', product_id: 'p-heritage-champagne', author: 'أحمد سامي', rating: 5, title: 'أنيقة أكثر من الصور', body: 'التشطيب ممتاز والميناء الشامبين بيتغيّر مع النور. التوصيل للقاهرة خلال يومين والدفع عند الاستلام مريح جداً.', approved: true, created_at: '2026-09-22T10:00:00Z' },
  { id: 'r2', product_id: 'p-heritage-champagne', author: 'Mona K.', rating: 5, title: 'هدية مثالية', body: 'اشتريتها هدية لوالدي، التغليف فاخر والساعة أصلية بضمان. تجربة شراء راقية.', approved: true, created_at: '2026-09-28T10:00:00Z' },
  { id: 'r3', product_id: 'p-royale-twotone-white', author: 'كريم فؤاد', rating: 5, title: 'حضور قوي على المعصم', body: 'السوار الجوبيلي مريح جداً والإطار المخدّد بيلمع بشكل راقي. تستاهل سعرها.', approved: true, created_at: '2026-10-01T10:00:00Z' },
  { id: 'r4', product_id: 'p-vitesse-chrono-steel', author: 'Omar T.', rating: 4, title: 'كرونوغراف عملي', body: 'العدادات دقيقة والسوار ثقيل بإحساس جودة. كنت أفضّل مقاومة ماء أعلى لكن ممتازة للاستخدام اليومي.', approved: true, created_at: '2026-09-12T10:00:00Z' },
  { id: 'r5', product_id: 'p-abyss-diver-300', author: 'يوسف عادل', rating: 5, title: 'غواصة حقيقية', body: 'جربتها في الغردقة، الإضاءة ممتازة والإطار السيراميك ثابت. أفضل شراء هذه السنة.', approved: true, created_at: '2026-10-04T10:00:00Z' },
  { id: 'r6', product_id: 'p-luna-pearl-rose', author: 'Sarah M.', rating: 5, title: 'رقيقة جداً', body: 'عرق اللؤلؤ طبيعي وفعلاً كل قطعة ليها لون مختلف شوية. مقاس 30 مم مثالي.', approved: true, created_at: '2026-10-08T10:00:00Z' },
  { id: 'r7', product_id: 'p-atelier-roll', author: 'حسن مصطفى', rating: 5, title: 'جودة الجلد ممتازة', body: 'الخياطة نظيفة والبطانة سويد ناعمة، بحافظ فيها على ساعاتي أثناء السفر.', approved: true, created_at: '2026-08-19T10:00:00Z' },
];

export const SEED_COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, min_subtotal: 5000, max_discount: 5000, expires_at: null, usage_limit: null, used_count: 0, active: true },
  { code: 'LUXE500', type: 'fixed', value: 500, min_subtotal: 10000, max_discount: null, expires_at: null, usage_limit: 500, used_count: 0, active: true },
  { code: 'VIP15', type: 'percent', value: 15, min_subtotal: 50000, max_discount: 15000, expires_at: null, usage_limit: 100, used_count: 0, active: true },
];

/** Editorial photography assigned to each piece (local files, monochrome-treated). */
export const PRODUCT_IMAGES = {
  'p-heritage-champagne': 'w4.jpg',
  'p-royale-twotone-white': 'w7.jpg',
  'p-vitesse-chrono-steel': 'w2.jpg',
  'p-heritage-navy-rose': 'w5.jpg',
  'p-abyss-diver-300': 'w10.jpg',
  'p-atlas-minimal-mesh': 'w9.jpg',
  'p-royale-chrono-gold': 'w8.jpg',
  'p-royale-twotone-black': 'w3.jpg',
  'p-atlas-pilot-nato': 'w6.jpg',
  'p-luna-pearl-rose': 'w1.jpg',
};

export const EDITORIAL_IMAGES = { craft: 'w6.jpg', salon: 'craft.jpg', sport: 'w7.jpg' };

/** Local shipping only — Egyptian governorates. */
export const SHIPPING_RATES = [
  ['القاهرة', 'Cairo', 60], ['الجيزة', 'Giza', 60], ['القليوبية', 'Qalyubia', 65],
  ['الإسكندرية', 'Alexandria', 75], ['البحيرة', 'Beheira', 85], ['مطروح', 'Matrouh', 120],
  ['دمياط', 'Damietta', 85], ['الدقهلية', 'Dakahlia', 80], ['كفر الشيخ', 'Kafr El Sheikh', 90],
  ['الغربية', 'Gharbia', 80], ['المنوفية', 'Monufia', 85], ['الشرقية', 'Sharqia', 80],
  ['بورسعيد', 'Port Said', 85], ['الإسماعيلية', 'Ismailia', 85], ['السويس', 'Suez', 85],
  ['شمال سيناء', 'North Sinai', 140], ['جنوب سيناء', 'South Sinai', 140],
  ['الفيوم', 'Fayoum', 90], ['بني سويف', 'Beni Suef', 95], ['المنيا', 'Minya', 100],
  ['أسيوط', 'Assiut', 105], ['سوهاج', 'Sohag', 110], ['قنا', 'Qena', 115],
  ['الأقصر', 'Luxor', 120], ['أسوان', 'Aswan', 125], ['البحر الأحمر', 'Red Sea', 130],
  ['الوادي الجديد', 'New Valley', 140],
].map(([ar, en, fee]) => ({ governorate: ar, governorate_en: en, fee, active: true }));
