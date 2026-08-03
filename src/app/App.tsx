import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { ModulePlaceholderPage } from '../components/feedback/ModulePlaceholderPage'
import { AppShell } from '../layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />

          <Route
            path="/training"
            element={
              <ModulePlaceholderPage
                eyebrow="Módulo de treino"
                title="Treinos"
                description="Execução de exercícios, séries, cargas e progressão será implementada na versão v0.3."
              />
            }
          />

          <Route
            path="/nutrition"
            element={
              <ModulePlaceholderPage
                eyebrow="Módulo nutricional"
                title="Nutrição"
                description="Refeições, macros, substituições e pendências serão implementados na versão v0.4."
              />
            }
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
