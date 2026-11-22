import { db } from '../db/index.ts';
import { notifications } from '../db/schema.ts';

export interface NotificationPayload {
  userId: number;
  titleAr: string;
  titleFr: string;
  bodyAr: string;
  bodyFr: string;
  channel?: 'IN_APP' | 'EMAIL_MOCK' | 'SMS_MOCK';
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
}

export class DbNotificationService implements NotificationService {
  async send(payload: NotificationPayload): Promise<void> {
    try {
      await db.insert(notifications).values({
        userId: payload.userId,
        titleAr: payload.titleAr,
        titleFr: payload.titleFr,
        bodyAr: payload.bodyAr,
        bodyFr: payload.bodyFr,
        read: false,
      });
    } catch (error) {
      console.error('Failed to persist notification:', error);
    }
  }
}

export const notificationService: NotificationService =
  new DbNotificationService();
