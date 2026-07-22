import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { error, json, withErrorHandling } from "@/lib/http";

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Same generic message whether the email or password is wrong.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return error("Invalid email or password.", 401);
  }

  await createSession(user.id);
  return json({ id: user.id, email: user.email, name: user.name });
});
