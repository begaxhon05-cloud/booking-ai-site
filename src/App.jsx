import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { propertyInfo } from "./propertyInfo";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I am your AI assistant. Ask me anything or request a booking.",
    },
  ]);

  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookedDates, setBookedDates] = useState({});
  const [chatOpen, setChatOpen] = useState(true);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  // LOAD BOOKINGS
  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getBookedDates`)
      .then((res) => res.json())
      .then((data) => setBookedDates(data))
      .catch((err) => console.error(err));
  }, []);

  // CHECK AVAILABILITY
  const isUnavailable = (booking) => {
    return bookedDates?.[booking.room]?.includes(booking.checkin);
  };

  // FINAL BOOKING FUNCTION
  const submitBooking = async (booking) => {
    if (isUnavailable(booking)) {
      alert("Room is already booked!");
      return;
    }

    try {
      // EMAIL TO CLIENT + OWNER
      await emailjs.send(
        "service.booking",
        "template_vt1z08k",
        {
          ...booking,
          to_email: booking.email,
          owner_email: "your@email.com",
        },
        "ezj-MNGM2H6cjtxg5"
      );

      // SAVE TO GOOGLE SHEETS
      const params = new URLSearchParams({
        name: booking.name,
        email: booking.email,
        checkin: booking.checkin,
        nights: booking.nights,
        guests: booking.guests,
        room: booking.room,
      });

      await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "✅ Booking confirmed successfully!",
        },
      ]);

      setPendingBooking(null);
    } catch (err) {
      console.error(err);
    }
  };

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!question.trim()) return;

    const userMsg = { from: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    const confirmWords = [
      "po",
      "yes",
      "confirm",
      "ok",
      "dakord",
      "sigurisht",
    ];

    // CONFIRM FLOW
    if (
      pendingBooking &&
      confirmWords.some((w) => question.toLowerCase().includes(w))
    ) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Processing your booking..." },
      ]);

      await submitBooking(pendingBooking);
      setQuestion("");
      return;
    }

    setQuestion("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.from === "user" ? "user" : "assistant",
            content: m.text,
          })),
          availability: bookedDates,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.reply },
      ]);

      if (data.bookingReady) {
        setPendingBooking(data.booking);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "AI error." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-slate-950 text-white">

    {/* HERO */}
    <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">

      <div>
        <h1 className="text-5xl font-bold mb-6">
          Book your stay in a smarter way
        </h1>

        <p className="text-gray-400 text-lg mb-6">
          AI-powered booking assistant. Fast, smart and automatic.
        </p>

        <div className="flex gap-4">
          <div className="bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-xl font-bold">24/7</p>
            <p className="text-sm text-gray-400">Requests</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-xl font-bold">AI</p>
            <p className="text-sm text-gray-400">Assistant</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-xl font-bold">Fast</p>
            <p className="text-sm text-gray-400">Response</p>
          </div>
        </div>
      </div>

      {/* FORM SIMPLIFIED */}
      <div className="bg-white text-black p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Quick Booking</h2>

        <p className="text-sm text-gray-600">
          Use AI assistant (bottom-right) to book automatically.
        </p>
      </div>
    </div>

    {/* CHAT WIDGET */}
    <div className="fixed bottom-5 right-5">
      <div className="w-[350px] bg-white rounded-2xl shadow-xl overflow-hidden">

        <div className="bg-black text-white p-4 font-bold">
          AI Assistant
        </div>

        <div className="h-80 overflow-y-auto p-3 space-y-2 bg-gray-100">

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl text-sm ${
                msg.from === "user"
                  ? "bg-green-500 text-white ml-auto"
                  : "bg-white"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {pendingBooking && (
            <div className="bg-white border p-3 rounded-xl">
              <b>Booking Summary</b>
              <p>Room: {pendingBooking.room}</p>
              <p>Date: {pendingBooking.checkin}</p>
              <p>Nights: {pendingBooking.nights}</p>
              <p>Guests: {pendingBooking.guests}</p>
              <p>Name: {pendingBooking.name}</p>
              <p>Email: {pendingBooking.email}</p>

              <button
                onClick={() => submitBooking(pendingBooking)}
                className="bg-green-500 text-white w-full mt-2 p-2 rounded"
              >
                Confirm Booking
              </button>
            </div>
          )}
        </div>

        <div className="flex p-2 border-t">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded p-2"
            placeholder="Ask..."
          />

          <button
            onClick={sendMessage}
            className="bg-green-500 text-white px-3 ml-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>

  </div>
);