import type { TitanTimelineEvent, TitanTimelineGroup } from '../types/coach'

export function buildTitanTimeline(events: TitanTimelineEvent[], today: string): TitanTimelineEvent[] {
  const cutoff = new Date(`${today}T12:00:00Z`).getTime() - 29 * 86_400_000
  return [...new Map(events.filter(event => Date.parse(`${event.localDate}T12:00:00Z`) >= cutoff).map(event => [event.id, event])).values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}
export function timelineGroup(localDate: string, today: string): TitanTimelineGroup {
  const days = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${localDate}T12:00:00Z`)) / 86_400_000)
  return days <= 0 ? 'Hoje' : days === 1 ? 'Ontem' : days <= 7 ? 'Últimos 7 dias' : 'Últimos 30 dias'
}
