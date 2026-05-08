export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed",
      bookingReady: false,
      booking: null,
    });
  }

  try {
    const { messages = [] } = req.body;

    const normalizedMessages = normalizeMessages(messages);
    const lastUserMessage =
      normalizedMessages.filter((m) => m.role === "user").pop()?.content || "";

    const lastText = lastUserMessage.toLowerCase();

    const availabilityIntent =
      lastText.includes("lire") ||
      lastText.includes("lirë") ||
      lastText.includes("available") ||
      lastText.includes("disponueshme") ||
      lastText.includes("zene") ||
      lastText.includes("zënë") ||
      lastText.includes("booked") ||
      lastText.includes("rezervuar") ||
      lastText.includes("gusht") ||
      lastText.includes("august");

    const extractedRoom = extractRoom(lastText);
    const extractedDate = extractDate(lastText);
    const extractedMonth = extractMonth(lastText);

    if (availabilityIntent && extractedRoom && extractedMonth && !extractedDate) {
      const monthResult = await checkMonthAvailabilityFromSupabase(
        extractedRoom,
        extractedMonth
      );

      if (!monthResult.roomFound) {
        return res.status(200).json({
          reply: `Nuk e gjeta dhomën ${extractedRoom}. Dhomat janë Room 101, Room 102, Room 103, Family Room dhe Sea View Apartment.`,
          bookingReady: false,
          booking: null,
        });
      }

      if (monthResult.bookedDates.length === 0) {
        return res.status(200).json({
          reply: `${extractedRoom} nuk ka asnjë check-in të rezervuar në ${monthResult.monthName} 2026 sipas Supabase. Më jepni datën specifike që dëshironi të rezervoni.`,
          bookingReady: false,
          booking: null,
        });
      }

      return res.status(200).json({
        reply: `${extractedRoom} ka këto data check-in të zëna në ${monthResult.monthName} 2026: ${monthResult.bookedDates.join(
          ", "
        )}. Datat e tjera nuk rezultojnë të zëna në Supabase. Më jepni datën specifike që dëshironi të rezervoni.`,
        bookingReady: false,
        booking: null,
      });
    }

    if (availabilityIntent && extractedRoom && extractedDate) {
      const result = await checkAvailabilityFromSupabase(
        extractedRoom,
        extractedDate
      );

      if (!result.roomFound) {
        return res.status(200).json({
          reply: `Nuk e gjeta dhomën ${extractedRoom}. Dhomat janë Room 101, Room 102, Room 103, Family Room dhe Sea View Apartment.`,
          bookingReady: false,
          booking: null,
        });
      }

      return res.status(200).json({
        reply: result.available
          ? `${extractedRoom} është e lirë më datë ${extractedDate}. Dëshironi ta rezervoni?`
          : `${extractedRoom} është e zënë më datë ${extractedDate}. Mund të kontrolloj një datë tjetër ose një dhomë tjetër për ju.`,
        bookingReady: false,
        booking: null,
      });
    }

    if (availabilityIntent && extractedMonth && !extractedRoom) {
      return res.status(200).json({
        reply:
          "Për të kontrolluar disponueshmërinë në një muaj, më jepni edhe dhomën. Shembull: A është e lirë Room 101 në gusht?",
        bookingReady: false,
        booking: null,
      });
    }

    if (
      lastText.includes("menu") ||
      lastText.includes("ushqim") ||
      lastText.includes("restaurant") ||
      lastText.includes("breakfast") ||
      lastText.includes("mëngjes") ||
      lastText.includes("mengjes") ||
      lastText.includes("pije")
    ) {
      const menuAnswer = await getSpecificKnowledgeFromSupabase("menu");

      if (menuAnswer) {
        return res.status(200).json({
          reply: menuAnswer,
          bookingReady: false,
          booking: null,
        });
      }
    }

    const knowledgeText = await getKnowledgeFromSupabase();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are a professional AI receptionist for Villa Aurora Demo.

Always return ONLY valid JSON:
{
  "reply": "text to user",
  "bookingReady": false,
  "booking": null
}

Rules:
- Reply in the same language as the user.
- Never say a whole month is fully booked.
- If user asks availability for a month without exact date, ask for room/date.
- If user asks availability for exact date, the backend handles it before you.
- To prepare booking collect: room, checkin date YYYY-MM-DD, nights, guests, name, email.
- If booking details are complete, return bookingReady true.
- Never say booking is saved or confirmed before user confirms.

Property:
Name: Villa Aurora Demo
Location: Saranda, Albania
Address: Rruga Butrinti, Saranda
Check-in: 14:00
Check-out: 10:00
Rooms: Room 101, Room 102, Room 103, Family Room, Sea View Apartment
Price: €50 per night + €10 service fee
Current year: 2026

Hotel Knowledge Base:
${knowledgeText}
            `,
          },
          ...normalizedMessages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        reply: `AI API error: ${data.error?.message || "Unknown error"}`,
        bookingReady: false,
        booking: null,
      });
    }

    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return res.status(200).json({
      reply: parsed.reply || "Nuk munda të gjeneroj përgjigje.",
      bookingReady: Boolean(parsed.bookingReady),
      booking: parsed.booking || null,
    });
  } catch (error) {
    return res.status(200).json({
      reply: "AI server error. Please try again.",
      bookingReady: false,
      booking: null,
    });
  }
}

function normalizeMessages(messages) {
  return messages
    .map((msg) => {
      if (msg.role && msg.content) {
        return {
          role: msg.role === "bot" ? "assistant" : msg.role,
          content: msg.content,
        };
      }

      if (msg.from && msg.text) {
        return {
          role: msg.from === "user" ? "user" : "assistant",
          content: msg.text,
        };
      }

      return null;
    })
    .filter(Boolean)
    .filter((msg) => ["user", "assistant", "system"].includes(msg.role));
}

function extractRoom(text) {
  if (text.includes("101")) return "Room 101";
  if (text.includes("102")) return "Room 102";
  if (text.includes("103")) return "Room 103";
  if (text.includes("family")) return "Family Room";
  if (text.includes("familjare")) return "Family Room";
  if (text.includes("sea view")) return "Sea View Apartment";
  if (text.includes("apartment")) return "Sea View Apartment";
  if (text.includes("apartament")) return "Sea View Apartment";
  return null;
}

function extractMonth(text) {
  const months = {
    janar: { number: "01", name: "janar" },
    shkurt: { number: "02", name: "shkurt" },
    mars: { number: "03", name: "mars" },
    prill: { number: "04", name: "prill" },
    maj: { number: "05", name: "maj" },
    qershor: { number: "06", name: "qershor" },
    korrik: { number: "07", name: "korrik" },
    gusht: { number: "08", name: "gusht" },
    shtator: { number: "09", name: "shtator" },
    tetor: { number: "10", name: "tetor" },
    nentor: { number: "11", name: "nëntor" },
    nëntor: { number: "11", name: "nëntor" },
    dhjetor: { number: "12", name: "dhjetor" },
    august: { number: "08", name: "August" },
  };

  for (const [key, value] of Object.entries(months)) {
    if (text.includes(key)) return value;
  }

  return null;
}

function extractDate(text) {
  const isoMatch = text.match(/\b(2026-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const slashMatch = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](2026)\b/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    return `2026-${month}-${day}`;
  }

  const month = extractMonth(text);
  if (!month) return null;

  const regex = new RegExp(`\\b(\\d{1,2})\\s+`);
  const match = text.match(regex);

  if (match) {
    const day = match[1].padStart(2, "0");
    return `2026-${month.number}-${day}`;
  }

  return null;
}

async function checkAvailabilityFromSupabase(roomName, checkin) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const room = await getRoom(roomName, supabaseUrl, serviceKey);
  if (!room) return { roomFound: false, available: false };

  const bookingRes = await fetch(
    `${supabaseUrl}/rest/v1/bookings?select=id&room_id=eq.${room.id}&checkin=eq.${checkin}&status=eq.confirmed`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const bookings = await bookingRes.json();

  return {
    roomFound: true,
    available: Array.isArray(bookings) && bookings.length === 0,
  };
}

async function checkMonthAvailabilityFromSupabase(roomName, month) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const room = await getRoom(roomName, supabaseUrl, serviceKey);
  if (!room) {
    return {
      roomFound: false,
      bookedDates: [],
      monthName: month.name,
    };
  }

  const startDate = `2026-${month.number}-01`;
  const endDate = `2026-${month.number}-31`;

  const bookingRes = await fetch(
    `${supabaseUrl}/rest/v1/bookings?select=checkin&room_id=eq.${room.id}&checkin=gte.${startDate}&checkin=lte.${endDate}&status=eq.confirmed`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const bookings = await bookingRes.json();

  return {
    roomFound: true,
    bookedDates: Array.isArray(bookings) ? bookings.map((b) => b.checkin) : [],
    monthName: month.name,
  };
}

async function getRoom(roomName, supabaseUrl, serviceKey) {
  const roomRes = await fetch(
    `${supabaseUrl}/rest/v1/rooms?select=id,name&name=eq.${encodeURIComponent(
      roomName
    )}&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const rooms = await roomRes.json();
  return rooms?.[0] || null;
}

async function getKnowledgeFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return "";

  const response = await fetch(
    `${supabaseUrl}/rest/v1/hotel_knowledge?select=question,answer`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const data = await response.json();

  if (!Array.isArray(data)) return "";

  return data
    .map((item) => `Question: ${item.question}\nAnswer: ${item.answer}`)
    .join("\n\n");
}

async function getSpecificKnowledgeFromSupabase(keyword) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return "";

  const response = await fetch(
    `${supabaseUrl}/rest/v1/hotel_knowledge?select=question,answer`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const data = await response.json();

  if (!Array.isArray(data)) return "";

  const found = data.find(
    (item) =>
      item.question?.toLowerCase().includes(keyword) ||
      item.answer?.toLowerCase().includes(keyword)
  );

  return found?.answer || "";
}