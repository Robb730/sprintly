import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { RefreshCw, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  todo:        { label: "To Do",       color: "#888780" },
  in_progress: { label: "In Progress", color: "#3b82f6" },
  in_review:   { label: "In Review",   color: "#f59e0b" },
  done:        { label: "Done",        color: "#22c55e" },
};

// ✅ FIX: use LOCAL date parts, not UTC
function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayKey() {
  return localDateKey(new Date());
}

function formatDateLabel(dateStr) {
  const today = todayKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const thisYear = new Date().getFullYear();
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== thisYear ? { year: "numeric" } : {}),
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name = "") {
  return name.split(" ").map((p) => p[0] || "").join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name = "") {
  const colors = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#22c55e","#06b6d4","#f97316"];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getDotColor(action, metadata) {
  if (action === "task_created") return "#22c55e";
  if (action === "task_status_changed")
    return STATUS_COLORS[metadata?.new_status]?.color ?? "#888780";
  if (action === "task_updated") return "#f59e0b";
  if (action === "member_joined") return "#8b5cf6";
  return "var(--text-muted)";
}

function ActionText({ action, metadata = {} }) {
  if (action === "task_created")
    return <>created <span style={{ color: "#16a34a", fontWeight: 500 }}>"{metadata.task_title}"</span></>;
  if (action === "task_status_changed") {
    const s = STATUS_COLORS[metadata.new_status] ?? { label: metadata.new_status, color: "#888" };
    return <>moved <span style={{ color: "#2563eb", fontWeight: 500 }}>"{metadata.task_title}"</span> to <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span></>;
  }
  if (action === "task_updated")
    return <>updated <span style={{ color: "#d97706", fontWeight: 500 }}>"{metadata.task_title}"</span>{metadata.changes?.length > 0 && <span style={{ color: "var(--text-muted)" }}> · {metadata.changes[0]}</span>}</>;
  if (action === "member_joined") return <>joined the project</>;
  return <>{action.replace(/_/g, " ")}</>;
}

const FILTERS = [
  { id: "all",                 label: "All" },
  { id: "task_created",        label: "Created" },
  { id: "task_status_changed", label: "Status" },
  { id: "task_updated",        label: "Updated" },
  { id: "member_joined",       label: "Members" },
];

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ activeDates, selectedDate, onSelect, onClose }) {
  const today = todayKey();
  const [viewYear, setViewYear] = useState(() => {
    const [y] = selectedDate.split("-").map(Number);
    return y;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const [, m] = selectedDate.split("-").map(Number);
    return m - 1; // 0-indexed
  });

  const activeSet = new Set(activeDates);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const [ty, tm] = today.split("-").map(Number);
    if (viewYear > ty || (viewYear === ty && viewMonth >= tm - 1)) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-PH", {
    month: "long", year: "numeric",
  });

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [ty, tm] = today.split("-").map(Number);
  const isNextDisabled = viewYear > ty || (viewYear === ty && viewMonth >= tm - 1);

  const btnBase = {
    width: 26, height: 26, borderRadius: 7, display: "flex",
    alignItems: "center", justifyContent: "center", cursor: "pointer",
    border: "1px solid var(--border)", background: "var(--bg-primary)",
    color: "var(--text-muted)",
  };

  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, zIndex: 50, marginTop: 6,
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "12px", width: 220,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={prevMonth} style={btnBase}><ChevronLeft size={13} /></button>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{monthName}</span>
        <button onClick={nextMonth} disabled={isNextDisabled}
          style={{ ...btnBase, opacity: isNextDisabled ? 0.3 : 1, cursor: isNextDisabled ? "default" : "pointer" }}>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, color: "var(--text-muted)", fontWeight: 600, padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const hasActivity = activeSet.has(key);
          const isFuture = key > today;

          return (
            <button
              key={i}
              disabled={isFuture}
              onClick={() => { onSelect(key); onClose(); }}
              style={{
                width: "100%", aspectRatio: "1", borderRadius: 7,
                fontSize: 10, fontWeight: isSelected || isToday ? 600 : 400,
                border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                background: isSelected ? "var(--accent)" : "transparent",
                color: isSelected ? "#fff" : isFuture ? "var(--text-muted)" : "var(--text-primary)",
                cursor: isFuture ? "default" : "pointer",
                opacity: isFuture ? 0.3 : 1,
                position: "relative",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 1,
              }}
              onMouseEnter={(e) => { if (!isSelected && !isFuture) e.currentTarget.style.background = "var(--bg-primary)"; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
            >
              {day}
              {hasActivity && !isSelected && (
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--accent)" }} />
              )}
              {hasActivity && isSelected && (
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Has activity</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActivityFeed({ projectId }) {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showCalendar, setShowCalendar] = useState(false);

  // All dates that have at least one activity log
  const activeDates = useMemo(() => {
    const keys = new Set(
      allEntries.map((e) => localDateKey(new Date(e.created_at)))
    );
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [allEntries]);

  // Sorted list for prev/next navigation: today always first
  const availableDates = useMemo(() => {
    const today = todayKey();
    const set = new Set(activeDates);
    if (!set.has(today)) set.add(today);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [activeDates]);

  const dateIdx = availableDates.indexOf(selectedDate);
  const canGoPrev = dateIdx > 0; // newer
  const canGoNext = dateIdx < availableDates.length - 1; // older

  const fetchData = useCallback(async (silent = false) => {
    if (!projectId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data, error } = await supabase
      .from("project_activity")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("ActivityFeed:", error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const userIds = [...new Set((data || []).map((e) => e.user_id))];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles_with_email")
        .select("id, display_name, email")
        .in("id", userIds);
      (profiles || []).forEach((p) => { userMap[p.id] = p; });
    }

    setAllEntries((data || []).map((e) => ({ ...e, user: userMap[e.user_id] || null })));
    setLoading(false);
    setRefreshing(false);
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset to today on project switch
  useEffect(() => { setSelectedDate(todayKey()); setActiveFilter("all"); }, [projectId]);

  // Close calendar on outside click
  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e) => {
      if (!e.target.closest("[data-calendar-root]")) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCalendar]);

  const isToday = selectedDate === todayKey();

  const dayEntries = useMemo(() =>
    allEntries.filter((e) => localDateKey(new Date(e.created_at)) === selectedDate),
    [allEntries, selectedDate]
  );

  const filteredEntries = useMemo(() =>
    activeFilter === "all" ? dayEntries : dayEntries.filter((e) => e.action === activeFilter),
    [dayEntries, activeFilter]
  );

  if (loading) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading activity…</p>
      </div>
    );
  }

  const navBtnStyle = (enabled) => ({
    width: 26, height: 26, borderRadius: 8, display: "flex",
    alignItems: "center", justifyContent: "center",
    cursor: enabled ? "pointer" : "default",
    background: "var(--bg-primary)", border: "1px solid var(--border)",
    color: "var(--text-muted)", opacity: enabled ? 1 : 0.35,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Date navigation ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            {formatDateLabel(selectedDate)}
          </p>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
            {dayEntries.length} event{dayEntries.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }} data-calendar-root>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayKey())}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 8, cursor: "pointer",
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Today
            </button>
          )}

          {/* Newer (←) */}
          <button
            onClick={() => canGoPrev && setSelectedDate(availableDates[dateIdx - 1])}
            disabled={!canGoPrev}
            title="Newer date"
            style={navBtnStyle(canGoPrev)}
          >
            <ChevronLeft size={13} />
          </button>

          {/* Older (→) */}
          <button
            onClick={() => canGoNext && setSelectedDate(availableDates[dateIdx + 1])}
            disabled={!canGoNext}
            title="Older date"
            style={navBtnStyle(canGoNext)}
          >
            <ChevronRight size={13} />
          </button>

          {/* Calendar picker */}
          <button
            onClick={() => setShowCalendar((v) => !v)}
            title="Pick a date"
            style={{
              ...navBtnStyle(true),
              background: showCalendar ? "var(--accent-light)" : "var(--bg-primary)",
              color: showCalendar ? "var(--accent)" : "var(--text-muted)",
              border: showCalendar ? "1px solid var(--accent)" : "1px solid var(--border)",
            }}
          >
            <CalendarDays size={12} />
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            title="Refresh"
            style={navBtnStyle(true)}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Calendar dropdown */}
          {showCalendar && (
            <MiniCalendar
              activeDates={activeDates}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count = f.id === "all" ? dayEntries.length : dayEntries.filter((e) => e.action === f.id).length;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: isActive ? "var(--accent-light)" : "var(--bg-primary)",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                cursor: "pointer", fontWeight: isActive ? 600 : 400,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {f.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9, padding: "0 4px", borderRadius: 4,
                  background: isActive ? "rgba(37,99,235,0.15)" : "var(--bg-card)",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {filteredEntries.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <CalendarDays size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px", display: "block" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
            {isToday ? "No activity today" : `No activity on this day`}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            {activeFilter !== "all"
              ? "Try changing the filter above."
              : isToday
              ? "Actions like creating tasks and moving cards will appear here."
              : "Nothing was logged on this day."}
          </p>
        </div>
      )}

      {/* ── Timeline entries ── */}
      {filteredEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredEntries.map((entry, i) => {
            const name =
              entry.user?.display_name ||
              entry.user?.email?.split("@")[0] ||
              "Someone";
            const dotColor = getDotColor(entry.action, entry.metadata || {});
            const isLast = i === filteredEntries.length - 1;

            return (
              <div
                key={entry.id}
                style={{ display: "flex", gap: 10, position: "relative", paddingBottom: isLast ? 0 : 14 }}
              >
                {!isLast && (
                  <div style={{
                    position: "absolute", left: 13, top: 28, bottom: 0,
                    width: 1, background: "var(--border)",
                  }} />
                )}
                <div style={{
                  width: 27, height: 27, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: getAvatarColor(name), color: "#fff",
                  fontSize: 9, fontWeight: 600, marginTop: 1, position: "relative", zIndex: 1,
                }}>
                  {getInitials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{name}</span>{" "}
                    <ActionText action={entry.action} metadata={entry.metadata || {}} />
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {formatTime(entry.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}