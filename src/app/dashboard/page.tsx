import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
    const session = await requireSession();

    // Fetch the user's primary workspace
    const workspaceUser = await prisma.workspaceUser.findFirst({
        where: { userId: (session.user as { id: string }).id, role: "owner" },
        include: {
            workspace: {
                include: {
                    accounts: { take: 5 },
                    categories: { take: 10 },
                    transactions: {
                        take: 50,
                        orderBy: { date: "desc" },
                        include: { category: true, user: { select: { name: true } } },
                    },
                },
            },
        },
    });

    return (
        <DashboardClient
            userName={session.user?.name ?? "Usuário"}
            workspace={workspaceUser?.workspace ?? null}
        />
    );
}
