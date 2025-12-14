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

    // If filterDays is specified, we need to filter attendees who have attendance for ALL selected days
    // We'll use a subquery approach: find attendee_ids that have attendance logs for all selected days
    let attendeeIds: string[] | null = null;

    if (filterDays.length > 0) {
      // For each selected day, get the set of attendee_ids who attended that day
      // Then find the intersection (attendees who attended ALL selected days)
      const dayAttendeeSets: Set<string>[] = [];

      for (const day of filterDays) {
        const { data: dayLogs, error: dayError } = await supabaseAdmin
          .from("attendance_logs")
          .select("attendee_id")
          .eq("day", day)
          .eq("status", "present");

        if (dayError) {
          console.error(`Error fetching logs for day ${day}:`, dayError);
          return NextResponse.json(
            { success: false, error: "Failed to fetch attendance data" },
            { status: 500 }
          );
        }

        dayAttendeeSets.push(
          new Set(dayLogs?.map((log) => log.attendee_id) || [])
        );
      }

      // Find intersection: attendees who appear in ALL day sets
      if (dayAttendeeSets.length > 0) {
        const firstSet = dayAttendeeSets[0];
        const intersection = Array.from(firstSet).filter((attendeeId) =>
          dayAttendeeSets.every((set) => set.has(attendeeId))
        );
        attendeeIds = intersection;
      } else {
        attendeeIds = [];
      }
    }

    // Build the base query
    let query = supabaseAdmin.from("attendees").select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply day filter: only include attendees who have attendance for ALL selected days
    if (attendeeIds !== null) {
      if (attendeeIds.length === 0) {
        // No attendees match the filter, return empty result
        return NextResponse.json({
          success: true,
          attendees: [],
          pagination: {
            page,
            limit,
            total: 0,
            total_pages: 0,
          },
        });
      }
      query = query.in("id", attendeeIds);
    }

    // Execute query with pagination
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

    // Fetch attendance data only for the returned attendees (optimization)
    const attendeeIdList = attendees?.map((a) => a.id) || [];
    const attendanceMap = new Map<string, Set<number>>();

    if (attendeeIdList.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from("attendance_logs")
        .select("attendee_id, day")
        .eq("status", "present")
        .in("attendee_id", attendeeIdList);

      logs?.forEach((log) => {
        if (!attendanceMap.has(log.attendee_id)) {
          attendanceMap.set(log.attendee_id, new Set());
        }
        attendanceMap.get(log.attendee_id)!.add(log.day);
      });
    }

    // Add attendance data to each attendee
    const attendeesWithAttendance = (attendees || []).map((attendee) => ({
      ...attendee,
      attendance: {
        day1: attendanceMap.get(attendee.id)?.has(1) || false,
        day2: attendanceMap.get(attendee.id)?.has(2) || false,
        day3: attendanceMap.get(attendee.id)?.has(3) || false,
        day4: attendanceMap.get(attendee.id)?.has(4) || false,
      },
    }));

    // Calculate correct total count for filtered results
    const totalCount = count || 0;

    return NextResponse.json({
      success: true,
      attendees: attendeesWithAttendance,
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit),
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
