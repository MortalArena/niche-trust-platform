import { GAMMA } from '@/lib/polymarket/config';
import { gammaFetch, PolymarketApiError } from '@/lib/polymarket/client';
import type { PolymarketPublicProfile } from '@/lib/polymarket/types';

/**
 * Resolves proxy wallet for Polymarket Data API queries.
 * Docs: public-profile accepts proxy wallet OR user address.
 */
export async function resolvePolymarketProfile(
  walletAddress: string
): Promise<PolymarketPublicProfile | null> {
  const address = walletAddress.startsWith('0x')
    ? walletAddress.toLowerCase()
    : walletAddress;

  try {
    const profile = await gammaFetch<PolymarketPublicProfile>(GAMMA.publicProfile, {
      address,
    });
    return profile;
  } catch (e) {
    if (e instanceof PolymarketApiError && e.status === 404) {
      return null;
    }
    throw e;
  }
}

export function dataApiUserAddress(
  profile: PolymarketPublicProfile | null,
  fallbackEoa: string
): string {
  return (profile?.proxyWallet ?? fallbackEoa).toLowerCase();
}
