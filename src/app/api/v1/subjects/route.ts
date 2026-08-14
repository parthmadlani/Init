import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    select: { id: true, slug: true, name: true, _count: { select: { topics: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ subjects });
}
