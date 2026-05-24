import { Connection, type Commitment } from '@solana/web3.js';
import CircuitBreaker from 'opossum';
import { logger } from '@/lib/logger';

const COMMITMENT: Commitment = 'confirmed';

type RpcCall<T> = (connection: Connection) => Promise<T>;

interface EndpointState {
  url: string;
  failures: number;
  lockedUntil: number;
  breaker: CircuitBreaker<[RpcCall<unknown>], unknown>;
}

export class RpcPool {
  private endpoints: EndpointState[] = [];
  private currentIndex = 0;

  constructor(urls: string[]) {
    this.endpoints = urls
      .filter(Boolean)
      .map((url) => {
        const connection = new Connection(url, { commitment: COMMITMENT });
        const breaker = new CircuitBreaker(
          async (fn: RpcCall<unknown>) => fn(connection),
          {
            timeout: 15_000,
            errorThresholdPercentage: 50,
            resetTimeout: 60_000,
          }
        );

        breaker.on('open', () => logger.warn({ url }, 'RPC circuit open'));
        breaker.on('close', () => logger.info({ url }, 'RPC circuit closed'));

        return { url, failures: 0, lockedUntil: 0, breaker };
      });
  }

  async call<T>(fn: RpcCall<T>): Promise<T> {
    const available = this.endpoints.filter((e) => Date.now() > e.lockedUntil);
    if (available.length === 0) {
      throw new Error('All RPC endpoints are unavailable');
    }

    let lastError: Error | null = null;

    for (let i = 0; i < available.length; i++) {
      const endpoint = available[(this.currentIndex + i) % available.length];
      try {
        const result = (await endpoint.breaker.fire(fn)) as T;
        this.currentIndex = (this.currentIndex + 1) % available.length;
        endpoint.failures = 0;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        endpoint.failures += 1;
        logger.warn({ url: endpoint.url, failures: endpoint.failures }, 'RPC call failed');
        if (endpoint.failures >= 5) {
          endpoint.lockedUntil = Date.now() + 60_000;
        }
      }
    }

    throw lastError ?? new Error('All RPC calls failed');
  }
}

function getRpcUrls(): string[] {
  return [
    process.env.SOLANA_RPC_PRIMARY,
    process.env.SOLANA_RPC_FALLBACK_1,
    process.env.SOLANA_RPC_FALLBACK_2,
    'https://api.mainnet-beta.solana.com',
  ].filter((u): u is string => Boolean(u));
}

export const rpcPool = new RpcPool(getRpcUrls());
