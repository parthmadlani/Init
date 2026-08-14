import { auth } from "@/lib/auth";

type Role = "STUDENT" | "ADMIN";

/**
 * Resolves the current session and checks it against `allowed`.
 * Every ADMIN-only route calls this instead of re-deriving the check —
 * RBAC lives in one place. See Build Spec v2 §04.
 */
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, status: 401 as const, message: "Not signed in" };
  }
  if (!allowed.includes(session.user.role)) {
    return { ok: false as const, status: 403 as const, message: "Not authorized" };
  }
  return { ok: true as const, session };
}
