
import { useEffect, useMemo, useState } from 'react'
import entitiesConfig from '../config/entities'
import api from '../services/api'
import Modal from '../components/Modal'
import { get } from '../services/utils'
import React from "react";


export default function CrudPage({ entityKey }) {
  const cfg = entitiesConfig[entityKey]
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [options, setOptions] = useState({})
  const [toast, setToast] = useState(null)
  const [extraResult, setExtraResult] = useState(null)

  const fetchList = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get(cfg.basePath)
      setItems(data)
      console.log(data)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    const opts = {}
    await Promise.all((cfg.form || []).filter(f=>f.type==='select' && f.optionsEndpoint).map(async f => {
      const { data } = await api.get(f.optionsEndpoint)
      opts[f.name] = (data || []).map(f.mapOption || ((x)=>({ value:x.id, label:String(x.id) })))
    }))
    setOptions(opts)
  }

  useEffect(() => { fetchList(); fetchOptions() }, [entityKey])

  const onOpenCreate = () => {
    setEditing(null)
    const initial = {}
    ;(cfg.form||[]).forEach(f => {
      if (f.default) initial[f.name] = f.default
    })
    setForm(initial)
    setOpen(true)
    setExtraResult(null)
  }

  const onOpenEdit = (row) => {
    setEditing(row)
    const initial = {}
    ;(cfg.form||[]).forEach(f => {
      if (f.type === 'select') {
        // try to infer current value
        const keyGuess = f.name.replace('Id','') + ".id"
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
      setToast(isEdit ? "Mise à jour réussie" : "Créé avec succès")
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  const onDelete = async (row) => {
    if (!confirm("Supprimer cet élément ?")) return
    try {
      await api.delete(`${cfg.basePath}/${row[cfg.id]}`)
      await fetchList()
      setToast("Supprimé")
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  const runExtra = async (action) => {
    try {
      const res = await action.run(api, form)
      setExtraResult(res)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  return (
    <div className="space-y-4 bg-white p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <h1 className="title">{cfg.label}</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={onOpenCreate}>+ Nouveau</button>
          <button className="btn" onClick={fetchList}>Rafraîchir</button>
        </div>
      </div>

      {toast && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              {cfg.columns.map(col => <th key={col.key} className="py-2 px-3">{col.label}</th>)}
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={999} className="py-6 text-center text-gray-500">Chargement...</td></tr>
            ) : items.length ? items.map(row => (
              <tr key={row[cfg.id]} className="border-t">
                {cfg.columns.map(col => (
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

      <Modal open={open} title={editing ? `Modifier ${cfg.label.slice(0,-1)}` : `Créer ${cfg.label.slice(0,-1)}`} onClose={()=>setOpen(false)}>
        <form className="space-y-3" onSubmit={onSubmit}>
          {(cfg.form||[]).map(field => {
            if (editing && field.hideOnEdit) return null
            return (
              <div key={field.name}>
                <label className="label">{field.label}{field.required && ' *'}</label>
                {field.type === 'select' ? (
                  <select className="input" required={field.required} value={form[field.name] ?? ''} onChange={e=>setForm({...form,[field.name]:e.target.value})}>
                    <option value="">-- choisir --</option>
                    {(options[field.name]||field.options||[]).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" type={field.type || 'text'} required={field.required} value={form[field.name] ?? ''} onChange={e=>setForm({...form,[field.name]:e.target.value})} />
                )}
              </div>
            )
          })}
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" type="submit">{editing ? 'Enregistrer' : 'Créer'}</button>
            {Array.isArray(cfg.extraActions) && cfg.extraActions.length > 0 && cfg.extraActions.map((act, idx)=>(
              <button key={idx} className="btn" type="button" onClick={()=>runExtra(act)}>{act.label}</button>
            ))}
          </div>
          {extraResult !== null && (
            <pre className="mt-3 p-3 bg-gray-50 border rounded-xl overflow-auto text-xs">{JSON.stringify(extraResult, null, 2)}</pre>
          )}
        </form>
      </Modal>
    </div>
  )
}
