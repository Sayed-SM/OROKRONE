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
