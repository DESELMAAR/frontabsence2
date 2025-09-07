import React from "react";
import Modal from "./Modal";

export default function AttendanceModal({
  open,
  onClose,
  seance,
  stats,
  etudiants,
  selection,
  onToggle,
  onSubmit,
  loading,
  error
}) {
  return (
    <Modal open={open} title={`Absences — Séance #${seance?.id || ''}`} onClose={onClose}>
      {loading ? (
        <div className="p-3 text-sm text-gray-600">Chargement…</div>
      ) : error ? (
        <div className="p-3 text-sm text-red-600">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="font-semibold text-gray-800">
              {seance?.cours?.intitule || 'Cours'} — {seance?.date} {seance?.heureDebut}–{seance?.heureFin}
            </div>
            <div className="text-gray-700 mt-1">
              Absents:&nbsp;<b>{stats?.total || 0}</b>&nbsp;•&nbsp;
              Justifiées:&nbsp;<b>{stats?.justifiees || 0}</b>&nbsp;•&nbsp;
              Non justifiées:&nbsp;<b>{stats?.nonJustifiees || 0}</b>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              Marquer des absents (classe {seance?.cours?.classes?.[0]?.nom || ''})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto">
              {Array.isArray(etudiants) && etudiants.length ? (
                etudiants.map((et) => (
                  <label key={et.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selection.has(et.id)}
                      onChange={() => onToggle(et.id)}
                    />
                    <span>{et.nom} {et.prenom}</span>
                  </label>
                ))
              ) : (
                <div className="text-sm text-gray-500">Aucun étudiant trouvé.</div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button type="button" className="btn" onClick={onClose}>Fermer</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={loading || selection.size === 0}
              >
                Enregistrer {selection.size ? `(${selection.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}


// // components/AttendanceModal.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import api from "../services/api";
// import Modal from "./Modal";

// export default function AttendanceModal({ open, onClose, seance, classeId }) {
//   const [etudiants, setEtudiants] = useState([]);
//   const [absences, setAbsences] = useState(new Map()); // etudiantId -> {justifie, motif}
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!open || !seance?.id) return;
//     setError(""); setLoading(true);

//     const load = async () => {
//       try {
//         // roster classe
//         const roster = await api.get(`/api/etudiants/by-classe/${classeId}`);
//         setEtudiants(Array.isArray(roster.data) ? roster.data : []);

//         // absences actuelles
//         const abs = await api.get(`/api/seances/${seance.id}/absences`);
//         const map = new Map();
//         (abs.data || []).forEach(a => map.set(a.etudiantId, { justifie: !!a.justifie, motif: a.motif || "" }));
//         setAbsences(map);
//       } catch (e) {
//         setError("Impossible de charger les données");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [open, seance?.id, classeId]);

//   const toggleAbsent = (etuId) => {
//     const next = new Map(absences);
//     if (next.has(etuId)) next.delete(etuId); // devient présent
//     else next.set(etuId, { justifie: false, motif: "" }); // absent
//     setAbsences(next);
//   };

//   const toggleJustifie = (etuId) => {
//     const next = new Map(absences);
//     const v = next.get(etuId);
//     if (!v) return; // pas absent → rien
//     next.set(etuId, { ...v, justifie: !v.justifie });
//     setAbsences(next);
//   };

//   const setMotif = (etuId, motif) => {
//     const next = new Map(absences);
//     const v = next.get(etuId);
//     if (!v) return;
//     next.set(etuId, { ...v, motif });
//     setAbsences(next);
//   };

//   const allPresent = () => setAbsences(new Map());
//   const allAbsent = () => {
//     const next = new Map();
//     etudiants.forEach(e => next.set(e.id, { justifie: false, motif: "" }));
//     setAbsences(next);
//   };

//   const save = async () => {
//     setSaving(true); setError("");
//     try {
//       const payload = Array.from(absences.entries()).map(([etudiantId, v]) => ({
//         etudiantId, justifie: !!v.justifie, motif: v.motif || ""
//       }));
//       await api.post(`/api/seances/${seance.id}/absences/bulk`, payload);
//       onClose(true); // vrai → pour rafraîchir la tuile si tu veux
//     } catch (e) {
//       setError(e?.response?.data?.message || "Échec de l’enregistrement");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       title={`Présences — ${seance?.cours?.intitule || "Séance"} (${seance?.heureDebut?.slice(0,5)}–${seance?.heureFin?.slice(0,5)})`}
//       onClose={() => onClose(false)}
//     >
//       {loading ? (
//         <div className="p-4 text-sm text-slate-600">Chargement…</div>
//       ) : (
//         <div className="space-y-4">
//           {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

//           <div className="flex gap-2">
//             <button className="btn btn-outline" onClick={allPresent}>Tout présent</button>
//             <button className="btn btn-outline" onClick={allAbsent}>Tout absent</button>
//           </div>

//           <div className="max-h-80 overflow-auto rounded-lg border">
//             <table className="min-w-full text-sm">
//               <thead className="bg-slate-50">
//                 <tr>
//                   <th className="p-2 text-left">Étudiant</th>
//                   <th className="p-2">Absent</th>
//                   <th className="p-2">Justifié</th>
//                   <th className="p-2 w-1/2">Motif</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {etudiants.map(e => {
//                   const v = absences.get(e.id); // undefined => présent
//                   return (
//                     <tr key={e.id} className="border-t">
//                       <td className="p-2">{e.nom} {e.prenom}</td>
//                       <td className="p-2 text-center">
//                         <input
//                           type="checkbox"
//                           checked={!!v}
//                           onChange={() => toggleAbsent(e.id)}
//                         />
//                       </td>
//                       <td className="p-2 text-center">
//                         <input
//                           type="checkbox"
//                           disabled={!v}
//                           checked={!!v?.justifie}
//                           onChange={() => toggleJustifie(e.id)}
//                         />
//                       </td>
//                       <td className="p-2">
//                         <input
//                           type="text"
//                           className="input w-full"
//                           placeholder="Motif (optionnel)"
//                           disabled={!v}
//                           value={v?.motif || ""}
//                           onChange={(ev) => setMotif(e.id, ev.target.value)}
//                         />
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>

//           <div className="flex justify-end gap-2 pt-2">
//             <button className="btn" onClick={() => onClose(false)}>Annuler</button>
//             <button className="btn btn-primary" onClick={save} disabled={saving}>
//               {saving ? "Enregistrement…" : "Enregistrer"}
//             </button>
//           </div>
//         </div>
//       )}
//     </Modal>
//   );
// }
