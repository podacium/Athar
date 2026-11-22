# Athar (أثر) — Trust-First Verified Green Marketplace for Algeria

**Athar (أثر)** is a bilingual (**Arabic default RTL** & **French LTR**) trust-first marketplace for verified organic and sustainable Algerian products (currency: **DZD**).

It solves greenwashing in Algeria through five core pillars:
1. **Digital Participatory Guarantee System (Digital SPG)**: Trained consumer ambassadors schedule farm audits, complete a 6-criterion checklist, submit geotagged field photos, and recommend granting/renewing/revoking SPG badges reviewed by Admins.
2. **Digital Product Passport (SHA-256 Hash Chain)**: Tamper-evident ledger stored in PostgreSQL where each event computes `SHA-256(canonicalPayload + previousHash)`. Anyone can click **Verify Integrity** or test tamper detection live.
3. **Atharouk Green Loyalty Program**: Measures water saved (L), CO2 avoided (kg), and local short-circuit distance per delivered order to credit **Athar** points redeemable for DZD discounts or tree-planting certificates.
4. **AI-Assisted Recommendations & Sustainability Scoring (0–100)**: Transparent scoring combining water/CO2 impact, locality, eco-packaging, SPG verification, current season, wilaya proximity, and consumer purchase history.
5. **Flexible Weekly Basket**: Customizable recurring baskets with Algerian delivery slots and low-carbon pickup points.

---

## Architecture Diagram

```
+-----------------------------------------------------------------------+
| React 19 + Vite + Tailwind CSS v4 (Arabic RTL / French LTR SPA)       |
| Public Marketplace | Digital Passport | 4 Role Dashboards | Recharts  |
+-----------------------------------+-----------------------------------+
                                    | HTTPS JSON + Bearer / HttpOnly Cookie + CSRF
+-----------------------------------v-----------------------------------+
| Express Full-Stack API (server.ts -> src/server/routes.ts)            |
| Auth (bcrypt + HMAC session + Firebase Google Sign-In) | RBAC | Zod   |
+------+-------------+-------------+--------------+--------------+------+
       |             |             |              |              |
+------v---+  +------v---+  +------v-----+  +-----v------+  +----v-----+
|Blockchain|  | Payment  |  | Logistics  |  |   Upload   |  |Recommen- |
| Service  |  | Service  |  |  Service   |  |  Service   |  | dation   |
|(SHA-256) |  |(COD/CIB/ |  |(Yalidine   |  |(Geotagged  |  |& Scoring |
|          |  |BaridiMob)|  | Green Mock)|  | Photo Mock)|  | Engine   |
+------+---+  +----------+  +------------+  +------------+  +----------+
       |
+------v----------------------------------------------------------------+
| PostgreSQL (Cloud SQL) via Drizzle ORM (src/db/schema.ts, index.ts)   |
| 16 relational tables + 14 enums + audit logs + hash-chain ledger      |
+-----------------------------------------------------------------------+
```

---

## Seeded Demo Accounts (All 4 Roles)

| Role | Email | Password | Wilaya / Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@athar.dz` | `Admin123!` | Full KPI dashboard, SPG review, moderation, disputes, CMS, audit logs |
| **Producer 1** | `producer1@athar.dz` | `Producer123!` | `09 - Blida` — Mitidja Organic Farm (vegetables & mountain honey) |
| **Producer 2** | `producer2@athar.dz` | `Producer123!` | `16 - Alger` — Dar Zaytoune (Kabyle olive oil, spices & Biskra dates) |
| **SPG Ambassador** | `ambassador@athar.dz` | `Ambassador123!` | Field audits, 6-point checklist, geotagged photo reports |
| **Consumer 1** | `consumer1@athar.dz` | `Consumer123!` | `16 - Alger` — Orders, Atharouk wallet, flexible basket, verified reviews |
| **Consumer 2** | `consumer2@athar.dz` | `Consumer123!` | `31 - Oran` — Orders, open dispute, pending ambassador application |

*(Google Sign-In via Firebase Auth is also configured and automatically provisions a Consumer account in PostgreSQL.)*

---

## Setup & Commands

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables** from `.env.example` (`SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`, `AUTH_SECRET`).
3. **Push Drizzle schema to PostgreSQL**:
   ```bash
   npx drizzle-kit push --config=src/db/drizzle.config.ts
   ```
4. **Seed sample Algerian data (idempotent)**:
   ```bash
   npm run seed
   ```
5. **Run development server (port 3000)**:
   ```bash
   npm run dev
   ```
6. **Run unit tests (Vitest)**:
   ```bash
   npm test
   ```
7. **Build for production**:
   ```bash
   npm run build && npm start
   ```

---

## Service Interfaces & Replacing Mocks

All external integrations are abstracted behind clean TypeScript interfaces under `src/services/`:
- `BlockchainService` (`src/services/blockchain.ts`): Replace `PostgresHashChainService` with a Polygon/Hyperledger anchor adapter.
- `PaymentService` (`src/services/payment.ts`): Replace `MockAlgerianPaymentService` with live SATIM CIB / Algérie Poste BaridiMob APIs.
- `LogisticsService` (`src/services/logistics.ts`): Replace `MockAlgerianLogisticsService` with Yalidine Express / ZR Express webhooks.
- `NotificationService` (`src/services/notifications.ts`): Extend `DbNotificationService` with SMTP/SendGrid or Algerian SMS gateway dispatch.
- `UploadService` (`src/services/upload.ts`): Replace `MockGeoUploadService` with Cloud Storage / S3 signed uploads and EXIF GPS extraction.
- `RecommendationService` (`src/services/sustainability.ts`): Swap or augment `AtharRecommendationService` with collaborative filtering.
