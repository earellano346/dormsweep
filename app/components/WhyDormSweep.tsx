"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, School, DollarSign, CircleHelp, X } from "lucide-react";

type CardKey = "campus" | "safety" | "pricing" | "how";

const cardData: Record<
  CardKey,
  {
    title: string;
    short: string;
    full: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  campus: {
    title: "Campus Only",
    short:
      "Only students with verified school emails can access their campus marketplace.",
    full:
      "DormSweep is built for college students, not random strangers online. When someone signs up with their school email, they get placed into their campus marketplace so the people buying and selling are actually part of that school community. That makes the whole experience feel more local, faster, and more reliable than posting on random public apps.",
    icon: School,
  },
  safety: {
    title: "Safe & Trusted",
    short:
      "Buy and sell within your college community with easier, more trusted meetups.",
    full:
      "DormSweep keeps things centered around your campus community, which helps make buying and selling feel safer and more comfortable. Instead of dealing with people from anywhere, students are interacting with other verified students from their own school. That makes meetups easier, lowers risk, and helps build trust throughout the platform.",
    icon: ShieldCheck,
  },
  pricing: {
    title: "Affordable Prices",
    short:
      "DormSweep is built to keep student prices fair and lower than retail.",
    full:
      "DormSweep is meant to help students save money, not overpay for basic dorm stuff. Since listings come from other students who no longer need their items, buyers can usually find better deals than buying new. To help keep things fair, DormSweep can guide sellers with suggested price ranges and warn them when a price looks too high compared to similar items.",
    icon: DollarSign,
  },
  how: {
    title: "How It Works",
    short:
      "List items, browse your campus, and connect locally without dealing with shipping.",
    full:
      "Students can post items they no longer need, browse listings from their own campus, and connect with other students nearby. That means no waiting on shipping, no paying full store prices, and no wasting time searching all over different apps. DormSweep keeps the process simple so students can buy and sell the stuff they actually need for dorm life.",
    icon: CircleHelp,
  },
};

export default function WhyDormSweep() {
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveCard(null);
    }

    if (activeCard) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeCard]);

  return (
    <>
      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Why students use DormSweep
          </h2>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Built to keep buying and selling on campus simple, safer, and more
            affordable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.entries(cardData) as [CardKey, (typeof cardData)[CardKey]][]).map(
            ([key, card]) => {
              const Icon = card.icon;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCard(key)}
                  className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <Icon className="h-6 w-6 text-gray-800" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {card.short}
                  </p>

                  <div className="mt-4 text-sm font-medium text-gray-900">
                    Click to learn more
                  </div>
                </button>
              );
            }
          )}
        </div>
      </section>

      {activeCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(255,255,255,0.35)] p-4 backdrop-blur-md"
          onClick={() => setActiveCard(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/25 to-sky-100/25" />

            <button
              type="button"
              onClick={() => setActiveCard(null)}
              className="absolute right-4 top-4 z-20 rounded-full border border-gray-200/80 bg-white/90 p-2 text-gray-800 transition hover:bg-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 p-6 sm:p-8">
              <div className="max-w-2xl pr-12">
                <div className="mb-5 inline-flex rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
                  {(() => {
                    const Icon = cardData[activeCard].icon;
                    return <Icon className="h-7 w-7 text-gray-900" />;
                  })()}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {cardData[activeCard].title}
                </h3>

                <div className="mt-3 h-px w-full bg-gray-200" />

                <p className="mt-4 text-base leading-7 text-gray-700">
                  {cardData[activeCard].full}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}