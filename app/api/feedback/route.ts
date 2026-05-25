import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, rating, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields." },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        name,
        email,
        rating: Number(rating) || 5,
        message,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("[FEEDBACK_API_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
