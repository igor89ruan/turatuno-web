import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{ id: string }>
};

async function verifyCategoryAccess(catId: string, userId: string) {
    const category = await prisma.category.findFirst({
        where: { id: catId },
        include: { workspace: { include: { members: true } } },
    });

    if (!category) return null;

    const isMember = category.workspace.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) return null;

    return category;
}

export async function PUT(
    req: NextRequest,
    { params }: RouteContext
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const category = await verifyCategoryAccess(id, userId);

    if (!category) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    const body = await req.json();
    const { name, colorHex, icon, status, monthlyBudget, keywords } = body;

    // Se estiver arquivando, valida status. Mas se não, edita informações normais.
    const updatedCategory = await prisma.category.update({
        where: { id: id },
        data: {
            name: name || category.name,
            colorHex: colorHex || category.colorHex,
            icon: icon || category.icon,
            status: status || category.status,
            monthlyBudget: monthlyBudget !== undefined ? (monthlyBudget ? parseFloat(monthlyBudget) : null) : category.monthlyBudget,
            keywords: keywords !== undefined ? keywords : category.keywords,
        },
    });

    return NextResponse.json({ category: updatedCategory });
}

export async function DELETE(
    req: NextRequest,
    { params }: RouteContext
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Parse the ?force URL parameter
    const { searchParams } = new URL(req.url);
    const forceDelete = searchParams.get('force') === 'true';

    const userId = (session.user as { id: string }).id;
    const category = await verifyCategoryAccess(id, userId);

    if (!category) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

    // Check if category has transactions
    const transactionsCount = await prisma.transaction.count({
        where: { categoryId: id },
    });

    if (!forceDelete) {
        // Soft delete (Archive) in the active tabs
        await prisma.category.update({
            where: { id: id },
            data: { status: "arquivado" },
        });
        return NextResponse.json({ ok: true, archived: true, message: "Categoria arquivada com sucesso." });
    }

    // Hard delete (If forced, or if no transactions exist)
    // Se forçando a exclusão, devemos remover a categoria das transações antes (ou deixá-las isoladas? Se não for possível, Prisma vai dar erro.)
    // Assumindo que o usuário REALMENTE quer deletar: deletamos as transações filhas OU atualizamos pra alguma categoria genérica.
    // O mais seguro para uma gestão é impedir ou deletar em cascata. O Schema atual não tem cascade na categoria.
    // Vamos tentar deletar. Se falhar por restrição de foreign key, cai no catch. Mas o Prisma não deixa deletar se houver transações sem resolver.
    try {
        if (transactionsCount > 0 && forceDelete) {
            // Opcional: deletar as transações associadas, ou impedir até que o usuário as mova.
            // Para simplificar e evitar perda de histórico, vamos impedir exclusão forçada se tem transações (uma boa prática contábil).
            return NextResponse.json(
                { error: "Não é possível excluir definitivamente uma categoria que já possui registro no sistema. Transfira as transações primeiro." },
                { status: 400 }
            );
        }

        await prisma.category.delete({ where: { id: id } });
        return NextResponse.json({ ok: true, deleted: true });
    } catch (e) {
        return NextResponse.json({ error: "Erro ao excluir categoria." }, { status: 500 });
    }
}
