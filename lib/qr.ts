import crypto from "crypto";

const QR_SECRET = process.env.QR_SIGNATURE_SECRET || "change-me-in-production";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function generateQRSignature(
  uid: string,
  day: number,
  qrSecret: string
): string {
  const payload = `${uid}:${day}:${qrSecret}`;
  return crypto.createHmac("sha256", QR_SECRET).update(payload).digest("hex");
}

export function verifyQRSignature(
  uid: string,
  day: number,
  sig: string,
  qrSecret: string
): boolean {
  const payload = `${uid}:${day}:${qrSecret}`;
  const expectedSig = crypto
    .createHmac("sha256", QR_SECRET)
    .update(payload)
    .digest("hex");
  return expectedSig === sig;
}

export function generateQRURL(
  uid: string,
  day: number,
  qrSecret: string
): string {
  const sig = generateQRSignature(uid, day, qrSecret);
  return `${APP_URL}/api/verify?uid=${uid}&day=${day}&sig=${sig}`;
}

export function generateQRSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
