import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  // withCredentials: true, // uncomment if you need cookies
});

// Attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Basic 401 handling (optional)
api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err?.response?.status === 401) {
      // e.g., you could auto-logout here if desired
      // localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

/** Extract a friendly error message from an axios error */
export const getErrorMessage = (err, fallback = 'Une erreur est survenue') => {
  try {
    if (err?.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') return data;
      if (data?.message) return data.message;
      if (data?.error) return data.error;
    }
    if (err?.message) return err.message;
  } catch (_) {} // no-op
  return fallback;
};

/**
 * Availability endpoints wrappers
 * Expect your backend to expose:
 *   GET /api/professeurs/available?date=YYYY-MM-DD&start=HH:mm:ss&end=HH:mm:ss
 *   GET /api/salles/available?date=YYYY-MM-DD&start=HH:mm:ss&end=HH:mm:ss
 * These methods just return response.data or throw (handled by caller for fallback).
 */
export const AvailabilityAPI = {
  async professeurs(date, start, end) {
    const { data } = await api.get('/api/professeurs/available', {
      params: { date, start, end },
    });
    return Array.isArray(data) ? data : [];
  },

  async salles(date, start, end) {
    const { data } = await api.get('/api/salles/available', {
      params: { date, start, end },
    });
    return Array.isArray(data) ? data : [];
  },
};

export async function downloadPdf(url, filename = 'edt.pdf') {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}


export default api;


// import axios from 'axios'

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
// })

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// api.interceptors.response.use(
//   (resp) => resp,
//   (err) => {
//     if (err.response && err.response.status === 401) {
//       // Optional: clear token on 401
//       // localStorage.removeItem('token')
//     }
//     return Promise.reject(err)
//   }
// )

// export default api
