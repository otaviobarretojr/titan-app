import { lazy, Suspense } from 'react'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { GlobalErrorBoundary } from '../components/feedback/GlobalErrorBoundary'

const DashboardPage = lazy(() =>
  import('../modules/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)

const TrainingPage = lazy(() =>
  import('../modules/training/pages/TrainingPage').then((module) => ({
    default: module.TrainingPage,
  })),
)

const NutritionPage = lazy(() =>
  import('../modules/nutrition/pages/NutritionPage').then((module) => ({
    default: module.NutritionPage,
  })),
)

const MealDetailPage = lazy(() =>
  import('../modules/nutrition/pages/MealDetailPage').then((module) => ({
    default: module.MealDetailPage,
  })),
)

const CardioPage = lazy(() =>
  import('../modules/cardio/pages/CardioPage').then((module) => ({
    default: module.CardioPage,
  })),
)

const EvolutionPage = lazy(() =>
  import('../modules/evolution/pages/EvolutionPage').then((module) => ({
    default: module.EvolutionPage,
  })),
)

const HealthPage = lazy(() =>
  import('../modules/health/pages/HealthPage').then((module) => ({
    default: module.HealthPage,
  })),
)

const SleepPage = lazy(() =>
  import('../modules/health/pages/SleepPage').then((module) => ({
    default: module.SleepPage,
  })),
)

const ReportsPage = lazy(() =>
  import('../modules/reports/pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
)

const AnalyticsPage = lazy(() =>
  import('../modules/analytics/pages/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  })),
)

const CoachPage = lazy(() =>
  import('../modules/coach/pages/CoachPage').then((module) => ({
    default: module.CoachPage,
  })),
)

const NotificationsPage = lazy(() =>
  import('../modules/notifications/pages/NotificationsPage').then(
    (module) => ({ default: module.NotificationsPage }),
  ),
)

const SettingsPage = lazy(() =>
  import('../modules/settings/pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)

const ProfilePage = lazy(() =>
  import('../modules/profile/pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)

const AccountPage = lazy(() =>
  import('../modules/account/pages/AccountPage').then((module) => ({
    default: module.AccountPage,
  })),
)

function RouteLoading() {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[70dvh] items-center justify-center"
      role="status"
    >
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
        <p className="mt-4 text-sm font-semibold text-slate-400">
          Carregando módulo...
        </p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <HashRouter>
      <GlobalErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route
              path="/nutrition/:mealId"
              element={<MealDetailPage />}
            />
            <Route path="/cardio" element={<CardioPage />} />
            <Route path="/evolution" element={<EvolutionPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/health/sleep" element={<SleepPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />
            <Route path="/more" element={<SettingsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </GlobalErrorBoundary>
    </HashRouter>
  )
}
