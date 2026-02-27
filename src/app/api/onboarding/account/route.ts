import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto").max(80),
  type: z.enum(["checking", "savings", "cash", "investment"]),
  balance: z.number().default(0),
  color: z.string().default("#3b82f6"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, balance, color } = schema.parse(body);

    // Busca workspace do usuário
    const workspaceUser = await prisma.workspaceUser.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    });

    if (!workspaceUser) {
      return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance,
        color,
        workspaceId: workspaceUser.workspaceId,
      },
    });

    return NextResponse.json({ accountId: account.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[ACCOUNT_CREATE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
