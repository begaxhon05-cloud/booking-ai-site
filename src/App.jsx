import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import "./App.css";
import { propertyInfo } from "./propertyInfo";

export default function App() {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState({});

  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi! I am the AI assistant for ${propertyInfo.name}. Ask me anything about the property, booking, location, rooms or services.`,
    },
  ]);

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
  const totalPrice = Number(form.nights) * pricePerNight + serviceFee;

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  useEffect(() => {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getBookedDates`)
      .then((res) => res.json())
      .then((data) => setBookedDates(data))
      .catch((error) => console.error("Booked dates error:", error));
  }, []);

  const selectedRoomBookedDates = bookedDates[form.room] || [];
  const isRoomBooked = selectedRoomBookedDates.includes(form.checkin);

  const sendMessage = async () => {
    if (!question.trim() || chatLoading) return;

    const userQuestion = question;

    const userMsg = {
      from: "user",
      text: userQuestion,
    };

    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setQuestion("");
    setChatLoading(true);

    try {
      const aiMessages = updatedMessages.map((msg) => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: aiMessages }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.reply || "I could not generate a response.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "AI error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const next = () => {
    if (step === 1 && isRoomBooked) {
      alert(
        "This room is already booked for this date. Please choose another room or date."
      );
      return;
    }

    setStep((prev) => prev + 1);
  };

  const back = () => setStep((prev) => prev - 1);

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

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isRoomBooked) {
      alert(
        "This room is already booked for this date. Please choose another room or date."
      );
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      await emailjs.send(
        "service.booking",
        "template_vt1z08k",
        form,
        "ezj-MNGM2H6cjtxg5"
      );

      const params = new URLSearchParams({
        name: form.name,
        email: form.email,
        checkin: form.checkin,
        nights: String(form.nights),
        guests: String(form.guests),
        room: form.room,
      });

      await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
      });

      setSent(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
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
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-2xl transition"
          >
            New Booking
          </button>
        </div>
      </div>
    );
  }

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
              Send booking requests instantly with email, Google Sheets,
              WhatsApp automation and AI assistance.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-slate-400">Requests</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm text-slate-400">Assistant</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">Fast</p>
                <p className="text-sm text-slate-400">Response</p>
              </div>
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
                  className="h-full bg-green-500 transition-all"
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
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {form.checkin && isRoomBooked && (
                      <p className="text-red-500 text-sm mt-2 font-semibold">
                        This room is already booked for this date. Choose another
                        room or date.
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
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
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
                  <div>
                    <h3 className="text-xl font-bold mb-1">Guests</h3>
                    <p className="text-slate-500 mb-5">
                      How many guests will stay?
                    </p>
                  </div>

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
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="w-full border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      disabled={!form.guests}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-2xl transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Your Info</h3>
                    <p className="text-slate-500 mb-5">
                      Add your contact details.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={onChange}
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={onChange}
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="w-full border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      disabled={!form.name || !form.email}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-2xl transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Confirm Booking</h3>
                    <p className="text-slate-500 mb-5">
                      Review your booking request before sending.
                    </p>
                  </div>

                  <div className="bg-slate-100 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-semibold">{form.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="font-semibold">{form.email}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Room</span>
                      <span className="font-semibold">{form.room}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-in</span>
                      <span className="font-semibold">{form.checkin}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Nights</span>
                      <span className="font-semibold">{form.nights}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Guests</span>
                      <span className="font-semibold">{form.guests}</span>
                    </div>

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
                      className="w-full border border-slate-300 hover:bg-slate-100 font-semibold py-3 rounded-2xl transition"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-2xl transition"
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

      <div className="fixed bottom-5 right-5 z-50">
        {chatOpen && (
          <div className="mb-4 w-[320px] rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden">
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
            </div>

            <div className="p-3 border-t border-slate-200 flex gap-2">
              <input
                value={question}
                disabled={chatLoading}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask something..."
                className="flex-1 border border-slate-300 rounded-2xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100"
              />

              <button
                type="button"
                disabled={chatLoading}
                onClick={sendMessage}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-2xl px-4 text-sm font-semibold"
              >
                {chatLoading ? "..." : "Send"}
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
    </div>
  );
}