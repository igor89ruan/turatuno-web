import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  // Verifica se tem workspace
  const workspaceUser = await prisma.workspaceUser.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!workspaceUser) redirect("/onboarding/workspace");

  const workspaceId = workspaceUser.workspaceId;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Contas
  const accounts = await prisma.account.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  // Transações do mês
  const monthTransactions = await prisma.transaction.findMany({
    where: { workspaceId, date: { gte: monthStart, lte: monthEnd }, status: "paid" },
    include: { category: true },
  });

  const monthIncome  = monthTransactions.filter(t => t.type === "income" ).reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Gastos por categoria
  const catMap: Record<string, { name: string; icon: string; color: string; total: number }> = {};
  monthTransactions
    .filter(t => t.type === "expense" && t.category)
    .forEach(t => {
      const cat = t.category!;
      if (!catMap[cat.id]) catMap[cat.id] = { name: cat.name, icon: cat.icon, color: cat.colorHex, total: 0 };
      catMap[cat.id].total += t.amount;
    });
  const categoryData = Object.values(catMap).sort((a, b) => b.total - a.total).slice(0, 6);

  // Últimas transações
  const recentTransactions = await prisma.transaction.findMany({
    where: { workspaceId },
    include: { category: true, account: true, creditCard: true },
    orderBy: { date: "desc" },
    take: 8,
  });

  // Metas
  const goals = await prisma.goal.findMany({
    where: { workspaceId, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Pendentes
  const pendingCount = await prisma.transaction.count({
    where: { workspaceId, status: "pending" },
  });

  // Variação mês anterior
  const prevStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
  const prevEnd   = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
  const prevExpense = await prisma.transaction.aggregate({
    where: { workspaceId, type: "expense", status: "paid", date: { gte: prevStart, lte: prevEnd } },
    _sum: { amount: true },
  });
  const expenseVariation = prevExpense._sum.amount
    ? Math.round(((monthExpense - prevExpense._sum.amount) / prevExpense._sum.amount) * 100)
    : 0;

  const monthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <DashboardClient
      workspace={workspaceUser.workspace}
      user={session.user}
      totalBalance={totalBalance}
      accounts={JSON.parse(JSON.stringify(accounts))}
      monthIncome={monthIncome}
      monthExpense={monthExpense}
      expenseVariation={expenseVariation}
      categoryData={categoryData}
      recentTransactions={JSON.parse(JSON.stringify(recentTransactions))}
      goals={JSON.parse(JSON.stringify(goals))}
      pendingCount={pendingCount}
      monthLabel={monthLabel}
    />
  );
}
