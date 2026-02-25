import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        workspaceId,
        amount,
        type,
        description,
        categoryId,
        accountId,
        status,
        dueDate,
        competenceDate,
        isFixed,
        isCreditCard,
    } = body;

    if (!workspaceId || !amount || !type || !description) {
        return NextResponse.json({ error: "Campos obrigatórios: valor, tipo, descrição." }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    const transaction = await prisma.transaction.create({
        data: {
            amount: parseFloat(String(amount)),
            type,
            description,
            categoryId: categoryId || null,
            accountId: accountId || null,
            workspaceId,
            userId,
            status: status ?? (type === "income" ? "pending" : "pending"),
            date: dueDate ? new Date(dueDate) : new Date(),
            // extra fields we store in description for now
        },
        include: {
            category: true,
            user: { select: { name: true } },
        },
    });

    return NextResponse.json({ transaction }, { status: 201 });
}
