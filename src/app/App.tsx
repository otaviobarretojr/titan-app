import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ReportsPage } from '../modules/reports/pages/ReportsPage'
import { SleepPage } from '../modules/health/pages/SleepPage'
import { SettingsPage } from '../modules/settings/pages/SettingsPage'
import { EvolutionPage } from '../modules/evolution/pages/EvolutionPage'
import { CardioPage } from '../modules/cardio/pages/CardioPage'
import { TrainingPage } from '../modules/training/pages/TrainingPage'
import { MealDetailPage } from '../modules/nutrition/pages/MealDetailPage'
import { NutritionPage } from '../modules/nutrition/pages/NutritionPage'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />

          <Route path="/training" element={<TrainingPage />} />

          <Route path="/cardio" element={<CardioPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route
            path="/nutrition/:mealId"
            element={<MealDetailPage />}
          />

          <Route
            path="/evolution"
            element={<EvolutionPage />}
          />

          <Route path="/health/sleep" element={<SleepPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/more" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
