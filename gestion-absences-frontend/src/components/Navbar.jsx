import { Link, NavLink, useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext'

const NavItem = ({ to, children, onClick, scrolled }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      [
        "px-3 py-2 rounded-xl text-sm transition-colors font-bold",
        isActive
          ? (scrolled ? "bg-blue-500 text-white" : "bg-blue-600 text-white")
          : (scrolled ? "text-slate-100 hover:bg-white/10" : "text-blue-900 hover:bg-blue-500/10"),
      ].join(' ')
    }
  >
    {children}
  </NavLink>
)

const DropdownMenu = ({ title, items, scrolled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={[
          "px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-1 font-bold",
          scrolled ? "text-slate-100 hover:bg-white/10" : "text-blue-900 hover:bg-blue-500/10"
        ].join(' ')}
      >
        {title}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const edtItems = [
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
    <div
      className={[
        "sticky top-0 z-50  transition-colors duration-300 backdrop-blur",
        scrolled ? "bg-slate-900/80 border-slate-800" : "bg-white/80 "
      ].join(' ')}
    >
      <div className=" mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GA</span>
            </div>
            <span className={["text-lg font-bold hidden sm:block",
              scrolled ? "text-white" : "text-slate-800"
            ].join(' ')}>Gestion Absences</span>
          </Link>

          {/* Desktop Navigation */}
          {token ? (
            <div className="hidden md:flex items-center gap-1">
              {/* Menus */}
              <DropdownMenu title="Gestion" items={gestionItems} scrolled={scrolled} />
              <DropdownMenu title="Emploi du Temps" items={edtItems} scrolled={scrolled} />

              {/* User info and logout */}
              <div className={[
                "ml-4 flex items-center gap-3 pl-4 border-l",
                scrolled ? "border-slate-700" : "border-slate-300"
              ].join(' ')}>
                <div className="text-sm">
                  <div className={["font-bold", scrolled ? "text-white" : "text-slate-800"].join(' ')}>
                    {user?.nomComplet}
                  </div>
                  <div className={["text-xs capitalize font-bold",
                    scrolled ? "text-white/70" : "text-slate-600"
                  ].join(' ')}>
                    {user?.role?.toLowerCase().replace('_', ' ')}
                  </div>
                </div>
                <button
                  className={[
                    "px-3 py-2 rounded-lg text-sm font-bold border transition-colors",
                    scrolled
                      ? "text-white border-white/30 hover:bg-white/10"
                      : "text-slate-800 border-slate-300 hover:bg-slate-50"
                  ].join(' ')}
                  onClick={() => { logout(); navigate('/login') }}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <NavItem to="/login" scrolled={scrolled}>Se connecter</NavItem>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={[
                "p-2 rounded-lg transition-colors",
                scrolled ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-100"
              ].join(' ')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white py-4">
            <div className="space-y-2">
              {token ? (
                <>
                  <div className="px-3 py-2 font-bold text-slate-500 text-xs uppercase">Gestion</div>
                  {gestionItems.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.to}
                      className="block px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="px-3 py-2 font-bold text-slate-500 text-xs uppercase mt-4">Emploi du Temps</div>
                  {edtItems.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.to}
                      className="block px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors font-bold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  <div className="border-t border-slate-200 mt-4 pt-4">
                    <div className="px-3 py-2 text-sm text-slate-700 font-bold">
                      Connecté en tant que <strong>{user?.nomComplet}</strong>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors font-bold"
                      onClick={() => { logout(); navigate('/login'); setMobileMenuOpen(false); }}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              ) : (
                <NavItem to="/login" onClick={() => setMobileMenuOpen(false)} scrolled={false}>
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
