import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { file_path, yt_video_link, title, user_id } = await req.json();

    // title and user_id are always required
    if (!title || !user_id) {
      return NextResponse.json({ error: "Missing title or user_id" }, { status: 400 });
    }

    // Accept either an uploaded file path or a YouTube link
    const finalFilePath = file_path ?? null;
    if (!finalFilePath && !yt_video_link) {
      return NextResponse.json({ error: "Missing file path or yt_video_link" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const payload: Record<string, unknown> = { file_path: finalFilePath, yt_video_link: yt_video_link ?? null, title, user_id };

    const res = await fetch(`${baseUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Transcribe API error:", errText);
      return NextResponse.json(
        { error: "Transcribe API failed", details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transcribe route error:", error);
    return NextResponse.json({ error: "Failed to transcribe" }, { status: 500 });
  }
}
