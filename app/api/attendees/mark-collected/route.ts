import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { attendeeId, collected } = await request.json();

    if (!attendeeId) {
      return NextResponse.json(
        { success: false, error: "Attendee ID is required" },
        { status: 400 }
      );
    }

    const updateData: {
      voucher_collected: boolean;
      voucher_collected_at?: string | null;
    } = {
      voucher_collected: collected === true,
    };

    // Set collection timestamp if marking as collected, clear it if unmarking
    if (collected === true) {
      updateData.voucher_collected_at = new Date().toISOString();
    } else {
      updateData.voucher_collected_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from("attendees")
      .update(updateData)
      .eq("id", attendeeId)
      .select()
      .single();

    if (error) {
      console.error("Mark collected error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update voucher status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendee: data,
    });
  } catch (error) {
    console.error("Mark collected API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

