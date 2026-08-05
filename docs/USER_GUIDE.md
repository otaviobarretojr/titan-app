# TITAN — Guia do Usuário

**Versão:** 1.0.0  
**Data:** 5 de agosto de 2026  
**Compatibilidade:** Chrome/Edge/Android modernos, Safari/iOS com instalação manual e navegadores com IndexedDB.  
**Ambiente:** PWA offline-first publicado como aplicação web estática.  
**Licença:** Proprietary.  
**Autor:** Otávio Barreto Jr.

## Primeiros passos

1. Abra o TITAN no navegador.
2. Aguarde o carregamento inicial e a preparação do plano local do dia.
3. Use o botão **Instalar TITAN** quando disponível ou instale manualmente no iOS pelo Safari.
4. Registre sua rotina diariamente para que Score, Coach, Analytics e relatórios tenham evidências suficientes.

## Dashboard

A Home reúne Score TITAN, recomendação prioritária do Coach, próxima refeição, treino, cardio, hidratação, sono, peso e pendências. Todos os cards usam apenas dados salvos no dispositivo.

## Treino

Entre em **Treino**, inicie ou continue a sessão do dia, registre séries com carga, repetições e RIR, acompanhe volume e conclua a sessão. Recordes e sugestões são derivados das séries existentes.

## Refeições e hidratação

Em **Nutrição**, abra cada refeição, registre como concluída, parcial, substituída ou não realizada e acompanhe calorias, proteína, carboidratos, gorduras e água. A hidratação rápida também está disponível pelo FAB.

## Cardio, evolução e saúde

Use **Cardio** para registrar duração, distância, frequência cardíaca e esforço. Use **Evolução** para peso, medidas, bioimpedância opcional e fotos. Use **Saúde/Recuperação** para sono, pressão, frequência cardíaca de repouso, sintomas e exames textuais.

## Coach, analytics e exportações

O Coach gera recomendações explicáveis a partir de janelas de 7, 30 e 90 dias. Analytics e Relatórios consolidam tendências e exportam JSON, CSV e PDF localmente, sem enviar dados a serviços externos.

## Backup e restauração

Em **Mais/Conta**, exporte backup JSON antes de limpar dados ou trocar de aparelho. O backup em nuvem é opcional, manual e exige configuração Supabase. Toda restauração substitui dados locais após confirmação explícita.

## Notificações

A Central de Notificações solicita permissão somente após ação do usuário. Lembretes são verificados com o app aberto, ao iniciar e ao voltar ao primeiro plano; navegadores não garantem execução em segundo plano sem Push API.
