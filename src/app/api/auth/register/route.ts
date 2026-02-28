import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, password, profileType } = body;

        // ── Validation ───────────────────────────────────────────
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { error: "Nome deve ter ao menos 2 caracteres." },
                { status: 400 }
            );
        }

        if (!email && !phone) {
            return NextResponse.json(
                { error: "Informe um e-mail ou número de telefone." },
                { status: 400 }
            );
        }

        if (!password || password.length < 8) {
            return NextResponse.json(
                { error: "A senha deve ter ao menos 8 caracteres." },
                { status: 400 }
            );
        }

        // ── Check duplicates ─────────────────────────────────────
        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json(
                    { error: "Esse e-mail já está cadastrado." },
                    { status: 409 }
                );
            }
        }

        if (phone) {
            const existing = await prisma.user.findUnique({ where: { phone } });
            if (existing) {
                return NextResponse.json(
                    { error: "Esse número de telefone já está cadastrado." },
                    { status: 409 }
                );
            }
        }

        // ── Hash password ─────────────────────────────────────────
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── Pre-generate IDs so batch transaction can reference them ──
        const userId = randomUUID();
        const workspaceId = randomUUID();
        const firstName = name.trim().split(" ")[0];

        const defaultCategories = [
            { name: "Alimentação", type: "expense", icon: "🍔", colorHex: "#ef4444" },
            { name: "Transporte",  type: "expense", icon: "🚗", colorHex: "#f59e0b" },
            { name: "Saúde",       type: "expense", icon: "❤️", colorHex: "#ec4899" },
            { name: "Lazer",       type: "expense", icon: "🎮", colorHex: "#8b5cf6" },
            { name: "Educação",    type: "expense", icon: "📚", colorHex: "#3b82f6" },
            { name: "Moradia",     type: "expense", icon: "🏠", colorHex: "#6366f1" },
            { name: "Software",    type: "expense", icon: "💻", colorHex: "#06b6d4" },
            { name: "Salário",     type: "income",  icon: "💰", colorHex: "#10b981" },
            { name: "Freelance",   type: "income",  icon: "🧑‍💻", colorHex: "#22d3ee" },
            { name: "Investimento",type: "income",  icon: "📈", colorHex: "#84cc16" },
        ];

        // ── Batch transaction (compatible with connection poolers) ─
        await prisma.$transaction([
            prisma.user.create({
                data: {
                    id: userId,
                    name: name.trim(),
                    email: email || null,
                    phone: phone || null,
                    password: hashedPassword,
                },
            }),
            prisma.workspace.create({
                data: {
                    id: workspaceId,
                    name: `Finanças de ${firstName}`,
                    profileType: profileType || "personal",
                    defaultCurrency: "BRL",
                },
            }),
            prisma.workspaceUser.create({
                data: {
                    workspaceId,
                    userId,
                    role: "owner",
                },
            }),
            prisma.category.createMany({
                data: defaultCategories.map((cat) => ({
                    ...cat,
                    workspaceId,
                })),
            }),
        ]);

        // ── Return sanitized response (no password) ───────────────
        return NextResponse.json(
            {
                message: "Conta criada com sucesso!",
                user: {
                    id: userId,
                    name: name.trim(),
                    email: email || null,
                    phone: phone || null,
                },
                workspace: {
                    id: workspaceId,
                    name: `Finanças de ${firstName}`,
                    profileType: profileType || "personal",
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[POST /api/auth/register] Error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor. Tente novamente." },
            { status: 500 }
        );
    }
}
