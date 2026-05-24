import { Decimal } from '@prisma/client/runtime/library';

interface EtherscanTxLike {
  hash: string;
  from: string;
  to: string;
  value: string;
  input: string;
}

export function classifyEvmTransaction(tx: EtherscanTxLike, walletAddress: string) {
  const from = tx.from.toLowerCase();
  const to = (tx.to ?? '').toLowerCase();
  const wallet = walletAddress.toLowerCase();
  const valueWei = BigInt(tx.value || '0');
  const valueEth = Number(valueWei) / 1e18;

  const isContractCall = tx.input && tx.input !== '0x' && tx.input.length > 10;

  if (isContractCall) {
    return {
      type: 'contract' as const,
      tokenIn: null,
      tokenOut: null,
      amountIn: null,
      amountOut: null,
    };
  }

  if (from === wallet && valueEth > 0) {
    return {
      type: 'transfer' as const,
      tokenIn: 'native',
      tokenOut: null,
      amountIn: new Decimal(valueEth),
      amountOut: null,
    };
  }

  if (to === wallet && valueEth > 0) {
    return {
      type: 'transfer' as const,
      tokenIn: null,
      tokenOut: 'native',
      amountIn: null,
      amountOut: new Decimal(valueEth),
    };
  }

  return {
    type: 'other' as const,
    tokenIn: null,
    tokenOut: null,
    amountIn: null,
    amountOut: null,
  };
}
