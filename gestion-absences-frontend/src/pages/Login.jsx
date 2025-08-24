
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import React from "react";


export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await login(form.login, form.password)
      navigate('/')
    } catch (e) {
      setError(e?.response?.data?.message || 'Échec de connexion')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="title mb-4">Connexion</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl mb-3">{error}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="label">Login</label>
          <input className="input" value={form.login} onChange={e=>setForm({...form,login:e.target.value})} />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        </div>
        <button className="btn btn-primary w-full">Se connecter</button>
      </form>
    </div>
  )
}
