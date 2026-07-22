import sanitizeHtml from "sanitize-html";

// Allowlist of tags/attributes the editor can produce. Everything the TipTap
// toolbar generates is here; anything else (scripts, event handlers, styles,
// arbitrary attributes) is stripped. We sanitize on every write so stored HTML
// is always safe to render — whether it came from the editor or a file import.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    // Force safe link behavior.
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    }),
  },
};

export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
