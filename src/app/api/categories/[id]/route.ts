import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const cat = await prisma.category.findFirst({ where: { id: params.id, workspaceId: wu.workspaceId } });
    if (!cat) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

    const body = await req.json();
    const schema = z.object({
      name:     z.string().min(1).max(60).optional(),
      icon:     z.string().optional(),
      colorHex: z.string().optional(),
    });
    const data = schema.parse(body);
    const updated = await prisma.category.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CATEGORY_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const cat = await prisma.category.findFirst({ where: { id: params.id, workspaceId: wu.workspaceId } });
    if (!cat) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });

    if (cat.isDefault) return NextResponse.json({ error: "Categorias padrão não podem ser removidas." }, { status: 400 });

    // Desvincula transações
    await prisma.transaction.updateMany({ where: { categoryId: params.id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
