import api from './api';

// GET: absences de la séance
export const getSeanceAbsences = async (seanceId) => {
  const { data } = await api.get(`/api/seances/${seanceId}/absences`);
  return data;
};

// GET: stats absences de la séance
export const getSeanceAbsencesCount = async (seanceId) => {
  const { data } = await api.get(`/api/seances/${seanceId}/absences/count`);
  return data;
};

// POST: création en masse
export const bulkCreateAbsences = async (seanceId, payload) => {
  const { data } = await api.post(`/api/seances/${seanceId}/absences/bulk`, payload);
  return data;
};

// (utile) étudiants d'une classe
export const listEtudiantsByClasse = async (classeId) => {
  const { data } = await api.get(`/api/classes/${classeId}/etudiants`);
  return data;
};
