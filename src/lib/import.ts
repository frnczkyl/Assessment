import { marked } from "marked";
import mammoth from "mammoth";
import { sanitizeDocumentHtml } from "./sanitize";

// Supported import formats. Advertised in the UI and README.
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB

export class ImportError extends Error {}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

/** Human-friendly title from a filename: "Q3 notes.md" -> "Q3 notes". */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, ""); // drop any path
  const ext = getExtension(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return stem.trim() || "Imported document";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Convert plain text into simple paragraph HTML, preserving line breaks. */
function textToHtml(text: string): string {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks
    .map((block) => {
      const inner = block
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>");
      return `<p>${inner}</p>`;
    })
    .join("");
}

export type ImportResult = { title: string; html: string };

/**
 * Convert an uploaded file into sanitized editor HTML.
 * Pure and dependency-injectable (takes a Buffer), so it is unit-testable.
 */
export async function convertFileToHtml(
  filename: string,
  buffer: Buffer
): Promise<ImportResult> {
  const ext = getExtension(filename);

  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new ImportError(
      `Unsupported file type "${ext || "unknown"}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }
  if (buffer.length === 0) {
    throw new ImportError("File is empty.");
  }
  if (buffer.length > MAX_IMPORT_BYTES) {
    throw new ImportError("File is too large (max 2 MB).");
  }

  let rawHtml: string;
  if (ext === ".md" || ext === ".markdown") {
    rawHtml = marked.parse(buffer.toString("utf8"), { async: false }) as string;
  } else if (ext === ".docx") {
    const result = await mammoth.convertToHtml({ buffer });
    rawHtml = result.value;
  } else {
    // .txt
    rawHtml = textToHtml(buffer.toString("utf8"));
  }

  const html = sanitizeDocumentHtml(rawHtml);
  return { title: titleFromFilename(filename), html };
}
