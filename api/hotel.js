export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const slug = req.query.slug || "villa-aurora-demo";

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables",
      });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/hotel_accounts?select=*&slug=eq.${encodeURIComponent(
        slug
      )}&is_active=eq.true&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: data?.message || "Supabase error",
      });
    }

    const hotel = data?.[0];

    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}