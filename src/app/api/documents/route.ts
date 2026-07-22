import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createDocumentSchema } from "@/lib/validation";
import { sanitizeDocumentHtml } from "@/lib/sanitize";
import { error, json, withErrorHandling } from "@/lib/http";

// GET /api/documents — documents owned by, or shared with, the current user.
export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true, email: true } },
        shares: { where: { userId: user.id }, select: { role: true } },
      },
    }),
  ]);

  return json({
    owned,
    shared: shared.map((d) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      ownerName: d.owner.name,
      role: d.shares[0]?.role ?? "viewer",
    })),
  });
});

// POST /api/documents — create a new (optionally pre-filled) document.
export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const body = await req.json().catch(() => ({}));
  const parsed = createDocumentSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title?.trim() || "Untitled document",
      content: parsed.data.content
        ? sanitizeDocumentHtml(parsed.data.content)
        : "",
      ownerId: user.id,
    },
    select: { id: true, title: true },
  });

  return json(doc, 201);
});
