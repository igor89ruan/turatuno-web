import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const wu = await prisma.workspaceUser.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });
  if (!wu) redirect("/onboarding/workspace");

  const [user, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.category.findMany({
      where: { workspaceId: wu.workspaceId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } } },
    }),
  ]);

  return (
    <SettingsClient
      user={JSON.parse(JSON.stringify(user))}
      workspace={JSON.parse(JSON.stringify(wu.workspace))}
      categories={JSON.parse(JSON.stringify(categories))}
      isOwner={wu.role === "owner"}
    />
  );
}
