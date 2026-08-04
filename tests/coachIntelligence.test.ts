import { describe, expect, it } from 'vitest'
import { calculateTrends, generateCoachAlerts, generateHistoricalInsights } from '../src/modules/coach/engine/coachEngine'
import { buildTitanTimeline, timelineGroup } from '../src/modules/coach/engine/timelineEngine'

const day=(date:string,extra:Record<string,number>)=>({date,...extra})
describe('Coach TITAN Intelligence',()=>{
  it('não inventa insight nem tendência sem dados suficientes',()=>{expect(generateHistoricalInsights([])).toEqual([]);expect(calculateTrends([day('2026-08-01',{weight:80})],'quarterly')).toEqual([])})
  it('analisa as janelas de 7, 30 e 90 dias com ao menos duas amostras',()=>{const rows=[day('2026-01-01',{score:80}),day('2026-01-02',{score:82}),day('2026-07-31',{score:60}),day('2026-08-01',{score:58})];expect(['weekly','monthly','quarterly'].map(p=>calculateTrends(rows,p as 'weekly'|'monthly'|'quarterly')[0].sampleSize)).toEqual([2,2,2])})
  it('prioriza alertas críticos antes dos importantes',()=>{const rows=[1,2,3].map(n=>day(`2026-07-2${n}`,{protein:150,proteinTarget:150,hydration:2500,hydrationTarget:2500,sleep:480,sleepTarget:480})).concat([1,2,3].map(n=>day(`2026-08-0${n}`,{protein:50,proteinTarget:150,hydration:500,hydrationTarget:2500,sleep:300,sleepTarget:480})));const alerts=generateCoachAlerts(rows);expect(alerts.slice(0,3).every(x=>x.priority==='high')).toBe(true);expect(new Set(alerts.map(x=>x.id)).size).toBe(alerts.length)})
  it('não duplica eventos e ordena a timeline',()=>{const event={id:'1',type:'workout' as const,title:'Treino registrado',occurredAt:'2026-08-03T10:00:00Z',localDate:'2026-08-03',detail:'Persistido'};expect(buildTitanTimeline([event,event],'2026-08-04')).toEqual([event]);expect(timelineGroup('2026-08-03','2026-08-04')).toBe('Ontem')})
})
