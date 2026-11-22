import crypto from 'crypto';
import { DELIVERY_SLOTS, PICKUP_POINTS } from '../lib/algeria.ts';

export interface TrackingStep {
  code: string;
  labelAr: string;
  labelFr: string;
  location: string;
  timestamp: string;
  completed: boolean;
}

export interface TrackingInfo {
  trackingNumber: string;
  partner: string;
  currentStatus: string;
  estimatedDelivery: string;
  carbonNeutralCourier: boolean;
  steps: TrackingStep[];
}

export interface LogisticsService {
  generateTrackingNumber(wilaya: string): string;
  calculateDeliveryFee(deliveryType: 'HOME_DELIVERY' | 'PICKUP_POINT', wilaya: string): number;
  getPickupPoints(wilaya?: string): typeof PICKUP_POINTS;
  getDeliverySlots(): readonly string[];
  getTrackingTimeline(params: {
    trackingNumber: string;
    status: string;
    wilaya: string;
    partner: string;
    createdAt: Date | string;
  }): TrackingInfo;
}

export class MockAlgerianLogisticsService implements LogisticsService {
  generateTrackingNumber(wilaya: string): string {
    const code = (wilaya.split(' ')[0] || '16').padStart(2, '0');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ATH-${code}-${rand}`;
  }

  calculateDeliveryFee(
    deliveryType: 'HOME_DELIVERY' | 'PICKUP_POINT',
    wilaya: string
  ): number {
    if (deliveryType === 'PICKUP_POINT') return 150;
    const isCentral =
      wilaya.startsWith('16') ||
      wilaya.startsWith('09') ||
      wilaya.startsWith('35') ||
      wilaya.startsWith('42');
    return isCentral ? 350 : 550;
  }

  getPickupPoints(wilaya?: string) {
    if (!wilaya) return PICKUP_POINTS;
    const filtered = PICKUP_POINTS.filter((p) => p.wilaya === wilaya);
    return filtered.length > 0 ? filtered : PICKUP_POINTS;
  }

  getDeliverySlots() {
    return DELIVERY_SLOTS;
  }

  getTrackingTimeline(params: {
    trackingNumber: string;
    status: string;
    wilaya: string;
    partner: string;
    createdAt: Date | string;
  }): TrackingInfo {
    const orderFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
    const currentIdx =
      params.status === 'CANCELLED' ? -1 : orderFlow.indexOf(params.status);
    const base = new Date(params.createdAt);

    const stepDefs = [
      {
        code: 'PENDING',
        labelAr: 'تم تسجيل الطلب في المنصة',
        labelFr: 'Commande enregistrée sur Athar',
        location: 'Alger — Centre Athar',
        offsetHours: 0,
      },
      {
        code: 'CONFIRMED',
        labelAr: 'تأكيد الطلب من طرف المزرعة',
        labelFr: 'Confirmée par le producteur',
        location: 'Ferme Partenaire',
        offsetHours: 2,
      },
      {
        code: 'PREPARING',
        labelAr: 'القطف والتغليف البيئي والتدقيق',
        labelFr: 'Récolte, emballage écologique et contrôle',
        location: 'Station de conditionnement',
        offsetHours: 8,
      },
      {
        code: 'SHIPPED',
        labelAr: `في الطريق عبر ${params.partner}`,
        labelFr: `En transit via ${params.partner}`,
        location: `Hub ${params.wilaya}`,
        offsetHours: 20,
      },
      {
        code: 'DELIVERED',
        labelAr: 'تم التسليم بنجاح وإضافة نقاط أثرك',
        labelFr: 'Livrée avec succès — Points Athar crédités',
        location: params.wilaya,
        offsetHours: 28,
      },
    ];

    const steps: TrackingStep[] = stepDefs.map((s, idx) => {
      const ts = new Date(base.getTime() + s.offsetHours * 3600 * 1000);
      return {
        code: s.code,
        labelAr: s.labelAr,
        labelFr: s.labelFr,
        location: s.location,
        timestamp: ts.toISOString(),
        completed: currentIdx >= idx,
      };
    });

    const est = new Date(base.getTime() + 30 * 3600 * 1000);
    return {
      trackingNumber: params.trackingNumber,
      partner: params.partner,
      currentStatus: params.status,
      estimatedDelivery: est.toISOString(),
      carbonNeutralCourier: true,
      steps,
    };
  }
}

export const logisticsService: LogisticsService =
  new MockAlgerianLogisticsService();
