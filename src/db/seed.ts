import bcrypt from 'bcryptjs';
import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  ambassadorApplications,
  auditLogs,
  baskets,
  blogPosts,
  disputes,
  loyaltyTransactions,
  notifications,
  orderItems,
  orders,
  producerProfiles,
  products,
  reviews,
  spgBadges,
  spgVisitReports,
  users,
} from './schema.ts';
import { GENERATED_IMAGES } from '../lib/algeria.ts';
import { blockchainService } from '../services/blockchain.ts';
import {
  calculateAtharPoints,
  calculateSustainabilityScore,
} from '../services/sustainability.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = runSeedIfNeeded().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

async function runSeedIfNeeded(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (Number(total) > 0) return;

  console.log('Seeding Athar (أثر) PostgreSQL database...');

  const [adminHash, producerHash, ambassadorHash, consumerHash] = await Promise.all([
    bcrypt.hash('Admin123!', 10),
    bcrypt.hash('Producer123!', 10),
    bcrypt.hash('Ambassador123!', 10),
    bcrypt.hash('Consumer123!', 10),
  ]);

  // 1. Seed Users
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: 'admin@athar.dz',
        passwordHash: adminHash,
        name: 'كريم بن علي · Karim Benali',
        phone: '+213 550 10 20 30',
        role: 'ADMIN',
        locale: 'ar',
        wilaya: '16 - Alger',
        address: 'Rue Didouche Mourad, Alger Centre',
      },
      {
        email: 'producer1@athar.dz',
        passwordHash: producerHash,
        name: 'الحاج يوسف المتيجي · Youcef Mitidji',
        phone: '+213 551 22 33 44',
        role: 'PRODUCER',
        locale: 'ar',
        wilaya: '09 - Blida',
        address: 'Domaine Ouled Yaïch, Route de Chréa, Blida',
      },
      {
        email: 'producer2@athar.dz',
        passwordHash: producerHash,
        name: 'ليلى آيت قاسي · Leila Ait Kaci',
        phone: '+213 552 44 55 66',
        role: 'PRODUCER',
        locale: 'fr',
        wilaya: '16 - Alger',
        address: 'Coopérative Dar Zaytoune, Birkhadem, Alger',
      },
      {
        email: 'ambassador@athar.dz',
        passwordHash: ambassadorHash,
        name: 'مريم بودياف · Meriem Boudiaf',
        phone: '+213 553 66 77 88',
        role: 'AMBASSADOR',
        locale: 'ar',
        wilaya: '09 - Blida',
        address: 'Cité El Wouroud, Blida',
      },
      {
        email: 'ambassador2@athar.dz',
        passwordHash: ambassadorHash,
        name: 'أمين زرقاني · Amine Zergani',
        phone: '+213 554 77 88 99',
        role: 'AMBASSADOR',
        locale: 'fr',
        wilaya: '15 - Tizi Ouzou',
        address: 'Nouvelle Ville, Tizi Ouzou',
      },
      {
        email: 'consumer1@athar.dz',
        passwordHash: consumerHash,
        name: 'سارة منصوري · Sara Mansouri',
        phone: '+213 555 11 22 33',
        role: 'CONSUMER',
        locale: 'ar',
        wilaya: '16 - Alger',
        address: 'Hydra, Chemin Sidi Yahia, Alger',
      },
      {
        email: 'consumer2@athar.dz',
        passwordHash: consumerHash,
        name: 'نبيل حمادي · Nabil Hamadi',
        phone: '+213 556 99 88 77',
        role: 'CONSUMER',
        locale: 'fr',
        wilaya: '31 - Oran',
        address: 'Canastel, Oran',
      },
    ])
    .returning();

  const byEmail = new Map(insertedUsers.map((u) => [u.email, u]));
  const admin = byEmail.get('admin@athar.dz')!;
  const prodUser1 = byEmail.get('producer1@athar.dz')!;
  const prodUser2 = byEmail.get('producer2@athar.dz')!;
  const amb1 = byEmail.get('ambassador@athar.dz')!;
  const amb2 = byEmail.get('ambassador2@athar.dz')!;
  const cons1 = byEmail.get('consumer1@athar.dz')!;
  const cons2 = byEmail.get('consumer2@athar.dz')!;

  // 2. Seed Producer Profiles
  const [farm1, farm2] = await db
    .insert(producerProfiles)
    .values([
      {
        userId: prodUser1.id,
        farmName: 'مزرعة بساتين المتيجة البيئية',
        farmNameFr: 'Ferme Écologique Vergers de la Mitidja',
        storyAr:
          'مزرعة عائلية منذ 1984 على سفوح جبال الشريعة بالبليدة. نعتمد الزراعة المتجددة، الري بالتقطير المقتصد للمياه، وتربية النحل البري دون أي مبيدات كيميائية.',
        storyFr:
          'Ferme familiale depuis 1984 sur les contreforts de Chréa à Blida. Nous pratiquons l’agriculture régénérative, l’irrigation goutte-à-goutte et l’apiculture de montagne sans pesticides de synthèse.',
        wilaya: '09 - Blida',
        address: 'Route de Chréa, Ouled Yaïch, Blida',
        practices: [
          'Zéro pesticide de synthèse',
          'Irrigation goutte-à-goutte solaire',
          'Compostage naturel & rotation des cultures',
          'Semences paysannes locales',
        ],
        photos: [GENERATED_IMAGES.heroFarm, GENERATED_IMAGES.spgVisit],
        verificationStatus: 'APPROVED',
      },
      {
        userId: prodUser2.id,
        farmName: 'دار الزيتون وتعاونية الأطلس',
        farmNameFr: 'Dar Zaytoune & Coopérative de l’Atlas',
        storyAr:
          'تعاونية نسوية تجمع بين زيت الزيتون المعصور على البارد من بساتين القبائل والتوابل العضوية وتمور دقلة نور المعتمدة من بسكرة، مع تتبع كامل لكل دفعة.',
        storyFr:
          'Coopérative féminine réunissant l’huile d’olive vierge extra pressée à froid de Kabylie, les épices biologiques et les dattes Deglet Nour traçables de Biskra.',
        wilaya: '16 - Alger',
        address: 'Atelier Birkhadem, Alger & Moulin Kabylie',
        practices: [
          'Extraction à froid < 24°C',
          'Flacons en verre consigné & recyclable',
          'Commerce équitable avec 18 familles paysannes',
          'Séchage solaire traditionnel des herbes',
        ],
        photos: [GENERATED_IMAGES.oliveOil, GENERATED_IMAGES.spicesDates],
        verificationStatus: 'APPROVED',
      },
    ])
    .returning();

  // 3. Seed SPG Visit Reports
  const now = new Date();
  const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 3600 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600 * 1000);

  const [report1, report2] = await db
    .insert(spgVisitReports)
    .values([
      {
        ambassadorId: amb1.id,
        producerId: farm1.id,
        scheduledAt: tenDaysAgo,
        submittedAt: tenDaysAgo,
        checklist: {
          noSyntheticPesticides: true,
          waterConservation: true,
          soilRegeneration: true,
          fairLabor: true,
          traceableHarvest: true,
          ecoPackaging: true,
        },
        score: 96,
        recommendation: 'GRANT',
        notes:
          'زيارة ميدانية شاملة لمزرعة المتيجة: التربة غنية بالسماد العضوي، نظام الري بالتقطير يعمل بالطاقة الشمسية، وخلايا النحل بعيدة عن أي طرق ملوثة.',
        photos: [
          {
            url: GENERATED_IMAGES.spgVisit,
            lat: 36.4722,
            lng: 2.8277,
            capturedAt: tenDaysAgo.toISOString(),
            caption: 'Inspection des vergers d’agrumes — Ouled Yaïch, Blida',
          },
          {
            url: GENERATED_IMAGES.heroFarm,
            lat: 36.4731,
            lng: 2.829,
            capturedAt: tenDaysAgo.toISOString(),
            caption: 'Parcelles maraîchères en irrigation goutte-à-goutte',
          },
        ],
        gpsLat: 36.4722,
        gpsLng: 2.8277,
        status: 'APPROVED',
        adminComment: 'تقرير مطابق لمعايير أثر SPG. تم منح الشارة لمدة 6 أشهر.',
        producerResponse: 'شكراً لفريق سفراء أثر على الزيارة الشفافة والتوجيهات القيمة.',
      },
      {
        ambassadorId: amb2.id,
        producerId: farm2.id,
        scheduledAt: threeDaysAgo,
        submittedAt: threeDaysAgo,
        checklist: {
          noSyntheticPesticides: true,
          waterConservation: true,
          soilRegeneration: true,
          fairLabor: true,
          traceableHarvest: true,
          ecoPackaging: true,
        },
        score: 93,
        recommendation: 'GRANT',
        notes:
          'التدقيق الميداني لمعصرة دار الزيتون: العصر على البارد موثق بدرجة حرارة 22°م، والزجاجات القابلة لإعادة الاستخدام معقمة ومختومة برقم الدفعة.',
        photos: [
          {
            url: GENERATED_IMAGES.oliveOil,
            lat: 36.7169,
            lng: 4.0497,
            capturedAt: threeDaysAgo.toISOString(),
            caption: 'Contrôle pression à froid & mise en bouteille — Dar Zaytoune',
          },
        ],
        gpsLat: 36.7169,
        gpsLng: 4.0497,
        status: 'APPROVED',
        adminComment: 'تمت المصادقة ومنح شارة الثقة SPG لتعاونية دار الزيتون.',
      },
      {
        ambassadorId: amb1.id,
        producerId: farm2.id,
        scheduledAt: new Date(now.getTime() - 24 * 3600 * 1000),
        submittedAt: new Date(now.getTime() - 12 * 3600 * 1000),
        checklist: {
          noSyntheticPesticides: true,
          waterConservation: true,
          soilRegeneration: true,
          fairLabor: true,
          traceableHarvest: true,
          ecoPackaging: false,
        },
        score: 88,
        recommendation: 'RENEW',
        notes:
          'تقرير تجديد دوري لوحدة تجفيف الأعشاب الجبلية: الجودة ممتازة، نوصي باستبدال الأكياس الورقية الحالية بورق كرافت معتمد بالكامل.',
        photos: [
          {
            url: GENERATED_IMAGES.spicesDates,
            lat: 36.7538,
            lng: 3.0588,
            capturedAt: new Date().toISOString(),
            caption: 'Vérification séchage solaire des épices & thym',
          },
        ],
        gpsLat: 36.7538,
        gpsLng: 3.0588,
        status: 'SUBMITTED',
      },
    ])
    .returning();

  // 4. Seed SPG Badges
  await db.insert(spgBadges).values([
    {
      producerId: farm1.id,
      status: 'ACTIVE',
      grantedByReportId: report1.id,
      validUntil: sixMonthsLater,
    },
    {
      producerId: farm2.id,
      status: 'ACTIVE',
      grantedByReportId: report2.id,
      validUntil: sixMonthsLater,
    },
  ]);

  // 5. Seed 12 Verified Green Products
  const rawProducts = [
    {
      producerId: farm2.id,
      nameAr: 'زيت زيتون قبائلي بكر ممتاز معصور على البارد',
      nameFr: "Huile d'olive Kabyle vierge extra pressée à froid",
      descriptionAr:
        'زيت زيتون عضوي من أشجار جبلية معمرة، قطف يدوي مبكر وعصر على البارد تحت 24 درجة مئوية. حموضة أقل من 0.3%.',
      descriptionFr:
        'Huile d’olive issue d’oliveraies de montagne, récolte précoce manuelle et extraction à froid < 24°C. Acidité < 0.3%.',
      category: 'olive_oil',
      priceDzd: 2400,
      unit: '750 ml',
      stock: 48,
      season: 'AUTUMN',
      images: [GENERATED_IMAGES.oliveOil],
      organicClaim: true,
      waterSavedPerUnit: 45,
      co2SavedPerUnit: 2.6,
      localKm: 42,
      packaging: 'zero_waste_returnable',
      harvestDate: '2026-11-02',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'عسل أزهار البرتقال الجبلي — البليدة',
      nameFr: "Miel brut de fleurs d'oranger de Blida",
      descriptionAr:
        'عسل خام غير مسخن من بساتين الحمضيات الطبيعية بالمتيجة، غني بالأنزيمات الطبيعية وعبير زهر الليمون.',
      descriptionFr:
        'Miel cru non chauffé récolté dans les vergers d’agrumes bio de la Mitidja, riche en enzymes naturelles.',
      category: 'honey',
      priceDzd: 3200,
      unit: '500 g',
      stock: 34,
      season: 'SPRING',
      images: [GENERATED_IMAGES.honey],
      organicClaim: true,
      waterSavedPerUnit: 38,
      co2SavedPerUnit: 2.1,
      localKm: 35,
      packaging: 'recyclable_glass',
      harvestDate: '2026-05-18',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'سلة خضار المتيجة الموسمية الطازجة',
      nameFr: 'Panier de légumes saisonniers bio de la Mitidja',
      descriptionAr:
        'تشكيلة أسبوعية تزن 5 كغ من الطماطم البلدية، الكوسة، التين، النعناع البري وحمضيات البليدة المقطوفة صباح يوم التوصيل.',
      descriptionFr:
        'Assortiment hebdomadaire de 5 kg : tomates anciennes, courgettes, figues, menthe sauvage et agrumes récoltés à l’aube.',
      category: 'vegetables',
      priceDzd: 1850,
      unit: '5 kg',
      stock: 25,
      season: 'AUTUMN',
      images: [GENERATED_IMAGES.produceBasket],
      organicClaim: true,
      waterSavedPerUnit: 52,
      co2SavedPerUnit: 3.1,
      localKm: 28,
      packaging: 'woven_basket',
      harvestDate: '2026-11-19',
      verified: true,
    },
    {
      producerId: farm2.id,
      nameAr: 'تمور دقلة نور عضوية بالعرجون — بسكرة',
      nameFr: 'Dattes Deglet Nour bio branchées de Biskra',
      descriptionAr:
        'تمور دقلة نور ذهبية شفافة من واحات طولقة ببسكرة، مروية بطريقة تقليدية مستدامة وخالية تماماً من الجلوكوز المضاف.',
      descriptionFr:
        'Dattes Deglet Nour ambrées de Tolga (Biskra), cultivées en oasis durable sans aucun traitement chimique ni sirop.',
      category: 'dates',
      priceDzd: 1450,
      unit: '1 kg',
      stock: 60,
      season: 'AUTUMN',
      images: [GENERATED_IMAGES.spicesDates],
      organicClaim: true,
      waterSavedPerUnit: 34,
      co2SavedPerUnit: 1.9,
      localKm: 240,
      packaging: 'compostable_kraft',
      harvestDate: '2026-10-25',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'عسل السدر الجبلي النقي — الأطلس البليدي',
      nameFr: 'Miel pur de jujubier (Sidr) — Atlas Blidéen',
      descriptionAr:
        'عسل سدر نادر من مرتفعات الأطلس، مفحوص مخبرياً ومضمون المصدر عبر جواز المنتج الرقمي.',
      descriptionFr:
        'Miel de Sidr rare des hauteurs de l’Atlas, analysé en laboratoire et entièrement traçable via Passeport Produit.',
      category: 'honey',
      priceDzd: 6800,
      unit: '500 g',
      stock: 14,
      season: 'ALL',
      images: [GENERATED_IMAGES.honey],
      organicClaim: true,
      waterSavedPerUnit: 42,
      co2SavedPerUnit: 2.5,
      localKm: 40,
      packaging: 'recyclable_glass',
      harvestDate: '2026-09-12',
      verified: true,
    },
    {
      producerId: farm2.id,
      nameAr: 'راس الحانوت عضوي مطحون على الحجر',
      nameFr: 'Ras El Hanout artisanal bio moulu sur pierre',
      descriptionAr:
        'مزيج تقليدي من 14 نوعاً من التوابل الطبيعية المجففة تحت الشمس بدون ملونات أو مواد حافظة.',
      descriptionFr:
        'Mélange traditionnel de 14 épices séchées au soleil et moulues sur pierre, sans colorants ni conservateurs.',
      category: 'spices',
      priceDzd: 780,
      unit: '200 g',
      stock: 72,
      season: 'ALL',
      images: [GENERATED_IMAGES.spicesDates],
      organicClaim: true,
      waterSavedPerUnit: 22,
      co2SavedPerUnit: 1.5,
      localKm: 30,
      packaging: 'recyclable_glass',
      harvestDate: '2026-10-08',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'طماطم بلدية عضوية من بذور أصيلة',
      nameFr: 'Tomates anciennes bio de semences paysannes',
      descriptionAr:
        'طماطم ناضجة تحت شمس المتيجة من بذور فلاحية غير مهجنة، ذات نكهة غنية وعصارة طبيعية.',
      descriptionFr:
        'Tomates mûries au soleil de la Mitidja issues de semences paysannes non hybrides, cultivées en plein champ.',
      category: 'vegetables',
      priceDzd: 420,
      unit: '1 kg',
      stock: 38,
      season: 'AUTUMN',
      images: [GENERATED_IMAGES.produceBasket],
      organicClaim: true,
      waterSavedPerUnit: 36,
      co2SavedPerUnit: 1.8,
      localKm: 25,
      packaging: 'compostable_kraft',
      harvestDate: '2026-11-18',
      verified: true,
    },
    {
      producerId: farm2.id,
      nameAr: 'زعتر جبلي بري مجفف على الظل',
      nameFr: 'Thym sauvage de montagne séché à l’ombre',
      descriptionAr:
        'زعتر بري مقطوف بطريقة مستدامة تحافظ على جذور النبات، غني بالزيوت العطرية الطبيعية.',
      descriptionFr:
        'Thym sauvage cueilli de manière responsable pour préserver la flore locale, séché lentement à l’ombre.',
      category: 'spices',
      priceDzd: 550,
      unit: '150 g',
      stock: 54,
      season: 'ALL',
      images: [GENERATED_IMAGES.spicesDates],
      organicClaim: true,
      waterSavedPerUnit: 28,
      co2SavedPerUnit: 1.4,
      localKm: 55,
      packaging: 'compostable_kraft',
      harvestDate: '2026-08-22',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'كليمونتين البليدة العضوي — قطف اليوم',
      nameFr: 'Clémentines bio de Blida — Récolte du jour',
      descriptionAr:
        'كليمونتين عطري حلو المذاق غير معالج بالشمع الصناعي، يُقطف بأوراقه الخضراء الطازجة.',
      descriptionFr:
        'Clémentines parfumées non cirées, récoltées avec feuilles dans nos vergers conduits en agroécologie.',
      category: 'vegetables',
      priceDzd: 390,
      unit: '1 kg',
      stock: 64,
      season: 'WINTER',
      images: [GENERATED_IMAGES.produceBasket],
      organicClaim: true,
      waterSavedPerUnit: 40,
      co2SavedPerUnit: 2.2,
      localKm: 28,
      packaging: 'woven_basket',
      harvestDate: '2026-11-19',
      verified: true,
    },
    {
      producerId: farm2.id,
      nameAr: 'زيت زيتون مبكر غير مصفى — دفعة محدودة',
      nameFr: "Huile d'olive primeur non filtrée — Lot limité",
      descriptionAr:
        'عصرة أولى غنية بالبوليفينول ومضادات الأكسدة، معبأة مباشرة بعد القطف في قارورة داكنة قابلة للإرجاع.',
      descriptionFr:
        'Première pression riche en polyphénols et antioxydants, embouteillée en verre opaque consigné.',
      category: 'olive_oil',
      priceDzd: 2850,
      unit: '750 ml',
      stock: 19,
      season: 'AUTUMN',
      images: [GENERATED_IMAGES.oliveOil],
      organicClaim: true,
      waterSavedPerUnit: 48,
      co2SavedPerUnit: 2.9,
      localKm: 45,
      packaging: 'zero_waste_returnable',
      harvestDate: '2026-11-05',
      verified: true,
    },
    {
      producerId: farm1.id,
      nameAr: 'تين مجفف محشو بزيت الزيتون البكر',
      nameFr: "Figues sèches macérées à l'huile d'olive vierge",
      descriptionAr:
        'وصفة جزائرية تقليدية مقوية للمناعة: تين جبلي مجفف بالشمس منقوع في زيت زيتون عضوي بكر.',
      descriptionFr:
        'Recette traditionnelle algérienne : figues de montagne séchées au soleil macérées dans l’huile d’olive bio.',
      category: 'pantry',
      priceDzd: 1950,
      unit: '450 g',
      stock: 27,
      season: 'WINTER',
      images: [GENERATED_IMAGES.honey],
      organicClaim: true,
      waterSavedPerUnit: 35,
      co2SavedPerUnit: 2.0,
      localKm: 38,
      packaging: 'recyclable_glass',
      harvestDate: '2026-10-14',
      verified: true,
    },
    {
      producerId: farm2.id,
      nameAr: 'دبس التمر الطبيعي العضوي — رب التمر',
      nameFr: 'Sirop de dattes naturel bio (Rob El Tmar)',
      descriptionAr:
        'بديل صحي طبيعي للسكر المكرر مستخلص بالطبخ الهادئ من تمور دقلة نور بدون أي إضافات.',
      descriptionFr:
        'Alternative naturelle au sucre raffiné, extrait lentement de dattes Deglet Nour sans aucun additif.',
      category: 'pantry',
      priceDzd: 980,
      unit: '350 ml',
      stock: 41,
      season: 'ALL',
      images: [GENERATED_IMAGES.spicesDates],
      organicClaim: true,
      waterSavedPerUnit: 30,
      co2SavedPerUnit: 1.7,
      localKm: 180,
      packaging: 'recyclable_glass',
      harvestDate: '2026-10-29',
      verified: false,
    },
  ];

  const insertedProducts = [];
  for (const item of rawProducts) {
    const score = calculateSustainabilityScore({
      waterSavedPerUnit: item.waterSavedPerUnit,
      co2SavedPerUnit: item.co2SavedPerUnit,
      localKm: item.localKm,
      packaging: item.packaging,
      hasActiveSpgBadge: item.verified,
      organicClaim: item.organicClaim,
    }).total;

    const [created] = await db
      .insert(products)
      .values({
        producerId: item.producerId,
        nameAr: item.nameAr,
        nameFr: item.nameFr,
        descriptionAr: item.descriptionAr,
        descriptionFr: item.descriptionFr,
        category: item.category,
        priceDzd: item.priceDzd,
        unit: item.unit,
        stock: item.stock,
        season: item.season,
        images: item.images,
        organicClaim: item.organicClaim,
        waterSavedPerUnit: item.waterSavedPerUnit,
        co2SavedPerUnit: item.co2SavedPerUnit,
        localKm: item.localKm,
        packaging: item.packaging,
        sustainabilityScore: score,
        status: 'ACTIVE',
        harvestDate: item.harvestDate,
      })
      .returning();

    insertedProducts.push({ ...created, verified: item.verified });

    // Seed valid cryptographic hash-chain passport events
    const producerUserId = item.producerId === farm1.id ? prodUser1.id : prodUser2.id;
    const farmName = item.producerId === farm1.id ? farm1.farmName : farm2.farmName;
    const reportId = item.producerId === farm1.id ? report1.id : report2.id;

    await blockchainService.appendEvent({
      productId: created.id,
      eventType: 'PRODUCT_CREATED',
      actorId: producerUserId,
      payload: {
        farmName,
        category: created.category,
        unit: created.unit,
        packaging: created.packaging,
        summaryAr: `تم تسجيل المنتج في سجل أثر من طرف ${farmName}`,
        summaryFr: `Produit enregistré dans le registre Athar par ${farmName}`,
      },
    });

    await blockchainService.appendEvent({
      productId: created.id,
      eventType: 'HARVEST_RECORDED',
      actorId: producerUserId,
      payload: {
        harvestDate: created.harvestDate,
        waterSavedPerUnit: created.waterSavedPerUnit,
        co2SavedPerUnit: created.co2SavedPerUnit,
        summaryAr: `توثيق تاريخ القطف (${created.harvestDate}) ومعاملات الأثر البيئي`,
        summaryFr: `Récolte consignée (${created.harvestDate}) avec métriques d'impact`,
      },
    });

    if (item.verified) {
      await blockchainService.appendEvent({
        productId: created.id,
        eventType: 'FARM_VERIFIED',
        actorId: item.producerId === farm1.id ? amb1.id : amb2.id,
        payload: {
          reportId,
          score: item.producerId === farm1.id ? 96 : 93,
          gps: item.producerId === farm1.id ? '36.4722, 2.8277' : '36.7169, 4.0497',
          summaryAr: 'تمت الزيارة الميدانية للسفير الموثق والتحقق الجغرافي من الممارسات',
          summaryFr: 'Visite terrain géolocalisée validée par un ambassadeur SPG',
        },
      });

      await blockchainService.appendEvent({
        productId: created.id,
        eventType: 'SPG_BADGE_GRANTED',
        actorId: admin.id,
        payload: {
          reportId,
          badgeStatus: 'ACTIVE',
          validUntil: sixMonthsLater.toISOString().slice(0, 10),
          summaryAr: 'منح شارة الضمان التشاركي الرقمي SPG بعد مصادقة الإدارة',
          summaryFr: 'Attribution du badge SPG numérique après validation administrative',
        },
      });
    }
  }

  // 6. Seed Sample Orders across statuses
  const pOil = insertedProducts[0];
  const pHoney = insertedProducts[1];
  const pBasket = insertedProducts[2];
  const pDates = insertedProducts[3];

  const deliveredImpact1 = calculateAtharPoints({
    waterSavedPerUnit: pOil.waterSavedPerUnit,
    co2SavedPerUnit: pOil.co2SavedPerUnit,
    localKm: pOil.localKm,
    quantity: 2,
  });
  const deliveredImpact2 = calculateAtharPoints({
    waterSavedPerUnit: pBasket.waterSavedPerUnit,
    co2SavedPerUnit: pBasket.co2SavedPerUnit,
    localKm: pBasket.localKm,
    quantity: 1,
  });

  const [order1] = await db
    .insert(orders)
    .values({
      consumerId: cons1.id,
      status: 'DELIVERED',
      subtotal: pOil.priceDzd * 2 + pBasket.priceDzd,
      deliveryFee: 350,
      discountAmount: 0,
      total: pOil.priceDzd * 2 + pBasket.priceDzd + 350,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      paymentRef: 'COD-DZ-8841A2',
      deliveryType: 'HOME_DELIVERY',
      address: 'Hydra, Chemin Sidi Yahia, Alger',
      wilaya: '16 - Alger',
      deliverySlot: '09:00 - 12:00',
      trackingNumber: 'ATH-16-9421B8',
      logisticsPartner: 'Yalidine Green',
      createdAt: new Date(now.getTime() - 6 * 24 * 3600 * 1000),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order1.id,
      productId: pOil.id,
      quantity: 2,
      unitPrice: pOil.priceDzd,
      impactSnapshot: deliveredImpact1,
    },
    {
      orderId: order1.id,
      productId: pBasket.id,
      quantity: 1,
      unitPrice: pBasket.priceDzd,
      impactSnapshot: deliveredImpact2,
    },
  ]);

  const [order2] = await db
    .insert(orders)
    .values({
      consumerId: cons1.id,
      status: 'SHIPPED',
      subtotal: pHoney.priceDzd,
      deliveryFee: 150,
      discountAmount: 0,
      total: pHoney.priceDzd + 150,
      paymentMethod: 'BARIDIMOB',
      paymentStatus: 'PAID',
      paymentRef: 'BARIDIMOB-DZ-5510C9',
      deliveryType: 'PICKUP_POINT',
      address: 'Point Relais Hydra — Comptoir Athar',
      wilaya: '16 - Alger',
      pickupPoint: 'Point Relais Hydra — Comptoir Athar',
      deliverySlot: '13:00 - 16:00',
      trackingNumber: 'ATH-16-3107E4',
      logisticsPartner: 'Yalidine Green',
      createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order2.id,
      productId: pHoney.id,
      quantity: 1,
      unitPrice: pHoney.priceDzd,
      impactSnapshot: calculateAtharPoints({
        waterSavedPerUnit: pHoney.waterSavedPerUnit,
        co2SavedPerUnit: pHoney.co2SavedPerUnit,
        localKm: pHoney.localKm,
        quantity: 1,
      }),
    },
  ]);

  const [order3] = await db
    .insert(orders)
    .values({
      consumerId: cons2.id,
      status: 'PREPARING',
      subtotal: pDates.priceDzd * 2,
      deliveryFee: 550,
      discountAmount: 0,
      total: pDates.priceDzd * 2 + 550,
      paymentMethod: 'SATIM',
      paymentStatus: 'PAID',
      paymentRef: 'SATIM-DZ-7721F1',
      deliveryType: 'HOME_DELIVERY',
      address: 'Canastel, Résidence Les Oliviers, Oran',
      wilaya: '31 - Oran',
      deliverySlot: '17:00 - 20:00',
      trackingNumber: 'ATH-31-6620D2',
      logisticsPartner: 'EcoExpress Algérie',
      createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
    })
    .returning();

  await db.insert(orderItems).values([
    {
      orderId: order3.id,
      productId: pDates.id,
      quantity: 2,
      unitPrice: pDates.priceDzd,
      impactSnapshot: calculateAtharPoints({
        waterSavedPerUnit: pDates.waterSavedPerUnit,
        co2SavedPerUnit: pDates.co2SavedPerUnit,
        localKm: pDates.localKm,
        quantity: 2,
      }),
    },
  ]);

  // 7. Seed Atharouk Loyalty Transactions
  const earnedTotal1 = deliveredImpact1.atharEarned + deliveredImpact2.atharEarned;
  await db.insert(loyaltyTransactions).values([
    {
      userId: cons1.id,
      orderId: order1.id,
      amount: earnedTotal1,
      type: 'EARN',
      reason: `رصيد أثر بيئي مكتسب من الطلب #${order1.id}`,
      metadata: {
        waterSavedLiters: deliveredImpact1.waterSavedLiters + deliveredImpact2.waterSavedLiters,
        co2SavedKg: deliveredImpact1.co2SavedKg + deliveredImpact2.co2SavedKg,
      },
    },
    {
      userId: cons1.id,
      amount: 120,
      type: 'EARN',
      reason: 'مكافأة استرجاع القارورات الزجاجية · Bonus verre consigné',
      metadata: { bottlesReturned: 3 },
    },
    {
      userId: cons1.id,
      amount: 50,
      type: 'REDEEM',
      reason: 'غرس شجرة زيتون في الأطلس البليدي · Certificat arbre planté',
      metadata: { certificateCode: 'ATHAR-TREE-DZ-2026-014', wilaya: '09 - Blida' },
    },
    {
      userId: cons2.id,
      amount: 145,
      type: 'EARN',
      reason: 'رصيد ترحيبي ومشتريات عضوية · Crédits impact bio',
      metadata: { waterSavedLiters: 90, co2SavedKg: 4.8 },
    },
  ]);

  // 8. Seed Flexible Weekly Basket
  await db.insert(baskets).values({
    consumerId: cons1.id,
    name: 'سلتي الأسبوعية العائلية · Mon Panier Hebdo',
    recurrence: 'WEEKLY',
    deliverySlot: '09:00 - 12:00',
    deliveryType: 'HOME_DELIVERY',
    items: [
      { productId: pBasket.id, quantity: 1 },
      { productId: pOil.id, quantity: 1 },
    ],
    active: true,
  });

  // 9. Seed Verified Reviews
  await db.insert(reviews).values([
    {
      productId: pOil.id,
      userId: cons1.id,
      orderId: order1.id,
      rating: 5,
      comment:
        'زيت زيتون رائع فعلاً، طعم أصيل وحموضة خفيفة جداً. أعجبني التحقق من تاريخ القطف والعصر في جواز المنتج الرقمي.',
    },
    {
      productId: pBasket.id,
      userId: cons1.id,
      orderId: order1.id,
      rating: 5,
      comment:
        'الخضار وصلت طازجة جداً داخل سلة الحلفاء بدون أي بلاستيك. خدمة التوصيل احترمت التوقيت.',
    },
  ]);

  // 10. Seed Sample Dispute
  await db.insert(disputes).values({
    orderId: order3.id,
    userId: cons2.id,
    reason: 'تأخر في تحديث مسار الطرد نحو وهران وتضرر خفيف في علبة التغليف الخارجية',
    evidence: GENERATED_IMAGES.spicesDates,
    status: 'OPEN',
  });

  // 11. Seed Ambassador Application
  await db.insert(ambassadorApplications).values({
    userId: cons2.id,
    wilaya: '31 - Oran',
    motivation:
      'مهندس فلاحي مهتم بالزراعة الإيكولوجية وأرغب في زيارة المزارع المحلية بولاية وهران وتوثيق ممارساتها للمستهلكين.',
    experience: '4 سنوات في الإرشاد الزراعي المستدام وتقييم التربة.',
    status: 'PENDING',
  });

  // 12. Seed Bilingual Notifications
  await db.insert(notifications).values([
    {
      userId: cons1.id,
      titleAr: 'تم إضافة نقاط أثرك إلى محفظتك',
      titleFr: 'Points Athar crédités sur votre portefeuille',
      bodyAr: `لقد كسبت ${earnedTotal1} نقطة أثر من طلبك المسلّم #${order1.id}. يمكنك استبدالها بخصم أو غرس شجرة.`,
      bodyFr: `Vous avez gagné ${earnedTotal1} points Athar suite à votre commande livrée #${order1.id}.`,
      read: false,
    },
    {
      userId: prodUser1.id,
      titleAr: 'شارة الضمان التشاركي SPG فعالة',
      titleFr: 'Votre badge SPG est actif',
      bodyAr: 'تم اعتماد تقرير الزيارة الميدانية لمزرعة بساتين المتيجة بدرجة 96/100 وتحديث جوازات منتجاتكم.',
      bodyFr: 'Le rapport de visite de votre ferme a été approuvé (96/100) et vos passeports produits mis à jour.',
      read: false,
    },
    {
      userId: admin.id,
      titleAr: 'تقرير زيارة SPG جديد بانتظار المراجعة',
      titleFr: 'Nouveau rapport SPG en attente de validation',
      bodyAr: 'قدّمت السفيرة مريم بودياف تقرير تجديد ميداني لتعاونية دار الزيتون.',
      bodyFr: 'L’ambassadrice Meriem Boudiaf a soumis un rapport de renouvellement pour Dar Zaytoune.',
      read: false,
    },
  ]);

  // 13. Seed Blog / Community Posts
  await db.insert(blogPosts).values([
    {
      titleAr: 'كيف يقضي نظام الضمان التشاركي الرقمي (SPG) على التضليل الأخضر في الجزائر؟',
      titleFr: 'Comment le SPG numérique met fin au greenwashing en Algérie',
      excerptAr:
        'بدلاً من الشعارات التسويقية الفارغة، يزور سفراء مستهلكون مدربون المزارع ميدانياً ويوثقون كل خطوة بالصور الجغرافية.',
      excerptFr:
        'Au lieu d’allégations marketing invérifiables, des ambassadeurs formés auditent les fermes sur le terrain avec preuves géolocalisées.',
      bodyAr:
        'يعتمد نظام الضمان التشاركي (SPG) المعترف به دولياً من طرف حركة الزراعة العضوية على الشفافية المباشرة بين الفلاح والمستهلك. في منصة أثر، نقوم برقمنة هذه العملية بالكامل: يقوم السفير المعتمد بجدولة الزيارة، وتعبئة قائمة تدقيق دقيقة تشمل غياب المبيدات الكيميائية واقتصاد المياه، ثم رفع صور موثقة بالإحداثيات الجغرافية. بعد مراجعة الإدارة، تُمنح شارة الثقة وتُسجَّل فوراً في سلسلة التجزئة المشفرة لجواز المنتج.',
      bodyFr:
        'Le Système Participatif de Garantie (SPG), reconnu par l’IFOAM, repose sur la transparence directe entre producteurs et consommateurs. Sur Athar, chaque visite est planifiée, documentée via une grille d’audit complète (zéro pesticide, gestion de l’eau, sols vivants) et enrichie de photos géolocalisées. Après validation, le badge SPG est inscrit dans la chaîne de hachage SHA-256 du Passeport Produit.',
      category: 'spg_trust',
      image: GENERATED_IMAGES.spgVisit,
      published: true,
    },
    {
      titleAr: 'دليل التعرف على زيت الزيتون القبائلي الأصلي المعصور على البارد',
      titleFr: "Guide : reconnaître une véritable huile d'olive Kabyle pressée à froid",
      excerptAr:
        'ثلاث علامات حسية ومخبرية تميز زيت الزيتون البكر الممتاز عن الزيوت المكررة أو المخزنة بطريقة خاطئة.',
      excerptFr:
        'Trois repères sensoriels et analytiques pour distinguer une huile vierge extra authentique des huiles oxydées.',
      bodyAr:
        'لا يُقاس زيت الزيتون الجيد بلونه فحسب، بل برائحته العشبية الطازجة، وحرارته الخفيفة في الحلق (الدالة على غناه بالبوليفينول)، وتاريخ عصره القريب من موسم القطف. في جواز منتج أثر، يمكنك التحقق مباشرة من تاريخ القطف ودرجة حرارة العصر دون الاعتماد على الملصق وحده.',
      bodyFr:
        'Une huile d’olive d’exception ne se juge pas à sa couleur mais à son fruité vert, son ardence en gorge (signe de polyphénols) et sa date de trituration. Le Passeport Numérique Athar vous donne accès à la date exacte de récolte et au compte-rendu d’extraction.',
      category: 'recipes',
      image: GENERATED_IMAGES.oliveOil,
      published: true,
    },
    {
      titleAr: 'سلة الخريف الجزائرية: 5 وصفات موسمية بأقل بصمة مائية',
      titleFr: 'Panier d’automne algérien : 5 recettes locales à faible empreinte eau',
      excerptAr:
        'استفد من خيرات المتيجة وبسكرة في تحضير وجبات يومية صحية توفر أكثر من 180 لتراً من المياه أسبوعياً.',
      excerptFr:
        'Cuisinez les récoltes de la Mitidja et de Biskra tout en économisant plus de 180 litres d’eau virtuelle par semaine.',
      bodyAr:
        'اختيار الخضار الموسمية المحلية مثل الطماطم البلدية، الكوسة، التين، وزيت الزيتون البكر يقلل مسافة النقل إلى أقل من 40 كيلومتراً ويحفظ القيمة الغذائية الكاملة. جرب تحضير شخشوخة الخضار الموسمية أو سلطة التين والزعتر الجبلي بزيت الزيتون القبائلي.',
      bodyFr:
        'Privilégier les récoltes de saison en circuit court réduit les kilomètres alimentaires sous la barre des 40 km et préserve la densité nutritionnelle. Découvrez nos idées autour des tomates anciennes, figues fraîches et thym sauvage.',
      category: 'recipes',
      image: GENERATED_IMAGES.produceBasket,
      published: true,
    },
    {
      titleAr: 'كيف تحسب محفظة أثرك كمية المياه والكربون التي وفّرتها؟',
      titleFr: 'Comment votre portefeuille Atharouk mesure l’eau et le CO2 évités',
      excerptAr:
        'كل عملية شراء موثقة تتحول إلى أثر بيئي قابل للقياس ورصيد أخضر لغرس الأشجار في الجزائر.',
      excerptFr:
        'Chaque commande livrée convertit votre impact écologique mesuré en crédits verts échangeables contre des arbres.',
      bodyAr:
        'يرتبط كل منتج في أثر بمعاملات بيئية شفافة: كمية المياه الموفرة عبر الري بالتقطير، انبعاثات ثاني أكسيد الكربون التي تم تفاديها بفضل الدائرة القصيرة، ونوعية التغليف القابل للإرجاع. فور تسليم طلبك، تُضاف نقاط «أثر» تلقائياً إلى رصيدك.',
      bodyFr:
        'Chaque produit dispose de coefficients d’impact vérifiés : litres d’eau économisés grâce au goutte-à-goutte, kilos de CO2 évités par le circuit court et emballage consigné. Dès la livraison confirmée, vos points Athar sont crédités automatiquement.',
      category: 'sustainability',
      image: GENERATED_IMAGES.heroFarm,
      published: true,
    },
  ]);

  // 14. Seed Audit Log
  await db.insert(auditLogs).values([
    {
      actorId: admin.id,
      action: 'SPG_REPORT_APPROVED',
      entity: 'spg_visit_reports',
      entityId: String(report1.id),
      metadata: { producerId: farm1.id, score: 96 },
    },
    {
      actorId: admin.id,
      action: 'PRODUCER_APPROVED',
      entity: 'producer_profiles',
      entityId: String(farm2.id),
      metadata: { farmName: farm2.farmName },
    },
  ]);

  console.log('Athar database seeded successfully.');
}

// Allow running directly via `npx tsx src/db/seed.ts`
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('seed.ts');

if (isDirectRun) {
  import('dotenv').then(async (dotenv) => {
    dotenv.config();
    await ensureSeeded();
    const [{ total }] = await db.select({ total: count() }).from(products);
    console.log(`Total products in DB: ${total}`);
    process.exit(0);
  });
}
