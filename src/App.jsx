import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    checkin: "",
    nights: 1,
    guests: 1,
  });

  const [sent, setSent] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1) Dërgo email
      await emailjs.send(
        "service.booking",
        "template_vt1z08k",
        form,
        "ezj-MNGM2H6cjtxg5"
      );

      // 2) Ruaj në Google Sheets
      const params = new URLSearchParams({
        name: form.name,
        email: form.email,
        checkin: form.checkin,
        nights: String(form.nights),
        guests: String(form.guests),
      });

     await fetch(
  `https://script.google.com/macros/s/AKfycbwHmsRoPghrByk9E5w4yro_msuV5gw3-p7ys4FvXPUDNPh_XyNOH4b0GPTGYh3-WbWPxg/exec?${params.toString()}`,
  {
    method: "GET",
  }
);

      setSent(true);

      // Opsionale: pastro formularin pas suksesit
      setForm({
        name: "",
        email: "",
        checkin: "",
        nights: 1,
        guests: 1,
      });
    } catch (err) {
      console.error("Submit error:", err);
      alert("Ndodhi një gabim gjatë dërgimit.");
    }
  };

  const features = [
    {
      title: "Përgjigje instant",
      text: "Klientët marrin përgjigje brenda sekondave 24/7.",
      icon: "⚡",
    },
    {
      title: "Njoftime të menjëhershme",
      text: "Çdo rezervim dërgohet direkt në email & WhatsApp.",
      icon: "🔔",
    },
    {
      title: "Menaxhim i thjeshtë",
      text: "Kalendari i centralizuar dhe i lehtë për t’u përdorur.",
      icon: "📅",
    },
    {
      title: "Më shumë rezervime",
      text: "Më pak humbje, më shumë të ardhura për ty.",
      icon: "🛡️",
    },
  ];

  const steps = [
    {
      id: "1",
      title: "Klienti rezervon online",
      text: "Plotëson formularin ose pyet për disponueshmëri.",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "2",
      title: "Sistemi përpunon",
      text: "AI dërgon përgjigje, kontrollon kalendarin dhe konfirmon rezervimin.",
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "3",
      title: "Ti njoftohesh menjëherë",
      text: "Merr njoftime në email dhe WhatsApp.",
      image:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const testimonials = [
    {
      text: "Që kur përdor BookingAI kam 3x më shumë rezervime dhe shumë më pak punë.",
      name: "Erion T.",
      role: "Pronë në Dhërmi",
    },
    {
      text: "Më në fund nuk humbas më asnjë klient. Njoftimet në WhatsApp janë perfekte.",
      name: "Mira B.",
      role: "Apartamente në Sarandë",
    },
    {
      text: "Platforma më e lehtë që kam përdorur ndonjëherë.",
      name: "Ardit K.",
      role: "Hotel në Tiranë",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute left-[-100px] top-[180px] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-[100px]" />
      </div>

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-lg">
            ⌘
          </div>
          <span className="text-2xl font-semibold tracking-tight">
            Booking<span className="text-yellow-400">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#how" className="hover:text-white transition">
            Si funksionon
          </a>
          <a href="#form" className="hover:text-white transition">
            Demo
          </a>
          <a href="#contact" className="hover:text-white transition">
            Kontakt
          </a>
        </div>

        <a
          href="#form"
          className="rounded-xl border border-yellow-500/70 px-5 py-3 text-sm font-medium text-yellow-400 hover:bg-yellow-500 hover:text-black transition"
        >
          Kërko Demo →
        </a>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-white/5 px-4 py-2 text-xs tracking-[0.18em] text-yellow-400 uppercase">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Zgjidhja #1 për prona turistike
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
            Më shumë rezervime.
            <span className="block text-yellow-400 mt-2">Më pak stres.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
            BookingAI automatizon komunikimin, rezervimet dhe menaxhimin e
            klientëve për Airbnb, hotele dhe apartamente me qira ditore.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#form"
              className="rounded-xl bg-yellow-500 px-6 py-4 font-medium text-black hover:bg-yellow-400 transition"
            >
              Provoje për pronën tënde →
            </a>
            <a
              href="#how"
              className="rounded-xl border border-blue-500/60 px-6 py-4 font-medium text-white hover:bg-blue-500/10 transition"
            >
              ▶ Si funksionon
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {["A", "B", "C", "D"].map((item, i) => (
                <div
                  key={i}
                  className="h-12 w-12 rounded-full border-2 border-[#030712] bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-sm font-semibold text-black"
                >
                  {item}
                </div>
              ))}
            </div>

            <div>
              <div className="text-yellow-400 text-lg">★★★★★</div>
              <p className="text-sm text-gray-400">
                Besohet nga mbi 150+ prona në Shqipëri
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-2 rounded-[32px] bg-blue-600/20 blur-2xl" />

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07111f]/90 shadow-2xl">
            <div className="grid md:grid-cols-[1.25fr_0.75fr]">
              <div className="p-6 border-r border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                    ⌘
                  </div>
                  <span className="font-medium text-sm text-gray-200">
                    BookingAI
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-4">Përmbledhje</h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Rezervime</p>
                    <p className="mt-2 text-3xl font-semibold">24</p>
                    <p className="mt-1 text-xs text-green-400">+12%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Të ardhura</p>
                    <p className="mt-2 text-3xl font-semibold">€3,240</p>
                    <p className="mt-1 text-xs text-green-400">+16%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Klientë të rinj</p>
                    <p className="mt-2 text-3xl font-semibold">18</p>
                    <p className="mt-1 text-xs text-green-400">+8%</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[520px]">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
                  alt="Luxury property"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#07111f]/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {features.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-[#08111d] px-6 py-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how"
        className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16"
      >
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-yellow-400">
            Si funksionon
          </p>
          <h2 className="mt-4 text-4xl font-semibold">
            Thjeshtë, e shpejtë, automatike
          </h2>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#08111d]">
                <img
                  src={step.image}
                  alt={step.title}
                  className="h-72 w-full object-cover"
                />
                <div className="p-6">
                  <div className="mb-4 h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-lg font-semibold">
                    {step.id}
                  </div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-gray-400 leading-7">{step.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="rounded-[24px] border border-white/10 bg-[#08111d] p-6"
            >
              <div className="text-3xl text-blue-400">“</div>
              <p className="mt-3 text-gray-300 leading-7">{item.text}</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="form"
        className="relative z-10 max-w-7xl mx-auto px-6 pb-20"
      >
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#08111d] grid lg:grid-cols-[0.95fr_1.35fr]">
          <div className="relative min-h-[360px]">
            <img
              src="https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1200&q=80"
              alt="Room interior"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09121f]/95 via-[#09121f]/90 to-[#09121f]/60" />
            <div className="relative z-10 p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.25em] text-blue-400">
                Provoje tani
              </p>
              <h2 className="mt-4 text-5xl font-semibold leading-tight">
                Testo rezervimin tani
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-gray-300">
                Plotëso formularin dhe shiko sa e lehtë është të marrësh
                rezervime automatike.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Emri
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    placeholder="Emri juaj"
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/10 bg-[#050c16] px-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    placeholder="email@example.com"
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/10 bg-[#050c16] px-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Data e check-in
                  </label>
                  <input
                    type="date"
                    name="checkin"
                    value={form.checkin}
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/10 bg-[#050c16] px-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Netë
                  </label>
                  <input
                    type="number"
                    name="nights"
                    min="1"
                    value={form.nights}
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/10 bg-[#050c16] px-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Persona
                  </label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    value={form.guests}
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/10 bg-[#050c16] px-4 py-4 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-4 text-lg font-medium hover:bg-blue-500 transition"
              >
                Dërgo rezervimin →
              </button>

              <p className="text-center text-sm text-gray-400">
                Rezervimi juaj dërgohet direkt në email dhe WhatsApp.
              </p>

              {sent && (
                <p className="text-center text-green-400 font-medium">
                  Rezervimi u dërgua me sukses ✔
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="relative z-10 border-t border-white/10 mt-4"
      >
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-lg">
                ⌘
              </div>
              <span className="text-2xl font-semibold tracking-tight">
                Booking<span className="text-yellow-400">AI</span>
              </span>
            </div>

            <p className="mt-4 max-w-sm text-gray-400 leading-7">
              Platforma #1 për automatizimin e rezervimeve në Shqipëri për prona turistike.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Produkti
            </h4>
            <div className="mt-4 space-y-3 text-gray-400">
              <a href="#features" className="block hover:text-white">Features</a>
              <a href="#how" className="block hover:text-white">Si funksionon</a>
              <a href="#form" className="block hover:text-white">Demo</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Kompania
            </h4>
            <div className="mt-4 space-y-3 text-gray-400">
              <a href="#contact" className="block hover:text-white">Rreth nesh</a>
              <a href="#contact" className="block hover:text-white">Kontakt</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
              Na ndiq
            </h4>
            <div className="mt-4 flex gap-3 text-2xl text-gray-300">
              <span>ⓕ</span>
              <span>◎</span>
              <span>◉</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-sm text-gray-500">
          © 2026 BookingAI — Të gjitha të drejtat e rezervuara.
        </div>
      </footer>
    </div>
  );
}