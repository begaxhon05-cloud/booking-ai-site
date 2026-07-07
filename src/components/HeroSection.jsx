import React from "react";

export default function HeroSection({
  scrollToDemo,
  setChatOpen,
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-8 md:px-6 md:py-20">
      <div className="rounded-[32px] border border-white/10 bg-[#101722] p-5 md:p-10 shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-400 text-xs font-bold tracking-[0.18em] mb-5">
              AI RECEPTIONIST FOR HOTELS
            </div>

            <h1 className="text-[34px] sm:text-[44px] md:text-7xl font-black leading-[1.02] mb-5 text-white">
              Add an AI Receptionist
              <br />
              <span className="text-yellow-400">
                to your hotel website
              </span>
            </h1>

            <p className="text-[15px] md:text-xl text-slate-300 leading-relaxed max-w-xl mb-6">
              Answer guest questions instantly, collect booking requests, and
              help visitors 24/7 — with a smart AI widget installed on your
              existing hotel website.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 mb-6 max-w-xl">
              <p className="text-sm md:text-base text-slate-300">
                No new booking platform. No complex setup. Just one AI assistant
                for your hotel website.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={scrollToDemo}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black transition"
              >
                Get Demo →
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold transition"
              >
                💬 Try AI Receptionist
              </button>
            </div>

            <p className="text-sm text-slate-400">
              Works with your existing hotel website.
            </p>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-yellow-400/10 blur-3xl" />

            <div className="relative rounded-[28px] border border-white/10 bg-[#0B111A] p-4 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white font-bold">
                    GuestPilot AI
                  </p>
                  <p className="text-xs text-slate-400">
                    AI Receptionist Widget
                  </p>
                </div>

                <div className="h-10 w-10 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center font-black">
                  AI
                </div>
              </div>

              <div className="space-y-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3">
                  <p className="text-sm text-white">
                    Hi 👋 How can I help your guests today?
                  </p>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-yellow-400 px-4 py-3">
                  <p className="text-sm text-slate-950 font-medium">
                    Do you have rooms available this weekend?
                  </p>
                </div>

                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3">
                  <p className="text-sm text-white">
                    Yes, I can help. How many guests will be staying?
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Widget status</span>
                    <span className="text-yellow-400 font-bold">Live</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xl font-black text-white">24/7</p>
                      <p className="text-xs text-slate-400">Guest support</p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-xl font-black text-white">1 script</p>
                      <p className="text-xs text-slate-400">Easy install</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END RIGHT */}

        </div>
      </div>
    </section>
  );
}