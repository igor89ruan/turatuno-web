import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper to create a default workspace + categories for a new user
async function createWorkspaceForUser(
    tx: Prisma.TransactionClient,
    userId: string,
    firstName: string,
) {
    const workspace = await tx.workspace.create({
        data: { name: `Finanças de ${firstName}`, profileType: "personal" },
    });
    await tx.workspaceUser.create({
        data: { workspaceId: workspace.id, userId, role: "owner" },
    });
    await tx.category.createMany({
        data: [
            { name: "Alimentação", type: "expense", icon: "🍔", colorHex: "#ef4444", workspaceId: workspace.id },
            { name: "Transporte", type: "expense", icon: "🚗", colorHex: "#f59e0b", workspaceId: workspace.id },
            { name: "Saúde", type: "expense", icon: "❤️", colorHex: "#ec4899", workspaceId: workspace.id },
            { name: "Lazer", type: "expense", icon: "🎮", colorHex: "#8b5cf6", workspaceId: workspace.id },
            { name: "Educação", type: "expense", icon: "📚", colorHex: "#3b82f6", workspaceId: workspace.id },
            { name: "Moradia", type: "expense", icon: "🏠", colorHex: "#6366f1", workspaceId: workspace.id },
            { name: "Salário", type: "income", icon: "💰", colorHex: "#10b981", workspaceId: workspace.id },
            { name: "Freelance", type: "income", icon: "🧑‍💻", colorHex: "#22d3ee", workspaceId: workspace.id },
        ],
    });
    return workspace;
}

export const authOptions: NextAuthOptions = {
    providers: [
        // ── Google OAuth ──────────────────────────────────────────
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),

        // ── E-mail / Phone + password ─────────────────────────────
        CredentialsProvider({
            name: "credentials",
            credentials: {
                identifier: { label: "E-mail ou Telefone", type: "text" },
                password: { label: "Senha", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Preencha todos os campos.");
                }
                const { identifier, password } = credentials;

                const user = await prisma.user.findFirst({
                    where: { OR: [{ email: identifier }, { phone: identifier }] },
                });

                if (!user) {
                    // Machine-readable code — login page will redirect to /register
                    throw new Error("USER_NOT_FOUND");
                }

                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    throw new Error("INVALID_PASSWORD");
                }

                return { id: user.id, name: user.name, email: user.email ?? undefined };
            },
        }),
    ],

    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

    callbacks: {
        // Auto-create user on first Google sign-in
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                const existing = await prisma.user.findFirst({ where: { email: user.email } });
                if (!existing) {
                    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                        const u = await tx.user.create({
                            data: { name: user.name ?? "Usuário Google", email: user.email!, password: "" },
                        });
                        await createWorkspaceForUser(tx, u.id, (user.name ?? "Usuário").split(" ")[0]);
                        return u;
                    });
                    user.id = created.id;
                } else {
                    user.id = existing.id;
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user) (session.user as { id?: string }).id = token.id as string;
            return session;
        },
    },

    pages: { signIn: "/login", error: "/login" },
    secret: process.env.NEXTAUTH_SECRET ?? "turatuno-dev-secret-change-in-prod",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
