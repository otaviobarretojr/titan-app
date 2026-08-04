# Sprint 013.1 — Estabilização da Plataforma

## Objetivo

Estabilizar o PROJETO TITAN sem adicionar novas funcionalidades, reduzindo débito técnico, reforçando validações de plataforma local e documentando os contratos críticos da aplicação offline-first.

## Entregas

- Refatoração do `AppShell` para separar a folha de ações rápidas da estrutura principal, reduzindo renderizações desnecessárias por meio de callbacks estáveis e memoização da navegação.
- Revisão de nomenclatura e organização local dos tipos de navegação e ações rápidas.
- Limpeza de espaçamento técnico no schema Dexie para facilitar auditoria de migrações.
- Teste de integridade do schema IndexedDB/Dexie, cobrindo versão atual, tabelas críticas e índices compostos usados por telas offline, relatórios e timeline do Coach.
- Revalidação documental do PWA: atualização via prompt, limpeza de caches antigos, navegação `NetworkFirst` e imagens `CacheFirst` com expiração.

## Itens fora de escopo

- Nenhuma nova funcionalidade de produto foi adicionada.
- Nenhuma integração remota foi introduzida.
- Nenhum dado ausente passou a ser inferido.

## Validação esperada

Antes da abertura da Pull Request, executar:

```bash
npm run validate
```
