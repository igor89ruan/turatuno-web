import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountsClient from "@/components/accounts/AccountsClient";

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
  if (!wu) redirect("/onboarding/workspace");

  const accounts = await prisma.account.findMany({
    where: { workspaceId: wu.workspaceId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return <AccountsClient initialAccounts={JSON.parse(JSON.stringify(accounts))} />;
}
