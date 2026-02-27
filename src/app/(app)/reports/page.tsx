import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
  if (!wu) redirect("/onboarding/workspace");

  const workspaceId = wu.workspaceId;
  const now = new Date();
  const MONTHS = 6;

  // Evolução mensal
  const monthlyData = await Promise.all(
    Array.from({ length: MONTHS }, (_, i) => {
      const date  = subMonths(now, MONTHS - 1 - i);
      const start = startOfMonth(date);
      const end   = endOfMonth(date);
      const label = format(date, "MMM/yy", { locale: ptBR });
      return Promise.all([
        prisma.transaction.aggregate({ where: { workspaceId, type: "income",  status: "paid", date: { gte: start, lte: end } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { workspaceId, type: "expense", status: "paid", date: { gte: start, lte: end } }, _sum: { amount: true } }),
      ]).then(([inc, exp]) => ({
        label,
        income:  inc._sum.amount ?? 0,
        expense: exp._sum.amount ?? 0,
        balance: (inc._sum.amount ?? 0) - (exp._sum.amount ?? 0),
      }));
    })
  );

  // Categorias do mês atual
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const txWithCat = await prisma.transaction.findMany({
    where: { workspaceId, type: "expense", status: "paid", date: { gte: monthStart, lte: monthEnd } },
    include: { category: true },
  });

  const catMap: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {};
  let totalExpMonth = 0;
  txWithCat.forEach((tx) => {
    totalExpMonth += tx.amount;
    const key = tx.categoryId ?? "__none__";
    const cat = tx.category;
    if (!catMap[key]) catMap[key] = { name: cat?.name ?? "Sem categoria", icon: cat?.icon ?? "📦", color: cat?.colorHex ?? "#64748b", total: 0, count: 0 };
    catMap[key].total += tx.amount;
    catMap[key].count++;
  });
  const categoryBreakdown = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ ...c, pct: totalExpMonth > 0 ? (c.total / totalExpMonth) * 100 : 0 }));

  // Top despesas do mês
  const topExpenses = await prisma.transaction.findMany({
    where: { workspaceId, type: "expense", status: "paid", date: { gte: monthStart, lte: monthEnd } },
    include: { category: true, account: true },
    orderBy: { amount: "desc" },
    take: 10,
  });

  // Contas
  const accounts = await prisma.account.findMany({
    where: { workspaceId },
    orderBy: { balance: "desc" },
  });

  // Totais gerais
  const [allIncome, allExpense, txCount] = await Promise.all([
    prisma.transaction.aggregate({ where: { workspaceId, type: "income",  status: "paid" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { workspaceId, type: "expense", status: "paid" }, _sum: { amount: true } }),
    prisma.transaction.count({ where: { workspaceId } }),
  ]);

  const bestIncomeMonth   = monthlyData.reduce((b, m) => m.income  > b.income  ? m : b, monthlyData[0] ?? { label: "—", income: 0, expense: 0, balance: 0 });
  const worstExpenseMonth = monthlyData.reduce((w, m) => m.expense > w.expense ? m : w, monthlyData[0] ?? { label: "—", income: 0, expense: 0, balance: 0 });

  return (
    <ReportsClient
      monthlyData={monthlyData}
      categoryBreakdown={categoryBreakdown}
      topExpenses={JSON.parse(JSON.stringify(topExpenses))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      summary={{
        totalTransactions: txCount,
        totalIncome:  allIncome._sum.amount  ?? 0,
        totalExpense: allExpense._sum.amount ?? 0,
        netBalance:   (allIncome._sum.amount ?? 0) - (allExpense._sum.amount ?? 0),
        bestIncomeMonth,
        worstExpenseMonth,
      }}
    />
  );
}
