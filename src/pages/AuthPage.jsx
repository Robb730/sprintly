import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import ThemeToggle from "../components/layout/ThemeToggle";
import Toast from "../components/shared/Toast";
import logo from "../assets/sprintly-logo.svg";

const FEATURES = [
  {
    icon: "⚡",
    title: "Sprint Planning",
    desc: "Organize work into time-boxed iterations",
  },
  {
    icon: "🎯",
    title: "Milestone Tracking",
    desc: "Never lose sight of your big goals",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Assign tasks and manage permissions",
  },
  {
    icon: "📊",
    title: "Progress Insights",
    desc: "Visual dashboards for your team",
  },
];

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Use a global event to bypass stale closure problem
  useEffect(() => {
    const handler = (e) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 4000);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);

  const showToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", { detail: { type, message } }),
    );
  };

  const handleSuccess = () => {
    showToast("success", "Signed in successfully!");
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const handleLoginSuccess = () => {
    showToast("success", "Signed in successfully!");
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const handleRegisterSuccess = () => {
    showToast("success", "Account created! Check your email to confirm.");
    setTimeout(() => navigate("/"), 1500);
  };

  <style>{`
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .anim-fade-up   { animation: fadeUp 0.6s ease both; }
  .anim-fade-in   { animation: fadeIn 0.8s ease both; }
`}</style>

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-primary)" }}
    >
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      {/* Left panel */}
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blobs */}
        <div
          className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-32 left-16 w-48 h-48 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={logo}
            alt="Sprintly"
            className="w-9 h-9 rounded-xl shrink-0"
          />
          <span
            className="text-white font-bold text-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sprintly
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1
            className="text-4xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Agile sprint tracking
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              made simple for teams.
            </span>
          </h1>
          <p className="text-blue-200/60 text-sm leading-relaxed mb-10">
            Plan projects, manage sprints, assign tasks, and keep every team
            member aligned in one clean workspace.
          </p>

          {/* 4 features */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: "Sprint Planning",
                desc: "Create sprints, break down tasks, and track progress from start to finish.",
              },
              {
                title: "Kanban & List Views",
                desc: "Switch between board and list view to match your team's workflow.",
              },
              {
                title: "Team Collaboration",
                desc: "Invite teammates, assign work, and manage project permissions.",
              },
              {
                title: "Progress Dashboard",
                desc: "See completed tasks, active sprints, and overall project health at a glance.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-white text-sm font-semibold mb-1">
                  {f.title}
                </p>
                <p className="text-blue-200/45 text-xs leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <div className="relative z-10">
          <p className="text-blue-200/30 text-xs">
            Built by Robb Jullian Olazo
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
              }}
            >
              S
            </div>
            <span
              className="font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Sprintly
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span
              className="text-sm hidden sm:block"
              style={{ color: "var(--text-muted)" }}
            >
              {mode === "login" ? "New here?" : "Have an account?"}
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            {mode === "login" ? (
              <LoginForm
                key="login"
                onSwitch={() => setMode("register")}
                onSuccess={handleLoginSuccess}
                onError={(msg) => showToast("error", msg)}
              />
            ) : (
              <RegisterForm
                key="register"
                onSwitch={() => setMode("login")}
                onSuccess={handleRegisterSuccess}
                onError={(msg) => showToast("error", msg)}
              />
            )}
          </div>
        </div>

        <div className="px-8 py-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2025 Sprintly · Built with React + Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
