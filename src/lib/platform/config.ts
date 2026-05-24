import { prisma } from '@/lib/db';

export const DEFAULT_PLATFORM_FEE_BPS = 500; // 5%

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: 'default',
        platformFeeBps: DEFAULT_PLATFORM_FEE_BPS,
        platformWalletPolygon: process.env.PLATFORM_WALLET_POLYGON ?? null,
        platformWalletSolana: process.env.PLATFORM_WALLET_SOLANA ?? null,
      },
    });
  }

  return settings;
}

export function getPlatformWalletForChain(chain: string): string | null {
  if (chain === 'solana') {
    return process.env.PLATFORM_WALLET_SOLANA ?? null;
  }
  return process.env.PLATFORM_WALLET_POLYGON ?? process.env.PLATFORM_WALLET ?? null;
}

export function isAdminWallet(address: string | null | undefined): boolean {
  if (!address) return false;
  const list = (process.env.ADMIN_WALLET_ADDRESSES ?? '')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(address.toLowerCase());
}
