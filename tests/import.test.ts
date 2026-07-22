import { describe, it, expect } from "vitest";
import {
  convertFileToHtml,
  titleFromFilename,
  ImportError,
} from "@/lib/import";

const buf = (s: string) => Buffer.from(s, "utf8");

describe("titleFromFilename", () => {
  it("strips the extension and path", () => {
    expect(titleFromFilename("notes.md")).toBe("notes");
    expect(titleFromFilename("/tmp/Q3 Plan.docx")).toBe("Q3 Plan");
    expect(titleFromFilename("README")).toBe("README");
  });
});

describe("convertFileToHtml", () => {
  it("converts markdown headings and lists to HTML", async () => {
    const { title, html } = await convertFileToHtml(
      "plan.md",
      buf("# Title\n\n- one\n- two")
    );
    expect(title).toBe("plan");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>one</li>");
  });

  it("wraps plain text into paragraphs and escapes HTML", async () => {
    const { html } = await convertFileToHtml(
      "note.txt",
      buf("line one\n\n<script>alert(1)</script>")
    );
    expect(html).toContain("<p>line one</p>");
    // The literal text is escaped; no executable script tag survives.
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("sanitizes dangerous markup out of imported markdown", async () => {
    const { html } = await convertFileToHtml(
      "evil.md",
      buf('Hello <img src=x onerror="alert(1)"> world')
    );
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      convertFileToHtml("photo.png", buf("binary"))
    ).rejects.toBeInstanceOf(ImportError);
  });

  it("rejects empty files", async () => {
    await expect(convertFileToHtml("empty.txt", buf(""))).rejects.toBeInstanceOf(
      ImportError
    );
  });
});
