import type { CoachInsight, CoachTrend, TitanScore, TitanScoreBreakdown, TrendMetric, TrendPeriod } from '../types/coach'

export type CoachEngineInput = {
  currentMinutes: number; proteinConsumedG: number; proteinTargetG: number
  caloriesConsumedKcal: number; calorieTargetKcal: number
  hydrationConsumedMl: number; hydrationTargetMl: number
  sleepMinutes: number | null; sleepTargetMinutes: number; pendingMeals: number
  workoutStatus: 'none' | 'planned' | 'started' | 'completed'
  cardioStatus: 'none' | 'planned' | 'started' | 'completed'
  plannedWorkoutMinutes: number | null; consistency: number
  hasNutritionData: boolean; hasHydrationData: boolean; hasConsistencyData: boolean
}
export type DailyCoachSnapshot = {
  date: string
  protein?: number; calories?: number; hydration?: number; sleep?: number
  weight?: number; waist?: number; training?: number; cardio?: number; score?: number
  proteinTarget?: number; calorieTarget?: number; hydrationTarget?: number; sleepTarget?: number
  adherence?: number; strength?: number; trainingVolume?: number; trainingPlanned?: number
}

const ratio = (value: number, target: number) => target > 0 ? Math.min(1, Math.max(0, value / target)) : 0
const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)))
export function calculateTitanScore(input: CoachEngineInput): TitanScore {
  const breakdown: TitanScoreBreakdown = {
    nutrition: clampScore((ratio(input.proteinConsumedG, input.proteinTargetG) * .6 + ratio(input.caloriesConsumedKcal, input.calorieTargetKcal) * .4) * 100),
    hydration: clampScore(ratio(input.hydrationConsumedMl, input.hydrationTargetMl) * 100),
    training: input.workoutStatus === 'completed' ? 100 : input.workoutStatus === 'started' ? 60 : input.workoutStatus === 'planned' ? 20 : 0,
    cardio: input.cardioStatus === 'completed' ? 100 : input.cardioStatus === 'started' ? 60 : input.cardioStatus === 'planned' ? 20 : 0,
    recovery: input.sleepMinutes === null ? 0 : clampScore(ratio(input.sleepMinutes, input.sleepTargetMinutes) * 100),
    consistency: clampScore(input.consistency),
  }
  const categories = [
    input.hasNutritionData ? { category: 'nutrition' as const, value: breakdown.nutrition, weight: .25 } : null,
    input.hasHydrationData ? { category: 'hydration' as const, value: breakdown.hydration, weight: .15 } : null,
    input.workoutStatus !== 'none' ? { category: 'training' as const, value: breakdown.training, weight: .2 } : null,
    input.cardioStatus !== 'none' ? { category: 'cardio' as const, value: breakdown.cardio, weight: .1 } : null,
    input.sleepMinutes !== null ? { category: 'recovery' as const, value: breakdown.recovery, weight: .15 } : null,
    input.hasConsistencyData ? { category: 'consistency' as const, value: breakdown.consistency, weight: .15 } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)
  if (!categories.length) return { value: null, label: 'Sem dados', breakdown, measuredCategories: [] }
  const totalWeight = categories.reduce((sum, item) => sum + item.weight, 0)
  const value = clampScore(categories.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight)
  return { value, label: value >= 85 ? 'Excelente' : value >= 70 ? 'Bom' : value >= 50 ? 'Atenção' : 'Crítico', breakdown, measuredCategories: categories.map(item => item.category) }
}

const metricConfig: Record<TrendMetric, { label: string; unit: string }> = {
  protein: { label: 'Proteína', unit: 'g' }, calories: { label: 'Calorias', unit: 'kcal' },
  hydration: { label: 'Hidratação', unit: 'ml' }, sleep: { label: 'Sono', unit: 'min' },
  weight: { label: 'Peso', unit: 'kg' }, waist: { label: 'Cintura', unit: 'cm' },
  training: { label: 'Treino', unit: 'sessões' }, trainingVolume: { label: 'Volume semanal', unit: 'kg' },
  strength: { label: 'Força', unit: 'kg' }, cardio: { label: 'Cardio', unit: 'sessões' },
  score: { label: 'Score TITAN', unit: 'pontos' },
}
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
export function calculateTrends(snapshots: DailyCoachSnapshot[], period: TrendPeriod): CoachTrend[] {
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90
  const datedSnapshots = snapshots
    .map(snapshot => ({ snapshot, timestamp: Date.parse(`${snapshot.date.slice(0, 10)}T00:00:00Z`) }))
    .filter(item => Number.isFinite(item.timestamp))
  const latestTimestamp = datedSnapshots.reduce((latest, item) => Math.max(latest, item.timestamp), -Infinity)
  const dayInMilliseconds = 24 * 60 * 60 * 1000
  const currentStart = latestTimestamp - (days - 1) * dayInMilliseconds
  const previousStart = latestTimestamp - (days * 2 - 1) * dayInMilliseconds
  const current = datedSnapshots
    .filter(item => item.timestamp >= currentStart && item.timestamp <= latestTimestamp)
    .map(item => item.snapshot)
  const previous = datedSnapshots
    .filter(item => item.timestamp >= previousStart && item.timestamp < currentStart)
    .map(item => item.snapshot)
  return (Object.keys(metricConfig) as TrendMetric[]).flatMap(metric => {
    const currentValues = current.flatMap(day => typeof day[metric] === 'number' ? [day[metric] as number] : [])
    if (currentValues.length < 2) return []
    const previousValues = previous.flatMap(day => typeof day[metric] === 'number' ? [day[metric] as number] : [])
    const currentAverage = average(currentValues); const previousAverage = previousValues.length >= 2 ? average(previousValues) : null
    const changePercent = previousAverage !== null && previousAverage !== 0 ? ((currentAverage - previousAverage) / Math.abs(previousAverage)) * 100 : null
    const direction = changePercent === null || Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'up' : 'down'
    const config = metricConfig[metric]
    return [{ id: `${period}-${metric}`, metric, period, title: `${config.label} ${period === 'weekly' ? 'semanal' : period === 'monthly' ? 'mensal' : 'em 90 dias'}`, direction, changePercent, currentAverage, previousAverage, unit: config.unit, sampleSize: currentValues.length, previousSampleSize: previousValues.length, message: previousAverage === null ? `Média de ${currentAverage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${config.unit}; histórico anterior insuficiente para comparação.` : `${changePercent! >= 0 ? '+' : ''}${changePercent!.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% em relação ao período anterior.` }]
  })
}

const createInsight = (id: string, data: Omit<CoachInsight, 'id' | 'generatedAt'>): CoachInsight => ({ id, generatedAt: new Date().toISOString(), ...data })
export function generateHistoricalInsights(snapshots: DailyCoachSnapshot[]): CoachInsight[] {
  const recent = [...snapshots].sort((a,b) => a.date.localeCompare(b.date)).slice(-14)
  const insights: CoachInsight[] = []
  const values = (key: keyof DailyCoachSnapshot, days = 7) => recent.slice(-days).flatMap(day => typeof day[key] === 'number' ? [day[key] as number] : [])
  const targets = (key: keyof DailyCoachSnapshot, days = 7) => recent.slice(-days).flatMap(day => typeof day[key] === 'number' ? [day[key] as number] : [])
  const add = (id: string, title: string, priority: CoachInsight['priority'], category: CoachInsight['category'], evidence: string, period: string, sampleSize: number, message: string, actionLabel: string, actionPath: string) => insights.push(createInsight(id, { title, priority, category, evidence, period, sampleSize, message, actionLabel, actionPath }))
  const protein = values('protein'); const priorProtein = recent.slice(-14,-7).flatMap(d => d.protein === undefined ? [] : [d.protein])
  if (protein.length >= 3 && priorProtein.length >= 3 && average(protein) < average(priorProtein) * .85) add('protein-drop','Queda relevante de proteína','high','nutrition',`Média caiu ${Math.round((1-average(protein)/average(priorProtein))*100)}% entre períodos registrados.`,'últimos 7 dias versus 7 anteriores',protein.length+priorProtein.length,'Revise os registros e planeje fontes de proteína compatíveis com seu plano.','Abrir nutrição','/nutrition')
  const hydration = values('hydration'); const hydrationTargets = targets('hydrationTarget')
  if (hydration.length >= 3 && hydrationTargets.length >= 3 && hydration.filter((v,i) => v < hydrationTargets[i] * .7).length >= 3) add('recurring-low-hydration','Baixa hidratação recorrente','high','hydration',`${hydration.filter((v,i) => v < hydrationTargets[i] * .7).length} registros ficaram abaixo de 70% da meta.`,'últimos 7 dias',hydration.length,'Distribua lembretes de água ao longo do dia e continue registrando.','Registrar água','/nutrition')
  const sleep = values('sleep'); const sleepTargets = targets('sleepTarget')
  if (sleep.length >= 3 && sleepTargets.length >= 3 && average(sleep) < average(sleepTargets) * .85) add('sleep-below-target','Sono abaixo da meta','high','recovery',`Média registrada de ${Math.round(average(sleep)/60*10)/10} h para meta média de ${Math.round(average(sleepTargets)/60*10)/10} h.`,'últimos 7 dias',sleep.length,'Proteja uma janela regular de sono; procure orientação profissional se houver preocupação persistente.','Revisar sono','/health/sleep')
  const training = recent.slice(-7).filter(d => (d.training ?? 0) > 0)
  let streak=0,maxStreak=0; recent.slice(-7).forEach(d => { streak=(d.training ?? 0)>0?streak+1:0; maxStreak=Math.max(maxStreak,streak) })
  if (maxStreak >= 6) add('training-streak','Sequência excessiva de treinos','medium','training',`${maxStreak} dias consecutivos com treino concluído.`,'últimos 7 dias',training.length,'Considere um dia de recuperação conforme seu planejamento e sua percepção de esforço.','Abrir treino','/training')
  const cardio = values('cardio',14)
  if (recent.length >= 7 && cardio.length === 0) add('cardio-absence','Ausência prolongada de cardio','medium','cardio','Nenhuma sessão de cardio registrada no período observado.','últimos 14 dias',recent.length,'Se cardio fizer parte do seu plano, programe uma sessão adequada à sua rotina.','Abrir cardio','/cardio')
  const strength = values('strength',14)
  if (strength.length >= 2 && strength.at(-1)! > strength[0] * 1.03) add('strength-improvement','Melhora de força','low','training',`Melhor estimativa de força subiu ${Math.round((strength.at(-1)!/strength[0]-1)*100)}%.`,'últimos 14 dias',strength.length,'Mantenha progressão gradual e técnica consistente.','Ver treino','/training')
  const weight = values('weight',14)
  if (weight.length >= 4) { const change=weight.at(-1)!-weight[0]; if (Math.abs(change)<.3) add('weight-plateau','Estagnação de peso','low','body',`Variação de ${change.toLocaleString('pt-BR',{maximumFractionDigits:1})} kg entre registros.`,'últimos 14 dias',weight.length,'Avalie a tendência junto ao objetivo e à cintura, sem reagir a uma medição isolada.','Ver evolução','/evolution'); else if (Math.abs(change)/weight[0] > .02) add('rapid-weight-change','Variação acelerada de peso','high','body',`Variação de ${change>0?'+':''}${change.toLocaleString('pt-BR',{maximumFractionDigits:1})} kg (${Math.abs(change/weight[0]*100).toFixed(1)}%).`,'últimos 14 dias',weight.length,'Confirme novas medições em condições semelhantes e procure orientação profissional se a mudança for inesperada.','Ver evolução','/evolution') }
  const adherence = values('adherence'); const priorAdherence=recent.slice(-14,-7).flatMap(d=>d.adherence===undefined?[]:[d.adherence])
  if (adherence.length>=4 && average(adherence)>=85) add('high-consistency','Consistência alta','low','consistency',`Aderência média de ${Math.round(average(adherence))}% nos dias registrados.`,'últimos 7 dias',adherence.length,'Preserve a rotina sustentável que gerou essa consistência.','Ver relatório','/reports')
  else if (adherence.length>=3 && priorAdherence.length>=3 && average(adherence)<average(priorAdherence)-15) add('adherence-drop','Queda de aderência','medium','consistency',`Aderência média caiu ${Math.round(average(priorAdherence)-average(adherence))} pontos percentuais.`,'últimos 7 dias versus 7 anteriores',adherence.length+priorAdherence.length,'Escolha uma ação essencial e retome a rotina gradualmente.','Ver relatório','/reports')
  return insights.sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-({high:0,medium:1,low:2}[b.priority])))
}

// Immediate, record-based guidance kept for the dashboard. Missing categories
// never produce a warning: an actual persisted measurement is required.
export function generateCoachInsights(input: CoachEngineInput): CoachInsight[] {
  const insights: CoachInsight[] = []
  const add = (id: string, title: string, priority: CoachInsight['priority'], category: CoachInsight['category'], evidence: string, message: string, actionLabel: string, actionPath: string) => insights.push({ id, title, priority, category, evidence, message, actionLabel, actionPath, period: 'hoje', sampleSize: 1, generatedAt: new Date().toISOString() })
  if (input.pendingMeals > 0) add('pending-meals', `${input.pendingMeals} refeição(ões) pendente(s)`, 'high','nutrition',`${input.pendingMeals} plano(s) sem resolução após o horário.`, 'Resolva as pendências conforme o que realmente ocorreu.','Abrir nutrição','/nutrition')
  if (input.hasHydrationData && input.currentMinutes >= 720 && ratio(input.hydrationConsumedMl,input.hydrationTargetMl)<.35) add('hydration-low','Hidratação abaixo do esperado','high','hydration',`${input.hydrationConsumedMl} ml de ${input.hydrationTargetMl} ml registrados.`,'Aumente o consumo gradualmente nas próximas horas.','Registrar água','/nutrition')
  if (input.hasNutritionData && input.currentMinutes >= 960 && ratio(input.proteinConsumedG,input.proteinTargetG)<.55) add('protein-low','Proteína atrasada','medium','nutrition',`${input.proteinConsumedG} g de ${input.proteinTargetG} g registrados.`,'Distribua o restante entre as refeições previstas.','Revisar refeições','/nutrition')
  if (input.workoutStatus === 'started') add('workout-running','Treino em andamento','high','training','Uma sessão iniciada está persistida.','Continue registrando séries, carga, repetições e RIR.','Continuar treino','/training')
  if (input.cardioStatus === 'started') add('cardio-running','Cardio em andamento','medium','cardio','Uma sessão iniciada está persistida.','Finalize registrando os dados reais da sessão.','Continuar cardio','/cardio')
  if (input.sleepMinutes !== null && input.sleepMinutes < input.sleepTargetMinutes*.8) add('sleep-low','Sono abaixo da meta','medium','recovery',`${input.sleepMinutes} min de ${input.sleepTargetMinutes} min registrados.`,'Priorize recuperação sem interpretar este registro como diagnóstico.','Abrir sono','/health/sleep')
  if (!insights.length) add('on-track','Nenhuma prioridade detectada','low','consistency','Nenhum desvio foi detectado nas categorias registradas.','Continue registrando para melhorar a cobertura.','Abrir Coach','/coach')
  return insights.slice(0,5)
}

export function generateExecutiveSummary(input: { score: TitanScore; insights: CoachInsight[]; trends: CoachTrend[] }) {
  if (input.score.value === null) return 'Ainda não há dados suficientes para calcular o Score TITAN.'
  const priority = input.insights.find(item => item.priority === 'high')
  if (priority) return `Prioridade atual: ${priority.title.toLowerCase()}. A recomendação usa somente registros persistidos.`
  const down = input.trends.find(item => item.direction === 'down')
  return down ? `O Score atual é ${input.score.value}; acompanhe a tendência de ${down.title.toLowerCase()}.` : `O Score atual é ${input.score.value}; nenhuma queda relevante foi identificada nos dados disponíveis.`
}

/** Evidence-only alerts. Each rule needs multiple persisted samples and has a stable id. */
export function generateCoachAlerts(snapshots: DailyCoachSnapshot[]): CoachInsight[] {
  const ordered = [...snapshots].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  const current = ordered.slice(-7); const previous = ordered.slice(-14, -7); const alerts: CoachInsight[] = []
  const vals = (rows: DailyCoachSnapshot[], key: keyof DailyCoachSnapshot) => rows.flatMap(row => typeof row[key] === 'number' ? [row[key] as number] : [])
  const add = (id: string, category: CoachInsight['category'], priority: CoachInsight['priority'], title: string, evidence: string, period: string, sampleSize: number, message: string, actionLabel: string, actionPath: string) => alerts.push(createInsight(id, { category, priority, title, evidence, period, sampleSize, message, actionLabel, actionPath }))
  const compareDrop = (key: keyof DailyCoachSnapshot, id: string, title: string, category: CoachInsight['category'], actionPath: string) => { const now=vals(current,key), before=vals(previous,key); if(now.length>=2&&before.length>=2&&average(now)<average(before)*.9) add(id,category,'high',title,`Média atual ${average(now).toFixed(1)}; anterior ${average(before).toFixed(1)}.`, '7 dias versus 7 anteriores',now.length+before.length,'Revise os registros do período e ajuste o planejamento com base nessa queda.','Revisar registros',actionPath) }
  compareDrop('strength','strength-drop','Queda de força','training','/training')
  compareDrop('training','frequency-drop','Queda de frequência','consistency','/training')
  compareDrop('score','score-drop','Queda do Score TITAN','evolution','/analytics')
  const missed=current.filter(x=>(x.trainingPlanned??0)>0&&(x.training??0)===0); if(missed.length>=2)add('missed-workouts','training','high','Treinos perdidos',`${missed.length} treinos planejados não possuem sessão concluída.`,'últimos 7 dias',missed.length,'Reprograme somente as sessões que continuam compatíveis com seu plano.','Abrir treino','/training')
  const targetAlert=(key:keyof DailyCoachSnapshot,target:keyof DailyCoachSnapshot,id:string,title:string,category:CoachInsight['category'],path:string)=>{const pairs=current.flatMap(x=>typeof x[key]==='number'&&typeof x[target]==='number'?[[x[key] as number,x[target] as number]]:[]);const low=pairs.filter(([v,t])=>v<t*.8);if(pairs.length>=3&&low.length>=3)add(id,category,'high',title,`${low.length} de ${pairs.length} registros ficaram abaixo de 80% da meta.`,'últimos 7 dias',pairs.length,'Priorize a meta registrada e acompanhe os próximos registros.','Abrir registros',path)}
  targetAlert('protein','proteinTarget','protein-below-target','Proteína abaixo da meta','nutrition','/nutrition'); targetAlert('hydration','hydrationTarget','water-below-target','Água abaixo da meta','hydration','/nutrition'); targetAlert('sleep','sleepTarget','sleep-insufficient','Sono insuficiente','recovery','/health/sleep')
  const weights=vals(ordered.slice(-21),'weight'); if(weights.length>=4&&Math.abs(weights.at(-1)!-weights[0])<.3)add('weight-plateau','body','medium','Platô de peso',`${weights.length} medições variaram menos de 0,3 kg.`,'últimos 21 dias',weights.length,'Interprete o platô junto ao objetivo e à cintura registrada.','Ver evolução','/evolution')
  const strength=vals(ordered.slice(-21),'strength'); if(strength.length>=4&&(Math.max(...strength)-Math.min(...strength))/average(strength)<.02)add('strength-plateau','training','medium','Platô de força',`${strength.length} estimativas variaram menos de 2%.`,'últimos 21 dias',strength.length,'Revise volume, recuperação e progressão registrados.','Ver treino','/training')
  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return [
    ...new Map(
      alerts.map((alert) => [alert.id, alert]),
    ).values(),
  ].sort(
    (first, second) =>
      priorityOrder[first.priority] -
      priorityOrder[second.priority],
  )
}
