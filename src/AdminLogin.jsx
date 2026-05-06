import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (e) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_logged_in", "true");
      window.location.href = "/admin";
    } else {
      setError("Password incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
        <p className="text-slate-500 mb-6">Enter password to access dashboard.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-3 rounded-2xl transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}