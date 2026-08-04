# Sprint 009 — Evolução Corporal Avançada

## Entregas

- Central mobile-first de peso, médias móveis de sete dias, comparações semanal e mensal e tendência sem preencher dias ausentes com zero.
- Medidas bilaterais de braços, coxas e panturrilhas, além de cintura, peito, quadril e pescoço, mantendo a leitura do formato legado.
- Bioimpedância inteiramente opcional, identificada como estimativa e acompanhada de equipamento e condições.
- Fotos em quatro poses, com filtro, peso relacionado, confirmação de exclusão e otimização WebP local (máximo de entrada: 12 MB; maior lado: 1.600 px).
- Indicadores derivados das séries que ainda existem e resumo cardiovascular semanal.

## Migração do banco

O schema Dexie 10 é aditivo: cria `bioimpedance`, adiciona índice de pose e aceita novos campos opcionais. Nenhum registro antigo é removido ou recebe valor fabricado. Medidas unilaterais legadas são apresentadas nos dois lados apenas como compatibilidade de leitura. Backups v2 continuam válidos; tabelas ausentes em backups antigos são restauradas vazias.

## Integridade e privacidade

Todos os dados permanecem no dispositivo. Valores numéricos passam por limites e `Number.isFinite`; fotos são validadas e processadas no navegador. Bioimpedância não oferece diagnóstico e deve ser comparada apenas sob condições semelhantes.

## Limitações conhecidas

- Bioimpedância varia conforme aparelho, hidratação, alimentação e horário.
- A evolução para 5 km depende de sessões com distância e duração registradas; o TITAN não extrapola resultados ausentes.
- Compressão de foto exige suporte do navegador a `createImageBitmap`, canvas e WebP.
- Médias e comparações informam insuficiência quando um dos períodos não contém amostras.
