import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { analysisAPI } from '../services/api'
import toast from 'react-hot-toast'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { 
  Shield, Upload, FileText, CheckCircle, 
  AlertTriangle, Search, Fingerprint, Heart, Phone,
  ChevronRight, Activity, TrendingUp, Users, Trash2,
  Sparkles, Bot, Image as ImageIcon
} from 'lucide-react'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    suspiciousDetected: 0,
    casesReported: 0,
    protectedImages: 0,
  })
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, analysisId: null })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [historyRes] = await Promise.all([
        analysisAPI.getHistory(),
      ])
      const analyses = historyRes.data.analyses || []
      
      const suspiciousDetected = analyses.filter(a => 
        a.result?.isDeepfake === true || 
        a.result?.aiDetection?.isDeepfake === true ||
        a.result?.aiAnalysis?.isDeepfake === true
      ).length
      
      setRecentAnalyses(analyses.slice(0, 5))
      setStats({
        totalAnalyses: analyses.length,
        suspiciousDetected,
        casesReported: analyses.filter(a => a.caseId).length,
        protectedImages: 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload & Analyze',
      description: 'Upload image or video for deepfake detection',
      link: '/upload',
      gradient: 'from-sky-500 to-cyan-500',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
    {
      icon: Search,
      title: 'Scan URL',
      description: 'Scan a public URL for potential misuse',
      link: '/upload?mode=url',
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    {
      icon: Fingerprint,
      title: 'Digital Fingerprint',
      description: 'Protect your original images',
      link: '/profile?tab=fingerprint',
      gradient: 'from-sky-500 to-cyan-500',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
  ]

  const getAuthenticityColor = (score) => {
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  const getAuthenticityBg = (score) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const handleDeleteClick = (e, analysisId) => {
    e.stopPropagation()
    setDeleteModal({ isOpen: true, analysisId })
  }

  const handleConfirmDelete = async () => {
    try {
      await analysisAPI.delete(deleteModal.analysisId)
      setRecentAnalyses(recentAnalyses.filter(a => a._id !== deleteModal.analysisId))
      setStats(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses - 1,
      }))
      toast.success('Analysis deleted successfully')
    } catch (error) {
      toast.error('Failed to delete analysis')
    } finally {
      setDeleteModal({ isOpen: false, analysisId: null })
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
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl shadow-md">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/upload" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Upload className="w-5 h-5" />
            <span>Analyze Media</span>
          </Link>
          <Link to="/cases" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <FileText className="w-5 h-5" />
            <span>My Cases</span>
          </Link>
          <Link to="/support" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Heart className="w-5 h-5" />
            <span>Support</span>
          </Link>
          <Link to="/safety" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Users className="w-5 h-5" />
            <span>Safety Hub</span>
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="rounded-xl p-4 mb-4 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 text-gray-500 hover:text-gray-900 transition-colors text-left px-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-lg">Here's an overview of your protection status</p>
        </header>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-sky-100">
                <FileText className="w-6 h-6 text-sky-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-4xl font-bold mb-1 text-gray-900">{stats.totalAnalyses}</div>
            <div className="text-gray-500 text-sm">Total Analyses</div>
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-1 text-red-600">{stats.suspiciousDetected}</div>
            <div className="text-gray-600 text-sm">Deepfakes Detected</div>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-1 text-gray-900">{stats.casesReported}</div>
            <div className="text-gray-500 text-sm">Cases Reported</div>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-1 text-gray-900">{stats.protectedImages}</div>
            <div className="text-gray-500 text-sm">Protected Images</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-sky-500" />
            <span>Quick Actions</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="rounded-2xl p-6 hover:scale-[1.02] transition-all bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-sky-300 group"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${action.gradient} mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-sky-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-500 text-sm">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Emergency Support */}
        <div className="rounded-2xl p-6 mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 flex items-center space-x-3">
                <Phone className="w-5 h-5 text-red-500 animate-pulse" />
                <span>Need Immediate Help?</span>
              </h3>
              <p className="text-gray-600 text-sm">Access emergency contacts and support resources</p>
            </div>
            <Link to="/support" className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:opacity-90 flex items-center space-x-2 transition-all shadow-md hover:shadow-lg">
              <Phone className="w-5 h-5" />
              <span>Get Help</span>
            </Link>
          </div>
        </div>

        {/* Recent Analyses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-3">
              <Bot className="w-6 h-6 text-cyan-600" />
              <span>Recent Analyses</span>
            </h2>
            <Link to="/cases" className="text-sky-600 hover:text-sky-700 flex items-center space-x-1 font-medium transition-colors">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="rounded-2xl p-12 text-center bg-white border border-gray-200 shadow-sm">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-sky-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500">Loading analyses...</p>
            </div>
          ) : recentAnalyses.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => {
                const authenticityScore = analysis.result?.aiAnalysis?.authenticityScore 
                  || analysis.result?.aiDetection?.authenticityScore 
                  || analysis.result?.authenticityScore 
                  || 0
                const isDeepfake = analysis.result?.aiAnalysis?.isDeepfake 
                  || analysis.result?.isDeepfake 
                  || analysis.result?.aiDetection?.isDeepfake 
                  || false
                
                return (
                  <div
                    key={analysis._id}
                    className="rounded-xl p-5 flex items-center justify-between hover:bg-sky-50 transition-all cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-sky-200"
                    onClick={() => navigate(`/analysis/${analysis._id}`)}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`p-4 rounded-xl ${
                        isDeepfake 
                          ? 'bg-gradient-to-br from-red-100 to-orange-100 border border-red-200' 
                          : 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200'
                      }`}>
                        {isDeepfake ? (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="font-semibold text-gray-900">{analysis.fileName}</p>
                          {isDeepfake && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-orange-100 text-red-600 border border-red-200">
                              AI Generated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {analysis.caseId?.slice(0, 20) || 'No Case ID'}
                          </span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="text-sm text-gray-400">
                            {new Date(analysis.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                            <circle 
                              cx="32" cy="32" r="28" 
                              fill="none" 
                              stroke={authenticityScore >= 70 ? '#10b981' : authenticityScore >= 40 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="4" 
                              strokeLinecap="round"
                              strokeDasharray={`${(authenticityScore / 100) * 176} 176`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold" style={{ color: authenticityScore >= 70 ? '#10b981' : authenticityScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                              {Math.round(authenticityScore)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(e, analysis._id)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete analysis"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl p-12 text-center bg-white border border-gray-200 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl text-gray-600 mb-6">No analyses yet</p>
              <Link to="/upload" className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md">
                <Upload className="w-5 h-5" />
                <span>Start Your First Analysis</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, analysisId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Analysis"
        message="Are you sure you want to delete this analysis? This action cannot be undone."
      />
    </div>
  )
}

export default Dashboard