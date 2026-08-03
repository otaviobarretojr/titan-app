const TITAN_TIMEZONE = 'America/Manaus'

export function getTitanLocalDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TITAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Não foi possível calcular a data local do TITAN.')
  }

  return `${year}-${month}-${day}`
}

export function getTitanCurrentMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TITAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0,
  )

  return hour * 60 + minute
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}
