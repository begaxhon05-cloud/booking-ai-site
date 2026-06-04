import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import RoomsManager from "./components/RoomsManager";
import KnowledgeManager from "./components/KnowledgeManager";
import CRMManager from "./components/CRMManager";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard({ hotelSlug }) {
  const [bookings, setBookings] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchHotel = async () => {
    const res = await fetch(`/api/hotel?slug=${hotelSlug}`);
    const data = await res.json();

    if (data.success) {
      setHotel(data.hotel);
      setSettings(data.hotel);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin-bookings?slug=${hotelSlug}`);
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Admin bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);

      const res = await fetch("/api/update-hotel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: hotelSlug,
          hotel_name: settings.hotel_name,
          owner_name: settings.owner_name,
          owner_email: settings.owner_email,
          owner_phone: settings.owner_phone,
          location: settings.location,
          address: settings.address,
          primary_color: settings.primary_color,
          whatsapp_number: settings.whatsapp_number,
          logo_url: settings.logo_url,
          cover_image_url: settings.cover_image_url,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Settings update failed");
        return;
      }

      setHotel(data.hotel);
      setSettings(data.hotel);
      alert("Settings saved successfully.");
    } catch (error) {
      alert("Settings save failed.");
    } finally {
      setSavingSettings(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return;

    try {
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Cancel failed");
        return;
      }

      await fetchBookings();
    } catch (error) {
      alert("Cancel failed");
    }
  };

  useEffect(() => {
    fetchHotel();
    fetchBookings();
  }, []);

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const totalRevenue = activeBookings.reduce(
    (sum, booking) => sum + Number(booking.total || 0),
    0
  );

  const bookedDates = activeBookings.map((booking) => booking.checkin);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const monthlyRevenue = useMemo(() => {
    const months = {};
    activeBookings.forEach((booking) => {
      const month = booking.checkin?.slice(0, 7) || "Unknown";
      months[month] = (months[month] || 0) + Number(booking.total || 0);
    });

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [activeBookings]);

  const roomStats = useMemo(() => {
    const rooms = {};
    activeBookings.forEach((booking) => {
      const roomName = booking.rooms?.name || "Unknown";
      rooms[roomName] = (rooms[roomName] || 0) + 1;
    });

    return Object.entries(rooms).map(([room, count]) => ({
      room,
      count,
    }));
  }, [activeBookings]);

  const statusData = [
    { name: "Active", value: activeBookings.length },
    { name: "Cancelled", value: cancelledBookings.length },
  ];

  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">
              {hotel?.hotel_name || "Admin Dashboard"}
            </h1>
            <p className="text-slate-400 mt-2">
              Live dashboard for {hotelSlug}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchBookings}
              className="bg-yellow-400 text-slate-950 font-bold px-5 py-3 rounded-2xl"
            >
              Refresh
            </button>

            <button
              onClick={() => {
                localStorage.removeItem(`admin_logged_in_${hotelSlug}`);
                window.location.href = `/${hotelSlug}/admin/login`;
              }}
              className="bg-red-500 text-white font-bold px-5 py-3 rounded-2xl"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <StatCard title="Active Bookings" value={activeBookings.length} />
          <StatCard title="Cancelled" value={cancelledBookings.length} />
          <StatCard title="Revenue" value={`€${totalRevenue}`} />
          <StatCard title="Status" value="Live" green />
        </div>

        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-5">Hotel Settings</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Hotel Name" value={settings.hotel_name} onChange={(v) => updateSetting("hotel_name", v)} />
            <Input label="Owner Name" value={settings.owner_name} onChange={(v) => updateSetting("owner_name", v)} />
            <Input label="Owner Email" value={settings.owner_email} onChange={(v) => updateSetting("owner_email", v)} />
            <Input label="Owner Phone" value={settings.owner_phone} onChange={(v) => updateSetting("owner_phone", v)} />
            <Input label="Location" value={settings.location} onChange={(v) => updateSetting("location", v)} />
            <Input label="Address" value={settings.address} onChange={(v) => updateSetting("address", v)} />
            <Input label="WhatsApp Number" value={settings.whatsapp_number} onChange={(v) => updateSetting("whatsapp_number", v)} />
            <Input label="Primary Color" value={settings.primary_color} onChange={(v) => updateSetting("primary_color", v)} />
            <Input label="Logo URL" value={settings.logo_url} onChange={(v) => updateSetting("logo_url", v)} />
            <Input label="Cover Image URL" value={settings.cover_image_url} onChange={(v) => updateSetting("cover_image_url", v)} />
          </div>

          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="mt-6 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold px-6 py-3 rounded-2xl"
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
        <RoomsManager hotelSlug={hotelSlug} />
        <KnowledgeManager hotelSlug={hotelSlug} />
        <CRMManager hotelSlug={hotelSlug} />

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Availability Calendar</h2>

            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileClassName={({ date }) => {
                const dateString = formatDate(date);
                return bookedDates.includes(dateString) ? "booked-day" : "";
              }}
            />

            <p className="text-sm text-slate-500 mt-4">
              Red dates are active booked check-in dates.
            </p>
          </div>

          <ChartBox title="Monthly Revenue">
            <BarChart data={monthlyRevenue}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#ef4444" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartBox>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <ChartBox title="Top Rooms">
            <BarChart data={roomStats}>
              <XAxis dataKey="room" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartBox>

          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Booking Status</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} label>
                    <Cell key="active" fill="#7c3aed" />
                    <Cell key="cancelled" fill="#a855f7" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">Bookings</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Room</th>
                    <th className="text-left p-4">Check-in</th>
                    <th className="text-left p-4">Nights</th>
                    <th className="text-left p-4">Guests</th>
                    <th className="text-left p-4">Total</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={
                        booking.status === "cancelled"
                          ? "border-t bg-red-50"
                          : "border-t"
                      }
                    >
                      <td className="p-4 font-semibold">
                        {booking.customers?.full_name || "-"}
                      </td>
                      <td className="p-4">{booking.customers?.email || "-"}</td>
                      <td className="p-4">{booking.rooms?.name || "-"}</td>
                      <td className="p-4">{booking.checkin}</td>
                      <td className="p-4">{booking.nights}</td>
                      <td className="p-4">{booking.guests}</td>
                      <td className="p-4 font-bold">€{booking.total}</td>
                      <td className="p-4">
                        <span
                          className={
                            booking.status === "cancelled"
                              ? "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"
                              : "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"
                          }
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {booking.status === "cancelled" ? (
                          <span className="text-slate-400 text-xs">Cancelled</span>
                        ) : (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-500">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, green }) {
  return (
    <div className="bg-white/10 border border-white/10 rounded-3xl p-6">
      <p className="text-slate-400">{title}</p>
      <p className={`text-4xl font-bold mt-2 ${green ? "text-green-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="lg:col-span-2 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}