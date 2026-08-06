# TITAN Nutrition 1.1

O contrato 1.1 contém `dailyTargets`, dias, refeições, alimentos, alternativas e referência. Cada alimento usa um `foodId` local **ou** `sourceType + sourceFoodId + sourceVersion`. Zod valida estrutura e uma segunda etapa assíncrona valida a biblioteca. A leitura 1.0 preserva planos sem alimentos e informa a limitação, sem inventar adaptação. Importar plano não cria execução, não altera Score e não apaga histórico.
