import { isDayReached } from "@/lib/dates";
import { verifyQRSignature } from "@/lib/qr";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = RATE_LIMIT.get(ip);

  if (!record || now > record.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, reason: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const day = parseInt(searchParams.get("day") || "0");
    const sig = searchParams.get("sig");
    const body = await request.json().catch(() => ({}));
    const scannedBy = body.scanned_by || "unknown";

    if (!uid || !day || !sig) {
      return NextResponse.json(
        { success: false, reason: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (day < 1 || day > 4) {
      return NextResponse.json(
        { success: false, reason: "Invalid day (must be 1-4)" },
        { status: 400 }
      );
    }

    if (!isDayReached(day)) {
      return NextResponse.json(
        {
          success: false,
          reason: `Day ${day} has not started yet. QR codes can only be scanned on their respective program day.`,
        },
        { status: 400 }
      );
    }

    const { data: attendee, error: attendeeError } = await supabaseAdmin
      .from("attendees")
      .select("id, name, qr_secret")
      .eq("uid", uid)
      .single();

    if (attendeeError || !attendee || !attendee.qr_secret) {
      return NextResponse.json(
        { success: false, reason: "Unregistered user" },
        { status: 404 }
      );
    }

    if (!verifyQRSignature(uid, day, sig, attendee.qr_secret)) {
      return NextResponse.json(
        { success: false, reason: "Invalid QR signature" },
        { status: 400 }
      );
    }

    const { data: existingLog } = await supabaseAdmin
      .from("attendance_logs")
      .select("scan_time")
      .eq("attendee_id", attendee.id)
      .eq("day", day)
      .eq("status", "present")
      .single();

    if (existingLog) {
      return NextResponse.json(
        {
          success: false,
          reason: "Already scanned",
          first_scan_time: existingLog.scan_time,
          message: `Already checked in on Day ${day} at ${new Date(
            existingLog.scan_time
          ).toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    const { data: log, error: logError } = await supabaseAdmin
      .from("attendance_logs")
      .insert({
        attendee_id: attendee.id,
        day,
        status: "present",
        scanned_by: scannedBy,
      })
      .select()
      .single();

    if (logError) {
      console.error("Log insert error:", logError);
      return NextResponse.json(
        { success: false, reason: "Failed to log attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${attendee.name} checked in for Day ${day}`,
      attendee_name: attendee.name,
      scan_time: log.scan_time,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, reason: "Internal server error" },
      { status: 500 }
    );
  }
}
