import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../pages/Home.css"; // reuses the sidebar CSS classes

type NavItem = "dashboard" | "queues" | "analytics" | "profile";

interface SidebarProps {
  activeItem?: NavItem;
  onNavigateToDashboard: () => void;
  onNavigateToProfile: () => void;
}

function Sidebar({ activeItem = "dashboard", onNavigateToDashboard, onNavigateToProfile }: SidebarProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    // App.tsx onAuthStateChange will redirect to login
  };

  return (
    <aside className="icon-sidebar">
      {/* Logo */}
      <div className="icon-sidebar-logo">
        <img src="/Qme_Logo.png" alt="QMe" className="icon-sidebar-logo-img" />
      </div>

      {/* Nav Icons */}
      <nav className="icon-nav">
        <button
          className={`icon-nav-btn ${activeItem === "dashboard" ? "active" : ""}`}
          onClick={onNavigateToDashboard}
          title="Dashboard"
        >
          <HomeIcon />
        </button>

        <button
          className={`icon-nav-btn ${activeItem === "queues" ? "active" : ""}`}
          onClick={() => {}}
          title="Queues"
        >
          <QueueListIcon />
        </button>

        <button
          className={`icon-nav-btn ${activeItem === "analytics" ? "active" : ""}`}
          onClick={() => {}}
          title="Analytics"
        >
          <AnalyticsIcon />
        </button>

        <button
          className={`icon-nav-btn ${activeItem === "profile" ? "active" : ""}`}
          onClick={onNavigateToProfile}
          title="Profile"
        >
          <ProfileIcon />
        </button>
      </nav>

      {/* Logout */}
      <div className="icon-sidebar-bottom">
        <button
          className="icon-nav-btn icon-nav-btn--logout"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
        >
          {loggingOut ? <span className="spinner-icon" /> : <LogoutIcon />}
        </button>
      </div>
    </aside>
  );
}

/* ── Icons ── */
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function QueueListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default Sidebar;
