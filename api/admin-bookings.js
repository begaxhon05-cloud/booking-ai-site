export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const slug = req.query.slug || "villa-aurora-demo";

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables",
      });
    }

    const hotelRes = await fetch(
      `${supabaseUrl}/rest/v1/hotel_accounts?select=id,hotel_name&slug=eq.${encodeURIComponent(
        slug
      )}&is_active=eq.true&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const hotels = await hotelRes.json();
    const hotel = hotels?.[0];

    if (!hotel?.id) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    const bookingsRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?select=*,customers(full_name,email,phone),rooms(name)&hotel_id=eq.${hotel.id}&order=created_at.desc`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const bookings = await bookingsRes.json();

    if (!bookingsRes.ok) {
      return res.status(500).json({
        success: false,
        error: bookings?.message || "Bookings fetch failed",
      });
    }

    return res.status(200).json({
      success: true,
      hotel,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}