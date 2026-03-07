import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Login.css";

interface LoginProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
}

function Login({ onNavigateToRegister, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Map Supabase error messages to user-friendly text
        if (
          authError.message.toLowerCase().includes("invalid login credentials") ||
          authError.message.toLowerCase().includes("invalid email or password")
        ) {
          setError("Invalid email or password. Please try again.");
        } else if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else if (authError.message.toLowerCase().includes("too many requests")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else {
          setError(authError.message);
        }
        return;
      }

      onLoginSuccess();
    } catch {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-page">
      {/* ── Left Panel: Form ── */}
      <div className="login-left">
        <div className="login-form-wrapper">
          {/* Logo */}
          <div className="login-logo">
            <QMeLogo />
            <span className="login-logo-text">QMe</span>
          </div>

          <h1 className="login-title">Admin Portal</h1>
          <p className="login-subtitle">
            Sign in to manage queues, monitor flows, and serve your clients
            efficiently.
          </p>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">⚠</span> {error}
            </div>
          )}

          {/* Email */}
          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <MailIcon />
              </span>
              <input
                id="email"
                type="email"
                placeholder="admin@qme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" id="rememberMe" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#forgot" className="forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            id="loginBtn"
            className={`login-btn ${loading ? "loading" : ""}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="login-create-account">
            Don't have an account?{" "}
            <button
              className="create-account-link"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
              onClick={onNavigateToRegister}
            >
              Create one
            </button>
          </p>

          <p className="login-footer"></p>
        </div>
      </div>

      {/* ── Right Panel: Hero ── */}
      <div className="login-right">
        <div className="hero-content">
          <h2 className="hero-title">
            Streamline Your Queue,
            <br />
            <span className="hero-highlight">Elevate Customer Experience</span>
          </h2>
          <p className="hero-desc">
            QMe empowers admins to create, monitor, and manage service queues in
            real time — keeping customers informed and staff in control.
          </p>

          <div className="hero-illustration"></div>

          {/* Feature pills */}
          <div className="hero-features">
            <div className="feature-pill">
              <span>🎟️</span> Queue Creation
            </div>
            <div className="feature-pill">
              <span>📊</span> Real-Time Analytics
            </div>
            <div className="feature-pill">
              <span>📱</span> Mobile Client App
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG Icons ── */
function QMeLogo() {
  return (
    <img
      src="/Qme_Logo.png"
      alt="QMe Logo"
      style={{ width: 48, height: 48, objectFit: "contain" }}
    />
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default Login;
