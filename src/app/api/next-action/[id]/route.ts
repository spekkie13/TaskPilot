import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../../../../lib/auth'
import { prisma } from "../../../../../lib/prisma";
import { generateNextAction } from "../../../../../lib/openai";

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the task (ensure ownership)
    const task = await prisma.taskInstance.findFirst({
        where: {
            id,
            habit: { user: { email: session.user.email } },
        },
        include: { habit: true },
    });
    if (!task) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Generate & persist nextAction
    const nextAction = await generateNextAction(task.habit.title);
    await prisma.taskInstance.update({
        where: { id },
        data: { nextAction },
    });

    return NextResponse.json({ nextAction });
}
