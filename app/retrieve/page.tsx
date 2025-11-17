"use client";

import { retrieveQRCodesByPhone } from "@/lib/client-utils";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object({
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9+\-\s()]+$/, "Invalid phone number format")
    .test("length", "Phone number must be exactly 11 digits", (value) => {
      if (!value) return false;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length === 11;
    }),
});

type FormData = yup.InferType<typeof schema>;

interface QRData {
  day1: string;
  day2: string;
  day3: string;
  day4: string;
}

export default function RetrievePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const [retrieved, setRetrieved] = React.useState(false);
  const [qrImageUrls, setQrImageUrls] = React.useState<QRData | null>(null);
  const [uid, setUid] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const result = await retrieveQRCodesByPhone(data.phone);

      if (result.success) {
        setUid(result.uid);
        setName(result.name);
        setQrImageUrls(result.qr_image_urls);
        setRetrieved(true);
      }
    } catch (error) {
      console.error("Retrieve error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve QR codes. Please try again.";
      setError(message);
    }
  };

  const downloadQR = (day: number, imageUrl: string) => {
    const link = document.createElement("a");
    link.download = `wrc2025-day${day}-${uid}.png`;
    link.href = imageUrl;
    link.click();
  };

  const shareWhatsApp = async (day: number, imageUrl: string) => {
    const text = `WRC 2025 Day ${day} QR Code\n\nYour QR code image: ${imageUrl}\n\nPlease save this QR code and present it at the venue on Day ${day}.\n\nWRC 2025 - Spirit Chapel International Church`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareAllWhatsApp = async () => {
    if (!qrImageUrls) return;
    const text = `WRC 2025 Attendance QR Codes\n\nYour UID: ${uid}\n\nDay 1: ${qrImageUrls.day1}\nDay 2: ${qrImageUrls.day2}\nDay 3: ${qrImageUrls.day3}\nDay 4: ${qrImageUrls.day4}\n\nPlease save these QR codes and present them at the venue for each day.\n\nWRC 2025 - Spirit Chapel International Church`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const downloadAll = () => {
    if (!qrImageUrls) return;
    [1, 2, 3, 4].forEach((day) => {
      setTimeout(() => {
        downloadQR(day, qrImageUrls[`day${day}` as keyof QRData]);
      }, day * 200);
    });
  };

  if (retrieved && qrImageUrls) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Your QR Codes</h1>
            <p className="text-gray-600 mb-4">
              WRC 2025 - Spirit Chapel International Church
            </p>
            <p className="text-gray-600 mb-4">
              Name: <strong>{name}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Your UID: <strong>{uid}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Please save these QR codes for each day:
            </p>

            <div className="flex gap-2 justify-center mb-6">
              <button
                onClick={downloadAll}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Download All QR Codes
              </button>
              <button
                onClick={shareAllWhatsApp}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Share All via WhatsApp
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[1, 2, 3, 4].map((day) => (
                <div key={day} className="border rounded-lg p-4 text-center">
                  <h3 className="text-xl font-semibold mb-4">Day {day}</h3>
                  <div className="mb-4 flex justify-center">
                    <Image
                      src={qrImageUrls[`day${day}` as keyof QRData]}
                      alt={`Day ${day} QR Code`}
                      width={200}
                      height={200}
                      className="border rounded"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() =>
                        downloadQR(
                          day,
                          qrImageUrls[`day${day}` as keyof QRData]
                        )
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                    <button
                      onClick={() =>
                        shareWhatsApp(
                          day,
                          qrImageUrls[`day${day}` as keyof QRData]
                        )
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Share WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Retrieve Your QR Codes</h1>
          <p className="text-gray-600 mb-6">
            WRC 2025 - Spirit Chapel International Church
          </p>
          <p className="text-gray-500 mb-6">
            Enter your phone number to retrieve your QR codes
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register("phone")}
                placeholder="e.g., 08012345678"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Retrieving..." : "Retrieve QR Codes"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
