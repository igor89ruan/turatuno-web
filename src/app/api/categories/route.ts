import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const categories = await prisma.category.findMany({
      where: { workspaceId: wu.workspaceId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } } },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const schema = z.object({
  name:     z.string().min(1).max(60),
  type:     z.enum(["income", "expense"]),
  icon:     z.string().default("📦"),
  colorHex: z.string().default("#64748b"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const data = schema.parse(body);

    const category = await prisma.category.create({
      data: { ...data, workspaceId: wu.workspaceId },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[CATEGORIES_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
