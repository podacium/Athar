export const GENERATED_IMAGES = {
  heroFarm: '/src/assets/images/hero_algerian_farm_1795253421607.jpg',
  oliveOil: '/src/assets/images/product_olive_oil_1795253436157.jpg',
  honey: '/src/assets/images/product_blida_honey_1795253421552.jpg',
  produceBasket: '/src/assets/images/product_produce_basket_1795253431338.jpg',
  spicesDates: '/src/assets/images/product_spices_dates_1795253452567.jpg',
  spgVisit: '/src/assets/images/story_spg_visit_1795253450537.jpg',
} as const;

export const ALGERIA_WILAYAS = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Bouira',
  '11 - Tamanrasset',
  '12 - Tébessa',
  '13 - Tlemcen',
  '14 - Tiaret',
  '15 - Tizi Ouzou',
  '16 - Alger',
  '17 - Djelfa',
  '18 - Jijel',
  '19 - Sétif',
  '20 - Saïda',
  '21 - Skikda',
  '22 - Sidi Bel Abbès',
  '23 - Annaba',
  '24 - Guelma',
  '25 - Constantine',
  '26 - Médéa',
  '27 - Mostaganem',
  '28 - M’Sila',
  '29 - Mascara',
  '30 - Ouargla',
  '31 - Oran',
  '32 - El Bayadh',
  '33 - Illizi',
  '34 - Bordj Bou Arréridj',
  '35 - Boumerdès',
  '36 - El Tarf',
  '37 - Tindouf',
  '38 - Tissemsilt',
  '39 - El Oued',
  '40 - Khenchela',
  '41 - Souk Ahras',
  '42 - Tipaza',
  '43 - Mila',
  '44 - Aïn Defla',
  '45 - Naâma',
  '46 - Aïn Témouchent',
  '47 - Ghardaïa',
  '48 - Relizane',
  '49 - Timimoun',
  '50 - Bordj Badji Mokhtar',
  '51 - Ouled Djellal',
  '52 - Béni Abbès',
  '53 - In Salah',
  '54 - In Guezzam',
  '55 - Touggourt',
  '56 - Djanet',
  '57 - El M’Ghair',
  '58 - El Meniaa',
] as const;

export const WILAYA_COORDS: Record<string, { lat: number; lng: number }> = {
  '06 - Béjaïa': { lat: 36.7509, lng: 5.0567 },
  '07 - Biskra': { lat: 34.8504, lng: 5.7281 },
  '09 - Blida': { lat: 36.4722, lng: 2.8277 },
  '15 - Tizi Ouzou': { lat: 36.7169, lng: 4.0497 },
  '16 - Alger': { lat: 36.7538, lng: 3.0588 },
  '25 - Constantine': { lat: 36.365, lng: 6.6147 },
  '31 - Oran': { lat: 35.6971, lng: -0.6308 },
  '42 - Tipaza': { lat: 36.5897, lng: 2.4475 },
};

export const PICKUP_POINTS = [
  {
    id: 'alger-hydra',
    wilaya: '16 - Alger',
    nameAr: 'نقطة استلام حيدرة — سوق أثر البيئي',
    nameFr: 'Point Relais Hydra — Comptoir Athar',
    hours: '08:30 - 19:00',
  },
  {
    id: 'alger-bab-ezzouar',
    wilaya: '16 - Alger',
    nameAr: 'نقطة استلام باب الزوار — التعاونية الخضراء',
    nameFr: 'Point Relais Bab Ezzouar — Coopérative Verte',
    hours: '09:00 - 18:30',
  },
  {
    id: 'blida-centre',
    wilaya: '09 - Blida',
    nameAr: 'نقطة استلام البليدة — دار الفلاح المتيجي',
    nameFr: 'Point Relais Blida — Maison du Producteur Mitidja',
    hours: '08:00 - 17:30',
  },
  {
    id: 'oran-centre',
    wilaya: '31 - Oran',
    nameAr: 'نقطة استلام وهران — الفضاء البيولوجي',
    nameFr: 'Point Relais Oran — Espace Bio Méditerranée',
    hours: '09:00 - 18:00',
  },
  {
    id: 'tizi-centre',
    wilaya: '15 - Tizi Ouzou',
    nameAr: 'نقطة استلام تيزي وزو — تعاونية الزيتون',
    nameFr: 'Point Relais Tizi Ouzou — Coopérative Oléicole',
    hours: '08:30 - 17:00',
  },
];

export const DELIVERY_SLOTS = [
  '09:00 - 12:00',
  '13:00 - 16:00',
  '17:00 - 20:00',
] as const;

export const PRODUCT_CATEGORIES = [
  { key: 'olive_oil', ar: 'زيت الزيتون', fr: "Huile d'olive" },
  { key: 'honey', ar: 'العسل ومنتجات النحل', fr: 'Miel & Ruche' },
  { key: 'vegetables', ar: 'خضار وفواكه موسمية', fr: 'Légumes & Fruits' },
  { key: 'spices', ar: 'توابل وأعشاب جبلية', fr: 'Épices & Herbes' },
  { key: 'dates', ar: 'تمور ومنتجات الواحات', fr: 'Dattes & Oasis' },
  { key: 'pantry', ar: 'مؤونة عضوية', fr: 'Épicerie Bio' },
] as const;

export const SEASONS = [
  { key: 'ALL', ar: 'طوال السنة', fr: "Toute l'année" },
  { key: 'AUTUMN', ar: 'الخريف', fr: 'Automne' },
  { key: 'WINTER', ar: 'الشتاء', fr: 'Hiver' },
  { key: 'SPRING', ar: 'الربيع', fr: 'Printemps' },
  { key: 'SUMMER', ar: 'الصيف', fr: 'Été' },
] as const;

export const PACKAGING_OPTIONS = [
  { key: 'zero_waste_returnable', ar: 'زجاج قابل للإرجاع (صفر نفايات)', fr: 'Verre consigné (Zéro déchet)', bonus: 15 },
  { key: 'recyclable_glass', ar: 'زجاج قابل لإعادة التدوير', fr: 'Verre recyclable', bonus: 12 },
  { key: 'compostable_kraft', ar: 'ورق كرافت قابل للتحلل', fr: 'Kraft compostable', bonus: 10 },
  { key: 'woven_basket', ar: 'سلة حلفاء تقليدية', fr: 'Panier en alfa tressé', bonus: 14 },
  { key: 'standard_recyclable', ar: 'تغليف قابل لإعادة التدوير', fr: 'Emballage recyclable standard', bonus: 6 },
] as const;

export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'AUTUMN';
  return 'WINTER';
}

export function estimateWilayaDistanceKm(wilayaA: string, wilayaB: string): number {
  if (!wilayaA || !wilayaB) return 60;
  if (wilayaA === wilayaB) return 12;
  const a = WILAYA_COORDS[wilayaA];
  const b = WILAYA_COORDS[wilayaB];
  if (!a || !b) return 140;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
