import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    const workspaceUser = await prisma.workspaceUser.findFirst({
        where: { userId },
        select: { workspaceId: true },
    });

    if (!workspaceUser) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    // Fetch all categories and subcategories (active and archived)
    const categories = await prisma.category.findMany({
        where: {
            workspaceId: workspaceUser.workspaceId,
            parentId: null, // Only fetch top-level categories, include subcategories explicitly
        },
        include: {
            subcategories: {
                orderBy: { name: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const workspaceUser = await prisma.workspaceUser.findFirst({
        where: { userId },
        select: { workspaceId: true },
    });

    if (!workspaceUser) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const body = await req.json();
    const { name, type, colorHex, icon, parentId, monthlyBudget, keywords } = body;

    if (!name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify parent category exists and belongs to the workspace
    if (parentId) {
        const parent = await prisma.category.findFirst({
            where: { id: parentId, workspaceId: workspaceUser.workspaceId },
        });
        if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
    }

    const newCategory = await prisma.category.create({
        data: {
            workspaceId: workspaceUser.workspaceId,
            name,
            type: type || "expense", // Make type agnostic (fallback to expense)
            colorHex: colorHex || "#6366f1",
            icon: icon || "📁",
            parentId: parentId || null,
            monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
            keywords: keywords || null,
        },
    });

    return NextResponse.json({ category: newCategory });
}
