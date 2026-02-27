import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── GET — lista transações com filtros ──────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const type       = searchParams.get("type") ?? undefined;
    const status     = searchParams.get("status") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const accountId  = searchParams.get("accountId") ?? undefined;
    const search     = searchParams.get("search") ?? undefined;
    const month      = searchParams.get("month"); // formato: "2025-02"
    const page       = parseInt(searchParams.get("page") ?? "1");
    const limit      = 20;

    const where: any = { workspaceId: wu.workspaceId };
    if (type)       where.type       = type;
    if (status)     where.status     = status;
    if (categoryId) where.categoryId = categoryId;
    if (accountId)  where.accountId  = accountId;
    if (search)     where.description = { contains: search, mode: "insensitive" };
    if (month) {
      const [year, m] = month.split("-").map(Number);
      where.date = {
        gte: new Date(year, m - 1, 1),
        lte: new Date(year, m, 0, 23, 59, 59),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, account: true, creditCard: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ── POST — cria nova transação ──────────────────────────
const createSchema = z.object({
  type:         z.enum(["income", "expense", "transfer"]),
  amount:       z.number().positive("Valor deve ser positivo"),
  description:  z.string().min(1, "Descrição obrigatória").max(200),
  date:         z.string(),
  status:       z.enum(["paid", "pending"]).default("paid"),
  categoryId:   z.string().optional().nullable(),
  accountId:    z.string().optional().nullable(),
  creditCardId: z.string().optional().nullable(),
  isRecurring:  z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const wu = await prisma.workspaceUser.findFirst({ where: { userId: session.user.id } });
    if (!wu) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });

    const body = await req.json();
    const data = createSchema.parse(body);

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        workspaceId: wu.workspaceId,
        userId: session.user.id,
        categoryId:   data.categoryId   ?? null,
        accountId:    data.accountId    ?? null,
        creditCardId: data.creditCardId ?? null,
      },
      include: { category: true, account: true },
    });

    // Atualiza saldo da conta se paga
    if (data.accountId && data.status === "paid") {
      const delta = data.type === "income" ? data.amount : -data.amount;
      await prisma.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: delta } },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
