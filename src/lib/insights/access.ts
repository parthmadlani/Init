import 'server-only';
import { OWNER_ADMIN_EMAIL } from '@/lib/admin-policy';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function ownerUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Recheck the database: an old JWT must not retain revoked admin access.
  return prisma.user.findFirst({ where: { id: session.user.id, role: 'ADMIN', email: OWNER_ADMIN_EMAIL }, select: { id: true, name: true } });
}
