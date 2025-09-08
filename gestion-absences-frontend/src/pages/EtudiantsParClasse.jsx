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
    <div className="bg-black rounded-xl p-4 bg-opacity-30">
      <h1 className="text-2xl text-white/90 font-bold mb-6">Étudiants par classe</h1>

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
            className="mb-4 rounded-lg shadow-md w-3/5 max-lg:w-full bg-white ring-2"
          >
            {/* En-tête avec bouton + / - */}
            <div
              className={`flex items-center justify-between px-4 py-2 rounded-t-lg bg-${color}-50`}
            >
              <h2 className="text-lg font-semibold text-green-800">
                Classe: {classe.niveau} ({classe.nom})
              </h2>
              <button
                onClick={() => toggleClasse(classe)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                aria-expanded={isOpen}
                aria-controls={`classe-${id}-panel`}
                title={isOpen ? "Masquer" : "Afficher"}
              >
                {isOpen ? "−" : "+"}
              </button>
            </div>

            {/* Contenu dépliable */}
            {isOpen && (
              <div id={`classe-${id}-panel`} className="border-t">
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
                        <tr className="bg-slate-50">
                          <th className="p-2 border">ID</th>
                          <th className="p-2 border">Nom</th>
                          <th className="p-2 border">Prénom</th>
                          <th className="p-2 border">Email</th>
                          <th className="p-2 border">Adresse</th>
                          <th className="p-2 border">Matricule</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etudiants.length > 0 ? (
                          etudiants.map((etudiant) => (
                            <tr key={etudiant.id} className="hover:bg-gray-50">
                              <td className="p-2 border">{etudiant.id}</td>
                              <td className="p-2 border">{etudiant.nom}</td>
                              <td className="p-2 border">{etudiant.prenom}</td>
                              <td className="p-2 border">{etudiant.email}</td>
                              <td className="p-2 border">{etudiant.address}</td>
                              <td className="p-2 border">{etudiant.matricule}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-3 border text-center text-gray-500"
                            >
                              Aucun étudiant
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
