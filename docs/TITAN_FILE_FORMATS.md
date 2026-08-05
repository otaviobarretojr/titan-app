# Formatos de Arquivo TITAN

## Envelope v1.0
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

Arquivos legados com `{ "titan": true, "kind": "...", "data": {} }` são rejeitados. O importador recebe `expectedType` e bloqueia arquivos internos incompatíveis com a tela atual.

## Limites e validações
- Tamanho máximo: 512 KB.
- Extensões aceitas: `.json` e `.titan.json`.
- Datas precisam ser ISO reais.
- Horários usam `HH:mm`.
- Timezone é validado via `Intl.DateTimeFormat`.
- Números de plano e perfil não podem ser negativos.
- IDs duplicados em arrays são inválidos.
- Nutrição valida consistência básica entre macros e calorias.
