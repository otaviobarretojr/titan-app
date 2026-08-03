export type HealthMetric = {
  id: string
  localDate: string
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
}

export type HealthExam = {
  id: string
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
  notes: string
}

export type HealthSummary = {
  latestMetric: HealthMetric | null
  metrics: HealthMetric[]
  exams: HealthExam[]
  averageRestingHeartRate: number | null
}
