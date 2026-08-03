export function estimateOneRepMax(loadKg: number, repetitions: number) {
  if (loadKg <= 0 || repetitions <= 0) return 0
  return loadKg * (1 + repetitions / 30)
}

export function getProgressionSuggestion(input: {
  completedSets: number
  targetSets: number
  repetitions: number[]
  minReps: number
  maxReps: number
  rirValues: number[]
  targetRir: number
  lastLoadKg: number | null
}) {
  if (input.completedSets < input.targetSets) {
    return 'Complete todas as séries antes de progredir.'
  }

  const allAtTopRange =
    input.repetitions.length > 0 &&
    input.repetitions.every((value) => value >= input.maxReps)

  const effortControlled =
    input.rirValues.length > 0 &&
    input.rirValues.every((value) => value >= input.targetRir)

  if (allAtTopRange && effortControlled) {
    if (input.lastLoadKg === null || input.lastLoadKg <= 0) {
      return 'Defina uma carga base na próxima sessão.'
    }

    const suggestedIncrease =
      input.lastLoadKg < 20 ? 1 : input.lastLoadKg < 60 ? 2.5 : 5

    return `Sugestão: aumentar para ${(
      input.lastLoadKg + suggestedIncrease
    ).toLocaleString('pt-BR')} kg.`
  }

  const belowMinimum = input.repetitions.some(
    (value) => value < input.minReps,
  )

  if (belowMinimum) {
    return 'Mantenha ou reduza a carga até atingir a faixa mínima.'
  }

  return 'Mantenha a carga e busque mais repetições com boa técnica.'
}
