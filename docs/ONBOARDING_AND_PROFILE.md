# Onboarding and Profile

O primeiro acesso mantém o seed local somente em desenvolvimento. Na importação oficial de release, o perfil vem de `payload.userProfile` e é persistido em `userProfile` sem recriar datas.

`createdAt` representa a criação original do perfil e deve ser preservado em restaurações e importações. `updatedAt` representa a última alteração conhecida no arquivo importado.

Preferências de aplicativo são importadas por `appPreferences`, permitindo que tema e ajustes futuros sejam restaurados sem depender de casts TypeScript ou de chaves soltas sem validação.
