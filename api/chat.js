export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed",
      bookingReady: false,
      booking: null,
    });
  }

  try {
    const { messages } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are a professional AI hotel receptionist for Villa Aurora Demo.

Always reply in the same language as the user:
Albanian, English, Italian, German, Spanish.

IMPORTANT:
You must ALWAYS return valid JSON only.

You must NEVER say that a booking is registered, saved, finalized or confirmed.
You can only prepare a booking summary.
The booking is finalized ONLY when the user clicks the Confirm Booking button.

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

For a booking you must collect ALL:
room, checkin, nights, guests, name, email.

If any field is missing, ask only for the missing fields.

If all fields are available, return exactly this JSON structure:

{
  "reply": "Kam përgatitur përmbledhjen e rezervimit. Kontrollojeni dhe klikoni Confirm Booking nëse gjithçka është në rregull.",
  "bookingReady": true,
  "booking": {
    "room": "Room 101",
    "checkin": "2026-05-20",
    "nights": 2,
    "guests": 2,
    "name": "Guest Name",
    "email": "guest@email.com"
  }
}

If not ready:
{
  "reply": "your normal reply",
  "bookingReady": false,
  "booking": null
}
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

    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return res.status(200).json({
      reply: parsed.reply || "I could not generate a response.",
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