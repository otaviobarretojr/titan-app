export function calculatePace(
  durationMinutes: number,
  distanceKm: number | null,
) {
  if (!distanceKm || distanceKm <= 0 || durationMinutes <= 0) return null
  return durationMinutes / distanceKm
}

export function formatPace(paceMinutesPerKm: number | null) {
  if (paceMinutesPerKm === null) return '—'

  const minutes = Math.floor(paceMinutesPerKm)
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`
}

export function getCardioFeedback(input: {
  type: 'walking' | 'zone2' | 'running' | 'hiit'
  perceivedEffort: number
  averageHeartRate: number | null
}) {
  if (input.type === 'zone2') {
    if (input.perceivedEffort >= 8) {
      return 'Esforço alto para Zona 2. Reduza o ritmo na próxima sessão.'
    }

    if (input.perceivedEffort <= 6) {
      return 'Esforço compatível com uma sessão sustentável.'
    }
  }

  if (input.type === 'hiit' && input.perceivedEffort < 7) {
    return 'Esforço abaixo do esperado para HIIT.'
  }

  if (input.averageHeartRate === null) {
    return 'Registre a frequência cardíaca quando disponível.'
  }

  return 'Sessão registrada. Compare com o histórico para avaliar evolução.'
}
