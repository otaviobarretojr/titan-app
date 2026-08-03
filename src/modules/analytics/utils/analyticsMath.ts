export function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function percentage(value: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)))
}

export function normalize(
  value: number,
  minimum: number,
  maximum: number,
) {
  if (maximum <= minimum) return 50
  return ((value - minimum) / (maximum - minimum)) * 100
}
