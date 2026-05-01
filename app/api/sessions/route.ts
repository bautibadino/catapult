import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Session } from "@/models/session";

export async function GET() {
  try {
    await connectDB();
    const sessions = await Session.find().sort({ date: -1 }).lean();
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
