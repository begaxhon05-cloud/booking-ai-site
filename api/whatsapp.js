export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const userMessage = body.Body || "";
    const fromNumber = body.From || "";

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `
You are a professional AI receptionist for Villa Aurora Demo.

Reply in the same language as the user:
Albanian, English, Italian, German, Spanish.

Be short, helpful and professional.

Property info:
Name: Villa Aurora Demo
Location: Saranda, Albania
Address: Rruga Butrinti, Saranda
Check-in: 14:00
Check-out: 10:00
WiFi: yes
Parking: yes
Rooms: Room 101, Room 102, Room 103, Family Room, Sea View Apartment
Price: €50 per night + €10 service fee

If the user wants to book, collect:
room, check-in date, nights, guests, name, email.
Do not finalize booking yet. Ask for confirmation first.
            `,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    const data = await aiResponse.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response right now.";

    const twiml = `
<Response>
  <Message>${escapeXml(reply)}</Message>
</Response>`;

    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(twiml);
  } catch (error) {
    const twiml = `
<Response>
  <Message>AI assistant error. Please try again.</Message>
</Response>`;

    res.setHeader("Content-Type", "text/xml");
    return res.status(200).send(twiml);
  }
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}