import { POLYMARKET } from '@/lib/polymarket/config';
import { logger } from '@/lib/logger';

export class PolymarketApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = 'PolymarketApiError';
  }
}

export async function gammaFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return polymarketFetch<T>(POLYMARKET.gamma, path, params);
}

export async function dataFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return polymarketFetch<T>(POLYMARKET.data, path, params);
}

async function polymarketFetch<T>(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  if (!res.ok) {
    logger.warn({ url: url.toString(), status: res.status, text }, 'Polymarket API error');
    throw new PolymarketApiError(`Polymarket ${res.status}`, res.status, text);
  }

  return JSON.parse(text) as T;
}
