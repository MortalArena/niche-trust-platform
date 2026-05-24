export interface InjectedEthereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isBraveWallet?: boolean;
  providers?: InjectedEthereum[];
}

export function getInjectedEthereum(): InjectedEthereum | null {
  if (typeof window === 'undefined') return null;

  const win = window as Window & { ethereum?: InjectedEthereum };
  const eth = win.ethereum;
  if (!eth) return null;

  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const metaMask = eth.providers.find((p: InjectedEthereum) => p.isMetaMask);
    return metaMask ?? eth.providers[0] ?? null;
  }

  return eth;
}

export function hasInjectedWallet(): boolean {
  return getInjectedEthereum() !== null;
}
