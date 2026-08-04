import {
  ChartNoAxesCombined,
  Droplets,
  Dumbbell,
  HeartPulse,
  House,
  Cloud,
  MoreHorizontal,
  Plus,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { InstallPwa } from '../components/feedback/InstallPwa'
import { PwaStatus } from '../components/feedback/PwaStatus'
import { addHydration } from '../modules/dashboard/data/dashboardRepository'
import { useNotificationScheduler } from '../modules/notifications/hooks/useNotificationScheduler'

type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const navigationItems: NavigationItem[] = [
  { label: 'Hoje', to: '/', icon: House, end: true },
  { label: 'Treino', to: '/training', icon: Dumbbell },
  { label: 'Nutrição', to: '/nutrition', icon: Utensils },
  { label: 'Cardio', to: '/cardio', icon: HeartPulse },
  { label: 'Evolução', to: '/evolution', icon: ChartNoAxesCombined },
  { label: 'Conta', to: '/account', icon: Cloud },
  { label: 'Mais', to: '/more', icon: MoreHorizontal },
]

const quickActions = [
  {
    label: 'Refeição',
    to: '/nutrition',
    icon: Utensils,
    iconClassName: 'text-amber-300',
  },
  {
    label: 'Treino',
    to: '/training',
    icon: Dumbbell,
    iconClassName: 'text-violet-300',
  },
  {
    label: 'Saúde',
    to: '/health/sleep',
    icon: HeartPulse,
    iconClassName: 'text-rose-300',
  },
]

export function AppShell() {
  useNotificationScheduler()
  const location = useLocation()
  const [quickOpen, setQuickOpen] = useState(false)
  const [waterAdded, setWaterAdded] = useState(false)

  const isHome = location.pathname === '/'
  const closeQuickActions = useCallback(() => setQuickOpen(false), [])

  const handleAddWater = useCallback(async () => {
    await addHydration(300)
    setWaterAdded(true)
    window.setTimeout(() => {
      setQuickOpen(false)
      setWaterAdded(false)
    }, 900)
  }, [])

  const renderedNavigation = useMemo(
    () =>
      navigationItems.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
            end={item.end}
            key={item.to}
            to={item.to}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        )
      }),
    [],
  )

  return (
    <div className="min-h-dvh bg-titan-background text-white">
      <PwaStatus />
      <main className="mx-auto min-h-dvh w-full max-w-md px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <InstallPwa />
        <div className="route-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      {isHome ? (
        <>
          <QuickActionSheet
            closeQuickActions={closeQuickActions}
            handleAddWater={handleAddWater}
            quickOpen={quickOpen}
            waterAdded={waterAdded}
          />
          <button
            aria-expanded={quickOpen}
            aria-label="Abrir registro rápido"
            className="fab"
            onClick={() => setQuickOpen((value) => !value)}
          >
            <Plus
              className={quickOpen ? 'rotate-45 transition' : 'transition'}
              size={26}
            />
          </button>
        </>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md items-center justify-around border-t border-white/10 bg-[#111827]/88 px-2 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgb(0_0_0_/_24%)] backdrop-blur-2xl"
      >
        {renderedNavigation}
      </nav>
    </div>
  )
}

type QuickActionSheetProps = {
  closeQuickActions: () => void
  handleAddWater: () => Promise<void>
  quickOpen: boolean
  waterAdded: boolean
}

function QuickActionSheet({
  closeQuickActions,
  handleAddWater,
  quickOpen,
  waterAdded,
}: QuickActionSheetProps) {
  if (!quickOpen) {
    return null
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[55] bg-black/55 backdrop-blur-sm"
        onClick={closeQuickActions}
      />
      <div
        aria-label="Registro rápido"
        className="fixed inset-x-4 bottom-28 z-[60] mx-auto max-w-sm rounded-[28px] border border-white/10 bg-[#172033]/95 p-5 shadow-2xl backdrop-blur-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
              Registro rápido
            </p>
            <h2 className="mt-1 text-xl font-black">
              O que deseja registrar?
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8"
            onClick={closeQuickActions}
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className={`quick-action ${waterAdded ? 'hydration-complete' : ''}`} onClick={handleAddWater}>
            <Droplets className="text-sky-300" size={21} />
            {waterAdded ? 'Água registrada' : '+ 300 ml água'}
          </button>
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <NavLink
                className="quick-action"
                key={action.to}
                onClick={closeQuickActions}
                to={action.to}
              >
                <Icon className={action.iconClassName} size={21} />
                {action.label}
              </NavLink>
            )
          })}
        </div>
      </div>
    </>
  )
}
