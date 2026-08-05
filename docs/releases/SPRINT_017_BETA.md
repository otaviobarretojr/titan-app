# Sprint 017 — Auditoria Completa e Beta

## Motivation

Preparar o TITAN para a etapa beta anterior à versão 1.0 por meio de uma auditoria completa, sem adicionar funcionalidades nem alterar regras de negócio desnecessariamente.

## Description

A Sprint 017 revisou os fluxos funcionais, UX, performance, PWA, acessibilidade, código, segurança e documentação. As correções aplicadas foram restritas a inconsistências identificadas durante a auditoria: labels e semântica em fotos de evolução e feedback/dialog crítico do backup em nuvem.

## Audit Summary

### Bugs encontrados

- Campos do fluxo de fotos de evolução dependiam apenas de placeholders visuais, reduzindo clareza para leitores de tela.
- Ícones do card de fotos não estavam marcados como decorativos.
- O dialog de restauração em nuvem não declarava semântica completa de dialog modal.
- Mensagem operacional da conta não anunciava mudanças como status.

### Bugs corrigidos

- Labels acessíveis adicionados ao seletor de pose, peso, observações e input oculto de arquivo em fotos de evolução.
- Ícones decorativos de fotos e exclusão marcados com `aria-hidden`.
- Dialog de restauração em nuvem recebeu `role="dialog"`, `aria-modal`, `aria-labelledby` e `aria-describedby`.
- Feedback operacional da conta recebeu `role="status"` e `aria-live="polite"`.

### Melhorias adiadas

- Teste manual completo em dispositivos iOS e Android reais instalados como PWA.
- Auditoria com Lighthouse/Axe em navegador real após ambiente beta publicado.
- Revisão visual final por design em múltiplos tamanhos de tela.

### Riscos conhecidos

- Notificações de sistema continuam sujeitas a limitações do navegador e não garantem execução em segundo plano.
- Backup em nuvem não possui criptografia ponta a ponta nem merge automático entre dispositivos.
- Supabase depende de configuração externa e aplicação manual das políticas RLS documentadas.
- Fotos de evolução podem consumir armazenamento local relevante conforme volume de uso.

### Pendências para v1.0

- Validar PWA instalado em iOS Safari e Chrome/Android.
- Validar fluxo Supabase em projeto de produção com RLS ativa.
- Executar auditoria Lighthouse/Axe na URL beta publicada.
- Revisar textos legais de privacidade e limitações de saúde antes da divulgação pública.

## Performance

- Rotas permanecem em `React.lazy` com `Suspense` e skeletons reutilizáveis.
- Não foram adicionadas dependências, imports pesados ou novas chamadas remotas.
- O componente de fotos de evolução foi reorganizado para legibilidade sem alterar processamento local ou persistência.

## Accessibility

- Reforço de labels em campos de foto.
- Semântica de status para mensagens operacionais.
- Semântica modal explícita na confirmação de restauração em nuvem.
- Mantido respeito a foco visível e `prefers-reduced-motion` já definido no design system.

## Testing

Executar antes de publicar:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run validate
```

Não declarar aprovação sem execução completa no ambiente alvo.

## Release Notes

A Sprint 017 é uma entrega de auditoria e beta. Não cria novas funcionalidades, não altera schemas IndexedDB e não muda regras de negócio. O foco é reduzir riscos antes da v1.0 e consolidar documentação de publicação beta.

## Known Issues

- `npm install` pode depender de estabilidade da rede/registry no ambiente de CI ou desenvolvimento.
- Push notifications reais permanecem fora do escopo sem backend Push API.
- Restauração de backup em nuvem substitui dados locais após confirmação e snapshot local, sem merge automático.
