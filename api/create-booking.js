export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const booking = req.body;

    const required = ["room", "checkin", "nights", "guests", "name", "email"];

    for (const field of required) {
      if (!booking[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing field: ${field}`,
        });
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        success: false,
        error: "Missing Supabase environment variables",
      });
    }

    const hotelSlug = booking.hotel_slug || "villa-aurora-demo";

    const hotelRes = await fetch(
      `${supabaseUrl}/rest/v1/hotel_accounts?select=id,hotel_name&slug=eq.${encodeURIComponent(
        hotelSlug
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
      return res.status(500).json({
        success: false,
        error: "Hotel account not found",
      });
    }

    const propertyRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?select=id&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const properties = await propertyRes.json();
    const propertyId = properties?.[0]?.id;

    if (!propertyId) {
      return res.status(500).json({
        success: false,
        error: "Property not found",
      });
    }

    const roomRes = await fetch(
  `${supabaseUrl}/rest/v1/rooms?select=id,name,price_per_night&hotel_id=eq.${hotel.id}&name=eq.${encodeURIComponent(
    booking.room
  )}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const rooms = await roomRes.json();
    const room = rooms?.[0];

    if (!room) {
      return res.status(400).json({
        success: false,
        error: "Room not found",
      });
    }

    const availabilityRes = await fetch(
      `${supabaseUrl}/rest/v1/bookings?select=id&hotel_id=eq.${hotel.id}&room_id=eq.${room.id}&checkin=eq.${booking.checkin}&status=eq.confirmed`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const existingBookings = await availabilityRes.json();

    if (existingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Room already booked for this date",
      });
    }

    const customerRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        full_name: booking.name,
        email: booking.email,
        phone: booking.phone || null,
      }),
    });

    const customers = await customerRes.json();
    const customer = customers?.[0];

    if (!customer?.id) {
      return res.status(500).json({
        success: false,
        error: "Customer creation failed",
      });
    }

    const total =
      Number(booking.nights) * Number(room.price_per_night || 50) + 10;

    const bookingRes = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        hotel_id: hotel.id,
        property_id: propertyId,
        room_id: room.id,
        customer_id: customer.id,
        checkin: booking.checkin,
        nights: Number(booking.nights),
        guests: Number(booking.guests),
        total,
        status: "confirmed",
        source: booking.source || "website_ai",
      }),
    });

    const createdBookings = await bookingRes.json();
    const createdBooking = createdBookings?.[0];

    if (!createdBooking?.id) {
      return res.status(500).json({
        success: false,
        error: "Booking creation failed",
      });
    }

    return res.status(200).json({
      success: true,
      booking: createdBooking,
      total,
      hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}