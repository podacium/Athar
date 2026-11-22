import { describe, expect, it } from 'vitest';
import {
  GENESIS_HASH,
  computeEventHash,
  verifyHashChain,
  type PassportChainEvent,
} from '../src/services/blockchain.ts';
import {
  calculateAtharPoints,
  calculateSustainabilityScore,
  recommendationService,
} from '../src/services/sustainability.ts';
import {
  createSessionToken,
  hasAllowedRole,
  verifySessionToken,
} from '../src/middleware/auth.ts';

describe('Digital Product Passport SHA-256 Hash Chain', () => {
  it('validates an intact multi-block chain and detects payload tampering', () => {
    const p1 = { eventType: 'PRODUCT_CREATED', farmName: 'Mitidja Organic', productId: 1 };
    const h1 = computeEventHash(p1, GENESIS_HASH);

    const p2 = { eventType: 'SPG_BADGE_GRANTED', score: 96, productId: 1 };
    const h2 = computeEventHash(p2, h1);

    const validChain: PassportChainEvent[] = [
      {
        id: 1,
        productId: 1,
        eventType: 'PRODUCT_CREATED',
        payload: p1,
        previousHash: GENESIS_HASH,
        hash: h1,
      },
      {
        id: 2,
        productId: 1,
        eventType: 'SPG_BADGE_GRANTED',
        payload: p2,
        previousHash: h1,
        hash: h2,
      },
    ];

    const intact = verifyHashChain(validChain);
    expect(intact.valid).toBe(true);
    expect(intact.totalEvents).toBe(2);
    expect(intact.brokenAtIndex).toBeNull();

    // Tamper with block 2 payload
    const tamperedChain: PassportChainEvent[] = [
      validChain[0],
      {
        ...validChain[1],
        payload: { ...p2, score: 100 },
      },
    ];
    const tampered = verifyHashChain(tamperedChain);
    expect(tampered.valid).toBe(false);
    expect(tampered.brokenAtIndex).toBe(1);
    expect(tampered.brokenEventId).toBe(2);
  });
});

describe('Sustainability Scoring & Atharouk Loyalty', () => {
  it('normalizes sustainability score into 0-100 and rewards active SPG badge', () => {
    const verified = calculateSustainabilityScore({
      waterSavedPerUnit: 45,
      co2SavedPerUnit: 2.6,
      localKm: 25,
      packaging: 'zero_waste_returnable',
      hasActiveSpgBadge: true,
      organicClaim: true,
    });
    const unverified = calculateSustainabilityScore({
      waterSavedPerUnit: 45,
      co2SavedPerUnit: 2.6,
      localKm: 25,
      packaging: 'zero_waste_returnable',
      hasActiveSpgBadge: false,
      organicClaim: true,
    });

    expect(verified.total).toBeGreaterThanOrEqual(85);
    expect(verified.total).toBeLessThanOrEqual(100);
    expect(verified.total).toBeGreaterThan(unverified.total);
  });

  it('calculates Atharouk loyalty credits proportionally to impact and quantity', () => {
    const single = calculateAtharPoints({
      waterSavedPerUnit: 40,
      co2SavedPerUnit: 2.0,
      localKm: 30,
      quantity: 1,
    });
    const doubleQty = calculateAtharPoints({
      waterSavedPerUnit: 40,
      co2SavedPerUnit: 2.0,
      localKm: 30,
      quantity: 2,
    });

    expect(single.atharEarned).toBeGreaterThan(0);
    expect(doubleQty.atharEarned).toBe(single.atharEarned * 2);
    expect(doubleQty.waterSavedLiters).toBe(80);
  });

  it('ranks SPG-verified seasonal local products higher in AI recommendations', () => {
    const ranked = recommendationService.rankProducts({
      userWilaya: '16 - Alger',
      preferredCategories: ['olive_oil'],
      currentSeason: 'AUTUMN',
      products: [
        {
          id: 1,
          category: 'pantry',
          season: 'SUMMER',
          sustainabilityScore: 55,
          producerWilaya: '31 - Oran',
          hasActiveSpgBadge: false,
          avgRating: 4.0,
          orderCount: 1,
        },
        {
          id: 2,
          category: 'olive_oil',
          season: 'AUTUMN',
          sustainabilityScore: 95,
          producerWilaya: '09 - Blida',
          hasActiveSpgBadge: true,
          avgRating: 4.9,
          orderCount: 12,
        },
      ],
    });

    expect(ranked[0].product.id).toBe(2);
    expect(ranked[0].aiScore).toBeGreaterThan(ranked[1].aiScore);
  });
});

describe('RBAC & Session Token Integrity', () => {
  it('enforces allowed roles strictly', () => {
    expect(hasAllowedRole('ADMIN', ['ADMIN'])).toBe(true);
    expect(hasAllowedRole('CONSUMER', ['ADMIN', 'PRODUCER'])).toBe(false);
    expect(hasAllowedRole('AMBASSADOR', ['AMBASSADOR', 'ADMIN'])).toBe(true);
    expect(hasAllowedRole(undefined, ['CONSUMER'])).toBe(false);
  });

  it('signs and verifies session tokens while rejecting tampered signatures', () => {
    const token = createSessionToken(42, 'PRODUCER');
    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(42);
    expect(verified?.role).toBe('PRODUCER');

    const corrupted = `${token}tampered`;
    expect(verifySessionToken(corrupted)).toBeNull();
  });
});
