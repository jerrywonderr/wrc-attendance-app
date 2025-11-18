"use client";

import BackgroundWrapper from "@/components/BackgroundWrapper";
import Card from "@/components/Card";
import { registerAttendee } from "@/lib/client-utils";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const schema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
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

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const [registered, setRegistered] = React.useState(false);
  const [uid, setUid] = React.useState("");
  const [name, setName] = React.useState("");

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerAttendee(data);
      if (result.success) {
        const formattedPhone = data.phone.replace(/\D/g, "");
        localStorage.setItem("wrc_phone", formattedPhone);
        setUid(result.uid);
        setName(data.name);
        setRegistered(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      alert(message);
    }
  };

  if (registered) {
    return (
      <BackgroundWrapper className="flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto w-full flex justify-center">
          <Card className="w-full md:w-auto text-center">
            <h1 className="text-3xl font-bold mb-2">Registration Successful</h1>
            <p className="text-gray-600 mb-6">
              Thank you, {name}! Your UID is <strong>{uid}</strong>.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-700">
                Keep your registered phone number handy. Each day of WRC 2025,
                scan the official QR code displayed at the venue, and we&apos;ll
                automatically confirm your attendance.
              </p>
              {/* <p className="text-gray-700 mt-3">
                You can always head to the Confirm Attendance page to review
                your status.
              </p> */}
            </div>
            <div className="flex flex-col gap-3">
              {/* <Link
                href="/confirm"
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Go to Confirm Attendance
              </Link> */}
              <Link
                href="/"
                className="text-purple-600 hover:underline text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </Card>
        </div>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper className="py-12 px-4">
      <div className="max-w-2xl mx-auto flex justify-center md:block">
        <Card className="w-full md:w-auto">
          <h1 className="text-3xl font-bold mb-2">WRC 2025 Registration</h1>
          <p className="text-gray-600 mb-6">
            Spirit Chapel International Church
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                {...register("name")}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
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
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>
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
