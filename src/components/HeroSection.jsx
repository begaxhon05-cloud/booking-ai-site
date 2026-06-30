import React from "react";

export default function HeroSection({
  scrollToDemo,
  setChatOpen,
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-8 md:px-6 md:py-20">

      <div className="rounded-[32px] border border-white/10 bg-[#101722] p-5 md:p-10 shadow-2xl">

        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* LEFT */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-400 text-xs font-bold tracking-[0.2em] mb-5">
              HOTEL AI BOOKING PLATFORM
            </div>

            <h1 className="text-[30px] sm:text-[40px] md:text-7xl font-black leading-[1.05] mb-4">
              Book your stay.
              <br />

              <span className="text-yellow-400">
                AI does the rest.
              </span>
            </h1>

            <p className="text-[15px] md:text-xl text-slate-300 leading-relaxed max-w-xl mb-6">
              Choose your room, check availability and confirm your booking
              with an AI receptionist available 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                onClick={scrollToDemo}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black transition"
              >
                Book Now →
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-yellow-400/50 bg-white/5 hover:bg-white/10 text-white font-bold transition"
              >
                💬 Chat with AI
              </button>

            </div>

          </div>

          {/* RIGHT */}

          <div>

            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop"
              alt="Luxury Hotel"
              className="w-full h-[260px] md:h-[520px] rounded-[28px] object-cover"
            />

          </div>

        </div>

      </div>

    </section>
  );
}