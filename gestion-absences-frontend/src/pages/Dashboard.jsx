
import { Link } from 'react-router-dom'
import React from "react";
import Guide from './guide';


const cards = [
  { to: '/etudiants', label: 'Étudiants', desc: 'Gérer les étudiants' },
  { to: '/professeurs', label: 'Professeurs', desc: 'Gérer les professeurs' },
  { to: '/classes', label: 'Classes', desc: 'Créer et modifier des classes' },
  { to: '/matieres', label: 'Matières', desc: 'Gérer les matières' },
  { to: '/salles', label: 'Salles', desc: 'Gérer les salles' },
  { to: '/cours', label: 'Cours', desc: 'Gérer les cours' },
  { to: '/seances', label: 'Séances', desc: 'Planifier les séances' },
  // { to: '/edt', label: 'Emploi du temps', desc: 'Générer et consulter' },
]

export default function Dashboard() {
  return (
    <div className='bg-black bg-opacity-30 p-4 rounded-xl'>
      <h1 className="title text-white mb-4">Tableau de bord</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="card hover:shadow-md transition text-gray-800 hover:text-slate-50 hover:bg-green-500 transition-all duration-300">
            <div className="text-lg font-semibold">{c.label}</div>
            <div className="text-sm ">{c.desc}</div>
          </Link>
        ))}
      </div>

      <Guide />
    </div>
  )
}
