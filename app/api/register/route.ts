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
            "This phone number is already registered. Please use a different phone number or head to the Confirm Attendance page to check your status.",
        },
        { status: 400 }
      );
    }

    const uid = generateUID();

    const { data: attendee, error } = await supabaseAdmin
      .from("attendees")
      .insert({
        uid,
        name,
        phone: formattedPhone,
      })
      .select()
      .single();

    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to register attendee: " + error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uid,
      attendee,
    });
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
