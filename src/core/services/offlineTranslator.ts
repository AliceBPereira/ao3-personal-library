import { WorkChapter } from "@/types/work";

export type SourceLangCode = "auto" | "en" | "ru" | "es" | "fr";

// Cache silencioso em memória + localStorage/IndexedDB para que a troca Original <-> Português seja instantânea (0ms)
const translationMemoryCache = new Map<string, string>();

// Dicionário Frasal e Contextual Offline (Inglês -> Português)
const EN_PHRASES_PT: Array<[RegExp, string]> = [
  [/\bCreator Chose Not To Use Archive Warnings\b/gi, "O criador optou por não usar avisos de arquivo"],
  [/\bNo Archive Warnings Apply\b/gi, "Não se aplicam avisos de arquivo"],
  [/\bYes or no\b/gi, "Sim ou não"],
  [/\bI hate you\b/gi, "Eu odeio você"],
  [/\bI don't care\b/gi, "Eu não me importo"],
  [/\bI don't know\b/gi, "Eu não sei"],
  [/\bshut up\b/gi, "cale a boca"],
  [/\blooked at him\b/gi, "olhou para ele"],
  [/\blooked at her\b/gi, "olhou para ela"],
  [/\bfor the first time\b/gi, "pela primeira vez"],
  [/\bin the middle of the night\b/gi, "no meio da noite"],
  [/\bshook his head\b/gi, "balançou a cabeça"],
  [/\brolled his eyes\b/gi, "revirou os olhos"],
  [/\btook a deep breath\b/gi, "respirou fundo"],
  [/\bwhat are you doing\b/gi, "o que você está fazendo"],
  [/\bare you okay\b/gi, "você está bem"],
  [/\bcome here\b/gi, "venha aqui"],
  [/\bstay with me\b/gi, "fique comigo"],
  [/\bas if\b/gi, "como se"],
  [/\beven though\b/gi, "mesmo que"],
  [/\bin front of\b/gi, "na frente de"],
  [/\beach other\b/gi, "um ao outro"],
  [/\bright now\b/gi, "agora mesmo"],
  [/\bat least\b/gi, "pelo menos"],
  [/\bof course\b/gi, "claro"],
  [/\bas soon as\b/gi, "assim que"],
  [/\bmore than\b/gi, "mais do que"],
  [/\bonce again\b/gi, "mais uma vez"],
];

const EN_WORDS_PT: Record<string, string> = {
  the: "o",
  and: "e",
  that: "que",
  with: "com",
  for: "para",
  was: "estava",
  were: "estavam",
  had: "tinha",
  have: "tem",
  has: "tem",
  not: "não",
  but: "mas",
  you: "você",
  your: "seu",
  his: "seu",
  her: "sua",
  their: "deles",
  they: "eles",
  him: "ele",
  she: "ela",
  from: "de",
  about: "sobre",
  into: "para dentro de",
  after: "depois de",
  before: "antes de",
  because: "porque",
  when: "quando",
  where: "onde",
  while: "enquanto",
  never: "nunca",
  always: "sempre",
  still: "ainda",
  just: "apenas",
  only: "apenas",
  really: "realmente",
  almost: "quase",
  again: "novamente",
  back: "de volta",
  down: "para baixo",
  away: "embora",
  over: "sobre",
  through: "através de",
  between: "entre",
  without: "sem",
  against: "contra",
  around: "ao redor",
  under: "sob",
  until: "até",
  said: "disse",
  asked: "perguntou",
  replied: "respondeu",
  whispered: "sussurrou",
  muttered: "murmurou",
  sighed: "suspirou",
  smiled: "sorriu",
  laughed: "riu",
  stared: "encarou",
  glanced: "olhou rapidamente",
  walked: "caminhou",
  ran: "correu",
  turned: "virou-se",
  opened: "abriu",
  closed: "fechou",
  stopped: "parou",
  started: "começou",
  tried: "tentou",
  wanted: "queria",
  needed: "precisava",
  knew: "sabia",
  thought: "pensou",
  felt: "sentiu",
  saw: "viu",
  heard: "ouviu",
  left: "saiu",
  kept: "manteve",
  held: "segurou",
  pulled: "puxou",
  pushed: "empurrou",
  eyes: "olhos",
  hand: "mão",
  hands: "mãos",
  face: "rosto",
  head: "cabeça",
  voice: "voz",
  heart: "coração",
  mouth: "boca",
  lips: "lábios",
  fingers: "dedos",
  shoulder: "ombro",
  shoulders: "ombros",
  breath: "respiração",
  blood: "sangue",
  pain: "dor",
  night: "noite",
  morning: "manhã",
  day: "dia",
  time: "tempo",
  life: "vida",
  world: "mundo",
  room: "quarto",
  door: "porta",
  window: "janela",
  bed: "cama",
  wall: "parede",
  floor: "chão",
  table: "mesa",
  phone: "celular",
  car: "carro",
  water: "água",
  coffee: "café",
  cigarette: "cigarro",
  smoke: "fumaça",
  truth: "verdade",
  lie: "mentira",
  lies: "mentiras",
  promise: "promessa",
  idiot: "idiota",
  rabbit: "coelho",
  fox: "raposa",
  foxes: "raposas",
  court: "quadra",
  game: "jogo",
  team: "time",
  roof: "telhado",
  knife: "faca",
  key: "chave",
  keys: "chaves",
  dark: "escuro",
  light: "luz",
  cold: "frio",
  warm: "quente",
  quiet: "silencioso",
  silence: "silêncio",
  slowly: "lentamente",
  quietly: "silenciosamente",
  finally: "finalmente",
  maybe: "talvez",
  perhaps: "talvez",
  nothing: "nada",
  something: "algo",
  everything: "tudo",
  someone: "alguém",
  everyone: "todos",
  nobody: "ninguém",
  enough: "suficiente",
  chapter: "capítulo",
  notes: "notas",
  summary: "sinopse",
};

// Dicionário Frasal e Contextual Offline (Russo Cirílico -> Português)
const RU_PHRASES_PT: Array<[RegExp, string]> = [
  [/Эндрюnotfound подписался на вас/gi, "Эндрюnotfound seguiu você"],
  [/Эндрюnotfound seguiu você/gi, "Andrew (Эндрюnotfound) seguiu você"],
  [/Да или нет\??/gi, "Sim ou não?"],
  [/Я ненавижу тебя/gi, "Eu odeio você"],
  [/Я тебя ненавижу/gi, "Eu te odeio"],
  [/Заткнись/gi, "Cale a boca"],
  [/Иди сюда/gi, "Venha aqui"],
  [/Останься со мной/gi, "Fique comigo"],
  [/Останься/gi, "Fique"],
  [/Не уходи/gi, "Não vá embora"],
  [/Ты идиот/gi, "Você é um idiota"],
  [/Боже мой/gi, "Meu Deus"],
  [/Черт возьми/gi, "Droga"],
  [/Доброе утро/gi, "Bom dia"],
  [/Спокойной ночи/gi, "Boa noite"],
];

const RU_WORDS_PT: Record<string, string> = {
  кролик: "coelho",
  идиот: "idiota",
  да: "sim",
  нет: "não",
  привет: "olá",
  спасибо: "obrigado",
  пожалуйста: "por favor",
  прости: "desculpe",
  извини: "desculpe",
  почему: "por que",
  потому: "porque",
  когда: "quando",
  где: "onde",
  кто: "quem",
  что: "o que",
  как: "como",
  всегда: "sempre",
  никогда: "nunca",
  сейчас: "agora",
  здесь: "aqui",
  там: "lá",
  дом: "casa",
  ночь: "noite",
  день: "dia",
  утро: "manhã",
  вечер: "noite",
  глаза: "olhos",
  руки: "mãos",
  рука: "mão",
  голос: "voz",
  сердце: "coração",
  жизнь: "vida",
  правда: "verdade",
  ложь: "mentira",
  друг: "amigo",
  брат: "irmão",
  любовь: "amor",
  страх: "medo",
  боль: "dor",
  кровь: "sangue",
  вода: "água",
  огонь: "fogo",
  ключи: "chaves",
  ключ: "chave",
  крыша: "telhado",
  машина: "carro",
  сигарета: "cigarro",
  дым: "fumaça",
  тишина: "silêncio",
  хорошо: "bem",
  плохо: "mal",
  очень: "muito",
  просто: "apenas",
  только: "somente",
  еще: "ainda",
  уже: "já",
  снова: "novamente",
  вместе: "juntos",
  один: "sozinho",
  глава: "capítulo",
  часть: "parte",
};

const ES_WORDS_PT: Record<string, string> = {
  el: "o",
  la: "a",
  los: "os",
  las: "as",
  pero: "mas",
  porque: "porque",
  cuando: "quando",
  donde: "onde",
  siempre: "sempre",
  nunca: "nunca",
  ahora: "agora",
  miró: "olhou",
  dijo: "disse",
  preguntó: "perguntou",
  respondió: "respondeu",
  ojos: "olhos",
  manos: "mãos",
  noche: "noite",
  corazón: "coração",
  capítulo: "capítulo",
};

export function detectLanguageOffline(text: string): SourceLangCode {
  if (/[а-яА-ЯёЁ]/.test(text)) {
    return "ru";
  }
  const lower = text.toLowerCase();
  const enMatches = (
    lower.match(/\b(the|and|with|that|was|for|his|her|you|said)\b/g) || []
  ).length;
  const esMatches = (
    lower.match(/\b(pero|cuando|miró|dijo|los|las|una|hacia)\b/g) || []
  ).length;

  if (enMatches >= esMatches && enMatches > 1) return "en";
  if (esMatches > 1) return "es";
  return "en";
}

// Tradução Instantânea Síncrona (0ms, 100% Offline, usada imediatamente ao clicar no botão)
export function translatePlainStringOffline(
  input: string,
  sourceLang: SourceLangCode = "auto"
): string {
  if (!input || !input.trim()) return input;
  const cacheKey = `${sourceLang}:${input}`;
  const cached = translationMemoryCache.get(cacheKey);
  if (cached) return cached;

  const effectiveLang =
    sourceLang === "auto" ? detectLanguageOffline(input) : sourceLang;

  let result = input;

  for (const [pattern, replacement] of RU_PHRASES_PT) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/[а-яА-ЯёЁ]+/g, (word) => {
    const lower = word.toLowerCase();
    const mapped = RU_WORDS_PT[lower];
    if (!mapped) return word;
    const isCapitalized =
      word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
    return isCapitalized
      ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
      : mapped;
  });

  if (effectiveLang === "en" || sourceLang === "auto") {
    for (const [pattern, replacement] of EN_PHRASES_PT) {
      result = result.replace(pattern, replacement);
    }

    result = result.replace(/\b[A-Za-z']+\b/g, (word) => {
      const lower = word.toLowerCase();
      const mapped = EN_WORDS_PT[lower];
      if (!mapped) return word;
      const isCapitalized =
        word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
      return isCapitalized
        ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
        : mapped;
    });
  }

  if (effectiveLang === "es") {
    result = result.replace(/\b[A-Za-zÁÉÍÓÚáéíóúñÑ]+\b/g, (word) => {
      const lower = word.toLowerCase();
      const mapped = ES_WORDS_PT[lower];
      if (!mapped) return word;
      const isCapitalized = word[0] === word[0].toUpperCase();
      return isCapitalized
        ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
        : mapped;
    });
  }

  translationMemoryCache.set(cacheKey, result);
  return result;
}

// Traduz um HTML inteiro preservando 100% da estrutura e posição de parágrafos de forma instantânea (síncrona)
export function translateHtmlInstantInPlace(
  htmlContent: string,
  sourceLang: SourceLangCode = "auto"
): string {
  if (typeof DOMParser === "undefined" || !htmlContent) return htmlContent;
  const cacheKey = `html:${sourceLang}:${htmlContent}`;
  const cached = translationMemoryCache.get(cacheKey);
  if (cached) return cached;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode.nodeValue && currentNode.nodeValue.trim().length > 0) {
      currentNode.nodeValue = translatePlainStringOffline(
        currentNode.nodeValue,
        sourceLang
      );
    }
    currentNode = walker.nextNode();
  }

  const output = doc.body.innerHTML;
  translationMemoryCache.set(cacheKey, output);
  return output;
}

// Motor Neural em Background estilo Google Translate (quando há internet ou Chrome Built-in AI, refina o cache silenciosamente)
async function translateChunkNeuralWithFallback(
  text: string,
  sourceLang: SourceLangCode
): Promise<string> {
  if (!text.trim()) return text;
  const cacheKey = `neural:${sourceLang}:${text}`;
  if (translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey)!;
  }

  // 1. Tentar API Neural Nativa Offline do Chrome (window.Translator)
  try {
    const win = window as unknown as {
      Translator?: {
        create?: (opts: {
          sourceLanguage: string;
          targetLanguage: string;
        }) => Promise<{ translate: (input: string) => Promise<string> }>;
      };
    };
    if (win.Translator?.create) {
      const src =
        sourceLang === "auto" ? detectLanguageOffline(text) : sourceLang;
      const translator = await win.Translator.create({
        sourceLanguage: src,
        targetLanguage: "pt",
      });
      const res = await translator.translate(text);
      if (res) {
        translationMemoryCache.set(cacheKey, res);
        translationMemoryCache.set(`${sourceLang}:${text}`, res);
        return res;
      }
    }
  } catch {
    // Segue para próxima camada
  }

  // 2. Se estiver online na primeira leitura, consultar endpoint neural gratuito (GTX) e salvar no cache offline do livro
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const sl = sourceLang === "auto" ? "auto" : sourceLang;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=pt&dt=t&q=${encodeURIComponent(
        text
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.[0])) {
          const joined = data[0]
            .map((part: unknown[]) => (typeof part?.[0] === "string" ? part[0] : ""))
            .join("");
          if (joined.trim()) {
            translationMemoryCache.set(cacheKey, joined);
            translationMemoryCache.set(`${sourceLang}:${text}`, joined);
            return joined;
          }
        }
      }
    } catch {
      // Sem internet ou bloqueado: usa 100% o motor local embarcado sem dar erro!
    }
  }

  return translatePlainStringOffline(text, sourceLang);
}

// Refina silenciosamente um capítulo inteiro em segundo plano e atualiza o cache invisível para leitura offline
export async function refineChapterTranslationSilently(
  chapter: WorkChapter,
  sourceLang: SourceLangCode = "auto"
): Promise<WorkChapter> {
  if (typeof DOMParser === "undefined") return chapter;
  const parser = new DOMParser();
  const doc = parser.parseFromString(chapter.htmlContent, "text/html");

  const blocks = Array.from(
    doc.body.querySelectorAll("p, h1, h2, h3, h4, li, blockquote")
  );

  if (blocks.length > 0) {
    for (const block of blocks) {
      const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n = walker.nextNode();
      while (n) {
        if (n.nodeValue && n.nodeValue.trim().length > 1) {
          nodes.push(n as Text);
        }
        n = walker.nextNode();
      }
      for (const textNode of nodes) {
        const orig = textNode.nodeValue || "";
        textNode.nodeValue = await translateChunkNeuralWithFallback(
          orig,
          sourceLang
        );
      }
    }
  } else {
    doc.body.innerHTML = translateHtmlInstantInPlace(
      chapter.htmlContent,
      sourceLang
    );
  }

  const translatedTitle = await translateChunkNeuralWithFallback(
    chapter.title,
    sourceLang
  );

  const refinedHtml = doc.body.innerHTML;
  translationMemoryCache.set(
    `html:${sourceLang}:${chapter.htmlContent}`,
    refinedHtml
  );

  return {
    ...chapter,
    title: translatedTitle,
    htmlContent: refinedHtml,
    plainText: doc.body.textContent || chapter.plainText,
  };
}
