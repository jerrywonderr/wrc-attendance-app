import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { count: totalRegistered } = await supabaseAdmin
      .from("attendees")
      .select("*", { count: "exact", head: true });

    const { count: day1Count } = await supabaseAdmin
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 1)
      .eq("status", "present");

    const { count: day2Count } = await supabaseAdmin
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 2)
      .eq("status", "present");

    const { count: day3Count } = await supabaseAdmin
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 3)
      .eq("status", "present");

    const { count: day4Count } = await supabaseAdmin
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 4)
      .eq("status", "present");

    return NextResponse.json({
      success: true,
      summary: {
        total_registered: totalRegistered || 0,
        day1_count: day1Count || 0,
        day2_count: day2Count || 0,
        day3_count: day3Count || 0,
        day4_count: day4Count || 0,
      },
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
