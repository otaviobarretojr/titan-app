export type OptionalNumber = number | null | undefined

export function validateOptionalNumber(
  label: string,
  value: OptionalNumber,
  min: number,
  max: number,
) {
  if (value === null || value === undefined) return

  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} deve estar entre ${min} e ${max}.`)
  }
}

export function validateBodyMetric(input: Record<string, unknown>) {
  validateOptionalNumber(
    'Peso',
    input.weightKg as OptionalNumber,
    20,
    500,
  )

  const fields: Record<string, string> = {
    waistCm: 'Cintura',
    rightArmCm: 'Braço direito',
    leftArmCm: 'Braço esquerdo',
    chestCm: 'Peito',
    rightThighCm: 'Coxa direita',
    leftThighCm: 'Coxa esquerda',
    rightCalfCm: 'Panturrilha direita',
    leftCalfCm: 'Panturrilha esquerda',
    hipCm: 'Quadril',
    neckCm: 'Pescoço',
  }

  for (const [key, label] of Object.entries(fields)) {
    validateOptionalNumber(
      label,
      input[key] as OptionalNumber,
      10,
      300,
    )
  }
}

export function validateBioimpedance(input: Record<string, unknown>) {
  const ranges: Record<string, [string, number, number]> = {
    bodyFatPercentage: ['Gordura corporal', 1, 75],
    muscleMassKg: ['Massa muscular', 1, 300],
    leanMassKg: ['Massa magra', 1, 400],
    visceralFat: ['Gordura visceral', 0, 100],
    bodyWaterPercentage: ['Água corporal', 1, 90],
    basalMetabolicRateKcal: ['Metabolismo basal', 300, 10000],
    metabolicAge: ['Idade metabólica', 1, 150],
  }

  for (const [key, [label, min, max]] of Object.entries(ranges)) {
    validateOptionalNumber(
      label,
      input[key] as OptionalNumber,
      min,
      max,
    )
  }
}