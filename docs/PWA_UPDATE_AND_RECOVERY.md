# Atualização e recuperação segura do PWA

## Fluxo v1.0.2
1. O Service Worker detecta nova versão.
2. O TITAN mostra aviso claro de atualização.
3. Ao tocar em **Atualizar agora**, o app solicita ativação do Service Worker em espera.
4. O app aguarda `controllerchange` e recarrega uma única vez.
5. A inicialização bem-sucedida remove a chave temporária de sessão.

## Recuperação de chunk
Erros como `ChunkLoadError`, `Failed to fetch dynamically imported module`, `Importing a module script failed` e `Loading chunk failed` disparam uma única tentativa automática de recuperação. Se a segunda tentativa falhar, a tela global informa que os dados continuam salvos.

## Segurança de dados
A atualização não chama `indexedDB.deleteDatabase`, `Dexie.delete()` ou limpeza total de armazenamento. IndexedDB e preferências permanecem preservados.

## Roteiro manual obrigatório
1. Instalar v1.0.1.
2. Criar registros de teste.
3. Publicar v1.0.2.
4. Receber aviso de atualização.
5. Tocar em “Atualizar agora”.
6. Confirmar reinício.
7. Verificar abertura normal.
8. Confirmar preservação dos registros.
9. Simular falha de chunk.
10. Confirmar tela de recuperação.
11. Testar novamente offline.
