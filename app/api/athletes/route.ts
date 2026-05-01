import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Athlete } from "@/models/athlete";

export async function GET() {
  try {
    await connectDB();
    const athletes = await Athlete.find().sort({ name: 1 }).lean();
    return NextResponse.json({ athletes });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
