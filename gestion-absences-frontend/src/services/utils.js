
export function get(obj, path, fallback='') {
  try {
    return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj) ?? fallback
  } catch(e) { return fallback }
}
