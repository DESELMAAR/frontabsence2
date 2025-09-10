import { Link } from 'react-router-dom'
import React from "react";
import GuideLeftSide from './GuideLeftSide';

export default function Guide() {
    return (
      <div className="grid mt-4 grid-cols-1 gap-6 md:grid-cols-[70%_28%]">
  {/* Colonne 1 — 70% */}
  <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    {/* Header */}
    <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-50 via-sky-50 to-teal-50 p-5 border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-lg">ℹ️</span>
        Guide d’utilisation — Gestion des absences &amp; EDT
      </h2>
      <p className="mt-2 text-slate-600">
        Suivez ces étapes pour configurer le système et gérer vos emplois du temps sans conflit.
      </p>
    </div>

    {/* Steps */}
    <ol className="space-y-5">
      {/* Step 1 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">1</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Créer des  <span className="text-indigo-700">classes</span>
          </h3>
          <p className="mt-1 text-slate-600">
            Commencez par définir l’organisation pédagogique : créez d’abord les <strong>filières</strong>, puis les <strong>classes</strong> rattachées à chaque filière.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Menu → Filières → Nouvel élément</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Menu → Classes → Nouvelle classe</span>
          </div>
        </div>
      </li>

      {/* Step 2 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">2</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Enregistrer les <span className="text-indigo-700">étudiants</span> et les affecter aux classes
          </h3>
          <p className="mt-1 text-slate-600">
            Ajoutez vos étudiants et associez-les directement à la <strong>classe</strong> souhaitée (de la filière correspondante).
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Astuce</p>
              <p className="text-sm text-slate-600">Utilisez l’import CSV si disponible pour gagner du temps.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Bon à savoir</p>
              <p className="text-sm text-slate-600">Un étudiant ne peut appartenir qu’à une classe à la fois.</p>
            </div>
          </div>
        </div>
      </li>

      {/* Step 3 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">3</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Créer des <span className="text-indigo-700">cours</span> et les affecter aux filières &amp; classes
          </h3>
          <p className="mt-1 text-slate-600">
            Enregistrez les cours (code, intitulé, volume horaire…) puis rattachez-les à la <strong>filière</strong> et aux <strong>classes</strong> concernées.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Menu → Cours → Nouveau cours</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Affecter → Filière + Classe</span>
          </div>
        </div>
      </li>

      {/* Step 4 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">4</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Enregistrer les <span className="text-indigo-700">professeurs</span> (indépendamment)
          </h3>
          <p className="mt-1 text-slate-600">
            Créez les fiches professeurs (nom, email, spécialité…). L’affectation aux séances se fera plus tard, lors du placement dans l’emploi du temps.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Menu → Professeurs → Nouvel utilisateur</span>
            {/* <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700 border border-green-200">Conseil : activez uniquement les comptes utilisés</span> */}
          </div>
        </div>
      </li>

      {/* Step 5 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">5</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Enregistrer les <span className="text-indigo-700">salles</span> (indépendamment)
          </h3>
          <p className="mt-1 text-slate-600">
            Ajoutez les salles (code, bâtiment, numéro, capacité…). Elles seront proposées automatiquement si elles sont disponibles sur le créneau choisi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Menu → Salles → Nouvelle salle</span>
            {/* <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 border border-amber-200">Astuce : renseignez la capacité pour éviter la sur-occupation</span> */}
          </div>
        </div>
      </li>

      {/* Step 6 */}
      <li className="flex gap-4">
        <div className="mt-1 shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">6</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            Construire l’<span className="text-indigo-700">Emploi du Temps</span>
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            <li>Ouvrez la vue <strong>EDT par classe</strong> puis sélectionnez une classe.</li>
            <li>Cliquez sur un créneau vide <span className="rounded bg-slate-100 px-1 py-0.5 text-xs">+</span> pour ajouter une séance.</li>
            <li>Le modal affiche les <strong>professeurs</strong> et <strong>salles disponibles</strong> pour ce créneau. Sélectionnez et validez.</li>
            <li>Les créneaux adjacents avec même cours/prof/salle sont automatiquement <strong>fusionnés visuellement</strong>.</li>
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Conflits évités</p>
              <p className="text-sm text-slate-600">Le système contrôle les chevauchements (professeur &amp; salle) sur le créneau choisi.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Actions rapides</p>
              <p className="text-sm text-slate-600">Dupliquer une séance (+1h) ou étendre sa durée depuis les options de la séance.</p>
            </div>
          </div>
        </div>
      </li>
    </ol>

    {/* Footer / Shortcuts */}
    <div className="mt-6 flex flex-wrap gap-2">
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Filières</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Classes</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Étudiants</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Cours</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Professeurs</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Salles</span>
      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">Emploi du Temps</span>
    </div>
  </div>

  {/* Colonne 2 — 30% */}
 
 
  <GuideLeftSide/>
</div>




    );
}