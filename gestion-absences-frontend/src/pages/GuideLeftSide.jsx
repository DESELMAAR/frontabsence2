import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function GuideLeftSide() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ROLE_ADMIN";

  /* ====================== Background ====================== */
  const [currentUrl, setCurrentUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const toAbsolute = (u) =>
    !u ? "" : /^https?:\/\//i.test(u) ? u : `http://localhost:8080${u}`;

  const broadcastBg = (url) => {
    localStorage.setItem("app:bgUrl", url || "");
    // notifie ce même onglet + autres onglets
    window.dispatchEvent(new CustomEvent("bg:updated", { detail: url || "" }));
  };

  // Charger le background actuel
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

  // Choix de fichier
  const onFileChange = (e) => {
    setMsg("");
    setErr("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("Veuillez sélectionner une image (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErr("Taille max 5 Mo.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Upload background
  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErr("");
    setMsg("");
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
      broadcastBg(url);
    } catch (e) {
      setErr(e?.response?.data?.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  // Reset background
  const onReset = async () => {
    setUploading(true);
    setErr("");
    setMsg("");
    try {
      await api.delete("/api/settings/background");
      setCurrentUrl("");
      setMsg("Background réinitialisé.");
      broadcastBg("");
    } catch (e) {
      setErr("Impossible de réinitialiser.");
    } finally {
      setUploading(false);
    }
  };

  /* ====================== Branding (Navbar) ====================== */
  const [brandCode, setBrandCode] = useState(localStorage.getItem("app:brandCode") || "GA");
  const [brandTitle, setBrandTitle] = useState(localStorage.getItem("app:brandTitle") || "Gestion Absences");
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandMsg, setBrandMsg] = useState("");
  const [brandErr, setBrandErr] = useState("");

  // Charger branding actuel
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/api/settings/branding");
        if (!mounted) return;
        if (data?.shortCode) setBrandCode(data.shortCode);
        if (data?.title) setBrandTitle(data.title);
      } catch {
        // on garde les valeurs de localStorage si l'API n'existe pas/échoue
      }
    })();
    return () => { mounted = false; }
  }, []);

  const broadcastBrand = (shortCode, title) => {
    localStorage.setItem("app:brandCode", shortCode || "GA");
    localStorage.setItem("app:brandTitle", title || "Gestion Absences");
    window.dispatchEvent(new CustomEvent("brand:updated", {
      detail: { shortCode: shortCode || "GA", title: title || "Gestion Absences" }
    }));
  };

  const validateBrand = () => {
    const code = (brandCode || "").trim();
    const title = (brandTitle || "").trim();
    if (code.length < 1 || code.length > 4) {
      return "Le sigle doit contenir entre 1 et 4 caractères.";
    }
    if (title.length < 3 || title.length > 50) {
      return "Le titre doit contenir entre 3 et 50 caractères.";
    }
    return null;
  };

  const saveBranding = async () => {
    setBrandErr("");
    setBrandMsg("");
    const v = validateBrand();
    if (v) {
      setBrandErr(v);
      return;
    }
    setBrandLoading(true);
    try {
      const payload = { shortCode: brandCode.trim(), title: brandTitle.trim() };
      await api.put("/api/settings/branding", payload);
      setBrandMsg("Branding mis à jour ✅");
      broadcastBrand(payload.shortCode, payload.title);
    } catch (e) {
      setBrandErr(e?.response?.data?.message || "Échec de la mise à jour du branding.");
    } finally {
      setBrandLoading(false);
    }
  };

  const resetBranding = async () => {
    setBrandErr("");
    setBrandMsg("");
    setBrandLoading(true);
    try {
      // Si vous avez un DELETE côté backend :
      // await api.delete("/api/settings/branding");
      // Fallback si pas d'endpoint DELETE : on force des valeurs par défaut
      const defaults = { shortCode: "GA", title: "Gestion Absences" };
      setBrandCode(defaults.shortCode);
      setBrandTitle(defaults.title);
      // Option: ping POST pour enregistrer les valeurs par défaut
      try { await api.put("/api/settings/branding", defaults); } catch {}
      setBrandMsg("Branding réinitialisé.");
      broadcastBrand(defaults.shortCode, defaults.title);
    } catch {
      setBrandErr("Impossible de réinitialiser le branding.");
    } finally {
      setBrandLoading(false);
    }
  };

  /* ====================== UI ====================== */
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Panneau latéral</h3>
      <p className="mt-1 text-slate-600 text-sm">
        Placez ici des raccourcis, KPIs, liens utiles, ou un mini tutoriel vidéo.
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="/classes">
          Créer une classe
        </a>
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="/etudiants">
          Importer des étudiants
        </a>
        <a className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50" href="/cours">
          Nouveau cours
        </a>
      </div>

      {isAdmin && (
        <>
          {/* ====== Background ====== */}
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800">Background de l’application</h4>

            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Image actuelle :</p>
              {currentUrl ? (
                <img
                  src={toAbsolute(currentUrl)}
                  alt="background actuel"
                  className="h-24 w-full object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="h-24 w-full rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                  Aucune image définie
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Choisir une image
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
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

            {msg && (
              <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {msg}
              </div>
            )}
            {err && (
              <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500">
              Astuce : le layout global écoute <code>bg:updated</code> et lit{" "}
              <code className="bg-slate-100 px-1 rounded">localStorage.getItem("app:bgUrl")</code>.
            </p>
          </div>

          {/* ====== Branding (Navbar) ====== */}
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800">Branding de la barre de navigation</h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sigle (court)
                </label>
                <input
                  type="text"
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GA"
                />
                <p className="text-xs text-slate-500 mt-1">1 à 4 caractères (ex: GA, GABS)</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titre (texte complet)
                </label>
                <input
                  type="text"
                  value={brandTitle}
                  onChange={(e) => setBrandTitle(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Gestion Absences"
                />
                <p className="text-xs text-slate-500 mt-1">3 à 50 caractères</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={brandLoading}
                onClick={saveBranding}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {brandLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                disabled={brandLoading}
                onClick={resetBranding}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
              >
                Réinitialiser
              </button>
            </div>

            {brandMsg && (
              <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {brandMsg}
              </div>
            )}
            {brandErr && (
              <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {brandErr}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500">
              La <code>Navbar</code> lit <code>GET /api/settings/branding</code> et/ou{" "}
              <code>localStorage</code>. Ce panneau déclenche{" "}
              <code>brand:updated</code> et met à jour{" "}
              <code>app:brandCode</code> / <code>app:brandTitle</code>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
