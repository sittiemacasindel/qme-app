import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Login.css"; // shared styles

interface RegisterProps {
    onNavigateToLogin: () => void;
    onRegisterSuccess: () => void;
}

function Register({ onNavigateToLogin, onRegisterSuccess }: RegisterProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        setError("");

        // ── Client-side validation ──
        if (!username.trim() || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (username.trim().length < 3) {
            setError("Username must be at least 3 characters.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        const passwordRules = [
            { test: password.length >= 8, rule: "at least 8 characters" },
            { test: /[A-Z]/.test(password), rule: "one uppercase letter (A–Z)" },
            { test: /[0-9]/.test(password), rule: "one number (0–9)" },
            { test: /[^A-Za-z0-9]/.test(password), rule: "one special character (!@#$…)" },
        ];
        const failed = passwordRules.filter((r) => !r.test).map((r) => r.rule);
        if (failed.length > 0) {
            setError("Password is too weak. It must include: " + failed.join(", ") + ".");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // ── Step 1: Check if username is already taken ──
            const { data: existing, error: lookupError } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username.trim())
                .maybeSingle();

            if (lookupError) {
                setError("Could not verify username availability. Please try again.");
                return;
            }
            if (existing) {
                setError("That username is already taken. Please choose another.");
                return;
            }

            // ── Step 2: Create the auth user (username passed as metadata for the DB trigger) ──
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        username: username.trim(),
                    },
                },
            });

            if (signUpError) {
                if (signUpError.message.toLowerCase().includes("already registered") ||
                    signUpError.message.toLowerCase().includes("user already exists")) {
                    setError("An account with this email already exists. Please sign in.");
                } else if (signUpError.message.toLowerCase().includes("database error saving new user")) {
                    setError("Username is taken. Please choose a different username.");
                } else {
                    setError(signUpError.message);
                }
                return;
            }

            if (!authData.user?.id) {
                setError("Registration failed. Please try again.");
                return;
            }

            // ── Step 3: Profile row is auto-created by the DB trigger (handle_new_user) ──
            // No manual insert needed — the trigger runs SECURITY DEFINER and bypasses RLS.

            // ── Success ──
            setSuccess(true);

            // If email confirmation is disabled, a session is returned immediately → go to dashboard
            if (authData.session) {
                setTimeout(() => onRegisterSuccess(), 1200);
            }
        } catch {
            setError("A network error occurred. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleRegister();
    };

    return (
        <div className="login-page">
            {/* ── Left Panel: Form ── */}
            <div className="login-left">
                <div className="login-form-wrapper">
                    {/* Logo */}
                    <div className="login-logo">
                        <img
                            src="/Qme_Logo.png"
                            alt="QMe Logo"
                            style={{ width: 48, height: 48, objectFit: "contain" }}
                        />
                        <span className="login-logo-text">QMe</span>
                    </div>

                    {success ? (
                        <div className="register-success">
                            <div className="register-success-icon">✓</div>
                            <h1 className="login-title">Account Created!</h1>
                            <p className="login-subtitle">
                                Your admin account has been set up successfully.
                                {!supabase ? "" : " Check your email to confirm your address, then sign in."}
                            </p>
                            <button className="login-btn" onClick={onNavigateToLogin}>
                                Go to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="login-title">Create Account</h1>
                            <p className="login-subtitle">
                                Set up your admin account to start managing queues and serving
                                clients with QMe.
                            </p>

                            {/* Error */}
                            {error && (
                                <div className="login-error" role="alert">
                                    <span className="login-error-icon">⚠</span> {error}
                                </div>
                            )}

                            {/* Username */}
                            <div className="login-field">
                                <label htmlFor="username">Username</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <PersonIcon />
                                    </span>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="e.g. juan_admin"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="login-field">
                                <label htmlFor="regEmail">Email Address</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <MailIcon />
                                    </span>
                                    <input
                                        id="regEmail"
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
                                <label htmlFor="regPassword">Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <LockIcon />
                                    </span>
                                    <input
                                        id="regPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 chars, A-Z, 0-9, !@#…"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        autoComplete="new-password"
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

                            {/* Confirm Password */}
                            <div className="login-field">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        <LockIcon />
                                    </span>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                id="registerBtn"
                                className={`login-btn ${loading ? "loading" : ""}`}
                                onClick={handleRegister}
                                disabled={loading}
                                style={{ marginTop: 4 }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span> Creating account…
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </button>

                            <p className="login-create-account">
                                Already have an account?{" "}
                                <button
                                    className="create-account-link"
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
                                    onClick={onNavigateToLogin}
                                >
                                    Sign in
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* ── Right Panel: Hero ── */}
            <div className="login-right">
                <div className="hero-content">
                    <h2 className="hero-title">
                        Join the QMe
                        <br />
                        <span className="hero-highlight">Admin Network</span>
                    </h2>
                    <p className="hero-desc">
                        Create your admin account to gain full control over queues, track
                        real-time customer flow, and deliver a seamless experience.
                    </p>

                    <div className="hero-features">
                        <div className="feature-pill">
                            <span>🎟️</span> Smart Queue Creation
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

/* ── Shared Icons ── */
function PersonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
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

export default Register;
