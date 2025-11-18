import { supabaseAdmin } from "@/lib/supabase";
import { Buffer } from "buffer";
import QRCode from "qrcode";

export async function uploadQRCodeToStorage(
  uid: string,
  day: number,
  qrDataUrl: string
): Promise<string> {
  const bucket = "qr-codes";
  const filePath = `${uid}/day${day}.png`;

  const base64Data = qrDataUrl.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error("Failed to upload QR code");
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

export async function generateAndUploadQR(
  uid: string,
  day: number,
  qrSecret: string,
  verificationUrl: string
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 300,
    margin: 2,
  });
  return await uploadQRCodeToStorage(uid, day, qrDataUrl);
}
