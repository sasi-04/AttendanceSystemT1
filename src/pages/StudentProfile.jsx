import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiPost } from '../components/api.js'

export default function StudentProfile() {
  const { user, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Create dynamic profile based on user data (past dates)
  const profile = {
    name: user?.name || 'Student Name',
    email: user?.email || `${user?.regNo}@student.college.edu`,
    regNo: user?.regNo || user?.studentId || 'N/A',
    course: 'Computer Science Engineering',
    year: '3rd Year',
    section: 'A',
    joinDate: '2022-08-15', // Past admission date
    phone: '+91 98765 43210',
    address: 'Student Hostel, College Campus',
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Full Name</div>
            <div className="font-medium text-lg">{profile.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Registration Number</div>
            <div className="font-medium text-lg">{profile.regNo}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email Address</div>
            <div className="font-medium">{profile.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone Number</div>
            <div className="font-medium">{profile.phone}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Course</div>
            <div className="font-medium">{profile.course}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Year & Section</div>
            <div className="font-medium">{profile.year} - Section {profile.section}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Join Date</div>
            <div className="font-medium">{new Date(profile.joinDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Address</div>
            <div className="font-medium">{profile.address}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Academic Year</div>
            <div className="font-medium">{profile.academicYear}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last Login</div>
            <div className="font-medium">{profile.lastLogin}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <form onSubmit={onChangePassword} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              type="password" 
              value={currentPassword} 
              onChange={(e)=>setCurrentPassword(e.target.value)} 
              placeholder="Enter current password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              placeholder="Enter new password (min 6 characters)"
              minLength="6"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
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
            className={`px-4 py-2 rounded-md text-white ${
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
          
          <div className="text-xs text-gray-500 mt-2">
            Password must be at least 6 characters long
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold mb-2">Session</h2>
        <button onClick={logout} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Log out</button>
      </div>
    </div>
  )
}


















