import { prisma } from "./prisma";
import { resolveRole, type AccessRole } from "./access";

/**
 * Load a document together with the current user's effective role.
 * Returns { document, role } or null if the document does not exist.
 * `role` is null when the user has no access.
 */
export async function loadDocumentWithRole(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!document) return null;

  const role: AccessRole | null = resolveRole(
    { ownerId: document.ownerId, shares: document.shares },
    userId
  );
  return { document, role };
}
