import { useEffect, useState } from 'react'
import api from '../services/api'
import React from "react";
import { useAuth } from '../contexts/AuthContext';

export default function EmploiDuTemps() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [weekStart, setWeekStart] = useState('')
  const [edt, setEdt] = useState(null)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)

  const isAdmin = user?.role === 'ROLE_ADMIN';

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
      if (e?.response?.status === 403) {
        setError('Accès refusé. Seuls les administrateurs peuvent générer des emplois du temps.')
      } else {
        setError(e?.response?.data?.message || e.message)
      }
    }
  }

  // Fonction pour organiser les séances par jour et par heure
  const organizeSeancesByDayAndTime = (seances) => {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const timeSlots = [];
    
    // Créer des créneaux horaires de 8h à 18h par tranches de 1 heure
    for (let hour = 8; hour <= 18; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Initialiser la structure de données
    const schedule = {};
    daysOfWeek.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(time => {
        schedule[day][time] = null;
      });
    });
    
    // Remplir avec les séances existantes
    seances.forEach(seance => {
      const date = new Date(seance.date);
      const dayIndex = date.getDay(); // 0 (dimanche) à 6 (samedi)
      
      // Ajuster pour que lundi = 0 à samedi = 5
      const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      
      if (adjustedDayIndex >= 0 && adjustedDayIndex < daysOfWeek.length) {
        const day = daysOfWeek[adjustedDayIndex];
        const startTime = seance.heureDebut.substring(0, 5); // Format "HH:MM"
        
        // Trouver le créneau horaire le plus proche
        const timeSlot = timeSlots.find(slot => slot === startTime) || 
                         timeSlots.reduce((prev, curr) => {
                           return Math.abs(parseInt(curr) - parseInt(startTime)) < Math.abs(parseInt(prev) - parseInt(startTime)) ? curr : prev;
                         });
        
        if (timeSlot) {
          schedule[day][timeSlot] = {
            id: seance.id,
            cours: seance.cours?.intitule || seance.cours?.code,
            professeur: seance.professeur ? `${seance.professeur?.nom} ${seance.professeur?.prenom}` : '',
            salle: seance.salle?.code || seance.salle?.nom,
            statut: seance.statut,
            time: `${seance.heureDebut} - ${seance.heureFin}`
          };
        }
      }
    });
    
    return { daysOfWeek, timeSlots, schedule };
  };

  // CORRECTION : Vérification que edt et edt.seances existent avant de déstructurer
  const scheduleData = edt && edt.seances ? organizeSeancesByDayAndTime(edt.seances) : null;
  const daysOfWeek = scheduleData?.daysOfWeek || [];
  const timeSlots = scheduleData?.timeSlots || [];
  const schedule = scheduleData?.schedule || {};

  return (
    <div className="space-y-4">
      <h1 className="title">Emploi du temps</h1>
      {msg && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{msg}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}
      
      {!isAdmin && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl">
          <strong>Information :</strong> Seuls les administrateurs peuvent générer de nouveaux emplois du temps.
          Vous pouvez consulter les emplois du temps existants.
        </div>
      )}
      
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
            
            {isAdmin && (
              <button className="btn btn-primary" onClick={generate16}>Générer 16 séances</button>
            )}
          </div>
        </div>
      </div>

      {edt && (
        <div className="card overflow-auto">
          <div className="font-semibold mb-2">{edt.intitule}</div>
          <div className="text-sm text-gray-600 mb-4">Période: {edt.dateDebut} → {edt.dateFin}</div>
          
          {edt.seances && edt.seances.length > 0 ? (
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border bg-gray-100">Heure</th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="p-2 border bg-gray-100">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="p-2 border bg-gray-50 font-medium">{time}</td>
                    {daysOfWeek.map(day => {
                      const seance = schedule[day] && schedule[day][time];
                      return (
                        <td key={`${day}-${time}`} className="p-2 border align-top" style={{ minWidth: '150px' }}>
                          {seance ? (
                            <div className={`p-2 rounded text-xs ${seance.statut === 'ANNULEE' ? 'bg-red-100' : seance.statut === 'REPORTEE' ? 'bg-yellow-100' : 'bg-blue-50'}`}>
                              <div className="font-semibold">{seance.cours}</div>
                              <div className="text-gray-600">{seance.professeur}</div>
                              <div className="text-gray-500">{seance.salle}</div>
                              <div className="text-gray-400 mt-1">{seance.time}</div>
                              <div className={`text-xs mt-1 ${seance.statut === 'ANNULEE' ? 'text-red-600' : seance.statut === 'REPORTEE' ? 'text-yellow-600' : 'text-green-600'}`}>
                                {seance.statut}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded bg-gray-50 text-gray-400 text-xs text-center">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Aucune séance planifiée dans cet emploi du temps.
            </div>
          )}
        </div>
      )}
    </div>
  )
}