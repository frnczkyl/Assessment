// Access-control logic for documents, kept as pure functions so it can be
// unit-tested without a database or HTTP layer.

export type AccessRole = "owner" | "editor" | "viewer";

export type ShareLike = { userId: string; role: string };
export type DocLike = { ownerId: string; shares: ShareLike[] };

/**
 * Resolve a user's effective role on a document.
 * Owner beats any share; a share is either "editor" or "viewer".
 * Returns null if the user has no access.
 */
export function resolveRole(doc: DocLike, userId: string): AccessRole | null {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return null;
  return share.role === "viewer" ? "viewer" : "editor";
}

/** Can this role open/read the document? */
export function canView(role: AccessRole | null): boolean {
  return role !== null;
}

/** Can this role change the document's content or title? */
export function canEdit(role: AccessRole | null): boolean {
  return role === "owner" || role === "editor";
}

/** Only the owner can manage sharing or delete the document. */
export function canManage(role: AccessRole | null): boolean {
  return role === "owner";
}
