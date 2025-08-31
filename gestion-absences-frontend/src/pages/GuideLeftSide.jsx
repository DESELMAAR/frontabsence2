import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function GuideLeftSide() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ROLE_ADMIN";

  const [currentUrl, setCurrentUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Charger l'URL actuelle
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/settings/background");
        setCurrentUrl(data?.url || "");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Prévisualisation
  const onFileChange = (e) => {
    setMsg(""); setErr("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "image/png") {
      setErr("Veuillez sélectionner un fichier PNG.");
      return;
    }
    if (f.size > 9 * 1024 * 1024) {
      setErr("Taille max 5 Mo.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErr(""); setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/api/settings/background", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.url || "";
      setCurrentUrl(url);
      setPreview("");
      setFile(null);
      setMsg("Background mis à jour ✅");

      // OPTIONNEL : stocker pour que ton layout global lise l’URL
      localStorage.setItem("app:bgUrl", url);
    } catch (e) {
      setErr(e?.response?.data?.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const onReset = async () => {
    setUploading(true);
    setErr(""); setMsg("");
    try {
      await api.delete("/api/settings/background");
      setCurrentUrl("");
      localStorage.removeItem("app:bgUrl");
      setMsg("Background réinitialisé.");
    } catch (e) {
      setErr("Impossible de réinitialiser.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Panneau latéral</h3>
      <p className="mt-1 text-slate-600 text-sm">
        Placez ici des raccourcis, KPIs, liens utiles, ou un mini tutoriel vidéo.
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="#!">Créer une filière</a>
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="#!">Créer une classe</a>
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="#!">Importer des étudiants</a>
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="#!">Nouveau cours</a>
      </div>

      {/* Section Admin : Upload background */}
      {isAdmin && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-800">Background de l’application (PNG)</h4>

          {/* Image actuelle */}
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">Image actuelle :</p>
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="background actuel"
                className="h-24 w-full object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="h-24 w-full rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                Aucune image définie
              </div>
            )}
          </div>

          {/* Choix fichier */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Choisir un fichier PNG</label>
            <input
              type="file"
              accept="image/png"
              onChange={onFileChange}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50"
            />
            {preview && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-2">Aperçu :</p>
                <img
                  src={preview}
                  alt="aperçu"
                  className="h-24 w-full object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <button
              disabled={!file || uploading}
              onClick={onUpload}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Envoi..." : "Mettre à jour"}
            </button>
            <button
              disabled={uploading}
              onClick={onReset}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>

          {/* Messages */}
          {msg && <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{msg}</div>}
          {err && <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

          <p className="mt-3 text-[11px] text-slate-500">
            Astuce : ton layout global peut lire <code>localStorage.getItem("app:bgUrl")</code> pour appliquer ce background automatiquement.
          </p>
        </div>
      )}
    </div>
  );
}
