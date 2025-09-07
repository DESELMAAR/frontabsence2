import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CrudPage from "./pages/CrudPage";
import EmploiDuTemps from "./pages/EmploiDuTemps";
import ProtectedRoute from "./components/ProtectedRoute";
import EtudiantsParClasse from "./pages/EtudiantsParClasse";
import GestionManuelleEDT from "./pages/GestionManuelleEDT";
import EmploiDuTempsTable from "./pages/EmploiDuTempsTable";
import entitiesConfig from "./config/entities";

import api from "./services/api";
import bgFallback from "./assets/24.png"; // fallback local

function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [bgUrl, setBgUrl] = useState(localStorage.getItem("app:bgUrl") || "");

  const toAbsolute = (u) =>
    !u ? "" : /^https?:\/\//i.test(u) ? u : `http://localhost:8080${u}`;

  // Load background URL (si pas encore connu)
  useEffect(() => {
    let mounted = true;
    if (!bgUrl) {
      api
        .get("/api/settings/background")
        .then(({ data }) => {
          if (!mounted) return;
          if (data?.url) {
            setBgUrl(data.url);
            localStorage.setItem("app:bgUrl", data.url);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [bgUrl]);

  // Écoute des changements cross-tab ET même onglet (custom event)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "app:bgUrl") setBgUrl(e.newValue || "");
    };
    const onBgUpdated = (e) => {
      setBgUrl(e.detail || localStorage.getItem("app:bgUrl") || "");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("bg:updated", onBgUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bg:updated", onBgUpdated);
    };
  }, []);

  const finalBgUrl = bgUrl ? toAbsolute(bgUrl) : bgFallback;

  return (
    <div className="relative min-h-screen">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ backgroundImage: `url(${finalBgUrl})` }}
      />
      {/* Soft overlay for readability */}
      <div className="fixed inset-0 -z-10 bg-white/20" />

      <Navbar />

      <div className="mx-auto p-4 mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />

          {Object.keys(entitiesConfig).map((key) => (
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

          <Route
            path="/gestion-edt"
            element={
              <Protected>
                <GestionManuelleEDT />
              </Protected>
            }
          />

          <Route
            path="/emploi-du-temps-table"
            element={
              <Protected>
                <EmploiDuTempsTable />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
