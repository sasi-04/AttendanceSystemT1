import React, { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiGet, apiPost } from '../components/api.js'

export default function StudentLeaveManagement() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    attachments: []
  })

  useEffect(() => {
    const fetchLeaveApplications = async () => {
      if (!user?.regNo && !user?.studentId) return
      
      try {
        setLoading(true)
        // Simulate API call - replace with actual endpoint
        const studentId = user.regNo || user.studentId
        
        // Mock data based on current user (past dates)
        const leaveApplications = [
          { 
            id: 1, 
            studentId: studentId,
            name: user.name || 'You', 
            duration: '2024-10-15 to 2024-10-16', 
            reason: 'Medical', 
            status: 'Approved', 
            submitted: '2024-10-10',
            description: 'Doctor appointment and recovery',
            attachments: ['medical_certificate.pdf']
          },
          { 
            id: 2, 
            studentId: studentId,
            name: user.name || 'You', 
            duration: '2024-09-25', 
            reason: 'Family', 
            status: 'Approved', 
            submitted: '2024-09-20',
            description: 'Family emergency',
            attachments: []
          },
          { 
            id: 3, 
            studentId: studentId,
            name: user.name || 'You', 
            duration: '2024-08-12 to 2024-08-14', 
            reason: 'Travel', 
            status: 'Rejected', 
            submitted: '2024-08-05',
            description: 'Personal travel',
            attachments: ['travel_documents.pdf']
          },
          { 
            id: 4, 
            studentId: studentId,
            name: user.name || 'You', 
            duration: '2024-07-28', 
            reason: 'Personal', 
            status: 'Approved', 
            submitted: '2024-07-25',
            description: 'Personal work',
            attachments: []
          },
        ]
        
        setLeaves(leaveApplications)
      } catch (error) {
        console.error('Failed to fetch leave applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaveApplications()
  }, [user])

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const q = query.toLowerCase()
      const matchesQuery = l.reason.toLowerCase().includes(q) || l.duration.toLowerCase().includes(q)
      const matchesStatus = status === 'All' || l.status === status
      return matchesQuery && matchesStatus
    })
  }, [leaves, query, status])

  const stats = {
    Pending: leaves.filter(l=>l.status==='Pending').length,
    Approved: leaves.filter(l=>l.status==='Approved').length,
    Rejected: leaves.filter(l=>l.status==='Rejected').length,
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const validExtensions = ['.pdf', '.doc', '.docx']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return validTypes.includes(file.type) || validExtensions.includes(fileExtension)
    })
    
    if (validFiles.length !== files.length) {
      alert('Please upload only PDF or DOC/DOCX files')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill in all required fields')
      return
    }

    // Create FormData for file upload
    const submitData = new FormData()
    submitData.append('studentId', user?.regNo || user?.studentId)
    submitData.append('startDate', formData.startDate)
    submitData.append('endDate', formData.endDate)
    submitData.append('reason', formData.reason)
    submitData.append('description', formData.description)
    
    formData.attachments.forEach((file, index) => {
      submitData.append(`attachment_${index}`, file)
    })

    try {
      // Create new leave application
      const newLeave = {
        id: Date.now(),
        studentId: user?.regNo || user?.studentId,
        name: user?.name || 'You',
        duration: formData.startDate === formData.endDate 
          ? formData.startDate 
          : `${formData.startDate} to ${formData.endDate}`,
        reason: formData.reason,
        status: 'Pending',
        submitted: new Date().toISOString().split('T')[0], // This will be current date when user submits
        description: formData.description,
        attachments: formData.attachments.map(f => f.name)
      }

      // Add to local state (in real app, this would be an API call)
      setLeaves(prev => [newLeave, ...prev])
      
      console.log('Submitting leave application:', {
        ...formData,
        studentId: user?.regNo,
        files: formData.attachments.map(f => f.name)
      })
      
      alert('Leave application submitted successfully!')
      setShowForm(false)
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        description: '',
        attachments: []
      })
    } catch (error) {
      alert('Failed to submit leave application')
    }
  }

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave)
    setShowViewModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([k,v]) => (
          <div key={k} className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-2xl font-semibold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="font-semibold text-lg">Leave Applications</div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Search by reason or duration"
              className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 w-64"
            />
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50">
              {['All','Pending','Approved','Rejected'].map(s=> <option key={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              + Apply for Leave
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                      Loading leave applications...
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length > 0 ? (
                filteredLeaves.map(l => (
                  <tr key={l.id}>
                    <td className="py-2 pr-4">{l.name}</td>
                    <td className="py-2 pr-4">{l.duration}</td>
                    <td className="py-2 pr-4">{l.reason}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${l.status==='Pending'?'bg-yellow-50 text-yellow-700': l.status==='Approved'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{l.status}</span>
                    </td>
                    <td className="py-2 pr-4">{l.submitted}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleViewLeave(l)}
                          className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
                        >
                          View
                        </button>
                        {l.attachments && l.attachments.length > 0 && (
                          <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs">
                            📎 {l.attachments.length}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No leave applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Apply for Leave</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({...prev, startDate: e.target.value}))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))}
                    required
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({...prev, reason: e.target.value}))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Medical">Medical</option>
                  <option value="Family">Family Emergency</option>
                  <option value="Personal">Personal</option>
                  <option value="Travel">Travel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  placeholder="Please provide additional details about your leave request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supporting Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Click to upload PDF or DOC files
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Medical certificates, travel documents, etc.
                    </span>
                  </label>
                </div>

                {/* Display uploaded files */}
                {formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium text-gray-700">Uploaded Files:</div>
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Leave Application Modal */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Leave Application Details</h2>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Application Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Application Status</h3>
                    <p className="text-sm text-gray-600">Submitted on {selectedLeave.submitted}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedLeave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedLeave.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedLeave.duration}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedLeave.reason}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted Date
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedLeave.submitted}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedLeave.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {selectedLeave.description}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedLeave.attachments && selectedLeave.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Attachments ({selectedLeave.attachments.length})
                  </label>
                  <div className="space-y-2">
                    {selectedLeave.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{attachment}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


















