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

    const { room, checkin } = req.query;

    if (!room || !checkin) {
      return res.status(400).json({
        success: false,
        error: "Missing room or checkin",
      });
    }

    const roomRes = await fetch(
      `${supabaseUrl}/rest/v1/rooms?select=id,name&name=eq.${encodeURIComponent(
        room
      )}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const rooms = await roomRes.json();
    const selectedRoom = rooms?.[0];

    if (!selectedRoom) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    const bookingRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?select=id&room_id=eq.${selectedRoom.id}&checkin=eq.${checkin}&status=eq.confirmed`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const bookings = await bookingRes.json();

    return res.status(200).json({
      success: true,
      room: selectedRoom.name,
      checkin,
      available: bookings.length === 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}