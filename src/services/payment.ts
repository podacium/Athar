import crypto from 'crypto';

export type PaymentMethodType = 'COD' | 'SATIM' | 'BARIDIMOB';

export interface PaymentRequest {
  method: PaymentMethodType;
  amountDzd: number;
  orderId?: number;
  simulateOutcome?: 'SUCCESS' | 'FAILURE';
  phoneOrCardLast4?: string;
}

export interface PaymentResult {
  success: boolean;
  status: 'PENDING' | 'PAID' | 'FAILED';
  transactionRef: string;
  provider: string;
  messageAr: string;
  messageFr: string;
}

export interface PaymentService {
  processPayment(req: PaymentRequest): Promise<PaymentResult>;
}

export class MockAlgerianPaymentService implements PaymentService {
  async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();

    if (req.method === 'COD') {
      return {
        success: true,
        status: 'PENDING',
        transactionRef: `COD-DZ-${token}`,
        provider: 'Cash on Delivery Algeria',
        messageAr: 'تم تأكيد الدفع عند الاستلام بنجاح.',
        messageFr: 'Paiement à la livraison (COD) confirmé.',
      };
    }

    const provider =
      req.method === 'SATIM' ? 'SATIM CIB (Mock)' : 'Algérie Poste BaridiMob (Mock)';

    if (req.simulateOutcome === 'FAILURE') {
      return {
        success: false,
        status: 'FAILED',
        transactionRef: `${req.method}-ERR-${token}`,
        provider,
        messageAr: 'تعذر إتمام الدفع الإلكتروني (محاكاة رفض البنك). يرجى المحاولة أو اختيار الدفع عند الاستلام.',
        messageFr:
          'Échec du paiement électronique (simulation refus bancaire). Réessayez ou choisissez le paiement à la livraison.',
      };
    }

    return {
      success: true,
      status: 'PAID',
      transactionRef: `${req.method}-DZ-${token}`,
      provider,
      messageAr: `تم الدفع بنجاح عبر ${req.method === 'SATIM' ? 'بطاقة CIB / SATIM' : 'بريدي موب'}.`,
      messageFr: `Paiement approuvé via ${provider}.`,
    };
  }
}

export const paymentService: PaymentService = new MockAlgerianPaymentService();
