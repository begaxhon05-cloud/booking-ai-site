import React from "react";

const features = [
  {
    icon: "💬",
    title: "Answers guest questions instantly",
    text: "GuestPilot AI helps visitors get fast answers about rooms, services, check-in, location, parking, policies, and more — directly on your hotel website.",
  },
  {
    icon: "📝",
    title: "Collects booking requests",
    text: "When a guest is interested, the AI can collect the essential details and guide them toward sending a booking request.",
  },
  {
    icon: "⚡",
    title: "Installs on your existing website",
    text: "No new booking platform. No rebuild. The AI Receptionist is added to your current hotel website with a simple widget script.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20"
    >
      <div className="mb-10 md:mb-14 max-w-3xl">
        <p className="text-yellow-400 font-bold tracking-[0.2em] text-xs uppercase mb-3">
          WHAT IT DOES
        </p>

        <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-white">
          Your hotel website gets a smart AI receptionist.
        </h2>

        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          GuestPilot AI helps hotels respond faster, capture more guest
          interest, and make the existing website more useful — without turning
          it into a complicated booking platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-[28px] border border-white/10 bg-[#101722] hover:border-yellow-400/40 transition-all duration-300 p-5 md:p-6"
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-2xl mb-5">
              {feature.icon}
            </div>

            <h3 className="text-xl font-black leading-snug mb-3 text-white">
              {feature.title}
            </h3>

            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}