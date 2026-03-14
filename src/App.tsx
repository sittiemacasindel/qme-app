import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProfilePage from "./pages/Profile";

type Page = "login" | "register" | "home" | "profile";

function App() {
  const [page, setPage] = useState<Page>("login");
  const [loading, setLoading] = useState(true);

  // Track current page in a ref so the auth listener can read it
  // without needing it as a dependency (avoids stale closure)
  const pageRef = useRef<Page>("login");
  const setPageSafe = (p: Page) => {
    pageRef.current = p;
    setPage(p);
  };

  // Restore existing session on mount so users stay logged in after refresh
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageSafe("home");
      setLoading(false);
    });

    // Listen for auth state changes (login / logout)
    // Only redirect to "home" if currently on login screen.
    // This prevents password-change re-auth from kicking users off the profile page.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (pageRef.current === "login" || pageRef.current === "register") {
          setPageSafe("home");
        }
        // Already on "home" or "profile" → stay where we are
      } else {
        setPageSafe("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f1117",
        color: "#a0aec0",
        fontFamily: "Inter, sans-serif",
        fontSize: "1rem",
        gap: "12px"
      }}>
        <span style={{
          display: "inline-block",
          width: 20,
          height: 20,
          border: "3px solid #334155",
          borderTop: "3px solid #6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (page === "home") return <Home onNavigateToProfile={() => setPageSafe("profile")} />;
  if (page === "profile") return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: "5px 20px", background: "#eef0f5", borderBottom: "1px solid #e2e5ec", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>My Profile</div>
      <div style={{ display: "flex", flex: 1 }}>
        <aside style={{ width: 62, background: "#1e2444", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", flexShrink: 0, minHeight: "100%" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, overflow: "hidden" }}>
            <img src="/Qme_Logo.png" alt="QMe" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          {[
            { icon: "🏠", label: "Dashboard", onClick: () => setPageSafe("home"), active: false },
            { icon: "🎟️", label: "Queues", onClick: () => {}, active: false },
            { icon: "📊", label: "Analytics", onClick: () => {}, active: false },
            { icon: "👤", label: "Profile", onClick: () => {}, active: true },
          ].map((item) => (
            <button key={item.label} onClick={item.onClick} title={item.label} style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: item.active ? "#4361ee" : "transparent", color: item.active ? "#fff" : "#8b99c4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", marginBottom: 4, boxShadow: item.active ? "0 4px 12px rgba(67,97,238,0.4)" : "none" }}>
              {item.icon}
            </button>
          ))}
        </aside>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header style={{ height: 58, background: "#fff", borderBottom: "1px solid #e8eaf0", display: "flex", alignItems: "center", padding: "0 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", flexShrink: 0 }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>QME</span>
            <span style={{ marginLeft: 16, fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>/ My Profile</span>
          </header>
          <ProfilePage onNavigateToDashboard={() => setPageSafe("home")} />
        </div>
      </div>
    </div>
  );
  if (page === "register")
    return (
      <Register
        onNavigateToLogin={() => setPageSafe("login")}
        onRegisterSuccess={() => setPageSafe("home")}
      />
    );
  return (
    <Login
      onNavigateToRegister={() => setPageSafe("register")}
      onLoginSuccess={() => setPageSafe("home")}
    />
  );
}

export default App;
