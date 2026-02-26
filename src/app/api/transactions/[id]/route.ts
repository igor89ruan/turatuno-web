import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    // Ensure the transaction belongs to this user's workspace
    const tx = await prisma.transaction.findFirst({
        where: { id: params.id },
        include: { workspace: { include: { members: true } } },
    });

    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMember = tx.workspace.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.transaction.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
}
