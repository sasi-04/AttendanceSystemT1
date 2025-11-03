import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminApi } from '../../components/api.js'

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    head: ''
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminApi.getDepartments()
      setDepartments(response.departments || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
      setError('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    try {
      if (!newDepartment.name || !newDepartment.code) {
        setMessage('Department name and code are required')
        return
      }

      setLoading(true)
      setMessage('')

      await adminApi.addDepartment(newDepartment)
      
      setMessage('Department added successfully!')
      setIsAdding(false)
      setNewDepartment({ name: '', code: '', description: '', head: '' })
      await loadDepartments() // Reload departments
      
    } catch (err) {
      console.error('Failed to add department:', err)
      if (err.code === 'department_code_exists') {
        setMessage('Department code already exists')
      } else {
        setMessage('Failed to add department')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditDepartment = async (id, updatedData) => {
    try {
      setLoading(true)
      setMessage('')

      await adminApi.updateDepartment(id, updatedData)
      
      setMessage('Department updated successfully!')
      setIsEditing(null)
      await loadDepartments() // Reload departments
      
    } catch (err) {
      console.error('Failed to update department:', err)
      if (err.code === 'department_code_exists') {
        setMessage('Department code already exists')
      } else {
        setMessage('Failed to update department')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      setLoading(true)
      setMessage('')

      await adminApi.deleteDepartment(id)
      
      setMessage('Department deleted successfully!')
      await loadDepartments() // Reload departments
      
    } catch (err) {
      console.error('Failed to delete department:', err)
      setMessage('Failed to delete department')
    } finally {
      setLoading(false)
    }
  }

  if (loading && departments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading departments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage academic departments</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Add Department
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Add Department Form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Computer Science Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                value={newDepartment.code}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CSE"
                maxLength="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department Head
              </label>
              <input
                type="text"
                value={newDepartment.head}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, head: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Dr. John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddDepartment}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '💾 Adding...' : '💾 Add Department'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewDepartment({ name: '', code: '', description: '', head: '' })
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Departments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full mt-1">
                  {dept.code}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(dept.id)}
                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                  title="Edit Department"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteDepartment(dept.id)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  title="Delete Department"
                >
                  🗑️
                </button>
              </div>
            </div>

            {isEditing === dept.id ? (
              <EditDepartmentForm
                department={dept}
                onSave={(updatedData) => handleEditDepartment(dept.id, updatedData)}
                onCancel={() => setIsEditing(null)}
              />
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {dept.description || 'No description available'}
                </div>
                
                {dept.head && (
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Head: </span>
                    <span className="text-gray-900 dark:text-white font-medium">{dept.head}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dept.studentCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dept.staffCount}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Staff</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                  Created: {new Date(dept.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {departments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏫</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Departments Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first department</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Add Department
          </button>
        </div>
      )}
    </div>
  )
}

// Edit Department Form Component
function EditDepartmentForm({ department, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: department.name,
    code: department.code,
    description: department.description || '',
    head: department.head || ''
  })

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert('Department name and code are required')
      return
    }
    onSave(formData)
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Department Name"
      />
      <input
        type="text"
        value={formData.code}
        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Department Code"
        maxLength="10"
      />
      <input
        type="text"
        value={formData.head}
        onChange={(e) => setFormData(prev => ({ ...prev, head: e.target.value }))}
        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Department Head"
      />
      <input
        type="text"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Description"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          💾 Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  )
}
