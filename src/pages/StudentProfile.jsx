import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiPost } from '../components/api.js'

export default function StudentProfile() {
  const { user, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [message, setMessage] = useState('')
  
  // Editable profile fields
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Student Name',
    email: user?.email || `${user?.regNo}@student.college.edu`,
    phone: '+91 98765 43210',
    address: 'Student Hostel, College Campus',
    course: 'Computer Science Engineering',
    year: '3rd Year',
    section: 'A'
  })

  // Static profile data (non-editable)
  const staticProfile = {
    regNo: user?.regNo || user?.studentId || 'N/A',
    joinDate: '2022-08-15', // Past admission date
    lastLogin: '2024-10-28 09:30 AM',
    academicYear: '2024-25'
  }

  const onChangePassword = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!currentPassword || !password || !confirmPassword) {
      alert('Please fill in all password fields')
      return
    }
    
    if (password !== confirmPassword) {
      alert('New password and confirm password do not match')
      return
    }
    
    if (password.length < 6) {
      alert('New password must be at least 6 characters long')
      return
    }
    
    try {
      setIsUpdating(true)
      
      const requestData = {
        studentId: user?.regNo || user?.studentId,
        currentPassword: currentPassword,
        newPassword: password
      }
      
      console.log('Sending password change request:', {
        studentId: requestData.studentId,
        currentPasswordLength: requestData.currentPassword?.length,
        newPasswordLength: requestData.newPassword?.length
      })
      
      // Call API to update password
      const response = await apiPost('/auth/student/change-password', requestData)
      console.log('Password change response:', response)
      
      alert('Password updated successfully!')
      
      // Clear form
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
      
    } catch (error) {
      console.error('Password update failed:', error)
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      })
      
      if (error.code === 'current_password_incorrect') {
        alert('Current password is incorrect')
      } else if (error.code === 'student_not_found') {
        alert('Student account not found')
      } else if (error.code === 'password_too_short') {
        alert('New password must be at least 6 characters long')
      } else if (error.code === 'missing_required_fields') {
        alert('Please fill in all required fields')
      } else {
        alert(`Failed to update password: ${error.message || 'Please try again.'}`)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleProfileEdit = () => {
    setIsEditing(true)
    setMessage('')
  }

  const handleProfileCancel = () => {
    setIsEditing(false)
    // Reset to original values
    setProfileData({
      name: user?.name || 'Student Name',
      email: user?.email || `${user?.regNo}@student.college.edu`,
      phone: '+91 98765 43210',
      address: 'Student Hostel, College Campus',
      course: 'Computer Science Engineering',
      year: '3rd Year',
      section: 'A'
    })
    setMessage('')
  }

  const handleProfileSave = async () => {
    try {
      setIsSavingProfile(true)
      setMessage('')
      
      // Simulate API call to update student profile
      const requestData = {
        studentId: user?.regNo || user?.studentId,
        ...profileData
      }
      
      console.log('Updating student profile:', requestData)
      
      // Call API to update profile (you may need to implement this endpoint)
      await apiPost('/auth/student/update-profile', requestData)
      
      setMessage('Profile updated successfully!')
      setIsEditing(false)
      
    } catch (error) {
      console.error('Profile update failed:', error)
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          {!isEditing ? (
            <button
              onClick={handleProfileEdit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSavingProfile ? '💾 Saving...' : '💾 Save'}
              </button>
              <button
                onClick={handleProfileCancel}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editable Fields */}
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Full Name</div>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="font-medium text-lg text-gray-900 dark:text-white">{profileData.name}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Email Address</div>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">{profileData.email}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Phone Number</div>
            {isEditing ? (
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">{profileData.phone}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Course</div>
            {isEditing ? (
              <select
                value={profileData.course}
                onChange={(e) => handleInputChange('course', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Computer Science Engineering">Computer Science Engineering</option>
                <option value="Electronics Engineering">Electronics Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">{profileData.course}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Year</div>
            {isEditing ? (
              <select
                value={profileData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">{profileData.year}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Section</div>
            {isEditing ? (
              <select
                value={profileData.section}
                onChange={(e) => handleInputChange('section', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">Section {profileData.section}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">Address</div>
            {isEditing ? (
              <textarea
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows="3"
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="font-medium text-gray-900 dark:text-white">{profileData.address}</div>
            )}
          </div>

          {/* Static Fields (Non-editable) */}
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Registration Number</div>
            <div className="font-medium text-lg text-gray-900 dark:text-white">{staticProfile.regNo}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Join Date</div>
            <div className="font-medium text-gray-900 dark:text-white">{new Date(staticProfile.joinDate).toLocaleDateString()}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Academic Year</div>
            <div className="font-medium text-gray-900 dark:text-white">{staticProfile.academicYear}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Last Login</div>
            <div className="font-medium text-gray-900 dark:text-white">{staticProfile.lastLogin}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Change Password</h2>
        <form onSubmit={onChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              type="password" 
              value={currentPassword} 
              onChange={(e)=>setCurrentPassword(e.target.value)} 
              placeholder="Enter current password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="Enter new password (min 6 characters)"
              minLength="6"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              type="password" 
              value={confirmPassword} 
              onChange={(e)=>setConfirmPassword(e.target.value)} 
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isUpdating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isUpdating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              'Update Password'
            )}
          </button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Password must be at least 6 characters long
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-2 text-gray-900 dark:text-white">Session</h2>
        <button onClick={logout} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors">Log out</button>
      </div>
    </div>
  )
}


















