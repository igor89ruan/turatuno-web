import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Workspace do usuário
    const workspaceUser = await prisma.workspaceUser.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
    }

    const workspaceId = workspaceUser.workspaceId;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Contas e saldo total
    const accounts = await prisma.account.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Transações do mês atual
    const monthTransactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        date: { gte: monthStart, lte: monthEnd },
        status: "paid",
      },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    });

    // Receitas e despesas do mês
    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Gastos por categoria (para o gráfico)
    const expenseByCategory: Record<string, { name: string; icon: string; color: string; total: number }> = {};
    monthTransactions
      .filter((t) => t.type === "expense" && t.category)
      .forEach((t) => {
        const cat = t.category!;
        if (!expenseByCategory[cat.id]) {
          expenseByCategory[cat.id] = { name: cat.name, icon: cat.icon, color: cat.colorHex, total: 0 };
        }
        expenseByCategory[cat.id].total += t.amount;
      });

    const categoryData = Object.values(expenseByCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Transações pendentes
    const pending = await prisma.transaction.count({
      where: { workspaceId, status: "pending" },
    });

    // Metas ativas
    const goals = await prisma.goal.findMany({
      where: { workspaceId, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Últimas 8 transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { workspaceId },
      include: { category: true, account: true, creditCard: true },
      orderBy: { date: "desc" },
      take: 8,
    });

    // Mês anterior para variação
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));

    const lastMonthExpense = await prisma.transaction.aggregate({
      where: { workspaceId, type: "expense", status: "paid", date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    });

    const expenseVariation = lastMonthExpense._sum.amount
      ? ((monthExpense - lastMonthExpense._sum.amount) / lastMonthExpense._sum.amount) * 100
      : 0;

    return NextResponse.json({
      workspace: workspaceUser.workspace,
      totalBalance,
      accounts,
      monthIncome,
      monthExpense,
      expenseVariation: Math.round(expenseVariation),
      categoryData,
      recentTransactions,
      pendingCount: pending,
      goals,
    });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
