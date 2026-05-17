export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "Missing text" });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Missing ELEVENLABS_API_KEY",
      });
    }

    const cleanText = String(text)
      .replace(/✅|❌|🎤|🎙️|🔥|🚀/g, "")
      .replace(/\n/g, ". ")
      .slice(0, 1800);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ success: false, error: errorText });
    }

    const audioBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "ElevenLabs TTS error",
    });
  }
}