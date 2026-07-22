"use client";

import type { Editor } from "@tiptap/react";

// A focused formatting toolbar: the assignment's required set plus a couple of
// natural extras (quote, code). Deliberately not a full Google Docs ribbon.
export default function Toolbar({ editor }: { editor: Editor }) {
  // Re-render on selection/state changes so active states stay in sync.
  const btn = (
    label: React.ReactNode,
    isActive: boolean,
    onClick: () => void,
    title: string
  ) => (
    <button
      type="button"
      className={`tb-btn ${isActive ? "active" : ""}`}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {btn(
        <strong>B</strong>,
        editor.isActive("bold"),
        () => editor.chain().focus().toggleBold().run(),
        "Bold (Ctrl+B)"
      )}
      {btn(
        <em>I</em>,
        editor.isActive("italic"),
        () => editor.chain().focus().toggleItalic().run(),
        "Italic (Ctrl+I)"
      )}
      {btn(
        <u>U</u>,
        editor.isActive("underline"),
        () => editor.chain().focus().toggleUnderline().run(),
        "Underline (Ctrl+U)"
      )}
      {btn(
        <s>S</s>,
        editor.isActive("strike"),
        () => editor.chain().focus().toggleStrike().run(),
        "Strikethrough"
      )}

      <span className="tb-sep" />

      {btn(
        "H1",
        editor.isActive("heading", { level: 1 }),
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        "Heading 1"
      )}
      {btn(
        "H2",
        editor.isActive("heading", { level: 2 }),
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        "Heading 2"
      )}
      {btn(
        "H3",
        editor.isActive("heading", { level: 3 }),
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        "Heading 3"
      )}
      {btn(
        "¶",
        editor.isActive("paragraph"),
        () => editor.chain().focus().setParagraph().run(),
        "Body text"
      )}

      <span className="tb-sep" />

      {btn(
        "• List",
        editor.isActive("bulletList"),
        () => editor.chain().focus().toggleBulletList().run(),
        "Bulleted list"
      )}
      {btn(
        "1. List",
        editor.isActive("orderedList"),
        () => editor.chain().focus().toggleOrderedList().run(),
        "Numbered list"
      )}
      {btn(
        "❝",
        editor.isActive("blockquote"),
        () => editor.chain().focus().toggleBlockquote().run(),
        "Quote"
      )}
      {btn(
        "</>",
        editor.isActive("codeBlock"),
        () => editor.chain().focus().toggleCodeBlock().run(),
        "Code block"
      )}

      <span className="tb-sep" />

      {btn(
        "↶",
        false,
        () => editor.chain().focus().undo().run(),
        "Undo (Ctrl+Z)"
      )}
      {btn(
        "↷",
        false,
        () => editor.chain().focus().redo().run(),
        "Redo (Ctrl+Y)"
      )}
    </div>
  );
}
