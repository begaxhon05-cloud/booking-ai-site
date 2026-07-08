import React from "react";

export default function BookingSection({ setChatOpen }) {
  return (
    <section
      id="contact"
      className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#101722] p-6 md:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/5 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          {/* LEFT */}
          <div>
            <p className="text-yellow-400 font-bold tracking-[0.2em] text-xs uppercase mb-4">
              FINAL STEP
            </p>

            <h2 className="text-3xl md:text-5xl font-black leading-tight text-white mb-5">
              Ready to add an AI Receptionist to your hotel website?
            </h2>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mb-6">
              GuestPilot AI can be installed on your existing hotel website with
              a simple widget script. Your visitors can ask questions, get fast
              answers, and send booking requests directly through the AI
              Receptionist.
            </p>

            <div className="grid gap-3 mb-7">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="mt-1 text-yellow-400">✓</span>
                <p className="text-sm md:text-base text-slate-300">
                  Works with your current hotel website.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="mt-1 text-yellow-400">✓</span>
                <p className="text-sm md:text-base text-slate-300">
                  Installed as a lightweight AI widget.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="mt-1 text-yellow-400">✓</span>
                <p className="text-sm md:text-base text-slate-300">
                  Website + AI Receptionist available for hotels without a
                  website.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:begaxhon05@gmail.com?subject=I want to add GuestPilot AI to my hotel website"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black transition flex items-center justify-center"
              >
                Add AI to My Hotel Website →
              </a>

              <button
                onClick={() => setChatOpen?.(true)}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold transition"
              >
                💬 Talk to AI Receptionist
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-[28px] border border-white/10 bg-[#0B111A] p-5 md:p-6">
            <div className="mb-6">
              <p className="text-white font-black text-xl mb-2">
                Simple installation
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Add one script to your hotel website and activate the AI
                Receptionist widget.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 overflow-x-auto mb-5">
              <code className="text-xs md:text-sm text-slate-300 whitespace-nowrap">
                {`<script src="https://booking-ai-site.vercel.app/widget.js" data-hotel="your-hotel"></script>`}
              </code>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                <span className="text-sm text-slate-400">Setup type</span>
                <span className="text-sm text-white font-bold">Widget</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                <span className="text-sm text-slate-400">Website needed</span>
                <span className="text-sm text-white font-bold">Existing or new</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                <span className="text-sm text-slate-400">Guest support</span>
                <span className="text-sm text-yellow-400 font-black">24/7</span>
              </div>
            </div>
          </div>
          {/* END RIGHT */}
        </div>
      </div>
    </section>
  );
}