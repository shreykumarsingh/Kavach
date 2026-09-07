import fileDownload from 'js-file-download'
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Bot,
    Building2,
    Check,
    CheckCircle,
    Clock,
    Copy,
    Download,
    ExternalLink,
    Facebook,
    FileText,
    Fingerprint,
    Hash,
    Heart,
    Image as ImageIcon,
    Info,
    Instagram,
    Loader2,
    Mail,
    MapPin,
    Navigation, PenTool,
    Phone,
    RefreshCw, Search,
    Send,
    Shield,
    ShieldAlert,
    Sparkles,
    Youtube,
    Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { analysisAPI, searchAPI } from '../services/api'
import { getEmergencyContacts, getNearbyNGOs } from '../services/location'

const generateCybercrimeComplaint = (analysis, userLocation, user) => {
  const date = new Date().toLocaleDateString('en-IN')
  const incidentDate = analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString('en-IN') : date
  
  const userName = user?.name || '[Your Full Name]'
  const userEmail = user?.email || '[Your Email ID]'
  const userPhone = user?.phone || user?.mobile || '[Your Phone Number]'
  const userAddress = user?.address || userLocation || '[Your Address / Location]'
  const displayLocation = userLocation || '[Location]'
  const authenticityScore = analysis?.result?.authenticityScore || analysis?.result?.aiDetection?.authenticityScore || 'N/A'
  
  return `
CYBERCRIME COMPLAINT FORM
==========================

I. COMPLAINANT DETAILS
-----------------------
Name: ${userName}
Address: ${userAddress}
Phone: ${userPhone}
Email: ${userEmail}
Date: ${date}

II. INCIDENT DETAILS
--------------------
Date of Incident: ${incidentDate}
Location: ${displayLocation}

III. COMPLAINT SUMMARY
----------------------
I am filing a complaint regarding the following incident:

The analyzed image/media has been identified with the following details:
- File Name: ${analysis?.fileName || 'N/A'}
- Analysis ID: ${analysis?._id || 'N/A'}
- Authenticity Score: ${authenticityScore}%
- AI Detection Result: ${analysis?.result?.aiDetection?.isDeepfake ? 'Manipulated/Deepfake Content' : analysis?.result?.searchResult?.aiDetection?.isDeepfake ? 'Manipulated/Deepfake Content' : 'Content appears authentic'}

IV. EVIDENCE DESCRIPTION
------------------------
The attached evidence (file: ${analysis?.fileName}) was analyzed and shows:
- Similar images found: ${analysis?.result?.similarFound || 0}
- AI Manipulation detected: ${analysis?.result?.aiDetection?.isDeepfake ? 'Yes' : 'No'}
- Confidence Level: ${analysis?.result?.aiDetection?.confidence || 'N/A'}%

V. REQUEST
----------
I request appropriate action to be taken against the perpetrator(s) who have:
1. Created and/or distributed manipulated/fake content
2. Used my/someone's identity without consent
3. Committed cyber harassment

I request this matter be investigated and necessary legal action be taken under:
- Information Technology Act, 2000
- Indian Penal Code Sections 420, 465, 466, 468, 469, 500, 509

VI. DECLARATION
---------------
I hereby declare that the information provided above is true and correct to the best of my knowledge.

Signature: _______________
Date: ${date}
  `.trim()
}

const generateTakedownRequest = (platform, analysis, userLocation, user) => {
  const date = new Date().toLocaleDateString('en-IN')
  const platformEmails = {
    instagram: 'help@instagram.com',
    facebook: 'https://www.facebook.com/help/contact/175825577905346',
    youtube: 'https://support.google.com/youtube/contact/copyright'
  }
  
  const userName = user?.name || '[Your Name]'
  const userEmail = user?.email || '[Your Email]'
  const userPhone = user?.phone || user?.mobile || '[Your Phone Number]'
  const displayLocation = userLocation || '[Location]'
  const authenticityScore = analysis?.result?.authenticityScore || analysis?.result?.aiDetection?.authenticityScore || 'N/A'
  
  const templates = {
    instagram: `
To: help@instagram.com
Subject: Request for Immediate Removal of Non-Consensual Content

Dear Instagram Trust & Safety Team,

I am writing to request immediate removal of content that violates Instagram's Terms of Service and community guidelines.

DETAILS:
- Content Type: AI-manipulated/Deepfake image
- Platform: Instagram
- Analysis Date: ${date}
- Location: ${displayLocation}

EVIDENCE:
The content in question has been analyzed and found to be:
- Manipulated/AI-generated content
- Authenticity Score: ${authenticityScore}%
- Potentially harmful and non-consensual
- A violation of community guidelines

Analysis ID: ${analysis?._id || 'N/A'}
File Analyzed: ${analysis?.fileName || 'N/A'}

I request immediate removal of this content and suspension of the account posting this material.

Thank you for your prompt action.

Sincerely,
${userName}
${userEmail}
${userPhone}
    `.trim(),
    
    facebook: `
To: Facebook Support
Subject: Request for Removal of Non-Consensual/Manipulated Content

Dear Facebook Trust & Safety Team,

I am requesting the removal of content that violates Facebook's Community Standards.

DETAILS:
- Content Type: Manipulated/Deepfake image
- Platform: Facebook
- Analysis Date: ${date}
- Location: ${displayLocation}

EVIDENCE:
The content has been analyzed and confirmed as:
- AI-manipulated content
- Authenticity Score: ${authenticityScore}%
- Potentially harmful and non-consensual
- Violation of community standards

Analysis ID: ${analysis?._id || 'N/A'}
File Analyzed: ${analysis?.fileName || 'N/A'}

I request immediate removal of this content and appropriate action against the posting account.

Sincerely,
${userName}
${userEmail}
${userPhone}
    `.trim(),
    
    youtube: `
To: YouTube Copyright Team
Subject: Request for Immediate Takedown of Manipulated Content

Dear YouTube Trust & Safety Team,

I am requesting the removal of manipulated/deepfake content that violates YouTube's Community Guidelines.

DETAILS:
- Content Type: AI-manipulated video/image
- Platform: YouTube
- Analysis Date: ${date}
- Location: ${displayLocation}

EVIDENCE:
The content has been analyzed and found to be:
- Deepfake/manipulated content
- Authenticity Score: ${authenticityScore}%
- Potentially defamatory
- Violation of community guidelines

Analysis ID: ${analysis?._id || 'N/A'}
File Analyzed: ${analysis?.fileName || 'N/A'}

I request immediate removal of this content.

Sincerely,
${userName}
${userEmail}
${userPhone}
    `.trim()
  }
  
  return {
    email: platformEmails[platform],
    subject: `Request for Removal of ${platform.charAt(0).toUpperCase() + platform.slice(1)} Content`,
    template: templates[platform]
  }
}

const generateFIR = (analysis, userLocation, user) => {
  const date = new Date().toLocaleDateString('en-IN')
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const incidentDate = analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString('en-IN') : date
  
  const userName = user?.name || '[Your Name]'
  const userEmail = user?.email || '[Your Email]'
  const userPhone = user?.phone || user?.mobile || '[Your Phone]'
  const displayLocation = userLocation || '[Location]'
  const authenticityScore = analysis?.result?.authenticityScore || analysis?.result?.aiDetection?.authenticityScore || 'N/A'
  const isDeepfake = analysis?.result?.aiDetection?.isDeepfake || analysis?.result?.searchResult?.aiDetection?.isDeepfake || false
  const similarFound = analysis?.result?.similarFound || 0

  return `
FIRST INFORMATION REPORT (FIR)
Under Indian Penal Code & Information Technology Act
================================================================================

POLICE STATION: _________________________
DISTRICT: _________________________
STATE: _________________________

FIR NO.: _________________________ (To be filled by Police)
DATE OF REGISTRATION: ${date}
TIME: ${time}

================================================================================
1. COMPLAINANT/PETITIONER DETAILS
================================================================================
Name: ${userName}
Father's/Husband's Name: _________________________
Age: _________________________
Gender: _________________________
Nationality: Indian
Address: ${displayLocation}
Phone Number: ${userPhone}
Email ID: ${userEmail}

================================================================================
2. ACCUSED DETAILS (If Known)
================================================================================
Name: Unknown
Address: Unknown
Details: Person(s) who created/manipulated the image and circulated it online

================================================================================
3. INCIDENT DETAILS
================================================================================
Date of Incident: ${incidentDate}
Place of Incident: ${displayLocation}
Category: Cyber Crime / Online Harassment / Image Manipulation

NATURE OF OFFENCE:
□ Section 420 IPC - Cheating and dishonestly inducing delivery of property
□ Section 465 IPC - Punishment for forgery
□ Section 466 IPC - Forgery of record of court or of 25 years
□ Section 468 IPC - Forgery for purpose of cheating
□ Section 469 IPC - Forgery for harming reputation
□ Section 500 IPC - Punishment for defamation
□ Section 509 IPC - Word, gesture or act intended to insult modesty of woman
□ Section 66A IT Act - Sending offensive messages through communication service
□ Section 66C IT Act - Identity theft
□ Section 66D IT Act - Cheating by personation by using computer resource
□ Section 67 IT Act - Publishing or transmitting obscene material
□ Section 67A IT Act - Publishing sexually explicit material
□ Section 72 IT Act - Breach of confidentiality

================================================================================
4. COMPLAINT/NARRATION OF FACTS
================================================================================
I, ${userName}, resident of ${displayLocation}, respectfully submit the following:

1. That I have been a victim of cybercrime wherein my/the victim's photograph has been morph/manipulated using artificial intelligence or other means.

2. That the accused person(s) have created fake/deepfake images using advanced technology and circulated the same on various social media platforms without my consent.

3. That the manipulated image has been analyzed and the following findings were recorded:
   - Analysis ID: ${analysis?._id || 'N/A'}
   - File Name: ${analysis?.fileName || 'N/A'}
   - Authenticity Score: ${authenticityScore}%
   - AI Manipulation Detected: ${isDeepfake ? 'YES - MANIPULATED CONTENT' : 'NO'}
   - Similar Images Found Online: ${similarFound}

4. That due to the circulation of such morphed images, I have faced severe mental harassment, humiliation, and distress.

5. That the accused person's act is punishable under various sections of Indian Penal Code and Information Technology Act, 2000.

6. That the complainant is ready to cooperate with the police investigation and provide any additional information as and when required.

================================================================================
5. LIST OF DOCUMENTS/EVIDENCE ATTACHED
================================================================================
1. Analysis Report showing authenticity score and AI manipulation detection
2. Screen captures of the morphed image (if available)
3. Copy of ID proof
4. Any other relevant document

================================================================================
6. RELIEF SOUGHT
================================================================================
1. Registration of FIR against the accused person(s)
2. Investigation into the matter
3. Removal of the morphed image from all online platforms
4. Identification and arrest of the accused person(s)
5. Appropriate legal action under relevant sections of IPC and IT Act

================================================================================
DECLARATION
================================================================================
I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that providing false information is a punishable offence.

Date: ${date}
Place: ${displayLocation}

Signature of Complainant
_________________________
(${userName})

================================================================================
FOR POLICE USE ONLY
================================================================================
FIR No.: _________________________
Date: _________________________
U/S: _________________________
Investigation Officer: _________________________
Action Taken: _________________________
`.trim()
}

const AnalysisResult = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [isSearchResult, setIsSearchResult] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [userLocation, setUserLocation] = useState('')
  const [locationData, setLocationData] = useState(null)
  const [nearbyNGOs, setNearbyNGOs] = useState([])
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [showComplaintGenerator, setShowComplaintGenerator] = useState(false)
  const [showTakedownGenerator, setShowTakedownGenerator] = useState(false)
  const [showFIRGenerator, setShowFIRGenerator] = useState(false)
  const [generatedComplaint, setGeneratedComplaint] = useState('')
  const [generatedFIR, setGeneratedFIR] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const locationParam = searchParams.get('location')
    const latParam = searchParams.get('lat')
    const lonParam = searchParams.get('lon')
    const cityParam = searchParams.get('city')
    const stateParam = searchParams.get('state')

    let finalLocation = ''
    let locDataForNGO = {}

    if (latParam && lonParam) {
      const city = decodeURIComponent(cityParam || '')
      const state = decodeURIComponent(stateParam || '')
      const location = decodeURIComponent(locationParam || '')
      finalLocation = city && state ? `${city}, ${state}` : location
      
      const locData = {
        lat: parseFloat(latParam),
        lon: parseFloat(lonParam),
        city: city,
        state: state,
        displayName: location || `${city}, ${state}`
      }
      setLocationData(locData)
      setNearbyNGOs(getNearbyNGOs(locData))
      setEmergencyContacts(getEmergencyContacts(locData))
    } 
    
    if (locationParam) {
      const decodedLocation = decodeURIComponent(locationParam)
      if (!finalLocation) {
        finalLocation = decodedLocation
      }
      const parts = decodedLocation.split(',')
      locDataForNGO = { city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' }
      if (!locationData) {
        setLocationData(locDataForNGO)
        setNearbyNGOs(getNearbyNGOs(locDataForNGO))
        setEmergencyContacts(getEmergencyContacts(locDataForNGO))
      }
    }
    
    if (finalLocation) {
      setUserLocation(finalLocation)
    }
  }, [searchParams])

  useEffect(() => {
    fetchAnalysis()
  }, [id])

  useEffect(() => {
    if (analysis) {
      const similar = activeResult?.similarFound ?? resultData?.similarFound ?? 0
      const aiDet = activeResult?.aiDetection || resultData?.aiDetection || null
      const aiSc = aiDet?.authenticityScore || activeResult?.authenticityScore || resultData?.authenticityScore || 50
      const score = similar > 0 ? 100 : aiSc
      const duration = 1500
      const steps = 60
      const increment = score / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= score) {
          setAnimatedScore(score)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.round(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [analysis])

  const fetchAnalysis = async () => {
    try {
      let response
      try {
        response = await searchAPI.getById(id)
        setIsSearchResult(true)
      } catch {
        response = await analysisAPI.getById(id)
        setIsSearchResult(false)
      }
      setAnalysis(response.data.analysis)
    } catch (error) {
      toast.error('Failed to load analysis: ' + error.message)
      navigate('/dashboard')
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  const handleRetry = () => {
    setRetrying(true)
    setLoading(true)
    fetchAnalysis()
  }

  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      let response
      try {
        response = await searchAPI.downloadReport(id)
      } catch {
        response = await analysisAPI.downloadReport(id)
      }
      fileDownload(response.data, `analysis-report-${id}.pdf`)
      toast.success('Report downloaded')
    } catch (error) {
      toast.error('Failed to download report')
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadFIR = () => {
    const firContent = generateFIR(analysis, userLocation, user)
    const blob = new Blob([firContent], { type: 'text/plain' })
    fileDownload(blob, `FIR-${id}.txt`)
    toast.success('FIR downloaded')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-900 text-lg font-medium">Analyzing your media...</p>
          <p className="text-gray-500 text-sm mt-2">AI is examining every detail</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  // Get the result object - handle different API responses
  let resultData = analysis.result || {}
  
  // Check if it's from search API (has searchComplete or searchResult)
  const isSearchResultPage = resultData.searchComplete === true || resultData.searchResult?.searchComplete === true
  const searchResult = isSearchResultPage ? (resultData.searchResult || resultData) : null
  
  // For search results, use searchResult. For analysis results, use resultData directly
  const activeResult = searchResult || resultData
  
  // Get AI detection data from whichever source has it
  const aiDetection = activeResult?.aiDetection || resultData?.aiDetection || null
  
  // Get similar images and similar found count - handle different structures
  const similarImages = activeResult?.similarImages || resultData?.similarImages || []
  const similarFound = activeResult?.similarFound ?? resultData?.similarFound ?? 
    (activeResult?.isFaceMatch === true ? 1 : 0)

  const isSearchComplete = activeResult?.searchComplete === true
  const hasAuthenticityScore = (aiDetection?.authenticityScore != null) || 
    (activeResult?.authenticityScore != null) || 
    (resultData?.authenticityScore != null)
  const hasVerdict = activeResult?.verdict != null || resultData?.verdict != null
  const hasSimilarImages = similarImages.length > 0

  // Check for CompleteAnalysis result format
  const isCompleteAnalysis = resultData.matchScore !== undefined || resultData.finalResult !== undefined

  // Create clean references for technical details
  const technicalDetails = activeResult?.detailedAnalysis || resultData?.detailedAnalysis || null
  const detailMetrics = activeResult?.detailMetrics || resultData?.detailMetrics || aiDetection?.detailMetrics || null
  const totalFingerprints = activeResult?.totalFingerprints || resultData?.totalFingerprints || 0
  const uploadedPHash = activeResult?.uploadedPHash || resultData?.uploadedPHash || resultData?.technicalDetails?.phash || null
  
  // Helper to get nested values safely
  const getScore = (path) => {
    if (!technicalDetails) return 0
    const keys = path.split('.')
    let val = technicalDetails
    for (const k of keys) {
      val = val?.[k]
    }
    return val || 0
  }
  
  const getInterpretation = (path) => {
    if (!technicalDetails) return ''
    const keys = path.split('.')
    let val = technicalDetails
    for (const k of keys) {
      val = val?.[k]
    }
    return val || ''
  }
  
  const getIndicators = (path) => {
    if (!technicalDetails) return []
    const keys = path.split('.')
    let val = technicalDetails
    for (const k of keys) {
      val = val?.[k]
    }
    return val || []
  }
  
  const hasSearchResult = isSearchResultPage && (isSearchComplete || hasVerdict || hasSimilarImages || hasAuthenticityScore)
  const hasAnalysisResult = !isSearchResultPage && (hasAuthenticityScore || isCompleteAnalysis)
  const hasAnyResult = hasSearchResult || hasAnalysisResult || isCompleteAnalysis

  if (!hasAnyResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <header className="bg-white border-b border-gray-200 shadow-sm p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-900 flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto p-8 flex items-center justify-center min-h-[70vh]">
          <div className="rounded-3xl p-12 text-center max-w-md bg-white border border-gray-200 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              {analysis.status === 'failed' ? 'Analysis Failed' : 'Analysis Incomplete'}
            </h1>
            <p className="text-gray-500 mb-8">
              {analysis.status === 'failed'
                ? 'The analysis encountered an error.'
                : 'Results are not yet available.'}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 flex items-center space-x-2 transition-all shadow-md"
              >
                {retrying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                <span>{retrying ? 'Refreshing...' : 'Retry'}</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // COMPLETE ANALYSIS result format
  if (isCompleteAnalysis && resultData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
          {/* Case ID */}
          {analysis.caseId && (
            <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 mb-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">Case ID:</span>
                <span className="font-mono font-medium text-gray-900">{analysis.caseId}</span>
              </div>
              <button
                onClick={() => navigate('/complete-analysis')}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Analyze Another</span>
              </button>
            </div>
          )}

          {/* Main Result Card */}
          <div className={`
            relative overflow-hidden rounded-3xl p-8 mb-8
            ${resultData.resultType === 'safe' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : ''}
            ${resultData.resultType === 'warning' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' : ''}
            ${resultData.resultType === 'danger' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200' : ''}
          `}>
            {/* Background decoration */}
            <div className={`
              absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl
              ${resultData.resultType === 'safe' ? 'bg-green-200/50' : ''}
              ${resultData.resultType === 'warning' ? 'bg-yellow-200/50' : ''}
              ${resultData.resultType === 'danger' ? 'bg-red-200/50' : ''}
            `}></div>

            <div className="relative flex flex-col items-center text-center">
              {/* Icon */}
              <div className={`
                w-24 h-24 rounded-full flex items-center justify-center mb-6
                ${resultData.resultType === 'safe' ? 'bg-green-100' : ''}
                ${resultData.resultType === 'warning' ? 'bg-yellow-100' : ''}
                ${resultData.resultType === 'danger' ? 'bg-red-100' : ''}
              `}>
                {resultData.resultType === 'safe' ? (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                ) : resultData.resultType === 'warning' ? (
                  <AlertTriangle className="w-16 h-16 text-yellow-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>

              {/* Final Result */}
              <h2 className={`
                text-3xl lg:text-4xl font-bold mb-4
                ${resultData.resultType === 'safe' ? 'text-green-700' : ''}
                ${resultData.resultType === 'warning' ? 'text-yellow-700' : ''}
                ${resultData.resultType === 'danger' ? 'text-red-700' : ''}
              `}>
                {resultData.finalResult || 'Analysis Complete'}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-lg max-w-xl">
                {resultData.resultType === 'safe' && 
                  'The image appears to be authentic and matches your registered identity.'}
                {resultData.resultType === 'warning' && 
                  'While the image matches your registered photo, our AI detected signs of possible manipulation.'}
                {resultData.resultType === 'danger' && 
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
                  resultData.isMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resultData.matchScore?.toFixed(1)}%
                </p>
                <p className={`text-sm mt-1 ${
                  resultData.isMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resultData.isMatch ? '✓ Match Found' : '✗ No Match'}
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
                  !resultData.isAI ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {resultData.aiConfidence?.toFixed(1)}%
                </p>
                <p className={`text-sm mt-1 ${
                  !resultData.isAI ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {!resultData.isAI ? '✓ Real Image' : '⚠ AI Generated'}
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
                  resultData.authenticityScore >= 50 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resultData.authenticityScore?.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {resultData.authenticityScore >= 50 ? 'Likely Authentic' : 'Likely Manipulated'}
                </p>
              </div>
            </div>
          </div>

          {/* Reference Image Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Analysis Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference Image Used:</span>
                <span className={resultData.referenceImageUsed ? 'text-green-600' : 'text-yellow-600'}>
                  {resultData.referenceImageUsed ? '✓ Yes' : '⚠ No (register photos for better results)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Face Match Threshold:</span>
                <span className="text-gray-900">60%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Detection:</span>
                <span className={resultData.isAI ? 'text-yellow-600' : 'text-green-600'}>
                  {resultData.isAI ? 'AI Generated' : 'Real'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/complete-analysis')}
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
        </main>
      </div>
    )
  }

  // For search results - handle different structures
  // SIMPLE BINARY RESULT: Always show either DEEPFAKE or REAL
  const isFaceMatch = similarFound > 0
  
  // Get isDeepfake from AI service result - default to false if not available
  const aiIsDeepfake = aiDetection?.isDeepfake === true || aiDetection?.decisionState === 'deepfake_detected'
  
  // Get AI score, default to 50 if not available
  const aiScore = aiDetection?.authenticityScore || activeResult?.authenticityScore || resultData?.authenticityScore || 50
  
  // If no face match and AI score is low, mark as potential deepfake
  // We default to REAL only when we have high confidence
  const isDeepfake = isFaceMatch ? false : (aiIsDeepfake || aiScore < 40)
  
  // Simple binary decision - ALWAYS show a result
  let freshVerdictType = 'safe'
  let freshMessage = ''
  
  if (isFaceMatch) {
    freshVerdictType = 'success'
    freshMessage = 'Real / Authentic Photo'
  } else if (isDeepfake) {
    freshVerdictType = 'danger'
    freshMessage = 'Deepfake Detected'
  } else {
    // When in doubt, be safe and mark as real but with warning
    freshVerdictType = 'safe'
    freshMessage = 'Real / Authentic Photo'
  }
  
  const displayScore = isFaceMatch ? 100 : (isDeepfake ? Math.min(aiScore, 50) : Math.max(aiScore, 50))
  const hasDanger = freshVerdictType === 'danger'
  // Green for real, red for deepfake
  const scoreColor = hasDanger ? '#ef4444' : '#10b981'
  
  const manipulationType = isFaceMatch
    ? 'your_photo'
    : hasDanger
      ? (aiDetection?.manipulationType || 'deepfake')
      : 'authentic'
  const aiAnalysisData = null // Simplified - use aiDetection directly
  
  const getManipulationLabel = (type) => {
    const labels = {
      'deepfake': 'Deepfake Detected',
      'your_photo': 'Real / Authentic Photo',
      'authentic': 'Real / Authentic Photo'
    }
    return labels[type] || type
  }
  
  const getManipulationColor = (type) => {
    const colors = {
      'deepfake': 'from-red-500 to-rose-500',
      'your_photo': 'from-green-500 to-emerald-500',
      'authentic': 'from-green-500 to-emerald-500'
    }
    return colors[type] || colors.authentic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-900 flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm hidden sm:block">Analysis ID: {id.slice(-8)}</span>
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Download Report</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 mb-8 ${
          isFaceMatch 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
            : hasDanger 
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200' 
              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'
        }`} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="88" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle 
                  cx="96" cy="96" r="88" 
                  fill="none" 
                  stroke={scoreColor}
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={`${(animatedScore / 100) * 553} 553`}
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-gray-900">{animatedScore}</span>
                <span className="text-gray-500 text-sm">Authenticity</span>
              </div>
              {hasDanger && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              )}
              {isFaceMatch && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4 bg-white border border-gray-200 shadow-sm">
                {isFaceMatch ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Your Photo Found</span>
                  </>
                ) : hasDanger ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">Deepfake Detected</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Content Verified</span>
                  </>
                )}
              </div>
              
              {/* Result Badge */}
              {(aiDetection || isFaceMatch) && (
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4 shadow-md ${
                  isFaceMatch || freshVerdictType === 'safe'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}>
                  {isFaceMatch || freshVerdictType === 'safe' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">Real / Authentic Photo</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold">Deepfake Detected</span>
                    </>
                  )}
                </div>
              )}
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                {isFaceMatch ? '✅ Your Face Matched!' : freshVerdictType === 'danger' ? '⚠️ DEEPFAKE DETECTED' : '✅ REAL / AUTHENTIC PHOTO'}
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                {isFaceMatch 
                  ? 'This is your authentic photo - Face matched with your registered image!' 
                  : freshVerdictType === 'danger'
                    ? 'AI-generated or manipulated content has been detected.'
                    : 'No manipulation or AI generation detected.'
                }
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{analysis.fileName}</span>
                </span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{new Date(analysis.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{analysis.caseId?.slice(0, 20)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Face Match / AI Generated Status Card */}
          {(aiDetection || aiAnalysisData || isFaceMatch) && (
            <div className={`rounded-2xl p-6 border transition-all hover:shadow-lg hover:scale-[1.02] ${
              isFaceMatch 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                : freshVerdictType === 'danger' 
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' 
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 rounded-xl ${
                  isFaceMatch 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                    : freshVerdictType === 'danger' 
                      ? 'bg-gradient-to-br from-red-100 to-orange-100' 
                      : 'bg-gradient-to-br from-emerald-100 to-teal-100'
                }`}>
                  {isFaceMatch ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : freshVerdictType === 'danger' ? (
                    <Sparkles className="w-6 h-6 text-red-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">
                    {isFaceMatch ? 'Face Match' : 'Detection Result'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {isFaceMatch ? 'Your Photo Verified!' : freshVerdictType === 'danger' ? 'AI Generated' : 'No Manipulation'}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  isFaceMatch || freshVerdictType === 'safe' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isFaceMatch ? '✅ REAL' : freshVerdictType === 'danger' ? '⚠️ DEEPFAKE' : '✅ REAL'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {isFaceMatch ? 'Authenticated' : freshVerdictType === 'danger' ? 'Harmful Content' : 'Authentic'}
                </p>
              </div>
            </div>
          )}
          
          {/* AI Detection Card */}
          {(aiDetection || aiAnalysisData) && (
            <div className="rounded-2xl p-6 bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">Confidence</h3>
                  <p className="text-gray-500 text-sm">AI Analysis</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="text-gray-900 font-medium">{(aiDetection?.confidence || aiAnalysisData?.confidence || 'N/A')}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (aiDetection?.confidenceLevel || aiAnalysisData?.severity) === 'High' || aiAnalysisData?.severity === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {aiAnalysisData?.severity ? aiAnalysisData.severity.charAt(0).toUpperCase() + aiAnalysisData.severity.slice(1) : (aiDetection?.confidenceLevel || 'N/A')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="text-gray-900 font-medium capitalize">{(aiDetection?.manipulationType || aiAnalysisData?.manipulationType || 'none')?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Severity</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (aiDetection?.severity || aiAnalysisData?.severity) === 'high' ? 'bg-red-100 text-red-700' : 
                    (aiDetection?.severity || aiAnalysisData?.severity) === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {(aiDetection?.severity || aiAnalysisData?.severity || 'none')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Details */}
          <div className="rounded-2xl p-6 bg-white border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Analysis Details</h3>
                <p className="text-gray-500 text-sm">Technical metrics</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">File Type</span>
                <span className="text-gray-900 font-medium uppercase">{analysis.fileType || 'image'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">File Size</span>
                <span className="text-gray-900 font-medium">{(analysis.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Registered Photos</span>
                  <span className="text-gray-900 font-medium">{totalFingerprints}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Similar Found</span>
                <span className="text-gray-900 font-medium">{similarFound}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-6 bg-white border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Quick Actions</h3>
                <p className="text-gray-500 text-sm">What to do next</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/upload')}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center space-x-2 shadow-md"
              >
                <Search className="w-4 h-4" />
                <span>Search Another</span>
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Similar Images */}
        {similarFound > 0 && (
          <div className="rounded-2xl p-6 mb-8 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100">
                <Fingerprint className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-lg">Face Matches Found</h3>
                <p className="text-gray-500 text-sm">Similar images in your registered photos</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarImages.slice(0, 4).map((img, idx) => (
                <div key={idx} className="rounded-xl p-4 border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100">
                      <ImageIcon className="w-6 h-6 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate text-sm">{img.originalFileName}</p>
                      <p className="text-gray-500 text-xs">{new Date(img.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Match</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      img.similarity >= 90 ? 'bg-red-100 text-red-700' :
                      img.similarity >= 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {img.similarity}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Findings */}
        {(aiDetection?.keyFindings || aiAnalysisData?.keyFindings) && (
          <div className={`rounded-2xl p-6 mb-8 border ${
            freshVerdictType === 'danger' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-xl ${
                freshVerdictType === 'danger' ? 'bg-gradient-to-br from-red-100 to-orange-100' : 'bg-gradient-to-br from-emerald-100 to-teal-100'
              }`}>
                {freshVerdictType === 'danger' ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-lg">
                  {freshVerdictType === 'danger' ? 'AI Manipulation Detected' : 'No Manipulation Found'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {freshVerdictType === 'danger' ? 'Analysis indicates potential AI manipulation' : 'Image appears to be authentic'}
                </p>
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${
              freshVerdictType === 'danger' ? 'border-red-200 bg-white' : 'border-emerald-200 bg-white'
            }`}>
              <p className="text-gray-700 leading-relaxed">{aiDetection?.keyFindings || aiAnalysisData?.keyFindings}</p>
            </div>
            {((aiDetection?.redFlags && aiDetection.redFlags.length > 0) || (aiAnalysisData?.redFlags && aiAnalysisData.redFlags.length > 0)) && freshVerdictType === 'danger' && (
              <div className="mt-4">
                <p className="text-red-600 text-sm font-medium mb-2">Red Flags Detected:</p>
                <div className="flex flex-wrap gap-2">
                  {(aiDetection?.redFlags || aiAnalysisData?.redFlags || []).map((flag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Technical Details */}
        <div className="rounded-2xl p-6 mb-8 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100">
              <Hash className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg">Technical Evidence</h3>
              <p className="text-gray-500 text-sm">Cryptographic hashes for verification</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
              <p className="text-gray-500 text-sm mb-2">SHA-256 File Hash</p>
              <p className="text-gray-700 font-mono text-xs break-all">{analysis.fileHash || 'N/A'}</p>
            </div>
            <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
              <p className="text-gray-500 text-sm mb-2">Perceptual Hash (pHash)</p>
              <p className="text-gray-700 font-mono text-xs break-all">{uploadedPHash || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Detailed AI Analysis - CNN, GAN, Noise etc - Always Visible */}
        <div className="rounded-2xl p-6 mb-8 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
              <Activity className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-lg">AI Detection Analysis</h3>
              <p className="text-gray-500 text-sm">Technical deepfake detection breakdown</p>
            </div>
          </div>
          
          {/* Overall Technical Score */}
          {technicalDetails?.overallTechnicalScore ? (
              <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-medium">Overall Technical Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    getScore('overallTechnicalScore') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('overallTechnicalScore') >= 40
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('overallTechnicalScore')}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      getScore('overallTechnicalScore') >= 60
                        ? 'bg-emerald-500'
                        : getScore('overallTechnicalScore') >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${getScore('overallTechnicalScore')}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Recommendation: <span className={`font-semibold ${
                    technicalDetails?.recommendation === 'AUTHENTIC' ? 'text-emerald-600' :
                    technicalDetails?.recommendation === 'SUSPICIOUS' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {technicalDetails?.recommendation || 'Pending'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-medium">Overall Technical Score</span>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
                    Analyzing...
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="h-3 rounded-full bg-gray-400 animate-pulse w-full" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Recommendation: <span className="font-semibold text-gray-500">Pending Analysis</span>
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CNN Analysis */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">CNN Analysis</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('cnnAnalysis.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('cnnAnalysis.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('cnnAnalysis.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Sharpness & Edge Detection</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('cnnAnalysis.interpretation') || 'Analyzing image sharpness...'}</p>
                <div className="flex flex-wrap gap-1">
                  {getIndicators('cnnAnalysis.indicators').map((ind, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                  ))}
                </div>
              </div>
              
              {/* GAN Detection */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">GAN Detection</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('ganDetection.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('ganDetection.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('ganDetection.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Face Texture Analysis</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('ganDetection.interpretation') || 'Analyzing face textures...'}</p>
                <div className="flex flex-wrap gap-1">
                  {getIndicators('ganDetection.indicators').map((ind, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                  ))}
                </div>
              </div>
              
              {/* Noise Analysis */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18v-6a9 9 0 0118 0v6M4 18h16M9 18v3M15 18v3M9 9l3-3 3 3M15 9l3-3-3 3" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">Noise Analysis</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('noiseAnalysis.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('noiseAnalysis.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('noiseAnalysis.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Camera Sensor Noise</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('noiseAnalysis.interpretation') || 'Analyzing noise patterns...'}</p>
                <div className="flex flex-wrap gap-1">
                  {getIndicators('noiseAnalysis.indicators').map((ind, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                  ))}
                </div>
              </div>
              
              {/* Texture Analysis */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-cyan-50">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">Texture Analysis</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('textureAnalysis.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('textureAnalysis.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('textureAnalysis.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Edge & Detail Density</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('textureAnalysis.interpretation') || 'Analyzing texture patterns...'}</p>
                <div className="flex flex-wrap gap-1">
                  {getIndicators('textureAnalysis.indicators').map((ind, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                  ))}
                </div>
              </div>
              
              {/* Color Analysis */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-rose-50">
                      <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">Color Analysis</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('compressionAnalysis.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('compressionAnalysis.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('compressionAnalysis.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Color Distribution</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('compressionAnalysis.interpretation') || 'Analyzing color patterns...'}</p>
                <div className="flex flex-wrap gap-1">
                    {getIndicators('compressionAnalysis.indicators').map((ind, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                    ))}
                  </div>
                </div>
              
              {/* Lighting Analysis */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-yellow-50">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-800">Lighting</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    getScore('colorAnalysis.score') >= 60
                      ? 'bg-emerald-100 text-emerald-700'
                      : getScore('colorAnalysis.score') >= 30
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {getScore('colorAnalysis.score')}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Light Distribution</p>
                <p className="text-sm text-gray-700 mb-2">{getInterpretation('colorAnalysis.interpretation') || 'Analyzing lighting...'}</p>
                <div className="flex flex-wrap gap-1">
                  {getIndicators('colorAnalysis.indicators').map((ind, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{ind}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Detail Metrics - Always Visible */}
            <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200">
              <h4 className="font-semibold text-gray-800 mb-3">Raw Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500">Laplacian Variance</p>
                  <p className="text-lg font-bold text-gray-800">{detailMetrics?.laplacianVariance || 'N/A'}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500">Noise Level</p>
                  <p className="text-lg font-bold text-gray-800">{detailMetrics?.noiseLevel || 'N/A'}</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500">Edge Density</p>
                  <p className="text-lg font-bold text-gray-800">{detailMetrics?.edgeDensity || 'N/A'}%</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500">Faces Detected</p>
                  <p className="text-lg font-bold text-gray-800">{detailMetrics?.facesDetected || 0}</p>
                </div>
              </div>
            </div>
          </div>

        {/* Location-Based Help Section */}
        {(hasDanger || userLocation) && (
          <div className={`rounded-2xl p-6 mb-8 ${
            isFaceMatch 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${
                  isFaceMatch 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                    : 'bg-gradient-to-br from-red-100 to-orange-100'
                }`}>
                  {isFaceMatch ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Heart className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg">
                    {isFaceMatch ? 'Your Photo is Protected!' : 'Need Help?'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {isFaceMatch ? 'Your face match helps verify this is your authentic photo' : 'Support resources available 24/7'}
                  </p>
                </div>
              </div>
              {userLocation && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{userLocation}</span>
                  {locationData?.lat && (
                    <Navigation className="w-3 h-3 text-cyan-500 ml-1" />
                  )}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Emergency Contacts</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {emergencyContacts.slice(0, 3).map((contact, idx) => {
                  const policeMapsUrl = contact.type === 'police' && userLocation 
                    ? `https://www.google.com/maps/search/?api=1&query=police+station+${encodeURIComponent(userLocation)}` 
                    : null
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all bg-white">
                      <a href={`tel:${contact.number}`} className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          contact.type === 'cyber' ? 'bg-gradient-to-br from-cyan-100 to-blue-100' :
                          contact.type === 'women' ? 'bg-gradient-to-br from-pink-100 to-rose-100' :
                          contact.type === 'police' ? 'bg-gradient-to-br from-purple-100 to-indigo-100' :
                          'bg-gradient-to-br from-red-100 to-orange-100'
                        }`}>
                          <Phone className={`w-5 h-5 ${
                            contact.type === 'cyber' ? 'text-cyan-600' :
                            contact.type === 'women' ? 'text-pink-600' :
                            contact.type === 'police' ? 'text-purple-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium text-sm">{contact.name}</p>
                          <p className="text-gray-500 text-xs">{contact.number}</p>
                        </div>
                      </a>
                      {policeMapsUrl && (
                        <a 
                          href={policeMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Find Police Station on Maps"
                        >
                          <MapPin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
              {emergencyContacts[0]?.description && (
                <p className="text-xs text-gray-500 mt-2 ml-1">{emergencyContacts[0].description}</p>
              )}
            </div>

            {/* Nearby NGOs */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>{userLocation ? `NGOs Near ${userLocation.split(',')[0]}` : 'Support Organizations (NGOs)'}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nearbyNGOs.map((ngo, idx) => {
                  const googleMapsUrl = ngo.googleMapsUrl || (userLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngo.name + ' ' + userLocation.split(',')[0])}` : null)
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-gray-900 font-medium text-sm">{ngo.name}</h5>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ngo.type === 'women_safety' ? 'bg-pink-100 text-pink-700' :
                          ngo.type === 'cyber_safety' ? 'bg-cyan-100 text-cyan-700' :
                          ngo.isGovernment ? 'bg-indigo-100 text-indigo-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {ngo.type === 'women_safety' ? 'Women Safety' :
                           ngo.type === 'cyber_safety' ? 'Cyber Safety' :
                           ngo.isGovernment ? 'Government' : 'Legal Aid'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mb-2">{ngo.description}</p>
                      <div className="flex items-center justify-between">
                        <a href={`tel:${ngo.phone}`} className="text-cyan-600 text-xs font-medium hover:underline flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{ngo.phone}</span>
                        </a>
                        {googleMapsUrl && (
                          <a 
                            href={googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-700 flex items-center space-x-1 text-xs"
                            title="View on Google Maps"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Map</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Report Now Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-white border border-gray-200">
              <div className="mb-4 sm:mb-0">
                <h4 className="text-gray-900 font-medium text-sm">Ready to file a complaint?</h4>
                <p className="text-gray-500 text-xs">Submit your complaint to the official cybercrime portal</p>
              </div>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:opacity-90 flex items-center space-x-2 transition-all shadow-md"
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Report Now</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* One-Click Cybercrime Complaint Generator */}
            <div className="mt-6 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
              <button
                onClick={() => {
                  setShowComplaintGenerator(!showComplaintGenerator)
                  if (!showComplaintGenerator) {
                    setGeneratedComplaint(generateCybercrimeComplaint(analysis, userLocation, user))
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                    <PenTool className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-900 font-medium">Cybercrime Complaint Generator</h4>
                    <p className="text-gray-500 text-xs">Auto-generate ready-to-submit complaint</p>
                  </div>
                </div>
                <div className={`transform transition-transform ${showComplaintGenerator ? 'rotate-180' : ''}`}>
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
              </button>

              {showComplaintGenerator && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-gray-900 font-medium text-sm">Generated Complaint</h5>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedComplaint)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                        toast.success('Copied to clipboard!')
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                    {generatedComplaint}
                  </pre>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:opacity-90 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit to Cybercrime Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Auto Takedown Request Generator */}
            <div className="mt-6 rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
              <button
                onClick={() => {
                  setShowTakedownGenerator(!showTakedownGenerator)
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-gray-900 font-medium">Content Takedown Request</h4>
                    <p className="text-gray-500 text-xs">Generate takedown request for social media</p>
                  </div>
                </div>
                <div className={`transform transition-transform ${showTakedownGenerator ? 'rotate-180' : ''}`}>
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
              </button>

              {showTakedownGenerator && (
                <div className="mt-4">
                  <div className="flex space-x-2 mb-4">
                    {['instagram', 'facebook', 'youtube'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                          selectedPlatform === platform
                            ? platform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' :
                              platform === 'facebook' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' :
                              'bg-gradient-to-r from-red-600 to-red-700 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {platform === 'instagram' && <Instagram className="w-4 h-4" />}
                        {platform === 'facebook' && <Facebook className="w-4 h-4" />}
                        {platform === 'youtube' && <Youtube className="w-4 h-4" />}
                        <span className="text-sm font-medium capitalize">{platform}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="text-gray-900 font-medium text-sm capitalize">{selectedPlatform} Takedown Request</h5>
                        <p className="text-gray-500 text-xs">Ready to send to {selectedPlatform}</p>
                      </div>
                      <button
                        onClick={() => {
                          const template = generateTakedownRequest(selectedPlatform, analysis, userLocation, user)
                          navigator.clipboard.writeText(template.template)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                          toast.success('Copied to clipboard!')
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      {generateTakedownRequest(selectedPlatform, analysis, userLocation, user).template}
                    </pre>
                    <a
                      href={selectedPlatform === 'facebook' ? 'https://www.facebook.com/help/contact/175825577905346' : 
                           selectedPlatform === 'youtube' ? 'https://support.google.com/youtube/contact/copyright' :
                           `mailto:help@instagram.com?subject=Request for Removal of ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Content`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send {selectedPlatform === 'facebook' ? 'via Facebook' : selectedPlatform === 'youtube' ? 'via YouTube' : 'via Email'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIR Generator */}
        <div className="mt-6 rounded-2xl p-6 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
          <button
            onClick={() => {
              setShowFIRGenerator(!showFIRGenerator)
              if (!showFIRGenerator) {
                setGeneratedFIR(generateFIR(analysis, userLocation, user))
              }
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-red-200 hover:border-red-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-100 to-rose-100">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <h4 className="text-gray-900 font-medium">Generate FIR (First Information Report)</h4>
                <p className="text-gray-500 text-xs">Auto-generate FIR for police complaint</p>
              </div>
            </div>
            <div className={`transform transition-transform ${showFIRGenerator ? 'rotate-180' : ''}`}>
              <Sparkles className="w-5 h-5 text-red-500" />
            </div>
          </button>

          {showFIRGenerator && (
            <div className="mt-4 p-4 rounded-xl bg-white border border-red-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="text-gray-900 font-medium text-sm">Generated FIR</h5>
                  <p className="text-gray-500 text-xs">Ready to submit at nearest police station</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedFIR)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                      toast.success('FIR copied to clipboard!')
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadFIR}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                {generatedFIR}
              </pre>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:100"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:opacity-90 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Police (100)</span>
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:opacity-90 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Online</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
        {/* Disclaimer */}
        <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-200 bg-gray-50 mb-8">
          <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-gray-600 text-sm">
            <strong className="text-gray-700">Disclaimer:</strong> This analysis combines reverse image search and AI detection. 
            Results should be verified. For legal proceedings, consult law enforcement professionals.
          </p>
        </div>
      </main>
    </div>
  )
}

export default AnalysisResult