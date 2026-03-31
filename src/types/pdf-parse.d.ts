declare module 'pdf-parse' {
  interface PdfTextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
  }

  interface PdfTextContent {
    items: PdfTextItem[];
  }

  interface PdfPageData {
    getTextContent(options?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }): Promise<PdfTextContent>;
  }

  interface PdfParseOptions {
    pagerender?: (pageData: PdfPageData) => Promise<string>;
    max?: number;
    version?: string;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;

  export = pdfParse;
}
