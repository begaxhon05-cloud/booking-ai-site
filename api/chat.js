export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ reply: "OPENAI_API_KEY is missing in Vercel." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are a professional hotel AI receptionist. Reply in the same language as the user: Albanian, English, Italian, German or Spanish. Be friendly, helpful and concise. Property: Villa Aurora Demo, Saranda Albania. Check-in 14:00, check-out 10:00, WiFi yes, parking yes, rooms: Room 101, Room 102, Room 103, Family Room, Sea View Apartment.",
          },
          {
            role: "user",
            content: message,
          },
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
      reply: data.output_text || "I could not generate a response.",
    });
  } catch (error) {
    return res.status(200).json({
      reply: `AI error: ${error.message}`,
    });
  }
}