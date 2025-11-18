import { supabase } from "./supabase";
import { formatPhoneNumber } from "./utils";

export async function registerAttendee(data: { name: string; phone: string }) {
  const response = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Registration failed");
  }

  return result;
}

export async function retrieveQRCodesByPhone(phone: string) {
  const formattedPhone = formatPhoneNumber(phone);

  const { data: attendee, error: attendeeError } = await supabase
    .from("attendees")
    .select("uid, name, qr_day1_image_url, qr_day2_image_url, qr_day3_image_url, qr_day4_image_url")
    .eq("phone", formattedPhone)
    .single();

  if (attendeeError || !attendee) {
    throw new Error("No attendee found with this phone number");
  }

  if (!attendee.qr_day1_image_url || !attendee.qr_day2_image_url || !attendee.qr_day3_image_url || !attendee.qr_day4_image_url) {
    throw new Error("QR codes not found. Please contact support.");
  }

  return {
    success: true,
    uid: attendee.uid,
    name: attendee.name,
    qr_image_urls: {
      day1: attendee.qr_day1_image_url,
      day2: attendee.qr_day2_image_url,
      day3: attendee.qr_day3_image_url,
      day4: attendee.qr_day4_image_url,
    },
  };
}

export async function confirmAttendanceByPhone(phone: string) {
  const formattedPhone = formatPhoneNumber(phone);

  const { data: attendee, error: attendeeError } = await supabase
    .from("attendees")
    .select("id, uid, name, qr_day1_image_url, qr_day2_image_url, qr_day3_image_url, qr_day4_image_url")
    .eq("phone", formattedPhone)
    .single();

  if (attendeeError || !attendee) {
    throw new Error("No attendee found with this phone number");
  }

  const { data: logs, error: logsError } = await supabase
    .from("attendance_logs")
    .select("day, status, scan_time")
    .eq("attendee_id", attendee.id)
    .eq("status", "present")
    .order("day");

  if (logsError) {
    throw new Error("Failed to fetch attendance");
  }

  const attendance = {
    day1: logs.find((l: { day: number }) => l.day === 1) || null,
    day2: logs.find((l: { day: number }) => l.day === 2) || null,
    day3: logs.find((l: { day: number }) => l.day === 3) || null,
    day4: logs.find((l: { day: number }) => l.day === 4) || null,
  };

  return {
    success: true,
    attendee: {
      uid: attendee.uid,
      name: attendee.name,
    },
    attendance,
    qr_image_urls: {
      day1: attendee.qr_day1_image_url,
      day2: attendee.qr_day2_image_url,
      day3: attendee.qr_day3_image_url,
      day4: attendee.qr_day4_image_url,
    },
  };
}
