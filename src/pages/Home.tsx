import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Home.css";

interface Profile {
  username: string;
  email: string;
}

function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", user.id)
          .single();

        if (data) setProfile(data);
        else setProfile({ username: user.email ?? "Admin", email: user.email ?? "" });
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    // App.tsx's onAuthStateChange listener will redirect back to login
  };

  const stats = [
    { label: "Active Queues", value: "—", icon: "🎟️", color: "#6366f1" },
    { label: "Customers Served", value: "—", icon: "👥", color: "#10b981" },
    { label: "Avg. Wait Time", value: "—", icon: "⏱️", color: "#f59e0b" },
    { label: "Satisfaction Rate", value: "—", icon: "⭐", color: "#ec4899" },
  ];

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/Qme_Logo.png" alt="QMe Logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">QMe</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            <span className="nav-icon">🏠</span>
            <span>Dashboard</span>
          </a>
          <a href="#queues" className="nav-item">
            <span className="nav-icon">🎟️</span>
            <span>Queues</span>
          </a>
          <a href="#analytics" className="nav-item">
            <span className="nav-icon">📊</span>
            <span>Analytics</span>
          </a>
          <a href="#clients" className="nav-item">
            <span className="nav-icon">👥</span>
            <span>Clients</span>
          </a>
          <a href="#settings" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {loadingProfile ? "…" : (profile?.username?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">
                {loadingProfile ? "Loading…" : profile?.username ?? "Admin"}
              </span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button
            className={`logout-btn ${loggingOut ? "loading" : ""}`}
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
          >
            {loggingOut ? <span className="spinner-sm" /> : <LogoutIcon />}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-heading">
              Welcome back,{" "}
              <span className="dashboard-username">
                {loadingProfile ? "…" : profile?.username ?? "Admin"}
              </span>{" "}
              👋
            </h1>
            <p className="dashboard-subheading">
              Here's a snapshot of your queue management system today.
            </p>
          </div>
          <div className="header-badge">
            <span className="status-dot" /> Live
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon" style={{ background: stat.color + "22", color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Profile Card */}
        <section className="profile-section">
          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="section-title">Account Details</h2>
              <span className="profile-badge">Active</span>
            </div>
            {loadingProfile ? (
              <p className="profile-loading">Loading profile…</p>
            ) : (
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="profile-field-label">
                    <PersonIcon /> Username
                  </span>
                  <span className="profile-field-value">{profile?.username ?? "—"}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">
                    <MailIcon /> Email
                  </span>
                  <span className="profile-field-value">{profile?.email ?? "—"}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">
                    <ShieldIcon /> Role
                  </span>
                  <span className="profile-field-value">Administrator</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-card">
            <h2 className="section-title">Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-btn" style={{ "--accent": "#6366f1" } as React.CSSProperties}>
                <span>🎟️</span>
                <span>New Queue</span>
              </button>
              <button className="action-btn" style={{ "--accent": "#10b981" } as React.CSSProperties}>
                <span>📢</span>
                <span>Announce</span>
              </button>
              <button className="action-btn" style={{ "--accent": "#f59e0b" } as React.CSSProperties}>
                <span>📊</span>
                <span>View Report</span>
              </button>
              <button className="action-btn" style={{ "--accent": "#ec4899" } as React.CSSProperties}>
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Icons ── */
function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default Home;
