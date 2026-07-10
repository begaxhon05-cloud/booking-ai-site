import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { propertyInfo } from "./propertyInfo";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import "./App.css";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import MobileBottomNav from "./components/MobileBottomNav";
import BookingSection from "./components/BookingSection";

export default function App() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  const isOldAdminLogin = pathParts[0] === "admin" && pathParts[1] === "login";
  const isOldAdminDashboard = pathParts[0] === "admin";

  const hotelSlug =
    isOldAdminLogin || isOldAdminDashboard
      ? "villa-aurora-demo"
      : pathParts[0] || "villa-aurora-demo";

  const isAdminLogin =
    isOldAdminLogin ||
    (pathParts[0] === hotelSlug &&
      pathParts[1] === "admin" &&
      pathParts[2] === "login");

  const isAdminDashboard =
    isOldAdminDashboard ||
    (pathParts[0] === hotelSlug && pathParts[1] === "admin" && !pathParts[2]);

  if (isAdminLogin) {
    return <AdminLogin hotelSlug={hotelSlug} />;
  }

  if (isAdminDashboard) {
    const isLoggedIn = localStorage.getItem(`admin_logged_in_${hotelSlug}`);

    if (isLoggedIn !== "true") {
      window.location.href = `/${hotelSlug}/admin/login`;
      return null;
    }

    return <AdminDashboard hotelSlug={hotelSlug} />;
  }

  return <MainWebsite />;
}

function MainWebsite() {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState({});
  const [hotel, setHotel] = useState(null);
  const hotelSlug =
  window.location.pathname.split("/").filter(Boolean)[0] || "villa-aurora-demo";

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi! I am the AI assistant for ${hotel?.hotel_name || "our hotel"}. Ask me anything or request a booking.`,
    },
  ]);

  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const rooms = [
    "Room 101",
    "Room 102",
    "Room 103",
    "Family Room",
    "Sea View Apartment",
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    checkin: "",
    nights: 1,
    guests: 1,
    room: "Room 101",
  });

  const pricePerNight = 50;
  const serviceFee = 10;

  const calculateTotal = (nights) =>
    Number(nights) * pricePerNight + serviceFee;

  const totalPrice = calculateTotal(form.nights);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getBookedDates`)
      .then((res) => res.json())
      .then((data) => setBookedDates(data))
      .catch((err) => console.error("Booked dates error:", err));
  }, []);
  useEffect(() => {
  fetch(`/api/hotel?slug=${hotelSlug}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setHotel(data.hotel);
      }
    })
    .catch(console.error);
}, []);

  const isUnavailable = (booking) => {
    if (!booking?.room || !booking?.checkin) return false;
    return bookedDates?.[booking.room]?.includes(booking.checkin);
  };

  const isRoomBooked = bookedDates?.[form.room]?.includes(form.checkin);

  const speakText = async (text) => {
  if (!voiceEnabled || !text) return;

  try {
    const cleanText = text
      .replace(/✅|❌|🎤|🎙️|🔥|🚀/g, "")
      .replace(/\n/g, ". ")
      .slice(0, 1200);

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: cleanText }),
    });

    if (!response.ok) {
      console.error("TTS failed");
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => URL.revokeObjectURL(audioUrl);

    await audio.play();
  } catch (error) {
    console.error("Voice playback error:", error);
  }
};

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "sq-AL";
    recognition.interimResults = false;
    recognition.continuous = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setQuestion(transcript);
  setIsListening(false);

  setTimeout(() => {
    sendMessage(transcript);
  }, 300);
};

    recognition.onerror = () => {
      setIsListening(false);
      alert("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const submitBooking = async (booking) => {
    if (isUnavailable(booking)) {
      alert("This room is already booked for this date.");
      return;
    }

    setLoading(true);

    try {
      const supabaseRes = await fetch("/api/create-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: booking.room,
          checkin: booking.checkin,
          nights: Number(booking.nights),
          guests: Number(booking.guests),
          name: booking.name,
          email: booking.email,
          hotel_slug: hotelSlug,
          source: "website_ai",
        }),
      });

      const supabaseData = await supabaseRes.json();

      if (!supabaseData.success) {
        throw new Error(supabaseData.error || "Supabase booking failed");
      }

      const total = calculateTotal(booking.nights);
      await fetch("/api/send-booking-confirmation", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    hotel_slug: hotelSlug,
    name: booking.name,
    email: booking.email,
    room: booking.room,
    checkin: booking.checkin,
    nights: Number(booking.nights),
    guests: Number(booking.guests),
    total,
  }),
});

      const params = new URLSearchParams({
        name: booking.name,
        email: booking.email,
        checkin: booking.checkin,
        nights: String(booking.nights),
        guests: String(booking.guests),
        room: booking.room,
      });

      await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);

      const clientEmail = emailjs.send(
        "service.booking",
        "template_vt1z08k",
        {
          ...booking,
          to_email: booking.email,
          owner_email: "begaxhon05@gmail.com",
          total,
        },
        "ezj-MNGM2H6cjtxg5"
      );

      const ownerEmail = emailjs.send(
        "service.booking",
        "template_vt1z08k",
        {
          ...booking,
          to_email: "begaxhon05@gmail.com",
          owner_email: "begaxhon05@gmail.com",
          total,
        },
        "ezj-MNGM2H6cjtxg5"
      );

      const ownerWhatsApp = fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "+355685090050",
          message: `✅ New booking confirmed

Customer: ${booking.name}
Email: ${booking.email}
Room: ${booking.room}
Check-in: ${booking.checkin}
Nights: ${booking.nights}
Guests: ${booking.guests}
Total: €${total}`,
        }),
      });

      await Promise.allSettled([clientEmail, ownerEmail, ownerWhatsApp]);

      setBookedDates((prev) => ({
        ...prev,
        [booking.room]: [...(prev[booking.room] || []), booking.checkin],
      }));

      const successMessage =
        "✅ Rezervimi u konfirmua me sukses. U ruajt në dashboard dhe konfirmimi u dërgua me email.";

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: successMessage,
        },
      ]);

      speakText(successMessage);

      setPendingBooking(null);
      setSent(true);
    } catch (err) {
      console.error(err);

      const errorMessage = `❌ Booking failed: ${err.message}`;

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: errorMessage,
        },
      ]);

      speakText(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (voiceText = null) => {
  const finalQuestion = voiceText || question;

  if (!finalQuestion.trim() || chatLoading || loading) return;

  const userQuestion = finalQuestion.trim();
  const normalized = userQuestion.toLowerCase();
  const userMsg = { from: "user", text: userQuestion };

  const confirmWords = [
    "po",
    "yes",
    "confirm",
    "konfirmoj",
    "ok",
    "okay",
    "dakord",
    "sigurisht",
    "of course",
    "po e konfirmoj",
    "e konfirmoj",
    "confirm booking",
    "yes please",
    "sure",
    "perfect",
    "perfekt",
  ];

  const isConfirm =
    pendingBooking &&
    confirmWords.some((word) => normalized.includes(word));

  setMessages((prev) => [...prev, userMsg]);
  setQuestion("");

  if (isConfirm) {
    const confirmingText = "Po e konfirmoj rezervimin tani...";

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: confirmingText,
      },
    ]);

    speakText(confirmingText);
    await submitBooking(pendingBooking);
    return;
  }

  setChatLoading(true);

  try {
    const aiMessages = [...messages, userMsg].map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  messages: aiMessages,
  hotel_slug: hotelSlug,
}),
    });

    const data = await res.json();

    const botReply = data.reply || "I could not generate a response.";

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: botReply,
      },
    ]);

    speakText(botReply);

    if (data.bookingReady && data.booking) {
      setPendingBooking(data.booking);
    }
  } catch (err) {
    const errorMessage = "AI error. Please try again.";

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: errorMessage,
      },
    ]);

    speakText(errorMessage);
  } finally {
    setChatLoading(false);
  }
};

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const next = () => {
    if (step === 1 && isRoomBooked) {
      alert("This room is already booked for this date.");
      return;
    }

    setStep((prev) => prev + 1);
  };

  const back = () => setStep((prev) => prev - 1);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isRoomBooked) {
      alert("This room is already booked for this date.");
      setStep(1);
      return;
    }

    await submitBooking(form);
  };

  const resetForm = () => {
    setSent(false);
    setStep(1);
    setForm({
      name: "",
      email: "",
      checkin: "",
      nights: 1,
      guests: 1,
      room: "Room 101",
    });
  };

  const scrollToContact = () => {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
};

  if (sent) {
  return (
    <div className="min-h-screen bg-[#050914] text-white overflow-x-hidden pb-28 md:pb-0">
      <div className="max-w-md w-full bg-white/10 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500 flex items-center justify-center text-3xl font-bold">
          ✓
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6">
          Booking confirmed
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
          Your booking request was sent successfully.
        </p>

        <button
          onClick={resetForm}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold py-3 rounded-2xl transition"
        >
          New Booking
        </button>
      </div>
    </div>
  );
}
   
      return (
  <div className="min-h-screen bg-[#050914] text-white overflow-x-hidden pb-28 md:pb-0">
    <header className="sticky top-0 z-40 bg-[#050914]/90 backdrop-blur-xl border-b border-white/10">
  <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-yellow-400/20">
        GP
      </div>

      <div className="leading-none">
        <div className="text-xl md:text-2xl font-black tracking-tight">
          GuestPilot<span className="text-yellow-400">AI</span>
        </div>
        <p className="hidden sm:block text-xs text-slate-400 mt-1">
          AI Receptionist for hotels
        </p>
      </div>
    </div>

    <div className="hidden md:flex items-center gap-8">
      <button
        onClick={() =>
          document.getElementById("features")?.scrollIntoView({
            behavior: "smooth",
          })
        }
        className="text-sm font-semibold text-slate-300 hover:text-white transition"
      >
        Features
      </button>

      <button
        onClick={scrollToContact}
        className="text-sm font-semibold text-slate-300 hover:text-white transition"
      >
        Install
      </button>

      <button
        onClick={scrollToContact}
        className="h-12 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black shadow-lg shadow-yellow-400/20 transition"
      >
        Add AI to My Website →
      </button>
    </div>

    <button
      onClick={() => setChatOpen(true)}
      className="md:hidden h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-white flex items-center justify-center text-xl"
    >
      💬
    </button>
  </div>
</header>

    <main>
      <HeroSection
        scrollToDemo={scrollToContact}
        setChatOpen={setChatOpen}
      />

      <FeaturesSection />

      <BookingSection setChatOpen={setChatOpen} />
    </main>

    <MobileBottomNav
      scrollToDemo={scrollToContact}
      setChatOpen={setChatOpen}
    />

    <ChatWidget
      hotel={hotel}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
      messages={messages}
      pendingBooking={pendingBooking}
      chatLoading={chatLoading}
      question={question}
      setQuestion={setQuestion}
      sendMessage={sendMessage}
      loading={loading}
      submitBooking={submitBooking}
      isUnavailable={isUnavailable}
      calculateTotal={calculateTotal}
      isListening={isListening}
      startVoiceInput={startVoiceInput}
      voiceEnabled={voiceEnabled}
      setVoiceEnabled={setVoiceEnabled}
    />
  </div>
);
}

function ChatWidget({
  hotel,
  chatOpen,
  setChatOpen,
  messages,
  pendingBooking,
  chatLoading,
  question,
  setQuestion,
  sendMessage,
  loading,
  submitBooking,
  isUnavailable,
  calculateTotal,
  isListening,
  startVoiceInput,
  voiceEnabled,
  setVoiceEnabled,
}) {
  return (
    <div className="fixed bottom-28 right-5 md:bottom-5 md:right-5 z-50">
      {chatOpen && (
        <div className="mb-4 w-[calc(100vw-32px)] md:w-[370px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">AI Assistant</h3>
              <p className="text-xs text-slate-300">{hotel?.hotel_name || "Villa Aurora Demo"}</p>
            </div>

            <button
              type="button"
              onClick={() => setVoiceEnabled((prev) => !prev)}
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                voiceEnabled
                  ? "bg-green-500 text-white"
                  : "bg-white/10 text-slate-300"
              }`}
            >
              {voiceEnabled ? "Voice ON" : "Voice OFF"}
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.from === "user"
                    ? "ml-auto bg-green-500 text-white"
                    : "bg-white border border-slate-200 text-slate-800"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {chatLoading && (
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                Typing...
              </div>
            )}

            {pendingBooking && (
              <div className="bg-white border border-green-300 rounded-2xl p-4 text-sm space-y-2">
                <p className="font-bold text-green-700">Booking Summary</p>
                <p>Room: {pendingBooking.room}</p>
                <p>Check-in: {pendingBooking.checkin}</p>
                <p>Nights: {pendingBooking.nights}</p>
                <p>Guests: {pendingBooking.guests}</p>
                <p>Name: {pendingBooking.name}</p>
                <p>Email: {pendingBooking.email}</p>
                <p className="font-bold">
                  Total: €{calculateTotal(pendingBooking.nights)}
                </p>

                {isUnavailable(pendingBooking) ? (
                  <p className="text-red-500 font-semibold">
                    This room is already booked for this date.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submitBooking(pendingBooking)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl disabled:bg-green-300"
                  >
                    {loading ? "Confirming..." : "Confirm Booking"}
                  </button>
                )}

                <p className="text-xs text-slate-500">
                  You can also confirm by typing: po, yes, confirm, ok.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 flex gap-2 items-center">
            <input
              value={question}
              disabled={chatLoading || loading}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask something..."
              className="flex-1 border border-slate-300 rounded-2xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100"
            />

            <button
              type="button"
              disabled={chatLoading || loading}
              onClick={startVoiceInput}
              className={`h-11 w-11 rounded-full flex items-center justify-center transition ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
              title="Voice message"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 14.5C13.66 14.5 15 13.16 15 11.5V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11.5C9 13.16 10.34 14.5 12 14.5Z"
                  fill="currentColor"
                />
                <path
                  d="M17.3 10.5C17.3 13.43 15.03 15.8 12 15.8C8.97 15.8 6.7 13.43 6.7 10.5H5C5 14.02 7.61 16.93 11.15 17.35V21H12.85V17.35C16.39 16.93 19 14.02 19 10.5H17.3Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button
              type="button"
              disabled={chatLoading || loading}
              onClick={sendMessage}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {chatLoading || loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setChatOpen(!chatOpen)}
        className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-2xl text-2xl flex items-center justify-center"
      >
        {chatOpen ? "×" : "💬"}
      </button>
    </div>
  );
}