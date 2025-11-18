import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");

    if (!daysParam) {
      return NextResponse.json(
        { success: false, error: "days parameter is required" },
        { status: 400 }
      );
    }

    const days = daysParam
      .split(",")
      .map(Number)
      .filter((d) => d >= 1 && d <= 4);

    if (days.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid days parameter" },
        { status: 400 }
      );
    }

    const { data: logs } = await supabaseAdmin
      .from("attendance_logs")
      .select("attendee_id, day")
      .in("day", days)
      .eq("status", "present");

    const attendeeDayCounts = new Map<string, Set<number>>();
    logs?.forEach((log) => {
      if (!attendeeDayCounts.has(log.attendee_id)) {
        attendeeDayCounts.set(log.attendee_id, new Set());
      }
      attendeeDayCounts.get(log.attendee_id)!.add(log.day);
    });

    const matchingAttendeeIds = Array.from(attendeeDayCounts.entries())
      .filter(([, daySet]) => daySet.size === days.length)
      .map(([attendeeId]) => attendeeId);

    if (matchingAttendeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        attendees: [],
      });
    }

    const { data: attendees, error } = await supabaseAdmin
      .from("attendees")
      .select("*")
      .in("id", matchingAttendeeIds);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch attendees" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendees: attendees || [],
      days,
      count: attendees?.length || 0,
    });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
