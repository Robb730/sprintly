import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: memberships, error: memErr } = await supabase
        .from("project_members")
        .select(
          `
          role,
          permissions,
          projects (
            id, title, description, created_by, created_at,
            sprints (id, title, start_date, end_date, created_at),
            milestones (id, title, due_date, status, created_at),
            tasks (id, status)
          )
        `,
        )
        .eq("user_id", userId);

      if (memErr) throw memErr;

      if (!memberships || memberships.length === 0) {
        setProjects([]);
        return;
      }

      const projectIds = memberships.map((m) => m.projects?.id).filter(Boolean);

      const { data: allMembers, error: mErr } = await supabase
        .from("project_members")
        .select(
          `
          project_id,
          role,
          permissions,
          user:profiles (id, display_name)
        `,
        )
        .in("project_id", projectIds);

      if (mErr) throw mErr;

      const shaped = memberships
        .filter((m) => m.projects)
        .map((m) => {
          const p = m.projects;
          const allTasks = p.tasks || [];
          const members = (allMembers || [])
            .filter((pm) => pm.project_id === p.id)
            .map((pm) => ({
              id: pm.user?.id,
              name: pm.user?.display_name || pm.user?.email,

              role: pm.role,
              permissions: pm.permissions,
            }));

          return {
            ...p,
            role: m.role,
            permissions: m.permissions,
            task_count: allTasks.length,
            completed_tasks: allTasks.filter((t) => t.status === "done").length,
            sprint_count: p.sprints?.length || 0,
            milestone_count: p.milestones?.length || 0,
            completed_milestones:
              p.milestones?.filter((m) => m.status === "completed").length || 0,
            members,
          };
        });

      setProjects(shaped);
    } catch (err) {
      console.error("fetchProjects error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function createProject({ title, description }, user) {
    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .insert({ title, description, created_by: user.id })
      .select()
      .single();

    if (projErr) throw projErr;

    await supabase.from("project_members").insert({
      project_id: proj.id,
      user_id: user.id,
      role: "manager",
    });

    await fetchProjects();
    return proj;
  }

  async function deleteProject(projectId) {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  async function removeMember(projectId, userId) {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (error) throw error;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, members: p.members.filter((m) => m.id !== userId) }
          : p,
      ),
    );
  }

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    deleteProject,
    removeMember,
  };
}
