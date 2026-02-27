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

    const accounts = await prisma.account.findMany({
      where: { workspaceId: wu.workspaceId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[ACCOUNTS_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  name:    z.string().min(1).max(80),
  type:    z.enum(["checking", "savings", "cash", "investment"]),
  balance: z.number().default(0),
  color:   z.string().default("#3b82f6"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const account = await prisma.account.create({
      data: { ...data, workspaceId: wu.workspaceId },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[ACCOUNTS_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
