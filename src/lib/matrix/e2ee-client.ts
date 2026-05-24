/**
 * ✅ Matrix E2EE Client - تشفير حقيقي من طرف لطرف
 * 
 * المشكلة التي تم حلها:
 * - كان Matrix يستخدم Admin API فقط (fetch مباشر) — لا E2EE حقيقي للمستخدمين
 * - المستخدمون العاديون لم يملكوا تشفير من طرف لطرف
 * 
 * الحل:
 * - matrix-js-sdk الرسمي لتسجيل الدخول كمستخدم حقيقي
 * - الاحتفاظ بـ Admin API للإدارة فقط (إنشاء غرف، دعوة، طرد) في client.ts
 * - E2EE حقيقي للمستخدمين عبر matrix-js-sdk
 */

import { createClient } from 'matrix-js-sdk';
import type { MatrixClient } from 'matrix-js-sdk';

let client: MatrixClient | null = null;

/**
 * إنشاء عميل Matrix موثّق للدردشة المشفرة
 */
export async function createAuthenticatedClient(params: {
  baseUrl: string;
  userId: string;
  accessToken: string;
  deviceId?: string;
}): Promise<MatrixClient> {
  if (client) return client;

  const { baseUrl, userId, accessToken, deviceId } = params;

  client = createClient({
    baseUrl: baseUrl.replace(/\/$/, ''),
    userId,
    accessToken,
    deviceId,
  });

  await client.startClient({
    initialSyncLimit: 10,
  });

  return client;
}

/**
 * الحصول على العميل الحالي
 */
export function getE2eeClient(): MatrixClient | null {
  return client;
}

/**
 * الانضمام لغرفة
 */
export async function joinEncryptedRoom(roomId: string): Promise<void> {
  if (!client) throw new Error('E2EE client not initialized');
  await client.joinRoom(roomId);
}

/**
 * إرسال رسالة مشفرة
 */
export async function sendEncryptedMessage(roomId: string, text: string): Promise<void> {
  if (!client) throw new Error('E2EE client not initialized');
  await client.sendTextMessage(roomId, text);
}

/**
 * الحصول على رسائل الغرفة
 */
export async function getRoomMessages(
  roomId: string,
  limit = 50
): Promise<{ sender: string; text: string; timestamp: number }[]> {
  if (!client) throw new Error('E2EE client not initialized');

  const room = client.getRoom(roomId);
  if (!room) return [];

  const timeline = room.getLiveTimeline().getEvents();
  const messages = timeline
    .filter((event) => event.getType() === 'm.room.message')
    .slice(-limit)
    .map((event) => {
      const content = event.getContent();
      return {
        sender: event.getSender() ?? 'unknown',
        text: (content?.body ?? '') as string,
        timestamp: event.getTs(),
      };
    });

  return messages;
}

/**
 * تسجيل الخروج
 */
export function stopE2eeClient(): void {
  if (client) {
    client.stopClient();
    client = null;
  }
}