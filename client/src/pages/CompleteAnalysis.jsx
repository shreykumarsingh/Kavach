import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  RefreshCw,
  Download,
  Shield
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function CompleteAnalysis() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [caseId, setCaseId] = useState(null)

  useEffect(() => {
    // Cleanup preview URL
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload an image.')
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum 50MB allowed.')
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setCaseId(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const analyzeImage = async () => {
    if (!file) {
      toast.error('Please select an image first.')
      return
    }

    setLoading(true)
    setProgress(10)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/complete-analysis/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000
        }
      )

      clearInterval(progressInterval)
      setProgress(100)

      if (response.data.analysis) {
        setResult(response.data.analysis)
        setCaseId(response.data.caseId)
        toast.success('Analysis completed!')
      }

    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error.response?.data?.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setCaseId(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'safe':
        return 'green'
      case 'warning':
        return 'yellow'
      case 'danger':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'safe':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />
      case 'danger':
        return <XCircle className="w-16 h-16 text-red-500" />
      default:
        return <Shield className="w-16 h-16 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-900 flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Analysis
          </h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {!result && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Image for Analysis
              </h2>
              <p className="text-gray-600">
                We'll analyze the image for AI manipulation and compare with your registered photo
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
                transition-all duration-300
                ${preview 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                }
              `}
            >
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-xl shadow-lg"
                  />
                  <p className="text-gray-600">{file?.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetAnalysis()
                    }}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Choose different image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Upload className="w-10 h-10 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drag & drop your image here
                    </p>
                    <p className="text-gray-500 mt-1">
                      or click to browse • JPG, PNG, WebP up to 50MB
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeImage}
              disabled={!file || loading}
              className={`
                w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2
                transition-all duration-300
                ${!file || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analyzing... {progress}%</span>
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {loading && (
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {progress < 30 && 'Processing image...'}
                  {progress >= 30 && progress < 60 && 'Running AI detection...'}
                  {progress >= 60 && progress < 90 && 'Comparing with registered photo...'}
                  {progress >= 90 && 'Finalizing results...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Case ID */}
            {caseId && (
              <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Case ID:</span>
                  <span className="font-mono font-medium text-gray-900">{caseId}</span>
                </div>
                <button
                  onClick={resetAnalysis}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Analyze Another</span>
                </button>
              </div>
            )}

            {/* Main Result Card */}
            <div className={`
              relative overflow-hidden rounded-3xl p-8
              ${result.resultType === 'safe' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : ''}
              ${result.resultType === 'warning' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' : ''}
              ${result.resultType === 'danger' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200' : ''}
            `}>
              {/* Background decoration */}
              <div className={`
                absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl
                ${result.resultType === 'safe' ? 'bg-green-200/50' : ''}
                ${result.resultType === 'warning' ? 'bg-yellow-200/50' : ''}
                ${result.resultType === 'danger' ? 'bg-red-200/50' : ''}
              `}></div>

              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div className={`
                  w-24 h-24 rounded-full flex items-center justify-center mb-6
                  ${result.resultType === 'safe' ? 'bg-green-100' : ''}
                  ${result.resultType === 'warning' ? 'bg-yellow-100' : ''}
                  ${result.resultType === 'danger' ? 'bg-red-100' : ''}
                `}>
                  {getResultIcon(result.resultType)}
                </div>

                {/* Final Result */}
                <h2 className={`
                  text-3xl lg:text-4xl font-bold mb-4
                  ${result.resultType === 'safe' ? 'text-green-700' : ''}
                  ${result.resultType === 'warning' ? 'text-yellow-700' : ''}
                  ${result.resultType === 'danger' ? 'text-red-700' : ''}
                `}>
                  {result.finalResult}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-lg max-w-xl">
                  {result.resultType === 'safe' && 
                    'The image appears to be authentic and matches your registered identity.'}
                  {result.resultType === 'warning' && 
                    'While the image matches your registered photo, our AI detected signs of possible manipulation.'}
                  {result.resultType === 'danger' && 
                    'The uploaded image does not match your registered photo. This could indicate unauthorized use of your identity.'}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Face Match Score */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                    <ImageIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Face Match</h3>
                    <p className="text-sm text-gray-500">Similarity Score</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${
                    result.isMatch ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.matchScore?.toFixed(1)}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    result.isMatch ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.isMatch ? '✓ Match Found' : '✗ No Match'}
                  </p>
                </div>
              </div>

              {/* AI Confidence */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Detection</h3>
                    <p className="text-sm text-gray-500">Confidence</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${
                    !result.isAI ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {result.aiConfidence?.toFixed(1)}%
                  </p>
                  <p className={`text-sm mt-1 ${
                    !result.isAI ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {!result.isAI ? '✓ Real Image' : '⚠ AI Generated'}
                  </p>
                </div>
              </div>

              {/* Authenticity Score */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Authenticity</h3>
                    <p className="text-sm text-gray-500">Overall Score</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${
                    result.authenticityScore >= 50 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.authenticityScore?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.authenticityScore >= 50 ? 'Likely Authentic' : 'Likely Manipulated'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference Image Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Analysis Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference Image Used:</span>
                  <span className={result.referenceImageUsed ? 'text-green-600' : 'text-yellow-600'}>
                    {result.referenceImageUsed ? '✓ Yes' : '⚠ No (register photos for better results)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Match Threshold:</span>
                  <span className="text-gray-900">60%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Detection:</span>
                  <span className={result.isAI ? 'text-yellow-600' : 'text-green-600'}>
                    {result.isAI ? 'AI Generated' : 'Real'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={resetAnalysis}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Analyze Another Image</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:border-gray-400 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
