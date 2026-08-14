import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.bookmark.deleteMany({ where: { id, userId: session.user.id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
