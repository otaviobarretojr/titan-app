import {
  ChartNoAxesCombined,
  Dumbbell,
  House,
  HeartPulse,
  MoreHorizontal,
  Utensils,
  Plus,
  X,
  Droplets,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PwaStatus } from '../components/feedback/PwaStatus'
import { InstallPwa } from '../components/feedback/InstallPwa'
import { addHydration } from '../modules/dashboard/data/dashboardRepository'

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
  const [quickOpen, setQuickOpen] = useState(false)
  const [waterAdded, setWaterAdded] = useState(false)
  async function addWater() {
    await addHydration(300)
    setWaterAdded(true)
    window.setTimeout(() => { setQuickOpen(false); setWaterAdded(false) }, 900)
  }
  return (
    <div className="min-h-dvh bg-titan-background text-white">
      <PwaStatus />
      <main className="mx-auto min-h-dvh w-full max-w-md px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <InstallPwa />
        <div className="route-transition" key={location.pathname}><Outlet /></div>
      </main>

      {location.pathname === '/' ? <>
        {quickOpen ? <div className="fixed inset-0 z-[55] bg-black/55 backdrop-blur-sm" onClick={() => setQuickOpen(false)} aria-hidden="true" /> : null}
        {quickOpen ? <div aria-label="Registro rápido" className="fixed inset-x-4 bottom-28 z-[60] mx-auto max-w-sm rounded-[28px] border border-white/10 bg-[#172033] p-5 shadow-2xl" role="dialog">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-300">Registro rápido</p><h2 className="mt-1 text-xl font-black">O que deseja registrar?</h2></div><button aria-label="Fechar" className="grid h-10 w-10 place-items-center rounded-full bg-white/8" onClick={() => setQuickOpen(false)}><X size={19} /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><button className="quick-action" onClick={addWater}><Droplets className="text-sky-300" size={21} />{waterAdded ? 'Água registrada' : '+ 300 ml água'}</button><NavLink className="quick-action" onClick={() => setQuickOpen(false)} to="/nutrition"><Utensils className="text-amber-300" size={21} />Refeição</NavLink><NavLink className="quick-action" onClick={() => setQuickOpen(false)} to="/training"><Dumbbell className="text-violet-300" size={21} />Treino</NavLink><NavLink className="quick-action" onClick={() => setQuickOpen(false)} to="/health/sleep"><HeartPulse className="text-rose-300" size={21} />Saúde</NavLink></div>
        </div> : null}
        <button aria-expanded={quickOpen} aria-label="Abrir registro rápido" className="fab" onClick={() => setQuickOpen((value) => !value)}><Plus className={quickOpen ? 'rotate-45 transition' : 'transition'} size={26} /></button>
      </> : null}

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
