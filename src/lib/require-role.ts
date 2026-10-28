import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerAdmin } from "@/lib/admin-policy";
type Role = "STUDENT" | "ADMIN";

// Always use the current database identity; JWT role claims may be stale.
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, status: 401 as const, message: "Not signed in" };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, role: true } });
  if (!user || !allowed.includes(user.role) || (user.role === "ADMIN" && !isOwnerAdmin(user))) {
    return { ok: false as const, status: 403 as const, message: "Not authorized" };
  }
  return { ok: true as const, session: { ...session, user: { ...session.user, role: user.role } } };
}
