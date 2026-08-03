import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { ModulePlaceholderPage } from '../components/feedback/ModulePlaceholderPage'
import { AppShell } from '../layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
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

          <Route path="/nutrition" element={<NutritionPage />} />
          <Route
            path="/nutrition/:mealId"
            element={<MealDetailPage />}
          />

          <Route
            path="/evolution"
            element={
              <ModulePlaceholderPage
                eyebrow="Acompanhamento"
                title="Evolução"
                description="Peso, medidas, fotos, desempenho e tendências corporais ficarão reunidos aqui."
              />
            }
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
