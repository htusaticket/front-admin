"use client";

import { AuthCarousel } from "@/components/auth/AuthCarousel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-white font-sans">
      {/* Left Panel - Carousel */}
      <AuthCarousel />

      {/* Right Panel - Content */}
      <div className="flex w-full flex-col justify-center overflow-y-auto bg-white px-8 py-12 lg:w-1/2 lg:px-24">
        {children}
      </div>
    </div>
  );
}
