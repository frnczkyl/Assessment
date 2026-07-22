import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  convertFileToHtml,
  ImportError,
  MAX_IMPORT_BYTES,
  SUPPORTED_EXTENSIONS,
} from "@/lib/import";
import { error, json, withErrorHandling } from "@/lib/http";

// POST /api/import — multipart upload of one .txt/.md/.docx file, converted
// into a new editable document owned by the current user.
export const POST = withErrorHandling(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) return error("Not authenticated.", 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return error("No file provided.", 400);
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return error("File is too large (max 2 MB).", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { title, html } = await convertFileToHtml(file.name, buffer);
    const doc = await prisma.document.create({
      data: { title, content: html, ownerId: user.id },
      select: { id: true, title: true },
    });
    return json(doc, 201);
  } catch (err) {
    if (err instanceof ImportError) return error(err.message, 400);
    throw err;
  }
});

// Expose supported types so the client can advertise them consistently.
export const GET = withErrorHandling(async () =>
  json({ supported: SUPPORTED_EXTENSIONS, maxBytes: MAX_IMPORT_BYTES })
);
