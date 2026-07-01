import React from "react";

const features = [
  {
    icon: "🤖",
    title: "AI Receptionist",
    text: "Answers guests instantly, manages reservations and provides information 24/7.",
  },
  {
    icon: "🎤",
    title: "Voice Assistant",
    text: "Guests can speak naturally while AI responds with realistic voice conversations.",
  },
  {
    icon: "📲",
    title: "WhatsApp & Email",
    text: "Automatic confirmations, reminders and follow-up messages after every booking.",
  },
  {
    icon: "📅",
    title: "Smart Booking",
    text: "Real-time availability, pricing and booking management from one dashboard.",
  },
  {
    icon: "⭐",
    title: "Review Automation",
    text: "Automatically request Google and Booking.com reviews after checkout.",
  },
  {
    icon: "📊",
    title: "CRM Dashboard",
    text: "Manage guests, reservations and conversations in one place.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20"
    >
      <div className="text-center mb-12">
        <p className="text-yellow-400 font-bold tracking-[0.2em] text-sm uppercase mb-3">
          FEATURES
        </p>

        <h2 className="text-3xl md:text-5xl font-black mb-4">
          Everything your hotel needs.
        </h2>

        <p className="text-slate-400 max-w-2xl mx-auto">
          One platform to automate bookings, guest communication and hotel
          operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-[#111827] hover:border-yellow-400/40 transition-all duration-300 p-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-3xl mb-5">
              {feature.icon}
            </div>

            <h3 className="text-xl font-bold mb-3">
              {feature.title}
            </h3>

            <p className="text-slate-400 leading-relaxed">
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}