import { useState } from "react";
import { useAuth } from "./useAuth";
import { useProjects, useTeam } from "./useData";

const STAGES = [
  { id: "lead", label: "Lead", color: "#6B7280" },
  { id: "proposal", label: "Proposal Sent", color: "#3B82F6" },
  { id: "negotiation", label: "Negotiation", color: "#F59E0B" },
  { id: "closing", label: "Closing", color: "#8B5CF6" },
  { id: "won", label: "Won", color: "#10B981" },
  { id: "lost", label: "Lost", color: "#EF4444" },
];

const font = `'DM Sans', 'Helvetica Neue', sans-serif`;
const mono = `'JetBrains Mono', 'SF Mono', monospace`;

const p = {
  bg: "#0F1117",
  surface: "#181B24",
  surfaceHover: "#1E2130",
  border: "#262A36",
  borderLight: "#2F3441",
  text: "#E8EAED",
  textMuted: "#8B8FA3",
  textDim: "#5D6175",
  accent: "#6C8EEF",
  accentSoft: "rgba(108,142,239,0.12)",
  danger: "#EF4444",
  dangerSoft: "rgba(239,68,68,0.12)",
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const emptyForm = {
  name: "",
  client: "",
  contact: "",
  owner: "",
  stage: "lead",
  value: "",
  lastComm: "",
  lastCommDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function dbToForm(row) {
  return {
    name: row.name || "",
    client: row.client || "",
    contact: row.contact || "",
    owner: row.owner || "",
    stage: row.stage || "lead",
    value: row.value || "",
    lastComm: row.last_comm || "",
    lastCommDate: row.last_comm_date || "",
    notes: row.notes || "",
  };
}

function LoginScreen({ signInWithGoogle }) {
  return (
    <div style={{ minHeight: "100vh", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <div style={{ textAlign: "center", padding: 48, background: p.surface, border: `1px solid ${p.border}`, borderRadius: 20, maxWidth: 400, width: "90%" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${p.accent}, #A78BFA)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24, color: "#fff", fontWeight: 700 }}>A</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: p.text }}>AIREV Pipeline</h1>
        <p style={{ margin: "0 0 32px", fontSize: 14, color: p.textMuted }}>Sign in with your team Google account to continue.</p>
        <button
          onClick={signInWithGoogle}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 28px", borderRadius: 10, border: `1px solid ${p.borderLight}`, background: p.bg, color: p.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function StageBadge({ stageId, small }) {
  const s = STAGES.find((x) => x.id === stageId) || STAGES[0];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "2px 8px" : "3px 10px", borderRadius: 6, fontSize: small ? 11 : 12, fontWeight: 600, letterSpacing: 0.3, background: s.color + "18", color: s.color, border: `1px solid ${s.color}30`, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { projects, loading: dataLoading, createProject, updateProject, deleteProject, updateStage } = useProjects();
  const { team, addMember, removeMember } = useTeam();

  const [view, setView] = useState("table");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [saving, setSaving] = useState(false);

  if (authLoading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: p.bg, color: p.textMuted, fontFamily: font }}>Loading…</div>;
  }
  if (!user) return <LoginScreen signInWithGoogle={signInWithGoogle} />;

  function openNew() {
    setForm({ ...emptyForm, owner: team[0] || "", lastCommDate: new Date().toISOString().split("T")[0] });
    setEditing("new");
  }

  function openEdit(row) {
    setForm(dbToForm(row));
    setEditing(row.id);
  }

  async function save() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editing === "new") {
        await createProject(form);
      } else {
        await updateProject(editing, form);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await deleteProject(id);
    setConfirmDelete(null);
    if (editing === id) setEditing(null);
  }

  async function quickStage(id, stage) {
    await updateStage(id, stage);
  }

  const filtered = projects.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (row.name || "").toLowerCase().includes(q) || (row.client || "").toLowerCase().includes(q) || (row.contact || "").toLowerCase().includes(q) || (row.owner || "").toLowerCase().includes(q);
    const matchStage = filterStage === "all" || row.stage === filterStage;
    return matchSearch && matchStage;
  });

  const stats = {
    total: projects.length,
    active: projects.filter((r) => !["won", "lost"].includes(r.stage)).length,
    won: projects.filter((r) => r.stage === "won").length,
    stale: projects.filter((r) => {
      if (!r.last_comm_date || ["won", "lost"].includes(r.stage)) return false;
      return (Date.now() - new Date(r.last_comm_date).getTime()) / 86400000 > 14;
    }).length,
  };

  const inputStyle = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${p.borderLight}`, background: p.bg, color: p.text, fontSize: 14, fontFamily: font, outline: "none" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: p.textMuted, letterSpacing: 0.4, fontFamily: font };

  function TableView() {
    return (
      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${p.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 13 }}>
          <thead>
            <tr>
              {["Project", "Client", "POC", "Our Lead", "Stage", "Value", "Last Comm", "When", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: p.textDim, letterSpacing: 0.6, textTransform: "uppercase", background: p.surface, borderBottom: `1px solid ${p.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const stale = row.last_comm_date && !["won", "lost"].includes(row.stage) && (Date.now() - new Date(row.last_comm_date).getTime()) / 86400000 > 14;
              return (
                <tr key={row.id} onClick={() => openEdit(row)} style={{ cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => (e.currentTarget.style.background = p.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: p.text, borderBottom: `1px solid ${p.border}`, maxWidth: 200 }}>{row.name}</td>
                  <td style={{ padding: "12px 14px", color: p.textMuted, borderBottom: `1px solid ${p.border}` }}>{row.client || "—"}</td>
                  <td style={{ padding: "12px 14px", color: p.textMuted, borderBottom: `1px solid ${p.border}` }}>{row.contact || "—"}</td>
                  <td style={{ padding: "12px 14px", color: p.text, borderBottom: `1px solid ${p.border}`, fontWeight: 500 }}>{row.owner || "—"}</td>
                  <td style={{ padding: "12px 14px", borderBottom: `1px solid ${p.border}` }}><StageBadge stageId={row.stage} small /></td>
                  <td style={{ padding: "12px 14px", color: p.accent, fontFamily: mono, fontWeight: 600, borderBottom: `1px solid ${p.border}`, whiteSpace: "nowrap" }}>{row.value || "—"}</td>
                  <td style={{ padding: "12px 14px", color: p.textMuted, borderBottom: `1px solid ${p.border}`, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.last_comm || "—"}</td>
                  <td style={{ padding: "12px 14px", borderBottom: `1px solid ${p.border}`, whiteSpace: "nowrap", fontFamily: mono, fontSize: 12, color: stale ? "#F59E0B" : p.textDim }}>{stale ? "⚠ " : ""}{daysSince(row.last_comm_date) || "—"}</td>
                  <td style={{ padding: "12px 14px", borderBottom: `1px solid ${p.border}` }}>
                    <select value={row.stage} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); quickStage(row.id, e.target.value); }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${p.borderLight}`, background: p.bg, color: p.textMuted, fontSize: 11, fontFamily: font, cursor: "pointer" }}>
                      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: p.textDim }}>No projects match your filters</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  function BoardView() {
    const activeStages = STAGES.filter((s) => s.id !== "lost");
    return (
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16, minHeight: 400 }}>
        {activeStages.map((stage) => {
          const items = filtered.filter((r) => r.stage === stage.id);
          return (
            <div key={stage.id} style={{ minWidth: 260, maxWidth: 300, flex: "1 0 260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: p.textMuted, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: font }}>{stage.label}</span>
                <span style={{ fontSize: 12, color: p.textDim, fontFamily: mono }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((row) => (
                  <div key={row.id} onClick={() => openEdit(row)} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.borderLight)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = p.border)}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: p.text, fontFamily: font, marginBottom: 4 }}>{row.name}</div>
                    <div style={{ fontSize: 12, color: p.textMuted, fontFamily: font, marginBottom: 8 }}>{row.client}</div>
                    {row.value && <div style={{ fontSize: 12, fontWeight: 600, color: p.accent, fontFamily: mono, marginBottom: 8 }}>{row.value}</div>}
                    <div style={{ fontSize: 11, color: p.textDim, fontFamily: font }}>{row.owner} · {daysSince(row.last_comm_date)}</div>
                  </div>
                ))}
                {items.length === 0 && <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: p.textDim, fontFamily: font, border: `1px dashed ${p.border}`, borderRadius: 10 }}>No projects</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: p.bg, color: p.text, fontFamily: font, padding: "24px 28px 60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Pipeline<span style={{ color: p.textDim, fontWeight: 400, fontSize: 16, marginLeft: 10 }}>AIREV</span></h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: p.surface, border: `1px solid ${p.border}` }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${p.accent}, #A78BFA)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}</div>
            <span style={{ fontSize: 12, color: p.textMuted, fontFamily: font, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.user_metadata?.full_name || user.email}</span>
            <button onClick={signOut} style={{ marginLeft: 4, padding: "3px 8px", borderRadius: 6, border: `1px solid ${p.border}`, background: "transparent", color: p.textDim, fontSize: 11, cursor: "pointer", fontFamily: font }}>Sign out</button>
          </div>
          <button onClick={openNew} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: p.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Project</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total", val: stats.total, color: p.text },
          { label: "Active", val: stats.active, color: p.accent },
          { label: "Won", val: stats.won, color: "#10B981" },
          { label: "Needs Follow-up", val: stats.stale, color: stats.stale > 0 ? "#F59E0B" : p.textDim },
        ].map((s) => (
          <div key={s.label} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: p.textDim, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: mono }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 200px", maxWidth: 300, padding: "8px 14px", borderRadius: 8, border: `1px solid ${p.borderLight}`, background: p.surface, color: p.text, fontSize: 13, fontFamily: font, outline: "none" }} />
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${p.borderLight}`, background: p.surface, color: p.text, fontSize: 13, fontFamily: font }}>
          <option value="all">All Stages</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <div style={{ display: "flex", borderRadius: 8, border: `1px solid ${p.borderLight}`, overflow: "hidden", marginLeft: "auto" }}>
          {["table", "board"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "7px 16px", border: "none", background: view === v ? p.accentSoft : "transparent", color: view === v ? p.accent : p.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font }}>{v === "table" ? "☰ Table" : "▦ Board"}</button>
          ))}
        </div>
      </div>

      {dataLoading ? <div style={{ padding: 60, textAlign: "center", color: p.textDim }}>Loading projects…</div> : view === "table" ? <TableView /> : <BoardView />}

      {editing && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", padding: "28px 32px" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: p.text, fontFamily: font }}>{editing === "new" ? "New Project" : "Edit Project"}</h2>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {[["Project Name *", "name", "e.g. HUMAIN Partnership"], ["Client / Organization", "client", "e.g. HUMAIN (Saudi PIF)"], ["Point of Contact", "contact", "Name / email of client POC"], ["Deal Value", "value", "e.g. $520K"]].map(([label, key, ph]) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{label}</span>
                  <input type="text" placeholder={ph} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
                </label>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={labelStyle}>Our Lead</span>
                    <button type="button" onClick={() => setShowTeamManager(true)} style={{ fontSize: 11, color: p.accent, background: "none", border: "none", cursor: "pointer", fontFamily: font, fontWeight: 600, padding: 0 }}>+ Manage Team</button>
                  </div>
                  <select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} style={inputStyle}>
                    {team.map((t) => <option key={t}>{t}</option>)}
                    {form.owner && !team.includes(form.owner) && <option key={form.owner}>{form.owner}</option>}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>Stage</span>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} style={inputStyle}>
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Last Communication</span>
                <input type="text" placeholder="e.g. Sent proposal deck v2" value={form.lastComm} onChange={(e) => setForm({ ...form, lastComm: e.target.value })} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Last Communication Date</span>
                <input type="date" value={form.lastCommDate} onChange={(e) => setForm({ ...form, lastCommDate: e.target.value })} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Notes</span>
                <textarea rows={3} placeholder="Internal notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>{editing !== "new" && <button onClick={() => setConfirmDelete(editing)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${p.danger}40`, background: p.dangerSoft, color: p.danger, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Delete</button>}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditing(null)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${p.borderLight}`, background: "transparent", color: p.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: saving ? p.textDim : p.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer", fontFamily: font }}>{saving ? "Saving…" : editing === "new" ? "Add Project" : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 14, padding: "24px 28px", maxWidth: 380 }}>
            <p style={{ margin: 0, color: p.text, fontSize: 15, fontFamily: font }}>Remove <strong>{projects.find((x) => x.id === confirmDelete)?.name}</strong> from your pipeline?</p>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${p.borderLight}`, background: "transparent", color: p.textMuted, fontSize: 13, cursor: "pointer", fontFamily: font }}>Cancel</button>
              <button onClick={() => remove(confirmDelete)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: p.danger, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showTeamManager && (
        <div onClick={() => setShowTeamManager(false)} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 14, width: "100%", maxWidth: 380, padding: "24px 28px" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: p.text, fontFamily: font }}>Manage Team</h2>
            <p style={{ margin: "6px 0 20px", fontSize: 13, color: p.textMuted, fontFamily: font }}>Add or remove team members who can be assigned as leads.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <input type="text" placeholder="New member name…" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addMember(newMemberName); setNewMemberName(""); } }} style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
              <button onClick={() => { addMember(newMemberName); setNewMemberName(""); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: p.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {team.map((name) => {
                const usedBy = projects.filter((r) => r.owner === name).length;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: p.bg, border: `1px solid ${p.border}` }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: p.text, fontFamily: font }}>{name}</span>
                      {usedBy > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: p.textDim, fontFamily: mono }}>{usedBy} project{usedBy !== 1 ? "s" : ""}</span>}
                    </div>
                    <button onClick={() => removeMember(name)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${team.length <= 1 ? p.border : p.danger + "40"}`, background: team.length <= 1 ? "transparent" : p.dangerSoft, color: team.length <= 1 ? p.textDim : p.danger, fontSize: 14, cursor: team.length <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: team.length <= 1 ? 0.4 : 1 }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowTeamManager(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: p.accentSoft, color: p.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
