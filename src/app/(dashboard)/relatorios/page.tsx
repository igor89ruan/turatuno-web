import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const userId = (session.user as { id: string }).id;

    // 1. Get user's active workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
        where: { userId },
        include: {
            workspace: {
                include: {
                    accounts: true,
                    categories: true,
                    transactions: {
                        where: {
                            // Optionally pre-filter by current year to avoid massive payload
                            date: { gte: new Date(new Date().getFullYear(), 0, 1) }
                        },
                        include: { category: true, user: { select: { name: true } } },
                        orderBy: { date: "desc" },
                    },
                },
            },
        },
    });

    if (!userWorkspace) {
        // Should have been created at signup/login, but just in case
        return <div style={{ color: "white", padding: "2rem" }}>Nenhum workspace encontrado.</div>;
    }

    return (
        <ReportsClient
            userName={session.user?.name || "Usuário"}
            workspace={userWorkspace.workspace}
        />
    );
}
