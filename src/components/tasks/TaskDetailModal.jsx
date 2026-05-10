import { useState, useEffect } from "react";
import {
  STATUS_COLUMNS,
  PRIORITY_META,
  getAvatarColor,
  getInitials,
  formatDate,
  isOverdue,
} from "../data/projectData";
import Button from "../shared/Button";
import I from "../shared/Icons";
import CommentsSection from "./CommentSection";
import AssigneePicker from "../shared/AssigneePicker";

export default function TaskDetailModal({
  task,
  members,
  sprints = [],
  milestones = [],
  currentUser,
  isManager,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || "",
    assignees: Array.isArray(task.assignees)
      ? task.assignees
      : task.assigned_to
        ? [task.assigned_to]
        : [],
    due_date: task.due_date || "",
    sprint_id: task.sprint_id || "",
    milestone_id: task.milestone_id || "",
    tags: Array.isArray(task.tags) ? task.tags.join(", ") : task.tags || "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const [localTask, setLocalTask] = useState(task);

  const [currentAssignees, setCurrentAssignees] = useState(
  Array.isArray(task.assignees) && task.assignees.length > 0
    ? task.assignees
    : task.assigned_to ? [task.assigned_to] : []
);

  const handleSave = async () => {
    try {
      const autoStatus =
  form.assignees.length > 0 && form.due_date && form.status === "backlog"
    ? "todo" : form.status;

      await onUpdate?.(task.id, {
        title: form.title,
        description: form.description || null,
        status: autoStatus,
        priority: form.priority,
        assigned_to: form.assignees[0] || null,
        assignees: form.assignees,
        due_date: form.due_date || null,
        sprint_id: form.sprint_id || null,
        milestone_id: form.milestone_id || null,
      });

      setLocalTask((prev) => ({
        ...prev,
        title: form.title,
        description: form.description || null,
        status: autoStatus,
        priority: form.priority,
        assigned_to: form.assignees[0] || null, // ← was form.assigned_to
        assignees: form.assignees, // ← ADD THIS
        due_date: form.due_date || null,
        sprint_id: form.sprint_id || null,
        milestone_id: form.milestone_id || null,
      }));
      setCurrentAssignees(form.assignees);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save task:", err);
      alert(err.message);
    }
  };

  const assignee = members.find((m) => m.id === localTask.assigned_to);
  const sprint = sprints.find((s) => s.id === localTask.sprint_id);
  const milestone = milestones.find((m) => m.id === localTask.milestone_id);
  const pri = PRIORITY_META[localTask.priority];
  const overdue = isOverdue(localTask.due_date) && localTask.status !== "done";
  const statusMeta = STATUS_COLUMNS.find((s) => s.id === localTask.status);

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all";
  const inputStyle = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };
  const focusIn = (e) => (e.target.style.borderColor = "var(--accent)");
  const focusOut = (e) => (e.target.style.borderColor = "var(--border)");

  useEffect(() => {
  if (!editing) setLocalTask(task)
}, [task])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up opacity-0"
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
          <h2
            className="text-sm font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            {editing ? "Edit Task" : "Task Details"}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {isManager && !editing && (
              <button
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    title: localTask.title,
                    description: localTask.description || "",
                    status: localTask.status,
                    priority: localTask.priority,
                    assigned_to: localTask.assigned_to || "",
                    assignees: currentAssignees,
                    due_date: localTask.due_date || "",
                    sprint_id: localTask.sprint_id || "",
                    milestone_id: localTask.milestone_id || "",
                  }));
                  setEditing(true);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--bg-primary)",
                }}
                title="Edit task"
              >
                {I.settings}
              </button>
            )}
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
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {editing ? (
            <>
              {/* Title */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Title <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Description{" "}
                  <span
                    className="font-normal"
                    style={{ color: "var(--text-muted)" }}
                  >
                    (optional)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Add more details…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  >
                    {STATUS_COLUMNS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Priority
                  </label>
                  <div className="flex gap-1">
                    {Object.entries(PRIORITY_META).map(([key, meta]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("priority", key)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background:
                            form.priority === key
                              ? meta.bg
                              : "var(--bg-primary)",
                          color:
                            form.priority === key
                              ? meta.text
                              : "var(--text-muted)",
                          border: `1px solid ${form.priority === key ? meta.dot + "60" : "var(--border)"}`,
                        }}
                      >
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assignee + Sprint */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Assignee/s
                  </label>
                  <AssigneePicker
                    members={members}
                    selected={form.assignees}
                    onChange={(ids) => set("assignees", ids)}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sprint
                  </label>
                  <select
                    value={form.sprint_id}
                    onChange={(e) => set("sprint_id", e.target.value)}
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  >
                    <option value="">No sprint</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date + Milestone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => set("due_date", e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Milestone
                  </label>
                  <select
                    value={form.milestone_id}
                    onChange={(e) => set("milestone_id", e.target.value)}
                    className={inputCls}
                    style={{ ...inputStyle, appearance: "none" }}
                    onFocus={focusIn}
                    onBlur={focusOut}
                  >
                    <option value="">No milestone</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delete */}
              {confirmDelete ? (
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.2)",
                  }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--danger)" }}
                  >
                    Are you sure you want to delete this task? This cannot be
                    undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <button
                      onClick={async () => {
                        await onDelete?.(task.id);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: "var(--danger)", color: "#fff" }}
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    color: "var(--danger)",
                    border: "1px dashed rgba(220,38,38,0.4)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(220,38,38,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Delete task
                </button>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setConfirmDelete(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Status + Priority badges */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{
                    background: pri.bg,
                    color: pri.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                    style={{ background: pri.dot }}
                  />
                  {pri.label}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {statusMeta?.label ?? localTask.status}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-sm font-bold leading-snug"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {localTask.title}
              </h3>

              {/* Description */}
              {localTask.description ? (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {localTask.description}
                </p>
              ) : (
                <p
                  className="text-xs italic"
                  style={{ color: "var(--text-muted)" }}
                >
                  No description provided.
                </p>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Assignee/s
                  </p>
                  {currentAssignees.length > 0 ? (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
    {members.filter((m) => currentAssignees.includes(m.id)).map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              flexShrink: 0,
                              background: getAvatarColor(m.name),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(m.name)}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: "var(--text-primary)",
                            }}
                          >
                            {m.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Unassigned
                    </span>
                  )}
                </div>

                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Due Date
                  </p>
                  {localTask.due_date ? (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{
                        color: overdue
                          ? "var(--danger)"
                          : "var(--text-primary)",
                      }}
                    >
                      {overdue && I.warn}
                      {formatDate(localTask.due_date)}
                      {overdue && (
                        <span style={{ color: "var(--danger)", fontSize: 10 }}>
                          {" "}
                          · Overdue
                        </span>
                      )}
                    </span>
                  ) : (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No due date
                    </span>
                  )}
                </div>

                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Sprint
                  </p>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sprint?.title ?? (
                      <span
                        style={{ color: "var(--text-muted)", fontWeight: 400 }}
                      >
                        No sprint
                      </span>
                    )}
                  </span>
                </div>

                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Milestone
                  </p>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {milestone?.title ?? (
                      <span
                        style={{ color: "var(--text-muted)", fontWeight: 400 }}
                      >
                        No milestone
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid var(--border)" }} />

              {/* Comments — full width, outside the grid */}
              <CommentsSection taskId={task.id} currentUser={currentUser} />

              {/* Close */}
              <div className="pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
