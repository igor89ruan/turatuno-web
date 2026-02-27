import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto").max(80),
  profileType: z.enum(["personal", "business"]),
  iconEmoji: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { name, profileType, iconEmoji } = schema.parse(body);

    // Verifica se já tem workspace
    const existing = await prisma.workspaceUser.findFirst({
      where: { userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Workspace já existe." }, { status: 409 });
    }

    // Cria workspace e vincula o owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        profileType,
        iconEmoji: iconEmoji ?? "💰",
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });

    // Cria categorias padrão
    const defaultCategories = [
      // Despesas
      { name: "Alimentação",   type: "expense", icon: "🍔", colorHex: "#f43f5e", isDefault: true },
      { name: "Transporte",    type: "expense", icon: "🚗", colorHex: "#3b82f6", isDefault: true },
      { name: "Moradia",       type: "expense", icon: "🏠", colorHex: "#10b981", isDefault: true },
      { name: "Lazer",         type: "expense", icon: "🎮", colorHex: "#f59e0b", isDefault: true },
      { name: "Saúde",         type: "expense", icon: "💊", colorHex: "#8b5cf6", isDefault: true },
      { name: "Educação",      type: "expense", icon: "📚", colorHex: "#06b6d4", isDefault: true },
      { name: "Vestuário",     type: "expense", icon: "👗", colorHex: "#ec4899", isDefault: true },
      { name: "Assinaturas",   type: "expense", icon: "💻", colorHex: "#6366f1", isDefault: true },
      { name: "Outros",        type: "expense", icon: "📦", colorHex: "#64748b", isDefault: true },
      // Receitas
      { name: "Salário",       type: "income",  icon: "💼", colorHex: "#10b981", isDefault: true },
      { name: "Freelance",     type: "income",  icon: "💻", colorHex: "#06b6d4", isDefault: true },
      { name: "Investimentos", type: "income",  icon: "📈", colorHex: "#10b981", isDefault: true },
      { name: "Extra",         type: "income",  icon: "💰", colorHex: "#8b5cf6", isDefault: true },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((c) => ({
        ...c,
        workspaceId: workspace.id,
      })),
    });

    return NextResponse.json({ workspaceId: workspace.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[WORKSPACE_CREATE]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
