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
            Register for attendance and receive your personalized QR codes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Register Now
            </Link>
            <Link
              href="/retrieve"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Retrieve QR Codes
            </Link>
            <Link
              href="/confirm"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Confirm Attendance
            </Link>
            <Link
              href="/admin"
              className="px-8 py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Admin Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </BackgroundWrapper>
  );
}
