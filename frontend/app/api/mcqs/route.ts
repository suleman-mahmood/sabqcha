import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transcriptionId = searchParams.get("transcription_id");
  if (!transcriptionId)
    return NextResponse.json({ error: "Missing transcription_id" }, { status: 400 });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/transcribe/mcqs/${encodeURIComponent(transcriptionId)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch MCQs" }, { status: 500 });
  }
}
