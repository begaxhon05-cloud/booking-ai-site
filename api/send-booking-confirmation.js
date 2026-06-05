export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const {
      hotel_slug = "villa-aurora-demo",
      name,
      email,
      room,
      checkin,
      nights,
      guests,
      total,
    } = req.body;

    if (!name || !email || !room || !checkin) {
      return res.status(400).json({
        success: false,
        error: "Missing booking data",
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const hotelRes = await fetch(
      `${supabaseUrl}/rest/v1/hotel_accounts?select=id,hotel_name,owner_email,whatsapp_number&slug=eq.${encodeURIComponent(
        hotel_slug
      )}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const hotels = await hotelRes.json();
    const hotel = hotels?.[0];

    if (!hotel) {
      return res.status(404).json({ success: false, error: "Hotel not found" });
    }

    const templatesRes = await fetch(
      `${supabaseUrl}/rest/v1/message_templates?select=*&hotel_id=eq.${hotel.id}&type=eq.booking_confirmation&is_active=eq.true`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const templates = await templatesRes.json();

    const variables = {
      name,
      email,
      hotel_name: hotel.hotel_name,
      room,
      checkin,
      nights,
      guests,
      total,
    };

    const render = (text = "") =>
      Object.entries(variables).reduce(
        (result, [key, value]) =>
          result.replaceAll(`{{${key}}}`, String(value ?? "")),
        text
      );

    const results = [];

    for (const template of templates) {
      const body = render(template.body);
      const subject = render(template.subject || "Booking Confirmation");

      if (template.channel === "whatsapp") {
        const whatsappRes = await sendWhatsApp({
          to: hotel.whatsapp_number,
          message: body,
        });

        results.push({
          channel: "whatsapp",
          success: whatsappRes.success,
          error: whatsappRes.error || null,
        });
      }

      if (template.channel === "email") {
        const clientEmail = await sendEmailJS({
          to_email: email,
          owner_email: hotel.owner_email,
          subject,
          message: body,
          name,
          room,
          checkin,
          nights,
          guests,
          total,
        });

        const ownerEmail = await sendEmailJS({
          to_email: hotel.owner_email,
          owner_email: hotel.owner_email,
          subject: `New Booking - ${hotel.hotel_name}`,
          message: body,
          name,
          room,
          checkin,
          nights,
          guests,
          total,
        });

        results.push({
          channel: "email",
          client: clientEmail,
          owner: ownerEmail,
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Confirmation failed",
    });
  }
}

async function sendWhatsApp({ to, message }) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp =
      process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (!accountSid || !authToken || !to) {
      return { success: false, error: "Missing WhatsApp config" };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromWhatsApp,
          To: `whatsapp:${to}`,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Twilio failed" };
    }

    return { success: true, sid: data.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendEmailJS(params) {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID || "service.booking",
        template_id: process.env.EMAILJS_TEMPLATE_ID || "template_vt1z08k",
        user_id: process.env.EMAILJS_PUBLIC_KEY || "ezj-MNGM2H6cjtxg5",
        template_params: {
          ...params,
          to_email: params.to_email,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}