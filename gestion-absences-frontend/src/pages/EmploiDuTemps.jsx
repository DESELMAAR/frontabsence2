
import { useEffect, useState } from 'react'
import api from '../services/api'
import React from "react";

export default function EmploiDuTemps() {
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [edt, setEdt] = useState(null)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/api/classes')
      setClasses(data)
    } catch (e) { /* ignore */ }
  }
  useEffect(() => { loadClasses() }, [])

  const viewLatest = async () => {
    setMsg(null); setError(null)
    if (!classeId) return setError('Sélectionne une classe')
    try {
      const { data } = await api.get(`/api/emploi-du-temps/by-classe/${classeId}/latest`)
      setEdt(data)
      if (!data) setMsg("Aucun EDT trouvé pour cette classe.")
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  const generate16 = async () => {
    setMsg(null); setError(null)
    if (!classeId || !weekStart) return setError('Classe et lundi de début requis')
    try {
      const { data } = await api.get(`/api/emploi-du-temps/generate-weekly-16?classeId=${classeId}&weekStart=${weekStart}`)
      setEdt(data)
      setMsg('EDT généré !')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="title">Emploi du temps</h1>
      {msg && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{msg}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}
      <div className="card space-y-3">
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Classe</label>
            <select className="input" value={classeId} onChange={e=>setClasseId(e.target.value)}>
              <option value="">-- choisir --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lundi (YYYY-MM-DD)</label>
            <input className="input" type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn" onClick={viewLatest}>Voir le dernier EDT</button>
            <button className="btn btn-primary" onClick={generate16}>Générer 16 séances</button>
          </div>
        </div>
      </div>

      {edt && (
        <div className="card">
          <div className="font-semibold mb-2">{edt.intitule}</div>
          <div className="text-sm text-gray-600 mb-4">Période: {edt.dateDebut} → {edt.dateFin}</div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Début</th>
                  <th className="py-2 px-3">Fin</th>
                  <th className="py-2 px-3">Statut</th>
                  <th className="py-2 px-3">Cours</th>
                  <th className="py-2 px-3">Professeur</th>
                  <th className="py-2 px-3">Salle</th>
                </tr>
              </thead>
              <tbody>
                {(edt.seances || []).map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 px-3">{s.date}</td>
                    <td className="py-2 px-3">{s.heureDebut}</td>
                    <td className="py-2 px-3">{s.heureFin}</td>
                    <td className="py-2 px-3">{s.statut}</td>
                    <td className="py-2 px-3">{s.cours?.intitule || s.cours?.code}</td>
                    <td className="py-2 px-3">{s.professeur ? `${s.professeur?.nom} ${s.professeur?.prenom}` : ''}</td>
                    <td className="py-2 px-3">{s.salle?.code || s.salle?.nom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
