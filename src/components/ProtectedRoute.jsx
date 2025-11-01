import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ allow = [] }) {
  const { user, isLoading } = useAuth()
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (!user) return <Navigate to="/login" replace />
  if (allow.length > 0 && !allow.includes(user.role)) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}


















