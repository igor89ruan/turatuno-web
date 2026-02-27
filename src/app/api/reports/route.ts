import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const workspaceId = wu.workspaceId;
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") ?? "6");

    const now = new Date();

    // ── Evolução mensal (últimos N meses) ──────────────────────────────────
    const monthlyData = await Promise.all(
      Array.from({ length: months }, (_, i) => {
        const date = subMonths(now, months - 1 - i);
        const start = startOfMonth(date);
        const end   = endOfMonth(date);
        const label = format(date, "MMM/yy", { locale: ptBR });

        return Promise.all([
          prisma.transaction.aggregate({
            where: { workspaceId, type: "income",  status: "paid", date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { workspaceId, type: "expense", status: "paid", date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
        ]).then(([inc, exp]) => ({
          label,
          income:  inc._sum.amount ?? 0,
          expense: exp._sum.amount ?? 0,
          balance: (inc._sum.amount ?? 0) - (exp._sum.amount ?? 0),
        }));
      })
    );

    // ── Gastos por categoria (mês atual) ───────────────────────────────────
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);

    const txWithCat = await prisma.transaction.findMany({
      where: { workspaceId, type: "expense", status: "paid", date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
    });

    const catMap: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {};
    let totalExpense = 0;
    txWithCat.forEach((tx) => {
      totalExpense += tx.amount;
      const key = tx.categoryId ?? "__none__";
      const cat = tx.category;
      if (!catMap[key]) {
        catMap[key] = {
          name:  cat?.name  ?? "Sem categoria",
          icon:  cat?.icon  ?? "📦",
          color: cat?.colorHex ?? "#64748b",
          total: 0, count: 0,
        };
      }
      catMap[key].total += tx.amount;
      catMap[key].count++;
    });

    const categoryBreakdown = Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ ...c, pct: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0 }));

    // ── Top despesas do mês ────────────────────────────────────────────────
    const topExpenses = await prisma.transaction.findMany({
      where: { workspaceId, type: "expense", status: "paid", date: { gte: monthStart, lte: monthEnd } },
      include: { category: true, account: true },
      orderBy: { amount: "desc" },
      take: 10,
    });

    // ── Saldo por conta ────────────────────────────────────────────────────
    const accounts = await prisma.account.findMany({
      where: { workspaceId },
      orderBy: { balance: "desc" },
    });

    // ── Métricas gerais ────────────────────────────────────────────────────
    const allTime = await prisma.transaction.aggregate({
      where: { workspaceId, status: "paid" },
      _sum: { amount: true },
      _count: true,
    });

    const allIncome = await prisma.transaction.aggregate({
      where: { workspaceId, type: "income", status: "paid" },
      _sum: { amount: true },
    });

    const allExpense = await prisma.transaction.aggregate({
      where: { workspaceId, type: "expense", status: "paid" },
      _sum: { amount: true },
    });

    // ── Maior mês de receita e despesa ─────────────────────────────────────
    const bestIncomeMonth  = monthlyData.reduce((best, m) => m.income  > best.income  ? m : best, monthlyData[0] ?? { label: "—", income: 0 });
    const worstExpenseMonth = monthlyData.reduce((worst, m) => m.expense > worst.expense ? m : worst, monthlyData[0] ?? { label: "—", expense: 0 });

    return NextResponse.json({
      monthlyData,
      categoryBreakdown,
      topExpenses: JSON.parse(JSON.stringify(topExpenses)),
      accounts: JSON.parse(JSON.stringify(accounts)),
      summary: {
        totalTransactions: allTime._count,
        totalIncome:  allIncome._sum.amount  ?? 0,
        totalExpense: allExpense._sum.amount ?? 0,
        netBalance:   (allIncome._sum.amount ?? 0) - (allExpense._sum.amount ?? 0),
        bestIncomeMonth,
        worstExpenseMonth,
      },
    });
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
