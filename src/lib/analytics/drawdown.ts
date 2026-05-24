export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length < 2) return 0;

  let peak = equityCurve[0];
  let maxDrawdown = 0;

  for (const equity of equityCurve) {
    if (equity > peak) peak = equity;
    if (peak <= 0) continue;
    const drawdown = ((peak - equity) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return maxDrawdown;
}
