import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcriptionId = body?.transcription_id as string | undefined;
    const userId = body?.user_id as string | undefined;
    const displayName = body?.display_name as string | undefined;
    const mcqs = body?.mcqs as any[] | undefined;

    if (!transcriptionId)
      return NextResponse.json({ error: "Missing transcription_id" }, { status: 400 });
    if (!userId)
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    if (!displayName)
      return NextResponse.json({ error: "Missing displayName" }, { status: 400 });
    if (!Array.isArray(mcqs))
      return NextResponse.json({ error: "Missing mcqs array" }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcription_id: transcriptionId, user_id: userId, display_name: displayName, mcqs }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Failed to forward MCQ submission to /task:", error);
    return NextResponse.json({ error: "Failed to submit mcqs" }, { status: 500 });
  }
}
