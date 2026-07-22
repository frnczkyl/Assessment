import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { loadDocumentWithRole } from "@/lib/documents";
import { canManage } from "@/lib/access";
import { shareSchema } from "@/lib/validation";
import { error, json, withErrorHandling } from "@/lib/http";

type Ctx = { params: { id: string } };

// POST /api/documents/:id/share — grant (or update) a user's access. Owner only.
export const POST = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) return error("Document not found.", 404);
  if (!canManage(result.role)) {
    return error("Only the owner can share this document.", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const { email, role } = parsed.data;
  const target = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!target) {
    return error("No user with that email exists.", 404);
  }
  if (target.id === result.document.ownerId) {
    return error("You already own this document.", 400);
  }

  // Upsert so re-sharing simply updates the role.
  await prisma.share.upsert({
    where: { documentId_userId: { documentId: params.id, userId: target.id } },
    update: { role },
    create: { documentId: params.id, userId: target.id, role },
  });

  return json({ user: target, role }, 201);
});

// DELETE /api/documents/:id/share?userId=... — revoke access. Owner only.
export const DELETE = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const result = await loadDocumentWithRole(params.id, user.id);
  if (!result) return error("Document not found.", 404);
  if (!canManage(result.role)) {
    return error("Only the owner can manage sharing.", 403);
  }

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return error("Missing userId.", 400);

  await prisma.share
    .delete({
      where: { documentId_userId: { documentId: params.id, userId } },
    })
    .catch(() => null); // already removed — treat as success

  return json({ ok: true });
});
