import React, { useEffect, useState } from "react";
import api from "../services/api";

const colors = [
    "blue",
    "emerald",
    "violet",
    "amber",
    "rose",
    "cyan",
    "lime",
];

export default function EtudiantsParClasse() {
    const [classes, setClasses] = useState([]);
    const [etudiantsParClasse, setEtudiantsParClasse] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/api/classes");
                setClasses(res.data);

                const data = {};
                for (const classe of res.data) {
                    const resEtudiants = await api.get(`/api/classes/${classe.id}/etudiants`);
                    data[classe.id] = resEtudiants.data;
                }
                setEtudiantsParClasse(data);
                console.log(data)
            } catch (error) {
                console.error("Erreur lors du chargement des classes/étudiants", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6 bg-white rounded-xl p-4">
            <h1 className="text-2xl font-bold mb-6">Étudiants par classe</h1>

            {classes.map((classe, index) => {
                const color = colors[index % colors.length];
                const etudiants = etudiantsParClasse[classe.id] || [];

                return (
                    <div
                        key={classe.id}
                        className={`mb-8 rounded-lg shadow-md border border-${color}-500 ring-2 ring-${color}-400`}
                    >
                        <h2
                            className={`text-lg font-semibold text-green-800 bg-${color}-500 px-4 py-2 rounded-t-lg`}
                        >
                            Classe: {classe.niveau} ({classe.nom})
                        </h2>
                        <table className="w-full text-left  border-collapse">
                            <thead className={`bg-${color}-100`}>
                                <tr>
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
                                        <td colSpan={4} className="p-2 border text-center text-gray-500">
                                            Aucun étudiant
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}
