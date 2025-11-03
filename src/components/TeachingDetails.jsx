import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function TeachingDetails({ profile, onUpdate }){
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    qualifications: profile?.qualifications || [],
    teachingSubjects: profile?.teachingSubjects || [],
    technicalSkills: profile?.technicalSkills || [],
    researchAreas: profile?.researchAreas || []
  })
  const [newItem, setNewItem] = useState({ type: '', value: '' })

  if (!profile) return null

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({
      qualifications: profile?.qualifications || [],
      teachingSubjects: profile?.teachingSubjects || [],
      technicalSkills: profile?.technicalSkills || [],
      researchAreas: profile?.researchAreas || []
    })
  }

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(editData)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNewItem({ type: '', value: '' })
  }

  const addItem = (type) => {
    if (newItem.value.trim()) {
      setEditData(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), newItem.value.trim()]
      }))
      setNewItem({ type: '', value: '' })
    }
  }

  const removeItem = (type, index) => {
    setEditData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const details = [
    { 
      icon: '🎓', 
      title: 'Academic Qualifications', 
      key: 'qualifications',
      items: isEditing ? editData.qualifications : (profile.qualifications || ['Not specified'])
    },
    { 
      icon: '📚', 
      title: 'Teaching Subjects', 
      key: 'teachingSubjects',
      items: isEditing ? editData.teachingSubjects : (profile.teachingSubjects || ['Not specified'])
    },
    { 
      icon: '💻', 
      title: 'Technical Skills', 
      key: 'technicalSkills',
      items: isEditing ? editData.technicalSkills : (profile.technicalSkills || ['Not specified'])
    },
    { 
      icon: '🔬', 
      title: 'Research Areas', 
      key: 'researchAreas',
      items: isEditing ? editData.researchAreas : (profile.researchAreas || ['Not specified'])
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Technical & Teaching Details</h2>
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✏️ Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              💾 Save
            </button>
            <button 
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((d) => (
          <div key={d.title} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{d.icon}</span>
              <div className="font-medium text-gray-800 dark:text-gray-200">{d.title}</div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <ul className="space-y-1">
                  {d.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      <button 
                        onClick={() => removeItem(d.key, index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={`Add ${d.title.toLowerCase()}`}
                    value={newItem.type === d.key ? newItem.value : ''}
                    onChange={(e) => setNewItem({ type: d.key, value: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addItem(d.key)}
                  />
                  <button 
                    onClick={() => addItem(d.key)}
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    ➕
                  </button>
                </div>
              </div>
            ) : (
              <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
                {d.items.map((i, index) => <li key={index}>{i}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

















