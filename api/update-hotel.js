export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const {
      slug,
      hotel_name,
      owner_name,
      owner_email,
      owner_phone,
      location,
      address,
      primary_color,
      whatsapp_number,
      logo_url,
      cover_image_url,
    } = req.body;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Missing hotel slug",
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables",
      });
    }

    const updatePayload = {
      hotel_name,
      owner_name,
      owner_email,
      owner_phone,
      location,
      address,
      primary_color,
      whatsapp_number,
      logo_url,
      cover_image_url,
    };

    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/hotel_accounts?slug=eq.${encodeURIComponent(
        slug
      )}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: data?.message || "Hotel update failed",
      });
    }

    return res.status(200).json({
      success: true,
      hotel: data?.[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}