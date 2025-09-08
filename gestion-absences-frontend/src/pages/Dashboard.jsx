// src/pages/Dashboard.jsx
import React from "react";
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Guide from './Guide';
import { downloadPdf } from "../services/api";

const cards = [
  { to: '/etudiants', label: 'Étudiants', desc: 'Gérer les étudiants' },
  { to: '/professeurs', label: 'Professeurs', desc: 'Gérer les professeurs' },
  { to: '/classes', label: 'Classes', desc: 'Créer et modifier des classes' },
  { to: '/matieres', label: 'Matières', desc: 'Gérer les matières' },
  { to: '/salles', label: 'Salles', desc: 'Gérer les salles' },
  { to: '/cours', label: 'Cours', desc: 'Gérer les cours' },
  { to: '/seances', label: 'Séances', desc: 'Planifier les séances' },
];

const user = JSON.parse(localStorage.getItem("user"));
const currentUserId = user?.userId;

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === 'ROLE_ETUDIANT';

  if (isStudent) {
    return (
      <div className="bg-green-900 bg-opacity-90 backdrop-blur-sm p-6 rounded-xl max-w-3xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Bienvenue{user?.nomComplet ? `, ${user.nomComplet}` : ''} !
        </h1>
        <p className="mt-2 text-white/80">
          Consultez votre emploi du temps pour connaître vos cours et vos salles.
        </p>
        {/* {console.log(currentUserId)} */}
        <Link
          to="/emploi-du-temps-table"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white font-bold hover:bg-blue-700 transition"
        >
          Accéder à mon emploi du temps
        </Link>
         
        <br />
        <button
          className="btn  mt-4 bg-yellow-600 hover:bg-yellow-600"
          onClick={() => downloadPdf(`/api/emploi-du-temps/etudiant/${currentUserId}/pdf`, 'Mon-EDT.pdf')}
        >
          Télécharger mon Emploi Du Temps (PDF)
        </button>
      </div>
    );
  }

  // Admin / Professeur
  return (
    <div className='bg-black bg-opacity-30 p-4 rounded-xl'>
      <h1 className="title text-white mb-4">Tableau de bord</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link
            key={c.to}
            to={c.to}
            className="card hover:shadow-md transition text-gray-800 hover:text-slate-50 hover:bg-green-500 transition-all duration-300"
          >
            <div className="text-lg font-semibold">{c.label}</div>
            <div className="text-sm">{c.desc}</div>
          </Link>
        ))}
      </div>

      <Guide />
    </div>
  );
}
