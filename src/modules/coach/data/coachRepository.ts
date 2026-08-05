import { getTitanCurrentMinutes, getTitanLocalDate, timeToMinutes } from '../../../database/date'
import { titanDatabase, type CoachRecommendationRecord } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import { calculateTitanScore, calculateTrends, generateCoachAlerts, generateCoachInsights, generateExecutiveSummary, generateHistoricalInsights, type DailyCoachSnapshot } from '../engine/coachEngine'
import { buildTitanTimeline } from '../engine/timelineEngine'
import type { CoachCategory, CoachInsight, CoachReport, RecommendationHistory, TitanTimelineEvent, TrendMetric } from '../types/coach'

const DAY = 86_400_000
function dateRange(end: string, count: number) { const base = new Date(`${end}T12:00:00Z`); return Array.from({length:count},(_,i)=>new Date(base.getTime()-(count-1-i)*DAY).toISOString().slice(0,10)) }
const sum = (values: number[]) => values.reduce((total,value)=>total+value,0)
const historyView = (row: CoachRecommendationRecord): RecommendationHistory => ({ id: row.id, localDate: row.localDate, title: row.title, priority: row.priority, category: row.category ?? 'geral', evidence: row.evidence ?? row.message, period: row.period ?? row.localDate, sampleSize: row.sampleSize ?? 1, action: row.action ?? row.message, actionPath: row.actionPath })

export function filterRepeatedInsights(insights: CoachInsight[], history: CoachRecommendationRecord[], today: string) {
  const cooldownDays: Record<CoachInsight['priority'],number> = { high: 2, medium: 4, low: 7 }
  return insights.filter(insight => !history.some(row => row.localDate !== today && row.insightKey === insight.id && Math.floor((new Date(`${today}T12:00:00Z`).getTime()-new Date(`${row.localDate}T12:00:00Z`).getTime())/DAY) < cooldownDays[insight.priority]))
}
export async function persistCoachInsights(insights: CoachInsight[], today: string, history: CoachRecommendationRecord[]) {
  const now = new Date().toISOString()
  const existing = history.length ? history : await titanDatabase.coachRecommendations.where('userId').equals(TITAN_USER_ID).filter(row => row.localDate === today).toArray()
  const rows = insights.filter(insight => !existing.some(row => row.localDate === today && row.insightKey === insight.id)).map(insight => ({ id:`coach-${crypto.randomUUID()}`, userId:TITAN_USER_ID, localDate:today, title:insight.title, message:insight.message, priority:insight.priority, insightKey:insight.id, category:insight.category, evidence:insight.evidence, period:insight.period, sampleSize:insight.sampleSize, action:insight.message, actionPath:insight.actionPath, createdAt:now, updatedAt:now } satisfies CoachRecommendationRecord))
  if (rows.length) await titanDatabase.coachRecommendations.bulkAdd(rows)
}

export async function getCoachReport(): Promise<CoachReport | null> {
  const today=getTitanLocalDate(); const dates=dateRange(today,180); const dateSet=new Set(dates)
  const [plans, mealPlans, workoutPlans, meals, hydration, sleep, workouts, cardio, body, strength, sets, photos, storedHistory] = await Promise.all([
    titanDatabase.dailyPlans.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.mealPlans.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.workoutPlans.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.mealEntries.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.hydrationEntries.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.sleepEntries.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.workoutSessions.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.cardioSessions.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.bodyMetrics.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.exercisePersonalRecords.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.exerciseSets.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.progressPhotos.where('userId').equals(TITAN_USER_ID).filter(x=>dateSet.has(x.localDate)).toArray(),
    titanDatabase.coachRecommendations.where('userId').equals(TITAN_USER_ID).reverse().sortBy('createdAt'),
  ])
  const todayPlan=plans.find(x=>x.localDate===today)
  if (!todayPlan) return null
  const snapshots: DailyCoachSnapshot[] = dates.map(date => {
    const dayMeals=meals.filter(x=>x.localDate===date); const dayHydration=hydration.filter(x=>x.localDate===date); const daySleep=sleep.find(x=>x.localDate===date); const dayBody=body.filter(x=>x.localDate===date).at(-1); const plan=plans.find(x=>x.localDate===date); const plannedMeals=mealPlans.filter(x=>x.localDate===date); const dayWorkouts=workouts.filter(x=>x.localDate===date&&x.status==='completed').length; const dayCardio=cardio.filter(x=>x.localDate===date&&x.status==='completed').length; const dayStrength=strength.filter(x=>x.localDate===date).map(x=>x.estimatedOneRepMaxKg); const daySets=sets.filter(x=>x.localDate===date)
    const protein=dayMeals.length ? sum(dayMeals.map(x=>x.proteinG)) : undefined; const calories=dayMeals.length ? sum(dayMeals.map(x=>x.caloriesKcal)) : undefined; const water=dayHydration.length ? sum(dayHydration.map(x=>x.amountMl)) : undefined; const resolved=dayMeals.filter(x=>x.status!=='skipped').length
    const scoreInput = { currentMinutes:1440, proteinConsumedG:protein??0, proteinTargetG:plan?.proteinTargetG??0, caloriesConsumedKcal:calories??0, calorieTargetKcal:plan?.calorieTargetKcal??0, hydrationConsumedMl:water??0, hydrationTargetMl:plan?.hydrationTargetMl??0, sleepMinutes:daySleep?.durationMinutes??null, sleepTargetMinutes:plan?.sleepTargetMinutes??0, pendingMeals:0, workoutStatus: dayWorkouts?'completed':'none', cardioStatus:dayCardio?'completed':'none', plannedWorkoutMinutes:null, consistency:plannedMeals.length?resolved/plannedMeals.length*100:0, hasNutritionData:dayMeals.length>0, hasHydrationData:dayHydration.length>0, hasConsistencyData:dayMeals.length>0 } as const
    const score=calculateTitanScore(scoreInput).value
    return { date, protein, calories, hydration:water, sleep:daySleep?.durationMinutes, weight:dayBody?.weightKg, waist:dayBody?.waistCm??undefined, training:dayWorkouts||undefined, trainingPlanned:workoutPlans.some(x=>x.localDate===date)?1:undefined, cardio:dayCardio||undefined, score:score??undefined, proteinTarget:plan?.proteinTargetG, calorieTarget:plan?.calorieTargetKcal, hydrationTarget:plan?.hydrationTargetMl, sleepTarget:plan?.sleepTargetMinutes, adherence:plannedMeals.length&&dayMeals.length?resolved/plannedMeals.length*100:undefined, strength:dayStrength.length?Math.max(...dayStrength):undefined, trainingVolume:daySets.length?sum(daySets.map(x=>x.loadKg*x.repetitions)):undefined }
  })
  const todaySnapshot=snapshots.at(-1)!; const todayMealPlans=mealPlans.filter(x=>x.localDate===today); const todayMeals=meals.filter(x=>x.localDate===today); const todayWorkout=workouts.find(x=>x.localDate===today); const todayCardio=cardio.find(x=>x.localDate===today)
  const input={ currentMinutes:getTitanCurrentMinutes(), proteinConsumedG:todaySnapshot.protein??0, proteinTargetG:todayPlan.proteinTargetG, caloriesConsumedKcal:todaySnapshot.calories??0, calorieTargetKcal:todayPlan.calorieTargetKcal, hydrationConsumedMl:todaySnapshot.hydration??0, hydrationTargetMl:todayPlan.hydrationTargetMl, sleepMinutes:todaySnapshot.sleep??null, sleepTargetMinutes:todayPlan.sleepTargetMinutes, pendingMeals:todayMealPlans.filter(p=>!todayMeals.some(e=>e.mealPlanId===p.id)&&timeToMinutes(p.plannedTime)<getTitanCurrentMinutes()).length, workoutStatus:todayWorkout?.status??'none', cardioStatus:todayCardio?.status==='completed'?'completed':todayCardio?.status==='started'?'started':'none', plannedWorkoutMinutes:null, consistency:todaySnapshot.adherence??0, hasNutritionData:todaySnapshot.protein!==undefined, hasHydrationData:todaySnapshot.hydration!==undefined, hasConsistencyData:todaySnapshot.adherence!==undefined } as const
  const score=calculateTitanScore(input); const weeklyTrends=calculateTrends(snapshots,'weekly'); const monthlyTrends=calculateTrends(snapshots,'monthly'); const quarterlyTrends=calculateTrends(snapshots,'quarterly')
  const candidates=[...generateCoachAlerts(snapshots),...generateCoachInsights(input).filter(x=>x.id!=='on-track'),...generateHistoricalInsights(snapshots)]; const uniqueCandidates=[...new Map(candidates.map(x=>[x.id,x])).values()]
  const dailyInsights=filterRepeatedInsights(uniqueCandidates,storedHistory,today).slice(0,5)
  const history=storedHistory.slice(0,30).map(historyView)
  const metricSamples=(['protein','calories','hydration','sleep','weight','waist','training','trainingVolume','strength','cardio','score'] as TrendMetric[]).map(metric=>({metric,samples:snapshots.slice(-30).filter(x=>x[metric]!==undefined).length}))
  const measured = score.measuredCategories; const all:CoachCategory[]=['nutrition','hydration','training','cardio','recovery','consistency']
  const summarize=(trends: typeof weeklyTrends,label:string)=>trends.length?`${label}: ${trends.filter(x=>x.direction==='up').length} em alta, ${trends.filter(x=>x.direction==='down').length} em queda e ${trends.filter(x=>x.direction==='stable').length} estáveis, somente entre amostras registradas.`:`${label}: amostras insuficientes para comparação.`
  const timelineEvents: TitanTimelineEvent[] = [
    ...snapshots.filter(x=>x.protein!==undefined&&x.proteinTarget!==undefined&&x.protein>=x.proteinTarget).map(x=>({id:`protein-${x.date}`,type:'protein' as const,title:'Meta de proteína atingida',occurredAt:`${x.date}T23:00:00.000Z`,localDate:x.date,detail:`${x.protein} g de meta ${x.proteinTarget} g.`})),
    ...snapshots.filter(x=>x.hydration!==undefined&&x.hydrationTarget!==undefined&&x.hydration>=x.hydrationTarget).map(x=>({id:`hydration-${x.date}`,type:'hydration' as const,title:'Meta de água atingida',occurredAt:`${x.date}T23:00:00.000Z`,localDate:x.date,detail:`${x.hydration} ml de meta ${x.hydrationTarget} ml.`})),
    ...workouts.filter(x=>x.status==='completed').map(x=>({id:`workout-${x.id}`,type:'workout' as const,title:'Treino registrado',occurredAt:x.completedAt??x.updatedAt,localDate:x.localDate,detail:'Sessão concluída e persistida.'})),
    ...strength.map(x=>({id:`record-${x.id}`,type:'record' as const,title:'Nova carga recorde',occurredAt:x.createdAt,localDate:x.localDate,detail:`${x.exerciseName}: ${x.loadKg} kg.`})),
    ...body.map(x=>({id:`weight-${x.id}`,type:'weight' as const,title:'Peso registrado',occurredAt:x.createdAt,localDate:x.localDate,detail:`${x.weightKg} kg.`})),
    ...photos.map(x=>({id:`photo-${x.id}`,type:'photo' as const,title:'Foto adicionada',occurredAt:x.createdAt,localDate:x.localDate,detail:`Pose ${x.pose}.`})),
    ...history.map(x=>({id:`coach-${x.id}`,type:'coach' as const,title:'Coach gerou recomendação',occurredAt:`${x.localDate}T12:00:00.000Z`,localDate:x.localDate,detail:x.title}))
  ]; const timeline=buildTitanTimeline(timelineEvents,today)
  return { generatedAt:new Date().toISOString(), dailyInsights, weeklyTrends, monthlyTrends, quarterlyTrends, score, executiveSummary:generateExecutiveSummary({score,insights:dailyInsights,trends:weeklyTrends}), weeklySummary:summarize(weeklyTrends,'Semana'), monthlySummary:summarize(monthlyTrends,'Mês'), coverage:{ measured:measured.length,total:all.length,missing:all.filter(x=>!measured.includes(x)),daysWithAnyData:snapshots.slice(-30).filter(x=>metricSamples.some(m=>x[m.metric]!==undefined)).length,periodDays:30,byMetric:metricSamples }, history, timeline }
}
