# TITAN v1.0.3 — contratos operacionais

## Schemas e exemplos
Arquivos TITAN são JSON com envelope obrigatório: `titan: true`, `kind`, `title`, `author`, `createdAt` e `data`. Extensões aceitas: `.titanprofile`, `.titanworkout`, `.titannutrition`, `.titancardio`, `.titansupplements` e `.titanproject`. Cada importador valida exclusivamente seu `kind`; por exemplo, o importador de nutrição aceita apenas `kind: "nutrition"` e dados `dailyPlans`/`mealPlans`.

```json
{
  "titan": true,
  "kind": "nutrition",
  "title": "Plano alimentar",
  "author": "Coach TITAN",
  "createdAt": "2026-08-05T00:00:00.000Z",
  "data": { "dailyPlans": [], "mealPlans": [] }
}
```

## Fluxo de validação
O app lê o arquivo, captura falhas de leitura, captura `JSON.parse` inválido e converte erros para mensagens amigáveis: “Arquivo incompatível” e “O arquivo não contém um JSON TITAN válido.” Erros técnicos crus não devem ser exibidos ao usuário.

## Prévia e confirmação
Antes de gravar dados, a Central TITAN mostra título, autor, data, módulos incluídos, módulos atualizados, módulos preservados e aviso de histórico preservado. Cancelar fecha a prévia sem executar transação e sem alterar tabelas.

## Transações, rollback e atomicidade
Importação de projeto valida o payload inteiro antes de qualquer escrita e aplica perfil, planos e histórico dentro de transação Dexie única. Falha intermediária aborta a transação e impede persistência parcial. Falhas de importação são registradas no histórico sem armazenar conteúdo sensível do arquivo.

## Compatibilidade e limitações conhecidas
Valores antigos de tema `premium`/`amoled` são migrados para `dark`; `system` respeita `prefers-color-scheme`. Histórico de execução de treino, refeições concluídas e cardio não é criado por importação de plano. Importação por módulo altera somente o módulo correspondente e preserva os demais.

## Onboarding e perfil
`saveProfile` preserva `createdAt` em edições e atualiza apenas `updatedAt`. “Sair e continuar depois” deve gravar `onboarding.deferred` em `appPreferences`, permitindo Dashboard vazio orientado e retomada posterior.
