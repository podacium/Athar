import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'CONSUMER',
  'PRODUCER',
  'AMBASSADOR',
  'ADMIN',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const productStatusEnum = pgEnum('product_status', [
  'ACTIVE',
  'DRAFT',
  'MODERATED',
  'OUT_OF_STOCK',
]);

export const passportEventTypeEnum = pgEnum('passport_event_type', [
  'PRODUCT_CREATED',
  'FARM_VERIFIED',
  'SPG_BADGE_GRANTED',
  'SPG_BADGE_REVOKED',
  'HARVEST_RECORDED',
  'QUALITY_CHECK',
  'ORDER_DELIVERED',
]);

export const badgeStatusEnum = pgEnum('badge_status', [
  'ACTIVE',
  'REVOKED',
  'EXPIRED',
]);

export const spgRecommendationEnum = pgEnum('spg_recommendation', [
  'GRANT',
  'RENEW',
  'REVOKE',
]);

export const spgReportStatusEnum = pgEnum('spg_report_status', [
  'SCHEDULED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'COD',
  'SATIM',
  'BARIDIMOB',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
]);

export const deliveryTypeEnum = pgEnum('delivery_type', [
  'HOME_DELIVERY',
  'PICKUP_POINT',
]);

export const loyaltyTypeEnum = pgEnum('loyalty_type', ['EARN', 'REDEEM']);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_REFUND',
  'RESOLVED_REPLACEMENT',
  'REJECTED',
]);

export const ambassadorAppStatusEnum = pgEnum('ambassador_app_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

// 1. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  role: userRoleEnum('role').notNull().default('CONSUMER'),
  locale: text('locale').notNull().default('ar'),
  wilaya: text('wilaya').notNull().default('16 - Alger'),
  address: text('address').default(''),
  active: boolean('active').notNull().default(true),
  resetToken: text('reset_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 2. Producer Profiles
export const producerProfiles = pgTable('producer_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  farmName: text('farm_name').notNull(),
  farmNameFr: text('farm_name_fr').notNull().default(''),
  storyAr: text('story_ar').notNull().default(''),
  storyFr: text('story_fr').notNull().default(''),
  wilaya: text('wilaya').notNull(),
  address: text('address').notNull().default(''),
  practices: jsonb('practices').$type<string[]>().notNull().default([]),
  photos: jsonb('photos').$type<string[]>().notNull().default([]),
  verificationStatus: verificationStatusEnum('verification_status')
    .notNull()
    .default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 3. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  producerId: integer('producer_id')
    .references(() => producerProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  nameAr: text('name_ar').notNull(),
  nameFr: text('name_fr').notNull(),
  descriptionAr: text('description_ar').notNull(),
  descriptionFr: text('description_fr').notNull(),
  category: text('category').notNull(),
  priceDzd: integer('price_dzd').notNull(),
  unit: text('unit').notNull().default('kg'),
  stock: integer('stock').notNull().default(0),
  season: text('season').notNull().default('ALL'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  organicClaim: boolean('organic_claim').notNull().default(true),
  waterSavedPerUnit: doublePrecision('water_saved_per_unit').notNull().default(0),
  co2SavedPerUnit: doublePrecision('co2_saved_per_unit').notNull().default(0),
  localKm: integer('local_km').notNull().default(30),
  packaging: text('packaging').notNull().default('recyclable_glass'),
  sustainabilityScore: integer('sustainability_score').notNull().default(75),
  status: productStatusEnum('status').notNull().default('ACTIVE'),
  harvestDate: text('harvest_date').notNull().default('2026-11-10'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 4. Product Passport Events (Hash Chain)
export const productPassportEvents = pgTable('product_passport_events', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: passportEventTypeEnum('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  previousHash: text('previous_hash').notNull(),
  hash: text('hash').notNull(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 5. SPG Visit Reports
export const spgVisitReports = pgTable('spg_visit_reports', {
  id: serial('id').primaryKey(),
  ambassadorId: integer('ambassador_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  producerId: integer('producer_id')
    .references(() => producerProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  submittedAt: timestamp('submitted_at'),
  checklist: jsonb('checklist')
    .$type<{
      noSyntheticPesticides: boolean;
      waterConservation: boolean;
      soilRegeneration: boolean;
      fairLabor: boolean;
      traceableHarvest: boolean;
      ecoPackaging: boolean;
    }>()
    .notNull(),
  score: integer('score').notNull().default(0),
  recommendation: spgRecommendationEnum('recommendation').notNull().default('GRANT'),
  notes: text('notes').notNull().default(''),
  photos: jsonb('photos')
    .$type<Array<{ url: string; lat: number; lng: number; capturedAt: string; caption?: string }>>()
    .notNull()
    .default([]),
  gpsLat: doublePrecision('gps_lat'),
  gpsLng: doublePrecision('gps_lng'),
  status: spgReportStatusEnum('status').notNull().default('SUBMITTED'),
  adminComment: text('admin_comment'),
  producerResponse: text('producer_response'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 6. SPG Badges
export const spgBadges = pgTable('spg_badges', {
  id: serial('id').primaryKey(),
  producerId: integer('producer_id')
    .references(() => producerProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  status: badgeStatusEnum('status').notNull().default('ACTIVE'),
  grantedByReportId: integer('granted_by_report_id').references(
    () => spgVisitReports.id,
    { onDelete: 'set null' }
  ),
  validUntil: timestamp('valid_until').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 7. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  consumerId: integer('consumer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  status: orderStatusEnum('status').notNull().default('PENDING'),
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull().default(350),
  discountAmount: integer('discount_amount').notNull().default(0),
  total: integer('total').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('COD'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  paymentRef: text('payment_ref'),
  deliveryType: deliveryTypeEnum('delivery_type').notNull().default('HOME_DELIVERY'),
  address: text('address').notNull().default(''),
  wilaya: text('wilaya').notNull().default('16 - Alger'),
  pickupPoint: text('pickup_point'),
  deliverySlot: text('delivery_slot').notNull().default('09:00 - 12:00'),
  trackingNumber: text('tracking_number').notNull(),
  logisticsPartner: text('logistics_partner').notNull().default('Yalidine Green'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 8. Order Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  impactSnapshot: jsonb('impact_snapshot')
    .$type<{
      waterSavedLiters: number;
      co2SavedKg: number;
      localKm: number;
      atharEarned: number;
    }>()
    .notNull(),
});

// 9. Flexible Weekly Baskets
export const baskets = pgTable('baskets', {
  id: serial('id').primaryKey(),
  consumerId: integer('consumer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  recurrence: text('recurrence').notNull().default('WEEKLY'),
  deliverySlot: text('delivery_slot').notNull().default('Thursday 09:00 - 12:00'),
  deliveryType: deliveryTypeEnum('delivery_type').notNull().default('HOME_DELIVERY'),
  pickupPoint: text('pickup_point'),
  items: jsonb('items')
    .$type<Array<{ productId: number; quantity: number }>>()
    .notNull()
    .default([]),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 10. Atharouk Loyalty Transactions
export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  type: loyaltyTypeEnum('type').notNull(),
  reason: text('reason').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 11. Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 12. Disputes
export const disputes = pgTable('disputes', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(),
  evidence: text('evidence').default(''),
  status: disputeStatusEnum('status').notNull().default('OPEN'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 13. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  titleAr: text('title_ar').notNull(),
  titleFr: text('title_fr').notNull(),
  bodyAr: text('body_ar').notNull(),
  bodyFr: text('body_fr').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 14. Blog / Community Posts
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  titleAr: text('title_ar').notNull(),
  titleFr: text('title_fr').notNull(),
  excerptAr: text('excerpt_ar').notNull().default(''),
  excerptFr: text('excerpt_fr').notNull().default(''),
  bodyAr: text('body_ar').notNull(),
  bodyFr: text('body_fr').notNull(),
  category: text('category').notNull().default('sustainability'),
  image: text('image').notNull(),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 15. Ambassador Applications
export const ambassadorApplications = pgTable('ambassador_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  wilaya: text('wilaya').notNull(),
  motivation: text('motivation').notNull(),
  experience: text('experience').notNull().default(''),
  status: ambassadorAppStatusEnum('status').notNull().default('PENDING'),
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 16. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  producerProfile: one(producerProfiles, {
    fields: [users.id],
    references: [producerProfiles.userId],
  }),
  orders: many(orders),
  baskets: many(baskets),
  loyaltyTransactions: many(loyaltyTransactions),
  reviews: many(reviews),
  disputes: many(disputes),
  notifications: many(notifications),
  spgReports: many(spgVisitReports),
}));

export const producerProfilesRelations = relations(
  producerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [producerProfiles.userId],
      references: [users.id],
    }),
    products: many(products),
    badges: many(spgBadges),
    visitReports: many(spgVisitReports),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  producer: one(producerProfiles, {
    fields: [products.producerId],
    references: [producerProfiles.id],
  }),
  passportEvents: many(productPassportEvents),
  reviews: many(reviews),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  consumer: one(users, {
    fields: [orders.consumerId],
    references: [users.id],
  }),
  items: many(orderItems),
  disputes: many(disputes),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
