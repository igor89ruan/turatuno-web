import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!goal) return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });

    const body = await req.json();
    const schema = z.object({
      name:          z.string().min(1).max(120).optional(),
      emoji:         z.string().optional(),
      targetAmount:  z.number().positive().optional(),
      currentAmount: z.number().min(0).optional(),
      targetDate:    z.string().optional(),
      status:        z.enum(["active","completed","paused"]).optional(),
      accountId:     z.string().nullable().optional(),
      deposit:       z.number().positive().optional(), // aporte avulso
    });
    const data = schema.parse(body);

    // Aporte avulso — incrementa currentAmount
    if (data.deposit) {
      const newAmount = Math.min(goal.currentAmount + data.deposit, goal.targetAmount);
      const updated = await prisma.goal.update({
        where: { id: params.id },
        data: {
          currentAmount: newAmount,
          status: newAmount >= goal.targetAmount ? "completed" : goal.status,
        },
        include: { account: { select: { id: true, name: true, color: true } } },
      });
      return NextResponse.json(updated);
    }

    const { deposit: _d, ...updateData } = data;
    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...updateData,
        targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
        accountId: updateData.accountId ?? undefined,
      },
      include: { account: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[GOAL_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!goal) return NextResponse.json({ error: "Meta não encontrada." }, { status: 404 });

    await prisma.goal.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[GOAL_DELETE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
