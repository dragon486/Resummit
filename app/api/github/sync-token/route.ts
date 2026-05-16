import { auth } from "@/auth";
import { prisma, resolveUserId } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const userId = await resolveUserId(session);

    if (!userId || !userId.startsWith('c')) {
      console.error("[GITHUB] Could not resolve a valid database User ID for session:", session.user);
      return NextResponse.json({ error: "User record not found in database. Please re-login." }, { status: 404 });
    }

    await prisma.gitHubData.upsert({
      where: { userId: userId },
      update: { accessToken },
      create: {
        userId: userId,
        accessToken,
        repositories: [],
        signals: {},
      }
    });

    console.log("[GITHUB] Token synced successfully for user:", userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[GITHUB] Token sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
