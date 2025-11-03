import React from 'react'
import DarkModeToggle from './DarkModeToggle.jsx'

export default function Topbar({ name = '', role = '', right = null }) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome{ name ? `, ${name}` : ''}</h1>
        {role ? <p className="text-sm text-gray-500 dark:text-gray-400">Role: {role}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <DarkModeToggle />
        {right}
      </div>
    </header>
  )
}


















