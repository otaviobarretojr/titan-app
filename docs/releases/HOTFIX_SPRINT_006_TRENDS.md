# Hotfix Sprint 006 — Tendências por data real

## Problema corrigido

O Coach separava os períodos semanal e mensal pela quantidade de snapshots. Em históricos esparsos, registros antigos podiam ser tratados como se pertencessem a janelas consecutivas.

## Correção

- A data mais recente dos snapshots agora é a referência das janelas.
- A janela semanal atual cobre a data de referência e os 6 dias anteriores; a anterior cobre os 7 dias imediatamente anteriores.
- A janela mensal atual cobre a data de referência e os 29 dias anteriores; a anterior cobre os 30 dias imediatamente anteriores.
- Dias sem registro continuam fora das médias e das contagens de amostras.
- Tendências exigem ao menos duas amostras reais na janela atual.
- Com menos de duas amostras na janela anterior, a média anterior permanece indisponível e a direção permanece estável.

## Validação

O fluxo de validação passa a executar também a suíte de testes antes do build e da validação de release.
