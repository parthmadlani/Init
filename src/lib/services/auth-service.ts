import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export class EmailInUseError extends Error {}
export class IncorrectPasswordError extends Error {}

export async function registerUser(input: { email: string; password: string; name: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailInUseError("An account with that email already exists");

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new IncorrectPasswordError("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
