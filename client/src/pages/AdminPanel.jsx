import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Shield, Users, FileText, AlertTriangle, Search,
  CheckCircle, XCircle, Clock, ChevronRight, Eye,
  Activity, TrendingUp, BarChart3, Settings, Loader2,
  X, Download
} from 'lucide-react'

const AdminPanel = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [casesRes, statsRes, analysesRes] = await Promise.all([
        adminAPI.getAllCases(),
        adminAPI.getStats(),
        adminAPI.getAllAnalyses(),
      ])
      setCases(casesRes.data.cases || [])
      setAnalyses(analysesRes.data.analyses || [])
      setStats(statsRes.data)
    } catch (error) {
      toast.error('Failed to load admin data')
      console.error('Admin data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (caseId, newStatus) => {
    try {
      await adminAPI.updateCaseStatus(caseId, newStatus, '')
      toast.success('Case status updated')
      fetchData()
      setSelectedCase(null)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDownloadReport = async (analysisId) => {
    try {
      const response = await adminAPI.downloadReport(analysisId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${analysisId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report downloaded')
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const combinedItems = [
    ...cases.map(c => ({
      ...c,
      type: 'case',
      displayId: c.caseId,
      displayFileName: c.analysis?.fileName || c.title || 'N/A',
      displayScore: c.analysis?.result?.aiAnalysis?.authenticityScore || c.analysis?.result?.authenticityScore || 0,
      displayIsDeepfake: c.analysis?.result?.aiAnalysis?.isDeepfake || c.analysis?.result?.isDeepfake || false,
      displayDate: c.createdAt,
      displayUser: c.isAnonymous ? 'Anonymous' : (c.user?.name || 'Unknown'),
    })),
    ...analyses.filter(a => !cases.some(c => c.analysis?._id === a._id)).map(a => ({
      ...a,
      type: 'analysis',
      displayId: a.caseId || 'N/A',
      displayFileName: a.fileName,
      displayScore: a.result?.aiAnalysis?.authenticityScore || a.result?.authenticityScore || 0,
      displayIsDeepfake: a.result?.aiAnalysis?.isDeepfake || a.result?.isDeepfake || false,
      displayDate: a.createdAt,
      displayUser: a.isAnonymous ? 'Anonymous' : (a.user?.name || 'Unknown'),
    })),
  ]

  const filteredItems = combinedItems.filter(item => {
    const matchesSearch = item.displayFileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.displayId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    
    if (statusFilter === 'suspicious') return matchesSearch && item.displayIsDeepfake
    if (statusFilter === 'authentic') return matchesSearch && !item.displayIsDeepfake
    
    if (item.type === 'case') {
      return matchesSearch && item.status === statusFilter
    }
    return matchesSearch
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      investigating: 'bg-blue-100 text-blue-700 border-blue-200',
      resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      closed: 'bg-gray-100 text-gray-600 border-gray-200',
    }
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-sm border ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-6 shadow-sm">
        <Link to="/" className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">Naari</span>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500"> Kavach</span>
          </div>
        </Link>
        
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3 px-4">Admin Panel</div>
        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-md">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all">
            <Shield className="w-5 h-5" />
            <span>User Dashboard</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
            <BarChart3 className="w-10 h-10 text-purple-600" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-gray-500 text-lg">Manage and monitor all cases</p>
        </header>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1 text-gray-900">{stats.totalCases}</div>
              <div className="text-gray-500 text-sm">Total Cases</div>
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1 text-amber-600">{stats.pendingCases}</div>
              <div className="text-gray-600 text-sm">Pending</div>
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1 text-red-600">{stats.suspiciousDetected}</div>
              <div className="text-gray-600 text-sm">Suspicious Content</div>
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1 text-emerald-600">{stats.resolvedCases}</div>
              <div className="text-gray-600 text-sm">Resolved</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-all bg-white shadow-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-4 rounded-xl border border-gray-200 text-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-all bg-white shadow-sm cursor-pointer"
          >
            <option value="all">All</option>
            <option value="suspicious">Suspicious</option>
            <option value="authentic">Verified</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Cases Table */}
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-gray-600 font-medium">Case ID</th>
                  <th className="text-left p-4 text-gray-600 font-medium">File</th>
                  <th className="text-left p-4 text-gray-600 font-medium">Reporter</th>
                  <th className="text-left p-4 text-gray-600 font-medium">Analysis</th>
                  <th className="text-left p-4 text-gray-600 font-medium">Type</th>
                  <th className="text-left p-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-400">No cases found</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={`${item.type}-${item._id}`} className="border-t border-gray-100 hover:bg-purple-50 transition-colors">
                      <td className="p-4 font-mono text-sm text-purple-600">{item.displayId}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {item.displayIsDeepfake ? (
                            <div className="p-2 rounded-lg bg-red-100">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-emerald-100">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                          )}
                          <span className="truncate max-w-[150px] text-gray-900">{item.displayFileName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{item.displayUser}</td>
                      <td className="p-4">
                        <span style={{ color: getScoreColor(item.displayScore) }} className="font-bold">
                          {item.displayScore}%
                        </span>
                      </td>
                      <td className="p-4">
                        {item.type === 'case' ? getStatusBadge(item.status) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border border-purple-200">
                            {item.displayIsDeepfake ? 'Suspicious' : 'Verified'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(item.displayDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => item.type === 'case' ? setSelectedCase(item) : navigate(`/analysis/${item._id}`)}
                            className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5 text-gray-500 hover:text-purple-600" />
                          </button>
                          {item.type === 'analysis' && (
                            <button
                              onClick={() => handleDownloadReport(item._id)}
                              className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Download Report"
                            >
                              <Download className="w-5 h-5 text-gray-500 hover:text-purple-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Case Details</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-gray-500 text-sm mb-1">Case ID</p>
                    <p className="font-mono text-purple-600">{selectedCase.caseId || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-gray-500 text-sm mb-1">Status</p>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-gray-500 text-sm mb-1">File Name</p>
                  <p className="text-gray-900 font-medium">{selectedCase.analysis?.fileName || selectedCase.title || 'N/A'}</p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-gray-500 text-sm mb-1">Reporter</p>
                  {(selectedCase.isAnonymous || selectedCase.analysis?.isAnonymous) ? (
                    <p className="text-gray-500">Anonymous</p>
                  ) : (
                    <p className="text-gray-900">{selectedCase.user?.name} ({selectedCase.user?.email})</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-gray-500 text-sm mb-2">Analysis Result</p>
                  <div className="rounded-xl p-4 bg-white border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Authenticity Score</span>
                      <span className="text-2xl font-bold" style={{ color: getScoreColor(selectedCase.analysis?.result?.aiAnalysis?.authenticityScore || selectedCase.analysis?.result?.authenticityScore || 0) }}>
                        {selectedCase.analysis?.result?.aiAnalysis?.authenticityScore || selectedCase.analysis?.result?.authenticityScore || 0}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedCase.analysis?.result?.aiAnalysis?.isDeepfake || selectedCase.analysis?.result?.isDeepfake ? (
                        <>
                          <div className="p-2 rounded-lg bg-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="text-red-600 font-medium">Manipulation Detected</span>
                        </>
                      ) : (
                        <>
                          <div className="p-2 rounded-lg bg-emerald-100">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-emerald-600 font-medium">Appears Authentic</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-gray-500 text-sm mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-3">
                    {['pending', 'investigating', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedCase._id, status)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedCase.status === status
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'border border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPanel