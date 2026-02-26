import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Definimos um tipo para o contexto para facilitar
type RouteContext = {
    params: Promise<{ id: string }>
}

// CORREÇÃO NO DELETE (Já fizemos, mas mantenha assim)
export async function DELETE(
    _req: NextRequest,
    { params }: RouteContext
) {
    const { id } = await params;
    // ... resto do seu código de DELETE usando 'id'
}

// CORREÇÃO NO PUT (Onde o erro está agora)
export async function PUT(
    req: NextRequest, // ou Request
    { params }: RouteContext
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params; // <--- O PONTO CRÍTICO

    // Pegue os dados do corpo da requisição
    const body = await req.json();

    // Exemplo de atualização (ajuste conforme seus campos)
    const updatedTx = await prisma.transaction.update({
        where: { id: id },
        data: {
            // Seus campos aqui, ex: description: body.description
            ...body
        }
    });

    return NextResponse.json(updatedTx);
}
