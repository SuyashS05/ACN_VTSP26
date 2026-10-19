import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const rawName = req.headers.get("x-file-name") || `upload_${Date.now()}.mp4`;
    const safeName = `${Date.now()}_${rawName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await req.arrayBuffer();
    const filePath = path.join(uploadsDir, safeName);
    await writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json(
      {
        ok: true,
        fileName: safeName,
        url: `/uploads/${safeName}`,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

