import { generateQRSecret, generateQRURL } from "@/lib/qr";
import { generateAndUploadQR } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase";
import { formatPhoneNumber, generateUID } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if phone number already exists
    const { data: existingAttendee } = await supabaseAdmin
      .from("attendees")
      .select("id, name")
      .eq("phone", formattedPhone)
      .single();

    if (existingAttendee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This phone number is already registered. Please use a different phone number or retrieve your QR codes using the 'Retrieve QR Codes' page.",
        },
        { status: 400 }
      );
    }

    const uid = generateUID();
    const qrSecret = generateQRSecret();

    const qrUrls = {
      day1: generateQRURL(uid, 1, qrSecret),
      day2: generateQRURL(uid, 2, qrSecret),
      day3: generateQRURL(uid, 3, qrSecret),
      day4: generateQRURL(uid, 4, qrSecret),
    };

    const qrImageUrls = {
      day1: await generateAndUploadQR(uid, 1, qrSecret, qrUrls.day1),
      day2: await generateAndUploadQR(uid, 2, qrSecret, qrUrls.day2),
      day3: await generateAndUploadQR(uid, 3, qrSecret, qrUrls.day3),
      day4: await generateAndUploadQR(uid, 4, qrSecret, qrUrls.day4),
    };

    const { data: attendee, error } = await supabaseAdmin
      .from("attendees")
      .insert({
        uid,
        name,
        phone: formattedPhone,
        qr_secret: qrSecret,
        qr_day1_url: qrUrls.day1,
        qr_day2_url: qrUrls.day2,
        qr_day3_url: qrUrls.day3,
        qr_day4_url: qrUrls.day4,
        qr_day1_image_url: qrImageUrls.day1,
        qr_day2_image_url: qrImageUrls.day2,
        qr_day3_image_url: qrImageUrls.day3,
        qr_day4_image_url: qrImageUrls.day4,
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to register attendee: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uid,
      qr_urls: qrUrls,
      qr_image_urls: qrImageUrls,
      attendee,
    });
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

