# Configuração do Backup em Nuvem

A Sprint 015 adiciona backup manual opcional com Supabase Auth, Storage e uma tabela de metadados. O IndexedDB continua sendo a fonte operacional principal e o app funciona sem login ou sem internet.

## Variáveis

Configure apenas chaves públicas do frontend:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Nunca inclua `service_role` no cliente.

## Supabase

1. Crie um projeto Supabase.
2. Habilite login por e-mail em Auth.
3. Crie o bucket privado `titan-backups`.
4. Crie a tabela `cloud_backups` e aplique as políticas em `docs/SUPABASE_RLS.md`.
5. Publique a PWA com as variáveis acima.

## Comportamento

- Sem variáveis, `/account` mostra serviço não configurado e o backup local em `/more` permanece disponível.
- Offline, a área de nuvem bloqueia upload/restauração com mensagem clara e não cria fila automática.
- Fotos de evolução são excluídas por padrão do backup em nuvem; backup local continua podendo incluir o envelope completo.
- Não há sincronização automática bidirecional em tempo real nesta Sprint.
