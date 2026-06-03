import { useEffect, useState } from "react";

export default function KnowledgeManager({ hotelSlug }) {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
  });

  const fetchKnowledge = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin-knowledge?slug=${hotelSlug}`);
      const data = await res.json();

      if (data.success) {
        setKnowledge(data.knowledge || []);
      }
    } catch (error) {
      console.error("Knowledge fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [hotelSlug]);

  const addKnowledge = async () => {
    if (!newItem.question.trim() || !newItem.answer.trim()) {
      alert("Question and answer are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: hotelSlug,
          question: newItem.question,
          answer: newItem.answer,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Knowledge creation failed.");
        return;
      }

      setNewItem({
        question: "",
        answer: "",
      });

      await fetchKnowledge();
    } catch (error) {
      alert("Knowledge creation failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateKnowledge = async (item) => {
    if (!item.question?.trim() || !item.answer?.trim()) {
      alert("Question and answer are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-knowledge", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          question: item.question,
          answer: item.answer,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Knowledge update failed.");
        return;
      }

      await fetchKnowledge();
    } catch (error) {
      alert("Knowledge update failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteKnowledge = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this knowledge item?"
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin-knowledge", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Knowledge delete failed.");
        return;
      }

      await fetchKnowledge();
    } catch (error) {
      alert("Knowledge delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateLocalItem = (id, field, value) => {
    setKnowledge((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">AI Knowledge Manager</h2>
          <p className="text-slate-500 text-sm mt-1">
            Add hotel information that the AI assistant and voice receptionist will use.
          </p>
        </div>

        <button
          onClick={fetchKnowledge}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh Knowledge
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl p-5 mb-6">
        <h3 className="font-bold mb-4">Add New Knowledge</h3>

        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={newItem.question}
            onChange={(e) =>
              setNewItem((prev) => ({
                ...prev,
                question: e.target.value,
              }))
            }
            placeholder="Question / Topic e.g. check-in, breakfast, parking"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <textarea
            value={newItem.answer}
            onChange={(e) =>
              setNewItem((prev) => ({
                ...prev,
                answer: e.target.value,
              }))
            }
            placeholder="Answer / Information"
            rows="3"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <button
          onClick={addKnowledge}
          disabled={saving}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-slate-950 px-6 py-3 rounded-2xl font-bold"
        >
          {saving ? "Saving..." : "Add Knowledge"}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">
          Loading knowledge...
        </div>
      ) : (
        <div className="space-y-4">
          {knowledge.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-3xl p-5 bg-slate-50"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Question / Topic
                  </label>

                  <input
                    value={item.question || ""}
                    onChange={(e) =>
                      updateLocalItem(item.id, "question", e.target.value)
                    }
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Answer
                  </label>

                  <textarea
                    value={item.answer || ""}
                    onChange={(e) =>
                      updateLocalItem(item.id, "answer", e.target.value)
                    }
                    rows="4"
                    className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateKnowledge(item)}
                  disabled={saving}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Save
                </button>

                <button
                  onClick={() => deleteKnowledge(item.id)}
                  disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {knowledge.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No knowledge items found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}