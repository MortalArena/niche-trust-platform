import type { ChainId } from '@/lib/chains/config';
import { CHAINS } from '@/lib/chains/config';
import { rpcPool } from '@/lib/solana/rpc-pool';
import { getPlatformWalletForChain } from '@/lib/platform/config';

export interface PlatformPaymentVerification {
  valid: boolean;
  reason?: string;
}

export async function verifyPlatformPayment(params: {
  txSig: string;
  chain: ChainId;
  platformWallet: string;
  paymentReference: string;
  minAmountUsd?: number;
}): Promise<PlatformPaymentVerification> {
  const platformWallet = params.platformWallet.toLowerCase();
  const config = CHAINS[params.chain];

  if (!config) {
    return { valid: false, reason: 'Unsupported chain' };
  }

  if (config.family === 'solana') {
    return verifySolanaPlatformPayment(params.txSig, platformWallet, params.paymentReference);
  }

  return verifyEvmPlatformPayment(params.txSig, params.chain, platformWallet);
}

async function verifySolanaPlatformPayment(
  signature: string,
  platformWallet: string,
  reference: string
): Promise<PlatformPaymentVerification> {
  try {
    const tx = await rpcPool.call((conn) =>
      conn.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      })
    );

    if (!tx || tx.meta?.err) {
      return { valid: false, reason: 'Transaction failed or not found' };
    }

    const memoLog = tx.meta?.logMessages?.find((l) => l.includes('Memo')) ?? '';
    const accountKeys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === 'string' ? k : k.pubkey.toBase58()
    );

    const hasPlatform = accountKeys.some((k) => k.toLowerCase() === platformWallet);
    const memoMatch =
      memoLog.toLowerCase().includes(reference.toLowerCase()) ||
      JSON.stringify(tx.meta?.logMessages ?? [])
        .toLowerCase()
        .includes(reference.toLowerCase());

    if (!hasPlatform) {
      return {
        valid: false,
        reason: `Payment must be sent to platform wallet ${platformWallet.slice(0, 8)}...`,
      };
    }

    if (!memoMatch) {
      return {
        valid: false,
        reason: `Include reference "${reference}" in transaction memo`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Could not read Solana transaction' };
  }
}

async function verifyEvmPlatformPayment(
  txSig: string,
  chain: ChainId,
  platformWallet: string
): Promise<PlatformPaymentVerification> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const chainConfig = CHAINS[chain];
  if (!apiKey || !chainConfig.etherscanChainId) {
    return { valid: false, reason: 'ETHERSCAN_API_KEY required for EVM payment verification' };
  }

  const url = new URL('https://api.etherscan.io/v2/api');
  url.searchParams.set('chainid', String(chainConfig.etherscanChainId));
  url.searchParams.set('module', 'proxy');
  url.searchParams.set('action', 'eth_getTransactionByHash');
  url.searchParams.set('txhash', txSig);
  url.searchParams.set('apikey', apiKey);

  try {
    const res = await fetch(url.toString());
    const json = (await res.json()) as {
      result?: { from?: string; to?: string; value?: string; hash?: string } | null;
    };

    const tx = json.result;
    if (!tx?.hash) {
      return { valid: false, reason: 'Transaction not found on chain' };
    }

    const to = (tx.to ?? '').toLowerCase();
    const valueWei = BigInt(tx.value ?? '0');

    if (to === platformWallet && valueWei > BigInt(0)) {
      return { valid: true };
    }

    const tokenUrl = new URL('https://api.etherscan.io/v2/api');
    tokenUrl.searchParams.set('chainid', String(chainConfig.etherscanChainId));
    tokenUrl.searchParams.set('module', 'account');
    tokenUrl.searchParams.set('action', 'tokentx');
    tokenUrl.searchParams.set('address', platformWallet);
    tokenUrl.searchParams.set('page', '1');
    tokenUrl.searchParams.set('offset', '100');
    tokenUrl.searchParams.set('sort', 'desc');
    tokenUrl.searchParams.set('apikey', apiKey);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson = (await tokenRes.json()) as {
      result?: { hash?: string; to?: string; value?: string }[];
    };

    const match = Array.isArray(tokenJson.result)
      ? tokenJson.result.find((t) => t.hash?.toLowerCase() === txSig.toLowerCase())
      : null;

    if (match && (match.to ?? '').toLowerCase() === platformWallet) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Payment must go to platform wallet ${platformWallet.slice(0, 10)}... (USDC or native)`,
    };
  } catch {
    return { valid: false, reason: 'EVM verification failed' };
  }
}

export function assertPlatformWalletConfigured(chain: ChainId): string {
  const wallet = getPlatformWalletForChain(chain);
  if (!wallet) {
    throw new Error(
      `Platform wallet not configured for ${chain}. Set PLATFORM_WALLET_POLYGON or PLATFORM_WALLET_SOLANA in .env`
    );
  }
  return wallet;
}
