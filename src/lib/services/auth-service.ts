import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { Prisma } from "@/generated/prisma/client";

export class EmailInUseError extends Error {}
export class IncorrectPasswordError extends Error {}

export async function registerUser(input: { email: string; password: string; name: string }) {
  // Fast path: skip the expensive hash for the common case (someone re-submitting
  // a known-taken email). Not itself race-safe — see the unique-constraint catch
  // below, which is the actual guard. Two requests for the same email landing in
  // the gap between this check and the create() below both used to slip through
  // and crash with a raw Postgres unique-violation instead of a clean 409.
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new EmailInUseError("An account with that email already exists");

  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailInUseError("An account with that email already exists");
    }
    throw error;
  }
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new IncorrectPasswordError("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
