"use client";

import { formatDate, getDayDate, getDayName } from "@/lib/dates";
import { useCallback, useEffect, useState } from "react";

interface Summary {
  total_registered: number;
  day1_count: number;
  day2_count: number;
  day3_count: number;
  day4_count: number;
}

interface Attendee {
  id: string;
  uid: string;
  name: string;
  phone: string;
  voucher_collected?: boolean;
  voucher_collected_at?: string | null;
  attendance?: {
    day1: boolean;
    day2: boolean;
    day3: boolean;
    day4: boolean;
  };
}

interface DayToken {
  day: number;
  hasToken: boolean;
  envKey: string;
  token: string | null;
}

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterDays, setFilterDays] = useState<number[]>([]);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [dayTokens, setDayTokens] = useState<DayToken[]>([]);
  const [copiedDay, setCopiedDay] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "authenticated") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
      fetchDayTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const fetchDayTokens = async () => {
    try {
      const response = await fetch("/api/admin/day-links");
      const data = await response.json();
      if (data.success) {
        setDayTokens(data.dayTokens);
      }
    } catch (error) {
      console.error("Failed to fetch day tokens:", error);
    }
  };

  const copyToClipboard = (text: string, day: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDay(day);
      setTimeout(() => setCopiedDay(null), 2000);
    });
  };

  const generateDayLink = (day: number, token: string | null): string => {
    if (!token) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/confirm?token=${encodeURIComponent(token)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("admin_auth", "authenticated");
        setAuthenticated(true);
        fetchData();
      } else {
        alert(data.reason || "Invalid password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to authenticate. Please try again.");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, attendeesRes] = await Promise.all([
        fetch("/api/attendance/summary"),
        fetch(
          `/api/attendees?page=${page}&limit=50&search=${encodeURIComponent(
            search
          )}&days=${filterDays.join(",")}`
        ),
      ]);

      const summaryData = await summaryRes.json();
      const attendeesData = await attendeesRes.json();

      if (summaryData.success) setSummary(summaryData.summary);
      if (attendeesData.success) {
        setAttendees(attendeesData.attendees);
        if (attendeesData.pagination) {
          setTotalCount(attendeesData.pagination.total || 0);
          setTotalPages(attendeesData.pagination.total_pages || 0);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDays]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    if (authenticated) {
      setPage(1);
    }
  }, [filterDays, search, authenticated]);

  // Fetch data when page, search, filterDays, or authentication changes
  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

  const toggleDayFilter = (day: number) => {
    setFilterDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort((a, b) => a - b);
      }
    });
  };

  const markAsCollected = async (attendeeId: string, collected: boolean) => {
    try {
      const response = await fetch("/api/attendees/mark-collected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendeeId, collected }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the attendee in the local state
        setAttendees((prev) =>
          prev.map((attendee) =>
            attendee.id === attendeeId
              ? {
                  ...attendee,
                  voucher_collected: data.attendee.voucher_collected,
                  voucher_collected_at: data.attendee.voucher_collected_at,
                }
              : attendee
          )
        );
      } else {
        alert(data.error || "Failed to update voucher status");
      }
    } catch (error) {
      console.error("Mark collected error:", error);
      alert("Failed to update voucher status. Please try again.");
    }
  };

  const exportCSV = () => {
    const headers = ["UID", "Name", "Phone", "Day1", "Day2", "Day3", "Day4"];
    const rows = attendees.map((a) => [
      a.uid,
      a.name,
      a.phone,
      a.attendance?.day1 ? "Yes" : "No",
      a.attendance?.day2 ? "Yes" : "No",
      a.attendance?.day3 ? "Yes" : "No",
      a.attendance?.day4 ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2">WRC 2025 Admin Login</h1>
          <p className="text-sm text-gray-600 mb-6">
            Spirit Chapel International Church
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">WRC 2025 Admin Dashboard</h1>
            <p className="text-gray-600">Spirit Chapel International Church</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              setAuthenticated(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Registered</p>
              <p className="text-3xl font-bold">{summary.total_registered}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Day 1</p>
              <p className="text-3xl font-bold">{summary.day1_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Day 2</p>
              <p className="text-3xl font-bold">{summary.day2_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Day 3</p>
              <p className="text-3xl font-bold">{summary.day3_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Day 4</p>
              <p className="text-3xl font-bold">{summary.day4_count}</p>
            </div>
          </div>
        )}

        {/* Day Links Generator Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Daily Venue QR Links</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate and copy links for each day&apos;s venue QR code. These
            links can be converted to QR codes for display at the venue.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayTokens.map((dayToken) => {
              const link = generateDayLink(dayToken.day, dayToken.token);
              const dayDate = getDayDate(dayToken.day);
              const dayName = getDayName(dayToken.day);

              return (
                <div
                  key={dayToken.day}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Day {dayToken.day} - {dayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(dayDate)}
                      </p>
                    </div>
                    {dayToken.hasToken ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Configured
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Missing Token
                      </span>
                    )}
                  </div>
                  {dayToken.hasToken && link ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={link}
                          className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono text-xs"
                        />
                        <button
                          onClick={() => copyToClipboard(link, dayToken.day)}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium whitespace-nowrap"
                        >
                          {copiedDay === dayToken.day ? "✓ Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Set {dayToken.envKey} environment variable
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠ {dayToken.envKey} is not configured. Set this
                        environment variable to generate the link.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-4">
            WRC 2025 - Spirit Chapel International Church
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filterDays.includes(day)}
                    onChange={() => toggleDayFilter(day)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="select-none">Day {day}</span>
                </label>
              ))}
            </div>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">UID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-center">Day1</th>
                    <th className="px-4 py-3 text-center">Day2</th>
                    <th className="px-4 py-3 text-center">Day3</th>
                    <th className="px-4 py-3 text-center">Day4</th>
                    <th className="px-4 py-3 text-center">Voucher</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.id} className="border-t">
                      <td className="px-4 py-3">{attendee.uid}</td>
                      <td className="px-4 py-3">{attendee.name}</td>
                      <td className="px-4 py-3">{attendee.phone}</td>
                      <td className="px-4 py-3 text-center">
                        {attendee.attendance?.day1 ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attendee.attendance?.day2 ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attendee.attendance?.day3 ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attendee.attendance?.day4 ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            markAsCollected(
                              attendee.id,
                              !attendee.voucher_collected
                            )
                          }
                          disabled={attendee.voucher_collected === true}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            attendee.voucher_collected
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {attendee.voucher_collected
                            ? "Collected"
                            : "Mark as Collected"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Total: {totalCount}</span>{" "}
                  attendee{totalCount !== 1 ? "s" : ""}
                  {filterDays.length > 0 && (
                    <span className="ml-2">
                      (filtered by Day{" "}
                      {filterDays.sort((a, b) => a - b).join(", ")})
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Showing {attendees.length > 0 ? (page - 1) * 50 + 1 : 0} -{" "}
                  {Math.min(page * 50, totalCount)} of {totalCount}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Previous
                </button>
                <span className="py-2 text-sm text-gray-700">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
