import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import React from "react";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.login, form.password);
      navigate("/");
    } catch (e) {
      setError(e?.response?.data?.message || "Échec de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="title mb-4">Connexion</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl mb-3">
          {error}
        </div>
      )}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="label">Login</label>
          <input
            className="input"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            disabled={loading}
          />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  d="M22 12a10 10 0 0 1-10 10"
                />
              </svg>
              Connexion en cours...
            </>
          ) : (
            "Se connecter"
          )}
        </button>
      </form>
    </div>
  );
}
