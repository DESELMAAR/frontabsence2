import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import AttendanceModal from '../components/AttendanceModal';
import deleteIcon from '../delete.svg';
import { Link } from 'react-router-dom';
import { downloadPdf } from '../services/api';

import {
  getSeanceAbsences,
  getSeanceAbsencesCount,
  bulkCreateAbsences,
  listEtudiantsByClasse,
} from '../services/absenceApi';

// Helpers locaux pour éviter les erreurs d'import nommés
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback || 'Erreur inattendue';

const AvailabilityAPI = {
  professeurs: async (date, start, end) => {
    const { data } = await api.get('/api/professeurs/available', {
      params: { date, start, end },
    });
    return data;
  },
  salles: async (date, start, end) => {
    const { data } = await api.get('/api/salles/available', {
      params: { date, start, end },
    });
    return data;
  },
};

export default function EmploiDuTempsTable() {
  const { user } = useAuth();

  // ====== States ======
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [edt, setEdt] = useState(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Référentiels
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [salles, setSalles] = useState([]);

  // Ajout séance
  const [showAddSeanceModal, setShowAddSeanceModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState({ day: null, timeSlot: null });
  const [duplicateChoice, setDuplicateChoice] = useState('new'); // 'new' | 'duplicate'
  const [newSeance, setNewSeance] = useState({
    coursId: '',
    professeurId: '',
    salleId: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    statut: 'PLANIFIEE',
  });

  // Dispo
  const [availableProfesseurs, setAvailableProfesseurs] = useState([]);
  const [availableSalles, setAvailableSalles] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState(null);

  // Absences
  const [absMenuSeanceId, setAbsMenuSeanceId] = useState(null);
  const [absModalOpen, setAbsModalOpen] = useState(false);
  const [absModalLoading, setAbsModalLoading] = useState(false);
  const [absModalError, setAbsModalError] = useState(null);
  const [absSeance, setAbsSeance] = useState(null);
  const [absStats, setAbsStats] = useState({ total: 0, justifiees: 0, nonJustifiees: 0 });
  const [absList, setAbsList] = useState([]);
  const [etudiantsClasse, setEtudiantsClasse] = useState([]);
  const [absSelection, setAbsSelection] = useState(new Set());

  const isAdmin = user?.role === 'ROLE_ADMIN';

  const currentUserId = user?.id ?? user?.userId;
  // ====== Helpers ======
  const setErrorWithTimeout = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const displayProf = (p) =>
    [p?.nom, p?.prenom].filter(Boolean).join(' ').trim() || p?.email || `#${p?.id}`;

  const displaySalle = (s) =>
    s?.code || [s?.batiment, s?.numero].filter(Boolean).join('-') || `Salle #${s?.id}`;

  const sortedAvailableProfesseurs = useMemo(
    () => [...availableProfesseurs].sort((a, b) => displayProf(a).localeCompare(displayProf(b), 'fr')),
    [availableProfesseurs]
  );
  const sortedAvailableSalles = useMemo(
    () => [...availableSalles].sort((a, b) => displaySalle(a).localeCompare(displaySalle(b), 'fr')),
    [availableSalles]
  );

  // Trouver le nom d'un étudiant à partir de son id via la liste etudiantsClasse
  const nameOf = (id) => {
    const et = etudiantsClasse.find((e) => String(e.id) === String(id));
    return et ? `${et.nom ?? ''} ${et.prenom ?? ''}`.trim() || `Étudiant #${id}` : `Étudiant #${id}`;
    // (utilisé dans AttendanceModal si nécessaire)
  };

  // ====== Data loading ======
  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadEmploiDuTemps(selectedClass);
      loadReferences();
    }
  }, [selectedClass]);

  useEffect(() => {
    setNewSeance((s) => ({ ...s, coursId: '' }));
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/api/classes');
      setClasses(data || []);
    } catch {
      setErrorWithTimeout('Erreur lors du chargement des classes');
    }
  };

  const loadEmploiDuTemps = async (classe) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/emploi-du-temps/by-classe/${classe.id}/latest`);
      setEdt(data || null);
      setMessage(null);
    } catch {
      setEdt(null);
      setErrorWithTimeout('Aucun emploi du temps trouvé pour cette classe');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      let coursData = [];
      if (selectedClass?.id) {
        const { data } = await api.get(`/api/cours/by-classe/${selectedClass.id}`);
        coursData = Array.isArray(data) ? data : [];
      } else {
        const { data } = await api.get('/api/cours');
        coursData = Array.isArray(data) ? data : [];
      }

      if ((!coursData || coursData.length === 0) && selectedClass?.id) {
        const { data: all } = await api.get('/api/cours');
        coursData = Array.isArray(all)
          ? all.filter((c) => Array.isArray(c.classes) && c.classes.some((cl) => cl.id === selectedClass.id))
          : [];
      }

      const [professeursRes, sallesRes] = await Promise.all([api.get('/api/professeurs'), api.get('/api/salles')]);
      setCours(coursData);
      setProfesseurs(professeursRes.data || []);
      setSalles(sallesRes.data || []);
    } catch (e) {
      console.error('Erreur lors du chargement des références', e);
      setCours([]);
      setProfesseurs([]);
      setSalles([]);
    }
  };

  // ====== Schedule organization ======
  const organizeSchedule = () => {
    if (!edt || !edt.seances) return { days: [], timeSlots: [], schedule: {} };

    const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const timeSlots = [
      '08:00-09:00',
      '09:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00',
      '17:00-18:00',
    ];

    const schedule = {};
    daysOfWeek.forEach((day) => {
      schedule[day] = {};
      timeSlots.forEach((slot) => {
        schedule[day][slot] = null;
      });
    });

    edt.seances.forEach((seance) => {
      const date = new Date(seance.date);
      const dayIndex = date.getDay(); // 0=dim, 1=lun...
      if (dayIndex >= 1 && dayIndex <= 6) {
        const day = daysOfWeek[dayIndex - 1];
        const startTime = (seance.heureDebut || '').substring(0, 5);
        const matchingSlot = timeSlots.find((s) => s.startsWith(startTime));
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
  const SLOT_HEIGHT = 80;

  // ====== Merge plan (rowSpan) ======
  const mergePlan = useMemo(() => {
    const plan = {};
    if (!days.length) return plan;

    const endOf = (slot) => slot.split('-')[1];
    const startOf = (slot) => slot.split('-')[0];

    days.forEach((day) => {
      plan[day] = {};
      timeSlots.forEach((slot) => {
        plan[day][slot] = { rowSpan: 1, hidden: false };
      });

      let r = 0;
      while (r < timeSlots.length) {
        const slot = timeSlots[r];
        const cell = schedule[day][slot];
        if (!cell) {
          r++;
          continue;
        }

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
            (currCell.raw?.cours?.id || null) === (nextCell.raw?.cours?.id || null) &&
            (currCell.raw?.professeur?.id || null) === (nextCell.raw?.professeur?.id || null) &&
            (currCell.raw?.salle?.id || null) === (nextCell.raw?.salle?.id || null);

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

  // ====== Availability (API + fallback local) ======
  const normalizeTime = (t) => (t?.length === 5 ? `${t}:00` : t || '');
  const timeToMinutes = (t) => {
    const [h, m] = (t || '00:00:00').split(':').map(Number);
    return h * 60 + m;
  };
  const overlaps = (startA, endA, startB, endB) => {
    const a1 = timeToMinutes(normalizeTime(startA));
    const a2 = timeToMinutes(normalizeTime(endA));
    const b1 = timeToMinutes(normalizeTime(startB));
    const b2 = timeToMinutes(normalizeTime(endB));
    return a1 < b2 && a2 > b1;
  };

  const computeLocalAvailability = (dateISO, start, end) => {
    if (!edt?.seances?.length) {
      return { profs: professeurs, rooms: salles, source: 'local:empty' };
    }
    const dayStr = new Date(dateISO).toISOString().split('T')[0];
    const sameDaySeances = edt.seances.filter((s) => (s.date || '').startsWith(dayStr));

    const busyProfIds = new Set();
    const busySalleIds = new Set();
    sameDaySeances.forEach((s) => {
      if (overlaps(start, end, s.heureDebut, s.heureFin)) {
        if (s.professeur?.id) busyProfIds.add(s.professeur.id);
        if (s.salle?.id) busySalleIds.add(s.salle.id);
      }
    });

    const profs = (professeurs || []).filter((p) => !busyProfIds.has(p.id));
    const rooms = (salles || []).filter((r) => !busySalleIds.has(r.id));
    return { profs, rooms, source: 'local' };
  };

  const fetchAvailability = async (dateISO, startTime, endTime) => {
    if (!dateISO || !startTime || !endTime) {
      setAvailableProfesseurs([]);
      setAvailableSalles([]);
      setAvailError(null);
      return;
    }
    setAvailLoading(true);
    setAvailError(null);
    try {
      const [profs, rooms] = await Promise.all([
        AvailabilityAPI.professeurs(dateISO, normalizeTime(startTime), normalizeTime(endTime)),
        AvailabilityAPI.salles(dateISO, normalizeTime(startTime), normalizeTime(endTime)),
      ]);
      setAvailableProfesseurs(Array.isArray(profs) ? profs : []);
      setAvailableSalles(Array.isArray(rooms) ? rooms : []);
      setAvailError(null);
    } catch (err) {
      const { profs, rooms } = computeLocalAvailability(dateISO, startTime, endTime);
      setAvailableProfesseurs(profs);
      setAvailableSalles(rooms);
      setAvailError(getErrorMessage(err, 'fallback'));
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    if (!showAddSeanceModal) return;
    if (!newSeance.date || !newSeance.heureDebut || !newSeance.heureFin) return;
    fetchAvailability(newSeance.date, newSeance.heureDebut, newSeance.heureFin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddSeanceModal, newSeance.date, newSeance.heureDebut, newSeance.heureFin]);

  // ====== Actions: Add / Remove seance ======
  const openAddSeanceModal = (day, timeSlot) => {
    if (!isAdmin) return;
    setSelectedTimeSlot({ day, timeSlot });
    setDuplicateChoice('new');

    if (edt?.dateDebut) {
      const startDate = new Date(edt.dateDebut);
      const dayIndex = days.indexOf(day); // 0..5
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
      const [startTime, endTime] = timeSlot.split('-');

      const nextState = {
        ...newSeance,
        date: date.toISOString().split('T')[0],
        heureDebut: `${startTime}:00`,
        heureFin: `${endTime}:00`,
      };
      setNewSeance(nextState);
      fetchAvailability(nextState.date, nextState.heureDebut, nextState.heureFin);
    }

    setShowAddSeanceModal(true);
  };

  const addSeance = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let payload;

      if (duplicateChoice === 'duplicate') {
        const currentDaySeances =
          edt?.seances?.filter((seance) => {
            const seanceDate = new Date(seance.date);
            const dayIndex = seanceDate.getDay(); // 0=dim, 1=lun...
            return days[dayIndex - 1] === selectedTimeSlot.day;
          }) || [];

        if (currentDaySeances.length > 0) {
          const lastSeance = currentDaySeances[currentDaySeances.length - 1];
          payload = {
            coursId: lastSeance.cours?.id,
            professeurId: lastSeance.professeur?.id,
            salleId: lastSeance.salle?.id,
            date: newSeance.date,
            heureDebut: newSeance.heureDebut,
            heureFin: newSeance.heureFin,
            statut: 'PLANIFIEE',
          };
        } else {
          payload = { ...newSeance };
        }
      } else {
        payload = {
          ...newSeance,
          coursId: Number(newSeance.coursId),
          professeurId: Number(newSeance.professeurId),
          salleId: Number(newSeance.salleId),
        };
      }

      const { data } = await api.post(`/api/emploi-du-temps/${edt.id}/seances`, payload);
      setEdt(data);
      setShowAddSeanceModal(false);
      setNewSeance({
        coursId: '',
        professeurId: '',
        salleId: '',
        date: '',
        heureDebut: '',
        heureFin: '',
        statut: 'PLANIFIEE',
      });
      setSelectedTimeSlot({ day: null, timeSlot: null });
      setAvailableProfesseurs([]);
      setAvailableSalles([]);
      setMessage('Séance ajoutée avec succès');
    } catch (e) {
      setErrorWithTimeout(getErrorMessage(e, "Erreur lors de l'ajout de la séance"));
    }
  };

  const removeSeance = async (seanceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) return;
    setError(null);
    try {
      const { data } = await api.delete(`/api/emploi-du-temps/${edt.id}/seances/${seanceId}`);
      setEdt(data);
      setMessage('Séance supprimée avec succès');
    } catch {
      setErrorWithTimeout('Erreur lors de la suppression de la séance');
    }
  };

  // ====== Absences ======
  const closeAbsMenu = () => setAbsMenuSeanceId(null);

  const toggleStudentInSelection = (id) => {
    setAbsSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openAbsencesModal = async (seanceCell) => {
    // seanceCell est l'objet "cellule" (avec raw), ou directement la séance simplifiée (depuis le rendu)
    const seanceId = seanceCell?.raw?.id || seanceCell?.id;
    if (!seanceId) return;

    setAbsSeance(seanceCell.raw || { id: seanceId });
    setAbsModalOpen(true);
    setAbsModalLoading(true);
    setAbsModalError(null);

    try {
      const [stats, list] = await Promise.all([
        getSeanceAbsencesCount(seanceId).catch(() => ({ total: 0, justifiees: 0, nonJustifiees: 0 })),
        getSeanceAbsences(seanceId).catch(() => []),
      ]);
      setAbsStats(stats || { total: 0, justifiees: 0, nonJustifiees: 0 });
      setAbsList(Array.isArray(list) ? list : []);

      const etuds = selectedClass?.id ? await listEtudiantsByClasse(selectedClass.id).catch(() => []) : [];
      setEtudiantsClasse(Array.isArray(etuds) ? etuds : []);

      // IMPORTANT : pré-cocher via etudiantId (le DTO ne contient pas l'objet etudiant)
      const pre = new Set((list || []).map((a) => a?.etudiantId).filter(Boolean));
      setAbsSelection(pre);
    } catch (err) {
      setAbsModalError(getErrorMessage(err, 'Impossible de charger les absences'));
    } finally {
      setAbsModalLoading(false);
      closeAbsMenu();
    }
  };

  const submitAbsences = async () => {
    if (!absSeance?.id) return;
    setAbsModalLoading(true);
    setAbsModalError(null);
    try {
      const payload = {
        absences: Array.from(absSelection).map((etudiantId) => ({
          etudiantId,
          justifiee: false,
        })),
      };
      await bulkCreateAbsences(absSeance.id, payload);

      const [stats, list] = await Promise.all([
        getSeanceAbsencesCount(absSeance.id),
        getSeanceAbsences(absSeance.id),
      ]);
      setAbsStats(stats || { total: 0, justifiees: 0, nonJustifiees: 0 });
      setAbsList(Array.isArray(list) ? list : []);
      setMessage('Absences enregistrées');
    } catch (err) {
      setAbsModalError(getErrorMessage(err, 'Échec d’enregistrement des absences'));
    } finally {
      setAbsModalLoading(false);
    }
  };

  // ====== Rendu ======
  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="space-y-6 bg-black bg-opacity-30 p-4 rounded-xl">
      <div className="flex justify-between items-center">
        <h1 className="title text-white/90">Emploi du Temps par Classe</h1>
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
            const selected = classes.find((c) => String(c.id) === String(classId));
            setSelectedClass(selected || null);
          }}
        >
          <option value="">Choisir une classe...</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.nom} - {classe.niveau}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && edt && (
        <div className="space-y-4 bg-white rounded-xl">
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
          <div className="card overflow-auto ">
            <table className="min-w-full border-collapse table-fixed ">
              <thead>
                <tr>
                  <th className="p-3 border bg-gray-100 font-semibold">Créneau / Jour</th>
                  {days.map((day) => (
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
                          className="border align-top min-w-[180px] relative group p-0"
                          rowSpan={mp.rowSpan}
                          onMouseEnter={(e) => e.currentTarget.classList.add('bg-gray-50')}
                          onMouseLeave={(e) => e.currentTarget.classList.remove('bg-gray-50')}
                        >
                          {seance ? (
                            <div
                              className={`h-full w-full p-2 ${isMerged ? 'absolute' : ''} rounded text-sm ${isMerged
                                  ? 'bg-purple-100 border border-purple-300'
                                  : seance.statut === 'ANNULEE'
                                    ? 'bg-red-100'
                                    : seance.statut === 'REPORTEE'
                                      ? 'bg-yellow-100'
                                      : 'bg-blue-50'
                                }`}
                              style={{ minHeight: `${SLOT_HEIGHT * mp.rowSpan}px` }}
                            >
                              <div className="flex flex-col h-full">
                                {/* Ligne titre + kebab */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold">{seance.cours}</div>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      className="px-2 py-1 rounded hover:bg-black/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAbsMenuSeanceId((prev) => (prev === seance.id ? null : seance.id));
                                      }}
                                      title="Actions de la séance"
                                    >
                                      ⋮
                                    </button>

                                    {absMenuSeanceId === seance.id && (
                                      <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                        <button
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                          onClick={() => openAbsencesModal(seance)}
                                        >
                                          Marquer les absences
                                        </button>
                                        {isAdmin && (
                                          <button
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-700"
                                            onClick={() => {
                                              setAbsMenuSeanceId(null);
                                              removeSeance(seance.id);
                                            }}
                                          >
                                            Supprimer la séance
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Infos prof / salle */}
                                <div className="text-gray-600">{seance.professeur}</div>
                                <div className="text-gray-500">{seance.salle}</div>

                                {/* Statut */}
                                <div
                                  className={`text-xs mt-1 ${seance.statut === 'ANNULEE'
                                      ? 'text-red-600'
                                      : seance.statut === 'REPORTEE'
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}
                                >
                                  {seance.statut}
                                  {isMerged ? ' • (fusionné)' : ''}
                                </div>

                                {/* Bouton suppression en hover (optionnel, gardé) */}
                                {isAdmin && (
                                  <button
                                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeSeance(seance.id)}
                                  >
                                    <img src={deleteIcon} alt="delete" className="h-6 w-6" />
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

            {user?.role === 'ROLE_ETUDIANT' && currentUserId && (
              <button
                className="btn btn-primary mt-4 bg-yellow-600 hover:bg-yellow-600"
                onClick={() => downloadPdf(`/api/emploi-du-temps/etudiant/${currentUserId}/pdf`, 'Mon-EDT.pdf')}
              >
                Télécharger mon EDT (PDF)
              </button>
            )}
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
                💡 <strong>Astuce :</strong> Les blocs se fusionnent automatiquement si les créneaux se touchent (ex:
                08:00-09:00 puis 09:00-10:00) et que le <em>cours + professeur + salle</em> sont identiques.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedClass && !edt && !loading && (
        <div className="card text-center py-8">
          <p className="text-gray-500 mb-6">Aucun emploi du temps trouvé pour cette classe.</p>
          {isAdmin && (
            <Link to="/gestion-edt" className="btn btn-primary mt-7">
              Créer un nouvel emploi du temps
            </Link>
          )}
        </div>
      )}

      {/* Modal: Ajout de séance */}
      <Modal
        open={showAddSeanceModal}
        title="Ajouter une séance"
        onClose={() => {
          setShowAddSeanceModal(false);
          setSelectedTimeSlot({ day: null, timeSlot: null });
          setAvailError(null);
          setAvailableProfesseurs([]);
          setAvailableSalles([]);
        }}
      >
        <form onSubmit={addSeance} className="space-y-4">
          {/* Créneau sélectionné + Dispo */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-800">Créneau sélectionné :</h4>
            <p className="text-blue-600">
              {selectedTimeSlot.day} - {selectedTimeSlot.timeSlot}
            </p>

            {availLoading ? (
              <p className="text-xs text-blue-700 mt-1">Recherche des disponibilités…</p>
            ) : (
              <>
                <p className="text-xs text-blue-700 mt-1">
                  {sortedAvailableProfesseurs.length} prof(s) dispo · {sortedAvailableSalles.length} salle(s) dispo
                  {availError ? ' (fallback local)' : ''}
                </p>

                {/* Chips profs dispo */}
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Professeurs disponibles</div>
                  {sortedAvailableProfesseurs.length ? (
                    <div className="flex flex-wrap gap-2">
                      {sortedAvailableProfesseurs.slice(0, 8).map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs hover:bg-green-100"
                          onClick={() => setNewSeance((s) => ({ ...s, professeurId: Number(p.id) }))}
                          title="Cliquer pour sélectionner ce professeur"
                        >
                          {displayProf(p)}
                        </button>
                      ))}
                      {sortedAvailableProfesseurs.length > 8 && (
                        <span className="text-xs text-gray-500">
                          +{sortedAvailableProfesseurs.length - 8} autres…
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Aucun professeur disponible.</div>
                  )}
                </div>

                {/* Chips salles dispo */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Salles disponibles</div>
                  {sortedAvailableSalles.length ? (
                    <div className="flex flex-wrap gap-2">
                      {sortedAvailableSalles.map((salle) => (
                        <button
                          type="button"
                          key={salle.id}
                          className="px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs hover:bg-blue-100"
                          onClick={() => setNewSeance((s) => ({ ...s, salleId: Number(salle.id) }))}
                          title="Cliquer pour sélectionner cette salle"
                        >
                          {displaySalle(salle)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Aucune salle disponible.</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Choix duplication */}
          {edt?.seances?.some((seance) => {
            const seanceDate = new Date(seance.date);
            const dayIndex = seanceDate.getDay(); // 0=dim, 1=lun...
            return days[dayIndex - 1] === selectedTimeSlot.day;
          }) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="label">Type d'ajout :</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duplicateChoice"
                      value="new"
                      checked={duplicateChoice === 'new'}
                      onChange={(e) => setDuplicateChoice(e.target.value)}
                      className="mr-2"
                    />
                    Nouvelle séance
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="duplicateChoice"
                      value="duplicate"
                      checked={duplicateChoice === 'duplicate'}
                      onChange={(e) => setDuplicateChoice(e.target.value)}
                      className="mr-2"
                    />
                    Même séance que précédemment
                  </label>
                </div>
                {duplicateChoice === 'duplicate' && (
                  <p className="text-xs text-gray-600 mt-2">
                    La séance utilisera le même cours, professeur et salle que la dernière séance de ce jour.
                  </p>
                )}
              </div>
            )}

          {/* Formulaire (mode NEW) */}
          {duplicateChoice === 'new' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Cours *</label>
                  <select
                    className="input"
                    value={newSeance.coursId}
                    onChange={(e) => setNewSeance((s) => ({ ...s, coursId: Number(e.target.value) }))}
                    required
                  >
                    <option value="">Sélectionner un cours</option>
                    {cours.length === 0 && selectedClass?.id && (
                      <option disabled value="">
                        Aucun cours associé à cette classe
                      </option>
                    )}
                    {cours.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.intitule}
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
                    onChange={(e) => setNewSeance((s) => ({ ...s, date: e.target.value }))}
                    required
                    min={edt?.dateDebut}
                    max={edt?.dateFin}
                  />
                </div>

                <div>
                  <label className="label">Statut</label>
                  <select
                    className="input"
                    value={newSeance.statut}
                    onChange={(e) => setNewSeance((s) => ({ ...s, statut: e.target.value }))}
                  >
                    <option value="PLANIFIEE">Planifiée</option>
                    <option value="EFFECTUEE">Effectuée</option>
                    <option value="ANNULEE">Annulée</option>
                    <option value="REPORTEE">Reportée</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label">Professeur disponible *</label>
                  <select
                    className="input"
                    value={newSeance.professeurId}
                    onChange={(e) => setNewSeance((s) => ({ ...s, professeurId: Number(e.target.value) }))}
                    required
                  >
                    <option value="">{availLoading ? 'Chargement…' : 'Sélectionner un professeur'}</option>
                    {availableProfesseurs.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nom} {prof.prenom}
                      </option>
                    ))}
                    {!availLoading && availableProfesseurs.length === 0 && (
                      <option disabled value="">
                        Aucun professeur disponible à ce créneau
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="label">Salle disponible *</label>
                  <select
                    className="input"
                    value={newSeance.salleId}
                    onChange={(e) => setNewSeance((s) => ({ ...s, salleId: Number(e.target.value) }))}
                    required
                  >
                    <option value="">{availLoading ? 'Chargement…' : 'Sélectionner une salle'}</option>
                    {availableSalles.map((salle) => (
                      <option key={salle.id} value={salle.id}>
                        {salle.code} ({salle.capacite} places)
                      </option>
                    ))}
                    {!availLoading && availableSalles.length === 0 && (
                      <option disabled value="">
                        Aucune salle disponible à ce créneau
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Heure de début *</label>
                    <input
                      className="input"
                      type="time"
                      value={newSeance.heureDebut}
                      onChange={(e) => setNewSeance((s) => ({ ...s, heureDebut: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Heure de fin *</label>
                    <input
                      className="input"
                      type="time"
                      value={newSeance.heureFin}
                      onChange={(e) => setNewSeance((s) => ({ ...s, heureFin: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={
                duplicateChoice === 'new' &&
                (!newSeance.coursId || !newSeance.professeurId || !newSeance.salleId || availLoading)
              }
            >
              {duplicateChoice === 'duplicate' ? 'Dupliquer la séance' : 'Ajouter la séance'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowAddSeanceModal(false);
                setSelectedTimeSlot({ day: null, timeSlot: null });
                setAvailError(null);
                setAvailableProfesseurs([]);
                setAvailableSalles([]);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Absences */}
      <AttendanceModal
        open={absModalOpen}
        onClose={() => {
          setAbsModalOpen(false);
          setAbsModalError(null);
        }}
        seance={absSeance}
        stats={absStats}
        etudiants={etudiantsClasse}
        selection={absSelection}
        onToggle={toggleStudentInSelection}
        onSubmit={submitAbsences}
        loading={absModalLoading}
        error={absModalError}
      />
    </div>
  );
}
