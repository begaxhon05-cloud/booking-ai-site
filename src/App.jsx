import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { propertyInfo } from "./propertyInfo";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import "./App.css";

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

  const [chatOpen, setChatOpen] = useState(true);
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

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
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
    <header className="sticky top-0 z-40 bg-[#050914]/95 backdrop-blur border-b border-white/10 rounded-b-[2rem]">
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex items-center justify-between">
    <div className="text-3xl font-black">
      Booking<span className="text-yellow-400">AI</span>
    </div>

    <button
      onClick={scrollToDemo}
      className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-2xl px-6 py-4 text-lg shadow-lg shadow-yellow-400/20"
    >
      Rezervo tani →
    </button>

    <button
      onClick={() => setChatOpen(true)}
      className="md:hidden text-white text-4xl leading-none"
    >
      ☰
    </button>
  </div>
</header>

<main>
  <section className="max-w-7xl mx-auto px-4 pt-7 pb-10 md:px-6 md:py-20">
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-10 shadow-2xl">
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <p className="text-yellow-400 text-sm md:text-base tracking-widest font-black mb-5">
            HOTEL AI BOOKING PLATFORM
          </p>

          <h1 className="text-[46px] sm:text-6xl md:text-7xl font-black leading-[0.95] mb-6">
            Rezervo qëndrimin tënd{" "}
            <span className="text-yellow-400">në pak sekonda.</span>
          </h1>

          <p className="text-[18px] md:text-xl text-slate-300 leading-relaxed mb-7 max-w-xl">
            Zgjidh dhomën, kontrollo disponueshmërinë dhe konfirmo
            rezervimin me ndihmën e AI receptionist 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-7">
            <button
              onClick={scrollToDemo}
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-2xl px-8 py-4 text-lg shadow-lg shadow-yellow-400/20"
            >
              Rezervo tani →
            </button>

            <button
              onClick={() => setChatOpen(true)}
              className="w-full sm:w-auto border border-yellow-400/60 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl px-8 py-4 text-lg"
            >
              💬 Fol me AI Assistant
            </button>
          </div>
        </div>

        <div className="rounded-[1.7rem] overflow-hidden border border-white/10 shadow-2xl">
          <img
            src="/hotel-hero.png"
            alt="Luxury hotel"
            className="w-full h-[430px] md:h-[520px] object-cover"
          />
        </div>
      </div>
    </div>
  </section>

      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "AI Receptionist 24/7",
              text: "Përgjigjet për dhomat, çmimet, datat dhe rezervimet.",
            },
            {
              title: "Voice Assistant",
              text: "Klienti mund të flasë me zë dhe AI përgjigjet me zë.",
            },
            {
              title: "WhatsApp + Email",
              text: "Konfirmime automatike për klientin dhe pronarin.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-yellow-400/40 transition"
            >
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center mb-5">
                ✦
              </div>

              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 items-start">
          <div>
            <p className="text-yellow-400 font-bold mb-3">REZERVO ONLINE</p>

            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Provoje sistemin real tani.
            </h2>

            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Plotëso formën e rezervimit ose fol direkt me AI Assistant.
            </p>
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold">Booking Request</h2>
                <span className="text-sm font-semibold text-slate-500">
                  Step {step}/4
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={onSubmit}>
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Select Dates</h3>
                    <p className="text-slate-500 mb-5">
                      Choose your room, check-in date and number of nights.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Room
                    </label>

                    <select
                      name="room"
                      value={form.room}
                      onChange={onChange}
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {rooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Check-in
                    </label>

                    <input
                      type="date"
                      name="checkin"
                      value={form.checkin}
                      onChange={onChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    />

                    {form.checkin && isRoomBooked && (
                      <p className="text-red-500 text-sm mt-2 font-semibold">
                        This room is already booked for this date.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nights
                    </label>

                    <input
                      type="number"
                      name="nights"
                      min="1"
                      value={form.nights}
                      onChange={onChange}
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={next}
                    disabled={!form.checkin || !form.nights}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-2xl transition"
                  >
                    Continue
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold">Guests</h3>

                  <input
                    type="number"
                    name="guests"
                    min="1"
                    value={form.guests}
                    onChange={onChange}
                    required
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-2xl transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold">Your Info</h3>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Name"
                    required
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="Email"
                    required
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      disabled={!form.name || !form.email}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-2xl transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold">Confirm Booking</h3>

                  <div className="bg-slate-100 rounded-2xl p-5 space-y-3">
                    {[
                      ["Name", form.name],
                      ["Email", form.email],
                      ["Room", form.room],
                      ["Check-in", form.checkin],
                      ["Nights", form.nights],
                      ["Guests", form.guests],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}

                    <div className="border-t border-slate-300 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          €{pricePerNight} x {form.nights} nights
                        </span>
                        <span className="font-semibold">
                          €{Number(form.nights) * pricePerNight}
                        </span>
                      </div>

                      <div className="flex justify-between mt-2">
                        <span className="text-slate-500">Service fee</span>
                        <span className="font-semibold">€{serviceFee}</span>
                      </div>

                      <div className="flex justify-between mt-3 text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-green-600">
                          €{totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-slate-950 font-semibold py-3 rounded-2xl transition"
                    >
                      {loading ? "Sending..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>

    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#050914]/95 backdrop-blur border-t border-white/10 px-4 py-3">
      <div className="grid grid-cols-4 gap-2 items-center text-center">
        <a href="#" className="bg-yellow-400 text-slate-950 rounded-2xl py-3 font-bold">
          Kreu
        </a>

        <a href="#features" className="text-white py-3 font-semibold">
          Features
        </a>

        <button
          onClick={() => setChatOpen(true)}
          className="text-white py-3 font-semibold"
        >
          Chat
        </button>

        <button
          onClick={scrollToDemo}
          className="bg-yellow-400 text-slate-950 rounded-2xl py-3 font-black"
        >
          Rezervo
        </button>
      </div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#050914]/95 backdrop-blur border-t border-white/10 px-4 py-3">
  <div className="grid grid-cols-4 gap-2 text-center">
    <a href="#" className="bg-yellow-400 text-slate-950 rounded-2xl py-3 font-bold">
      🏠<br />Kreu
    </a>

    <a href="#features" className="text-white py-3 font-semibold">
      ▦<br />Features
    </a>

    <button
      onClick={() => setChatOpen(true)}
      className="text-white py-3 font-semibold"
    >
      ☎<br />Kontakt
    </button>

    <button
      onClick={scrollToDemo}
      className="bg-yellow-400 text-slate-950 rounded-2xl py-3 font-black"
    >
      Rezervo →
    </button>
  </div>
</div>
      <ChatWidget
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
    <div className="fixed bottom-5 right-5 z-50">
      {chatOpen && (
        <div className="mb-4 w-[370px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
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