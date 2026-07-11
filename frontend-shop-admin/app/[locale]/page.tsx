"use client";

import { useState, useEffect } from "react";
import { useRouter } from "../../i18n/routing";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./components/LanguageSwitcher";
import "./globals.css";

export default function LoginPage() {
  const t = useTranslations('Index');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await res.json();
      sessionStorage.setItem("admin_token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <LanguageSwitcher />
      </div>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div className="text-center mb-4">
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{t('title')}</h1>
          <p className="text-secondary">{t('admin_portal')}</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">{t('username')}</label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder={t('enter_username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder={t('enter_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-error mb-4 text-center">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('authenticating') : t('sign_in')}
          </button>
        </form>
      </div>
    </div>
  );
}
