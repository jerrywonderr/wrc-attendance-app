import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const filterDays =
      url.searchParams
        .get("days")
        ?.split(",")
        .map(Number)
        .filter((d) => d >= 1 && d <= 4) || [];

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const offset = (page - 1) * limit;

    let query = supabaseClient
      .from("attendees")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const {
      data: attendees,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error("Failed to fetch attendees");
    }

    const { data: allLogs } = await supabaseClient
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

    return new Response(
      JSON.stringify({
        success: true,
        attendees: attendeesWithAttendance,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
