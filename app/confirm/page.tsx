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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

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
}

export default function ConfirmPageWrapper() {
  return (
    <Suspense fallback={<Loader />}>
      <ConfirmPage />
    </Suspense>
  );
}

function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams?.get("token");

  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState<AttendanceResult | null>(null);
  const [error, setError] = React.useState("");
  const [hasPhoneInStorage, setHasPhoneInStorage] = React.useState(false);
  const [initialCheck, setInitialCheck] = React.useState(true);

  const [tokenMessage, setTokenMessage] = React.useState("");
  const [tokenFeedbackError, setTokenFeedbackError] = React.useState("");
  const [pendingToken, setPendingToken] = React.useState<string | null>(null);
  const [needsPhoneForToken, setNeedsPhoneForToken] = React.useState(false);
  const [tokenDay, setTokenDay] = React.useState<number | null>(null);
  const [tokenSubmitting, setTokenSubmitting] = React.useState(false);

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

  const handleTokenCheck = React.useCallback(
    async (tokenValue: string, phoneValue?: string, savePhone = false) => {
      setTokenSubmitting(true);
      try {
        const response = await fetch("/api/token-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokenValue, phone: phoneValue }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Unable to process QR code.");
        }

        if (data.requiresPhone) {
          setNeedsPhoneForToken(true);
          setTokenDay(data.day);
          return;
        }

        if (phoneValue && savePhone) {
          const digitsOnly = phoneValue.replace(/\D/g, "");
          localStorage.setItem("wrc_phone", digitsOnly);
        }

        const message = data.message || "Attendance confirmed.";
        router.replace(
          `/confirm?tokenStatus=success&message=${encodeURIComponent(message)}`
        );
      } catch (tokenError) {
        const errorMessage =
          tokenError instanceof Error
            ? tokenError.message
            : "Unable to process QR code.";
        router.replace(
          `/confirm?tokenStatus=error&message=${encodeURIComponent(
            errorMessage
          )}`
        );
      } finally {
        setTokenSubmitting(false);
      }
    },
    [router]
  );

  const feedbackStatus = searchParams?.get("tokenStatus");
  const feedbackMessage = searchParams?.get("message");

  React.useEffect(() => {
    if (!feedbackStatus || !feedbackMessage) return;
    if (feedbackStatus === "success") {
      setTokenMessage(feedbackMessage);
      setTokenFeedbackError("");
    } else {
      setTokenFeedbackError(feedbackMessage);
      setTokenMessage("");
    }
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("tokenStatus");
    params.delete("message");
    const query = params.toString();
    router.replace(query ? `/confirm?${query}` : "/confirm");
  }, [feedbackStatus, feedbackMessage, router, searchParams]);

  React.useEffect(() => {
    if (tokenParam) {
      setPendingToken(tokenParam);
      setTokenFeedbackError("");
      setTokenMessage("");
      const savedPhone = localStorage.getItem("wrc_phone");
      if (savedPhone) {
        setPhone(savedPhone);
        setHasPhoneInStorage(true);
        handleTokenCheck(tokenParam, savedPhone, false);
      } else {
        handleTokenCheck(tokenParam);
      }
    } else {
      setPendingToken(null);
      setNeedsPhoneForToken(false);
      setTokenDay(null);
    }
  }, [tokenParam, handleTokenCheck]);

  React.useEffect(() => {
    if (programStarted) {
      const savedPhone = localStorage.getItem("wrc_phone");
      if (savedPhone && !tokenParam) {
        setPhone(savedPhone);
        setHasPhoneInStorage(true);
        checkAttendance(savedPhone, false);
      } else if (!savedPhone) {
        setLoading(false);
        setInitialCheck(false);
      }
    } else {
      setLoading(false);
      setInitialCheck(false);
    }
  }, [programStarted, checkAttendance, tokenParam]);

  React.useEffect(() => {
    return () => {
      setError("");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenMessage("");
    setTokenFeedbackError("");
    await checkAttendance(phone, true);
  };

  const handleTokenPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    await handleTokenCheck(pendingToken, phone, true);
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
                Scan the daily QR code at the venue to check yourself in.
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
              className="text-purple-600 hover:underline inline-block"
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
    <BackgroundWrapper className="flex items-center justify-center py-12 px-4 md:block">
      <div className="max-w-2xl mx-auto flex justify-center md:block">
        <Card className="w-full md:w-auto">
          <h1 className="text-3xl font-bold mb-2">Confirm Your Attendance</h1>
          <p className="text-gray-600 mb-6">
            WRC 2025 - Spirit Chapel International Church
          </p>

          {tokenMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {tokenMessage}
            </div>
          )}

          {tokenFeedbackError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {tokenFeedbackError}
            </div>
          )}

          {needsPhoneForToken && pendingToken && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-900">
                {tokenDay
                  ? `Almost there! Enter your phone number to confirm attendance for ${getDayName(
                      tokenDay
                    )}.`
                  : "Almost there! Enter your phone number to confirm attendance."}
              </p>
            </div>
          )}

          {needsPhoneForToken && pendingToken && (
            <form onSubmit={handleTokenPhoneSubmit} className="mb-6 space-y-4">
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
                disabled={tokenSubmitting}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 ease-in-out"
              >
                {tokenSubmitting ? "Checking..." : "Confirm Attendance"}
              </button>
            </form>
          )}

          {!needsPhoneForToken && (!hasPhoneInStorage || error) && !result && (
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
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 ease-in-out"
              >
                {loading ? "Checking..." : "Check Attendance"}
              </button>
            </form>
          )}

          {error && !needsPhoneForToken && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {result && (
            <div>
              <div className="mb-4">
                <p className="text-lg font-semibold">{result.attendee.name}</p>
                <p className="text-gray-600 text-sm">
                  UID: {result.attendee.uid}
                </p>
              </div>

              {currentDay !== null && (
                <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-1">
                    {getDayName(currentDay)} —{" "}
                    {formatDate(getDayDate(currentDay))}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      isRegisteredForToday
                        ? "text-green-700"
                        : "text-orange-700"
                    }`}
                  >
                    {isRegisteredForToday
                      ? "You are checked in for today."
                      : "You have not checked in yet today."}
                  </p>
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
                            backgroundColor: isPresent ? "#dcfce7" : "#fee2e2",
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
                  setTokenMessage("");
                  setTokenFeedbackError("");
                  setHasPhoneInStorage(false);
                  router.replace("/confirm");
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
    </BackgroundWrapper>
  );
}
