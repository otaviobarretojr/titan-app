# Fundação da Nutrição Inteligente — v1.0.4

Esta release introduz apenas persistência, contratos e serviços; nenhuma tela é adicionada.

## Limites de domínio

- **Biblioteca:** categorias, alimentos, receitas, ingredientes, rendimentos e substituições.
- **Planejamento:** planos, dias, refeições e alimentos planejados.
- **Execução/histórico:** execuções de refeição e alimento são registros independentes e imutáveis em importações.
- **Compras:** listas e itens de compra.
- **Estoque:** itens disponíveis na despensa.

Importar ou salvar planejamento **não cria consumo**. Alimentos planejados não entram em métricas consumidas. Uma nova importação nunca exclui execuções anteriores. A migração Dexie 13 é estritamente aditiva e mantém todas as stores da v1.0.3.

## Contrato TITAN

Arquivos `schemaVersion: "1.0"` continuam legíveis. Nutrição `1.1` usa `dailyTargets` e `days`, com validação profunda de IDs, horários, unidades, duplicidade, limites, macros e estruturas vazias. Um plano 1.0 sem detalhes dos alimentos é mantido no armazenamento legado e recebe mensagem segura em vez de conversão destrutiva.

## Dados de referência

O seed é idempotente (IDs determinísticos e `bulkPut`) e registra `source: titan_seed`. Valores nutricionais são referências configuráveis para funcionamento do produto e não representam precisão ou recomendação clínica.
