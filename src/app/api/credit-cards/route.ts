import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const cards = await prisma.creditCard.findMany({
      where: { workspaceId: wu.workspaceId },
      orderBy: { createdAt: "asc" },
      include: {
        account: { select: { id: true, name: true, color: true } },
        _count: { select: { transactions: true } },
      },
    });

    // Calcula fatura atual para cada cartão
    const now = new Date();
    const cardsWithInvoice = await Promise.all(
      cards.map(async (card) => {
        // Ciclo atual: do fechamento do mês passado até o fechamento deste mês
        const closingDay = card.closingDay;
        let cycleStart: Date, cycleEnd: Date;

        if (now.getDate() <= closingDay) {
          cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1);
          cycleEnd   = new Date(now.getFullYear(), now.getMonth(), closingDay);
        } else {
          cycleStart = new Date(now.getFullYear(), now.getMonth(), closingDay + 1);
          cycleEnd   = new Date(now.getFullYear(), now.getMonth() + 1, closingDay);
        }

        const invoice = await prisma.transaction.aggregate({
          where: {
            creditCardId: card.id,
            type: "expense",
            date: { gte: cycleStart, lte: cycleEnd },
          },
          _sum: { amount: true },
        });

        return {
          ...card,
          currentInvoice: invoice._sum.amount ?? 0,
          usagePercent: card.limit > 0
            ? Math.min(Math.round(((invoice._sum.amount ?? 0) / card.limit) * 100), 100)
            : 0,
          cycleStart: cycleStart.toISOString(),
          cycleEnd:   cycleEnd.toISOString(),
        };
      })
    );

    return NextResponse.json(cardsWithInvoice);
  } catch (error) {
    console.error("[CARDS_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  name:       z.string().min(1).max(80),
  limit:      z.number().positive(),
  closingDay: z.number().min(1).max(31),
  dueDay:     z.number().min(1).max(31),
  color:      z.string().default("#6366f1"),
  network:    z.enum(["visa","mastercard","elo","hipercard"]).optional().nullable(),
  lastFour:   z.string().length(4).optional().nullable(),
  accountId:  z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const card = await prisma.creditCard.create({
      data: { ...data, workspaceId: wu.workspaceId },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error("[CARDS_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
