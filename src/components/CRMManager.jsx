import { useEffect, useMemo, useState } from "react";

export default function CRMManager({ hotelSlug }) {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    total_customers: 0,
    returning_customers: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCRM = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin-crm?slug=${hotelSlug}`);
      const data = await res.json();

      if (data.success) {
        setCustomers(data.customers || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error("CRM fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRM();
  }, [hotelSlug]);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return customers;

    return customers.filter((customer) => {
      return (
        customer.full_name?.toLowerCase().includes(value) ||
        customer.email?.toLowerCase().includes(value) ||
        customer.phone?.toLowerCase().includes(value)
      );
    });
  }, [customers, search]);

  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold">CRM</h2>
          <p className="text-slate-500 text-sm mt-1">
            Customer history, revenue and repeat guests.
          </p>
        </div>

        <button
          onClick={fetchCRM}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh CRM
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <CRMStat title="Total Customers" value={summary.total_customers || 0} />
        <CRMStat
          title="Returning Guests"
          value={summary.returning_customers || 0}
        />
        <CRMStat title="Customer Revenue" value={`€${summary.total_revenue || 0}`} />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customer by name, email or phone..."
        className="w-full border border-slate-300 rounded-2xl px-4 py-3 mb-6 outline-none focus:ring-2 focus:ring-yellow-400"
      />

      {loading ? (
        <div className="text-center text-slate-500 p-8">Loading CRM...</div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="border border-slate-200 rounded-3xl p-5 bg-slate-50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {customer.full_name || "Unknown Customer"}
                  </h3>

                  <p className="text-sm text-slate-500">{customer.email}</p>
                  <p className="text-sm text-slate-500">
                    {customer.phone || "No phone"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <MiniStat label="Bookings" value={customer.total_bookings} />
                  <MiniStat
                    label="Active"
                    value={customer.active_bookings}
                    green
                  />
                  <MiniStat
                    label="Revenue"
                    value={`€${customer.total_revenue}`}
                  />
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-3">Room</th>
                      <th className="text-left p-3">Check-in</th>
                      <th className="text-left p-3">Nights</th>
                      <th className="text-left p-3">Guests</th>
                      <th className="text-left p-3">Total</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Source</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customer.bookings.map((booking) => (
                      <tr key={booking.id} className="border-t">
                        <td className="p-3">{booking.room}</td>
                        <td className="p-3">{booking.checkin}</td>
                        <td className="p-3">{booking.nights}</td>
                        <td className="p-3">{booking.guests}</td>
                        <td className="p-3 font-bold">€{booking.total}</td>
                        <td className="p-3">
                          <span
                            className={
                              booking.status === "cancelled"
                                ? "bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold"
                                : "bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold"
                            }
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-3">{booking.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No customers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CRMStat({ title, value }) {
  return (
    <div className="bg-slate-100 rounded-3xl p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, green }) {
  return (
    <div className="bg-white rounded-2xl p-3 min-w-[90px]">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${green ? "text-green-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}