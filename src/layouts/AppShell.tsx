import {
  ChartNoAxesCombined,
  Dumbbell,
  House,
  HeartPulse,
  MoreHorizontal,
  Utensils,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PwaStatus } from '../components/feedback/PwaStatus'
import { InstallPwa } from '../components/feedback/InstallPwa'

const navigationItems = [
  {
    label: 'Hoje',
    to: '/',
    icon: House,
    end: true,
  },
  {
    label: 'Treino',
    to: '/training',
    icon: Dumbbell,
  },
  {
    label: 'Nutrição',
    to: '/nutrition',
    icon: Utensils,
  },
  {
    label: 'Cardio',
    to: '/cardio',
    icon: HeartPulse,
  },
  {
    label: 'Evolução',
    to: '/evolution',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'Mais',
    to: '/more',
    icon: MoreHorizontal,
  },
]

export function AppShell() {
  const location = useLocation()
  return (
    <div className="min-h-dvh bg-titan-background text-white">
      <PwaStatus />
      <main className="mx-auto min-h-dvh w-full max-w-md px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <InstallPwa />
        <div className="route-transition" key={location.pathname}><Outlet /></div>
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md items-center justify-around border-t border-white/10 bg-[#111827]/90 px-2 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl"
      >
        {navigationItems.map((item) => {
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
              <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
