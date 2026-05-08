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

    const lastUserMessage =
      messages.filter((m) => m.role === "user").pop()?.content || "";

    const lastText = lastUserMessage.toLowerCase();

    const availabilityIntent =
      lastText.includes("lire") ||
      lastText.includes("lirë") ||
      lastText.includes("available") ||
      lastText.includes("disponueshme") ||
      lastText.includes("zene") ||
      lastText.includes("zënë") ||
      lastText.includes("booked") ||
      lastText.includes("rezervuar");

    const extractedRoom = extractRoom(lastText);
    const extractedDate = extractDate(lastText);

    if (
      availabilityIntent &&
      (lastText.includes("gusht") || lastText.includes("august")) &&
      !extractedDate
    ) {
      return res.status(200).json({
        reply:
          "Për të kontrolluar disponueshmërinë në gusht, më jepni një datë specifike, p.sh. 2026-08-10 ose 10 gusht 2026.",
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
          reply: `Nuk e gjeta dhomën ${extractedRoom}. Dhomat e disponueshme janë Room 101, Room 102, Room 103, Family Room dhe Sea View Apartment.`,
          bookingReady: false,
          booking: null,
        });
      }

      if (result.available) {
        return res.status(200).json({
          reply: `${extractedRoom} është e lirë më datë ${extractedDate}. Dëshironi ta rezervoni?`,
          bookingReady: false,
          booking: null,
        });
      }

      return res.status(200).json({
        reply: `${extractedRoom} është e zënë më datë ${extractedDate}. Mund të kontrolloj një datë tjetër ose një dhomë tjetër për ju.`,
        bookingReady: false,
        booking: null,
      });
    }

    if (availabilityIntent && (!extractedRoom || !extractedDate)) {
      return res.status(200).json({
        reply:
          "Për të kontrolluar saktë disponueshmërinë, më jepni dhomën dhe datën specifike. Shembull: A është e lirë Room 101 më 2026-08-10?",
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

    const availability = await getAvailabilityFromSupabase();
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

If booking details are complete:
{
  "reply": "Kam përgatitur përmbledhjen e rezervimit. Kontrollojeni dhe konfirmojeni duke shkruar po/yes/confirm ose duke klikuar Confirm Booking.",
  "bookingReady": true,
  "booking": {
    "room": "Room 101",
    "checkin": "2026-06-28",
    "nights": 2,
    "guests": 2,
    "name": "Xhon Bega",
    "email": "test@test.com"
  }
}

Important rules:
- Reply in the same language as the user.
- Supported languages: Albanian, English, Italian, German, Spanish.
- Never say booking is saved, confirmed, finalized, or email sent before confirmation.
- To prepare booking collect: room, checkin date YYYY-MM-DD, nights, guests, name, email.
- If info is missing, ask only for missing info.
- Do not claim a whole month is booked unless every date is confirmed booked.
- If user asks about availability without an exact date, ask for a specific date.
- If all booking details are present, use the availability data below only for exact date match.
- If requested exact date exists in availability[room], that room is booked.
- If requested exact date does not exist in availability[room], that room is available.
- If all booking details are present and room is available, return bookingReady true.
- If room is booked, bookingReady must be false and suggest another room/date.
- For hotel questions like parking, wifi, menu, breakfast, pets, location, use Hotel Knowledge Base.

Property:
Name: Villa Aurora Demo
Location: Saranda, Albania
Address: Rruga Butrinti, Saranda
Check-in: 14:00
Check-out: 10:00
WiFi: yes
Parking: yes
Rooms: Room 101, Room 102, Room 103, Family Room, Sea View Apartment
Price: €50 per night + €10 service fee
Current year: 2026

Hotel Knowledge Base:
${knowledgeText}

Booked exact check-in dates from Supabase:
${JSON.stringify(availability)}
            `,
          },
          ...messages,
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

function extractDate(text) {
  const isoMatch = text.match(/\b(2026-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const slashMatch = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](2026)\b/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    return `2026-${month}-${day}`;
  }

  const months = {
    janar: "01",
    shkurt: "02",
    mars: "03",
    prill: "04",
    maj: "05",
    qershor: "06",
    korrik: "07",
    gusht: "08",
    shtator: "09",
    tetor: "10",
    nentor: "11",
    nëntor: "11",
    dhjetor: "12",
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  for (const [monthName, monthNumber] of Object.entries(months)) {
    const regex = new RegExp(`\\b(\\d{1,2})\\s+${monthName}\\s*(2026)?\\b`);
    const match = text.match(regex);

    if (match) {
      const day = match[1].padStart(2, "0");
      return `2026-${monthNumber}-${day}`;
    }
  }

  return null;
}

async function checkAvailabilityFromSupabase(roomName, checkin) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      roomFound: false,
      available: false,
    };
  }

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
  const room = rooms?.[0];

  if (!room) {
    return {
      roomFound: false,
      available: false,
    };
  }

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

async function getAvailabilityFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return {};

  const response = await fetch(
    `${supabaseUrl}/rest/v1/bookings?select=checkin,rooms(name)&status=eq.confirmed`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  const bookings = await response.json();
  const availability = {};

  if (!Array.isArray(bookings)) return availability;

  for (const booking of bookings) {
    const roomName = booking.rooms?.name;
    const checkin = booking.checkin;

    if (!roomName || !checkin) continue;

    if (!availability[roomName]) {
      availability[roomName] = [];
    }

    availability[roomName].push(checkin);
  }

  return availability;
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