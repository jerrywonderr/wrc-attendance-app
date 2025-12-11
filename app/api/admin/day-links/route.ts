import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch day tokens for generating venue QR links
 *
 * Note: In production, you should add proper authentication middleware
 * to verify the user is an admin before returning tokens.
 * Currently, this endpoint is accessible to anyone who knows the URL.
 */
export async function GET(request: NextRequest) {
  try {
    const dayTokens = [
      {
        day: 1,
        token: process.env.DAY1_TOKEN || "",
        envKey: "DAY1_TOKEN",
      },
      {
        day: 2,
        token: process.env.DAY2_TOKEN || "",
        envKey: "DAY2_TOKEN",
      },
      {
        day: 3,
        token: process.env.DAY3_TOKEN || "",
        envKey: "DAY3_TOKEN",
      },
      {
        day: 4,
        token: process.env.DAY4_TOKEN || "",
        envKey: "DAY4_TOKEN",
      },
    ];

    return NextResponse.json({
      success: true,
      dayTokens: dayTokens.map((dt) => ({
        day: dt.day,
        hasToken: !!dt.token,
        envKey: dt.envKey,
        // Return token so admin can generate links
        // These tokens are meant to be public (displayed as QR codes at venue)
        token: dt.token || null,
      })),
    });
  } catch (error) {
    console.error("Day links API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
