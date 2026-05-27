import React from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const adminToken = localStorage.getItem('adminToken')
  
  if (!adminToken) {
    return <Navigate to="/admin/login" />
  }
  
  return <>{children}</>
}