"use client";

import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/Card";
import Loader from "@/components/Loader";
import { confirmAttendanceByPhone } from "@/lib/client-utils";
import {
  formatDate,
  getCurrentDay,
  getDayDate,
  getDayName,
  getPastDays,
  isProgramStarted,
} from "@/lib/dates";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

interface AttendanceResult {
  success: boolean;
  attendee: {
    uid: string;
    name: string;
  };
  attendance: {
    day1: { day: number; status: string; scan_time: string } | null;
    day2: { day: number; status: string; scan_time: string } | null;
    day3: { day: number; status: string; scan_time: string } | null;
    day4: { day: number; status: string; scan_time: string } | null;
  };
  qr_image_urls: {
    day1: string;
    day2: string;
    day3: string;
    day4: string;
  };
}

export default function ConfirmPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState("");
  const [fullscreenQR, setFullscreenQR] = useState<string | null>(null);
  const [hasPhoneInStorage, setHasPhoneInStorage] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);

  const programStarted = isProgramStarted();
  const currentDay = getCurrentDay();
  const pastDays = getPastDays();

  const checkAttendance = React.useCallback(
    async (phoneNumber: string, saveToStorage = false) => {
      const digitsOnly = phoneNumber.replace(/\D/g, "");
      if (digitsOnly.length !== 11) {
        setError("Phone number must be exactly 11 digits");
        setLoading(false);
        setInitialCheck(false);
        return;
      }

      setLoading(true);
      setError("");
      setResult(null);

      try {
        const data = await confirmAttendanceByPhone(phoneNumber);
        setResult(data);
        if (saveToStorage) {
          localStorage.setItem("wrc_phone", digitsOnly);
        }
      } catch (error) {
        console.error("Confirm error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch attendance. Please try again.";
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
    if (programStarted) {
      const savedPhone = localStorage.getItem("wrc_phone");
      if (savedPhone) {
        setPhone(savedPhone);
        setHasPhoneInStorage(true);
        checkAttendance(savedPhone, false);
      } else {
        setLoading(false);
        setInitialCheck(false);
      }
    } else {
      setLoading(false);
      setInitialCheck(false);
    }
  }, [programStarted, checkAttendance]);

  React.useEffect(() => {
    return () => {
      setError("");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkAttendance(phone, true);
  };

  const isRegisteredForToday =
    currentDay !== null &&
    result?.attendance[`day${currentDay}` as keyof typeof result.attendance] !==
      null;

  if (!programStarted) {
    return (
      <BackgroundWrapper className="flex items-center justify-center py-12 px-4 md:block">
        <div className="max-w-2xl mx-auto flex justify-center md:block">
          <Card className="text-center w-full md:w-auto">
            <h1 className="text-3xl font-bold mb-4">Confirm Your Attendance</h1>
            <p className="text-gray-600 mb-6">
              WRC 2025 - Spirit Chapel International Church
            </p>
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">🎉 Get Ready!</h2>
              <p className="text-lg mb-2">
                The WRC 2025 program starts on{" "}
                <strong>{formatDate(getDayDate(1))}</strong>
              </p>
              <p className="text-lg mb-4">
                This is where you&apos;ll confirm your attendance each day!
              </p>
              <p className="text-base opacity-90">
                Simply enter your phone number when the program begins to see
                your attendance status and access your QR code for the day.
              </p>
            </div>
            <div className="text-gray-600 mb-6">
              <p className="font-semibold mb-2">Program Schedule:</p>
              <div className="space-y-1">
                <p>Day 1: {formatDate(getDayDate(1))}</p>
                <p>Day 2: {formatDate(getDayDate(2))}</p>
                <p>Day 3: {formatDate(getDayDate(3))}</p>
                <p>Day 4: {formatDate(getDayDate(4))}</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:underline inline-block"
            >
              ← Back to Home
            </Link>
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
            <h1 className="text-3xl font-bold mb-2">Confirm Your Attendance</h1>
            <p className="text-gray-600 mb-6">
              WRC 2025 - Spirit Chapel International Church
            </p>

            {(!hasPhoneInStorage || error) && !result && (
              <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  {loading ? "Checking..." : "Check Attendance"}
                </button>
              </form>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {result && (
              <div>
                <div className="mb-4">
                  <p className="text-lg font-semibold">
                    {result.attendee.name}
                  </p>
                  <p className="text-gray-600 text-sm">
                    UID: {result.attendee.uid}
                  </p>
                </div>

                {currentDay !== null && (
                  <div className="mb-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-purple-900 text-sm">
                            Today&apos;s QR Code
                          </h3>
                          <p className="text-xs text-gray-600">
                            {getDayName(currentDay)} -{" "}
                            {formatDate(getDayDate(currentDay))}
                          </p>
                        </div>
                        {isRegisteredForToday ? (
                          <span className="text-green-700 text-xs font-medium">
                            ✓ Registered
                          </span>
                        ) : (
                          <span className="text-orange-700 text-xs font-medium">
                            ⚠️ Not scanned
                          </span>
                        )}
                      </div>
                      <div className="flex justify-center mb-2">
                        <button
                          onClick={() =>
                            setFullscreenQR(
                              result.qr_image_urls[
                                `day${currentDay}` as keyof typeof result.qr_image_urls
                              ]
                            )
                          }
                          className="cursor-pointer"
                        >
                          <Image
                            src={
                              result.qr_image_urls[
                                `day${currentDay}` as keyof typeof result.qr_image_urls
                              ]
                            }
                            alt={`Day ${currentDay} QR Code`}
                            width={180}
                            height={180}
                            className="border rounded-lg shadow-md hover:shadow-lg transition"
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 text-center">
                        Tap to view full screen
                      </p>
                    </div>
                  </div>
                )}

                {pastDays.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Attendance Status:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pastDays.map((day) => {
                        const log =
                          result.attendance[
                            `day${day}` as keyof typeof result.attendance
                          ];
                        const isPresent = log !== null;

                        return (
                          <div
                            key={day}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
                            style={{
                              backgroundColor: isPresent
                                ? "#dcfce7"
                                : "#fee2e2",
                              borderColor: isPresent ? "#86efac" : "#fca5a5",
                            }}
                          >
                            <span
                              className={`text-sm ${
                                isPresent ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isPresent ? "✓" : "✗"}
                            </span>
                            <span className="text-gray-700 font-medium">
                              {getDayName(day)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isPresent
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-200 text-red-800"
                              }`}
                            >
                              {isPresent ? "Present" : "Absent"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setResult(null);
                    setPhone("");
                    setError("");
                    setHasPhoneInStorage(false);
                  }}
                  className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 mb-4 transition-all duration-300 ease-in-out"
                >
                  Check Another Number
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-purple-600 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </Card>
        </div>

        {fullscreenQR && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenQR(null)}
          >
            <div className="relative max-w-md w-full">
              <button
                onClick={() => setFullscreenQR(null)}
                className="absolute top-4 right-4 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl hover:bg-gray-200 z-10"
              >
                ×
              </button>
              <div className="bg-white rounded-lg p-6">
                <Image
                  src={fullscreenQR}
                  alt="QR Code Full Screen"
                  width={400}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        )}
      </BackgroundWrapper>
    </>
  );
}
