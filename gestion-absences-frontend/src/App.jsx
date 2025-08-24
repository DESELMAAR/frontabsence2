
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CrudPage from './pages/CrudPage'
import EmploiDuTemps from './pages/EmploiDuTemps'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import entitiesConfig from './config/entities'
import React from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import EtudiantsParClasse from "./pages/EtudiantsParClasse";


function Protected({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          {Object.keys(entitiesConfig).map(key => (
            <Route
              key={key}
              path={`/${key}`}
              element={
                <Protected>
                  <CrudPage entityKey={key} />
                </Protected>
              }
            />
          ))}
          <Route path="/edt" element={<Protected><EmploiDuTemps /></Protected>} />
          <Route
            path="/etudiants-par-classe"
            element={
              <ProtectedRoute>
                <EtudiantsParClasse />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
