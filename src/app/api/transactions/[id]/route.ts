import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Definimos a interface exata que o Next.js espera para rotas dinâmicas
interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const tx = await prisma.transaction.findFirst({
        where: { id },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = tx.workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}

export async function PUT(
    req: NextRequest,
    context: RouteContext
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userId = (session.user as { id: string }).id;

    const tx = await prisma.transaction.findFirst({
        where: { id },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMember = tx.workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedTx = await prisma.transaction.update({
        where: { id },
        data: {
            amount: body.amount,
            category: body.category,
            date: body.date,
            description: body.description,
            type: body.type,
        },
    });

    return NextResponse.json(updatedTx);
}