import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";
import Navbar from "../components/layout/Navbar.jsx";
import KanbanBoard from "../components/tasks/KanbanBoard.jsx";
import ListView from "../components/tasks/ListView.jsx";
import OverviewTab from "../components/tasks/OverviewTab.jsx";
import TaskDetailModal from "../components/tasks/TaskDetailModal.jsx";
import CreateTaskModal from "../components/tasks/CreateTaskModal.jsx";
import InviteMemberModal from "../components/projects/InviteMemberModal.jsx";
import Toast from "../components/shared/Toast.jsx";
import Button from "../components/shared/Button.jsx";
import I from "../components/shared/Icons.jsx";
import {
  ArrowLeft,
  Plus,
  X as Close,
  ChevronDown,
  MoreHorizontal,
  Search,
  Filter,
  Settings,
  UserPlus,
  Send,
  Pencil,
  Trash2,
  ChevronRight,
  Clock,
  Users,
  Calendar,
  Flag,
  User,
  Tag,
  MessageSquare,
  Zap,
  LayoutGrid,
  CheckCircle2,
  Milestone,
  Check,
  Kanban,
  List,
  BarChart2,
  AlertTriangle,
  Crown,
  UserMinus,
} from "lucide-react";

import ActivityFeed from "../components/activity/ActivityFeed.jsx";
import { logActivity } from "../lib/activity.js";

import {
  getAvatarColor,
  getInitials,
} from "../components/data/projectData.jsx";
import { useTasks } from "../hooks/useTasks.js";
import { LayoutList, Activity } from "lucide-react";
import { supabase } from "../lib/supabase.js";

// ─── Sprint selector ──────────────────────────────────────────────────────────
// ─── Sprint selector bar ──────────────────────────────────────────────────────
// ─── Sprint selector bar ──────────────────────────────────────────────────────
function SprintSelectorBar({ sprints, selected, onChange, taskFilter, onTaskFilterChange }) {
  const now = new Date();

  function getSprintStatus(s) {
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  }

  const statusMeta = {
    active:    { dotColor: "#22c55e", label: "Active",   pillBg: "rgba(34,197,94,0.12)",  pillColor: "#15803d" },
    upcoming:  { dotColor: "#f59e0b", label: "Upcoming", pillBg: "rgba(245,158,11,0.12)", pillColor: "#92400e" },
    completed: { dotColor: "#94a3b8", label: "Done",     pillBg: "var(--bg-primary)",      pillColor: "var(--text-muted)" },
  };

  const pillBase = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
    border: "0.5px solid transparent", cursor: "pointer",
    transition: "all 0.15s", whiteSpace: "nowrap", background: "transparent",
    color: "var(--text-secondary)", flexShrink: 0,
  };

  const sprintPillBase = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
    border: "1px solid var(--border)", cursor: "pointer",
    background: "var(--bg-card)", color: "var(--text-secondary)",
    transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* All tasks — fixed left, never scrolls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", flexShrink: 0 }}>
        <button
          onClick={() => onChange("all")}
          style={{
            ...pillBase,
            background: selected === "all" ? "var(--accent)" : "transparent",
            color: selected === "all" ? "#fff" : "var(--text-secondary)",
            border: selected === "all" ? "0.5px solid var(--accent)" : "0.5px solid transparent",
          }}
          onMouseEnter={(e) => { if (selected !== "all") e.currentTarget.style.background = "var(--bg-card)"; }}
          onMouseLeave={(e) => { if (selected !== "all") e.currentTarget.style.background = "transparent"; }}
        >
          <LayoutGrid size={11} />
          All tasks
        </button>

        {/* Vertical divider */}
        {sprints.length > 0 && (
          <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
        )}
      </div>

      {/* Scrollable sprint pills */}
      {sprints.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          overflowX: "auto", flex: 1, padding: "6px 4px",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE
        }}
        // Hide scrollbar in WebKit
        ref={(el) => { if (el) el.style.setProperty("--scrollbar", "none"); }}
        >
          <style>{`.sprint-scroll::-webkit-scrollbar { display: none; }`}</style>
          {sprints.map((s) => {
            const status = getSprintStatus(s);
            const meta = statusMeta[status];
            const isSelected = selected === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange(s.id)}
                style={{
                  ...sprintPillBase,
                  background: isSelected ? "rgba(37,99,235,0.08)" : "var(--bg-card)",
                  borderColor: isSelected ? "rgba(37,99,235,0.3)" : "var(--border)",
                  color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "rgba(37,99,235,0.25)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: meta.dotColor, display: "inline-block", flexShrink: 0,
                }} />
                {s.title}
                <span style={{
                  fontSize: 9, padding: "1px 5px", borderRadius: 10, fontWeight: 500,
                  background: meta.pillBg, color: meta.pillColor,
                }}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right side: divider + Mine — fixed right, never scrolls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", flexShrink: 0 }}>
        <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
        <button
          onClick={() => onTaskFilterChange(taskFilter === "mine" ? "all" : "mine")}
          style={{
            ...pillBase,
            background: taskFilter === "mine" ? "rgba(34,197,94,0.1)" : "transparent",
            color: taskFilter === "mine" ? "#15803d" : "var(--text-secondary)",
            border: taskFilter === "mine" ? "0.5px solid rgba(34,197,94,0.3)" : "0.5px solid transparent",
          }}
          onMouseEnter={(e) => { if (taskFilter !== "mine") e.currentTarget.style.background = "var(--bg-card)"; }}
          onMouseLeave={(e) => { if (taskFilter !== "mine") e.currentTarget.style.background = "transparent"; }}
        >
          <User size={11} />
          Mine
          {taskFilter === "mine" && (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Members panel ────────────────────────────────────────────────────────────
function MembersPanel({
  members,
  isManager,
  onInvite,
  onPermissionChange,
  onRemove,
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : "none" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-primary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            Members
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-muted)",
              fontSize: 10,
            }}
          >
            {members.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {members.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="w-5 h-5 rounded-md border flex items-center justify-center text-white font-semibold"
                style={{
                  background: getAvatarColor(m.name),
                  fontSize: 7,
                  borderColor: "var(--bg-card)",
                  zIndex: 1,
                }}
              >
                {getInitials(m.name)}
              </div>
            ))}
            {members.length > 3 && (
              <div
                className="w-5 h-5 rounded-md border flex items-center justify-center text-xs font-medium"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-muted)",
                  fontSize: 9,
                  borderColor: "var(--bg-card)",
                }}
              >
                +{members.length - 3}
              </div>
            )}
          </div>
          <span
            style={{
              color: "var(--text-muted)",
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            {I.chevronDown}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-2 space-y-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                style={{ background: getAvatarColor(m.name), fontSize: 10 }}
              >
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {m.name}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)", fontSize: 10 }}
                >
                  {m.email}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {m.role === "manager" && (
                  <span
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      background: "rgba(37,99,235,0.1)",
                      color: "var(--accent)",
                      fontSize: 9,
                    }}
                  >
                    <Crown size={11} /> PM
                  </span>
                )}
                {isManager && m.role !== "manager" && (
                  <button
                    onClick={() => onRemove(m)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:opacity-70"
                    style={{
                      color: "#dc2626",
                      background: "var(--bg-primary)",
                    }}
                    title="Remove member"
                  >
                    <UserMinus size={13} />{" "}
                    {/* add UserMinus to your lucide imports */}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isManager && (
            <button
              onClick={onInvite}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all mt-1"
              style={{
                color: "var(--accent)",
                border: "1px dashed var(--border)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--accent-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {I.userPlus} Invite member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Permission editor modal ──────────────────────────────────────────────────
function PermissionsModal({ member, onClose, onSave }) {
  const [perms, setPerms] = useState({ can_add_tasks: member.can_add_tasks });
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up opacity-0"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="text-sm font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Permissions
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {member.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
            }}
          >
            {I.close}
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div
            className="flex items-start justify-between gap-4 p-3 rounded-xl"
            style={{ background: "var(--bg-primary)" }}
          >
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Can add tasks
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Allow this member to create new tasks in the project.
              </p>
            </div>
            <button
              onClick={() =>
                setPerms((prev) => ({
                  ...prev,
                  can_add_tasks: !prev.can_add_tasks,
                }))
              }
              className="relative shrink-0 w-10 h-5 rounded-full transition-all duration-200"
              style={{
                background: perms.can_add_tasks
                  ? "var(--accent)"
                  : "var(--border)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left: perms.can_add_tasks ? 22 : 2 }}
              />
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onSave(member.id, perms);
                onClose();
              }}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
      style={{
        background: active ? "var(--accent-light)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        border: active
          ? "1px solid rgba(37,99,235,0.2)"
          : "1px solid transparent",
      }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Sprints panel ────────────────────────────────────────────────────────────
// ─── Create Sprint Modal ───────────────────────────────────────────────────────
function CreateSprintModal({ projectId, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const durationDays =
    form.start_date && form.end_date
      ? Math.round(
          (new Date(form.end_date) - new Date(form.start_date)) / 86400000,
        )
      : null;

  const handleCreate = async () => {
    if (!form.title.trim() || !form.start_date || !form.end_date) return;
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError("End date must be after start date.");
      return;
    }
    setSaving(true);
    setError("");
    const { data, error } = await supabase
      .from("sprints")
      .insert({
        project_id: projectId,
        title: form.title.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated(data);
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}
            >
              <Zap size={15} />
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                New sprint
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Add a time-boxed work period
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Close size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label
              className="block mb-1.5"
              style={{ color: "var(--text-muted)", fontSize: 11 }}
            >
              Sprint name
            </label>
            <input
              type="text"
              placeholder="e.g. Sprint 3 — Auth flow"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block mb-1.5"
                style={{ color: "var(--text-muted)", fontSize: 11 }}
              >
                Start date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label
                className="block mb-1.5"
                style={{ color: "var(--text-muted)", fontSize: 11 }}
              >
                End date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>

          {durationDays !== null && durationDays > 0 && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                marginTop: -8,
              }}
            >
              Duration: {durationDays} day{durationDays !== 1 ? "s" : ""}
            </p>
          )}

          {error && (
            <p
              className="flex items-center gap-1.5"
              style={{ color: "#dc2626", fontSize: 11 }}
            >
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="py-2 rounded-xl text-xs font-medium"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={
              saving || !form.title.trim() || !form.start_date || !form.end_date
            }
            className="py-2 rounded-xl text-xs font-medium transition-opacity"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity:
                saving ||
                !form.title.trim() ||
                !form.start_date ||
                !form.end_date
                  ? 0.5
                  : 1,
            }}
          >
            {saving ? "Creating…" : "Create sprint"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Milestone Modal ────────────────────────────────────────────────────
function CreateMilestoneModal({ projectId, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", due_date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        project_id: projectId,
        title: form.title.trim(),
        due_date: form.due_date || null,
        status: "pending",
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated(data);
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(37,99,235,0.1)",
                color: "var(--accent)",
              }}
            >
              <Milestone size={15} />
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                New milestone
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>
                Mark a key project checkpoint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Close size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label
              className="block mb-1.5"
              style={{ color: "var(--text-muted)", fontSize: 11 }}
            >
              Milestone name
            </label>
            <input
              type="text"
              placeholder="e.g. Beta launch ready"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="block mb-1.5"
              style={{ color: "var(--text-muted)", fontSize: 11 }}
            >
              Due date{" "}
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  opacity: 0.6,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_date: e.target.value }))
              }
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              className="flex items-center gap-1.5"
              style={{ color: "#dc2626", fontSize: 11 }}
            >
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="py-2 rounded-xl text-xs font-medium"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="py-2 rounded-xl text-xs font-medium transition-opacity"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: saving || !form.title.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "Adding…" : "Add milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── All Sprints Modal ────────────────────────────────────────────────────────
function AllSprintsModal({
  sprints,
  projectId,
  isManager,
  onClose,
  onDelete,
  onSprintsChange,
}) {
  const now = new Date();

  function getStatus(s) {
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  }

  const statusStyle = {
    active: {
      label: "Active",
      dotColor: "#22c55e",
      pillBg: "rgba(34,197,94,0.12)",
      pillColor: "#16a34a",
    },
    upcoming: {
      label: "Upcoming",
      dotColor: "#f59e0b",
      pillBg: "rgba(245,158,11,0.12)",
      pillColor: "#b45309",
    },
    completed: {
      label: "Completed",
      dotColor: "var(--text-muted)",
      pillBg: "var(--bg-primary)",
      pillColor: "var(--text-muted)",
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}
            >
              <Zap size={15} />
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                All sprints
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>
                {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Close size={14} />
          </button>
        </div>

        {/* Sprint list */}
        <div className="overflow-y-auto flex-1">
          {sprints.map((s, i) => {
            const status = getStatus(s);
            const st = statusStyle[status];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{
                  borderBottom:
                    i < sprints.length - 1 ? "1px solid var(--border)" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  className="shrink-0 rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    background: st.dotColor,
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s.title}
                    </p>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: st.pillBg,
                        color: st.pillColor,
                        fontSize: 9,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {new Date(s.start_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                    {" → "}
                    {new Date(s.end_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {isManager && (
                  <button
                    onClick={() => onDelete(s.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-all hover:opacity-70"
                    style={{
                      color: "var(--text-muted)",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                    }}
                    title="Delete sprint"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── All Milestones Modal ─────────────────────────────────────────────────────
function AllMilestonesModal({
  milestones,
  isManager,
  onClose,
  onToggle,
  onDelete,
}) {
  const now = new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(37,99,235,0.1)",
                color: "var(--accent)",
              }}
            >
              <Milestone size={15} />
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                All milestones
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>
                {milestones.filter((m) => m.status === "completed").length} of{" "}
                {milestones.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <Close size={14} />
          </button>
        </div>

        {/* Milestone list */}
        <div className="overflow-y-auto flex-1">
          {milestones.map((m, i) => {
            const isOverdue =
              m.due_date &&
              m.status !== "completed" &&
              new Date(m.due_date) < now;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{
                  borderBottom:
                    i < milestones.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <button
                  onClick={() => onToggle(m)}
                  className="shrink-0 flex items-center justify-center rounded-md transition-all"
                  style={{
                    width: 15,
                    height: 15,
                    border: `1.5px solid ${m.status === "completed" ? "#22c55e" : isOverdue ? "#dc2626" : "var(--border)"}`,
                    background:
                      m.status === "completed" ? "#22c55e" : "transparent",
                  }}
                  aria-label={
                    m.status === "completed"
                      ? "Mark as pending"
                      : "Mark as complete"
                  }
                >
                  {m.status === "completed" && (
                    <Check size={8} color="white" strokeWidth={3} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{
                      color:
                        m.status === "completed"
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                      textDecoration:
                        m.status === "completed" ? "line-through" : "none",
                    }}
                  >
                    {m.title}
                  </p>
                  {m.due_date && (
                    <p
                      style={{
                        color: isOverdue ? "#dc2626" : "var(--text-muted)",
                        fontSize: 10,
                        marginTop: 1,
                      }}
                    >
                      {isOverdue ? "⚠ Overdue · " : "Due "}
                      {new Date(m.due_date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                {isManager && (
                  <button
                    onClick={() => onDelete(m.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-all hover:opacity-70"
                    style={{
                      color: "var(--text-muted)",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border)",
                    }}
                    aria-label="Delete milestone"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sprints panel ────────────────────────────────────────────────────────────
function SprintsPanel({ sprints, projectId, isManager, onSprintsChange }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const now = new Date();

  function getStatus(s) {
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  }

  const statusStyle = {
    active: {
      label: "Active",
      dotColor: "#22c55e",
      pillBg: "rgba(34,197,94,0.12)",
      pillColor: "#16a34a",
    },
    upcoming: {
      label: "Upcoming",
      dotColor: "#f59e0b",
      pillBg: "rgba(245,158,11,0.12)",
      pillColor: "#b45309",
    },
    completed: {
      label: "Completed",
      dotColor: "var(--text-muted)",
      pillBg: "var(--bg-primary)",
      pillColor: "var(--text-muted)",
    },
  };

  const handleDelete = async (sprintId) => {
    const { error } = await supabase
      .from("sprints")
      .delete()
      .eq("id", sprintId);
    if (error) {
      console.error(error);
      return;
    }
    onSprintsChange(sprints.filter((s) => s.id !== sprintId));
  };

  // Sort: active first, then upcoming, then completed. Show only first 2.
  const sorted = [...sprints].sort((a, b) => {
    const order = { active: 0, upcoming: 1, completed: 2 };
    return order[getStatus(a)] - order[getStatus(b)];
  });
  const preview = sorted.slice(0, 2);
  const hasMore = sprints.length > 2;

  const SprintRow = ({ s, i, total }) => {
    const status = getStatus(s);
    const st = statusStyle[status];
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 transition-colors"
        style={{
          borderBottom: i < total - 1 ? "1px solid var(--border)" : "none",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-primary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span
          className="shrink-0 rounded-full"
          style={{
            width: 6,
            height: 6,
            background: st.dotColor,
            flexShrink: 0,
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {s.title}
            </p>
            <span
              className="shrink-0 px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: st.pillBg,
                color: st.pillColor,
                fontSize: 9,
              }}
            >
              {st.label}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 10 }}>
            {new Date(s.start_date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            })}
            {" → "}
            {new Date(s.end_date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => handleDelete(s.id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-all hover:opacity-70"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
            title="Delete sprint"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom:
              sprints.length > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={13} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-xs font-semibold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              Sprints
            </span>
            <span
              className="px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-muted)",
                fontSize: 10,
              }}
            >
              {sprints.length}
            </span>
          </div>
          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
              }}
              title="New sprint"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {/* Empty state */}
        {sprints.length === 0 && (
          <div className="px-4 py-5 text-center">
            <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
              No sprints yet.
            </p>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                + Create first sprint
              </button>
            )}
          </div>
        )}

        {/* Preview rows (max 2) */}
        {preview.map((s, i) => (
          <SprintRow key={s.id} s={s} i={i} total={preview.length} />
        ))}

        {/* View more button */}
        {hasMore && (
          <button
            onClick={() => setShowAllModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: "var(--accent)",
              borderTop: "1px solid var(--border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--accent-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            View all {sprints.length} sprints
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      {showCreateModal && (
        <CreateSprintModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newSprint) => onSprintsChange([...sprints, newSprint])}
        />
      )}

      {showAllModal && (
        <AllSprintsModal
          sprints={sorted}
          projectId={projectId}
          isManager={isManager}
          onClose={() => setShowAllModal(false)}
          onDelete={async (sprintId) => {
            await handleDelete(sprintId);
            if (sprints.length - 1 <= 2) setShowAllModal(false);
          }}
          onSprintsChange={onSprintsChange}
        />
      )}
    </>
  );
}

// ─── Milestones panel ─────────────────────────────────────────────────────────
function MilestonesPanel({
  milestones,
  projectId,
  isManager,
  onMilestonesChange,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const now = new Date();

  const handleToggle = async (m) => {
    const newStatus = m.status === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("milestones")
      .update({ status: newStatus })
      .eq("id", m.id);
    if (error) {
      console.error(error);
      return;
    }
    onMilestonesChange(
      milestones.map((ms) =>
        ms.id === m.id ? { ...ms, status: newStatus } : ms,
      ),
    );
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    onMilestonesChange(milestones.filter((m) => m.id !== id));
  };

  // Sort: pending first (overdue at top), then completed. Show only first 2.
  const sorted = [...milestones].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return 0;
  });
  const preview = sorted.slice(0, 2);
  const hasMore = milestones.length > 2;

  const MilestoneRow = ({ m, i, total }) => {
    const isOverdue =
      m.due_date && m.status !== "completed" && new Date(m.due_date) < now;
    return (
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 transition-colors"
        style={{
          borderBottom: i < total - 1 ? "1px solid var(--border)" : "none",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-primary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <button
          onClick={() => handleToggle(m)}
          className="shrink-0 flex items-center justify-center rounded-md transition-all"
          style={{
            width: 15,
            height: 15,
            border: `1.5px solid ${m.status === "completed" ? "#22c55e" : isOverdue ? "#dc2626" : "var(--border)"}`,
            background: m.status === "completed" ? "#22c55e" : "transparent",
          }}
          aria-label={
            m.status === "completed" ? "Mark as pending" : "Mark as complete"
          }
        >
          {m.status === "completed" && (
            <Check size={8} color="white" strokeWidth={3} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{
              color:
                m.status === "completed"
                  ? "var(--text-muted)"
                  : "var(--text-primary)",
              textDecoration:
                m.status === "completed" ? "line-through" : "none",
            }}
          >
            {m.title}
          </p>
          {m.due_date && (
            <p
              style={{
                color: isOverdue ? "#dc2626" : "var(--text-muted)",
                fontSize: 10,
                marginTop: 1,
              }}
            >
              {isOverdue ? "⚠ Overdue · " : "Due "}
              {new Date(m.due_date).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        {isManager && (
          <button
            onClick={() => handleDelete(m.id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 transition-all hover:opacity-70"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
            aria-label="Delete milestone"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom:
              milestones.length > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="flex items-center gap-2">
            <Milestone size={13} style={{ color: "var(--text-muted)" }} />
            <span
              className="text-xs font-semibold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              Milestones
            </span>
            <span
              className="px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-muted)",
                fontSize: 10,
              }}
            >
              {milestones.length}
            </span>
          </div>
          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
              }}
              title="New milestone"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {/* Empty state */}
        {milestones.length === 0 && (
          <div className="px-4 py-5 text-center">
            <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
              No milestones yet.
            </p>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                + Add first milestone
              </button>
            )}
          </div>
        )}

        {/* Preview rows (max 2) */}
        {preview.map((m, i) => (
          <MilestoneRow key={m.id} m={m} i={i} total={preview.length} />
        ))}

        {/* View more button */}
        {hasMore && (
          <button
            onClick={() => setShowAllModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: "var(--accent)",
              borderTop: "1px solid var(--border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--accent-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            View all {milestones.length} milestones
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      {showCreateModal && (
        <CreateMilestoneModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newMilestone) =>
            onMilestonesChange([...milestones, newMilestone])
          }
        />
      )}

      {showAllModal && (
        <AllMilestonesModal
          milestones={sorted}
          isManager={isManager}
          onClose={() => setShowAllModal(false)}
          onToggle={handleToggle}
          onDelete={async (id) => {
            await handleDelete(id);
            if (milestones.length - 1 <= 2) setShowAllModal(false);
          }}
        />
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    updateTask,
    updateTaskStatusOptimistic,
    deleteTask,
  } = useTasks(id);
  const [taskFilter, setTaskFilter] = useState("all"); // 'all' | 'mine'

  const [panelTab, setPanelTab] = useState("team");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("kanban");
  const [sprint, setSprint] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createStatus, setCreateStatus] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [permsMember, setPermsMember] = useState(null);

  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const showToast = (type, msg) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4000);
  };

  const [notFound, setNotFound] = useState(false);

  // Replace the fetchProject useEffect
  useEffect(() => {
    if (!id || !user) return;
    async function fetchProject() {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
        *,
        sprints (id, title, start_date, end_date, created_at),
        milestones (id, title, due_date, status, created_at),
        project_members (
  role, permissions,
  user:profiles_with_email!project_members_user_id_fkey (id, display_name, email)
)
      `,
        )
        .eq("id", id)
        .single();

      if (!data) {
        setNotFound(true);
        return;
      }

      if (error) {
        showToast("error", error.message);

        return;
      }
      if (data) {
        const myMembership = data.project_members.find(
          (m) => m.user?.id === user.id,
        );
        if (!myMembership) {
          setNotFound(true); // ← add this
          return;
        }
        setProject({ ...data, role: myMembership?.role || "contributor" });
        setMembers(
          data.project_members.map((m) => ({
            id: m.user.id,
            name: m.user.display_name || m.user.email,
            email: m.user.email,
            role: m.role,
            permissions: m.permissions,
          })),
        );
        setSprint((prev) => prev);
      }
    }
    fetchProject();
  }, [id, user]);

  const handleTaskUpdate = async (taskId, updates) => {
  const oldTask = tasks.find((t) => t.id === taskId);
  await updateTask(
    taskId,
    {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      assigned_to: updates.assigned_to,
      assignees: updates.assignees,   // ← ADD THIS
      due_date: updates.due_date,
      sprint_id: updates.sprint_id,
      milestone_id: updates.milestone_id,
    },
    user?.id,
    oldTask,
  );
  showToast("success", "Task updated.");
};

  const handleCreateTask = async (taskData) => {
    try {
      const created = await createTask(
        { ...taskData, project_id: id },
        user?.id,
      );
      setCreateStatus(null);
      showToast("success", `Task "${created.title}" created.`);
    } catch (e) {
      showToast("error", e.message);
    }
  };

  const handlePermSave = async (memberId, perms) => {
    const { error } = await supabase
      .from("project_members")
      .update(perms)
      .eq("project_id", id)
      .eq("user_id", memberId);
    if (error) {
      showToast("error", error.message);
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...perms } : m)),
    );
    showToast("success", "Permissions updated.");
  };

  const handleInvite = async (email) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      showToast("error", "User not found. They must sign up first.");
      return;
    }
    const { error } = await supabase.from("project_members").insert({
      project_id: id,
      user_id: profile.id,
      role: "contributor",
      // removed can_add_tasks — doesn't exist
    });
    if (error) {
      showToast("error", error.message);
      return;
    }
    showToast("success", `${email} added to project.`);

    logActivity(id, user.id, "member_joined", {
      member_name: email,
      member_email: email,
    });
    setShowInvite(false);
  };

  const handleDeleteProject = async () => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      navigate("/projects");
    } catch (e) {
      showToast("error", e.message);
    }
  };

  const handleRemoveMember = async (member) => {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", id)
      .eq("user_id", member.id);
    if (error) {
      showToast("error", error.message);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    showToast("success", `${member.name} removed from project.`);
  };

  // Loading / not found states

  if (notFound) {
    navigate("/projects", { replace: true });
    return null;
  }

  if (!project) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Loading project…
        </p>
      </div>
    );
  }

  const isManager = project.role === "manager";
  const canAddTasks =
    isManager ||
    (members.find((m) => m.email === user?.email)?.permissions?.can_add_tasks ??
      false);
  const visibleTasks = tasks
    .filter((t) => sprint === "all" || t.sprint_id === sprint)
    .filter((t) => taskFilter === "all" || t.assigned_to === user?.id);
  const selectedSprintObj = project.sprints?.find((s) => s.id === sprint);

  // Derive live progress from tasks
  const liveProgress = tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
      )
    : (project.progress ?? 0);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar title={project.title} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Project header bar */}
          <div
            className="px-4 md:px-6 py-3 shrink-0 flex flex-col gap-3"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-secondary)",
            }}
          >
            {/* Breadcrumb + actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/projects")}
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {I.arrowLeft}
                  <span className="hidden sm:inline">Projects</span>
                </button>
                <span style={{ color: "var(--border)" }}>/</span>
                <span
                  className="text-xs font-semibold truncate max-w-[160px] sm:max-w-xs"
                  style={{ color: "var(--text-primary)" }}
                >
                  {project.title}
                </span>
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium hidden sm:inline-flex"
                  style={{
                    background: isManager
                      ? "rgba(37,99,235,0.1)"
                      : "var(--bg-primary)",
                    color: isManager ? "var(--accent)" : "var(--text-muted)",
                    border: "1px solid var(--border)",
                    fontSize: 10,
                  }}
                >
                  {isManager ? (
                    <>
                      <Crown size={10} /> PM
                    </>
                  ) : (
                    <>
                      <Pencil size={10} /> Contributor
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isManager && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowInvite(true)}
                  >
                    {I.userPlus}
                    <span className="hidden sm:inline">Invite</span>
                  </Button>
                )}
                {canAddTasks && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateStatus("todo")}
                  >
                    {I.plus}
                    <span className="hidden sm:inline">Add Task</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Sprint selector + tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div style={{ flex: 1, minWidth: 0 }}>
    <SprintSelectorBar
      sprints={project.sprints ?? []}
      selected={sprint}
      onChange={setSprint}
      taskFilter={taskFilter}
      onTaskFilterChange={setTaskFilter}
    />
  </div>
  <div className="flex items-center gap-1 shrink-0">
    <TabBtn icon={I.kanban} label="Kanban" active={tab === "kanban"} onClick={() => setTab("kanban")} />
    <TabBtn icon={I.list}   label="List"   active={tab === "list"}   onClick={() => setTab("list")} />
    <TabBtn icon={I.chart}  label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
  </div>
</div>

            {/* Sprint info strip */}
            {/* Sprint info strip */}
            {selectedSprintObj &&
              sprint !== "all" &&
              (() => {
                const now = new Date();
                const start = new Date(selectedSprintObj.start_date);
                const end = new Date(selectedSprintObj.end_date);
                const computedStatus =
                  now < start ? "upcoming" : now > end ? "completed" : "active";
                const statusStyles = {
                  active: { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
                  upcoming: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
                  completed: {
                    bg: "var(--bg-primary)",
                    color: "var(--text-muted)",
                  },
                };
                const ss = statusStyles[computedStatus];
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(
                        selectedSprintObj.start_date,
                      ).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" → "}
                      {new Date(selectedSprintObj.end_date).toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        background: ss.bg,
                        color: ss.color,
                        fontSize: 10,
                      }}
                    >
                      {computedStatus}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {visibleTasks.length} task
                      {visibleTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })()}
          </div>

          {/* Content area */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
              {tab === "kanban" && (
                <KanbanBoard
                  tasks={visibleTasks}
                  members={members}
                  onTaskClick={setSelectedTask}
                  onAddTask={(status) => setCreateStatus(status)}
                  canAddTasks={!!canAddTasks}
                  isManager={isManager}
                  currentUser={user}
                  onStatusChange={(taskId, newStatus) =>
                    updateTaskStatusOptimistic(taskId, newStatus, user?.id)
                  }
                  onDragError={(msg) => showToast("error", msg)}
                />
              )}
              {tab === "list" && (
                <ListView
                  tasks={visibleTasks}
                  members={members}
                  onTaskClick={setSelectedTask}
                  onAddTask={(status) => setCreateStatus(status)}
                  canAddTasks={!!canAddTasks}
                />
              )}
              {tab === "overview" && (
                <OverviewTab
                  project={{ ...project, progress: liveProgress }}
                  tasks={tasks}
                  members={members}
                />
              )}
            </div>

            {/* Right panel */}
            <div
              className="hidden lg:flex flex-col shrink-0 transition-all duration-300"
              style={{
                borderLeft: "1px solid var(--border)",
                width: rightPanelOpen ? 260 : 48,
                background: "var(--bg-secondary)",
                overflow: "hidden",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center shrink-0 px-2 gap-1"
                style={{
                  height: 48,
                  borderBottom: "1px solid var(--border)",
                  justifyContent: rightPanelOpen ? "space-between" : "center",
                }}
              >
                {rightPanelOpen && (
                  <div className="flex items-center gap-0.5">
                    {[
                      { key: "team", icon: <Users size={13} />, label: "Team" },
                      {
                        key: "planning",
                        icon: <LayoutList size={13} />,
                        label: "Plan",
                      },
                      {
                        key: "activity",
                        icon: <Activity size={13} />,
                        label: "Activity",
                      },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setPanelTab(t.key)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background:
                            panelTab === t.key
                              ? "var(--accent-light)"
                              : "transparent",
                          color:
                            panelTab === t.key
                              ? "var(--accent)"
                              : "var(--text-muted)",
                        }}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setRightPanelOpen((o) => !o)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                  title={rightPanelOpen ? "Collapse panel" : "Expand panel"}
                >
                  <span
                    style={{
                      transform: rightPanelOpen
                        ? "rotate(0deg)"
                        : "rotate(180deg)",
                      transition: "transform 0.3s",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronRight size={14} />
                  </span>
                </button>
              </div>

              {/* Panel content */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  opacity: rightPanelOpen ? 1 : 0,
                  transition: "opacity 0.2s",
                  pointerEvents: rightPanelOpen ? "auto" : "none",
                }}
              >
                <div className="px-3 py-3 flex flex-col gap-3">
                  {panelTab === "team" && (
                    <MembersPanel
                      members={members}
                      isManager={isManager}
                      onInvite={() => setShowInvite(true)}
                      onPermissionChange={setPermsMember}
                      onRemove={handleRemoveMember}
                    />
                  )}

                  {panelTab === "planning" && (
                    <>
                      <div
                        className="rounded-2xl p-4 space-y-3"
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--bg-card)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontSize: 10,
                          }}
                        >
                          Project Info
                        </p>
                        {project.description && (
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {project.description}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: "var(--text-muted)" }}>
                              Progress
                            </span>
                            <span
                              className="font-semibold"
                              style={{ color: "var(--accent)" }}
                            >
                              {liveProgress}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--bg-primary)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${liveProgress}%`,
                                background: "var(--accent)",
                              }}
                            />
                          </div>
                        </div>
                        {project.due_date && (
                          <div
                            className="flex items-center gap-1.5 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Calendar size={12} />
                            Due{" "}
                            {new Date(project.due_date).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        )}
                        <div
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Zap size={12} />
                          {project.sprints?.length ?? 0} sprints ·{" "}
                          {project.milestones?.length ?? 0} milestones
                        </div>
                        {isManager && (
                          <div
                            style={{
                              paddingTop: 4,
                              borderTop: "1px solid var(--border)",
                              marginTop: 4,
                            }}
                          >
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                              style={{
                                color: "#dc2626",
                                border: "1px solid rgba(220,38,38,0.2)",
                                background: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(220,38,38,0.06)";
                                e.currentTarget.style.borderColor =
                                  "rgba(220,38,38,0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.borderColor =
                                  "rgba(220,38,38,0.2)";
                              }}
                            >
                              <Trash2 size={12} />
                              Delete project
                            </button>
                          </div>
                        )}
                      </div>

                      <SprintsPanel
                        sprints={project.sprints ?? []}
                        projectId={id}
                        isManager={isManager}
                        onSprintsChange={(sprints) =>
                          setProject((p) => ({ ...p, sprints }))
                        }
                      />

                      <MilestonesPanel
                        milestones={project.milestones ?? []}
                        projectId={id}
                        isManager={isManager}
                        onMilestonesChange={(milestones) =>
                          setProject((p) => ({ ...p, milestones }))
                        }
                      />
                    </>
                  )}

                  {panelTab === "activity" && <ActivityFeed projectId={id} />}
                </div>
              </div>

              {/* Collapsed hints */}
              {!rightPanelOpen && (
                <div
                  className="flex flex-col items-center gap-3 pt-3"
                  style={{ opacity: 0.4 }}
                >
                  <Users size={15} style={{ color: "var(--text-muted)" }} />
                  <LayoutList
                    size={15}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <Activity size={15} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={members}
          sprints={project.sprints ?? []}
          milestones={project.milestones ?? []}
          currentUser={user}
          isManager={isManager} // ← add this
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={async (taskId) => {
            await deleteTask(taskId);
            setSelectedTask(null);
            showToast("success", "Task deleted.");
          }}
        />
      )}
      {createStatus !== null && (
        // ProjectDetailsPage.jsx — already have milestones on project object
        <CreateTaskModal
          defaultStatus={createStatus}
          defaultSprintId={sprint !== "all" ? sprint : ""}
          members={members}
          sprints={project.sprints ?? []}
          milestones={project.milestones ?? []} // add this
          onClose={() => setCreateStatus(null)}
          onCreate={handleCreateTask}
        />
      )}
      {showInvite && (
        <InviteMemberModal
          existingEmails={members.map((m) => m.email)}
          projectId={id}
          projectName={project.title}
          inviterName={user?.user_metadata?.display_name || user?.email}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
      {permsMember && (
        <PermissionsModal
          member={permsMember}
          onClose={() => setPermsMember(null)}
          onSave={handlePermSave}
        />
      )}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(220,38,38,0.1)" }}
              >
                <Trash2 size={18} color="#dc2626" />
              </div>
              <div>
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Delete project?
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  This will permanently delete all tasks, sprints, and
                  milestones.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleDeleteProject}
              >
                Delete forever
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
