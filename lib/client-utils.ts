import { generateQRSecret, generateQRURL } from "./qr";
import { generateAndUploadQR } from "./storage";
import { supabase } from "./supabase";
import { formatPhoneNumber, generateUID } from "./utils";

export async function registerAttendee(data: { name: string; phone: string }) {
  const { name, phone } = data;

  if (!name || !phone) {
    throw new Error("Name and phone are required");
  }

  const formattedPhone = formatPhoneNumber(phone);
  const uid = generateUID();
  const qrSecret = generateQRSecret();

  const qrUrls = {
    day1: generateQRURL(uid, 1, qrSecret),
    day2: generateQRURL(uid, 2, qrSecret),
    day3: generateQRURL(uid, 3, qrSecret),
    day4: generateQRURL(uid, 4, qrSecret),
  };

  const qrImageUrls = {
    day1: await generateAndUploadQR(uid, 1, qrSecret, qrUrls.day1),
    day2: await generateAndUploadQR(uid, 2, qrSecret, qrUrls.day2),
    day3: await generateAndUploadQR(uid, 3, qrSecret, qrUrls.day3),
    day4: await generateAndUploadQR(uid, 4, qrSecret, qrUrls.day4),
  };

  const { data: attendee, error } = await supabase
    .from("attendees")
    .insert({
      uid,
      name,
      phone: formattedPhone,
      qr_secret: qrSecret,
      qr_day1_url: qrUrls.day1,
      qr_day2_url: qrUrls.day2,
      qr_day3_url: qrUrls.day3,
      qr_day4_url: qrUrls.day4,
      qr_day1_image_url: qrImageUrls.day1,
      qr_day2_image_url: qrImageUrls.day2,
      qr_day3_image_url: qrImageUrls.day3,
      qr_day4_image_url: qrImageUrls.day4,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to register attendee: " + error.message);
  }

  return {
    success: true,
    uid,
    qr_urls: qrUrls,
    qr_image_urls: qrImageUrls,
    attendee,
  };
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
    .select("id, uid, name")
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
    day1: logs.find((l) => l.day === 1) || null,
    day2: logs.find((l) => l.day === 2) || null,
    day3: logs.find((l) => l.day === 3) || null,
    day4: logs.find((l) => l.day === 4) || null,
  };

  return {
    success: true,
    attendee: {
      uid: attendee.uid,
      name: attendee.name,
    },
    attendance,
  };
}
