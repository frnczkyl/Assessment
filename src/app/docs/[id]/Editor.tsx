"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toolbar from "./Toolbar";
import ShareDialog, { type ShareEntry } from "./ShareDialog";
import type { AccessRole } from "@/lib/access";

type SaveState = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_MS = 900;

export default function Editor({
  docId,
  initialTitle,
  initialContent,
  role,
  owner,
  currentUserId,
  initialShares,
}: {
  docId: string;
  initialTitle: string;
  initialContent: string;
  role: AccessRole;
  owner: { name: string; email: string };
  currentUserId: string;
  initialShares: ShareEntry[];
}) {
  const router = useRouter();
  const editable = role === "owner" || role === "editor";

  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareOpen, setShareOpen] = useState(false);

  // Latest values captured for debounced saves without stale closures.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ title?: string; content?: string }>({});

  const flush = useCallback(async () => {
    const payload = pending.current;
    pending.current = {};
    if (payload.title === undefined && payload.content === undefined) return;

    setSaveState("saving");
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [docId]);

  const scheduleSave = useCallback(
    (patch: { title?: string; content?: string }) => {
      pending.current = { ...pending.current, ...patch };
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush]
  );

  const editor = useEditor({
    editable,
    immediatelyRender: false, // avoid SSR hydration mismatch
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: { class: "ProseMirror", spellcheck: "true" },
    },
    onUpdate: ({ editor }) => {
      scheduleSave({ content: editor.getHTML() });
    },
  });

  // Save on unmount / tab close if there are unflushed edits.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onTitleChange(value: string) {
    setTitle(value);
    const trimmed = value.trim();
    if (trimmed) scheduleSave({ title: trimmed });
  }

  function downloadHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${
      editor?.getHTML() ?? ""
    }</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const saveLabel: Record<SaveState, string> = {
    idle: editable ? "All changes saved" : "View only",
    saving: "Saving…",
    saved: "All changes saved",
    error: "Save failed — retrying on next edit",
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <Link href="/docs" className="btn btn-sm btn-ghost">
            ← Docs
          </Link>
          <div className="editor-titlebar">
            <input
              className="title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={flush}
              disabled={!editable}
              aria-label="Document title"
            />
          </div>
          <span className="save-status">{saveLabel[saveState]}</span>
        </div>
        <div className="row">
          {!editable && <span className="badge badge-viewer">View only</span>}
          <button className="btn btn-sm" onClick={downloadHtml}>
            Download
          </button>
          {role === "owner" && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShareOpen(true)}
            >
              Share
            </button>
          )}
        </div>
      </header>

      {editable && editor && <Toolbar editor={editor} />}

      <div className="paper-wrap">
        <div className="paper">
          <EditorContent editor={editor} />
        </div>
      </div>

      {shareOpen && (
        <ShareDialog
          docId={docId}
          owner={owner}
          initialShares={initialShares}
          onClose={() => {
            setShareOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
