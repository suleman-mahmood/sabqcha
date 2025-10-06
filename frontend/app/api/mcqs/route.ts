import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcriptionId = body?.transcription_id as string | undefined;
    const userId = body?.user_id as string | undefined;

    if (!transcriptionId)
      return NextResponse.json({ error: "Missing transcription_id" }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/transcribe/mcqs/${encodeURIComponent(transcriptionId)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch MCQs:", error);
    return NextResponse.json({ error: "Failed to fetch MCQs" }, { status: 500 });
  }
}
