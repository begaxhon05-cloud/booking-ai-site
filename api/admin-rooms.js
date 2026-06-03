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

    const getHotel = async (slug) => {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/hotel_accounts?select=id,hotel_name&slug=eq.${encodeURIComponent(
          slug || "villa-aurora-demo"
        )}&is_active=eq.true&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      const data = await response.json();
      return data?.[0] || null;
    };

    if (req.method === "GET") {
      const slug = req.query.slug || "villa-aurora-demo";
      const hotel = await getHotel(slug);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: "Hotel not found",
        });
      }

      const roomsRes = await fetch(
        `${supabaseUrl}/rest/v1/rooms?select=*&hotel_id=eq.${hotel.id}&order=created_at.desc`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      const rooms = await roomsRes.json();

      return res.status(200).json({
        success: true,
        hotel,
        rooms,
      });
    }

    if (req.method === "POST") {
      const {
        slug,
        name,
        description,
        price_per_night,
        max_guests,
        is_active = true,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Missing room name",
        });
      }

      const hotel = await getHotel(slug);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: "Hotel not found",
        });
      }

      const createRes = await fetch(`${supabaseUrl}/rest/v1/rooms`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hotel_id: hotel.id,
          property_id: null,
          name,
          description: description || "",
          price_per_night: Number(price_per_night || 50),
          max_guests: Number(max_guests || 2),
          is_active,
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Room creation failed",
        });
      }

      return res.status(200).json({
        success: true,
        room: data?.[0],
      });
    }

    if (req.method === "PATCH") {
      const {
        roomId,
        name,
        description,
        price_per_night,
        max_guests,
        is_active,
      } = req.body;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          error: "Missing roomId",
        });
      }

      const updatePayload = {
        name,
        description,
        price_per_night:
          price_per_night !== undefined ? Number(price_per_night) : undefined,
        max_guests: max_guests !== undefined ? Number(max_guests) : undefined,
        is_active,
      };

      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined) {
          delete updatePayload[key];
        }
      });

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`,
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

      const data = await updateRes.json();

      if (!updateRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Room update failed",
        });
      }

      return res.status(200).json({
        success: true,
        room: data?.[0],
      });
    }

    if (req.method === "DELETE") {
      const { roomId } = req.body;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          error: "Missing roomId",
        });
      }

      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/rooms?id=eq.${roomId}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            is_active: false,
          }),
        }
      );

      const data = await deleteRes.json();

      if (!deleteRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Room deactivate failed",
        });
      }

      return res.status(200).json({
        success: true,
        room: data?.[0],
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}