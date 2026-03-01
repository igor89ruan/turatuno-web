import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Helper to create a default workspace + categories for a new user
// Uses batch transaction (compatible with connection poolers like Neon/Supabase)
async function createWorkspaceForUser(userId: string, firstName: string) {
    const workspaceId = randomUUID();
    await prisma.$transaction([
        prisma.workspace.create({
            data: { id: workspaceId, name: `Finanças de ${firstName}`, profileType: "personal" },
        }),
        prisma.workspaceUser.create({
            data: { workspaceId, userId, role: "owner" },
        }),
        prisma.category.createMany({
            data: [
                { name: "Alimentação", type: "expense", icon: "🍔", colorHex: "#ef4444", workspaceId },
                { name: "Transporte",  type: "expense", icon: "🚗", colorHex: "#f59e0b", workspaceId },
                { name: "Saúde",       type: "expense", icon: "❤️", colorHex: "#ec4899", workspaceId },
                { name: "Lazer",       type: "expense", icon: "🎮", colorHex: "#8b5cf6", workspaceId },
                { name: "Educação",    type: "expense", icon: "📚", colorHex: "#3b82f6", workspaceId },
                { name: "Moradia",     type: "expense", icon: "🏠", colorHex: "#6366f1", workspaceId },
                { name: "Salário",     type: "income",  icon: "💰", colorHex: "#10b981", workspaceId },
                { name: "Freelance",   type: "income",  icon: "🧑‍💻", colorHex: "#22d3ee", workspaceId },
            ],
        }),
    ]);
    return workspaceId;
}

export const authOptions: NextAuthOptions = {
    providers: [
        // ── Google OAuth (only when configured) ───────────────────
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })]
            : []),

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
                    const userId = randomUUID();
                    const firstName = (user.name ?? "Usuário").split(" ")[0];
                    await prisma.user.create({
                        data: { id: userId, name: user.name ?? "Usuário Google", email: user.email, password: "" },
                    });
                    await createWorkspaceForUser(userId, firstName);
                    user.id = userId;
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
