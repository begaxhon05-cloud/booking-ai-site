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
      `${supabaseUrl}/rest/v1/bookings?select=id,checkin,nights,guests,total,status,source,created_at,customers(id,full_name,email,phone),rooms(name)&hotel_id=eq.${hotel.id}&order=created_at.desc`,
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
        error: bookings?.message || "CRM fetch failed",
      });
    }

    const customersMap = {};

    for (const booking of bookings || []) {
      const customer = booking.customers;

      if (!customer?.id) continue;

      if (!customersMap[customer.id]) {
        customersMap[customer.id] = {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          total_bookings: 0,
          active_bookings: 0,
          cancelled_bookings: 0,
          total_revenue: 0,
          last_booking_date: null,
          bookings: [],
        };
      }

      const record = customersMap[customer.id];

      record.total_bookings += 1;

      if (booking.status === "cancelled") {
        record.cancelled_bookings += 1;
      } else {
        record.active_bookings += 1;
        record.total_revenue += Number(booking.total || 0);
      }

      if (!record.last_booking_date || booking.created_at > record.last_booking_date) {
        record.last_booking_date = booking.created_at;
      }

      record.bookings.push({
        id: booking.id,
        room: booking.rooms?.name || "-",
        checkin: booking.checkin,
        nights: booking.nights,
        guests: booking.guests,
        total: booking.total,
        status: booking.status,
        source: booking.source,
        created_at: booking.created_at,
      });
    }

    const customers = Object.values(customersMap).sort(
      (a, b) => new Date(b.last_booking_date) - new Date(a.last_booking_date)
    );

    const totalCustomers = customers.length;
    const returningCustomers = customers.filter(
      (customer) => customer.total_bookings > 1
    ).length;

    const totalRevenue = customers.reduce(
      (sum, customer) => sum + Number(customer.total_revenue || 0),
      0
    );

    return res.status(200).json({
      success: true,
      hotel,
      summary: {
        total_customers: totalCustomers,
        returning_customers: returningCustomers,
        total_revenue: totalRevenue,
      },
      customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}