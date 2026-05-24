import { matrixRequest } from '@/lib/matrix/client';
import { logger } from '@/lib/logger';

interface CreateRoomResponse {
  room_id: string;
}

export async function createEncryptedRoom(
  name: string,
  inviteMatrixIds: string[] = []
): Promise<string | null> {
  try {
    const result = await matrixRequest<CreateRoomResponse>(
      '/_matrix/client/v3/createRoom',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          preset: 'private_chat',
          visibility: 'private',
          invite: inviteMatrixIds.length > 0 ? inviteMatrixIds : undefined,
          initial_state: [
            {
              type: 'm.room.encryption',
              state_key: '',
              content: { algorithm: 'm.megolm.v1.aes-sha2' },
            },
          ],
        }),
      }
    );

    logger.info({ roomId: result.room_id, name }, 'Matrix room created');
    return result.room_id;
  } catch (error) {
    logger.error({ error, name }, 'Failed to create Matrix room');
    return null;
  }
}

export async function inviteUserToRoom(roomId: string, matrixUserId: string): Promise<boolean> {
  try {
    await matrixRequest(`/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`, {
      method: 'POST',
      body: JSON.stringify({ user_id: matrixUserId }),
    });
    return true;
  } catch (error) {
    logger.error({ error, roomId, matrixUserId }, 'Failed to invite user');
    return false;
  }
}

export async function kickUserFromRoom(
  roomId: string,
  matrixUserId: string,
  reason?: string
): Promise<boolean> {
  try {
    await matrixRequest(`/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/kick`, {
      method: 'POST',
      body: JSON.stringify({ user_id: matrixUserId, reason: reason ?? 'Subscription expired' }),
    });
    return true;
  } catch (error) {
    logger.error({ error, roomId, matrixUserId }, 'Failed to kick user');
    return false;
  }
}
