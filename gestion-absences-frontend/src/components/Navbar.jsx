
import { Link, NavLink, useNavigate } from 'react-router-dom'
import React from "react";

import { useAuth } from '../contexts/AuthContext'

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-xl text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`
    }
  >
    {children}
  </NavLink>
)

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="border-b bg-green-400 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-3">
        <Link to="/" className="text-lg font-semibold">Gestion Absences</Link>
        {token ? (
          <div className="flex items-center gap-2">
            <NavItem to="/etudiants">Étudiants</NavItem>
            <li>
              <Link to="/etudiants-par-classe" className="hover:underline">
                Étudiants par classe
              </Link>
            </li>

            <NavItem to="/professeurs">Professeurs</NavItem>
            <NavItem to="/classes">Classes</NavItem>
            <NavItem to="/matieres">Matières</NavItem>
            <NavItem to="/salles">Salles</NavItem>
            <NavItem to="/cours">Cours</NavItem>
            <NavItem to="/seances">Séances</NavItem>
            <NavItem to="/edt">EDT</NavItem>
            <div className="ml-3 text-sm text-gray-600 hidden md:block">{user?.nomComplet} · {user?.role}</div>
            <button className="btn" onClick={() => { logout(); navigate('/login') }}>Se déconnecter</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavItem to="/login">Se connecter</NavItem>
          </div>
        )}
      </div>
    </div>
  )
}
