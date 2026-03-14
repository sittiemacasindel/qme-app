import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Home.css";

interface Profile {
  username: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface Queue {
  id: number;
  name: string;
  description: string;
  code: string;
  status: "Active" | "Paused";
  waiting: number;
}

interface HomeProps {
  onNavigateToProfile: () => void;
}

// Start with empty — data will come from Supabase when the queues table is ready
const DEMO_QUEUES: Queue[] = [];

function Home({ onNavigateToProfile }: HomeProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [queues, setQueues] = useState<Queue[]>(DEMO_QUEUES);
  const [activeNav, setActiveNav] = useState("dashboard");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, full_name, email, role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (data) setProfile(data);
        else setProfile({
          username: user.user_metadata?.username ?? user.email ?? "Admin",
          full_name: user.user_metadata?.full_name ?? "",
          email: user.email ?? "",
          role: "Manager",
          avatar_url: null,
        });
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
  };

  const getInitials = () => {
    const name = profile?.full_name || profile?.username || "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "A";
  };

  const displayName = loadingProfile ? "…" : (profile?.full_name || profile?.username || "Admin");
  // Placeholders — replace with real Supabase queries when the queues table exists
  const activeQueues = "—";
  const totalWaiting = "—";
  const totalServed = "—";

  const toggleStatus = (id: number) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: q.status === "Active" ? "Paused" : "Active" } : q
      )
    );
  };

  const closeQueue = (id: number) => {
    setQueues((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="app-shell">
      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-bar">Main Dashboard</div>

      <div className="app-body">
        {/* ── Narrow Icon Sidebar ── */}
        <aside className="icon-sidebar">
          <div className="icon-sidebar-logo">
            <img src="/Qme_Logo.png" alt="QMe" className="icon-sidebar-logo-img" />
          </div>

          <nav className="icon-nav">
            <button
              className={`icon-nav-btn ${activeNav === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveNav("dashboard")}
              title="Dashboard"
            >
              <HomeIcon />
            </button>
            <button
              className={`icon-nav-btn ${activeNav === "queues" ? "active" : ""}`}
              onClick={() => setActiveNav("queues")}
              title="Queues"
            >
              <QueueListIcon />
            </button>
            <button
              className={`icon-nav-btn ${activeNav === "analytics" ? "active" : ""}`}
              onClick={() => setActiveNav("analytics")}
              title="Analytics"
            >
              <AnalyticsIcon />
            </button>
            <button
              className="icon-nav-btn"
              onClick={onNavigateToProfile}
              title="Profile"
            >
              <ProfileIcon />
            </button>
          </nav>

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

        {/* ── Right Panel ── */}
        <div className="right-panel">
          {/* ── App Header ── */}
          <header className="app-header">
            <div className="app-header-brand">
              <span className="app-header-logo-text">QME</span>
            </div>

            <div className="app-header-right">
              <button className="bell-btn" title="Notifications">
                <BellIcon />
                <span className="bell-dot" />
              </button>
              <div className="header-user-block">
                <span className="header-user-name">{displayName}</span>
                <span className="header-user-role">{profile?.role || "Manager"}</span>
              </div>
              <button className="header-avatar-btn" onClick={onNavigateToProfile} title="View Profile">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="header-avatar-img" />
                ) : (
                  <span className="header-avatar-initials">
                    {loadingProfile ? "…" : getInitials()}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* ── Main Content ── */}
          <main className="dash-main">
            {/* Page Title Row */}
            <div className="dash-title-row">
              <div>
                <h1 className="dash-title">Queue Dashboard</h1>
                <p className="dash-subtitle">Manage your active queues</p>
              </div>
              <button className="create-queue-btn">
                <PlusIcon /> Create Queue
              </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon-box stat-icon-box--blue">
                  <BarChartIcon />
                </div>
                <div className="stat-body">
                  <span className="stat-num stat-num--placeholder">{activeQueues}</span>
                  <span className="stat-lbl">Active Queues</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-box stat-icon-box--teal">
                  <PeopleIcon />
                </div>
                <div className="stat-body">
                  <span className="stat-num stat-num--placeholder">{totalWaiting}</span>
                  <span className="stat-lbl">Customers Waiting</span>
                  <span className="stat-sublbl">Across all active queues</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-box stat-icon-box--green">
                  <ClockCircleIcon />
                </div>
                <div className="stat-body">
                  <span className="stat-num stat-num--placeholder">{totalServed}</span>
                  <span className="stat-lbl">Total Served Today</span>
                </div>
              </div>
            </div>

            {/* My Queues Table */}
            <div className="queues-card">
              <div className="queues-card-head">
                <div>
                  <h2 className="queues-card-title">My Queues</h2>
                  <p className="queues-card-sub">No queues yet</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="queues-table">
                  <thead>
                    <tr>
                      <th>QUEUE NAME</th>
                      <th>QUEUE CODE</th>
                      <th>STATUS</th>
                      <th>WAITING</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="table-empty">
                          <div className="empty-state">
                            <span className="empty-state-icon">🎟️</span>
                            <p className="empty-state-msg">No existing queues</p>
                            <p className="empty-state-sub">Create your first queue to start managing customers.</p>
                            <button className="create-queue-btn empty-state-btn">
                              <PlusIcon /> Create Queue
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      queues.map((queue) => (
                        <tr key={queue.id}>
                          <td>
                            <div className="q-name">{queue.name}</div>
                            <div className="q-desc">{queue.description}</div>
                          </td>
                          <td>
                            <span className="q-code">{queue.code}</span>
                          </td>
                          <td>
                            <span className={`q-status q-status--${queue.status.toLowerCase()}`}>
                              <span className="q-status-dot" />
                              {queue.status}
                            </span>
                          </td>
                          <td>
                            <span className="q-waiting">{queue.waiting} people</span>
                          </td>
                          <td>
                            <div className="q-actions">
                              <button className="q-btn q-btn--view">
                                <EyeSmIcon /> View
                              </button>
                              <button
                                className={`q-btn ${queue.status === "Active" ? "q-btn--pause" : "q-btn--resume"}`}
                                onClick={() => toggleStatus(queue.id)}
                              >
                                {queue.status === "Active" ? (
                                  <><PauseIcon /> Pause</>
                                ) : (
                                  <><PlayIcon /> Resume</>
                                )}
                              </button>
                              <button
                                className="q-btn q-btn--close"
                                onClick={() => closeQueue(queue.id)}
                              >
                                <XIcon /> Close
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── SVG Icons ── */
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
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function BarChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ClockCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function EyeSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default Home;
