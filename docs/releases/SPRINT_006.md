# Sprint 006 — Coach TITAN Avançado

## Objetivo entregue

O Coach passou a interpretar localmente o histórico real persistido no IndexedDB. O motor é determinístico, não chama APIs e não completa lacunas com valores inventados.

## Entregas

- Tendências semanais e mensais de proteína, calorias, hidratação, sono, peso, cintura, treino, cardio e Score TITAN.
- Comparação entre janelas somente quando cada métrica possui ao menos duas amostras reais; dias ausentes não entram na média.
- Insights explicáveis para proteína, hidratação, sono, sequência de treino, cardio, força, peso e aderência.
- Evidência, período, tamanho de amostra, prioridade, categoria, ação segura e rota em cada recomendação.
- Histórico de recomendações no schema 9 do IndexedDB, mantendo os campos anteriores opcionais e legíveis.
- Cooldown por chave do insight: 2 dias para prioridade alta, 4 para média e 7 para baixa.
- Tela com prioridade do dia, resumos semanal e mensal, tendências, cobertura, histórico e explicação do Score.
- Testes unitários do Score, tendências, insights, ausência e insuficiência de dados.

## Segurança e privacidade

As conclusões usam somente registros do próprio usuário armazenados no dispositivo. O Coach não diagnostica doenças, não prescreve medicamentos e orienta confirmação de variações inesperadas, sem substituir avaliação profissional. Ausência de registro representa ausência de evidência — nunca desempenho zero.

## Compatibilidade

A migração Dexie adiciona índices e campos opcionais à tabela existente `coachRecommendations`; as demais tabelas, rotas, PWA e formatos anteriores permanecem preservados. Nenhuma seed histórica ou dado sintético foi incluído.

## Validação

A entrega deve ser validada com `npm run validate`. Os testes unitários estão em `tests/coachEngine.test.ts` e usam Vitest no ambiente de testes do projeto.
