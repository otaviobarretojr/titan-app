# Sprint 011 — Coach TITAN Intelligence

## Objetivo
O Coach passa a transformar exclusivamente registros locais do IndexedDB em recomendações explicáveis. Nenhuma API externa ou IA online é utilizada.

## Entregas
- Insights de treino, nutrição, hidratação, cardio, sono, evolução, aderência e recuperação, sempre com evidência, período, amostra, ação e data de geração.
- Tendências de 7, 30 e 90 dias para peso, cintura, força, volume, proteína, hidratação, sono, cardio e Score TITAN. Uma tendência exige no mínimo duas amostras reais.
- Alertas determinísticos com chaves estáveis, cooldown por prioridade e eliminação de duplicidade.
- Timeline cronológica de 30 dias para treinos, recordes, metas, peso, fotos e recomendações.
- Dashboard com Coach Prioritário, Resumo da Semana, Timeline e Próxima ação.

## Limitações
Dias sem registro são ignorados, nunca convertidos em zero. O Coach declara dados insuficientes quando a amostra mínima não existe. Recomendações não substituem orientação profissional.
