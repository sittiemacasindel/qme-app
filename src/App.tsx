import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

type Page = "login" | "register" | "home";

function App() {
  const [page, setPage] = useState<Page>("login");
  const [loading, setLoading] = useState(true);

  // Restore existing session on mount so users stay logged in after refresh
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPage("home");
      setLoading(false);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setPage("home");
      } else {
        setPage("login");
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

  if (page === "home") return <Home />;
  if (page === "register")
    return (
      <Register
        onNavigateToLogin={() => setPage("login")}
        onRegisterSuccess={() => setPage("home")}
      />
    );
  return (
    <Login
      onNavigateToRegister={() => setPage("register")}
      onLoginSuccess={() => setPage("home")}
    />
  );
}

export default App;
