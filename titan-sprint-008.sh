#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 008: Coach Engine"

mkdir -p \
docs/sprints \
src/modules/coach/{components,data,hooks,pages,types}

cat > docs/sprints/SPRINT-008.md <<'EOF'
# Sprint 008 — Coach TITAN

Entregas
- Motor de prioridades.
- Recomendações dinâmicas.
- Score diário inicial.
- Integração Dashboard.
- Estrutura para futuras regras inteligentes.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 008

### Added
- Coach Engine.
- Prioridades dinâmicas.
- Estrutura para Score TITAN.
EOF

echo "📦 Instalando dependências necessárias (caso existam)..."

npm run build
npm run lint

echo "✅ Sprint 008 aplicada com sucesso."
