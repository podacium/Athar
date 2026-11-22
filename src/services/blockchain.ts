import crypto from 'crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { productPassportEvents } from '../db/schema.ts';

export type PassportEventType =
  | 'PRODUCT_CREATED'
  | 'FARM_VERIFIED'
  | 'SPG_BADGE_GRANTED'
  | 'SPG_BADGE_REVOKED'
  | 'HARVEST_RECORDED'
  | 'QUALITY_CHECK'
  | 'ORDER_DELIVERED';

export interface PassportChainEvent {
  id?: number;
  productId: number;
  eventType: PassportEventType;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
  actorId?: number | null;
  createdAt?: Date | string;
}

export interface ChainVerificationResult {
  valid: boolean;
  totalEvents: number;
  brokenAtIndex: number | null;
  brokenEventId: number | null;
  reason?: string;
  checkedAt: string;
}

export interface BlockchainService {
  computeHash(payload: Record<string, unknown>, previousHash: string): string;
  verifyEvents(events: PassportChainEvent[]): ChainVerificationResult;
  appendEvent(input: {
    productId: number;
    eventType: PassportEventType;
    payload: Record<string, unknown>;
    actorId?: number | null;
  }): Promise<PassportChainEvent>;
  getPassportChain(productId: number): Promise<PassportChainEvent[]>;
  verifyProductPassport(productId: number): Promise<ChainVerificationResult>;
}

export const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministic canonical JSON stringify so hash verification is stable across
 * PostgreSQL jsonb key-ordering differences.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`)
    .join(',')}}`;
}

export function computeEventHash(
  payload: Record<string, unknown>,
  previousHash: string
): string {
  const raw = `${canonicalStringify(payload)}${previousHash}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

export function verifyHashChain(
  events: PassportChainEvent[]
): ChainVerificationResult {
  const checkedAt = new Date().toISOString();
  if (events.length === 0) {
    return {
      valid: true,
      totalEvents: 0,
      brokenAtIndex: null,
      brokenEventId: null,
      checkedAt,
    };
  }

  let expectedPrevious = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.previousHash !== expectedPrevious) {
      return {
        valid: false,
        totalEvents: events.length,
        brokenAtIndex: i,
        brokenEventId: ev.id ?? null,
        reason: `Previous hash mismatch at block #${i + 1}`,
        checkedAt,
      };
    }
    const recomputed = computeEventHash(ev.payload, ev.previousHash);
    if (recomputed !== ev.hash) {
      return {
        valid: false,
        totalEvents: events.length,
        brokenAtIndex: i,
        brokenEventId: ev.id ?? null,
        reason: `SHA-256 digest mismatch at block #${i + 1} (payload tampered)`,
        checkedAt,
      };
    }
    expectedPrevious = ev.hash;
  }

  return {
    valid: true,
    totalEvents: events.length,
    brokenAtIndex: null,
    brokenEventId: null,
    checkedAt,
  };
}

export class PostgresHashChainService implements BlockchainService {
  computeHash(payload: Record<string, unknown>, previousHash: string): string {
    return computeEventHash(payload, previousHash);
  }

  verifyEvents(events: PassportChainEvent[]): ChainVerificationResult {
    return verifyHashChain(events);
  }

  async getPassportChain(productId: number): Promise<PassportChainEvent[]> {
    try {
      const rows = await db
        .select()
        .from(productPassportEvents)
        .where(eq(productPassportEvents.productId, productId))
        .orderBy(asc(productPassportEvents.id));
      return rows.map((r) => ({
        id: r.id,
        productId: r.productId,
        eventType: r.eventType as PassportEventType,
        payload: (r.payload ?? {}) as Record<string, unknown>,
        previousHash: r.previousHash,
        hash: r.hash,
        actorId: r.actorId,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      console.error('Failed to read passport chain:', error);
      throw new Error('Could not retrieve product passport ledger.', {
        cause: error,
      });
    }
  }

  async appendEvent(input: {
    productId: number;
    eventType: PassportEventType;
    payload: Record<string, unknown>;
    actorId?: number | null;
  }): Promise<PassportChainEvent> {
    try {
      const existing = await this.getPassportChain(input.productId);
      const previousHash =
        existing.length > 0 ? existing[existing.length - 1].hash : GENESIS_HASH;
      const enrichedPayload: Record<string, unknown> = {
        ...input.payload,
        eventType: input.eventType,
        productId: input.productId,
      };
      const hash = this.computeHash(enrichedPayload, previousHash);

      const [inserted] = await db
        .insert(productPassportEvents)
        .values({
          productId: input.productId,
          eventType: input.eventType,
          payload: enrichedPayload,
          previousHash,
          hash,
          actorId: input.actorId ?? null,
        })
        .returning();

      return {
        id: inserted.id,
        productId: inserted.productId,
        eventType: inserted.eventType as PassportEventType,
        payload: inserted.payload as Record<string, unknown>,
        previousHash: inserted.previousHash,
        hash: inserted.hash,
        actorId: inserted.actorId,
        createdAt: inserted.createdAt,
      };
    } catch (error) {
      console.error('Failed to append passport event:', error);
      throw new Error('Could not append passport hash-chain event.', {
        cause: error,
      });
    }
  }

  async verifyProductPassport(productId: number): Promise<ChainVerificationResult> {
    const events = await this.getPassportChain(productId);
    return this.verifyEvents(events);
  }
}

export const blockchainService: BlockchainService = new PostgresHashChainService();
