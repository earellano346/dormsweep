import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import ConstructionPopup from "./components/ConstructionPopup";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "DormSweep",
  description: "Student dorm marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#f7f7f7] text-black`}
      >
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Background glow shapes */}
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute -left-32 top-40 h-[420px] w-[420px] rounded-full bg-red-200/40 blur-3xl" />
            <div className="absolute -right-32 bottom-16 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-yellow-100/30 blur-3xl" />
          </div>

          {/* Decorative lines */}
          <div className="pointer-events-none fixed inset-0 z-0 opacity-50">
            <svg
              className="absolute left-0 top-1/3 h-[420px] w-[320px]"
              viewBox="0 0 320 420"
              fill="none"
            >
              <path
                d="M10 20C90 10 120 50 140 100C155 140 190 150 290 145"
                stroke="#f08f8f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M0 215C80 225 95 200 130 170C180 125 235 135 315 110"
                stroke="#6fa3df"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M45 300C120 300 150 320 175 350C200 380 230 390 315 405"
                stroke="#f08f8f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M60 350C125 360 145 372 170 402"
                stroke="#6fa3df"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            <svg
              className="absolute bottom-10 right-0 h-[430px] w-[340px]"
              viewBox="0 0 340 430"
              fill="none"
            >
              <path
                d="M70 20C160 30 180 85 160 150C145 205 180 250 310 330"
                stroke="#f08f8f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M25 155C110 210 145 250 210 265C255 275 285 320 338 420"
                stroke="#6fa3df"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M0 330C110 270 170 255 225 200C270 155 300 120 338 110"
                stroke="#f08f8f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M120 390C180 330 225 315 338 305"
                stroke="#6fa3df"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <ConstructionPopup />
            <NavBar />
            <div className="mx-auto max-w-5xl px-6 py-6">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}