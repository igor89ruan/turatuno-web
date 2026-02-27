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

    const body = await req.json();
    const schema = z.object({
      name:    z.string().min(1).max(80).optional(),
      type:    z.enum(["checking","savings","cash","investment"]).optional(),
      balance: z.number().optional(),
      color:   z.string().optional(),
    });
    const data = schema.parse(body);

    const account = await prisma.account.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!account) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

    const updated = await prisma.account.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ACCOUNT_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const account = await prisma.account.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!account) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

    // Desvincula transações antes de deletar
    await prisma.transaction.updateMany({
      where: { accountId: params.id },
      data: { accountId: null },
    });

    await prisma.account.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ACCOUNT_DELETE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
