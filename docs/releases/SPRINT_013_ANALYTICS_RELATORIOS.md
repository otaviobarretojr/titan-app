# Sprint 013 — Analytics e Relatórios

## Entregas

- `/analytics` consolida os dados locais em uma interface mobile-first inspirada na Samsung One UI.
- Filtros de 7, 30, 90 dias e 1 ano atualizam indicadores e gráficos sem chamadas de rede.
- Score TITAN, peso, cintura, força estimada (1RM), proteína, água, calorias e sono são exibidos a partir das tabelas existentes no IndexedDB.
- A Timeline do Coach apresenta recomendações efetivamente persistidas, em ordem cronológica.
- Exportações JSON e CSV incluem o histórico do período selecionado.
- O gerador PDF local produz relatórios semanais ou mensais sem enviar dados do usuário a serviços externos.

## Privacidade e compatibilidade

A implementação não cria uma nova fonte de verdade nem altera o schema. Registros ausentes continuam sendo apresentados como ausência de dados, e toda leitura ocorre por meio do banco Dexie existente.
