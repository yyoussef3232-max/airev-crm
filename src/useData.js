import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setProjects((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProjects((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  async function createProject(form) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: form.name,
        client: form.client || "",
        contact: form.contact || "",
        owner: form.owner || "",
        stage: form.stage || "lead",
        value: form.value || "",
        last_comm: form.lastComm || "",
        last_comm_date: form.lastCommDate || null,
        notes: form.notes || "",
      })
      .select()
      .single();
    if (error) console.error("Create error:", error.message);
    return data;
  }

  async function updateProject(id, form) {
    const { error } = await supabase
      .from("projects")
      .update({
        name: form.name,
        client: form.client || "",
        contact: form.contact || "",
        owner: form.owner || "",
        stage: form.stage || "lead",
        value: form.value || "",
        last_comm: form.lastComm || "",
        last_comm_date: form.lastCommDate || null,
        notes: form.notes || "",
      })
      .eq("id", id);
    if (error) console.error("Update error:", error.message);
  }

  async function deleteProject(id) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) console.error("Delete error:", error.message);
  }

  async function updateStage(id, stage) {
    const { error } = await supabase
      .from("projects")
      .update({ stage })
      .eq("id", id);
    if (error) console.error("Stage update error:", error.message);
  }

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    updateStage,
    refetch: fetchProjects,
  };
}

export function useTeam() {
  const [team, setTeam] = useState([]);

  const fetchTeam = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setTeam(data.map((t) => t.name));
  }, []);

  useEffect(() => {
    fetchTeam();

    const channel = supabase
      .channel("team-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        () => {
          fetchTeam();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTeam]);

  async function addMember(name) {
    if (!name.trim() || team.includes(name.trim())) return;
    const { error } = await supabase
      .from("team_members")
      .insert({ name: name.trim() });
    if (error) console.error("Add member error:", error.message);
  }

  async function removeMember(name) {
    if (team.length <= 1) return;
    const { error } = await supabase
      .from("team_members")
          .delete()
          .eq("name", name);
        if (error) console.error("Remove member error:", error.message);
  }

    return {
          team,
          addMember,
          removeMember,
          refetch: fetchTeam,
    };
}
