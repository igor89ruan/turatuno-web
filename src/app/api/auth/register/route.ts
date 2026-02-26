import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

        // ── Create User + Workspace in a single transaction ───────
        const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // 1. Create user
            const user = await tx.user.create({
                data: {
                    name: name.trim(),
                    email: email || null,
                    phone: phone || null,
                    password: hashedPassword,
                },
            });

            // 2. Create personal workspace owned by this user
            const workspace = await tx.workspace.create({
                data: {
                    name: `Finanças de ${name.trim().split(" ")[0]}`,
                    profileType: profileType || "personal",
                    defaultCurrency: "BRL",
                },
            });

            // 3. Link user as owner of workspace
            await tx.workspaceUser.create({
                data: {
                    workspaceId: workspace.id,
                    userId: user.id,
                    role: "owner",
                },
            });

            // 4. Create default categories for the workspace
            const defaultCategories = [
                { name: "Alimentação", type: "expense", icon: "🍔", colorHex: "#ef4444" },
                { name: "Transporte", type: "expense", icon: "🚗", colorHex: "#f59e0b" },
                { name: "Saúde", type: "expense", icon: "❤️", colorHex: "#ec4899" },
                { name: "Lazer", type: "expense", icon: "🎮", colorHex: "#8b5cf6" },
                { name: "Educação", type: "expense", icon: "📚", colorHex: "#3b82f6" },
                { name: "Moradia", type: "expense", icon: "🏠", colorHex: "#6366f1" },
                { name: "Software", type: "expense", icon: "💻", colorHex: "#06b6d4" },
                { name: "Salário", type: "income", icon: "💰", colorHex: "#10b981" },
                { name: "Freelance", type: "income", icon: "🧑‍💻", colorHex: "#22d3ee" },
                { name: "Investimento", type: "income", icon: "📈", colorHex: "#84cc16" },
            ];

            await tx.category.createMany({
                data: defaultCategories.map((cat) => ({
                    ...cat,
                    workspaceId: workspace.id,
                })),
            });

            return { user, workspace };
        });

        // ── Return sanitized response (no password) ───────────────
        return NextResponse.json(
            {
                message: "Conta criada com sucesso!",
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone,
                    createdAt: result.user.createdAt,
                },
                workspace: {
                    id: result.workspace.id,
                    name: result.workspace.name,
                    profileType: result.workspace.profileType,
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
