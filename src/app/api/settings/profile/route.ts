import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash, compare } from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const body = await req.json();
    const schema = z.object({
      name:            z.string().min(2).max(80).optional(),
      currentPassword: z.string().optional(),
      newPassword:     z.string().min(8).optional(),
    });
    const data = schema.parse(body);

    // Troca de senha
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

      const valid = await compare(data.currentPassword, user.password);
      if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });

      const hashed = await hash(data.newPassword, 12);
      await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    }

    // Atualiza nome
    if (data.name) {
      await prisma.user.update({ where: { id: session.user.id }, data: { name: data.name } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[PROFILE_PATCH]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
