import { WorkChapter } from "@/types/work";

export type SourceLangCode = "auto" | "en" | "ru" | "es" | "fr";

export interface OfflineTranslationProgress {
  chapterIndex: number;
  totalChapters: number;
  percent: number;
  statusText: string;
}

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

// Dicionário Básico Offline (Espanhol / Francês -> Português)
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
  // Verificar presença de caracteres cirílicos (Russo)
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

  if (enMatches >= esMatches && enMatches > 2) return "en";
  if (esMatches > 2) return "es";
  return "en";
}

// Tenta usar a API nativa offline do navegador (Chrome Built-in Translator API) se disponível
async function tryNativeBrowserOfflineTranslator(
  text: string,
  sourceLang: string
): Promise<string | null> {
  try {
    const win = window as unknown as {
      translation?: {
        createTranslator?: (opts: {
          sourceLanguage: string;
          targetLanguage: string;
        }) => Promise<{ translate: (input: string) => Promise<string> }>;
      };
      Translator?: {
        create?: (opts: {
          sourceLanguage: string;
          targetLanguage: string;
        }) => Promise<{ translate: (input: string) => Promise<string> }>;
      };
    };

    const src = sourceLang === "auto" ? detectLanguageOffline(text) : sourceLang;

    if (win.Translator?.create) {
      const translator = await win.Translator.create({
        sourceLanguage: src,
        targetLanguage: "pt",
      });
      return await translator.translate(text);
    }

    if (win.translation?.createTranslator) {
      const translator = await win.translation.createTranslator({
        sourceLanguage: src,
        targetLanguage: "pt",
      });
      return await translator.translate(text);
    }
  } catch {
    // Fallback para o motor léxico-contextual embarcado
  }
  return null;
}

export function translatePlainStringOffline(
  input: string,
  sourceLang: SourceLangCode = "auto"
): string {
  if (!input.trim()) return input;
  const effectiveLang =
    sourceLang === "auto" ? detectLanguageOffline(input) : sourceLang;

  let result = input;

  // 1. Passar sempre as expressões em Russo caso haja trechos bilíngues (muito comum em fics de AFTG/Andriel)
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

  // 2. Se for Inglês (ou auto com inglês), aplicar frases e vocabulário Inglês -> Português
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

  // 3. Se for Espanhol
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

  return result;
}

export async function translateHtmlPreservingTagsOffline(
  htmlContent: string,
  sourceLang: SourceLangCode = "auto"
): Promise<string> {
  if (typeof DOMParser === "undefined") return htmlContent;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode.nodeValue && currentNode.nodeValue.trim().length > 0) {
      textNodes.push(currentNode as Text);
    }
    currentNode = walker.nextNode();
  }

  for (const node of textNodes) {
    const original = node.nodeValue || "";
    const nativeTranslated = await tryNativeBrowserOfflineTranslator(
      original,
      sourceLang
    );
    if (nativeTranslated) {
      node.nodeValue = nativeTranslated;
    } else {
      node.nodeValue = translatePlainStringOffline(original, sourceLang);
    }
  }

  return doc.body.innerHTML;
}

export async function translateEntireWorkOffline(
  chapters: WorkChapter[],
  sourceLang: SourceLangCode,
  onProgress?: (prog: OfflineTranslationProgress) => void
): Promise<WorkChapter[]> {
  const translatedChapters: WorkChapter[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    onProgress?.({
      chapterIndex: i + 1,
      totalChapters: chapters.length,
      percent: Math.round(((i + 1) / chapters.length) * 100),
      statusText: `Traduzindo offline: ${ch.title} (${i + 1}/${
        chapters.length
      })...`,
    });

    // Pequeno yield para a UI atualizar a barra de progresso suavemente
    await new Promise((r) => setTimeout(r, 30));

    const translatedTitle = translatePlainStringOffline(ch.title, sourceLang);
    const translatedHtml = await translateHtmlPreservingTagsOffline(
      ch.htmlContent,
      sourceLang
    );
    const translatedPlain = translatePlainStringOffline(
      ch.plainText,
      sourceLang
    );

    translatedChapters.push({
      ...ch,
      title: translatedTitle,
      htmlContent: translatedHtml,
      plainText: translatedPlain,
    });
  }

  return translatedChapters;
}
