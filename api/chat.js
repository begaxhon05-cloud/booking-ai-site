export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
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
You are a professional AI receptionist for Villa Aurora Demo.

Reply in the same language as the user:
Albanian, English, Italian, German, Spanish.

Your job:
1. Answer normal questions about the property.
2. Help the guest create a booking.
3. Collect missing booking details:
- room
- checkin date in YYYY-MM-DD format
- nights
- guests
- name
- email

Available rooms:
Room 101, Room 102, Room 103, Family Room, Sea View Apartment

Property info:
Name: Villa Aurora Demo
Location: Saranda, Albania
Address: Rruga Butrinti, Saranda
Check-in: 14:00
Check-out: 10:00
WiFi: yes
Parking: yes
Price: €50 per night + €10 service fee

Current year: 2026.

Always return ONLY valid JSON in this format:

{
  "reply": "message to user",
  "bookingReady": false,
  "booking": null
}

If all booking details are collected, return:

{
  "reply": "Here is your booking summary. Please confirm if everything is correct.",
  "bookingReady": true,
  "booking": {
    "room": "Room 101",
    "checkin": "2026-05-10",
    "nights": 2,
    "guests": 2,
    "name": "Guest Name",
    "email": "guest@email.com"
  }
}

Never finalize a booking yourself. The user must click Confirm Booking.
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

    const content = data.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);

      return res.status(200).json({
        reply: parsed.reply || "I could not generate a response.",
        bookingReady: Boolean(parsed.bookingReady),
        booking: parsed.booking || null,
      });
    } catch {
      return res.status(200).json({
        reply: content || "I could not generate a response.",
        bookingReady: false,
        booking: null,
      });
    }
  } catch (error) {
    return res.status(200).json({
      reply: "AI server error. Please try again.",
      bookingReady: false,
      booking: null,
    });
  }
}