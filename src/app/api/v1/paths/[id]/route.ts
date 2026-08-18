import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deletePath, getPathDetail } from "@/lib/services/path-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const path = await getPathDetail(id, session.user.id);
  if (!path) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  return NextResponse.json({ path });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deletePath(id, session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
