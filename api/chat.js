export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed",
      bookingReady: false,
      booking: null,
    });
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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hotel_ai_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["reply", "bookingReady", "booking"],
              properties: {
                reply: { type: "string" },
                bookingReady: { type: "boolean" },
                booking: {
                  anyOf: [
                    {
                      type: "object",
                      additionalProperties: false,
                      required: [
                        "room",
                        "checkin",
                        "nights",
                        "guests",
                        "name",
                        "email",
                      ],
                      properties: {
                        room: { type: "string" },
                        checkin: { type: "string" },
                        nights: { type: "number" },
                        guests: { type: "number" },
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                    },
                    { type: "null" },
                  ],
                },
              },
            },
          },
        },
        messages: [
          {
            role: "system",
            content: `
You are a professional AI receptionist for Villa Aurora Demo.

ALWAYS return valid JSON only.

Reply in the same language as the user: Albanian, English, Italian, German, Spanish.

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

Availability by room:
${JSON.stringify(availability)}

IMPORTANT RULES:
- Never say booking is registered, saved, confirmed, finalized, or email sent.
- Booking is finalized only by the website after user confirms.
- If user asks if a room/date is available, check Availability by room.
- If date is listed for that room, it is booked.
- If date is not listed for that room, it is available.
- To prepare booking collect: room, checkin date YYYY-MM-DD, nights, guests, name, email.
- If any field is missing, ask only for missing fields.
- If all fields are present, set bookingReady true and return booking object.
- In reply say: "Kam përgatitur përmbledhjen e rezervimit. Kontrollojeni dhe konfirmojeni duke shkruar po/yes/confirm ose duke klikuar Confirm Booking."
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

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(200).json({
      reply: "AI server error. Please try again.",
      bookingReady: false,
      booking: null,
    });
  }
}