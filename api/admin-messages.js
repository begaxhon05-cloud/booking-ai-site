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

      const templatesRes = await fetch(
        `${supabaseUrl}/rest/v1/message_templates?select=*&hotel_id=eq.${hotel.id}&order=created_at.desc`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      const templates = await templatesRes.json();

      return res.status(200).json({
        success: true,
        hotel,
        templates,
      });
    }

    if (req.method === "POST") {
      const { slug, type, channel, subject, body, is_active = true } = req.body;

      if (!type || !channel || !body) {
        return res.status(400).json({
          success: false,
          error: "Missing type, channel or body",
        });
      }

      const hotel = await getHotel(slug);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: "Hotel not found",
        });
      }

      const createRes = await fetch(`${supabaseUrl}/rest/v1/message_templates`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hotel_id: hotel.id,
          type,
          channel,
          subject: subject || "",
          body,
          is_active,
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Template creation failed",
        });
      }

      return res.status(200).json({
        success: true,
        template: data?.[0],
      });
    }

    if (req.method === "PATCH") {
      const { id, type, channel, subject, body, is_active } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing template id",
        });
      }

      const payload = {
        type,
        channel,
        subject,
        body,
        is_active,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/message_templates?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await updateRes.json();

      if (!updateRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Template update failed",
        });
      }

      return res.status(200).json({
        success: true,
        template: data?.[0],
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing template id",
        });
      }

      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/message_templates?id=eq.${id}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      if (!deleteRes.ok) {
        const data = await deleteRes.json();

        return res.status(500).json({
          success: false,
          error: data?.message || "Template delete failed",
        });
      }

      return res.status(200).json({
        success: true,
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