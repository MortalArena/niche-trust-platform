import { prisma } from '@/lib/db';
import {
  type ChainId,
  isValidAddress,
  normalizeAddress,
} from '@/lib/chains/config';
import { verifyWalletSignature } from '@/lib/wallets/verify';

export async function linkWalletToUser(params: {
  userId: string;
  chain: ChainId;
  address: string;
  message: string;
  signature: string;
  label?: string;
  setPrimary?: boolean;
}) {
  if (!isValidAddress(params.chain, params.address)) {
    throw new Error('Invalid address for chain');
  }

  const valid = await verifyWalletSignature({
    chain: params.chain,
    address: params.address,
    message: params.message,
    signature: params.signature,
  });

  if (!valid) throw new Error('Invalid signature');

  const address = normalizeAddress(params.chain, params.address);

  const existing = await prisma.wallet.findUnique({
    where: { address_chain: { address, chain: params.chain } },
  });

  if (existing && existing.userId !== params.userId) {
    throw new Error('Wallet already linked to another account');
  }

  if (existing) return existing;

  if (params.setPrimary) {
    await prisma.wallet.updateMany({
      where: { userId: params.userId },
      data: { isPrimary: false },
    });
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId: params.userId,
      address,
      chain: params.chain,
      label: params.label,
      isPrimary: params.setPrimary ?? false,
    },
  });

  const walletCount = await prisma.wallet.count({ where: { userId: params.userId } });
  if (walletCount === 1 || params.setPrimary) {
    await prisma.user.update({
      where: { id: params.userId },
      data: { walletAddress: address },
    });
  }

  return wallet;
}

export async function findOrCreateUserFromWallet(params: {
  chain: ChainId;
  address: string;
  message: string;
  signature: string;
}) {
  const valid = await verifyWalletSignature(params);
  if (!valid) return null;

  const address = normalizeAddress(params.chain, params.address);

  const existingWallet = await prisma.wallet.findUnique({
    where: { address_chain: { address, chain: params.chain } },
    include: { user: true },
  });

  if (existingWallet) return existingWallet.user;

  const user = await prisma.user.create({
    data: {
      walletAddress: address,
      displayName: formatDisplayName(address, params.chain),
    },
  });

  await prisma.wallet.create({
    data: {
      userId: user.id,
      address,
      chain: params.chain,
      isPrimary: true,
    },
  });

  return user;
}

function formatDisplayName(address: string, chain: ChainId): string {
  if (chain === 'solana') {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
