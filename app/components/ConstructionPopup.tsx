"use client";

import { useEffect, useMemo, useState } from "react";

export default function ConstructionPopup() {
  const targetDate = useMemo(() => new Date("2026-05-09T00:00:00"), []);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Testing Phase
            </p>
            <h2 className="mt-1 text-2xl font-bold">DormSweep is under construction</h2>
            <p className="mt-3 text-sm text-gray-600">
              We’re in the final stretch of building out the platform. Thanks for
              checking it out early.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg border px-3 py-1 text-sm font-medium"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Estimated launch countdown</p>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <TimeBox value={timeLeft.days} label="Days" />
            <TimeBox value={timeLeft.hours} label="Hours" />
            <TimeBox value={timeLeft.minutes} label="Minutes" />
            <TimeBox value={timeLeft.seconds} label="Seconds" />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Build progress</span>
            <span className="font-semibold text-gray-900">80%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-[80%] rounded-full bg-black" />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Core marketplace, images, school accounts, and payments are mostly in place.
          </p>
        </div>
      </div>
    </div>
  );
}

function TimeBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border bg-white px-2 py-3">
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function getTimeLeft(targetDate: Date) {
  const now = new Date().getTime();
  const distance = targetDate.getTime() - now;

  if (distance <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}