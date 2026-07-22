"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type OwnedDoc = { id: string; title: string; updatedAt: string };
type SharedDoc = OwnedDoc & { ownerName: string; role: string };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const ACCEPT = ".txt,.md,.markdown,.docx";

export default function DashboardClient({
  owned,
  shared,
}: {
  owned: OwnedDoc[];
  shared: SharedDoc[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function createDoc() {
    setBusy(true);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create document.");
      router.push(`/docs/${data.id}`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      router.push(`/docs/${data.id}`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Import failed.");
      setBusy(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      flash("Document deleted.");
      router.refresh();
    } else {
      flash("Could not delete document.");
    }
  }

  return (
    <>
      <div className="page-actions">
        <button className="btn btn-primary" onClick={createDoc} disabled={busy}>
          + New document
        </button>
        <button
          className="btn"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          ⬆ Import file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = "";
          }}
        />
        <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
          Supported imports: .txt, .md, .docx (max 2 MB)
        </span>
      </div>

      <h2 className="section-title">My documents</h2>
      {owned.length === 0 ? (
        <div className="empty">
          No documents yet. Create one or import a file to get started.
        </div>
      ) : (
        <div className="doc-grid">
          {owned.map((d) => (
            <div className="doc-card" key={d.id}>
              <Link href={`/docs/${d.id}`} className="doc-card-title">
                {d.title}
              </Link>
              <div className="doc-card-meta">Edited {timeAgo(d.updatedAt)}</div>
              <div className="doc-card-footer">
                <span className="badge badge-editor">Owner</span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => remove(d.id, d.title)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Shared with me</h2>
      {shared.length === 0 ? (
        <div className="empty">Nothing has been shared with you yet.</div>
      ) : (
        <div className="doc-grid">
          {shared.map((d) => (
            <div className="doc-card" key={d.id}>
              <Link href={`/docs/${d.id}`} className="doc-card-title">
                {d.title}
              </Link>
              <div className="doc-card-meta">
                Shared by {d.ownerName} · {timeAgo(d.updatedAt)}
              </div>
              <div className="doc-card-footer">
                <span
                  className={`badge ${
                    d.role === "editor" ? "badge-editor" : "badge-viewer"
                  }`}
                >
                  {d.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
