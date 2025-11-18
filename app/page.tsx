import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/Card";
import Link from "next/link";

export default function Home() {
  return (
    <BackgroundWrapper className="flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto w-full flex justify-center">
        <Card className="text-center w-full md:w-auto animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Get Your Gift Voucher
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Spirit Chapel International Church
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Register once, hold your voucher, and scan the daily QR code at the
            venue to confirm your presence and stay eligible for blessed gifts.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-left mb-6 shadow-inner">
            <p className="text-sm uppercase tracking-widest text-purple-700 font-semibold">
              Gift Voucher Highlights
            </p>
            <p className="text-gray-700 mt-2 text-sm">
              “Hold on to this Gift Voucher. You could be one of our blessed
              winners today! Because in this house, everyone goes home with
              something — tangible or divine!”
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-purple-800">Dates</p>
                <p>11th–14th Dec. 2025</p>
              </div>
              <div>
                <p className="font-semibold text-purple-800">Schedule</p>
                <p>Thu–Sat: 5 PM • Sun: 8 AM & 10 AM</p>
              </div>
              <div>
                <p className="font-semibold text-purple-800">Venue</p>
                <p>Miracle Tent, beside Havana Royale, beside First Bank, UI</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Terms and conditions apply.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              href="/register"
              className="w-full px-8 py-4 rounded-lg font-bold text-lg hover:scale-105 transition-transform duration-300 ease-in-out text-center flex items-center justify-center shadow-lg animate-pulse-slow md:text-xl"
              style={{ color: "white" }}
            >
              Register Now
            </Link>
            {/* <Link
              href="/confirm"
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-center flex items-center justify-center"
            >
              Confirm Attendance
            </Link> */}
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
