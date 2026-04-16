import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import ConstructionPopup from "./components/ConstructionPopup";
import Link from "next/link";

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
  icons: {
    icon: "/favicon.ico", // 👈 THIS IS THE FIX
  },
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
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute -left-32 top-40 h-[420px] w-[420px] rounded-full bg-red-200/40 blur-3xl" />
            <div className="absolute -right-32 bottom-16 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-yellow-100/30 blur-3xl" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col">
            <ConstructionPopup />
            <NavBar />

            <div className="mx-auto max-w-5xl flex-1 px-6 py-6">
              {children}
            </div>

            <footer className="mt-10 border-t border-gray-200 bg-white/70 backdrop-blur-md">
              <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-600">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-800">© 2026 DormSweep</p>
                    <p className="mt-1">
                      DormSweep connects students and is not responsible for
                      transactions, item quality, or meetups between users.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link href="/terms" className="hover:text-black">
                      Terms
                    </Link>
                    <Link href="/privacy" className="hover:text-black">
                      Privacy
                    </Link>
                    <a
                      href="mailto:support@dormsweepco.com"
                      className="hover:text-black"
                    >
                      support@dormsweepco.com
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}