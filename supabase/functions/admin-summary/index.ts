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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { count: totalRegistered } = await supabaseClient
      .from("attendees")
      .select("*", { count: "exact", head: true });

    const { count: day1Count } = await supabaseClient
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 1)
      .eq("status", "present");

    const { count: day2Count } = await supabaseClient
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 2)
      .eq("status", "present");

    const { count: day3Count } = await supabaseClient
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 3)
      .eq("status", "present");

    const { count: day4Count } = await supabaseClient
      .from("attendance_logs")
      .select("*", { count: "exact", head: true })
      .eq("day", 4)
      .eq("status", "present");

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_registered: totalRegistered || 0,
          day1_count: day1Count || 0,
          day2_count: day2Count || 0,
          day3_count: day3Count || 0,
          day4_count: day4Count || 0,
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
