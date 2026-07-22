import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { loadDocumentWithRole } from "@/lib/documents";
import { canView } from "@/lib/access";
import Editor from "./Editor";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) notFound();
  if (!canView(result.role)) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>No access</h2>
          <p className="muted">
            You don&apos;t have permission to view this document.
          </p>
          <Link className="btn btn-primary" href="/docs">
            Back to documents
          </Link>
        </div>
      </div>
    );
  }

  const { document, role } = result;
  return (
    <Editor
      docId={document.id}
      initialTitle={document.title}
      initialContent={document.content}
      role={role!}
      owner={{ name: document.owner.name, email: document.owner.email }}
      currentUserId={user.id}
      initialShares={document.shares.map((s) => ({
        userId: s.userId,
        role: s.role,
        name: s.user.name,
        email: s.user.email,
      }))}
    />
  );
}
