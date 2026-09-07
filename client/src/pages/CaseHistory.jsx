import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analysisAPI } from '../services/api'
import toast from 'react-hot-toast'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { 
  FileText, Search, Filter, Download, Eye,
  AlertTriangle, CheckCircle, Clock, ChevronRight,
  Shield, Trash2, Bot, Image as ImageIcon, X
} from 'lucide-react'

const CaseHistory = () => {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, analysisId: null })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await analysisAPI.getHistory()
      setAnalyses(response.data.analyses || [])
    } catch (error) {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.caseId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isDeepfake = analysis.result?.aiAnalysis?.isDeepfake 
      || analysis.result?.isDeepfake 
      || analysis.result?.aiDetection?.isDeepfake 
      || false
    
    if (filter === 'all') return matchesSearch
    if (filter === 'suspicious') return matchesSearch && isDeepfake
    if (filter === 'authentic') return matchesSearch && !isDeepfake
    
    return matchesSearch
  })

  const getAuthenticityColor = (score) => {
    if (score >= 70) return '#10b981'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const handleDeleteClick = (e, analysisId) => {
    e.stopPropagation()
    setDeleteModal({ isOpen: true, analysisId })
  }

  const handleConfirmDelete = async () => {
    try {
      await analysisAPI.delete(deleteModal.analysisId)
      setAnalyses(analyses.filter(a => a._id !== deleteModal.analysisId))
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
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Eye className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/upload" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <FileText className="w-5 h-5" />
            <span>Analyze Media</span>
          </Link>
          <Link to="/cases" className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl shadow-md">
            <FileText className="w-5 h-5" />
            <span className="font-medium">My Cases</span>
          </Link>
          <Link to="/support" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Shield className="w-5 h-5" />
            <span>Support</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
            <Bot className="w-10 h-10 text-sky-600" />
            <span>My Cases</span>
          </h1>
          <p className="text-gray-500 text-lg">View all your analysis history and reports</p>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by filename or case ID..."
              className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all bg-white shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-4 rounded-xl border border-gray-200 text-gray-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all bg-white shadow-sm cursor-pointer"
            >
              <option value="all">All Results</option>
              <option value="synthetic">Suspicious</option>
              <option value="authentic">Authentic</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="rounded-2xl p-12 text-center bg-white border border-gray-200 shadow-sm">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-sky-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 mt-6">Loading cases...</p>
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => {
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
                  className="rounded-2xl p-6 flex items-center justify-between hover:bg-sky-50 transition-all cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-sky-200 group"
                  onClick={() => navigate(`/analysis/${analysis._id}`)}
                >
                  <div className="flex items-center space-x-6">
                    <div className={`p-4 rounded-xl ${
                      isDeepfake 
                        ? 'bg-gradient-to-br from-red-100 to-orange-100 border border-red-200' 
                        : 'bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200'
                    }`}>
                      {isDeepfake ? (
                        <AlertTriangle className="w-7 h-7 text-red-600" />
                      ) : (
                        <CheckCircle className="w-7 h-7 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-semibold text-lg text-gray-900">{analysis.fileName}</p>
                        {isDeepfake && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-orange-100 text-red-600 border border-red-200">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-5">
                        <span className="text-sm text-gray-500 flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Case: {analysis.caseId?.slice(0, 20) || 'N/A'}</span>
                        </span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="text-sm text-gray-400 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(analysis.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className={`px-4 py-2 rounded-xl border ${
                      isDeepfake 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}>
                      <span className="font-semibold">{isDeepfake ? 'Suspicious' : 'Authentic'}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                          <circle 
                            cx="32" cy="32" r="28" 
                            fill="none" 
                            stroke={getAuthenticityColor(authenticityScore)}
                            strokeWidth="4" 
                            strokeLinecap="round"
                            strokeDasharray={`${(authenticityScore / 100) * 176} 176`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold" style={{ color: getAuthenticityColor(authenticityScore) }}>
                            {Math.round(authenticityScore)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Authenticity</p>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteClick(e, analysis._id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl p-12 text-center bg-white border border-gray-200 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-600 mb-2">No cases found</p>
            <p className="text-gray-500 mb-8">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by analyzing your first media file'
              }
            </p>
            <Link to="/upload" className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md">
              <FileText className="w-5 h-5" />
              <span>Analyze Media</span>
            </Link>
          </div>
        )}
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

export default CaseHistory