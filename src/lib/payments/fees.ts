export function calculatePlatformFee(amountUsd: number, feeBps: number) {
  const platformFeeUsd = Math.round(amountUsd * (feeBps / 10000) * 100) / 100;
  const expertNetUsd = Math.round((amountUsd - platformFeeUsd) * 100) / 100;
  return { platformFeeUsd, expertNetUsd, platformFeeBps: feeBps };
}

export function buildPaymentReference(groupId: string, userId: string): string {
  return `NT-${groupId.slice(0, 8)}-${userId.slice(0, 8)}`;
}

export function getPriceForCycle(
  cycle: 'monthly' | 'yearly' | 'lifetime',
  group: { monthlyPriceUsd: { toNumber?: () => number } | number; yearlyPriceUsd?: { toNumber?: () => number } | number | null; lifetimePriceUsd?: { toNumber?: () => number } | number | null }
): number {
  const monthly = Number(group.monthlyPriceUsd);
  const yearly = group.yearlyPriceUsd != null ? Number(group.yearlyPriceUsd) : null;
  const lifetime = group.lifetimePriceUsd != null ? Number(group.lifetimePriceUsd) : null;

  if (cycle === 'yearly' && yearly != null) return yearly;
  if (cycle === 'lifetime' && lifetime != null) return lifetime;
  return monthly;
}
