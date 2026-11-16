# Diretrizes e Regras do Projeto — AO3 Personal Library

## 1. Fluxo de Branches e Deploy (Git / GitHub / Vercel)
- **Branch Padrão de Trabalho (`develop`)**: Toda nova funcionalidade, correção de bug ou alteração de interface DEVE ser desenvolvida, commitada e enviada (`git push origin develop`) exclusivamente na branch `develop`.
- **Proibição de Push Direto na `main`**: Nunca faça commits diretos ou merge na branch `main` por conta própria, pois a branch `main` dispara o deploy automático de produção na Vercel (`https://ao3-personal-library.vercel.app`).
- **Confirmação Obrigatória Antes de Produção**: Após finalizar e testar uma mudança na branch `develop`, sempre apresente o resultado ao usuário e **solicite confirmação explícita** antes de realizar o merge (`develop` -> `main`) ou executar `vercel deploy --prod`.

## 2. Invariantes de Experiência do Usuário (UX) e Arquitetura
- **Tema Global Unificado**: A escolha de tema (Claro, Escuro, Sépia, Papel Creme, Cinza Fosco, Verde Sálvia) no `useReaderStore` deve sempre aplicar-se ao site inteiro simultaneamente (Biblioteca Principal, Cards de Obras, Sidebar de Filtros e Leitor).
- **Menu Superior Sempre Acessível**: Tanto na Biblioteca quanto no Leitor, o menu superior deve permanecer fixo (`sticky top-0`) e acessível em qualquer ponto da página, sem exigir que o usuário role de volta até o topo.
- **Modo Paginação (Estilo Kindle)**:
  - O botão de modo deve chamar-se apenas `Paginação` (ao lado de `Rolagem`), e o controle de tamanho das letras deve ficar apenas dentro do menu `Temas`.
  - Quando em `Paginação`, a página deve ocupar a altura da tela (`h-screen overflow-hidden`) sem barra de rolagem vertical, renderizando cada página isoladamente para não prejudicar a seleção exata de texto com o mouse.
- **Seleção e Cópia de Texto**: O leitor deve manter o DOM do texto memorizado (`React.memo`) para nunca resetar a seleção do mouse para o topo da página, oferecendo ajuste fino de início/fim (palavra por palavra) e botão de copiar na barra flutuante.
- **Tradução e Exportação de Livros**:
  - A tradução no leitor deve funcionar *in-place* (estilo Google Translate: alternador `Original | Português`), traduzindo frases completas via rota neural (`/api/translate`) e salvando silenciosamente no IndexedDB (`translatedChaptersPt`) para uso offline.
  - A exportação deve suportar todos os 4 formatos de entrada (`EPUB`, `HTML`, `MOBI`, `PDF`), tanto na versão traduzida completa em Português quanto no idioma original, gerando arquivos com texto literário limpo (sem tags HTML cruas ou tabelas de tags poluindo o livro).
