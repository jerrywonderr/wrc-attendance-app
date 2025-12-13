import { getCurrentDayDate, getDayName } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase";
import { getProgramDayFromToken } from "@/lib/tokens";
import { formatPhoneNumber } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, phone } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing QR token" },
        { status: 400 }
      );
    }

    const tokenInfo = getProgramDayFromToken(token);

    if (!tokenInfo) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired QR code" },
        { status: 400 }
      );
    }

    const currentDayDate = getCurrentDayDate();

    // Check if it's the correct day
    if (currentDayDate !== tokenInfo.day) {
      return NextResponse.json(
        {
          success: false,
          error: `This QR code is valid for ${getDayName(
            tokenInfo.day
          )}. Please scan today's code at the venue.`,
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json({
        success: true,
        requiresPhone: true,
        day: tokenInfo.day,
        message: `Enter your phone number to confirm attendance for ${getDayName(
          tokenInfo.day
        )}.`,
      });
    }

    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.length !== 11) {
      return NextResponse.json(
        { success: false, error: "Phone number must be exactly 11 digits" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    const { data: attendee, error: attendeeError } = await supabaseAdmin
      .from("attendees")
      .select("id, name")
      .eq("phone", formattedPhone)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't find a registration with this phone number.",
        },
        { status: 404 }
      );
    }

    const { data: existingLog, error: existingError } = await supabaseAdmin
      .from("attendance_logs")
      .select("scan_time")
      .eq("attendee_id", attendee.id)
      .eq("day", tokenInfo.day)
      .eq("status", "present")
      .maybeSingle();

    if (existingError) {
      console.error("Token check fetch error:", existingError);
      return NextResponse.json(
        { success: false, error: "Unable to check attendance status." },
        { status: 500 }
      );
    }

    if (existingLog) {
      return NextResponse.json({
        success: true,
        day: tokenInfo.day,
        message: `Already checked in for ${getDayName(
          tokenInfo.day
        )} at ${new Date(existingLog.scan_time).toLocaleTimeString()}.`,
      });
    }

    const { error: logError } = await supabaseAdmin
      .from("attendance_logs")
      .insert({
        attendee_id: attendee.id,
        day: tokenInfo.day,
        status: "present",
        scanned_by: "daily-token",
      });

    if (logError) {
      console.error("Token check insert error:", logError);
      return NextResponse.json(
        { success: false, error: "Failed to record attendance." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      day: tokenInfo.day,
      message: `${attendee.name} checked in for ${getDayName(tokenInfo.day)}!`,
    });
  } catch (error) {
    console.error("Token check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process the QR code right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
