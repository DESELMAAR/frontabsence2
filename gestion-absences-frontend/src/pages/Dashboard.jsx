// src/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Guide from "./Guide";
import { downloadPdf } from "../services/api";

const cards = [
  { to: "/etudiants", label: "Étudiants", desc: "Gérer les étudiants" },
  { to: "/professeurs", label: "Professeurs", desc: "Gérer les professeurs" },
  { to: "/classes", label: "Classes", desc: "Créer et modifier des classes" },
  { to: "/matieres", label: "Matières", desc: "Gérer les matières" },
  { to: "/salles", label: "Salles", desc: "Gérer les salles" },
  { to: "/cours", label: "Cours", desc: "Gérer les cours" },
  { to: "/seances", label: "Séances", desc: "Planifier les séances" },
];

// Petit helper pour extraire userId du JWT si besoin
function getUserIdFromToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = JSON.parse(atob(parts[1]));
    return json?.userId ?? null; // JwtService met bien "userId" dans les claims
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { user: authUser, token } = useAuth();
  const role = authUser?.role;
  const isStudent = role === "ROLE_ETUDIANT";

  // Source de vérité pour l'id étudiant:
  // 1) useAuth().user.userId
  // 2) claim "userId" dans le JWT
  // 3) fallback (dernier recours) localStorage "user"
  const studentId = useMemo(() => {
    return (
      authUser?.userId ??
      getUserIdFromToken(token) ??
      (JSON.parse(localStorage.getItem("user") || "{}")?.userId ?? null)
    );
  }, [authUser?.userId, token]);

  const handleDownload = () => {
    if (!studentId) {
      // Tu peux remplacer par un toast si tu en as un
      alert("Votre identifiant n'est pas encore disponible. Réessayez dans un instant.");
      return;
    }
    downloadPdf(
      `/api/emploi-du-temps/etudiant/${studentId}/pdf`,
      "Mon-EDT.pdf"
    );
  };

  if (isStudent) {
    return (
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-gradient-to-br from-sky-900/90 via-sky-800/90 to-sky-900/90 p-8 sm:p-10 shadow-xl ring-1 ring-white/10 backdrop-blur">
  {/* decorative glow */}
  <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
    Bienvenue{authUser?.nomComplet ? `, ${authUser.nomComplet}` : ""} !
  </h1>
  <p className="mt-3 text-base sm:text-lg text-white/80">
    Consultez votre emploi du temps pour connaître vos cours et vos salles.
  </p>

  <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    <Link
      to="/emploi-du-temps-table"
      className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-white font-semibold shadow-sm ring-1 ring-white/20 hover:bg-white/20 hover:shadow transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <svg
        viewBox="0 0 24 24"
        className="mr-2 h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M8 7h8M8 11h8M8 15h5" />
        <rect x="3" y="4" width="18" height="16" rx="2" />
      </svg>
      Accéder à mon emploi du temps
    </Link>

    <button
      onClick={handleDownload}
      disabled={!studentId}
      title={!studentId ? "Chargement de votre identifiant..." : ""}
      className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-slate-900 font-semibold shadow-sm ring-1 ring-black/10 hover:bg-yellow-400 hover:shadow-md transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg
        viewBox="0 0 24 24"
        className="mr-2 h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
        <rect x="4" y="15" width="16" height="6" rx="2" />
      </svg>
      Télécharger mon emploi du temps (PDF)
    </button>
  </div>

  {/* Optional debug id */}
  {/* <div className="mt-3 text-xs text-white/70 text-center">ID: {String(studentId)}</div> */}
</div>

    );
  }

  // Admin / Professeur
  return (
    <div className="bg-black bg-opacity-30 p-4 rounded-xl">
      <h1 className="title text-white mb-4">Tableau de bord</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {cards.map((c) => (
    <Link
      key={c.to}
      to={c.to}
      className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-green-500 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition">
          {c.label}
        </div>
        {/* optional placeholder for icon */}
        <div className="text-green-500 opacity-70 group-hover:opacity-100 transition">
          ➜
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500 group-hover:text-indigo-900 group-hover:bg-green-500/0 transition">
        {c.desc}
      </p>
    </Link>
  ))}
</div>


      <Guide />
    </div>
  );
}



// // src/pages/Dashboard.jsx
// import React from "react";
// import { Link } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import Guide from './Guide';
// import { downloadPdf } from "../services/api";

// const cards = [
//   { to: '/etudiants', label: 'Étudiants', desc: 'Gérer les étudiants' },
//   { to: '/professeurs', label: 'Professeurs', desc: 'Gérer les professeurs' },
//   { to: '/classes', label: 'Classes', desc: 'Créer et modifier des classes' },
//   { to: '/matieres', label: 'Matières', desc: 'Gérer les matières' },
//   { to: '/salles', label: 'Salles', desc: 'Gérer les salles' },
//   { to: '/cours', label: 'Cours', desc: 'Gérer les cours' },
//   { to: '/seances', label: 'Séances', desc: 'Planifier les séances' },
// ];

// const user = JSON.parse(localStorage.getItem("user"));
// const currentUserId = user?.userId;

// export default function Dashboard() {
//   const { user } = useAuth();
//   const role = user?.role;
//   const isStudent = role === 'ROLE_ETUDIANT';

//   if (isStudent) {
//     return (
//       <div className="bg-sky-900 bg-opacity-90 backdrop-blur-sm p-6 rounded-xl max-w-3xl mx-auto text-center">
//         <h1 className="text-2xl sm:text-3xl font-bold text-white">
//           Bienvenue{user?.nomComplet ? `, ${user.nomComplet}` : ''} !
//         </h1>
//         <p className="mt-2 text-white/80">
//           Consultez votre emploi du temps pour connaître vos cours et vos salles.
//         </p>
//         {/* {console.log(currentUserId)} */}
//         <Link
//           to="/emploi-du-temps-table"
//           className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white font-bold hover:bg-blue-700 transition"
//         >
//           Accéder à mon emploi du temps
//         </Link>
         
//         <br />
//         <button
//           className="btn  mt-4 bg-yellow-600 hover:bg-yellow-600"
//           onClick={() => downloadPdf(`/api/emploi-du-temps/etudiant/${currentUserId}/pdf`, 'Mon-EDT.pdf')}
//         >
//           Télécharger mon Emploi Du Temps (PDF)
//         </button>
//       </div>
//     );
//   }

//   // Admin / Professeur
//   return (
//     <div className='bg-black bg-opacity-30 p-4 rounded-xl'>
//       <h1 className="title text-white mb-4">Tableau de bord</h1>

//       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {cards.map(c => (
//           <Link
//             key={c.to}
//             to={c.to}
//             className="card hover:shadow-md transition text-gray-800 hover:text-slate-50 hover:bg-green-500 transition-all duration-300"
//           >
//             <div className="text-lg font-semibold">{c.label}</div>
//             <div className="text-sm">{c.desc}</div>
//           </Link>
//         ))}
//       </div>

//       <Guide />
//     </div>
//   );
// }
