export function calculateVariation(
  latest: number | null,
  previous: number | null,
) {
  if (latest === null || previous === null) return null
  return latest - previous
}

export function calculateAverage(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function normalizeChartValue(
  value: number,
  minimum: number,
  maximum: number,
) {
  if (maximum <= minimum) return 50
  return ((value - minimum) / (maximum - minimum)) * 100
}
