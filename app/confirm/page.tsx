"use client";

import { confirmAttendanceByPhone } from "@/lib/client-utils";
import Link from "next/link";
import { useState } from "react";

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

export default function ConfirmPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 11) {
      setError("Phone number must be exactly 11 digits");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await confirmAttendanceByPhone(phone);
      setResult(data);
    } catch (error) {
      console.error("Confirm error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch attendance. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Confirm Your Attendance</h1>
          <p className="text-gray-600 mb-6">
            WRC 2025 - Spirit Chapel International Church
          </p>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Check"}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {result && (
            <div>
              <div className="mb-4">
                <p className="text-lg font-semibold">{result.attendee.name}</p>
                <p className="text-gray-600">UID: {result.attendee.uid}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Day</th>
                      <th className="border px-4 py-2 text-left">Status</th>
                      <th className="border px-4 py-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((day) => {
                      const log =
                        result.attendance[
                          `day${day}` as keyof typeof result.attendance
                        ];
                      return (
                        <tr key={day}>
                          <td className="border px-4 py-2">Day {day}</td>
                          <td className="border px-4 py-2">
                            {log ? (
                              <span className="text-green-600 font-semibold">
                                ✓ Present
                              </span>
                            ) : (
                              <span className="text-gray-400">Absent</span>
                            )}
                          </td>
                          <td className="border px-4 py-2">
                            {log
                              ? new Date(log.scan_time).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
