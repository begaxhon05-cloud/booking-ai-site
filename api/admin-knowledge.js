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

      const knowledgeRes = await fetch(
        `${supabaseUrl}/rest/v1/hotel_knowledge?select=*&hotel_id=eq.${hotel.id}&order=created_at.desc`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      const knowledge = await knowledgeRes.json();

      return res.status(200).json({
        success: true,
        hotel,
        knowledge,
      });
    }

    if (req.method === "POST") {
      const { slug, question, answer } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          error: "Question and answer are required",
        });
      }

      const hotel = await getHotel(slug);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          error: "Hotel not found",
        });
      }

      const createRes = await fetch(`${supabaseUrl}/rest/v1/hotel_knowledge`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hotel_id: hotel.id,
          question,
          answer,
        }),
      });

      const data = await createRes.json();

      if (!createRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Knowledge creation failed",
        });
      }

      return res.status(200).json({
        success: true,
        item: data?.[0],
      });
    }

    if (req.method === "PATCH") {
      const { id, question, answer } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing knowledge id",
        });
      }

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/hotel_knowledge?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            question,
            answer,
          }),
        }
      );

      const data = await updateRes.json();

      if (!updateRes.ok) {
        return res.status(500).json({
          success: false,
          error: data?.message || "Knowledge update failed",
        });
      }

      return res.status(200).json({
        success: true,
        item: data?.[0],
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing knowledge id",
        });
      }

      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/hotel_knowledge?id=eq.${id}`,
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
          error: data?.message || "Knowledge delete failed",
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