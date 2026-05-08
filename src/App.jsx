import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { propertyInfo } from "./propertyInfo";
import AdminDashboard from "./AdminDashboard";
import "./App.css";
import AdminLogin from "./AdminLogin";

export default function App() {

  if (window.location.pathname === "/admin/login") {
  return <AdminLogin />;
}

if (window.location.pathname === "/admin") {
  const isLoggedIn = localStorage.getItem("admin_logged_in");

  if (isLoggedIn !== "true") {
    window.location.href = "/admin/login";
    return null;
  }

  return <AdminDashboard />;
}
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState({});

  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi! I am the AI assistant for ${propertyInfo.name}. Ask me anything or request a booking.`,
    },
  ]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

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
  const calculateTotal = (nights) => Number(nights) * pricePerNight + serviceFee;
  const totalPrice = calculateTotal(form.nights);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getBookedDates`)
      .then((res) => res.json())
      .then((data) => setBookedDates(data))
      .catch((err) => console.error("Booked dates error:", err));
  }, []);

  const isUnavailable = (booking) => {
    if (!booking?.room || !booking?.checkin) return false;
    return bookedDates?.[booking.room]?.includes(booking.checkin);
  };

  const isRoomBooked = bookedDates?.[form.room]?.includes(form.checkin);

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
        source: "website_ai",
      }),
    });

    const supabaseData = await supabaseRes.json();

    if (!supabaseData.success) {
      throw new Error(supabaseData.error || "Supabase booking failed");
    }

    await emailjs.send(
      "service.booking",
      "template_vt1z08k",
      {
        ...booking,
        to_email: booking.email,
        owner_email: "begaxhon05@gmail.com",
        total: calculateTotal(booking.nights),
      },
      "ezj-MNGM2H6cjtxg5"
    );

    const params = new URLSearchParams({
      name: booking.name,
      email: booking.email,
      checkin: booking.checkin,
      nights: String(booking.nights),
      guests: String(booking.guests),
      room: booking.room,
    });

    await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);

    await fetch("/api/send-whatsapp", {
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
Total: €${calculateTotal(booking.nights)}`,
      }),
    });

    setBookedDates((prev) => ({
      ...prev,
      [booking.room]: [...(prev[booking.room] || []), booking.checkin],
    }));

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: "✅ Booking confirmed successfully! The booking was saved in Supabase, Google Sheets, email was sent and WhatsApp notification was delivered.",
      },
    ]);

    setPendingBooking(null);
    setSent(true);
  } catch (err) {
    console.error(err);

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: `❌ Booking failed: ${err.message}`,
      },
    ]);

    alert(`Booking failed: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const sendMessage = async () => {
    if (!question.trim() || chatLoading || loading) return;

    const userQuestion = question.trim();
    const userMsg = { from: "user", text: userQuestion };

    const confirmWords = [
      "po",
      "yes",
      "confirm",
      "ok",
      "okay",
      "dakord",
      "sigurisht",
      "konfirmoj",
      "of course",
    ];

    const isConfirm =
      pendingBooking &&
      confirmWords.some((w) => userQuestion.toLowerCase().includes(w));

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    if (isConfirm) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Processing your booking..." },
      ]);
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
          availability: bookedDates,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.reply || "I could not generate a response." },
      ]);

      if (data.bookingReady && data.booking) {
        setPendingBooking(data.booking);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: "AI error." }]);
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
      <div className="min-h-screen bg-[#050914] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500 flex items-center justify-center text-3xl font-bold">
            ✓
          </div>
          <h1 className="text-3xl font-bold mb-3">Booking Sent</h1>
          <p className="text-slate-300 mb-6">
            Your booking request was sent successfully.
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold py-3 rounded-2xl transition"
          >
            New Booking
          </button>
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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] text-white overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-[#050914]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/50 flex items-center justify-center text-yellow-400 font-bold">
              ⌘
            </div>
            <div className="text-2xl font-bold">
              Booking<span className="text-yellow-400">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-slate-200">
            <a href="#features" className="hover:text-yellow-400">
              Features
            </a>
            <a href="#how" className="hover:text-yellow-400">
              Si funksionon
            </a>
            <a href="#demo" className="hover:text-yellow-400">
              Demo
            </a>
            <a href="#contact" className="hover:text-yellow-400">
              Kontakt
            </a>
          </nav>

          <button
            onClick={scrollToDemo}
            className="border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-950 font-semibold rounded-2xl px-6 py-3 transition"
          >
            Kërko Demo →
          </button>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-5 py-2 text-yellow-400 text-sm tracking-[0.25em] font-semibold mb-8">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              ZGJIDHJA #1 PËR PRONA TURISTIKE
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8">
              Më shumë rezervime.
              <br />
              <span className="text-yellow-400">Më pak stres.</span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              BookingAI automatizon komunikimin, rezervimet dhe menaxhimin e
              klientëve për Airbnb, hotele dhe apartamente me qira ditore.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={scrollToDemo}
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold rounded-2xl px-8 py-4 text-lg transition"
              >
                Provoje për pronën tënde →
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="border border-blue-500/70 hover:bg-blue-500/10 text-white font-bold rounded-2xl px-8 py-4 text-lg transition"
              >
                ▶ Si funksionon
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex -space-x-3">
                {["A", "B", "C", "D"].map((x) => (
                  <div
                    key={x}
                    className="h-12 w-12 rounded-full bg-slate-200 text-slate-900 border-2 border-[#050914] flex items-center justify-center font-bold"
                  >
                    {x}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-yellow-400 text-xl">★★★★★</p>
                <p className="text-slate-400">
                  Besohet nga mbi 150+ prona në Shqipëri
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b1324] shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-12 w-12 rounded-xl bg-yellow-400/10 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
                    ⌘
                  </div>
                  <p className="font-bold">BookingAI</p>
                </div>

                <h2 className="text-2xl font-bold mb-6">Përmbledhje</h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm">Rezervime</p>
                    <p className="text-4xl font-bold mt-3">24</p>
                    <p className="text-green-400 text-sm mt-2">+12%</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm">Të ardhura</p>
                    <p className="text-3xl font-bold mt-3">€3,240</p>
                    <p className="text-green-400 text-sm mt-2">+16%</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-slate-400 text-sm">Klientë të rinj</p>
                    <p className="text-4xl font-bold mt-3">18</p>
                    <p className="text-green-400 text-sm mt-2">+8%</p>
                  </div>
                </div>

                <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-slate-400 text-sm">Automations aktive</p>
                  <p className="mt-3 text-sm text-slate-300">
                    WhatsApp AI • Email • Google Sheets • Room Availability
                  </p>
                </div>
              </div>

              <div className="min-h-[430px] bg-gradient-to-br from-yellow-500/30 to-blue-900/30 flex items-center justify-center p-8">
                <div className="w-full h-full rounded-3xl bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center shadow-2xl" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Receptionist 24/7",
                text: "Përgjigjet në shqip, anglisht, italisht, gjermanisht dhe spanjisht.",
              },
              {
                title: "Rezervime automatike",
                text: "Klienti konfirmon dhe sistemi ruan rezervimin automatikisht.",
              },
              {
                title: "WhatsApp + Email",
                text: "Konfirmime automatike për klientin dhe pronarin.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-3xl p-7 hover:border-yellow-400/40 transition"
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

        <section id="how" className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12">
            <h2 className="text-4xl font-bold mb-8">
              Si funksionon Booking<span className="text-yellow-400">AI</span>
            </h2>

            <div className="grid md:grid-cols-4 gap-5">
              {[
                "Klienti pyet në web ose WhatsApp",
                "AI kontrollon dhomat dhe datat",
                "AI përgatit përmbledhjen",
                "Klienti konfirmon dhe sistemi bën rezervimin",
              ].map((stepText, index) => (
                <div
                  key={stepText}
                  className="bg-[#050914] border border-white/10 rounded-3xl p-6"
                >
                  <p className="text-yellow-400 text-3xl font-black mb-4">
                    0{index + 1}
                  </p>
                  <p className="text-slate-300">{stepText}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-yellow-400 font-bold mb-3">LIVE DEMO</p>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Provoje sistemin real tani.
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Mund të përdorësh formën klasike ose chatbot-in poshtë djathtas.
                AI mund të kontrollojë disponueshmërinë, të mbledhë të dhënat
                dhe të krijojë rezervim pas konfirmimit.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-slate-300">
                <p className="font-bold text-white mb-2">Shembull për chat:</p>
                <p>
                  Dua Room 101 me date 2026-06-28 per 2 nete per 2 persona.
                  Emri Xhon Bega, email test@test.com
                </p>
              </div>
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
                          This room is already booked for this date. Choose
                          another room or date.
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

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Guests
                      </label>
                      <input
                        type="number"
                        name="guests"
                        min="1"
                        value={form.guests}
                        onChange={onChange}
                        required
                        className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                      />
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

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        required
                        className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        required
                        className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                      />
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

        <section id="contact" className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-yellow-400 rounded-[2rem] p-10 md:p-14 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl font-black mb-3">
                Gati ta automatizosh pronën tënde?
              </h2>
              <p className="text-lg">
                BookingAI mund të përshtatet për çdo hotel, Airbnb ose apartament.
              </p>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="bg-slate-950 text-white rounded-2xl px-8 py-4 font-bold hover:bg-slate-800 transition"
            >
              Fol me AI →
            </button>
          </div>
        </section>
      </main>

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
      />
    </div>
  );
}

function ChatWidget({
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
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {chatOpen && (
        <div className="mb-4 w-[360px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4">
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-xs text-slate-300">Villa Aurora Demo</p>
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
              <div className="max-w-[85%] rounded-2xl px-4 py-2 text-sm bg-white border border-slate-200 text-slate-800">
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

          <div className="p-3 border-t border-slate-200 flex gap-2">
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
              onClick={sendMessage}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-2xl px-4 text-sm font-semibold"
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