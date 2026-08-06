# Modelo de dados nutricionais

A migração Dexie 13 é aditiva. Fontes e importações são separadas da biblioteca, aliases, nutrientes, medidas, rendimentos e substituições. Plano/dia/refeição/alimento planejado são separados de execução de refeição/alimento. Receitas, compras e estoque têm stores próprias. Índices suportam fonte, alimento, usuário, plano, data, estado e timestamps. Nenhuma store v1.0.3 é removida ou renomeada.
