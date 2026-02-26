"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "High Ticket Mindset",
    description:
      "You do not need a perfect plan. You just need the next step. Change your thinking, then change your life.",
  },
  {
    title: "Dream Big, Act Daily",
    description:
      "You miss 100% of the shots you do not take. Show up anyway, no matter how you feel.",
  },
  {
    title: "Remember the Goal",
    description:
      "Your greatest weapon is your mind. Train it to see opportunities, not obstacles.",
  },
  {
    title: "Trust the Process",
    description:
      "Stay on track with a proven process and real coaching. Results follow consistent execution.",
  },
];

export const AuthCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#77e3f7] to-[#4ec8de] px-16 lg:flex overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-[#1a1f2e]/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-5xl font-bold leading-tight text-white mb-4">
              {slides[current].title}
            </h1>
            <p className="max-w-lg text-lg text-white/90 leading-relaxed">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex gap-2 relative z-10">
        {slides.map((slide, idx) => (
          <button
            key={slide.title}
            onClick={() => setCurrent(idx)}
            className="group relative py-2" // increased touch target
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === current
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 group-hover:bg-white/60"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
