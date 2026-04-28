import { useState } from "react";
import emailjs from "@emailjs/browser";
import "./App.css";

export default function App() {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

const [form, setForm] = useState({
  name: "",
  email: "",
  checkin: "",
  nights: 1,
  guests: 1,
});

const pricePerNight = 50;
const serviceFee = 10;
const totalPrice = Number(form.nights) * pricePerNight + serviceFee;

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec";

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const next = () => {
    setStep((prev) => prev + 1);
  };

  const back = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
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
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="text-3xl font-bold mb-3">Booking Sent</h1>
          <p className="text-slate-300 mb-6">
            Your request was sent successfully. We will contact you shortly.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setStep(1);
              setForm({
                name: "",
                email: "",
                checkin: "",
                nights: 1,
                guests: 1,
              });
            }}
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
              Send booking requests instantly with email, Google Sheets and
              WhatsApp automation.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-slate-400">Requests</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">AI</p>
                <p className="text-sm text-slate-400">Ready</p>
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
                      Choose your check-in date and number of nights.
                    </p>
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
                      required
                      className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                    />
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

  {/* PRICE SECTION */}
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
      <span className="font-bold text-green-600">€{totalPrice}</span>
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
    </div>
  );
}