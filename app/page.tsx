import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h1 className="text-5xl font-bold mb-6">WRC 2025 Attendance</h1>
        <p className="text-xl text-gray-600 mb-6">
          Spirit Chapel International Church
        </p>
        <p className="text-lg text-gray-500 mb-12">
          Register for attendance and receive your personalized QR codes
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            Register Now
          </Link>
          <Link
            href="/retrieve"
            className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition"
          >
            Retrieve QR Codes
          </Link>
          <Link
            href="/confirm"
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition"
          >
            Confirm Attendance
          </Link>
          <Link
            href="/admin"
            className="px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
