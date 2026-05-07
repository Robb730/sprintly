import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { RefreshCw } from "lucide-react";

const ACTION_LABELS = {
  task_created: { verb: "created", color: "#22c55e" },
  task_status_changed: { verb: "moved", color: "#3b82f6" },
  task_updated: { verb: "updated", color: "#f59e0b" },
  member_joined: { verb: "joined", color: "#8b5cf6" },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

const STATUS_COLORS = {
  todo:        { label: 'To Do',       color: '#888780' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  in_review:      { label: 'In Review',   color: '#f59e0b' },
  done:        { label: 'Done',        color: '#22c55e' },
}

const ACTION_COLORS = {
  task_created:        '#22c55e',
  task_status_changed: null, // derived from new_status
  task_updated:        '#f59e0b',
  member_joined:       '#8b5cf6',
}

function formatAction(action, metadata) {
  switch (action) {
    case 'task_created': {
      const s = STATUS_COLORS['todo']
      return (
        <>
          created{' '}
          <span style={{ color: s.color, fontWeight: 500 }}>
            "{metadata.task_title}"
          </span>
        </>
      )
    }
    case 'task_status_changed': {
      const s = STATUS_COLORS[metadata.new_status]
      return (
        <>
          moved{' '}
          <span style={{ color: s?.color ?? 'var(--text-secondary)', fontWeight: 500 }}>
            "{metadata.task_title}"
          </span>
          {' '}to{' '}
          <span style={{ color: s?.color ?? 'var(--text-secondary)', fontWeight: 600 }}>
            {s?.label ?? metadata.new_status}
          </span>
        </>
      )
    }
    case 'task_updated': {
      const s = STATUS_COLORS[metadata.status] ?? STATUS_COLORS['todo']
      return (
        <>
          updated{' '}
          <span style={{ color: s.color, fontWeight: 500 }}>
            "{metadata.task_title}"
          </span>
          {metadata.changes?.length > 0 && (
            <span style={{ color: 'var(--text-muted)' }}> · {metadata.changes[0]}</span>
          )}
        </>
      )
    }
    case 'member_joined':
      return <>joined the project</>
    default:
      return <>{action.replace(/_/g, ' ')}</>
  }
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name = "") {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#22c55e",
    "#06b6d4",
    "#f97316",
  ];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ActivityFeed({ projectId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async (silent = false) => {
  if (!projectId) return
  if (!silent) setLoading(true)
  else setRefreshing(true)

  const { data, error } = await supabase
    .from('project_activity')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    console.error('ActivityFeed error:', error.message)
    setLoading(false)
    setRefreshing(false)
    return
  }

  // fetch display names for unique user_ids
  const userIds = [...new Set((data || []).map(e => e.user_id))]
  let userMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles_with_email')
      .select('id, display_name, email')
      .in('id', userIds)
    ;(profiles || []).forEach(p => { userMap[p.id] = p })
  }

  const enriched = (data || []).map(e => ({
    ...e,
    user: userMap[e.user_id] || null,
  }))

  setEntries(enriched)
  setLoading(false)
  setRefreshing(false)
}, [projectId])

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetch(true), 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Loading activity…
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          No activity yet
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Actions like creating tasks and moving cards will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {entries.length} events
        </span>
        <button
          onClick={() => fetch(true)}
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw
            size={11}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-0">
        {entries.map((entry, i) => {
          const name =
            entry.user?.display_name ||
            entry.user?.email?.split("@")[0] ||
            "Someone";
          const dot = entry.action === 'task_status_changed'
  ? (STATUS_COLORS[entry.metadata?.new_status]?.color ?? '#888780')
  : (ACTION_COLORS[entry.action] ?? 'var(--text-muted)');
          const isLast = i === entries.length - 1;

          return (
            <div key={entry.id} className="flex gap-2.5 relative">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className="absolute"
                  style={{
                    left: 13,
                    top: 28,
                    bottom: 0,
                    width: 1,
                    background: "var(--border)",
                  }}
                />
              )}

              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold shrink-0 mt-0.5 z-10"
                style={{ background: getAvatarColor(name), fontSize: 9 }}
              >
                {getInitials(name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-1">
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {name}
                    </span>{" "}
                    {formatAction(entry.action, entry.metadata || {})}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: dot }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)", fontSize: 10 }}
                  >
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
