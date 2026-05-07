export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Missing bookingId",
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/bookings?id=eq.${bookingId}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: data?.message || "Cancel failed",
      });
    }

    return res.status(200).json({
      success: true,
      booking: data?.[0] || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}