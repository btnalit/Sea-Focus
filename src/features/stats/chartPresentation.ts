export interface GardenChartInput {
  name: string;
  value: number;
  color: string;
  helper: string;
}

export interface GardenChartSegment extends GardenChartInput {
  percentage: number;
  offset: number;
}

/**
 * Converts raw chart items into normalized garden chart segments.
 *
 * @param items chart items with numeric values
 * @returns positive-value segments with percentage and cumulative offsets
 */
export function buildGardenChartSegments(items: GardenChartInput[]): GardenChartSegment[] {
  const positiveItems = items.filter((item) => item.value > 0);
  const total = positiveItems.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return [];

  let offset = 0;

  return positiveItems.map((item) => {
    const percentage = Math.round((item.value / total) * 1000) / 10;
    const segment = {
      ...item,
      percentage,
      offset,
    };
    offset += item.value / total;
    return segment;
  });
}
