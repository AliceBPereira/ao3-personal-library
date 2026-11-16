import Dexie, { type EntityTable } from "dexie";
import {
  BookmarkItem,
  CollectionShelf,
  HighlightItem,
  PinnedSpecialPage,
  WorkItem,
} from "@/types/work";

class AO3LibraryDatabase extends Dexie {
  works!: EntityTable<WorkItem, "id">;
  collections!: EntityTable<CollectionShelf, "id">;
  highlights!: EntityTable<HighlightItem, "id">;
  bookmarks!: EntityTable<BookmarkItem, "id">;
  pinnedPages!: EntityTable<PinnedSpecialPage, "id">;

  constructor() {
    super("AO3PersonalLibraryDB");
    this.version(1).stores({
      works: "id, title, author, rating, category, completionStatus, updatedAt, wordCount, format",
      collections: "id, name, createdAt",
      highlights: "id, workId, chapterIndex, createdAt",
      bookmarks: "id, workId, chapterIndex, createdAt",
      pinnedPages: "id, workId, category, createdAt",
    });
  }
}

export const db = new AO3LibraryDatabase();

export const INITIAL_COLLECTIONS: CollectionShelf[] = [
  {
    id: "shelf-favorites",
    name: "Favoritos Absolutos (Comfort Fics)",
    description: "Obras para reler sempre que precisar de conforto.",
    icon: "Heart",
    color: "#990000",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "shelf-reading",
    name: "Lendo Agora",
    description: "Leituras atuais em andamento.",
    icon: "BookOpen",
    color: "#2b6cb0",
    createdAt: "2026-01-11T10:00:00.000Z",
  },
  {
    id: "shelf-aftg",
    name: "Tudo Pelo Jogo (All For The Game)",
    description: "Coleção dedicada às Raposas de Palmetto State.",
    icon: "Flame",
    color: "#d97706",
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "shelf-crossovers",
    name: "Crossovers & Universo Alternativo",
    description: "Crossovers épicos (DCU, Sem Exy, YouTubers, etc.).",
    icon: "Sparkles",
    color: "#4f46e5",
    createdAt: "2026-01-13T10:00:00.000Z",
  },
];

export const SEED_WORKS: WorkItem[] = [
  {
    id: "work-1",
    title: "Neil Abram Josten",
    author: "Youriko",
    fandoms: ["Tudo Pelo Jogo - Nora Sakavic"],
    rating: "teen",
    category: "mm",
    warningStatus: "chose_not",
    completionStatus: "complete",
    tags: {
      warnings: ["O criador optou por não usar avisos de arquivo."],
      relationships: ["Neil Josten/Andrew Minyard"],
      characters: ["Andrew Minyard", "Neil Josten"],
      freeforms: [
        "5+1 Coisas",
        "Estou muito doente e pronto para a festa!",
        "Ponto de vista de Andrew",
      ],
    },
    summary:
      "As cinco vezes em que Andrew disse a si mesmo que odiava Neil e a única vez em que ele realmente, realmente não o odiava.",
    language: "Português / Inglês",
    wordCount: 1420,
    chaptersCurrent: 1,
    chaptersTotal: 1,
    updatedAt: "2017-10-02T14:00:00.000Z",
    createdAt: "2017-10-02T14:00:00.000Z",
    format: "epub",
    collectionIds: ["shelf-favorites", "shelf-aftg"],
    readingProgress: {
      currentChapterIndex: 0,
      scrollPercentage: 0,
      wordsRead: 0,
    },
    stats: {
      rereadCount: 19,
      kudosGiven: true,
      personalRating: 5,
      bookmarksCount: 1,
      highlightsCount: 1,
    },
    chapters: [
      {
        id: "work-1-ch-1",
        index: 0,
        title: "Capítulo 1: As Cinco Vezes (e a Única Vez)",
        wordCount: 1420,
        plainText:
          "I. A primeira vez foi na quadra de Palmetto State. Neil Josten corria como se estivesse fugindo de fantasmas, e Andrew sabia reconhecer um mentiroso de longe...",
        htmlContent: `
          <h2>I. O Mentiroso na Quadra</h2>
          <p>A primeira vez que Andrew pensou <em>Eu odeio você</em> foi no instante em que Neil Josten abriu a boca no vestiário do estádio das Raposas. Cada sílaba que saía daquela boca era calculada para parecer inofensiva, mas os olhos dele contavam uma história completamente diferente — a história de um coelho que já tinha mordido armadilhas demais.</p>
          <p>Andrew apoiou o taco de goleiro no ombro e observou o garoto correr até perder o fôlego. Ele não pertencia àquele lugar. Ele era um problema esperando para explodir no colo de Wymack, e Andrew não tinha paciência para mártires.</p>
          <hr />
          <h2>II. O Telhado em Columbia</h2>
          <p>A segunda vez aconteceu com a fumaça do cigarro subindo contra o céu escuro da Carolina do Sul. Neil estava sentado na beirada do telhado como se a gravidade fosse apenas uma sugestão educada.</p>
          <p>— Você olha demais — disse Neil, sem virar o rosto.</p>
          <p>— Você mente demais — devolveu Andrew, batendo a cinza no parapeito. — Escolha uma verdade ou cale a boca.</p>
          <p>Neil virou o rosto então, com as cicatrizes iluminadas pela luz âmbar do poste lá embaixo. — A verdade é que eu ainda estou aqui. Não deveria estar, mas estou.</p>
          <p>Andrew sentiu o peso da chave da casa de Columbia no bolso. <em>Eu odeio você</em>, ele repetiu mentalmente, porque era mais simples do que nomear o puxão silencioso no centro do peito.</p>
          <hr />
          <h2>III. A Chave e a Promessa</h2>
          <p>Na terceira vez, Neil apareceu com as mãos sujas de fita isolante e um olhar teimoso depois de um treino noturno com Kevin. Ele não pediu nada. Esse era o pior truque de Neil Josten: ele nunca pedia nada, e ainda assim fazia parecer que ficar vivo até a manhã seguinte era um acordo assinado entre os dois.</p>
          <hr />
          <h2>IV. Baltimore</h2>
          <p>Na quarta vez, as mãos de Andrew tremiam de abstinência e fúria fria quando ele segurou o queixo de Neil no corredor do hotel. Cada cicatriz nova era um insulto pessoal.</p>
          <p>— Eu disse para você não ser um herói — murmurou Andrew, a voz baixa e cortante.</p>
          <p>— Eu não fui um herói — sussurrou Neil, exausto, mas com os olhos azuis fixos nos dele. — Eu só voltei.</p>
          <hr />
          <h2>V. O Carro na Estrada</h2>
          <p>Na quinta vez, Neil dormia no banco do passageiro do Maserati enquanto a estrada cortava a madrugada. Ele dormia virado para o lado do motorista, a respiração finalmente calma, confiando que Andrew vigiaria o mundo inteiro enquanto ele descansava.</p>
          <p><em>Noventa por cento</em>, pensou Andrew, segurando o volante com firmeza. <em>Eu odeio você noventa por cento do tempo.</em></p>
          <hr />
          <h2>+1. E a única vez em que ele não odiou</h2>
          <p>— Sim ou não? — perguntou Andrew no silêncio do dormitório, a poucos centímetros da boca de Neil.</p>
          <p>— Com você é sempre sim, Drew.</p>
          <p>E quando Neil fechou os olhos sob o toque dele, sem fugir, sem correr, Andrew percebeu que os outros dez por cento nunca tiveram chance de perder.</p>
        `,
      },
    ],
  },
  {
    id: "work-2",
    title: "Maldito Neil Josten",
    author: "butitknewme",
    fandoms: ["Tudo Pelo Jogo - Nora Sakavic"],
    rating: "general",
    category: "mm",
    warningStatus: "chose_not",
    completionStatus: "complete",
    tags: {
      warnings: ["O criador optou por não usar avisos de arquivo."],
      relationships: ["Neil Josten/Andrew Minyard"],
      characters: [
        "Neil Josten",
        "Andrew Minyard",
        "Matt Boyd",
        "Danielle \"Dan\" Wilds",
        "Nicky Hemmick",
        "Kevin Day",
        "Aaron Minyard",
        "Renee Walker (Tudo Pelo Jogo)",
        "Allison Reynolds (Tudo Pelo Jogo)",
      ],
      freeforms: [
        "Neil Josten bêbado",
        "Desastre Gay Andrew Minyard",
        "Fluff",
        "Como faço para marcar alguém?",
        "Nem sei",
      ],
    },
    summary: `"Sim ou não, Drew?"\n\nAndrew franziu a testa profundamente, de alguma forma extremamente perturbado pelo fato de Neil, bêbado e mal conseguindo ficar em pé, que acabara de abraçar todos na sala, incluindo seu gêmeo abominável, ter pedido permissão antes de se aproximar dele.\n\nou\n\nNeil fica bêbado com as raposas e Andrew odeia como isso o faz sentir.`,
    language: "Inglês / Português",
    wordCount: 1006,
    chaptersCurrent: 1,
    chaptersTotal: 1,
    updatedAt: "2021-05-18T18:30:00.000Z",
    createdAt: "2021-05-18T18:30:00.000Z",
    format: "html",
    collectionIds: ["shelf-favorites", "shelf-aftg"],
    readingProgress: {
      currentChapterIndex: 0,
      scrollPercentage: 35,
      wordsRead: 350,
    },
    stats: {
      rereadCount: 33,
      kudosGiven: true,
      personalRating: 5,
      bookmarksCount: 1,
      highlightsCount: 0,
    },
    chapters: [
      {
        id: "work-2-ch-1",
        index: 0,
        title: "Capítulo Único: Sim ou Não, Drew?",
        wordCount: 1006,
        plainText:
          "Sim ou não, Drew? Andrew franziu a testa profundamente, perturbado pelo fato de Neil bêbado ter pedido permissão...",
        htmlContent: `
          <h2>Capítulo Único: Sim ou Não, Drew?</h2>
          <p>A culpa foi inteiramente de Nicky e de uma garrafa suspeitamente colorida que Matt jurou que "nem tinha gosto de álcool". Neil, que normalmente guardava sua desconfiança como um escudo medieval, aceitou um copo depois que as Raposas venceram a partida de sexta-feira.</p>
          <p>Quarenta minutos depois, o desastre estava instaurado na sala do dormitório.</p>
          <p>Primeiro, Neil anunciou solenemente para Dan que ela era a melhor capitã da história da NCAA e a abraçou pelos ombros. Matt precisou segurar o coração de emoção. Depois, Neil deu dois tapinhas desajeitados nas costas de Kevin — que congelou como uma estátua grega — e, para o horror absoluto de todos os presentes, puxou Aaron para um abraço rápido de meio segundo antes de soltá-lo.</p>
          <p>Do parapeito da janela, Andrew assistia à cena com uma expressão perfeitamente vazia.</p>
          <p>Então os olhos azuis e brilhantes de Neil encontraram os dele do outro lado da sala. Neil atravessou o tapete com passos ligeiramente tortos, mas parou a exatos dois passos de distância da janela. Ele não estendeu a mão. Não invadiu o espaço de Andrew.</p>
          <p>Em vez disso, com as bochechas coradas e um foco quase reverente, Neil perguntou baixinho:</p>
          <p>— Sim ou não, Drew?</p>
          <p>Andrew franziu a testa profundamente, de alguma forma extremamente perturbado pelo fato de Neil, bêbado e mal conseguindo ficar em pé, que acabara de abraçar todos na sala, incluindo seu gêmeo abominável, ter se lembrado da regra mais importante entre eles antes mesmo de respirar perto dele.</p>
          <p>— Você é um idiota — disse Andrew em voz baixa. — Sim. Venha logo aqui antes que você caia no tapete.</p>
          <p>O sorriso que iluminou o rosto de Neil quando ele apoiou a testa na curva do pescoço de Andrew deveria ser ilegal em pelo menos doze estados.</p>
        `,
      },
    ],
  },
  {
    id: "work-3",
    title: "Neil Josten-Wayne",
    author: "SerpentineLee",
    fandoms: ["Batman - Todos os tipos de mídia", "Tudo Pelo Jogo - Nora Sakavic"],
    rating: "not_rated",
    category: "gen",
    warningStatus: "none",
    completionStatus: "wip",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [
        "Neil Josten & Alfred Pennyworth",
        "Neil Josten & Jason Todd",
        "Neil Josten & Bruce Wayne",
      ],
      characters: [
        "Neil Josten",
        "Jason Todd",
        "Bruce Wayne",
        "Dick Grayson",
        "Tim Drake (DCU)",
        "Alfred Pennyworth",
      ],
      freeforms: [
        "Neil Josten em Gotham",
        "Bruce Wayne adota Neil Josten",
        "Jason Todd é o Capuz Vermelho",
        "Bruce Wayne é o Batman",
        "Bom Pai Bruce Wayne",
        "Violência não gráfica",
      ],
    },
    summary:
      "O que aconteceria se a mãe de Neil morresse quando ele tivesse apenas 13 anos, resultando em sua mudança para Gotham, onde ele precisaria ser resgatado pelo Capuz Vermelho?\nOu uma fanfic sobre Neil Josten sendo usado como isca para adoção pelos Wayne e Jason Todd sendo, no fim das contas, igualzinho ao Bruce quando confrontado com um garoto de rua de cabelos negros e olhos azuis disposto a lutar com um cara duas vezes maior que ele?",
    language: "Inglês",
    wordCount: 5280,
    chaptersCurrent: 2,
    chaptersTotal: null, // 6/? style
    updatedAt: "2020-06-29T20:00:00.000Z",
    createdAt: "2020-06-10T20:00:00.000Z",
    format: "epub",
    collectionIds: ["shelf-reading", "shelf-crossovers"],
    readingProgress: {
      currentChapterIndex: 0,
      scrollPercentage: 60,
      wordsRead: 1500,
    },
    stats: {
      rereadCount: 6,
      kudosGiven: true,
      personalRating: 5,
      bookmarksCount: 1,
      highlightsCount: 1,
    },
    chapters: [
      {
        id: "work-3-ch-1",
        index: 0,
        title: "Capítulo 1: Becos do Crime Alley",
        wordCount: 2800,
        plainText:
          "Gotham cheirava a chuva ácida e ferro velho, mas para um garoto de treze anos com uma mochila cheia de notas falsas, era o esconderijo perfeito...",
        htmlContent: `
          <h2>Capítulo 1: Becos do Crime Alley</h2>
          <p>Gotham cheirava a chuva ácida, fumaça e ferro velho, mas para um garoto de treze anos com o cabelo pintado de preto, lentes de contato baratas e uma mochila surrada escondida sob uma tábua solta, era a cidade perfeita para desaparecer.</p>
          <p>Em Gotham, ninguém fazia perguntas quando um garoto mancava pela rua às três da manhã. Todo mundo ali tinha seus próprios segredos.</p>
          <p>O problema começou quando três homens armados do Beco do Crime acharam que um adolescente magricela seria um alvo fácil. Eles não esperavam que o adolescente soubesse exatamente onde chutar um joelho para deslocar a patela, nem que ele puxasse uma faca com a calma fria de um veterano.</p>
          <p>E nem o garoto esperava que um homem com um capacete vermelho metálico descesse do telhado como um morcego blindado.</p>
          <p>— Ei, pirralho — resmungou a voz modulada do Capuz Vermelho, olhando para os dois capangas caídos no chão molhado. — Essa é a minha área. E você está sangrando no meu asfalto.</p>
          <p>— Eu estava resolvendo — retrucou Neil em russo antes de mudar para o inglês com sotaque arrastado. — Não pedi ajuda.</p>
          <p>Debaixo do capacete, Jason Todd piscou. Cabelo preto desgrenhado, olhos azuis ferozes, cinquenta quilos molhado e uma atitude suicida diante de homens com o dobro do seu tamanho. <em>Ah, droga</em>, pensou Jason. <em>Estou virando o Bruce.</em></p>
        `,
      },
      {
        id: "work-3-ch-2",
        index: 1,
        title: "Capítulo 2: Guia de Referência — Mapa de Gotham & Árvore da Família Wayne",
        wordCount: 2480,
        plainText:
          "Página especial de referência: Mapa territorial de Gotham e estrutura da Mansão Wayne...",
        htmlContent: `
          <h2>Guia de Referência: Territórios de Gotham & Família Wayne</h2>
          <p><em>Dica: Você pode fixar esta página no botão <strong>"Páginas Especiais (Fixadas)"</strong> da barra superior do leitor para consultá-la a qualquer momento durante a leitura e voltar exatamente para onde estava!</em></p>
          <h3>1. Divisão Territorial de Gotham (Noite)</h3>
          <ul>
            <li><strong>Crime Alley & Park Row:</strong> Patrulhado pelo Capuz Vermelho (Jason Todd). Esconderijo inicial de Neil.</li>
            <li><strong>Bristol & Mansão Wayne:</strong> Zona residencial onde ficam a Mansão Wayne e a Batcaverna.</li>
            <li><strong>Bowery & Docas do Leste:</strong> Rotas de contrabando onde os homens de Nathan Wesninski tentam rastrear fugas portuárias.</li>
          </ul>
          <h3>2. Árvore de Relações na Mansão Wayne</h3>
          <ul>
            <li><strong>Alfred Pennyworth:</strong> O único adulto em quem Neil confia para fazer curativos (e cujo chá ele aceita sem testar veneno depois da terceira semana).</li>
            <li><strong>Bruce Wayne (Batman):</strong> Falsificou os documentos de adoção de "Neil Wayne" em tempo recorde para bloquear qualquer busca federal ou da máfia de Baltimore.</li>
            <li><strong>Jason Todd (Red Hood):</strong> Irmão mais velho não-oficial que ensina Neil a destravar fechaduras eletrônicas da Wayne Enterprises.</li>
            <li><strong>Tim Drake (Red Robin):</strong> Descobriu a identidade de Nathaniel Wesninski em 48 horas e apagou todos os rastros digitais.</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: "work-4",
    title: "Neil Josten, Sugar Daddy",
    author: "tomat0head",
    fandoms: ["Tudo Pelo Jogo - Nora Sakavic"],
    rating: "teen",
    category: "mm",
    warningStatus: "none",
    completionStatus: "complete",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: ["Neil Josten/Andrew Minyard"],
      characters: [
        "Neil Josten",
        "Andrew Minyard",
        "Kevin Day",
        "Matt Boyd",
        "Aaron Minyard",
        "Allison Reynolds",
        "Nicky Hemmick",
        "The Foxes (All For The Game)",
      ],
      freeforms: [
        "Fluff",
        "Humor",
        "Suave Neil Josten/Andrew Minyard",
        "Caos",
        "Neil é rico",
        "Neil gosta de mimar o namorado",
      ],
    },
    summary: `"Provavelmente tenho um milhão e alguns trocados espalhados por aí que eu poderia acessar", diz Neil, mas se apressa em terminar: "Mas provavelmente não vou tentar pegar o dinheiro, a menos que tenha um motivo melhor para usá-lo e me livrar dele. Não quero andar por aí com dinheiro sujo."`,
    language: "Português",
    wordCount: 3450,
    chaptersCurrent: 1,
    chaptersTotal: 1,
    updatedAt: "2021-10-08T12:00:00.000Z",
    createdAt: "2021-10-08T12:00:00.000Z",
    format: "mobi",
    collectionIds: ["shelf-aftg"],
    readingProgress: {
      currentChapterIndex: 0,
      scrollPercentage: 100,
      wordsRead: 3450,
    },
    stats: {
      rereadCount: 12,
      kudosGiven: true,
      personalRating: 5,
      bookmarksCount: 0,
      highlightsCount: 0,
    },
    chapters: [
      {
        id: "work-4-ch-1",
        index: 0,
        title: "Capítulo 1: Dinheiro Sujo e Sorvete Caro",
        wordCount: 3450,
        plainText:
          "Provavelmente tenho um milhão e alguns trocados espalhados por aí que eu poderia acessar, diz Neil...",
        htmlContent: `
          <h2>Capítulo 1: Dinheiro Sujo e Sorvete Caro</h2>
          <p>— Provavelmente tenho um milhão e alguns trocados espalhados por aí que eu poderia acessar — comentou Neil casualmente enquanto amarrava os cadarços do tênis de corrida. Vendo o silêncio mortal que caiu sobre o quarto, ele se apressou em completar: — Mas provavelmente não vou tentar pegar o dinheiro, a menos que tenha um motivo melhor para usá-lo e me livrar dele. Não quero andar por aí com dinheiro sujo.</p>
          <p>Allison baixou os óculos de sol lentamente. Nicky engasgou com o próprio café.</p>
          <p>— Você está me dizendo — começou Nicky, com a voz uma oitava acima do normal — que você usa as mesmas três camisetas desbotadas desde que chegou na Carolina do Sul e tem <em>um milhão de dólares</em> escondidos em armazéns e contas suíças?</p>
          <p>— As camisetas ainda servem — respondeu Neil, genuinamente confuso com o drama.</p>
          <p>Dois dias depois, porém, Neil descobriu um motivo excelente para usar o dinheiro: comprar absolutamente qualquer coisa para a qual Andrew olhasse por mais de três segundos.</p>
        `,
      },
    ],
  },
  {
    id: "work-5",
    title: "andrewnotfound seguiu você (Эндрюnotfound seguiu você) | andriel",
    author: "ghostboyparty",
    fandoms: ["Tudo Pelo Jogo - Nora Sakavic"],
    rating: "mature",
    category: "mm",
    warningStatus: "none",
    completionStatus: "wip",
    tags: {
      warnings: ["Não se aplicam avisos de arquivo."],
      relationships: [
        "Neil Josten/Andrew Minyard",
        "Kevin Day/Aaron Minyard",
        "Jean Moreau/Renée Walker",
        "Andriel - Relacionamento",
      ],
      characters: [
        "Andrew Minyard",
        "Neil Josten",
        "Kevin Day",
        "Aaron Minyard",
        "Katelyn MacKenzie (Tudo Pelo Jogo)",
        "Renee Walker (Tudo Pelo Jogo)",
        "Jean Moreau",
      ],
      freeforms: [
        "Ficção de mensagens de texto",
        "Mensagens de texto, depois",
        "Universo Alternativo - Sem Exy (Tudo Pelo Jogo)",
        "Andrew Minyard é russo",
        "Neil é um youtuber e Andrew deixa comentários para ele.",
        "Queima lenta?",
        "Neil aprende a falar russo para poder traduzir os comentários de Andrew.",
        "Neil gosta de escalar coisas e Andrew tem um ataque de pânico toda vez que isso acontece.",
      ],
    },
    summary: `Эндрюnotfound seguiu você\nЭндрюnotfound curtiu sua publicação\nЭндрюnotfound comentou no seu vídeo\n\nou\n\nNeil Josten é um YouTuber de exploração urbana que desenvolve uma relação com Andrew Minyard depois que este demonstra interesse em Neil e seus vídeos.`,
    language: "Português / Russo",
    wordCount: 8420,
    chaptersCurrent: 3,
    chaptersTotal: 10,
    updatedAt: "2020-11-10T16:00:00.000Z",
    createdAt: "2020-11-01T16:00:00.000Z",
    format: "pdf",
    collectionIds: ["shelf-reading", "shelf-crossovers", "shelf-aftg"],
    readingProgress: {
      currentChapterIndex: 0,
      scrollPercentage: 20,
      wordsRead: 1600,
    },
    stats: {
      rereadCount: 4,
      kudosGiven: false,
      personalRating: 4,
      bookmarksCount: 0,
      highlightsCount: 0,
    },
    chapters: [
      {
        id: "work-5-ch-1",
        index: 0,
        title: "Capítulo 1: Notificações à Meia-Noite",
        wordCount: 4210,
        plainText:
          "Эндрюnotfound seguiu você. Neil olhou para a tela do celular enquanto editava o vídeo da torre de rádio abandonada...",
        htmlContent: `
          <h2>Capítulo 1: Notificações à Meia-Noite</h2>
          <blockquote>
            <p><strong>Эндрюnotfound</strong> seguiu você.<br/>
            <strong>Эндрюnotfound</strong> curtiu sua publicação.<br/>
            <strong>Эндрюnotfound</strong> comentou no seu vídeo: <em>"A viga leste aos 04:12 está enferrujada. Se você pisar nela de novo na descida, vai quebrar o pescoço. Idiota."</em></p>
          </blockquote>
          <p>Neil piscou para a tela iluminada do notebook às duas da manhã. Seu canal de exploração urbana, <em>RunawayRabbit</em>, tinha alguns milhares de inscritos que gostavam de ver filmagens em primeira pessoa de fábricas abandonadas, pontes ferroviárias e telhados altos demais para pessoas sensatas.</p>
          <p>Normalmente os comentários variavam entre "Que vista incrível!" e "Cara, você é maluco". Mas aquele comentário estava inteiramente em russo.</p>
          <p>Neil colou a frase no tradutor, leu duas vezes e abriu um sorriso torto. Pela primeira vez em meses, ele respondeu a um comentário:</p>
          <p><em>@RunawayRabbit: "Obrigado pela dica. Usei a escada oeste na descida. Prometo testar a viga com o pé esquerdo da próxima vez."</em></p>
          <p>Três minutos depois, uma nova notificação brilhou na tela.</p>
        `,
      },
      {
        id: "work-5-ch-2",
        index: 1,
        title: "Capítulo 2: Glossário Russo-Português das Mensagens",
        wordCount: 4210,
        plainText: "Glossário rápido das expressões russas usadas nos comentários de Andrew...",
        htmlContent: `
          <h2>Capítulo 2: Glossário Russo-Português das Mensagens</h2>
          <p><em>Página de referência rápida para os comentários e mensagens de texto em cirílico ao longo da história:</em></p>
          <ul>
            <li><strong>Кролик (Krolik):</strong> Coelho — o apelido que Andrew passa a usar para Neil nos comentários depois do terceiro vídeo no guindaste.</li>
            <li><strong>Идиот (Idiot):</strong> Idiota — presente em 98% das mensagens de Andrew toda vez que Neil escala uma estrutura sem corda de segurança.</li>
            <li><strong>Да или нет? (Da ili net?):</strong> Sim ou não?</li>
            <li><strong>Останься (Ostan'sya):</strong> Fique.</li>
          </ul>
        `,
      },
    ],
  },
];

export async function ensureDatabaseSeeded() {
  if (typeof window === "undefined") return;
  const count = await db.works.count();
  if (count === 0) {
    await db.collections.bulkPut(INITIAL_COLLECTIONS);
    await db.works.bulkPut(SEED_WORKS);
    // Adicionar 1 destaque e 1 página especial fixada de exemplo para o usuário já testar!
    await db.highlights.put({
      id: "hl-demo-1",
      workId: "work-1",
      chapterIndex: 0,
      selectedText: "Com você é sempre sim, Drew.",
      note: "Citação favorita do final do capítulo!",
      color: "yellow",
      createdAt: new Date().toISOString(),
      scrollPercentage: 90,
    });
    await db.pinnedPages.put({
      id: "pin-demo-1",
      workId: "work-3",
      title: "Mapa de Gotham & Árvore da Família Wayne",
      category: "map",
      chapterIndex: 1,
      scrollPercentage: 0,
      customHtmlOrNotes:
        "Crime Alley (Jason Todd / Capuz Vermelho) • Bristol (Mansão Wayne & Batcaverna) • Docas do Leste (Rotas portuárias). Alfred Pennyworth, Bruce Wayne, Jason Todd e Tim Drake.",
      createdAt: new Date().toISOString(),
    });
    await db.pinnedPages.put({
      id: "pin-demo-2",
      workId: "work-5",
      title: "Glossário Russo-Português (Andriel)",
      category: "glossary",
      chapterIndex: 1,
      scrollPercentage: 0,
      customHtmlOrNotes:
        "Кролик (Coelho) • Идиот (Idiota) • Да или нет? (Sim ou não?) • Останься (Fique).",
      createdAt: new Date().toISOString(),
    });
  }
}
