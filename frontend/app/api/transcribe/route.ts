import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");
  if (!filePath)
    return NextResponse.json({ error: "Missing filePath" }, { status: 400 });

  try {
    const baseUrl = process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE!;
    const res = await fetch(`${baseUrl}/transcribe/${encodeURIComponent(filePath)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to transcribe" }, { status: 500 });
  }
}
