import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Upload = lazy(() => import('./pages/Upload'))
const AnalysisResult = lazy(() => import('./pages/AnalysisResult'))
const CaseHistory = lazy(() => import('./pages/CaseHistory'))
const Support = lazy(() => import('./pages/Support'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const Profile = lazy(() => import('./pages/Profile'))
const SafetyHub = lazy(() => import('./pages/SafetyHub'))
const CompleteAnalysis = lazy(() => import('./pages/CompleteAnalysis'))

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/30">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-sky-200 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-sky-500 rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        } />
        <Route path="/analysis/:id" element={
          <ProtectedRoute>
            <AnalysisResult />
          </ProtectedRoute>
        } />
        <Route path="/cases" element={
          <ProtectedRoute>
            <CaseHistory />
          </ProtectedRoute>
        } />
        <Route path="/support" element={<Support />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/safety" element={
          <ProtectedRoute>
            <SafetyHub />
          </ProtectedRoute>
        } />
        <Route path="/complete-analysis" element={
          <ProtectedRoute>
            <CompleteAnalysis />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  )
}

export default App
