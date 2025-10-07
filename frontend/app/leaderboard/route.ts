import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/leaderboard`);
    if (!res.ok) {
      console.error("Leaderboard fetch failed:", res.status);
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();

    // Ensure expected shape
    if (!Array.isArray(data) && !data.data) {
      console.error("Unexpected response format from backend:", data);
      return NextResponse.json([]);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
