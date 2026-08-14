import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export class EmailInUseError extends Error {}

export async function registerUser(input: { email: string; password: string; name: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailInUseError("An account with that email already exists");

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
