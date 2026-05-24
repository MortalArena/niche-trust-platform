interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, max = 5, size = 'md' }: StarRatingProps) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-lg';
  const full = Math.round(rating * 10) / 10;

  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize}`} title={`${full} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < Math.round(full) ? 'text-amber-400' : 'text-zinc-600'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-zinc-500">({full.toFixed(1)})</span>
    </span>
  );
}
