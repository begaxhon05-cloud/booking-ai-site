export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing to or message",
      });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (!accountSid || !authToken) {
      return res.status(500).json({
        success: false,
        error: "Missing Twilio environment variables",
      });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: fromWhatsApp,
      To: `whatsapp:${to}`,
      Body: message,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: data.message || "Twilio error",
      });
    }

    return res.status(200).json({
      success: true,
      sid: data.sid,
      status: data.status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}