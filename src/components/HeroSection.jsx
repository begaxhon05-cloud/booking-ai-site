import React from "react";

export default function HeroSection({
  scrollToDemo,
  setChatOpen,
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[#050914]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.14),transparent_30%)]" />

      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#050914]/80 via-[#050914]/92 to-[#050914]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-violet-200 text-[11px] font-black tracking-[0.18em] uppercase mb-5">
              AI Receptionist for Hotels
            </div>

            <h1 className="text-[42px] sm:text-[56px] md:text-[72px] lg:text-[82px] font-black leading-[0.95] tracking-tight text-white mb-6">
              Never miss
              <br />
              another
              <br />
              <span className="text-violet-400">booking.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-xl mb-7">
              Your AI receptionist answers every guest instantly through your
              hotel website, WhatsApp or voice — 24/7.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-lg mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-white font-black text-sm">{"<"}10 sec</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Average response
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-white font-black text-sm">+32%</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  More booking requests
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-white font-black text-sm">24/7</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Always available
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={scrollToDemo}
                className="h-14 px-8 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-black transition shadow-xl shadow-violet-500/25"
              >
                Add AI to My Website →
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="h-14 px-8 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold transition"
              >
                Watch AI Live Demo
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["A", "M", "L", "S"].map((item) => (
                  <div
                    key={item}
                    className="h-9 w-9 rounded-full border-2 border-[#050914] bg-white text-slate-900 flex items-center justify-center text-xs font-black"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400">
                Trusted by hotel owners building smarter websites
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="absolute -inset-5 rounded-[40px] bg-violet-500/20 blur-3xl" />

            <div className="relative mx-auto max-w-[390px] rounded-[34px] border border-white/15 bg-white p-3 shadow-2xl">
              <div className="rounded-[28px] overflow-hidden bg-slate-50">
                
                <div className="bg-[#241242] text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-violet-400 flex items-center justify-center text-lg">
                      👩‍💼
                    </div>

                    <div>
                      <p className="font-black leading-tight">
                        AI Receptionist
                      </p>
                      <div className="flex items-center gap-1 text-xs text-green-300">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        Online
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setChatOpen(true)}
                    className="text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Hello! 👋</p>
                    <p className="text-sm font-semibold text-slate-900">
                      How can I help you today?
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Book a room",
                      "Check availability",
                      "Ask about prices",
                      "Speak with AI",
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => setChatOpen(true)}
                        className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-800 hover:border-violet-300 hover:bg-violet-50 transition"
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-2">
                    <input
                      readOnly
                      placeholder="Ask anything..."
                      className="flex-1 text-sm outline-none bg-transparent text-slate-500"
                    />

                    <button
                      onClick={() => setChatOpen(true)}
                      className="h-10 w-10 rounded-full bg-violet-500 text-white flex items-center justify-center font-black"
                    >
                      →
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-slate-400">
                    Powered by GuestPilot AI
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="absolute -bottom-5 right-8 h-14 w-14 rounded-full bg-violet-500 text-white shadow-2xl shadow-violet-500/30 flex items-center justify-center text-2xl"
            >
              💬
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}