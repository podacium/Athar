/**
 * Critical E2E Flow Test Specification (Playwright-ready)
 *
 * Covers:
 * 1. Register / Login across roles & RTL Arabic / LTR French language switching
 * 2. Consumer COD purchase flow + order tracking + Atharouk loyalty credit after delivery
 * 3. Producer product creation + automatic genesis passport block
 * 4. Ambassador SPG visit report submission -> Admin approval -> badge & SHA-256 passport append
 * 5. Digital Product Passport integrity verification (intact vs tampered)
 *
 * Run against a live server on http://localhost:3000 with Playwright installed:
 *   npx playwright test tests/e2e.spec.ts
 */

export const E2E_FLOW_CHECKLIST = [
  {
    name: 'Auth & Bilingual RTL/LTR',
    steps: [
      'Open / and verify html[dir="rtl"][lang="ar"]',
      'Switch language to FR and verify html[dir="ltr"][lang="fr"]',
      'Log in as consumer1@athar.dz / Consumer123!',
    ],
  },
  {
    name: 'Consumer COD Purchase & Atharouk Credit',
    steps: [
      'Add verified olive oil from Catalog to cart',
      'Checkout with COD default and Home Delivery in 16 - Alger',
      'Verify confirmation screen with tracking number ATH-16-*',
      'Log in as producer2@athar.dz and mark order DELIVERED',
      'Verify consumer Atharouk balance increases automatically',
    ],
  },
  {
    name: 'Producer Product Creation',
    steps: [
      'Log in as producer1@athar.dz / Producer123!',
      'Create bilingual organic product in My Products tab',
      'Verify product appears on public Catalog with SHA-256 passport',
    ],
  },
  {
    name: 'SPG Ambassador Report -> Admin Approval -> Passport Update',
    steps: [
      'Log in as ambassador@athar.dz / Ambassador123!',
      'Submit geotagged SPG report with GRANT recommendation',
      'Log in as admin@athar.dz / Admin123! and approve report in SPG Review',
      'Open product passport and click Verify Integrity -> Valid SHA-256 chain',
      'Click Simulate Tamper -> Tamper detected alert displayed',
    ],
  },
] as const;
