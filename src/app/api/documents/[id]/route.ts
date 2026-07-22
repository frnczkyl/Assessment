import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { loadDocumentWithRole } from "@/lib/documents";
import { canEdit, canManage, canView } from "@/lib/access";
import { updateDocumentSchema } from "@/lib/validation";
import { sanitizeDocumentHtml } from "@/lib/sanitize";
import { error, json, withErrorHandling } from "@/lib/http";

type Ctx = { params: { id: string } };

// GET /api/documents/:id — full document if the user can view it.
export const GET = withErrorHandling(async (_req: Request, { params }: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) return error("Document not found.", 404);
  if (!canView(result.role)) return error("You do not have access.", 403);

  const { document, role } = result;
  return json({
    id: document.id,
    title: document.title,
    content: document.content,
    updatedAt: document.updatedAt,
    role,
    owner: { name: document.owner.name, email: document.owner.email },
    shares: document.shares.map((s) => ({
      id: s.id,
      role: s.role,
      user: { name: s.user.name, email: s.user.email },
    })),
  });
});

// PATCH /api/documents/:id — rename and/or update content (owner or editor).
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) return error("Document not found.", 404);
  if (!canView(result.role)) return error("You do not have access.", 403);
  if (!canEdit(result.role)) {
    return error("You have view-only access to this document.", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const data: { title?: string; content?: string } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.content !== undefined) {
    data.content = sanitizeDocumentHtml(parsed.data.content);
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });
  return json(updated);
});

// DELETE /api/documents/:id — owner only.
export const DELETE = withErrorHandling(async (_req: Request, { params }: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) return error("Document not found.", 404);
  if (!canManage(result.role)) {
    return error("Only the owner can delete this document.", 403);
  }

  await prisma.document.delete({ where: { id: params.id } });
  return json({ ok: true });
});
