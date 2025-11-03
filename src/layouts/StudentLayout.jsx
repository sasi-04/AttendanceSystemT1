import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import DarkModeToggle from '../components/DarkModeToggle.jsx'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xl font-bold text-gray-900 dark:text-white">Attendance</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Student Portal</div>
          </div>
          <nav className="p-4 space-y-1">
            <NavLink to="/student/dashboard" className={({isActive})=>`block px-4 py-2 rounded-lg transition-colors ${isActive? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium':'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Dashboard</NavLink>
            <NavLink to="/student/attendance" className={({isActive})=>`block px-4 py-2 rounded-lg transition-colors ${isActive? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium':'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Attendance Marker</NavLink>
            <NavLink to="/student/leave" className={({isActive})=>`block px-4 py-2 rounded-lg transition-colors ${isActive? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium':'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Leave Management</NavLink>
            <NavLink to="/student/profile" className={({isActive})=>`block px-4 py-2 rounded-lg transition-colors ${isActive? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium':'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Profile</NavLink>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role: Student</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</div>
              <DarkModeToggle />
              <button onClick={logout} className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-sm transition-colors">Logout</button>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


















