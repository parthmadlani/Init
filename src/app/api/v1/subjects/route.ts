import { AVAILABLE_COURSE_SLUGS } from "@/lib/courses/catalog";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subjects = await prisma.subject.findMany({ where: { slug: { in: AVAILABLE_COURSE_SLUGS } },
    select: { id: true, slug: true, name: true, _count: { select: { topics: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ subjects });
}
