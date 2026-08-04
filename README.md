# TITAN

Sistema operacional de performance pessoal, mobile-first e instalável como PWA.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação completa

```bash
npm run validate
```

## Publicação

Todo push para `main` executa validação e publicação automática no GitHub Pages.

URL esperada:

```text
https://otaviobarretojr.github.io/titan-app/
```

## Dados

Os registros permanecem no IndexedDB do navegador. Exporte backup antes de limpar dados ou trocar de aparelho.

## PWA e confiabilidade

O TITAN pode ser instalado pelo botão **Instalar TITAN**. No iOS, use Safari → Compartilhar → Adicionar à Tela de Início. A área **Mais** reúne backup JSON versionado, diagnóstico de armazenamento e a Central de Notificações. Notificações são solicitadas somente após ação explícita e lembretes em segundo plano dependem das restrições do navegador.

## Analytics Executivo

A rota `/analytics` consolida tendências, Score TITAN, streaks, cobertura e recordes exclusivamente a partir do IndexedDB. Consulte `docs/releases/SPRINT_007_ANALYTICS.md` para detalhes.
