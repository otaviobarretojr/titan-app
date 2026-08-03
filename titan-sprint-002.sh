#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Aplicando Sprint 002: Dashboard Premium"

mkdir -p \
  docs/sprints \
  src/shared/ui \
  src/modules/dashboard/components \
  src/modules/dashboard/pages \
  src/styles

cat > docs/DESIGN_SYSTEM.md <<'EOF'
# TITAN — Design System

## Direção visual
Dark premium, esportivo, tecnológico, limpo e mobile-first.

## Cores
- Background: `#09090B`
- Surface: `#111827`
- Surface elevated: `#172033`
- Primary: `#2563EB`
- Primary light: `#60A5FA`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Text: `#F8FAFC`
- Text muted: `#94A3B8`

## Regras
- Alvo de toque mínimo: 44 × 44px.
- Uma ação primária por card.
- Estados não dependem apenas de cor.
- Respeitar `prefers-reduced-motion`.
EOF

cat > docs/ARCHITECTURE.md <<'EOF'
# TITAN — Arquitetura

- `app`: inicialização, rotas e providers.
- `shared`: componentes reutilizáveis.
- `modules`: funcionalidades por domínio.
- `database`: persistência local.
- `services`: serviços transversais.
- `styles`: tokens e estilos globais.

Regra principal: componentes de tela não concentram regras de negócio.
EOF

cat > docs/ROADMAP.md <<'EOF'
# TITAN — Roadmap
- [x] v0.1 — Foundation
- [ ] v0.2 — Dashboard
- [ ] v0.3 — Treinos
- [ ] v0.4 — Nutrição
- [ ] v0.5 — Cardio
- [ ] v0.6 — Saúde e evolução
- [ ] v0.7 — Coach
- [ ] v0.8 — Relatórios
- [ ] v0.9 — Polimento
- [ ] v1.0 — Primeira versão estável
EOF

cat > docs/CHANGELOG.md <<'EOF'
# TITAN — Changelog

## Unreleased

### Added
- Design System inicial.
- Biblioteca de componentes reutilizáveis.
- Dashboard Premium modular.
- Score TITAN demonstrativo.
EOF

cat > docs/sprints/SPRINT-002.md <<'EOF'
# Sprint 002 — Dashboard Premium

## Objetivo
Transformar a fundação React em uma interface mobile premium, modular e preparada para dados reais.

## Critérios de aceite
- Build sem erros.
- Lint sem erros.
- Navegação inferior preservada.
- Dashboard responsivo em 360px.
EOF

cat > src/shared/ui/Card.tsx <<'EOF'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type CardProps = ComponentPropsWithoutRef<'article'> & {
  children: ReactNode
  elevated?: boolean
}

export function Card({
  children,
  className = '',
  elevated = false,
  ...props
}: CardProps) {
  return (
    <article
      className={[
        'rounded-[24px] border border-white/10 p-5',
        elevated ? 'bg-[#172033]' : 'bg-[#111827]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </article>
  )
}
EOF

cat > src/shared/ui/Button.tsx <<'EOF'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700',
  secondary: 'bg-white text-slate-950 hover:bg-slate-200 active:bg-slate-300',
  ghost: 'bg-white/10 text-white hover:bg-white/15 active:bg-white/20',
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-0 px-5 font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
EOF

cat > src/shared/ui/Badge.tsx <<'EOF'
import type { ReactNode } from 'react'

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  primary: 'bg-blue-500/10 text-blue-300',
  success: 'bg-emerald-500/10 text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-300',
  neutral: 'bg-white/10 text-slate-300',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={['inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold', toneClasses[tone]].join(' ')}>
      {children}
    </span>
  )
}
EOF

cat > src/shared/ui/ProgressBar.tsx <<'EOF'
type ProgressBarProps = {
  value: number
  label: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{label}</span>
        <span>{normalizedValue}%</span>
      </div>

      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={normalizedValue}
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-[width] duration-500"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}
EOF

cat > src/shared/ui/SectionTitle.tsx <<'EOF'
type SectionTitleProps = {
  title: string
  supportingText?: string
}

export function SectionTitle({ title, supportingText }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {supportingText ? (
        <span className="text-xs font-medium text-slate-500">{supportingText}</span>
      ) : null}
    </div>
  )
}
EOF

cat > src/shared/ui/index.ts <<'EOF'
export { Badge } from './Badge'
export { Button } from './Button'
export { Card } from './Card'
export { ProgressBar } from './ProgressBar'
export { SectionTitle } from './SectionTitle'
EOF

cat > src/modules/dashboard/components/CoachCard.tsx <<'EOF'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'

export function CoachCard() {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center gap-2 text-blue-300">
        <Sparkles size={18} aria-hidden="true" />
        <span className="text-sm font-bold">COACH TITAN</span>
      </div>

      <h2 className="mt-3 text-xl font-bold">Prioridade de hoje</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        Comece registrando sua primeira refeição e mantenha a hidratação distribuída até o horário do treino.
      </p>

      <Button className="mt-4 min-h-11" variant="ghost">
        Ver recomendação
        <ChevronRight size={17} aria-hidden="true" />
      </Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/MealCard.tsx <<'EOF'
import { Utensils } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'

export function MealCard() {
  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Utensils size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone="warning">16:15 · PRÉ-TREINO</Badge>
          <h3 className="mt-3 text-lg font-bold">Próxima refeição</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">Banana, aveia e fonte de proteína</p>
        </div>
      </div>

      <Button className="mt-5" fullWidth>Abrir refeição</Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/WorkoutCard.tsx <<'EOF'
import { Dumbbell } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'

export function WorkoutCard() {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
          <Dumbbell size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge>19:00 · TREINO</Badge>
          <h3 className="mt-3 text-lg font-bold">Peito e tríceps</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">7 exercícios · aproximadamente 60 minutos</p>
        </div>
      </div>

      <Button className="mt-5" fullWidth variant="secondary">Iniciar treino</Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/ScoreCard.tsx <<'EOF'
import { Activity } from 'lucide-react'
import { Badge, Card, ProgressBar } from '../../../shared/ui'

export function ScoreCard() {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">72</p>
          <p className="mt-1 text-sm text-slate-400">Base demonstrativa, ainda sem dados reais.</p>
        </div>

        <Badge tone="primary">Bom</Badge>
      </div>

      <div className="mt-5">
        <ProgressBar label="Consistência diária" value={72} />
      </div>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/MetricsGrid.tsx <<'EOF'
import type { ReactNode } from 'react'
import { Droplets, Dumbbell, Flame, Moon } from 'lucide-react'
import { Card } from '../../../shared/ui'

const metrics = [
  { icon: <Flame size={19} aria-hidden="true" />, label: 'Calorias', value: '0', target: 'Meta 3.624 kcal' },
  { icon: <Dumbbell size={19} aria-hidden="true" />, label: 'Proteína', value: '0 g', target: 'Meta 220 g' },
  { icon: <Droplets size={19} aria-hidden="true" />, label: 'Água', value: '0 L', target: 'Meta 4,5 L' },
  { icon: <Moon size={19} aria-hidden="true" />, label: 'Sono', value: '—', target: 'Meta 7h30' },
]

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
    </div>
  )
}

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  target: string
}

function MetricCard({ icon, label, value, target }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{target}</p>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/pages/DashboardPage.tsx <<'EOF'
import { SectionTitle } from '../../../shared/ui'
import { CoachCard } from '../components/CoachCard'
import { MealCard } from '../components/MealCard'
import { MetricsGrid } from '../components/MetricsGrid'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'

function getCurrentDayLabel() {
  const value = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Manaus',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
  )

  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{getCurrentDayLabel()}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{getGreeting()}, Otávio</h1>
          <p className="mt-1 text-sm leading-6 text-slate-400">Sua próxima decisão está logo abaixo.</p>
        </div>

        <div aria-label="TITAN" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-black shadow-lg shadow-blue-600/20">
          T
        </div>
      </header>

      <CoachCard />

      <section>
        <SectionTitle supportingText="Próxima ação" title="Agora" />
        <MealCard />
      </section>

      <section>
        <SectionTitle title="Treino do dia" />
        <WorkoutCard />
      </section>

      <section>
        <SectionTitle title="Score TITAN" />
        <ScoreCard />
      </section>

      <section>
        <SectionTitle title="Resumo de hoje" />
        <MetricsGrid />
      </section>
    </div>
  )
}
EOF

cat > src/styles/globals.css <<'EOF'
@import "tailwindcss";

@theme {
  --color-titan-background: #09090b;
  --color-titan-surface: #111827;
  --color-titan-surface-elevated: #172033;
  --color-titan-primary: #2563eb;
}

:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f8fafc;
  background: #09090b;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* { box-sizing: border-box; }

html { background: #09090b; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgb(37 99 235 / 8%), transparent 340px),
    #09090b;
}

button, a {
  font: inherit;
  -webkit-tap-highlight-color: transparent;
}

button { cursor: pointer; }

button:focus-visible,
a:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 3px;
}

.nav-item {
  display: flex;
  min-width: 60px;
  min-height: 48px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 14px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.nav-item:hover { color: #94a3b8; }
.nav-item:active { transform: scale(0.96); }

.nav-item-active {
  background: rgb(37 99 235 / 10%);
  color: #60a5fa;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo "✅ Sprint 002 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: implement TITAN premium dashboard" && git push'
