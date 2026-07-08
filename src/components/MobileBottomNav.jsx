import React from "react";

export default function MobileBottomNav({
  scrollToDemo,
  setChatOpen,
}) {
  const scrollToContact = () => {
    document
      .getElementById("contact")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-4 mb-4 rounded-3xl border border-white/10 bg-[#0B1120]/95 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-4 py-3">
          
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="flex flex-col items-center gap-1 text-white text-xs font-semibold"
          >
            <span className="text-xl">🏠</span>
            Home
          </button>

          <button
            onClick={() =>
              document
                .getElementById("features")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
            className="flex flex-col items-center gap-1 text-white text-xs font-semibold"
          >
            <span className="text-xl">✨</span>
            Features
          </button>

          <button
            onClick={scrollToContact}
            className="flex flex-col items-center gap-1 text-yellow-400 text-xs font-bold"
          >
            <span className="text-xl">⚡</span>
            Install
          </button>

          <button
            onClick={() => setChatOpen(true)}
            className="flex flex-col items-center gap-1 text-white text-xs font-semibold"
          >
            <span className="text-xl">💬</span>
            Chat
          </button>

        </div>
      </div>
    </div>
  );
}