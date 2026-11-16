import { BookFileFormat } from "@/types/work";
import { parseEpubBook } from "./epubParser";
import { ParsedBookResult, parseHtmlBook } from "./htmlAo3Parser";
import { parseMobiBook } from "./mobiParser";
import { parsePdfBook } from "./pdfParser";

export function detectBookFormat(fileName: string): BookFileFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".epub")) return "epub";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".mobi") || lower.endsWith(".azw") || lower.endsWith(".azw3"))
    return "mobi";
  return "html";
}

export async function parseUploadedBook(
  file: File
): Promise<{ format: BookFileFormat; parsed: ParsedBookResult }> {
  const format = detectBookFormat(file.name);
  switch (format) {
    case "epub":
      return { format, parsed: await parseEpubBook(file) };
    case "pdf":
      return { format, parsed: await parsePdfBook(file) };
    case "mobi":
      return { format, parsed: await parseMobiBook(file) };
    case "html":
    default:
      return { format: "html", parsed: await parseHtmlBook(file) };
  }
}
