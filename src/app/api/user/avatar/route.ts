import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 600 * 1024; // 600KB after base64

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { avatarUrl } = await request.json();
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json({ error: "Avatar inválido." }, { status: 400 });
    }

    if (!avatarUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato de imagem inválido." }, { status: 400 });
    }

    if (avatarUrl.length > MAX_SIZE) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 400KB." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/user/avatar]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
