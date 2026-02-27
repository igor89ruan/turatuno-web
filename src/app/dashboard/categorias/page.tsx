import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CategoriasClient from "./categorias-client";

export default async function CategoriasPage() {
    const session = await requireSession();

    // Fetch the user's primary workspace
    const workspaceUser = await prisma.workspaceUser.findFirst({
        where: { userId: (session.user as { id: string }).id, role: "owner" },
    });

    if (!workspaceUser) {
        return <div>Nenhum workspace encontrado.</div>;
    }

    // Fetch active categories and subcategories explicitly for SSR load
    const categories = await prisma.category.findMany({
        where: {
            workspaceId: workspaceUser.workspaceId,
            status: "active",
        },
        include: {
            subcategories: {
                where: { status: "active" },
                orderBy: { name: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    // Determine current month bounds
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch transactions in the current month
    const transactions = await prisma.transaction.findMany({
        where: {
            workspaceId: workspaceUser.workspaceId,
            date: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
            type: "expense", // we only care about expenses against budgets
        },
        select: {
            categoryId: true,
            amount: true,
        },
    });

    // Group transaction amounts by categoryId
    const spendByCategory: Record<string, number> = {};
    for (const tx of transactions) {
        if (tx.categoryId) {
            spendByCategory[tx.categoryId] = (spendByCategory[tx.categoryId] || 0) + tx.amount;
        }
    }

    // Attach currentSpend to categories
    const categoriesWithSpend = categories.filter(c => c.parentId === null).map(cat => ({
        ...cat,
        currentSpend: spendByCategory[cat.id] || 0,
        subcategories: cat.subcategories.map(sub => ({
            ...sub,
            currentSpend: spendByCategory[sub.id] || 0,
        }))
    }));

    return (
        <CategoriasClient
            userName={session.user?.name ?? "Usuário"}
            initialCategories={categoriesWithSpend}
            workspaceId={workspaceUser.workspaceId}
        />
    );
}
