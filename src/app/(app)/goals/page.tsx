import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GoalsClient from "@/components/goals/GoalsClient";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
  if (!wu) redirect("/onboarding/workspace");

  const [goals, accounts] = await Promise.all([
    prisma.goal.findMany({
      where: { workspaceId: wu.workspaceId },
      include: { account: { select: { id: true, name: true, color: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.account.findMany({
      where: { workspaceId: wu.workspaceId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <GoalsClient
      initialGoals={JSON.parse(JSON.stringify(goals))}
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
