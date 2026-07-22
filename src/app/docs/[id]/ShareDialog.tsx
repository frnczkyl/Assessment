"use client";

import { useState } from "react";

export type ShareEntry = {
  userId: string;
  role: string;
  name: string;
  email: string;
};

export default function ShareDialog({
  docId,
  owner,
  initialShares,
  onClose,
}: {
  docId: string;
  owner: { name: string; email: string };
  initialShares: ShareEntry[];
  onClose: () => void;
}) {
  const [shares, setShares] = useState<ShareEntry[]>(initialShares);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share.");
      // Merge/replace the entry for this user.
      setShares((prev) => {
        const others = prev.filter((s) => s.email !== data.user.email);
        return [
          ...others,
          {
            userId: data.user.id,
            role: data.role,
            name: data.user.name,
            email: data.user.email,
          },
        ];
      });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share.");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(entry: ShareEntry, newRole: string) {
    setShares((prev) =>
      prev.map((s) => (s.userId === entry.userId ? { ...s, role: newRole } : s))
    );
    await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: entry.email, role: newRole }),
    });
  }

  async function revoke(entry: ShareEntry) {
    setShares((prev) => prev.filter((s) => s.userId !== entry.userId));
    await fetch(`/api/documents/${docId}/share?userId=${entry.userId}`, {
      method: "DELETE",
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Share document</h3>
        <p className="modal-sub">
          Grant a teammate access by email. Editors can change the document;
          viewers can only read it.
        </p>

        <form onSubmit={addShare} className="row" style={{ marginBottom: 8 }}>
          <input
            className="input"
            type="email"
            placeholder="teammate@ajaia.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : "Share"}
          </button>
        </form>
        {error && <div className="error-text">{error}</div>}

        <div style={{ marginTop: 16 }}>
          <div className="share-row">
            <div className="share-info">
              <div className="share-name">{owner.name} (you)</div>
              <div className="share-email">{owner.email}</div>
            </div>
            <span className="badge badge-editor">Owner</span>
          </div>

          {shares.length === 0 && (
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Not shared with anyone yet.
            </p>
          )}

          {shares.map((s) => (
            <div className="share-row" key={s.userId}>
              <div className="share-info">
                <div className="share-name">{s.name}</div>
                <div className="share-email">{s.email}</div>
              </div>
              <select
                className="select"
                value={s.role}
                onChange={(e) => changeRole(s, e.target.value)}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => revoke(s)}
                title="Remove access"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right", marginTop: 20 }}>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
