import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const filterDays =
      searchParams
        .get("days")
        ?.split(",")
        .map(Number)
        .filter((d) => d >= 1 && d <= 4) || [];

    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from("attendees").select("*", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const {
      data: attendees,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch attendees" },
        { status: 500 }
      );
    }

    const { data: allLogs } = await supabaseAdmin
      .from("attendance_logs")
      .select("attendee_id, day")
      .eq("status", "present");

    const attendanceMap = new Map<string, Set<number>>();
    allLogs?.forEach((log) => {
      if (!attendanceMap.has(log.attendee_id)) {
        attendanceMap.set(log.attendee_id, new Set());
      }
      attendanceMap.get(log.attendee_id)!.add(log.day);
    });

    let filteredAttendees = attendees || [];

    if (filterDays.length > 0) {
      filteredAttendees = filteredAttendees.filter((attendee) => {
        const attendeeDays = attendanceMap.get(attendee.id) || new Set();
        return filterDays.every((day) => attendeeDays.has(day));
      });
    }

    const attendeesWithAttendance = filteredAttendees.map((attendee) => ({
      ...attendee,
      attendance: {
        day1: attendanceMap.get(attendee.id)?.has(1) || false,
        day2: attendanceMap.get(attendee.id)?.has(2) || false,
        day3: attendanceMap.get(attendee.id)?.has(3) || false,
        day4: attendanceMap.get(attendee.id)?.has(4) || false,
      },
    }));

    return NextResponse.json({
      success: true,
      attendees: attendeesWithAttendance,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Attendees list error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
