export function generateUID(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WRC${timestamp}${random}`.substring(0, 10);
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}
