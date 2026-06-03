import { useEffect, useState } from "react";

export default function RoomsManager({ hotelSlug }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    price_per_night: 50,
    max_guests: 2,
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin-rooms?slug=${hotelSlug}`);
      const data = await res.json();

      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Rooms fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [hotelSlug]);

  const addRoom = async () => {
    if (!newRoom.name.trim()) {
      alert("Room name is required.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: hotelSlug,
          ...newRoom,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Room creation failed.");
        return;
      }

      setNewRoom({
        name: "",
        description: "",
        price_per_night: 50,
        max_guests: 2,
      });

      await fetchRooms();
    } catch (error) {
      alert("Room creation failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateRoom = async (room) => {
    try {
      setSaving(true);

      const res = await fetch("/api/admin-rooms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: room.id,
          name: room.name,
          description: room.description,
          price_per_night: room.price_per_night,
          max_guests: room.max_guests,
          is_active: room.is_active,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Room update failed.");
        return;
      }

      await fetchRooms();
    } catch (error) {
      alert("Room update failed.");
    } finally {
      setSaving(false);
    }
  };

  const disableRoom = async (roomId) => {
    const confirmDisable = window.confirm(
      "Are you sure you want to disable this room?"
    );

    if (!confirmDisable) return;

    try {
      setSaving(true);

      const res = await fetch("/api/admin-rooms", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Room disable failed.");
        return;
      }

      await fetchRooms();
    } catch (error) {
      alert("Room disable failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateLocalRoom = (roomId, field, value) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              [field]: value,
            }
          : room
      )
    );
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">Room Management</h2>
          <p className="text-slate-500 text-sm mt-1">
            Add, edit and disable rooms for this hotel.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh Rooms
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl p-5 mb-6">
        <h3 className="font-bold mb-4">Add New Room</h3>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            value={newRoom.name}
            onChange={(e) =>
              setNewRoom((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Room name"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            value={newRoom.description}
            onChange={(e) =>
              setNewRoom((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Description"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            type="number"
            value={newRoom.price_per_night}
            onChange={(e) =>
              setNewRoom((prev) => ({
                ...prev,
                price_per_night: e.target.value,
              }))
            }
            placeholder="Price"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            type="number"
            value={newRoom.max_guests}
            onChange={(e) =>
              setNewRoom((prev) => ({
                ...prev,
                max_guests: e.target.value,
              }))
            }
            placeholder="Max guests"
            className="border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <button
          onClick={addRoom}
          disabled={saving}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-200 text-slate-950 px-6 py-3 rounded-2xl font-bold"
        >
          {saving ? "Saving..." : "Add Room"}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading rooms...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-4">Room</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Price / Night</th>
                <th className="text-left p-4">Max Guests</th>
                <th className="text-left p-4">Active</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className={room.is_active ? "border-t" : "border-t bg-red-50"}
                >
                  <td className="p-4">
                    <input
                      value={room.name || ""}
                      onChange={(e) =>
                        updateLocalRoom(room.id, "name", e.target.value)
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </td>

                  <td className="p-4">
                    <input
                      value={room.description || ""}
                      onChange={(e) =>
                        updateLocalRoom(room.id, "description", e.target.value)
                      }
                      className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </td>

                  <td className="p-4">
                    <input
                      type="number"
                      value={room.price_per_night || 0}
                      onChange={(e) =>
                        updateLocalRoom(
                          room.id,
                          "price_per_night",
                          e.target.value
                        )
                      }
                      className="w-28 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </td>

                  <td className="p-4">
                    <input
                      type="number"
                      value={room.max_guests || 1}
                      onChange={(e) =>
                        updateLocalRoom(room.id, "max_guests", e.target.value)
                      }
                      className="w-24 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </td>

                  <td className="p-4">
                    <select
                      value={room.is_active ? "true" : "false"}
                      onChange={(e) =>
                        updateLocalRoom(
                          room.id,
                          "is_active",
                          e.target.value === "true"
                        )
                      }
                      className="border border-slate-300 rounded-xl px-3 py-2"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRoom(room)}
                        disabled={saving}
                        className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => disableRoom(room.id)}
                        disabled={saving || !room.is_active}
                        className="bg-red-500 disabled:bg-red-200 text-white px-3 py-2 rounded-xl text-xs font-bold"
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rooms.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}