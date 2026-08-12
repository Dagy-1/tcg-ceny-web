export type PricedSelection = {
  price: number | null;
  quantity: number;
};

export type ComparisonSummary = {
  mineTotal: number;
  comparedTotal: number;
  difference: number;
  differencePercent: number;
  balanced: boolean;
};

export function selectionTotal(items: PricedSelection[]): number {
  return items.reduce(
    (sum, item) => sum + (item.price ?? 0) * Math.max(0, item.quantity),
    0,
  );
}

export function comparisonSummary(
  mine: PricedSelection[],
  compared: PricedSelection[],
): ComparisonSummary {
  const mineTotal = selectionTotal(mine);
  const comparedTotal = selectionTotal(compared);
  const difference = mineTotal - comparedTotal;
  const referenceValue = Math.max(mineTotal, comparedTotal);
  const differencePercent = referenceValue > 0
    ? Math.abs(difference) / referenceValue * 100
    : 0;

  return {
    mineTotal,
    comparedTotal,
    difference,
    differencePercent,
    balanced: differencePercent <= 3,
  };
}
