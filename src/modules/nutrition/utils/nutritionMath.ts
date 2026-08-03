export function getMacroPercentage(value: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)))
}

export function calculateRemainingMacros(input: {
  caloriesConsumedKcal: number
  calorieTargetKcal: number
  proteinConsumedG: number
  proteinTargetG: number
}) {
  return {
    caloriesRemainingKcal: Math.max(
      0,
      input.calorieTargetKcal - input.caloriesConsumedKcal,
    ),
    proteinRemainingG: Math.max(
      0,
      input.proteinTargetG - input.proteinConsumedG,
    ),
  }
}
