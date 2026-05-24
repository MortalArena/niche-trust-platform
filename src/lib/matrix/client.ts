import { logger } from '@/lib/logger';

export function isMatrixConfigured(): boolean {
  return Boolean(process.env.MATRIX_HOMESERVER && process.env.MATRIX_ADMIN_TOKEN);
}

function matrixBase(): string {
  return process.env.MATRIX_HOMESERVER!.replace(/\/$/, '');
}

function matrixHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.MATRIX_ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function matrixRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${matrixBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...matrixHeaders(), ...options.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Matrix API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function pingMatrix(): Promise<boolean> {
  if (!isMatrixConfigured()) return false;
  try {
    await matrixRequest<{ versions: string[] }>('/_matrix/client/versions');
    return true;
  } catch (error) {
    logger.error({ error }, 'Matrix ping failed');
    return false;
  }
}

export function getMatrixRoomUrl(roomId: string): string {
  const publicBase =
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_URL ?? 'https://app.element.io';
  const encoded = encodeURIComponent(roomId);
  return `${publicBase}/#/room/${encoded}`;
}
