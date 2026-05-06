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

    const availability = await getAvailabilityFromSupabase();

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

Rules:
- Reply in the same language as the user.
- Supported languages: Albanian, English, Italian, German, Spanish.
- Never say booking is saved, confirmed, finalized, or email sent before confirmation.
- To prepare booking collect: room, checkin date YYYY-MM-DD, nights, guests, name, email.
- If info is missing, ask only for missing info.
- If user asks availability, check the availability data below.
- If requested date exists in availability[room], that room is booked.
- If requested date does not exist in availability[room], that room is available.
- If requested room is booked, suggest another room if available.
- If all booking details are present and room is available, return bookingReady true.
- If all booking details are present but room is booked, bookingReady must be false and suggest another room/date.

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

Live availability from Supabase:
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