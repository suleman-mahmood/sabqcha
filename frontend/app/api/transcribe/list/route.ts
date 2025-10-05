import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/transcribe/list`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch lecture list:", error);
    return NextResponse.json({ error: "Failed to fetch lecture list" }, { status: 500 });
  }
}
