/**
 * Chains aligned with Polymarket bridge support.
 * Trading performance is analyzed on the chain where activity occurred.
 * Solana is used only for fast/cheap prediction hash attestation (Memo).
 */

export type ChainId =
  | 'polygon'
  | 'ethereum'
  | 'arbitrum'
  | 'base'
  | 'optimism'
  | 'bnb'
  | 'solana';

export type ChainFamily = 'evm' | 'solana';

export interface ChainConfig {
  id: ChainId;
  name: string;
  family: ChainFamily;
  /** Etherscan v2 multichain API chain id */
  etherscanChainId?: number;
  /** Primary chain for Polymarket collateral (pUSD) */
  isPolymarketTrading?: boolean;
  explorerTxUrl: (hash: string) => string;
  addressPattern: RegExp;
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    family: 'evm',
    etherscanChainId: 137,
    isPolymarketTrading: true,
    explorerTxUrl: (h) => `https://polygonscan.com/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    family: 'evm',
    etherscanChainId: 1,
    explorerTxUrl: (h) => `https://etherscan.io/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    family: 'evm',
    etherscanChainId: 42161,
    explorerTxUrl: (h) => `https://arbiscan.io/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  base: {
    id: 'base',
    name: 'Base',
    family: 'evm',
    etherscanChainId: 8453,
    explorerTxUrl: (h) => `https://basescan.org/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    family: 'evm',
    etherscanChainId: 10,
    explorerTxUrl: (h) => `https://optimistic.etherscan.io/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  bnb: {
    id: 'bnb',
    name: 'BNB Smart Chain',
    family: 'evm',
    etherscanChainId: 56,
    explorerTxUrl: (h) => `https://bscscan.com/tx/${h}`,
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    family: 'solana',
    explorerTxUrl: (h) => `https://solscan.io/tx/${h}`,
    addressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
};

/** Chains used for Polymarket-style trading performance */
export const PERFORMANCE_CHAINS: ChainId[] = [
  'polygon',
  'ethereum',
  'arbitrum',
  'base',
  'optimism',
  'bnb',
  'solana',
];

/** Solana-only: prediction attestation, not trading PnL */
export const ATTESTATION_CHAIN: ChainId = 'solana';

export function getChain(id: string): ChainConfig | undefined {
  return CHAINS[id as ChainId];
}

export function isValidAddress(chainId: ChainId, address: string): boolean {
  const chain = CHAINS[chainId];
  return chain?.addressPattern.test(address) ?? false;
}

export function normalizeAddress(chainId: ChainId, address: string): string {
  if (CHAINS[chainId].family === 'evm') {
    return address.toLowerCase();
  }
  return address;
}
