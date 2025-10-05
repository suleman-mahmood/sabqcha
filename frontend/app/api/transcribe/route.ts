import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName, title } = await req.json();

    if (!fileName || !title) {
      return NextResponse.json(
        { error: "Missing fileName or title" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: fileName, title }),
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
