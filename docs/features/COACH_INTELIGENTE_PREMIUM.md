# Coach Inteligente Premium

## Incluído

- Score TITAN explicável.
- Prioridades diárias.
- Evidência utilizada em cada recomendação.
- Tendências semanais.
- Resumo executivo.
- Integração com treino, nutrição, água, cardio, sono e evolução.
- Tela dedicada do Coach.
- Score proporcional somente às categorias que possuem registros.
- Cobertura de dados explícita, sem transformar dias ausentes em zero.
- Tendências calculadas apenas com amostras reais dos últimos sete dias.
- Estados vazios para plano diário e histórico insuficiente.

## Arquitetura

Nesta etapa, o Coach usa um motor determinístico local. Isso evita dependência de API, custo externo e envio de dados pessoais.
Os planos e registros são consultados de forma reativa no IndexedDB. Categorias sem medição não reduzem o Score TITAN nem geram médias artificiais.

## Próxima evolução

Uma camada generativa poderá ser conectada futuramente para redação mais natural, preservando o motor local como fonte de verdade.
