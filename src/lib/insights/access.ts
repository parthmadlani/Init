import 'server-only';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function ownerUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Recheck the database: an old JWT must not retain revoked admin access.
  return prisma.user.findFirst({ where: { id: session.user.id, role: 'ADMIN' }, select: { id: true, name: true } });
}
