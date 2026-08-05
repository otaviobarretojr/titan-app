# Segurança de Importação de Planos

Toda importação TITAN usa um serviço único: `src/services/titanFile/titanFileService.ts`.

## Fluxo
1. Ler arquivo com `readTitanFile(file, expectedType)`.
2. Validar envelope e payload com Zod.
3. Montar prévia com módulos incluídos, alterados e preservados.
4. Confirmar em modal próprio, sem `window.alert`/`window.confirm` como fluxo principal.
5. Aplicar em transação Dexie única.

## Rollback
Falhas durante aplicação abortam a transação e registram linha sanitizada em `importHistory`, sem persistir conteúdo sensível nem stack trace. Módulos ausentes são preservados e `project` nunca entra em `activePlans`.
