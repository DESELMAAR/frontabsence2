import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'
import React from "react";
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

export default function EmploiDuTempsTable() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [edt, setEdt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showAddSeanceModal, setShowAddSeanceModal] = useState(false);
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [salles, setSalles] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState({ day: null, timeSlot: null });

  // Formulaire ajout séance
  const [newSeance, setNewSeance] = useState({
    coursId: '',
    professeurId: '',
    salleId: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    statut: 'PLANIFIEE'
  });

  const isAdmin = user?.role === 'ROLE_ADMIN';

  // ----- LOAD DATA -----
  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    if (selectedClass) {
      loadEmploiDuTemps(selectedClass);
      loadReferences();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/api/classes');
      setClasses(data || []);
    } catch (e) {
      setError('Erreur lors du chargement des classes');
    }
  };

  const loadEmploiDuTemps = async (classe) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/emploi-du-temps/by-classe/${classe.id}/latest`);
      setEdt(data || null);
      setMessage(null);
    } catch (e) {
      setEdt(null);
      setError('Aucun emploi du temps trouvé pour cette classe');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      const [coursRes, professeursRes, sallesRes] = await Promise.all([
        api.get('/api/cours'),
        api.get('/api/professeurs'),
        api.get('/api/salles')
      ]);
      setCours(coursRes.data || []);
      setProfesseurs(professeursRes.data || []);
      setSalles(sallesRes.data || []);
    } catch (e) {
      console.error('Erreur lors du chargement des références');
    }
  };

  // ----- SCHEDULE ORGANIZATION -----
  const organizeSchedule = () => {
    if (!edt || !edt.seances) return { days: [], timeSlots: [], schedule: {} };

    const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const timeSlots = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
    ];

    const schedule = {};
    daysOfWeek.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(slot => { schedule[day][slot] = null; });
    });

    edt.seances.forEach(seance => {
      const date = new Date(seance.date);
      const dayIndex = date.getDay(); // 0=dim, 1=lun...
      if (dayIndex >= 1 && dayIndex <= 6) {
        const day = daysOfWeek[dayIndex - 1];
        const startTime = (seance.heureDebut || '').substring(0, 5);
        const matchingSlot = timeSlots.find(s => s.startsWith(startTime));
        if (matchingSlot) {
          schedule[day][matchingSlot] = {
            id: seance.id,
            cours: seance.cours?.intitule || seance.cours?.code || 'Non défini',
            professeur: seance.professeur ? `${seance.professeur.nom} ${seance.professeur.prenom}` : 'Non assigné',
            salle: seance.salle?.code || seance.salle?.nom || 'Non assignée',
            statut: seance.statut,
            raw: seance,
          };
        }
      }
    });

    return { days: daysOfWeek, timeSlots, schedule };
  };

  const { days, timeSlots, schedule } = organizeSchedule();

  // Hauteur visuelle d'un créneau
  const SLOT_HEIGHT = 80;

  // ----- MERGE PLAN (rowspan) -----
  const mergePlan = useMemo(() => {
    // mergePlan[day][slot] = { rowSpan: number, hidden: bool }
    const plan = {};
    if (!days.length) return plan;

    const endOf = (slot) => slot.split('-')[1]; // "08:00-09:00" -> "09:00"
    const startOf = (slot) => slot.split('-')[0];

    days.forEach(day => {
      plan[day] = {};
      timeSlots.forEach(slot => { plan[day][slot] = { rowSpan: 1, hidden: false }; });

      let r = 0;
      while (r < timeSlots.length) {
        const slot = timeSlots[r];
        const cell = schedule[day][slot];
        if (!cell) { r++; continue; }

        // identity: coursId + profId + salleId
        const idCours = cell.raw?.cours?.id || null;
        const idProf  = cell.raw?.professeur?.id || null;
        const idSalle = cell.raw?.salle?.id || null;

        let span = 1;
        let cursor = r;

        while (cursor + 1 < timeSlots.length) {
          const currSlot = timeSlots[cursor];
          const nextSlot = timeSlots[cursor + 1];
          const currCell = schedule[day][currSlot];
          const nextCell = schedule[day][nextSlot];

          if (!currCell || !nextCell) break;

          const contiguous = endOf(currSlot) === startOf(nextSlot);
          const sameIdentity =
            (currCell.raw?.cours?.id || null) === idCours &&
            (currCell.raw?.professeur?.id || null) === idProf &&
            (currCell.raw?.salle?.id || null) === idSalle;

          if (contiguous && sameIdentity) {
            span++;
            cursor++;
          } else {
            break;
          }
        }

        plan[day][slot].rowSpan = span;
        for (let k = 1; k < span; k++) {
          plan[day][timeSlots[r + k]].hidden = true;
        }
        r += span;
      }
    });

    return plan;
  }, [days, timeSlots, schedule]);

  // ----- UI ACTIONS -----
  const openAddSeanceModal = (day, timeSlot) => {
    if (!isAdmin) return;

    setSelectedTimeSlot({ day, timeSlot });

    if (edt?.dateDebut) {
      const startDate = new Date(edt.dateDebut);
      const dayIndex = days.indexOf(day); // 0..5
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);

      const [startTime, endTime] = timeSlot.split('-');

      setNewSeance(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0],
        heureDebut: `${startTime}:00`,
        heureFin: `${endTime}:00`
      }));
    }

    setShowAddSeanceModal(true);
  };

  const addSeance = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...newSeance,
        coursId: Number(newSeance.coursId),
        professeurId: Number(newSeance.professeurId),
        salleId: Number(newSeance.salleId),
      };

      const { data } = await api.post(`/api/emploi-du-temps/${edt.id}/seances`, payload);
      setEdt(data);
      setShowAddSeanceModal(false);
      setNewSeance({ coursId: '', professeurId: '', salleId: '', date: '', heureDebut: '', heureFin: '', statut: 'PLANIFIEE' });
      setSelectedTimeSlot({ day: null, timeSlot: null });
      setMessage('Séance ajoutée avec succès');
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'ajout de la séance');
    }
  };

  const removeSeance = async (seanceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;
    setError(null);
    try {
      const { data } = await api.delete(`/api/emploi-du-temps/${edt.id}/seances/${seanceId}`);
      setEdt(data);
      setMessage('Séance supprimée avec succès');
    } catch (e) {
      setError('Erreur lors de la suppression de la séance');
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="title">Emploi du Temps par Classe</h1>
      </div>

      {message && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{message}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

      {/* Sélecteur de classe */}
      <div className="card">
        <label className="label">Sélectionner une classe</label>
        <select
          className="input"
          value={selectedClass?.id || ''}
          onChange={(e) => {
            const classId = e.target.value;
            const selected = classes.find(c => String(c.id) === String(classId));
            setSelectedClass(selected || null);
          }}
        >
          <option value="">Choisir une classe...</option>
          {classes.map(classe => (
            <option key={classe.id} value={classe.id}>
              {classe.nom} - {classe.niveau}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && edt && (
        <div className="space-y-4">
          {/* En-tête EDT */}
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{edt.intitule}</h2>
                <p className="text-gray-600">
                  Classe: {selectedClass.nom} - {selectedClass.niveau} | Période: {edt.dateDebut} au {edt.dateFin}
                </p>
              </div>
            </div>
          </div>

          {/* Tableau EDT */}
          <div className="card overflow-auto">
            <table className="min-w-full border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="p-3 border bg-gray-100 font-semibold">Créneau / Jour</th>
                  {days.map(day => (
                    <th key={day} className="p-3 border bg-gray-100 font-semibold text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td className="p-3 border bg-gray-50 font-medium text-center" style={{ height: `${SLOT_HEIGHT}px` }}>
                      {timeSlot}
                    </td>

                    {days.map((day) => {
                      const seance = schedule[day]?.[timeSlot] || null;
                      const mp = mergePlan[day]?.[timeSlot] || { rowSpan: 1, hidden: false };
                      if (mp.hidden) return null;

                      const isMerged = mp.rowSpan > 1;

                      return (
                        <td
                          key={`${day}-${timeSlot}`}
                          className="border align-top min-w-[200px] relative group p-0"
                          rowSpan={mp.rowSpan}
                          onMouseEnter={(e) => { e.currentTarget.classList.add('bg-gray-50'); }}
                          onMouseLeave={(e) => { e.currentTarget.classList.remove('bg-gray-50'); }}
                        >
                          {seance ? (
                            <div
                              className={`h-full w-full p-2 ${isMerged? 'absolute':''} rounded text-sm ${
                                isMerged
                                  ? 'bg-purple-100 border border-purple-300'
                                  : seance.statut === 'ANNULEE' ? 'bg-red-100'
                                  : seance.statut === 'REPORTEE' ? 'bg-yellow-100'
                                  : 'bg-blue-50'
                              }`}
                              style={{ minHeight: `${SLOT_HEIGHT * mp.rowSpan}px` }}
                            >
                              <div className="flex flex-col justify-center h-full">
                                <div className="font-semibold">{seance.cours}</div>
                                <div className="text-gray-600">{seance.professeur}</div>
                                <div className="text-gray-500">{seance.salle}</div>
                                <div className={`text-xs mt-1 ${
                                  seance.statut === 'ANNULEE' ? 'text-red-600'
                                  : seance.statut === 'REPORTEE' ? 'text-yellow-600'
                                  : 'text-green-600'
                                }`}>
                                  {seance.statut}{isMerged ? ' • (fusionné)' : ''}
                                </div>
                                {isAdmin && (
                                  <button
                                    className="btn btn-danger text-xs mt-2 w-full"
                                    onClick={() => removeSeance(seance.id)}
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-full w-full p-2 rounded bg-gray-50 text-gray-400 text-xs text-center flex items-center justify-center"
                              style={{ minHeight: `${SLOT_HEIGHT}px` }}
                            >
                              <span className="group-hover:hidden">-</span>
                              {isAdmin && (
                                <button
                                  className="btn btn-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 m-auto w-8 h-8 flex items-center justify-center"
                                  onClick={() => openAddSeanceModal(day, timeSlot)}
                                  title="Ajouter une séance"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="card">
            <h3 className="font-semibold mb-2">Légende :</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 mr-2"></div>
                <span>Bloc fusionné (mêmes cours/prof/salle sur créneaux consécutifs)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-50 mr-2 border border-blue-200"></div>
                <span>Planifiée</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 mr-2 border border-green-200"></div>
                <span>Effectuée</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 mr-2 border border-yellow-200"></div>
                <span>Reportée</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 mr-2 border border-red-200"></div>
                <span>Annulée</span>
              </div>
            </div>
            {isAdmin && (
              <div className="mt-3 text-xs text-gray-600">
                💡 <strong>Astuce :</strong> Les blocs se fusionnent automatiquement si les créneaux se touchent
                (ex: 08:00-09:00 puis 09:00-10:00) et que le <em>cours + professeur + salle</em> sont identiques.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedClass && !edt && !loading && (
        <div className="card text-center py-8">
          <p className="text-gray-500">Aucun emploi du temps trouvé pour cette classe.</p>
          {isAdmin && (
            <button className="btn btn-primary mt-4">
              Créer un nouvel emploi du temps
            </button>
          )}
        </div>
      )}

      {/* Modal d'ajout de séance */}
      <Modal open={showAddSeanceModal} title="Ajouter une séance" onClose={() => {
        setShowAddSeanceModal(false);
        setSelectedTimeSlot({ day: null, timeSlot: null });
      }}>
        <form onSubmit={addSeance} className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-800">Créneau sélectionné :</h4>
            <p className="text-blue-600">
              {selectedTimeSlot.day} - {selectedTimeSlot.timeSlot}
            </p>
          </div>

          <div>
            <label className="label">Cours *</label>
            <select
              className="input"
              value={newSeance.coursId}
              onChange={e => setNewSeance(s => ({ ...s, coursId: Number(e.target.value) }))}
              required
            >
              <option value="">Sélectionner un cours</option>
              {cours.filter(c => c.classe?.id === selectedClass?.id).map(cours => (
                <option key={cours.id} value={cours.id}>
                  {cours.code} - {cours.intitule}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Professeur *</label>
            <select
              className="input"
              value={newSeance.professeurId}
              onChange={e => setNewSeance(s => ({ ...s, professeurId: Number(e.target.value) }))}
              required
            >
              <option value="">Sélectionner un professeur</option>
              {professeurs.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nom} {prof.prenom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Salle *</label>
            <select
              className="input"
              value={newSeance.salleId}
              onChange={e => setNewSeance(s => ({ ...s, salleId: Number(e.target.value) }))}
              required
            >
              <option value="">Sélectionner une salle</option>
              {salles.map(salle => (
                <option key={salle.id} value={salle.id}>
                  {salle.code} ({salle.capacite} places)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              className="input"
              type="date"
              value={newSeance.date}
              onChange={e => setNewSeance(s => ({ ...s, date: e.target.value }))}
              required
              min={edt?.dateDebut}
              max={edt?.dateFin}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Heure de début *</label>
              <input
                className="input"
                type="time"
                value={newSeance.heureDebut}
                onChange={e => setNewSeance(s => ({ ...s, heureDebut: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Heure de fin *</label>
              <input
                className="input"
                type="time"
                value={newSeance.heureFin}
                onChange={e => setNewSeance(s => ({ ...s, heureFin: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={newSeance.statut}
              onChange={e => setNewSeance(s => ({ ...s, statut: e.target.value }))}
            >
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EFFECTUEE">Effectuée</option>
              <option value="ANNULEE">Annulée</option>
              <option value="REPORTEE">Reportée</option>
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="submit" className="btn btn-primary flex-1">Ajouter la séance</button>
            <button type="button" className="btn" onClick={() => {
              setShowAddSeanceModal(false);
              setSelectedTimeSlot({ day: null, timeSlot: null });
            }}>Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
