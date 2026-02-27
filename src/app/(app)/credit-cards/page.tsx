import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CreditCardsClient from "@/components/credit-cards/CreditCardsClient";

export default async function CreditCardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
  if (!wu) redirect("/onboarding/workspace");

  const workspaceId = wu.workspaceId;

  const [cards, accounts] = await Promise.all([
    prisma.creditCard.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      include: {
        account: { select: { id: true, name: true, color: true } },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.account.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Calcula fatura atual de cada cartão
  const now = new Date();
  const cardsWithInvoice = await Promise.all(
    cards.map(async (card) => {
      const closingDay = card.closingDay;
      let cycleStart: Date, cycleEnd: Date;

      if (now.getDate() <= closingDay) {
        cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1);
        cycleEnd   = new Date(now.getFullYear(), now.getMonth(), closingDay);
      } else {
        cycleStart = new Date(now.getFullYear(), now.getMonth(), closingDay + 1);
        cycleEnd   = new Date(now.getFullYear(), now.getMonth() + 1, closingDay);
      }

      const invoice = await prisma.transaction.aggregate({
        where: { creditCardId: card.id, type: "expense", date: { gte: cycleStart, lte: cycleEnd } },
        _sum: { amount: true },
      });

      const currentInvoice = invoice._sum.amount ?? 0;

      return {
        ...card,
        currentInvoice,
        usagePercent: card.limit > 0 ? Math.min(Math.round((currentInvoice / card.limit) * 100), 100) : 0,
        available: card.limit - currentInvoice,
        dueDate: cycleEnd.toISOString(),
      };
    })
  );

  return (
    <CreditCardsClient
      initialCards={JSON.parse(JSON.stringify(cardsWithInvoice))}
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
