import React, { useEffect, useState } from "react";
import api from "../services/api";

const colors = ["blue", "emerald", "violet", "amber", "rose", "cyan", "lime"];

export default function EtudiantsParClasse() {
  const [classes, setClasses] = useState([]);
  const [etudiantsParClasse, setEtudiantsParClasse] = useState({}); // { [classeId]: Etudiant[] }
  const [open, setOpen] = useState({});       // { [classeId]: boolean }
  const [loading, setLoading] = useState({});  // { [classeId]: boolean }
  const [errors, setErrors] = useState({});    // { [classeId]: string }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/classes");
        setClasses(data || []);
      } catch (e) {
        console.error("Erreur lors du chargement des classes", e);
      }
    })();
  }, []);

  const toggleClasse = async (classe) => {
    const id = classe.id;
    const willOpen = !open[id];

    // Si on ouvre et qu'on n'a pas encore les étudiants: on charge
    if (willOpen && !etudiantsParClasse[id] && !loading[id]) {
      setLoading((s) => ({ ...s, [id]: true }));
      setErrors((s) => ({ ...s, [id]: "" }));
      try {
        const { data } = await api.get(`/api/classes/${id}/etudiants`);
        setEtudiantsParClasse((s) => ({ ...s, [id]: data || [] }));
      } catch (e) {
        console.error(`Erreur chargement étudiants pour classe ${id}`, e);
        setErrors((s) => ({
          ...s,
          [id]:
            e?.response?.data?.message ||
            "Impossible de charger les étudiants de cette classe.",
        }));
      } finally {
        setLoading((s) => ({ ...s, [id]: false }));
      }
    }

    setOpen((s) => ({ ...s, [id]: willOpen }));
  };

  return (
    <div className="bg-black/40 rounded-2xl p-6 shadow-lg">
      <h1 className="text-3xl font-bold text-white/90 mb-8 tracking-wide">
        Étudiants par classe
      </h1>

      {classes.map((classe, index) => {
        const color = colors[index % colors.length];
        const id = classe.id;
        const isOpen = !!open[id];
        const isLoading = !!loading[id];
        const err = errors[id];
        const etudiants = etudiantsParClasse[id] || [];

        return (
          <div
            key={id}
            className="mb-6 rounded-xl overflow-hidden bg-white shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300"
          >
            {/* En-tête avec bouton toggle */}
            <div
              className={`flex items-center justify-between px-5 py-3 bg-${color}-100 border-b border-${color}-200`}
            >
              <h2 className="text-lg font-semibold text-slate-800">
                Classe: {classe.niveau} ({classe.nom})
              </h2>
              <button
                onClick={() => toggleClasse(classe)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm transition"
                aria-expanded={isOpen}
                aria-controls={`classe-${id}-panel`}
                title={isOpen ? "Masquer" : "Afficher"}
              >
                {isOpen ? "−" : "+"}
              </button>
            </div>

            {/* Contenu dépliable avec animation */}
            <div
              id={`classe-${id}-panel`}
              className={`transition-all duration-500 ease-in-out ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
            >
              {isLoading ? (
                <div className="p-4 text-sm text-slate-600">Chargement…</div>
              ) : err ? (
                <div className="p-4 text-sm text-red-700 bg-red-50 border-y border-red-200">
                  {err}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="p-3 border text-sm font-medium">ID</th>
                        <th className="p-3 border text-sm font-medium">Nom</th>
                        <th className="p-3 border text-sm font-medium">Prénom</th>
                        <th className="p-3 border text-sm font-medium">Email</th>
                        <th className="p-3 border text-sm font-medium">Adresse</th>
                        <th className="p-3 border text-sm font-medium">Matricule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etudiants.length > 0 ? (
                        etudiants.map((etudiant, i) => (
                          <tr
                            key={etudiant.id}
                            className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"
                              } hover:bg-green-50 transition`}
                          >
                            <td className="p-3 border text-sm">{etudiant.id}</td>
                            <td className="p-3 border text-sm">{etudiant.nom}</td>
                            <td className="p-3 border text-sm">{etudiant.prenom}</td>
                            <td className="p-3 border text-sm">{etudiant.email}</td>
                            <td className="p-3 border text-sm">{etudiant.address}</td>
                            <td className="p-3 border text-sm">{etudiant.matricule}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 border text-center text-gray-500 italic"
                          >
                            Aucun étudiant inscrit
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

  );
}
