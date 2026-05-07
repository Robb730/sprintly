import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import logo from "../../assets/sprintly-logo.svg";

const Icons = {
  dashboard: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  projects: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  tasks: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  collapse: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  expand: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  close: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: Icons.dashboard },
  { label: "My Projects", to: "/projects", icon: Icons.projects },
  { label: "My Tasks", to: "/tasks", icon: Icons.tasks },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ name, size = 28 }) {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#06b6d4",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="flex items-center justify-center rounded-lg text-white font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function NavItem({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className="group"
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 9,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "8px 0" : "8px 10px",
        width: collapsed ? 36 : "100%",
        margin: collapsed ? "0 auto" : undefined,
        borderRadius: 9,
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        background: isActive ? "var(--accent-light)" : "transparent",
        color: isActive ? "var(--accent)" : "var(--text-secondary)",
        transition: "background 0.15s, color 0.15s",
        textDecoration: "none",
        whiteSpace: "nowrap",
        overflow: "hidden",
        position: "relative",
      })}
      onMouseEnter={(e) => {
        if (e.currentTarget.getAttribute("aria-current") !== "page") {
          e.currentTarget.style.background = "var(--bg-primary)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget.getAttribute("aria-current") !== "page") {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && !collapsed && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "20%",
                height: "60%",
                width: 3,
                borderRadius: 99,
                background: "var(--accent)",
              }}
            />
          )}
          <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }) {
  if (collapsed)
    return (
      <div
        style={{ height: 1, background: "var(--border)", margin: "8px 10px" }}
      />
    );
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        padding: "0 10px",
        marginBottom: 4,
        marginTop: 4,
        opacity: 0.7,
      }}
    >
      {label}
    </p>
  );
}

// ─── Desktop ───────────────────────────────────────────────────────────────────
function DesktopSidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();
  const name =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden"
      style={{
        width: collapsed ? 60 : 220,
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center shrink-0 h-14"
        style={{
          borderBottom: "1px solid var(--border)",
          padding: collapsed ? "0 0" : "0 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
        }}
      >
        <img
              src= {logo}
              alt="Sprintly"
              className="w-7 h-7 rounded-lg shrink-0"
            />
        {!collapsed && (
          <span
            className="font-bold text-sm"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            Sprintly
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{
          padding: collapsed ? "12px 12px" : "14px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <SectionLabel label="Menu" collapsed={collapsed} />
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div
        className="shrink-0"
        style={{
          borderTop: "1px solid var(--border)",
          padding: collapsed ? "12px 12px" : "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Theme toggle row */}
        <div
          className="flex items-center rounded-lg"
          style={{
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "4px 0" : "2px 4px",
          }}
        >
          {!collapsed && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Theme
            </span>
          )}
          <ThemeToggle />
        </div>

        {/* User card */}
        {!collapsed ? (
          <div
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Avatar name={name} size={26} />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {name}
              </p>
              <p
                className="truncate"
                style={{ color: "var(--text-muted)", fontSize: 10 }}
              >
                {user?.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar name={name} size={28} />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center rounded-lg transition-all hover:opacity-70"
          style={{
            height: 30,
            width: "100%",
            color: "var(--text-muted)",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? Icons.expand : Icons.collapse}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  const { user } = useAuth();
  const name =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 md:hidden"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden"
        style={{
          width: 244,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-14 px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src= {logo}
              alt="Sprintly"
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span
              className="font-bold text-sm"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Sprintly
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-60"
            style={{ color: "var(--text-muted)" }}
          >
            {Icons.close}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: "14px 8px" }}>
          <SectionLabel label="Menu" collapsed={false} />
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={false}
                onClick={onClose}
              />
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div
          className="shrink-0 px-3 py-3 space-y-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between px-1 py-1">
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Theme
            </span>
            <ThemeToggle />
          </div>
          <div
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Avatar name={name} size={26} />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {name}
              </p>
              <p
                className="truncate"
                style={{ color: "var(--text-muted)", fontSize: 10 }}
              >
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <DesktopSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <MobileDrawer open={mobileOpen} onClose={onMobileClose} />
    </>
  );
}
