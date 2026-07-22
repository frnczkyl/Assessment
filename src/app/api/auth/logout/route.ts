import { destroySession } from "@/lib/session";
import { json, withErrorHandling } from "@/lib/http";

export const POST = withErrorHandling(async () => {
  destroySession();
  return json({ ok: true });
});
