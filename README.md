# Arquivo de Nossa Autoria — Biblioteca Pessoal (AO3 Style)

Aplicação Web em **React + Next.js (App Router + TypeScript + Tailwind CSS)** para leitura e organização de livros e fanfics pessoais, inspirada na estética e arquitetura de informação do **Archive of Our Own (AO3)**.

## ✨ Funcionalidades Principais

1. **Estética, Interface e Sistema de Tags (Estilo AO3)**:
   - **Cards de Obras (`WorkBlurbCard`)**: Grade 2x2 de ícones no canto superior esquerdo (Classificação Etária, Categoria/Ship, Avisos e Status), Título, Autor(a), Fandom/Série e Data de atualização.
   - **Tags por Categoria**: Avisos em **negrito**, Relacionamentos com **fundo destacado sutil (`#eeeeee`)**, Personagens e Tags Adicionais sublinhadas e clicáveis.
   - **Rodapé de Metadados**: Idioma, Contagem de palavras, Capítulos (`1/1` ou `2/?`), Tempo estimado de leitura, Destaques, Favorito (Kudos) e Leituras.
   - **Filtro Avançado Estilo AO3 (`FilterSidebar`)**: Incluir e Excluir múltiplas tags, classificações, avisos, categorias, status e intervalo de palavras.
   - **Coleções / Prateleiras Personalizadas**: Crie e gerencie prateleiras coloridas para organizar suas leituras.

2. **Gerenciamento de Arquivos (Client-Side Offline-First com IndexedDB)**:
   - **Importação**: Suporte a **EPUB, PDF, MOBI e HTML** (reconhecimento automático de arquivos HTML exportados do AO3, extraindo todas as tags e capítulos automaticamente).
   - **Exportação**: Exporte obras em **HTML formatado estilo AO3 (com seus destaques)**, **EPUB convertido** ou **Pacote `.ZIP`** contendo o arquivo original e o JSON de metadados/anotações.

3. **Experiência de Leitura (`ReaderExperience`)**:
   - **6 Temas de Papel Confortáveis**: *Claro Clássico*, *Escuro Noturno*, *Sépia*, *Papel Creme/Amarelado suave*, *Cinza Fosco* e *Verde Sálvia suave*.
   - **Modos de Navegação**: Alternância instantânea entre **Rolagem Vertical Contínua (Scroll)** e **Paginação Horizontal (Passar páginas para o lado)**.
   - **Métricas de Tempo em Tempo Real**: Tempo restante do capítulo e tempo restante do livro atualizados em tempo real conforme a leitura avança.
   - **Marcadores e Destaques (Estilo Kindle)**: Selecione qualquer frase para destacar em 5 cores, adicionar notas e clicar no painel lateral para voltar direto ao ponto marcado no texto.
   - **Páginas Especiais de Acesso Rápido**: Fixe mapas, árvores genealógicas ou glossários em um botão dedicado no topo do leitor, consulte em um clique e volte instantaneamente para a página onde sua leitura estava.

## 🚀 Como Executar Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` no navegador.
