import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { propertyInfo } from "./propertyInfo";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi! I am the AI assistant for ${propertyInfo.name}. Ask me anything or request a booking.`,
    },
  ]);

  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookedDates, setBookedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const pricePerNight = 50;
  const serviceFee = 10;

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  const calculateTotal = (nights) => Number(nights) * pricePerNight + serviceFee;

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

  const submitBooking = async (booking) => {
    if (isUnavailable(booking)) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Kjo dhomë është e zënë për këtë datë. Ju lutem zgjidhni një dhomë ose datë tjetër." },
      ]);
      return;
    }

    setLoading(true);

    try {
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

      setPendingBooking(null);
      setSent(true);

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "✅ Rezervimi u konfirmua me sukses. Konfirmimi u dërgua në email.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Ndodhi një problem gjatë konfirmimit. Ju lutem provoni përsëri." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!question.trim() || chatLoading || loading) return;

    const text = question.trim();
    const userMsg = { from: "user", text };

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

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    const isConfirm =
      pendingBooking &&
      confirmWords.some((word) => text.toLowerCase().includes(word));

    if (isConfirm) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Po e konfirmoj rezervimin tani..." },
      ]);

      await submitBooking(pendingBooking);
      return;
    }

    setChatLoading(true);

    try {
      const aiMessages = [...messages, userMsg].map((msg) => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: aiMessages,
          availability: bookedDates,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.reply || "Nuk munda të përgjigjem." },
      ]);

      if (data.bookingReady && data.booking) {
        setPendingBooking(data.booking);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "AI error. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-green-400 font-semibold mb-3">
              AI Booking System
            </p>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
              Book your stay in a smarter way.
            </h1>

            <p className="text-slate-300 text-lg mb-8">
              AI receptionist, room availability, Google Sheets, email and WhatsApp automation.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-slate-400">Assistant</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm text-slate-400">Bookings</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">Fast</p>
                <p className="text-sm text-slate-400">Response</p>
              </div>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">AI Booking Assistant</h2>
            <p className="text-slate-500 mb-5">
              Use the chat widget to ask questions, check room availability, or create a booking automatically.
            </p>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <p className="font-bold text-green-700">Booking confirmed successfully.</p>
                <p className="text-sm text-green-700 mt-2">
                  The booking was saved and confirmation email was sent.
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-5 space-y-3 text-sm">
                <p><b>Example:</b></p>
                <p>
                  Dua Room 101 me date 2026-06-28 per 2 nete per 2 persona.
                  Emri Xhon Bega, email test@test.com
                </p>
                <p className="text-slate-500">
                  AI will prepare the booking summary and wait for confirmation.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="fixed bottom-5 right-5 z-50">
        <div className="mb-4 w-[360px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4">
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-xs text-slate-300">{propertyInfo.name}</p>
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
      </div>
    </div>
  );
}