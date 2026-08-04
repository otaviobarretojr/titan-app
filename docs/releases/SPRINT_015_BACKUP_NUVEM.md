# Sprint 015 — Backup em Nuvem e Sincronização Segura

## Entregas

- Rota `/account` com autenticação opcional por e-mail, status de conta, dispositivo local, histórico e ações de backup em nuvem.
- Camadas separadas para autenticação, repositório local, serialização, validação, serviço de backup em nuvem e identidade do dispositivo.
- Envelope de backup v3 com versão do app, versão Dexie, device ID, checksum determinístico, preferências, contagens, tamanho estimado e metadados de compatibilidade.
- Restauração controlada: download, validação, comparação visual, confirmação explícita, snapshot local de segurança e transação IndexedDB.
- Modo degradado sem Supabase e modo offline sem fila automática.

## Segurança e privacidade

Dados permanecem locais por padrão. Backup em nuvem é manual, não substitui IndexedDB e não implementa sincronização automática bidirecional. Fotos são excluídas por padrão do backup em nuvem para reduzir exposição de dados sensíveis. A exclusão de backup exige confirmação e não apaga dados locais.

## Limitações conhecidas

- Não há criptografia ponta a ponta implementada nesta Sprint.
- Não há resolução automática de conflitos ou merge entre dispositivos.
- A configuração Supabase e as políticas RLS precisam ser aplicadas manualmente.
