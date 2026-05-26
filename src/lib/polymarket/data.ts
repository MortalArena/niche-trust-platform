import { DATA } from '@/lib/polymarket/config';
import { dataFetch } from '@/lib/polymarket/client';
import type {
  PolymarketActivity,
  PolymarketPosition,
  PolymarketTrade,
} from '@/lib/polymarket/types';

function normalizeAddress(address: string): string {
  return address.startsWith('0x') ? address.toLowerCase() : address;
}

export async function getTradesForUser(
  userAddress: string,
  limit = 100,
  offset = 0
): Promise<PolymarketTrade[]> {
  return dataFetch<PolymarketTrade[]>(DATA.trades, {
    user: normalizeAddress(userAddress),
    limit,
    offset,
    takerOnly: false,
  });
}

export async function getPositionsForUser(
  userAddress: string,
  limit = 100
): Promise<PolymarketPosition[]> {
  return dataFetch<PolymarketPosition[]>(DATA.positions, {
    user: normalizeAddress(userAddress),
    limit,
    sizeThreshold: 0,
  });
}

export async function getActivityForUser(
  userAddress: string,
  limit = 50
): Promise<PolymarketActivity[]> {
  return dataFetch<PolymarketActivity[]>(DATA.activity, {
    user: normalizeAddress(userAddress),
    limit,
  });
}

export async function getPositionValue(userAddress: string): Promise<{ value?: number }[]> {
  return dataFetch<{ value?: number }[]>(DATA.value, {
    user: normalizeAddress(userAddress),
  });
}

export async function getClosedPositionsForUser(
  userAddress: string,
  limit = 100
): Promise<PolymarketPosition[]> {
  return dataFetch<PolymarketPosition[]>(DATA.closedPositions, {
    user: normalizeAddress(userAddress),
    limit,
  });
}
