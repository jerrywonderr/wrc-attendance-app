import QRCode from "qrcode";

export async function uploadQRCodeToStorage(
  uid: string,
  day: number,
  qrDataUrl: string
): Promise<string> {
  const response = await fetch("/api/upload-qr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      day,
      qrDataUrl,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to upload QR code");
  }

  return data.publicUrl;
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
