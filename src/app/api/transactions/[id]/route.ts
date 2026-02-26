import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Ensure the user has access to the transaction (through workspace membership)
async function verifyTransactionAccess(txId: string, userId: string) {
    const tx = await prisma.transaction.findFirst({
        where: { id: txId },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) return null;

    const isMember = tx.workspace.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) return null;

    return tx;
}

// Definimos um tipo para o contexto para facilitar
type RouteContext = {
    params: Promise<{ id: string }>
};

export async function DELETE(
    _req: NextRequest,
    { params }: RouteContext
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const tx = await verifyTransactionAccess(id, userId);

    if (!tx) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    await prisma.transaction.delete({ where: { id: id } });

    return NextResponse.json({ ok: true });
}

export async function PUT(
    req: NextRequest,
    { params }: RouteContext
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const tx = await verifyTransactionAccess(id, userId);

    if (!tx) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    const body = await req.json();
    const {
        amount,
        type,
        description,
        categoryId,
        accountId,
        status,
        date,
    } = body;

    if (!amount || !type || !description) {
        return NextResponse.json({ error: "Campos obrigatórios: valor, tipo, descrição." }, { status: 400 });
    }

    const updatedTx = await prisma.transaction.update({
        where: { id: id },
        data: {
            amount: parseFloat(String(amount)),
            type,
            description,
            categoryId: categoryId || null,
            accountId: accountId || null,
            status: status || tx.status,
            date: date ? new Date(date) : tx.date,
        },
        include: {
            category: true,
            user: { select: { name: true } },
        },
    });

    return NextResponse.json({ transaction: updatedTx });
}
