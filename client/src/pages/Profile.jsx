import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fingerprintAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Shield, User, Fingerprint, Upload, Trash2, 
  CheckCircle, AlertTriangle, Image, Loader2,
  Key, Lock, Mail, Phone, Building2, Eye
} from 'lucide-react'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'
  
  const [fingerprints, setFingerprints] = useState([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (activeTab === 'fingerprint') {
      fetchFingerprints()
    }
  }, [activeTab])

  const handleFingerprintUpload = async () => {
    if (!file) {
      toast.error('Please select an image to upload')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      await fingerprintAPI.upload(formData)
      toast.success('Face fingerprint registered successfully!')
      setFile(null)
      fetchFingerprints()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload')
    } finally {
      setLoading(false)
    }
  }

  const fetchFingerprints = async () => {
    try {
      const response = await fingerprintAPI.getAll()
      setFingerprints(response.data.fingerprints || [])
    } catch (error) {
      console.error('Failed to fetch fingerprints')
    }
  }

  const handleDeleteFingerprint = async (id) => {
    try {
      const response = await fingerprintAPI.delete(id)
      console.log('Delete response:', response)
      toast.success('Fingerprint removed')
      fetchFingerprints()
    } catch (error) {
      console.error('Delete error:', error)
      console.error('Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to remove fingerprint')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-6 shadow-sm">
        <Link to="/" className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600">Kavach</span>
          </div>
        </Link>
        
        <nav className="space-y-2">
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Eye className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/profile?tab=profile" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'profile' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600'
          }`}>
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </Link>
          <Link to="/profile?tab=fingerprint" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'fingerprint' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600'
          }`}>
            <Fingerprint className="w-5 h-5" />
            <span className="font-medium">Kavach</span>
          </Link>
          <Link to="/profile?tab=security" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            activeTab === 'security' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600'
          }`}>
            <Lock className="w-5 h-5" />
            <span className="font-medium">Security</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        {activeTab === 'profile' && (
          <>
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
                <User className="w-10 h-10 text-purple-600" />
                <span>My Profile</span>
              </h1>
              <p className="text-gray-500 text-lg">Manage your account information</p>
            </header>

            <div className="max-w-2xl">
              <div className="rounded-2xl p-8 mb-8 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                    <span className="text-4xl font-bold text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-600 border border-sky-200">
                      {user?.role === 'admin' ? 'Administrator' : 'Student'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
                    <Mail className="w-5 h-5 text-sky-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{user?.email}</p>
                    </div>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center space-x-4 p-4 rounded-xl bg-cyan-50 border border-cyan-100">
                      <Phone className="w-5 h-5 text-cyan-600" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  {user?.college && (
                    <div className="flex items-center space-x-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-gray-500">College</p>
                        <p className="text-gray-900 font-medium">{user.college}</p>
                      </div>
                    </div>
                  )}
                  {user?.studentId && (
                    <div className="flex items-center space-x-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <Key className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-500">Student ID</p>
                        <p className="font-mono text-gray-900 font-medium">{user.studentId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'fingerprint' && (
          <>
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
                <Fingerprint className="w-10 h-10 text-sky-600" />
                <span>Digital Fingerprint</span>
              </h1>
              <p className="text-gray-500 text-lg">Protect your identity with face recognition & image hashing</p>
            </header>

            <div className="max-w-3xl">
              {/* Info Card */}
              <div className="relative rounded-2xl p-6 mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-cyan-500 to-sky-600 opacity-10"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-400/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-400/30 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/25">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900">Proactive Protection</h3>
                      <p className="text-gray-600 text-sm">
                        Register your original photos to create a unique digital fingerprint. Our system uses 
                        perceptual hashing (pHash) and face landmark detection to identify your images even 
                        if they've been modified or cropped. Helps detect unauthorized use of your photos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="relative rounded-2xl p-8 mb-8 overflow-hidden bg-white border border-gray-200 shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-500"></div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900 flex items-center space-x-3">
                  <Image className="w-5 h-5 text-sky-600" />
                  <span>Register Your Photo</span>
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-sky-400 transition-all bg-gray-50 group">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-sky-100 to-cyan-100 group-hover:from-sky-200 group-hover:to-cyan-200 transition-all">
                          <Image className="w-10 h-10 text-sky-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="p-3 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl"></div>
                        <Upload className="w-14 h-14 mx-auto text-gray-400 relative z-10" />
                      </div>
                      <p className="text-gray-600 mb-4">
                        Drag & drop or click to select
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                        id="fingerprint-upload"
                      />
                      <label
                        htmlFor="fingerprint-upload"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-500 text-white rounded-xl cursor-pointer hover:opacity-90 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
                      >
                        Select Image
                      </label>
                    </>
                  )}
                </div>
                <button
                  onClick={handleFingerprintUpload}
                  disabled={!file || loading}
                  className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all font-medium shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5 mr-2" />
                      <span>Register Digital Fingerprint</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fingerprints List */}
              <div className="relative rounded-2xl p-8 bg-white border border-gray-200 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-500"></div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900 flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-sky-600" />
                  <span>Protected Photos ({fingerprints.length})</span>
                </h3>
                {fingerprints.length > 0 ? (
                  <div className="space-y-3">
                    {fingerprints.map((fp) => (
                      <div
                        key={fp._id}
                        className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md group-hover:shadow-lg group-hover:shadow-sky-500/20">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{fp.originalFileName}</p>
                            <p className="text-sm text-gray-500">
                              Registered: {new Date(fp.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFingerprint(fp._id)}
                          className="p-3 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-3xl"></div>
                      <div className="w-20 h-20 relative bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
                        <Fingerprint className="w-10 h-10 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xl text-gray-600 mb-2">No photos registered yet</p>
                    <p className="text-gray-500">Register your original photos for proactive protection</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
                <Lock className="w-10 h-10 text-sky-600" />
                <span>Security</span>
              </h1>
              <p className="text-gray-500 text-lg">Manage your account security settings</p>
            </header>

            <div className="max-w-2xl">
              <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Security Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-sky-50 border border-sky-100 hover:border-sky-300 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20">
                        <Lock className="w-6 h-6 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Change Password</p>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-sky-300 text-sky-600 rounded-lg hover:bg-sky-100 transition-all font-medium">
                      Update
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-xl bg-cyan-50 border border-cyan-100 hover:border-cyan-300 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Key className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-cyan-300 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-all font-medium">
                      Enable
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <Shield className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Active Sessions</p>
                        <p className="text-sm text-gray-500">Manage your logged in devices</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all font-medium">
                      View
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-8 mt-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Profile