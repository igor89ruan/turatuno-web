import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Nome deve ter ao menos 2 caracteres." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[PUT /api/user/profile]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
