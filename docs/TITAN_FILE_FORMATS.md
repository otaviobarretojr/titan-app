# TITAN File Formats

## Contrato canônico v1.0

Todo arquivo de intercâmbio da release v1.0.3 usa um único envelope JSON. O contrato alternativo `titan/kind/data` foi removido e deve ser rejeitado na validação.

Campos obrigatórios do envelope:

```json
{
  "schema": "TITAN",
  "schemaVersion": "1.0",
  "type": "project",
  "title": "Release v1.0.3",
  "author": "Otávio Barreto Jr.",
  "createdAt": "2026-08-05T00:00:00.000Z",
  "payload": {}
}
```

`type` aceita `project` para projeto completo ou `module` para importação parcial. O `payload` é validado profundamente com Zod e contém apenas `userProfile`, `activePlans`, `importHistory` e `appPreferences`.

## Exemplo de payload

```json
{
  "userProfile": {
    "id": "otavio",
    "displayName": "Otávio",
    "createdAt": "2020-01-01T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z"
  },
  "activePlans": {
    "nutrition": [],
    "training": [],
    "supplementation": []
  },
  "importHistory": [],
  "appPreferences": {
    "theme": "premium"
  }
}
```

Planos ativos são armazenados por tipo (`nutrition`, `training`, `supplementation`) na tabela `activePlans`. Tabelas antigas continuam legíveis para histórico, mas não participam da importação de release para evitar mistura de contratos.
