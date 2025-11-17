import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { uid, day, qrDataUrl } = await request.json();

    if (!uid || !day || !qrDataUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (day < 1 || day > 4) {
      return NextResponse.json(
        { success: false, error: "Invalid day (must be 1-4)" },
        { status: 400 }
      );
    }

    const bucket = "qr-codes";
    const filePath = `${uid}/day${day}.png`;

    const base64Data = qrDataUrl.split(",")[1];
    const arrayBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { success: false, error: `Failed to upload QR code: ${error.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload QR code",
      },
      { status: 500 }
    );
  }
}

