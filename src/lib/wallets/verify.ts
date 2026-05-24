import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { verifyMessage } from 'viem';
import { CHAINS, type ChainId, normalizeAddress } from '@/lib/chains/config';

export async function verifyWalletSignature(params: {
  chain: ChainId;
  address: string;
  message: string;
  signature: string;
}): Promise<boolean> {
  const chain = CHAINS[params.chain];
  if (!chain) return false;

  try {
    if (chain.family === 'solana') {
      return nacl.sign.detached.verify(
        new TextEncoder().encode(params.message),
        bs58.decode(params.signature),
        bs58.decode(params.address)
      );
    }

    return await verifyMessage({
      address: normalizeAddress(params.chain, params.address) as `0x${string}`,
      message: params.message,
      signature: params.signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}
