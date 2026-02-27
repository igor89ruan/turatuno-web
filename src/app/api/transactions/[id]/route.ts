import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getWorkspace(userId: string) {
  return prisma.workspaceUser.findFirst({ where: { userId } });
}

// ── PATCH — atualiza status (pago/pendente) ─────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await getWorkspace(session.user.id);
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const schema = z.object({ status: z.enum(["paid", "pending"]).optional(), description: z.string().optional() });
    const data = schema.parse(body);

    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!tx) return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });

    // Se mudando para pago, atualiza saldo
    if (data.status === "paid" && tx.status === "pending" && tx.accountId) {
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      await prisma.account.update({
        where: { id: tx.accountId },
        data: { balance: { increment: delta } },
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data,
      include: { category: true, account: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TRANSACTION_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ── DELETE — remove transação ───────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await getWorkspace(session.user.id);
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, workspaceId: wu.workspaceId },
    });
    if (!tx) return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });

    // Reverte saldo se era paga
    if (tx.status === "paid" && tx.accountId) {
      const delta = tx.type === "income" ? -tx.amount : tx.amount;
      await prisma.account.update({
        where: { id: tx.accountId },
        data: { balance: { increment: delta } },
      });
    }

    await prisma.transaction.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
