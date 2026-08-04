# Supabase RLS — Backup TITAN

Execute como administrador do projeto Supabase. Ajuste nomes se usar outro schema.

```sql
create table if not exists public.cloud_backups (
  id uuid primary key,
  userId uuid not null references auth.users(id) on delete cascade,
  createdAt timestamptz not null,
  appVersion text not null,
  databaseVersion integer not null,
  sizeBytes bigint not null check (sizeBytes > 0),
  recordCount integer not null check (recordCount >= 0),
  checksum text not null,
  deviceId text not null,
  deviceName text not null,
  status text not null check (status in ('completed', 'failed')),
  storagePath text not null unique,
  constraint own_path check (storagePath like userId::text || '/backups/%')
);

alter table public.cloud_backups enable row level security;

create policy "select own backup metadata" on public.cloud_backups for select using (auth.uid() = userId);
create policy "insert own backup metadata" on public.cloud_backups for insert with check (auth.uid() = userId and storagePath like auth.uid()::text || '/backups/%');
create policy "delete own backup metadata" on public.cloud_backups for delete using (auth.uid() = userId);
```

Storage: crie o bucket privado `titan-backups` e aplique políticas equivalentes em `storage.objects` limitando `bucket_id = 'titan-backups'` e o primeiro segmento do caminho a `auth.uid()`.

```sql
create policy "upload own backup files" on storage.objects for insert with check (bucket_id = 'titan-backups' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own backup files" on storage.objects for select using (bucket_id = 'titan-backups' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own backup files" on storage.objects for delete using (bucket_id = 'titan-backups' and (storage.foldername(name))[1] = auth.uid()::text);
```

Essas políticas impedem que um usuário leia metadados ou arquivos de outro usuário. O frontend usa apenas anon key e sessão do usuário autenticado.
