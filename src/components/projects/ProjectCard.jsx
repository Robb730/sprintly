import { Link, useNavigate } from "react-router-dom";

const MAX_SEGMENTS = 24; // above this, the task strip becomes a continuous bar
const DAY = 86_400_000;
const shortDate = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });

// success/warning aren't in your current tokens, so they fall back to sensible defaults.
const TONES = {
  done: { color: "var(--success, #16a34a)", icon: "check" },
  late: { color: "var(--danger)", icon: "alert" },
  soon: { color: "var(--warning, #d97706)", icon: "clock" },
  muted: { color: "var(--text-muted)", icon: null },
};

const ICONS = {
  check: "M4.5 12.75l6 6 9-13.5",
  alert:
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function getInitials(name = "") {
  return (
    name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?"
  );
}

// Same person, same color, every time.
function avatarColor(name = "") {
  let hue = 0;
  for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hue} 40% 38%)`;
}

// "2026-10-30" should mean local midnight, not UTC midnight.
function parseDate(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDue(value, isComplete) {
  const date = parseDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.round((date - today) / DAY);

  if (isComplete) return { tone: "muted", label: `Due ${shortDate.format(date)}` };
  if (days < 0) return { tone: "late", label: `${plural(-days, "day")} overdue` };
  if (days === 0) return { tone: "soon", label: "Due today" };
  if (days === 1) return { tone: "soon", label: "Due tomorrow" };
  if (days <= 7) return { tone: "soon", label: `Due in ${days} days` };
  return { tone: "muted", label: `Due ${shortDate.format(date)}` };
}

function Glyph({ name }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

// One segment per task, so a 5-task project reads differently from a 40-task one.
function TaskStrip({ total, done, color }) {
  if (total === 0) {
    return (
      <div
        aria-hidden="true"
        className="h-2 rounded-full border border-dashed"
        style={{ borderColor: "var(--border)" }}
      />
    );
  }

  const aria = {
    role: "progressbar",
    "aria-label": "Task completion",
    "aria-valuemin": 0,
    "aria-valuemax": total,
    "aria-valuenow": done,
  };

  if (total > MAX_SEGMENTS) {
    return (
      <div {...aria} className="h-2 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${(done / total) * 100}%`, background: color }}
        />
      </div>
    );
  }

  return (
    <div {...aria} className="flex gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-[3px]"
          style={{ background: i < done ? color : "var(--border)" }}
        />
      ))}
    </div>
  );
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const {
    id,
    title = "Untitled project",
    description = "",
    task_count = 0,
    completed_tasks = 0,
    members = [],
    due_date,
    role = "contributor",
    sprint_count = 0,
  } = project;

  const total = Math.max(0, task_count);
  const done = Math.min(Math.max(0, completed_tasks), total);
  const progress = total ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  const due = getDue(due_date, isComplete);
  const dueTone = due && TONES[due.tone];
  const barColor = isComplete
    ? TONES.done.color
    : due?.tone === "late"
      ? TONES.late.color
      : "var(--accent)";

  const isManager = role === "manager";
  const href = `/projects/${id}`;
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;

  const taskLabel =
    total === 0
      ? "No tasks yet"
      : isComplete
        ? `All ${plural(total, "task")} done`
        : `${done} of ${plural(total, "task")} done`;

  return (
    // The whole card is clickable; the title link gives keyboard and screen-reader access.
    <article
      onClick={() => navigate(href)}
      className="flex h-full cursor-pointer flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-4 hover:border-[color:var(--accent)] focus-within:border-[color:var(--accent)] focus-within:ring-1 focus-within:ring-[color:var(--accent)] motion-safe:transition-colors motion-safe:duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={href}
            title={title}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-[15px] font-semibold leading-snug tracking-tight outline-none"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
          >
            {title}
          </Link>
          <p
            className="mt-1 text-[13px] leading-relaxed"
            style={{
              color: description ? "var(--text-secondary)" : "var(--text-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description || "No description yet"}
          </p>
        </div>
        <span
          title={isManager ? "You manage this project" : "You're a member of this project"}
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={
            isManager
              ? { background: "var(--accent-light)", color: "var(--accent)" }
              : { color: "var(--text-muted)", boxShadow: "inset 0 0 0 1px var(--border)" }
          }
        >
          {isManager ? "PM" : "Member"}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-auto space-y-2">
        <TaskStrip total={total} done={done} color={barColor} />
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span style={{ color: "var(--text-secondary)" }}>{taskLabel}</span>
          {total > 0 && (
            <span
              className="font-semibold tabular-nums"
              style={{ color: isComplete ? TONES.done.color : "var(--text-primary)" }}
            >
              {progress}%
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between gap-3 border-t pt-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {members.length > 0 && (
            <div className="flex -space-x-2">
              {shown.map((m, i) => (
                <span
                  key={m?.id ?? i}
                  title={m?.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ background: avatarColor(m?.name), boxShadow: "0 0 0 2px var(--bg-card)" }}
                >
                  {getInitials(m?.name)}
                </span>
              ))}
              {extra > 0 && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-muted)",
                    boxShadow: "0 0 0 2px var(--bg-card)",
                  }}
                >
                  +{extra}
                </span>
              )}
              <span className="sr-only">
                {plural(members.length, "member")}: {members.map((m) => m?.name).filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {sprint_count > 0 && (
            <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {plural(sprint_count, "sprint")}
            </span>
          )}
        </div>

        {due && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            style={{
              color: dueTone.color,
              background: `color-mix(in srgb, ${dueTone.color} 12%, transparent)`,
            }}
          >
            {dueTone.icon && <Glyph name={dueTone.icon} />}
            {due.label}
          </span>
        )}
      </div>
    </article>
  );
}