import { useEffect, useState } from "react";

export default function MessagingCenter({ hotelSlug }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    type: "booking_confirmation",
    channel: "email",
    subject: "Booking Confirmation",
    body: "",
    is_active: true,
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin-messages?slug=${hotelSlug}`);
      const data = await res.json();

      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Messaging fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [hotelSlug]);

  const addTemplate = async () => {
    if (!newTemplate.type.trim() || !newTemplate.channel.trim() || !newTemplate.body.trim()) {
      alert("Type, channel and body are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: hotelSlug,
          ...newTemplate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Template creation failed.");
        return;
      }

      setNewTemplate({
        type: "booking_confirmation",
        channel: "email",
        subject: "Booking Confirmation",
        body: "",
        is_active: true,
      });

      await fetchTemplates();
    } catch (error) {
      alert("Template creation failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = async (template) => {
    if (!template.type?.trim() || !template.channel?.trim() || !template.body?.trim()) {
      alert("Type, channel and body are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-messages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: template.id,
          type: template.type,
          channel: template.channel,
          subject: template.subject,
          body: template.body,
          is_active: template.is_active,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Template update failed.");
        return;
      }

      await fetchTemplates();
    } catch (error) {
      alert("Template update failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message template?"
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin-messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Template delete failed.");
        return;
      }

      await fetchTemplates();
    } catch (error) {
      alert("Template delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateLocalTemplate = (id, field, value) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id
          ? {
              ...template,
              [field]: value,
            }
          : template
      )
    );
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">Messaging Center</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage email and WhatsApp templates for confirmations and guest communication.
          </p>
        </div>

        <button
          onClick={fetchTemplates}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh Templates
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl p-5 mb-6">
        <h3 className="font-bold mb-4">Add New Template</h3>

        <div className="grid md:grid-cols-4 gap-3 mb-3">
          <select
            value={newTemplate.type}
            onChange={(e) =>
              setNewTemplate((prev) => ({ ...prev, type: e.target.value }))
            }
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="booking_confirmation">Booking Confirmation</option>
            <option value="checkin_reminder">Check-in Reminder</option>
            <option value="checkout_thank_you">Checkout Thank You</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={newTemplate.channel}
            onChange={(e) =>
              setNewTemplate((prev) => ({ ...prev, channel: e.target.value }))
            }
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <input
            value={newTemplate.subject}
            onChange={(e) =>
              setNewTemplate((prev) => ({ ...prev, subject: e.target.value }))
            }
            placeholder="Subject"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <select
            value={newTemplate.is_active ? "true" : "false"}
            onChange={(e) =>
              setNewTemplate((prev) => ({
                ...prev,
                is_active: e.target.value === "true",
              }))
            }
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <textarea
          value={newTemplate.body}
          onChange={(e) =>
            setNewTemplate((prev) => ({ ...prev, body: e.target.value }))
          }
          placeholder="Template body. Example: Hello {{name}}, your booking at {{hotel_name}} is confirmed."
          rows="4"
          className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <div className="mt-3 text-xs text-slate-500">
          Available variables:{" "}
          <span className="font-bold">
            {"{{name}} {{hotel_name}} {{room}} {{checkin}} {{nights}} {{guests}} {{total}}"}
          </span>
        </div>

        <button
          onClick={addTemplate}
          disabled={saving}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-slate-950 px-6 py-3 rounded-2xl font-bold"
        >
          {saving ? "Saving..." : "Add Template"}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">
          Loading templates...
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-3xl p-5 ${
                template.is_active
                  ? "border-slate-200 bg-slate-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="grid md:grid-cols-4 gap-3 mb-4">
                <select
                  value={template.type || "custom"}
                  onChange={(e) =>
                    updateLocalTemplate(template.id, "type", e.target.value)
                  }
                  className="border border-slate-300 rounded-2xl px-4 py-3"
                >
                  <option value="booking_confirmation">Booking Confirmation</option>
                  <option value="checkin_reminder">Check-in Reminder</option>
                  <option value="checkout_thank_you">Checkout Thank You</option>
                  <option value="custom">Custom</option>
                </select>

                <select
                  value={template.channel || "email"}
                  onChange={(e) =>
                    updateLocalTemplate(template.id, "channel", e.target.value)
                  }
                  className="border border-slate-300 rounded-2xl px-4 py-3"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>

                <input
                  value={template.subject || ""}
                  onChange={(e) =>
                    updateLocalTemplate(template.id, "subject", e.target.value)
                  }
                  placeholder="Subject"
                  className="border border-slate-300 rounded-2xl px-4 py-3"
                />

                <select
                  value={template.is_active ? "true" : "false"}
                  onChange={(e) =>
                    updateLocalTemplate(
                      template.id,
                      "is_active",
                      e.target.value === "true"
                    )
                  }
                  className="border border-slate-300 rounded-2xl px-4 py-3"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <textarea
                value={template.body || ""}
                onChange={(e) =>
                  updateLocalTemplate(template.id, "body", e.target.value)
                }
                rows="4"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateTemplate(template)}
                  disabled={saving}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Save
                </button>

                <button
                  onClick={() => deleteTemplate(template.id)}
                  disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No message templates found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}