"use client";

import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/Card";
import Loader from "@/components/Loader";
import { retrieveQRCodesByPhone } from "@/lib/client-utils";
import { yupResolver } from "@hookform/resolvers/yup";
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
  const [hasPhoneInStorage, setHasPhoneInStorage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [initialCheck, setInitialCheck] = React.useState(true);

  const retrieveQR = React.useCallback(
    async (phoneNumber: string, saveToStorage = false) => {
      setError("");
      setLoading(true);
      try {
        const result = await retrieveQRCodesByPhone(phoneNumber);

        if (result.success) {
          setUid(result.uid);
          setName(result.name);
          setQrImageUrls(result.qr_image_urls);
          setRetrieved(true);
          if (saveToStorage) {
            const formattedPhone = phoneNumber.replace(/\D/g, "");
            localStorage.setItem("wrc_phone", formattedPhone);
          }
        }
      } catch (error) {
        console.error("Retrieve error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to retrieve QR codes. Please try again.";
        setError(message);
        setHasPhoneInStorage(false);
      } finally {
        setLoading(false);
        setInitialCheck(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const savedPhone = localStorage.getItem("wrc_phone");
    if (savedPhone) {
      setHasPhoneInStorage(true);
      retrieveQR(savedPhone, false);
    } else {
      setLoading(false);
      setInitialCheck(false);
    }
  }, [retrieveQR]);

  React.useEffect(() => {
    return () => {
      setError("");
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    await retrieveQR(data.phone, true);
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
      <BackgroundWrapper className="flex items-center justify-center py-12 px-4 md:block">
        <div className="max-w-2xl mx-auto flex justify-center md:block">
          <Card className="w-full md:w-auto">
            <h1 className="text-3xl font-bold mb-2">Your QR Codes</h1>
            <p className="text-gray-600 mb-4">
              WRC 2025 - Spirit Chapel International Church
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Name:</span> {name}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">UID:</span> {uid}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Download or Share All QR Codes
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 gap-y-3 mb-6">
                <button
                  onClick={downloadAll}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>Download All QR Codes</span>
                </button>
                <button
                  onClick={shareAllWhatsApp}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  <span>Share All via WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Individual QR Codes
              </h3>
              <div className="space-y-3 gap-y-3">
                {[1, 2, 3, 4].map((day) => (
                  <div
                    key={day}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-semibold text-purple-700">
                        {day}
                      </div>
                      <span className="font-medium text-gray-700">
                        Day {day}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          downloadQR(
                            day,
                            qrImageUrls[`day${day}` as keyof QRData]
                          )
                        }
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm font-semibold"
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
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm font-semibold"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setRetrieved(false);
                setQrImageUrls(null);
                setUid("");
                setName("");
                setError("");
                setHasPhoneInStorage(false);
              }}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 mb-4"
            >
              Check Another Number
            </button>

            <div className="text-center">
              <Link href="/" className="text-purple-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </Card>
        </div>
      </BackgroundWrapper>
    );
  }

  if (initialCheck || loading) {
    return <Loader />;
  }

  return (
    <>
      <BackgroundWrapper className="flex items-center justify-center py-12 px-4 md:block">
        <div className="max-w-2xl mx-auto flex justify-center md:block">
          <Card className="w-full md:w-auto">
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

            {(!hasPhoneInStorage || error) && !retrieved && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    placeholder="e.g., 08012345678"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Retrieving..." : "Retrieve QR Codes"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-purple-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </Card>
        </div>
      </BackgroundWrapper>
    </>
  );
}
