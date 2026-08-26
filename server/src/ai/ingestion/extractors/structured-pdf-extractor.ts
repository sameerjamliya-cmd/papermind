import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface StructuredPdfResult {
  title?: string;
  pages: PdfPage[];
  fullText: string;
}

export async function extractStructuredPdf(
  buffer: Buffer
): Promise<StructuredPdfResult> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;

  const pages: PdfPage[] = [];
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = content.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ");

    const normalized = text.replace(/\s+/g, " ").trim();
    pages.push({ pageNumber, text: normalized });
    pageTexts.push(normalized);
  }

  // Best-effort title extraction from first page.
  const firstPageText = pages[0]?.text ?? "";
  const titleMatch = firstPageText.match(/^([^\n.]{10,120})/);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  return {
    title,
    pages,
    fullText: pageTexts.join("\n\n"),
  };
}
