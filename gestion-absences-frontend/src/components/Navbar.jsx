import { Link, NavLink, useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext'

const NavItem = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `px-3 py-2 rounded-xl text-sm transition-colors font-bold ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/20 text-blue-900'}`
    }
  >
    {children}
  </NavLink>
)

const DropdownMenu = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Petit délai pour éviter une fermeture accidentelle
  };

  return (
    <div 
      className="relative group" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="px-3 py-2 rounded-xl text-sm text-blue-900 hover:bg-blue-500/20 transition-colors flex items-center gap-1 font-bold">
        {title}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item, index) => (
            <NavLink
              key={index}
              to={item.to}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const edtItems = [
    // { to: "/edt", label: "Génération EDT" },
    { to: "/emploi-du-temps-table", label: "Visualisation EDT" },
    { to: "/gestion-edt", label: "Gestion Manuel EDT" }
  ];

  const gestionItems = [
    { to: "/etudiants", label: "Étudiants" },
    { to: "/etudiants-par-classe", label: "Étudiants par classe" },
    { to: "/professeurs", label: "Professeurs" },
    { to: "/classes", label: "Classes" },
    { to: "/matieres", label: "Matières" },
    { to: "/salles", label: "Salles" },
    { to: "/cours", label: "Cours" },
    { to: "/seances", label: "Séances" }
  ];

  return (
    <div className="bg-orange-500 border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GA</span>
            </div>
            <span className="text-lg font-semibold text-white hidden sm:block font-bold">Gestion Absences</span>
          </Link>

          {/* Desktop Navigation */}
          {token ? (
            <div className="hidden md:flex items-center gap-1">
              {/* Menu de gestion */}
              <DropdownMenu title="Gestion" items={gestionItems} />
              
              {/* Menu EDT */}
              <DropdownMenu title="Emploi du Temps" items={edtItems} />

              {/* User info and logout */}
              <div className="ml-4 flex items-center gap-3 border-l border-orange-400 pl-4">
                <div className="text-sm text-white">
                  <div className="font-bold">{user?.nomComplet}</div>
                  <div className="text-xs text-white/80 capitalize font-bold">{user?.role?.toLowerCase().replace('_', ' ')}</div>
                </div>
                <button 
                  className="btn btn-outline text-sm bg-white text-orange-600 hover:bg-gray-100 border-white font-bold"
                  onClick={() => { logout(); navigate('/login') }}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <NavItem to="/login">Se connecter</NavItem>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-orange-600 font-bold"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orange-400 bg-orange-500 py-4">
            <div className="space-y-2">
              {token ? (
                <>
                  <div className="px-3 py-2 font-bold text-white/80 text-xs uppercase">Gestion</div>
                  {gestionItems.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.to}
                      className="block px-3 py-2 rounded-lg text-white hover:bg-orange-600 transition-colors font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  
                  <div className="px-3 py-2 font-bold text-white/80 text-xs uppercase mt-4">Emploi du Temps</div>
                  {edtItems.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.to}
                      className="block px-3 py-2 rounded-lg text-white hover:bg-orange-600 transition-colors font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="border-t border-orange-400 mt-4 pt-4">
                    <div className="px-3 py-2 text-sm text-white font-bold">
                      Connecté en tant que <strong>{user?.nomComplet}</strong>
                    </div>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-lg text-white hover:bg-orange-600 transition-colors font-bold"
                      onClick={() => { logout(); navigate('/login'); setMobileMenuOpen(false); }}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              ) : (
                <NavItem to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Se connecter
                </NavItem>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}