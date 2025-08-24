
import React from "react";

import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = async (login, password) => {
    const { data } = await api.post('/api/auth/login', { login, password })
    setToken(data.token)
    setUser({ role: data.role, email: data.email, userId: data.userId, nomComplet: data.nomComplet })
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
