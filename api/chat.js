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
        messages: [
          {
            role: "system",
            content: `
You are a professional AI receptionist for Villa Aurora Demo.

Reply in the same language as the user:
Albanian, English, Italian, German, Spanish.

You help with:
- greetings
- location
- rooms
- prices
- parking
- WiFi
- booking questions
- check-in/check-out
- general hotel questions

Be friendly, short and clear.

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
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "I could not generate a response.",
    });
  } catch (error) {
    return res.status(200).json({
      reply: "AI server error. Please try again.",
    });
  }
}