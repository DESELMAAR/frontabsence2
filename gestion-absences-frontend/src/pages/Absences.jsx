// src/pages/Absences.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function Badge({ children, color = "slate" }) {
  const map = {
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${map[color]}`}>
      {children}
    </span>
  );
}

export default function Absences() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === "ROLE_ETUDIANT";
  const isAdminOrProf = role === "ROLE_ADMIN" || role === "ROLE_PROFESSEUR";

  const [loading, setLoading] = useState(false);
  const [absences, setAbsences] = useState([]);

  // Admin/Prof: pour afficher libellé étudiant
  const [students, setStudents] = useState([]); // {id, nom, prenom, matricule}
  const [selectedEtudiantId, setSelectedEtudiantId] = useState("");
  const [justifFilter, setJustifFilter] = useState("ALL"); // ALL | YES | NO
  const [q, setQ] = useState(""); // recherche texte sur motif
  const [page, setPage] = useState(1);
  const pageSize = 12;

  /* ==================== Chargements ==================== */

  // Étudiants (uniquement Admin/Prof)
  useEffect(() => {
    if (!isAdminOrProf) return;
    (async () => {
      try {
        const { data } = await api.get("/api/etudiants");
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        setStudents([]);
      }
    })();
  }, [isAdminOrProf]);

  // Absences — Admin/Prof
  const fetchAbsencesAdmin = async () => {
    if (!isAdminOrProf) return;
    setLoading(true);
    try {
      let url = "/api/absences";
      if (selectedEtudiantId) {
        url = `/api/absences/etudiants/${selectedEtudiantId}`;
      }
      const { data } = await api.get(url);
      setAbsences(Array.isArray(data) ? data : []);
      setPage(1);
    } catch {
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  // Absences — Étudiant connecté
  const fetchAbsencesStudent = async () => {
    if (!isStudent) return;
    setLoading(true);
    try {
      const { data } = await api.get("/api/absences/me");
      setAbsences(Array.isArray(data) ? data : []);
      setPage(1);
    } catch {
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrProf) fetchAbsencesAdmin();
    if (isStudent) fetchAbsencesStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminOrProf, isStudent]);

  useEffect(() => {
    if (isAdminOrProf) fetchAbsencesAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEtudiantId]);

  /* ==================== Helpers ==================== */

  // Libellé étudiant
  const studentLabel = (id) => {
    const s = students.find((x) => String(x.id) === String(id));
    if (!s) return `#${id}`;
    return `${s.nom || ""} ${s.prenom || ""}`.trim() + (s.matricule ? ` — ${s.matricule}` : "");
  };

  // Filtrage client : justifié + motif
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return absences.filter((a) => {
      if (justifFilter === "YES" && !a.justifie) return false;
      if (justifFilter === "NO" && a.justifie) return false;
      if (term && !(a.motif || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [absences, q, justifFilter]);

  // Tri (récent d’abord) sur dateDeclaration
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = a?.dateDeclaration ? new Date(a.dateDeclaration) : 0;
      const db = b?.dateDeclaration ? new Date(b.dateDeclaration) : 0;
      return db - da;
    });
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      const date = typeof d === "string" && d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
      return date.toLocaleDateString();
    } catch {
      return d;
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["ID", "Cours (séance)", "Date déclaration", isAdminOrProf ? "Étudiant ID" : null, isAdminOrProf ? "Étudiant (nom/prénom)" : null, "Justifié", "Motif"]
        .filter(Boolean),
      ...sorted.map((a) => {
        const base = [
          a.id ?? "",
          a.coursIntitule || (a.seanceId ? `#${a.seanceId}` : ""),
          fmtDate(a.dateDeclaration),
        ];
        const who = isAdminOrProf ? [a.etudiantId ?? "", studentLabel(a.etudiantId ?? "")] : [];
        const end = [a.justifie ? "Oui" : "Non", a.motif ?? ""];
        return [...base, ...who, ...end];
      }),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "absences.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ==================== Rendu ==================== */

  // Étudiant : tableau simple
  if (isStudent) {
    return (
      <div className="bg-black bg-opacity-30 p-4 rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="title text-white">Mes absences</h1>
          <div className="flex items-center gap-2">
            <input
              placeholder="Rechercher dans le motif"
              className="rounded-lg border px-3 py-2 text-sm bg-white/90"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-white/90">
          <div className="overflow-auto nice-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100">
                <tr className="text-slate-700">
                  <th className="p-3 border">Cours (séance)</th>
                  <th className="p-3 border">Date déclaration</th>
                  <th className="p-3 border">Justifié</th>
                  <th className="p-3 border">Motif</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500">Chargement…</td></tr>
                ) : pageData.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-500">Aucune absence</td></tr>
                ) : (
                  pageData.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 border" title={a.seanceId ? `Séance #${a.seanceId}` : ""}>
                        {a.coursIntitule || (a.seanceId ? `#${a.seanceId}` : "—")}
                      </td>
                      <td className="p-3 border">{fmtDate(a.dateDeclaration)}</td>
                      <td className="p-3 border">
                        {a.justifie ? <Badge color="green">Oui</Badge> : <Badge color="red">Non</Badge>}
                      </td>
                      <td className="p-3 border">{a.motif || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-slate-600">
                Page <strong>{page}</strong> / {totalPages} — {sorted.length} élément(s)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border text-sm font-bold disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border text-sm font-bold disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin/Prof : vue complète (inchangée sauf libellé cours)
  return (
    <div className="bg-black bg-opacity-30 p-4 rounded-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title text-white">Absences</h1>
        <div className="flex items-center gap-2">
          <input
            placeholder="Rechercher dans le motif"
            className="rounded-lg border px-3 py-2 text-sm bg-white/90"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-white/80 mb-1 font-bold">Étudiant</label>
          <select
            value={selectedEtudiantId}
            onChange={(e) => setSelectedEtudiantId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white/90"
          >
            <option value="">Tous</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom} {s.prenom} {s.matricule ? `— ${s.matricule}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/80 mb-1 font-bold">Justification</label>
          <select
            value={justifFilter}
            onChange={(e) => setJustifFilter(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white/90"
          >
            <option value="ALL">Toutes</option>
            <option value="YES">Justifiées</option>
            <option value="NO">Non justifiées</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchAbsencesAdmin}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden bg-white/90">
        <div className="overflow-auto nice-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100">
              <tr className="text-slate-700">
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Cours (séance)</th>
                <th className="p-3 border">Date déclaration</th>
                <th className="p-3 border">Étudiant</th>
                <th className="p-3 border">Justifié</th>
                <th className="p-3 border">Motif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Chargement…</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Aucune absence</td></tr>
              ) : (
                pageData.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 border">{a.id}</td>
                    <td className="p-3 border" title={a.seanceId ? `Séance #${a.seanceId}` : ""}>
                      {a.coursIntitule || (a.seanceId ? `#${a.seanceId}` : "—")}
                    </td>
                    <td className="p-3 border">{fmtDate(a.dateDeclaration)}</td>
                    <td className="p-3 border">{studentLabel(a.etudiantId)}</td>
                    <td className="p-3 border">
                      {a.justifie ? <Badge color="green">Oui</Badge> : <Badge color="red">Non</Badge>}
                    </td>
                    <td className="p-3 border">{a.motif || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3">
            <div className="text-sm text-slate-600">
              Page <strong>{page}</strong> / {totalPages} — {sorted.length} élément(s)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border text-sm font-bold disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border text-sm font-bold disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
