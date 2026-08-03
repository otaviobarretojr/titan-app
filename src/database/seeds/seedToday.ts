import { getTitanLocalDate } from '../date'
import { titanDatabase } from '../titanDatabase'

const USER_ID = 'otavio'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function seedToday() {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  await titanDatabase.transaction(
    'rw',
    [
      titanDatabase.users,
      titanDatabase.dailyPlans,
      titanDatabase.mealPlans,
      titanDatabase.workoutPlans,
      titanDatabase.coachRecommendations,
    ],
    async () => {
      const user = await titanDatabase.users.get(USER_ID)

      if (!user) {
        await titanDatabase.users.add({
          id: USER_ID,
          displayName: 'Otávio',
          createdAt: now,
          updatedAt: now,
        })
      }

      const dailyPlan = await titanDatabase.dailyPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!dailyPlan) {
        await titanDatabase.dailyPlans.add({
          id: createId('daily-plan'),
          userId: USER_ID,
          localDate,
          calorieTargetKcal: 3624,
          proteinTargetG: 220,
          hydrationTargetMl: 4500,
          sleepTargetMinutes: 450,
          createdAt: now,
          updatedAt: now,
        })
      }

      const mealCount = await titanDatabase.mealPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .count()

      if (mealCount === 0) {
        await titanDatabase.mealPlans.bulkAdd([
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Café da manhã',
            plannedTime: '06:15',
            sequence: 1,
            caloriesKcal: 650,
            proteinG: 45,
            carbohydrateG: 65,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Lanche da manhã',
            plannedTime: '09:30',
            sequence: 2,
            caloriesKcal: 430,
            proteinG: 32,
            carbohydrateG: 42,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Almoço',
            plannedTime: '12:30',
            sequence: 3,
            caloriesKcal: 850,
            proteinG: 55,
            carbohydrateG: 95,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Pré-treino',
            plannedTime: '16:15',
            sequence: 4,
            caloriesKcal: 520,
            proteinG: 34,
            carbohydrateG: 70,
            fatG: 12,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Jantar pós-treino',
            plannedTime: '20:15',
            sequence: 5,
            caloriesKcal: 820,
            proteinG: 58,
            carbohydrateG: 88,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Ceia',
            plannedTime: '21:30',
            sequence: 6,
            caloriesKcal: 354,
            proteinG: 26,
            carbohydrateG: 28,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      const workout = await titanDatabase.workoutPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!workout) {
        await titanDatabase.workoutPlans.add({
          id: createId('workout'),
          userId: USER_ID,
          localDate,
          name: 'Peito e tríceps',
          plannedTime: '19:00',
          exerciseCount: 7,
          estimatedDurationMinutes: 60,
          createdAt: now,
          updatedAt: now,
        })
      }

      const recommendation = await titanDatabase.coachRecommendations
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!recommendation) {
        await titanDatabase.coachRecommendations.add({
          id: createId('coach'),
          userId: USER_ID,
          localDate,
          title: 'Prioridade de hoje',
          message:
            'Registre o que realmente consumir e distribua a hidratação até o treino.',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
        })
      }
    },
  )
}

export const TITAN_USER_ID = USER_ID
