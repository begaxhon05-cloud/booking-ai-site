export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "OPENAI_API_KEY missing"
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a professional hotel assistant.
Answer in the same language as the user (Albanian, English, Italian, German, Spanish).
Be friendly and helpful.
            `,
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    console.log("OPENAI RESPONSE:", data);

    const reply =
      data.choices?.[0]?.message?.content ||
      "AI could not respond.";

    res.status(200).json({ reply });

  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      reply: "Server error. Check logs."
    });
  }
}