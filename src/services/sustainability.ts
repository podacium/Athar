import {
  PACKAGING_OPTIONS,
  estimateWilayaDistanceKm,
  getCurrentSeason,
} from '../lib/algeria.ts';

export interface SustainabilityInputs {
  waterSavedPerUnit: number; // liters
  co2SavedPerUnit: number; // kg
  localKm: number;
  packaging: string;
  hasActiveSpgBadge: boolean;
  organicClaim: boolean;
}

export interface SustainabilityBreakdown {
  total: number;
  waterScore: number;
  carbonScore: number;
  localityScore: number;
  packagingScore: number;
  trustScore: number;
}

/**
 * Normalizes environmental impact coefficients, SPG trust badge, local distance,
 * and packaging into a transparent 0–100 sustainability score.
 */
export function calculateSustainabilityScore(
  input: SustainabilityInputs
): SustainabilityBreakdown {
  // Water saved (0–25 pts; 50L+ per unit = full score)
  const waterScore = Math.min(25, Math.round((Math.max(0, input.waterSavedPerUnit) / 50) * 25));

  // CO2 avoided (0–25 pts; 3kg+ per unit = full score)
  const carbonScore = Math.min(25, Math.round((Math.max(0, input.co2SavedPerUnit) / 3) * 25));

  // Locality (0–20 pts; <= 25km gets 20 pts, >= 600km gets 3 pts)
  const km = Math.max(0, input.localKm);
  const localityScore =
    km <= 25 ? 20 : Math.max(3, Math.round(20 - ((km - 25) / 575) * 17));

  // Packaging (0–15 pts)
  const pkg = PACKAGING_OPTIONS.find((p) => p.key === input.packaging);
  const packagingScore = pkg ? pkg.bonus : 6;

  // Verification / Trust (0–15 pts)
  const trustScore = input.hasActiveSpgBadge ? 15 : input.organicClaim ? 7 : 2;

  const total = Math.max(
    0,
    Math.min(100, waterScore + carbonScore + localityScore + packagingScore + trustScore)
  );

  return {
    total,
    waterScore,
    carbonScore,
    localityScore,
    packagingScore,
    trustScore,
  };
}

/**
 * Calculates Atharouk green loyalty credit ("Athar") earned from a line item.
 * Weighted formula: water saved * 0.4 + CO2 avoided * 12 + short-circuit locality bonus.
 */
export function calculateAtharPoints(input: {
  waterSavedPerUnit: number;
  co2SavedPerUnit: number;
  localKm: number;
  quantity: number;
}): {
  waterSavedLiters: number;
  co2SavedKg: number;
  localKm: number;
  atharEarned: number;
} {
  const qty = Math.max(1, input.quantity);
  const waterSavedLiters = Number((Math.max(0, input.waterSavedPerUnit) * qty).toFixed(2));
  const co2SavedKg = Number((Math.max(0, input.co2SavedPerUnit) * qty).toFixed(2));
  const localityBonus = input.localKm <= 60 ? 10 : input.localKm <= 150 ? 5 : 2;
  const rawPoints = waterSavedLiters * 0.4 + co2SavedKg * 12 + localityBonus * qty;
  const atharEarned = Math.max(5, Math.round(rawPoints));

  return {
    waterSavedLiters,
    co2SavedKg,
    localKm: input.localKm,
    atharEarned,
  };
}

export interface RecommendableProduct {
  id: number;
  category: string;
  season: string;
  sustainabilityScore: number;
  producerWilaya: string;
  hasActiveSpgBadge: boolean;
  avgRating: number;
  orderCount: number;
}

export interface RecommendedResult<T extends RecommendableProduct> {
  product: T;
  aiScore: number;
  reasonAr: string;
  reasonFr: string;
}

export interface RecommendationService {
  rankProducts<T extends RecommendableProduct>(params: {
    products: T[];
    userWilaya?: string;
    preferredCategories?: string[];
    currentSeason?: string;
    limit?: number;
  }): RecommendedResult<T>[];
}

export class AtharRecommendationService implements RecommendationService {
  rankProducts<T extends RecommendableProduct>(params: {
    products: T[];
    userWilaya?: string;
    preferredCategories?: string[];
    currentSeason?: string;
    limit?: number;
  }): RecommendedResult<T>[] {
    const season = params.currentSeason || getCurrentSeason();
    const preferred = new Set(params.preferredCategories || []);
    const userWilaya = params.userWilaya || '16 - Alger';

    const scored = params.products.map((product) => {
      let score = 0;
      const reasonsAr: string[] = [];
      const reasonsFr: string[] = [];

      // 1. Trust & Sustainability (up to 35 pts)
      score += (product.sustainabilityScore / 100) * 25;
      if (product.hasActiveSpgBadge) {
        score += 10;
        reasonsAr.push('موثّق بشارة الضمان التشاركي SPG');
        reasonsFr.push('Certifié par le badge SPG');
      }

      // 2. Seasonal match (up to 20 pts)
      if (product.season === season) {
        score += 20;
        reasonsAr.push('منتج موسمي طازج');
        reasonsFr.push('Récolte de saison');
      } else if (product.season === 'ALL') {
        score += 10;
      }

      // 3. Wilaya proximity (up to 20 pts)
      const dist = estimateWilayaDistanceKm(userWilaya, product.producerWilaya);
      if (dist <= 60) {
        score += 20;
        reasonsAr.push(`قريب من ولايتك (${dist} كم)`);
        reasonsFr.push(`Circuit court proche de votre wilaya (${dist} km)`);
      } else if (dist <= 180) {
        score += 12;
      } else {
        score += 5;
      }

      // 4. User order history category affinity (up to 15 pts)
      if (preferred.has(product.category)) {
        score += 15;
        reasonsAr.push('يطابق تفضيلاتك السابقة');
        reasonsFr.push('Correspond à vos achats précédents');
      }

      // 5. Rating & Popularity (up to 10 pts)
      score += Math.min(6, (product.avgRating / 5) * 6);
      score += Math.min(4, Math.log1p(product.orderCount) * 2);

      if (reasonsAr.length === 0) {
        reasonsAr.push('أعلى تقييم استدامة وثقة');
        reasonsFr.push('Meilleur score de durabilité et de confiance');
      }

      return {
        product,
        aiScore: Math.min(99, Math.round(score)),
        reasonAr: reasonsAr.slice(0, 2).join(' · '),
        reasonFr: reasonsFr.slice(0, 2).join(' · '),
      };
    });

    scored.sort((a, b) => b.aiScore - a.aiScore);
    return params.limit ? scored.slice(0, params.limit) : scored;
  }
}

export const recommendationService: RecommendationService =
  new AtharRecommendationService();
