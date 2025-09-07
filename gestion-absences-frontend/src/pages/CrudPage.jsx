import { useEffect, useMemo, useState } from 'react'
import entitiesConfig from '../config/entities'
import api from '../services/api'
import Modal from '../components/Modal'
import { get } from '../services/utils'
import React from 'react'

export default function CrudPage({ entityKey }) {
  const cfg = entitiesConfig[entityKey]

  // ------- état liste / formulaire existants -------
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [options, setOptions] = useState({})
  const [toast, setToast] = useState(null)
  const [extraResult, setExtraResult] = useState(null)

  // ------- NOUVEAU : recherche / filtre / pagination -------
  const [query, setQuery] = useState('')                 // recherche globale
  const [filterKey, setFilterKey] = useState('')         // clé de colonne à filtrer
  const [filterValue, setFilterValue] = useState('')     // valeur du filtre
  const [page, setPage] = useState(1)                    // page courante
  const pageSize = 15                                    // 15 lignes par page

  // ------- chargement liste -------
  const fetchList = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get(cfg.basePath)
      setItems(data || [])
      setPage(1) // reset pagination à chaque rechargement
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  // ------- chargement options <select> du formulaire -------
  const fetchOptions = async () => {
    const opts = {}
    await Promise.all((cfg.form || [])
      .filter(f => f.type === 'select' && f.optionsEndpoint)
      .map(async f => {
        const { data } = await api.get(f.optionsEndpoint)
        const mapper = f.mapOption || ((x) => ({ value: x.id, label: String(x.id) }))
        opts[f.name] = (data || []).map(mapper)
      }))
    setOptions(opts)
  }

  useEffect(() => { fetchList(); fetchOptions() }, [entityKey])

  // ------- ouverture modales -------
  const onOpenCreate = () => {
    setEditing(null)
    const initial = {}
    ;(cfg.form || []).forEach(f => {
      if (f.default) initial[f.name] = f.default
    })
    setForm(initial)
    setOpen(true)
    setExtraResult(null)
  }

  const onOpenEdit = (row) => {
    setEditing(row)
    const initial = {}
    ;(cfg.form || []).forEach(f => {
      if (f.type === 'select') {
        // devine la valeur id actuelle à partir des données (ex: professeurId -> professeur.id)
        const keyGuess = f.name.replace('Id', '') + '.id'
        const v = get(row, keyGuess, null)
        initial[f.name] = v
      } else if (f.name in row) {
        initial[f.name] = row[f.name]
      }
    })
    setForm(initial)
    setOpen(true)
    setExtraResult(null)
  }

  // ------- submit form (create / update) -------
  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setExtraResult(null)
    try {
      const isEdit = !!editing
      const payload = cfg.mapPayload ? cfg.mapPayload(form, isEdit) : form
      if (isEdit) {
        await api.put(`${cfg.basePath}/${editing[cfg.id]}`, payload)
      } else {
        await api.post(cfg.basePath, payload)
      }
      setOpen(false)
      await fetchList()
      setToast(isEdit ? 'Mise à jour réussie' : 'Créé avec succès')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  // ------- suppression -------
  const onDelete = async (row) => {
    if (!confirm('Supprimer cet élément ?')) return
    try {
      await api.delete(`${cfg.basePath}/${row[cfg.id]}`)
      await fetchList()
      setToast('Supprimé')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  // ------- actions "extra" facultatives -------
  const runExtra = async (action) => {
    try {
      const res = await action.run(api, form)
      setExtraResult(res)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  // ------- helpers filtre/recherche/pagination -------
  const norm = (v) => String(v ?? '').toLowerCase()

  // 1) recherche globale dans toutes les colonnes affichées
  const searched = useMemo(() => {
    if (!query) return items
    const q = norm(query)
    return items.filter(row =>
      (cfg.columns || []).some(col => norm(get(row, col.key, '')).includes(q))
    )
  }, [items, query, cfg.columns])

  // 2) filtre par colonne (simple "contient")
  const filtered = useMemo(() => {
    if (!filterKey || !filterValue) return searched
    const fv = norm(filterValue)
    return searched.filter(row => norm(get(row, filterKey, '')).includes(fv))
  }, [searched, filterKey, filterValue])

  // reset à la page 1 dès que la recherche/filtre change
  useEffect(() => { setPage(1) }, [query, filterKey, filterValue])

  // 3) pagination
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const pageItems = filtered.slice(start, end)

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages))

  return (
    <div className="space-y-4 bg-black bg-opacity-30 backdrop-blur-sm p-4 rounded-xl">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="title text-white">{cfg.label}</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={onOpenCreate}>+ Nouveau</button>
          <button className="btn" onClick={fetchList}>Rafraîchir</button>
        </div>
      </div>

      {toast && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

      {/* barre de recherche + filtre */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="label">Recherche</label>
            <input
              className="input"
              placeholder="Rechercher dans toutes les colonnes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="label">Filtrer par colonne</label>
            <select
              className="input"
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
            >
              <option value="">-- Aucune --</option>
              {(cfg.columns || []).map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="label">Valeur du filtre</label>
            <input
              className="input"
              placeholder="Contient…"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!filterKey}
            />
          </div>
        </div>
      </div>

      {/* table */}
      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              {(cfg.columns || []).map(col => <th key={col.key} className="py-2 px-3">{col.label}</th>)}
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={999} className="py-6 text-center text-gray-500">Chargement...</td></tr>
            ) : pageItems.length ? pageItems.map(row => (
              <tr key={row[cfg.id]} className="border-t">
                {(cfg.columns || []).map(col => (
                  <td key={col.key} className="py-2 px-3">{String(get(row, col.key, ''))}</td>
                ))}
                <td className="py-2 px-3 space-x-2">
                  <button className="btn" onClick={() => onOpenEdit(row)}>Modifier</button>
                  <button className="btn btn-danger" onClick={() => onDelete(row)}>Supprimer</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={999} className="py-6 text-center text-gray-500">Aucun élément</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-white/80">
          {total > 0
            ? <>Affichage <b>{start + 1}</b>–<b>{Math.min(end, total)}</b> sur <b>{total}</b></>
            : <>Aucun résultat</>
          }
        </div>
        <div className="flex items-center gap-1">
          <button className="btn" onClick={() => goToPage(1)} disabled={currentPage === 1}>{'<<'}</button>
          <button className="btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>

          {/* quelques numéros de page (fenêtre) */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1">…</span>}
                <button
                  className={`btn ${p === currentPage ? 'btn-primary' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              </React.Fragment>
            ))
          }

          <button className="btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</button>
          <button className="btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>{'>>'}</button>
        </div>
      </div>

      {/* modal CRUD */}
      <Modal
        className="top-11"
        open={open}
        title={editing ? `Modifier ${cfg.label.slice(0, -1)}` : `Créer ${cfg.label.slice(0, -1)}`}
        onClose={() => setOpen(false)}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          {(cfg.form || []).map((field) => {
            if (editing && field.hideOnEdit) return null
            return (
              <div key={field.name} className="flex flex-col">
                <label className="label">
                  {field.label}
                  {field.required && ' *'}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="input"
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  >
                    <option value="">-- choisir --</option>
                    {(options[field.name] || field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={field.type || 'text'}
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  />
                )}
              </div>
            )
          })}

          {/* actions */}
          <div className="col-span-full flex items-center gap-2">
            <button className="btn btn-primary" type="submit">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
            {Array.isArray(cfg.extraActions) &&
              cfg.extraActions.length > 0 &&
              cfg.extraActions.map((act, idx) => (
                <button key={idx} className="btn" type="button" onClick={() => runExtra(act)}>
                  {act.label}
                </button>
              ))}
          </div>

          {extraResult !== null && (
            <pre className="col-span-full mt-3 p-3 bg-gray-50 border rounded-xl overflow-auto text-xs">
              {JSON.stringify(extraResult, null, 2)}
            </pre>
          )}
        </form>
      </Modal>
    </div>
  )
}

// import { useEffect, useMemo, useState } from 'react'
// import entitiesConfig from '../config/entities'
// import api from '../services/api'
// import Modal from '../components/Modal'
// import { get } from '../services/utils'
// import React from "react";


// export default function CrudPage({ entityKey }) {
//   const cfg = entitiesConfig[entityKey]
//   const [items, setItems] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [open, setOpen] = useState(false)
//   const [editing, setEditing] = useState(null)
//   const [form, setForm] = useState({})
//   const [options, setOptions] = useState({})
//   const [toast, setToast] = useState(null)
//   const [extraResult, setExtraResult] = useState(null)

//   const fetchList = async () => {
//     setLoading(true); setError(null)
//     try {
//       const { data } = await api.get(cfg.basePath)
//       setItems(data)
//       console.log(data)
//     } catch (e) {
//       setError(e?.response?.data?.message || e.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchOptions = async () => {
//     const opts = {}
//     await Promise.all((cfg.form || []).filter(f=>f.type==='select' && f.optionsEndpoint).map(async f => {
//       const { data } = await api.get(f.optionsEndpoint)
//       opts[f.name] = (data || []).map(f.mapOption || ((x)=>({ value:x.id, label:String(x.id) })))
//     }))
//     setOptions(opts)
//   }

//   useEffect(() => { fetchList(); fetchOptions() }, [entityKey])

//   const onOpenCreate = () => {
//     setEditing(null)
//     const initial = {}
//     ;(cfg.form||[]).forEach(f => {
//       if (f.default) initial[f.name] = f.default
//     })
//     setForm(initial)
//     setOpen(true)
//     setExtraResult(null)
//   }

//   const onOpenEdit = (row) => {
//     setEditing(row)
//     const initial = {}
//     ;(cfg.form||[]).forEach(f => {
//       if (f.type === 'select') {
//         // try to infer current value
//         const keyGuess = f.name.replace('Id','') + ".id"
//         const v = get(row, keyGuess, null)
//         initial[f.name] = v
//       } else if (f.name in row) {
//         initial[f.name] = row[f.name]
//       }
//     })
//     setForm(initial)
//     setOpen(true)
//     setExtraResult(null)
//   }

//   const onSubmit = async (e) => {
//     e.preventDefault()
//     setError(null)
//     setExtraResult(null)
//     try {
//       const isEdit = !!editing
//       const payload = cfg.mapPayload ? cfg.mapPayload(form, isEdit) : form
//       if (isEdit) {
//         await api.put(`${cfg.basePath}/${editing[cfg.id]}`, payload)
//       } else {
//         await api.post(cfg.basePath, payload)
//       }
//       setOpen(false)
//       await fetchList()
//       setToast(isEdit ? "Mise à jour réussie" : "Créé avec succès")
//     } catch (e) {
//       setError(e?.response?.data?.message || e.message)
//     }
//   }

//   const onDelete = async (row) => {
//     if (!confirm("Supprimer cet élément ?")) return
//     try {
//       await api.delete(`${cfg.basePath}/${row[cfg.id]}`)
//       await fetchList()
//       setToast("Supprimé")
//     } catch (e) {
//       setError(e?.response?.data?.message || e.message)
//     }
//   }

//   const runExtra = async (action) => {
//     try {
//       const res = await action.run(api, form)
//       setExtraResult(res)
//     } catch (e) {
//       setError(e?.response?.data?.message || e.message)
//     }
//   }

//   return (
//     <div className="space-y-4 bg-black bg-opacity-30 backdrop-blur-sm p-4 rounded-xl">
//       <div className="flex items-center justify-between">
//         <h1 className="title text-white">{cfg.label}</h1>
//         <div className="flex items-center gap-2">
//           <button className="btn btn-primary" onClick={onOpenCreate}>+ Nouveau</button>
//           <button className="btn" onClick={fetchList}>Rafraîchir</button>
//         </div>
//       </div>

//       {toast && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{toast}</div>}
//       {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

//       <div className="card overflow-auto">
//         <table className="min-w-full text-sm">
//           <thead>
//             <tr className="text-left text-gray-600">
//               {cfg.columns.map(col => <th key={col.key} className="py-2 px-3">{col.label}</th>)}
//               <th className="py-2 px-3">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr><td colSpan={999} className="py-6 text-center text-gray-500">Chargement...</td></tr>
//             ) : items.length ? items.map(row => (
//               <tr key={row[cfg.id]} className="border-t">
//                 {cfg.columns.map(col => (
//                   <td key={col.key} className="py-2 px-3">{String(get(row, col.key, ''))}</td>
//                 ))}
//                 <td className="py-2 px-3 space-x-2">
//                   <button className="btn" onClick={() => onOpenEdit(row)}>Modifier</button>
//                   <button className="btn btn-danger" onClick={() => onDelete(row)}>Supprimer</button>
//                 </td>
//               </tr>
//             )) : (
//               <tr><td colSpan={999} className="py-6 text-center text-gray-500">Aucun élément</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <Modal open={open} title={editing ? `Modifier ${cfg.label.slice(0,-1)}` : `Créer ${cfg.label.slice(0,-1)}`} onClose={()=>setOpen(false)}>
//         <form className="space-y-3" onSubmit={onSubmit}>
//           {(cfg.form||[]).map(field => {
//             if (editing && field.hideOnEdit) return null
//             return (
//               <div key={field.name}>
//                 <label className="label">{field.label}{field.required && ' *'}</label>
//                 {field.type === 'select' ? (
//                   <select className="input" required={field.required} value={form[field.name] ?? ''} onChange={e=>setForm({...form,[field.name]:e.target.value})}>
//                     <option value="">-- choisir --</option>
//                     {(options[field.name]||field.options||[]).map(opt => (
//                       <option key={opt.value} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </select>
//                 ) : (
//                   <input className="input" type={field.type || 'text'} required={field.required} value={form[field.name] ?? ''} onChange={e=>setForm({...form,[field.name]:e.target.value})} />
//                 )}
//               </div>
//             )
//           })}
//           <div className="flex items-center gap-2">
//             <button className="btn btn-primary" type="submit">{editing ? 'Enregistrer' : 'Créer'}</button>
//             {Array.isArray(cfg.extraActions) && cfg.extraActions.length > 0 && cfg.extraActions.map((act, idx)=>(
//               <button key={idx} className="btn" type="button" onClick={()=>runExtra(act)}>{act.label}</button>
//             ))}
//           </div>
//           {extraResult !== null && (
//             <pre className="mt-3 p-3 bg-gray-50 border rounded-xl overflow-auto text-xs">{JSON.stringify(extraResult, null, 2)}</pre>
//           )}
//         </form>
//       </Modal>
//     </div>
//   )
// }