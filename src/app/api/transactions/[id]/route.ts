import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function DELETE(
    _req: NextRequest,
    { params }: RouteContext
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    const tx = await prisma.transaction.findFirst({
        where: { id: id },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMember = tx.workspace.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const body = await req.json();
    const userId = (session.user as { id: string }).id;

    // Verifica se a transação existe e se o usuário tem acesso
    const tx = await prisma.transaction.findFirst({
        where: { id: id },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMember = tx.workspace.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Atualiza a transação
    const updatedTx = await prisma.transaction.update({
        where: { id: id },
        data: {
            amount: body.amount,
            category: body.category,
            date: body.date,
            description: body.description,
            type: body.type,
            // Adicione outros campos que você recebe no body aqui
        },
    });

    return NextResponse.json(updatedTx);
}