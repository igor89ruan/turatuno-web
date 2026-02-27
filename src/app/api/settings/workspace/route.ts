import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({
      where: { userId: session.user.id, role: "owner" },
    });
    if (!wu) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const body = await req.json();
    const schema = z.object({
      name:        z.string().min(2).max(80).optional(),
      iconEmoji:   z.string().optional(),
      profileType: z.enum(["personal", "business"]).optional(),
    });
    const data = schema.parse(body);

    const workspace = await prisma.workspace.update({
      where: { id: wu.workspaceId },
      data,
    });

    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[WORKSPACE_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
