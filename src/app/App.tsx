import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { ModulePlaceholderPage } from '../components/feedback/ModulePlaceholderPage'
import { AppShell } from '../layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
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

          <Route
            path="/more"
            element={
              <ModulePlaceholderPage
                eyebrow="Configurações"
                title="Mais"
                description="Backup, perfil, preferências, saúde e configurações do TITAN serão acessados nesta área."
              />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
