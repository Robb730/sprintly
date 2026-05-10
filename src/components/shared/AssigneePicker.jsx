import { useState, useRef, useEffect } from "react";
import { getAvatarColor, getInitials } from "../data/projectData.jsx";
import { Check, ChevronDown, X } from "lucide-react";

export default function AssigneePicker({ members, selected = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  function remove(id, e) {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== id));
  }

  const selectedMembers = members.filter((m) => selected.includes(m.id));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", minHeight: 38, padding: "5px 10px",
          borderRadius: 12, border: "1px solid var(--border)",
          background: "var(--bg-primary)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
          textAlign: "left", transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        {selectedMembers.length === 0 ? (
          <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>Unassigned</span>
        ) : (
          <>
            {selectedMembers.map((m) => (
              <span
                key={m.id}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 6px 2px 3px", borderRadius: 20,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  fontSize: 11, color: "var(--text-primary)", fontWeight: 500,
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 5,
                  background: getAvatarColor(m.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 7, fontWeight: 700, flexShrink: 0,
                }}>
                  {getInitials(m.name)}
                </div>
                {m.name}
                <span
                  onClick={(e) => remove(m.id, e)}
                  style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "var(--text-muted)", marginLeft: 1 }}
                >
                  <X size={10} />
                </span>
              </span>
            ))}
          </>
        )}
        <ChevronDown
          size={13}
          style={{
            color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 100, background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}>
          {members.length === 0 && (
            <p style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)" }}>No members</p>
          )}
          {members.map((m) => {
            const isSelected = selected.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: getAvatarColor(m.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 9, fontWeight: 700,
                }}>
                  {getInitials(m.name)}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: 0, truncate: true }}>{m.name}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{m.email}</p>
                </div>

                {/* Check */}
                <div style={{
                  width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  background: isSelected ? "var(--accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
              </button>
            );
          })}

          {/* Footer: clear all */}
          {selected.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "6px 12px" }}>
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false); }}
                style={{
                  fontSize: 11, color: "var(--text-muted)", background: "none",
                  border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Clear all assignees
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}