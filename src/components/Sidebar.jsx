import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ items = [], title = 'Attendance', subtitle = '' }) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xl font-bold text-gray-900 dark:text-white">{title}</div>
        {subtitle ? <div className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
      </div>
      <nav className="p-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}


















