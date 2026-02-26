import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

/**
 * Returns the current session or null.
 */
export async function getSession() {
    return getServerSession(authOptions);
}

/**
 * Returns the current session. Redirects to /login if not authenticated.
 */
export async function requireSession() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    return session;
}
