import type { ParsedTransactionWithMeta } from '@solana/web3.js';

export interface TxClassification {
  type: 'swap' | 'transfer' | 'nft' | 'other';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: number;
  amountOut?: number;
}

const JUPITER_PROGRAMS = new Set([
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  'JUP3c2Uh3WA4Ng34tw6kNd2Z4pUxkAohkFdS8vqvKq',
]);

export function classifyParsedTransaction(
  tx: ParsedTransactionWithMeta | null
): TxClassification {
  if (!tx?.meta || tx.meta.err) {
    return { type: 'other' };
  }

  const instructions = tx.transaction.message.instructions;
  let hasJupiter = false;

  for (const ix of instructions) {
    const programId =
      'programId' in ix ? ix.programId.toString() : (ix as { program?: string }).program;
    if (programId && JUPITER_PROGRAMS.has(programId)) {
      hasJupiter = true;
    }
  }

  const preTokens = tx.meta.preTokenBalances ?? [];
  const postTokens = tx.meta.postTokenBalances ?? [];

  if (preTokens.length > 0 && postTokens.length > 0) {
    const deltas = computeTokenDeltas(preTokens, postTokens);
    const spent = deltas.filter((d) => d.delta < 0);
    const received = deltas.filter((d) => d.delta > 0);

    if (spent.length > 0 && received.length > 0) {
      const tokenIn = spent[0];
      const tokenOut = received[0];
      return {
        type: hasJupiter ? 'swap' : 'transfer',
        tokenIn: tokenIn.mint,
        tokenOut: tokenOut.mint,
        amountIn: Math.abs(tokenIn.delta),
        amountOut: tokenOut.delta,
      };
    }
  }

  const preSol = tx.meta.preBalances[0] ?? 0;
  const postSol = tx.meta.postBalances[0] ?? 0;
  const solDelta = (postSol - preSol) / 1e9;

  if (Math.abs(solDelta) > 0.001) {
    return {
      type: hasJupiter ? 'swap' : 'transfer',
      tokenIn: solDelta < 0 ? 'SOL' : undefined,
      tokenOut: solDelta > 0 ? 'SOL' : undefined,
      amountIn: solDelta < 0 ? Math.abs(solDelta) : undefined,
      amountOut: solDelta > 0 ? solDelta : undefined,
    };
  }

  return { type: 'other' };
}

interface TokenDelta {
  mint: string;
  delta: number;
}

function computeTokenDeltas(
  pre: NonNullable<ParsedTransactionWithMeta['meta']>['preTokenBalances'],
  post: NonNullable<ParsedTransactionWithMeta['meta']>['postTokenBalances']
): TokenDelta[] {
  const preMap = new Map<string, number>();
  for (const b of pre ?? []) {
    const key = `${b.accountIndex}-${b.mint}`;
    const amount = parseUiAmount(b.uiTokenAmount.uiAmountString);
    preMap.set(key, amount);
  }

  const deltas: TokenDelta[] = [];
  for (const b of post ?? []) {
    const key = `${b.accountIndex}-${b.mint}`;
    const postAmount = parseUiAmount(b.uiTokenAmount.uiAmountString);
    const preAmount = preMap.get(key) ?? 0;
    const delta = postAmount - preAmount;
    if (Math.abs(delta) > 0) {
      deltas.push({ mint: b.mint, delta });
    }
  }
  return deltas;
}

function parseUiAmount(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
