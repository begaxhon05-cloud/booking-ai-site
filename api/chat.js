export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a professional hotel assistant.

You speak:
- Albanian
- English
- Italian
- German
- Spanish

Always reply in the SAME language as the user.

Be friendly and helpful.

Hotel Info:
Location: Tirana center
Check-in: 14:00
Check-out: 11:00
WiFi: Yes
Parking: Yes
Rooms: Standard, Deluxe
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    res.status(200).json({
      reply: data.choices[0].message.content,
    });

  } catch (error) {
    res.status(500).json({ error: "AI error" });
  }
}