# Segurança de Importação de Planos

O fluxo obrigatório é: ler arquivo, validar tamanho de 512 KB, parsear JSON, validar envelope, validar `expectedType`, validar payload, montar prévia, aguardar confirmação, abrir transação Dexie, aplicar alterações, registrar histórico e concluir.

Em erro, a transação reverte alterações e o histórico armazena somente metadados sanitizados: data, tipo, título, autor, arquivo, sucesso/falha e mensagem amigável. Conteúdo sensível do arquivo não é salvo.

Projetos validam todos os módulos antes de aplicar. Módulos ausentes são preservados e `project` nunca vira plano ativo.
