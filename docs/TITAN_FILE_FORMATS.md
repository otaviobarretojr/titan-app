# Formatos de Arquivo TITAN

Extensão oficial: `.titan.json`. A extensão `.json` é aceita somente por compatibilidade.

Contrato exclusivo:

```json
{
  "schema": "TITAN",
  "schemaVersion": "1.0",
  "type": "profile | workout | nutrition | cardio | supplements | project",
  "title": "string",
  "author": "string",
  "createdAt": "ISO date",
  "payload": {}
}
```

Formatos alternativos são rejeitados. Todo payload é validado por Zod em runtime, incluindo ISO, timezone, HH:mm, números não negativos, duplicidades, arrays, limites de texto, macros e referências internas.
