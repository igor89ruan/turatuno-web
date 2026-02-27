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

    const goals = await prisma.goal.findMany({
      where: { workspaceId: wu.workspaceId },
      include: { account: { select: { id: true, name: true, color: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  name:          z.string().min(1).max(120),
  emoji:         z.string().default("🎯"),
  targetAmount:  z.number().positive("Valor alvo deve ser positivo"),
  currentAmount: z.number().min(0).default(0),
  targetDate:    z.string(),
  accountId:     z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        ...data,
        targetDate: new Date(data.targetDate),
        workspaceId: wu.workspaceId,
        accountId: data.accountId ?? null,
      },
      include: { account: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[GOALS_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
