import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TransactionsClient from "@/components/transactions/TransactionsClient";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({
    where: { userId: session.user.id },
  });
  if (!wu) redirect("/onboarding/workspace");

  const workspaceId = wu.workspaceId;

  const [transactions, accounts, creditCards, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId },
      include: { category: true, account: true, creditCard: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.account.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.creditCard.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <TransactionsClient
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      creditCards={JSON.parse(JSON.stringify(creditCards))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
