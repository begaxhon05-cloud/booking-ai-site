export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed", bookingReady: false, booking: null });
  }

  try {
    const { messages = [], availability = {} } = req.body;

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
You are a professional AI hotel receptionist for Villa Aurora Demo.

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
- Reply in same language as user: Albanian, English, Italian, German, Spanish.
- Never say booking is saved/confirmed/finalized before confirmation.
- To prepare booking collect: room, checkin date YYYY-MM-DD, nights, guests, name, email.
- If info is missing, ask only for missing info.
- If user asks availability, check availability object.
- If date exists in availability[room], room is booked.
- If date does not exist in availability[room], room is available.
- If requested room is booked, suggest another room.

Property:
Villa Aurora Demo
Location: Saranda, Albania
Address: Rruga Butrinti, Saranda
Check-in: 14:00
Check-out: 10:00
WiFi: yes
Parking: yes
Rooms: Room 101, Room 102, Room 103, Family Room, Sea View Apartment
Price: €50 per night + €10 service fee
Current year: 2026

Availability:
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