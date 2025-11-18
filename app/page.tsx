import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/Card";
import Link from "next/link";

export default function Home() {
  return (
    <BackgroundWrapper className="flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto w-full flex justify-center">
        <Card className="text-center w-full md:w-auto animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            WRC 2025 Attendance
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Spirit Chapel International Church
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Register once, then simply scan the official daily QR code at the
            venue to confirm your attendance.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href="/register"
              className="w-full px-8 py-4 rounded-lg font-bold text-lg hover:scale-105 transition-transform duration-300 ease-in-out text-center flex items-center justify-center shadow-lg animate-pulse-slow md:text-xl"
              style={{ color: "white" }}
            >
              Register Now
            </Link>
            <Link
              href="/confirm"
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Confirm Attendance
            </Link>
            {/* <Link
              href="/admin"
              className="w-full px-8 py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Admin Dashboard
            </Link> */}
          </div>
        </Card>
      </div>
    </BackgroundWrapper>
  );
}
