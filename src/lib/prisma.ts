import { PrismaClient } from "@prisma/client";

// helper to validate that we actually have a connection string.  
// If DATABASE_URL is missing in production it leads to a very unhelpful Prisma
// error; this check prints a clear message and optionally provides a fallback
// for local development.
function getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (url) return url;
    if (process.env.NODE_ENV === "development") {
        console.warn(
            "[prisma] WARNING: DATABASE_URL not defined, falling back to localhost."
        );
        return "postgresql://localhost:5432/dev"; // adjust as needed
    }
    throw new Error(
        "Missing required environment variable DATABASE_URL. " +
            "Set it in your .env or in your deployment platform."
    );
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        datasources: {
            db: { url: getDatabaseUrl() },
        },
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
