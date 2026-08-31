export function priceSummary(price: number | null, threshold: number | null, stale = false, previous: number | null = null) {
  const valid = (value: number | null): value is number => value !== null && Number.isFinite(value) && value > 0;
  const current = valid(price) ? price : null;
  const limit = valid(threshold) ? threshold : null;
  const oldPrice = !stale && current !== null && valid(previous) ? previous : null;
  const difference = oldPrice !== null && current !== null ? current - oldPrice : null;
  return {
    current,
    limit,
    previous: oldPrice,
    difference,
    percent: difference !== null && oldPrice !== null ? Math.round(Math.abs(difference) / oldPrice * 100) : null,
    gap: !stale && current !== null && limit !== null ? Math.max(0, current - limit) : null,
    reached: !stale && current !== null && limit !== null && current <= limit,
  };
}
