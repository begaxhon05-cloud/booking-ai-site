export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables",
      });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const tomorrowDate = `${yyyy}-${mm}-${dd}`;

    const bookingsRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?select=id,checkin,nights,guests,total,status,hotel_accounts(id,hotel_name,owner_email,whatsapp_number),customers(full_name,email,phone),rooms(name)&checkin=eq.${tomorrowDate}&status=eq.confirmed`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const bookings = await bookingsRes.json();

    if (!Array.isArray(bookings)) {
      return res.status(500).json({
        success: false,
        error: "Bookings fetch failed",
      });
    }

    const results = [];

    for (const booking of bookings) {
      const hotel = booking.hotel_accounts;
      const customer = booking.customers;
      const room = booking.rooms;

      if (!hotel?.id || !customer?.email) continue;

      const templatesRes = await fetch(
        `${supabaseUrl}/rest/v1/message_templates?select=*&hotel_id=eq.${hotel.id}&type=eq.checkin_reminder&is_active=eq.true`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      const templates = await templatesRes.json();

      const variables = {
        name: customer.full_name,
        email: customer.email,
        hotel_name: hotel.hotel_name,
        room: room?.name || "",
        checkin: booking.checkin,
        nights: booking.nights,
        guests: booking.guests,
        total: booking.total,
      };

      const render = (text = "") =>
        Object.entries(variables).reduce(
          (result, [key, value]) =>
            result.replaceAll(`{{${key}}}`, String(value ?? "")),
          text
        );

      for (const template of templates) {
        const body = render(template.body);
        const subject = render(template.subject || "Check-in Reminder");

        if (template.channel === "whatsapp") {
          const whatsappResult = await sendWhatsApp({
            to: hotel.whatsapp_number,
            message: body,
          });

          results.push({
            booking_id: booking.id,
            channel: "whatsapp",
            result: whatsappResult,
          });
        }

        if (template.channel === "email") {
          const emailResult = await sendEmailJS({
            to_email: customer.email,
            owner_email: hotel.owner_email,
            subject,
            message: body,
            name: customer.full_name,
            room: room?.name || "",
            checkin: booking.checkin,
            nights: booking.nights,
            guests: booking.guests,
            total: booking.total,
          });

          results.push({
            booking_id: booking.id,
            channel: "email",
            result: emailResult,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      date_checked: tomorrowDate,
      bookings_found: bookings.length,
      messages_sent: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Automation failed",
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