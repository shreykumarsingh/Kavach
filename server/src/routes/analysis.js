const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const Analysis = require('../models/Analysis')
const Case = require('../models/Case')
const ImageStore = require('../models/ImageStore')
const { authenticate } = require('../middleware/auth')
const { uploadToS3, downloadFromS3 } = require('../services/s3')
const FormData = require('form-data')
const { validateFileMagicBytes, validateFileExtension, detectMaliciousContent, generateSecureFilename, sanitizeString } = require('../utils/security')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
}

function convertKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key)
      acc[camelKey] = convertKeysToCamelCase(obj[key])
      return acc
    }, {})
  }
  return obj
}

function countSetBits(bigInt) {
  let count = 0
  let n = bigInt
  while (n > 0n) {
    count += Number(n & 1n)
    n >>= 1n
  }
  return count
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, generateSecureFilename(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['jpeg', 'jpg', 'png', 'webp', 'mp4', 'webm', 'mov']
  const ext = path.extname(file.originalname).toLowerCase().slice(1)
  
  if (!allowedTypes.includes(ext)) {
    return cb(new Error('Invalid file type'), false)
  }
  
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
  if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('Invalid MIME type'), false)
  }
  
  cb(null, true)
}

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter,
})

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { description, reportingMode } = req.body
    
    const fileData = fs.readFileSync(req.file.path)
    
    if (req.file.mimetype.startsWith('image/')) {
      const magicValidation = validateFileMagicBytes(fileData, req.file.mimetype)
      if (!magicValidation.valid) {
        fs.unlinkSync(req.file.path)
        return res.status(400).json({ message: 'Invalid file content: ' + magicValidation.error })
      }

      const maliciousCheck = detectMaliciousContent(fileData)
      if (maliciousCheck.malicious) {
        fs.unlinkSync(req.file.path)
        return res.status(400).json({ message: 'File contains potentially malicious content' })
      }
    }
    
    const fileHash = crypto.createHash('sha256')
    fileHash.update(fileData)
    const hash = fileHash.digest('hex')

    const sanitizedDescription = sanitizeString(description, 2000)
    const validReportingModes = ['anonymous', 'confidential']
    const safeReportingMode = validReportingModes.includes(reportingMode) ? reportingMode : 'anonymous'

    const caseId = `CASE-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`

    const analysis = new Analysis({
      user: req.userId,
      caseId,
      fileName: req.file.originalname,
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileHash: hash,
      description: sanitizedDescription,
      reportingMode: safeReportingMode,
      isAnonymous: safeReportingMode === 'anonymous',
      status: 'processing',
    })

    await analysis.save()

    let aiResult = null
    let fingerprintMatch = { matched: false, similarity: 0, status: 'unknown', message: 'No fingerprints registered' }
    
    // Fingerprint comparison first
    const Fingerprint = require('../models/Fingerprint')
    const userFingerprints = await Fingerprint.find({ user: req.userId, isActive: true })
    
    let faceMatchStatus = 'unknown'
    let bestSimilarity = 0
    
    if (userFingerprints.length > 0) {
      let tempAiResult = null
      try {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        })
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
          headers: formData.getHeaders(),
          timeout: 60000,
        })
        if (response.data) tempAiResult = convertKeysToCamelCase(response.data)
      } catch (e) {
        console.error('Initial AI call failed:', e.message)
      }
      
      const uploadedPHash = tempAiResult?.technicalDetails?.phash
      const uploadedFileHash = tempAiResult?.technicalDetails?.fileHash || hash
      
      let bestMatch = { similarity: 0, matched: false, hammingDist: 0 }
      for (const fp of userFingerprints) {
        let similarity = 0
        if (fp.fileHash === uploadedFileHash) {
          similarity = 100
        } else if (fp.pHash && uploadedPHash) {
          try {
            const fpHashStr = fp.pHash.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
            const uploadedHashStr = uploadedPHash.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
            const xorResult = BigInt('0x' + fpHashStr) ^ BigInt('0x' + uploadedHashStr)
            const hammingDist = countSetBits(xorResult)
            similarity = ((64 - hammingDist) / 64) * 100
            bestMatch.hammingDist = hammingDist
          } catch (e) {
            console.error('pHash comparison failed:', e.message)
          }
        }
        if (similarity > bestMatch.similarity) {
          bestMatch.similarity = similarity
          bestMatch.matched = similarity >= 70
        }
      }
      
      if (bestMatch.similarity >= 100) faceMatchStatus = 'exact_match'
      else if (bestMatch.similarity >= 70) faceMatchStatus = 'matched'
      else if (bestMatch.similarity > 0) faceMatchStatus = 'partial'
      else faceMatchStatus = 'no_match'
      
      bestSimilarity = bestMatch.similarity
      
      fingerprintMatch = {
        matched: bestMatch.matched,
        similarity: Math.round(bestMatch.similarity),
        hammingDist: bestMatch.hammingDist,
        status: faceMatchStatus,
        registeredCount: userFingerprints.length,
        message: bestMatch.matched ? 'Face match found with your registered photos' : 'No match found with registered face photos'
      }
      
      // Call AI with fingerprint data
      try {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        })
        formData.append('fingerprintStatus', faceMatchStatus)
        formData.append('fingerprintSimilarity', bestMatch.similarity.toString())
        formData.append('fingerprintMessage', fingerprintMatch.message)
        
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
          headers: formData.getHeaders(),
          timeout: 90000,
        })
        if (response.data) aiResult = convertKeysToCamelCase(response.data)
      } catch (e) {
        console.error('AI analysis with fingerprint failed:', e.message)
      }
      
      if (!aiResult && tempAiResult) aiResult = tempAiResult
      
      // Apply fingerprint info but DON'T boost authenticity for matches
      // Fingerprint match = "it's this person's face", NOT "image is authentic"
      if (aiResult) {
        if (bestMatch.similarity >= 100) {
          aiResult.faceMatchStatus = 'exact_match'
        } else if (bestMatch.similarity >= 85) {
          aiResult.faceMatchStatus = 'matched'
        } else if (bestMatch.similarity >= 70) {
          aiResult.faceMatchStatus = 'matched'
        } else {
          aiResult.faceMatchStatus = 'no_match'
          aiResult.warningMessage = 'Face does not match any registered face'
        }
        aiResult.fingerprintSimilarity = Math.round(bestMatch.similarity)
        aiResult.confidence = Math.min(95, aiResult.confidence + 10)
      }
    } else {
      // No fingerprints - normal analysis
      try {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        })
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
          headers: formData.getHeaders(),
          timeout: 60000,
        })
        if (response.data) aiResult = convertKeysToCamelCase(response.data)
      } catch (e) {
        console.error('AI analysis failed:', e.message)
      }
    }
    
    if (!aiResult) {
      aiResult = { authenticityScore: 50, isDeepfake: false, confidence: 50, faceDetected: false, available: false }
    } else {
      aiResult.available = true
    }
    
    analysis.result = aiResult
    analysis.status = 'completed'
    await analysis.save()
    
    const newCase = new Case({
      caseId: analysis.caseId,
      user: analysis.user,
      title: 'Analysis: ' + analysis.originalFileName,
      description: description || 'No description provided',
      reportingMode: reportingMode || 'anonymous',
      isAnonymous: reportingMode === 'anonymous',
      status: 'pending',
      priority: 'medium',
      analysis: analysis._id,
    })
    await newCase.save()

    res.status(201).json({
      message: 'Analysis completed',
      analysis,
      case: newCase,
      fingerprintMatch,
      aiAvailable: !!aiResult,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Upload failed' })
  }
})

router.post('/upload-url', authenticate, async (req, res) => {
  try {
    const { url, description, reportingMode } = req.body
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' })
    }

    const caseId = `CASE-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`

    const analysis = new Analysis({
      user: req.userId,
      caseId,
      fileName: url.split('/').pop() || 'url-scan',
      fileType: 'image',
      url,
      description,
      reportingMode,
      isAnonymous: reportingMode === 'anonymous',
      status: 'processing',
    })

    await analysis.save()

    let aiResult = null
    let fingerprintMatch = { matched: false, similarity: 0, status: 'unknown', message: 'No fingerprints registered' }
    
    // Fingerprint comparison
    const Fingerprint = require('../models/Fingerprint')
    const userFingerprints = await Fingerprint.find({ user: req.userId, isActive: true })
    
    let faceMatchStatus = 'unknown'
    
    if (userFingerprints.length > 0) {
      let tempAiResult = null
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-url`, { url }, { timeout: 60000 })
        if (response.data) tempAiResult = response.data
      } catch (e) {
        console.error('URL analysis failed:', e.message)
      }
      
      const uploadedPHash = tempAiResult?.technicalDetails?.phash
      
      let bestMatch = { similarity: 0, matched: false, hammingDist: 0 }
      for (const fp of userFingerprints) {
        let similarity = 0
        if (fp.pHash && uploadedPHash) {
          try {
            const fpHashStr = fp.pHash.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
            const uploadedHashStr = uploadedPHash.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
            const xorResult = BigInt('0x' + fpHashStr) ^ BigInt('0x' + uploadedHashStr)
            bestMatch.hammingDist = countSetBits(xorResult)
            similarity = ((64 - bestMatch.hammingDist) / 64) * 100
          } catch (e) {
            console.error('URL fingerprint comparison failed:', e.message)
          }
        }
        if (similarity > bestMatch.similarity) {
          bestMatch.similarity = similarity
          bestMatch.matched = similarity >= 70
        }
      }
      
      if (bestMatch.similarity >= 100) faceMatchStatus = 'exact_match'
      else if (bestMatch.similarity >= 70) faceMatchStatus = 'matched'
      else if (bestMatch.similarity > 0) faceMatchStatus = 'partial'
      else faceMatchStatus = 'no_match'
      
      fingerprintMatch = {
        matched: bestMatch.matched,
        similarity: Math.round(bestMatch.similarity),
        hammingDist: bestMatch.hammingDist,
        status: faceMatchStatus,
        registeredCount: userFingerprints.length,
        message: bestMatch.matched ? 'Face match found' : 'No match found'
      }
      
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-url`, {
          url,
          fingerprintStatus: faceMatchStatus,
          fingerprintSimilarity: bestMatch.similarity,
          fingerprintMessage: fingerprintMatch.message
        }, { timeout: 90000 })
        if (response.data) aiResult = convertKeysToCamelCase(response.data)
      } catch (e) {
        console.error('URL analysis with fingerprint failed:', e.message)
      }
      
      if (!aiResult && tempAiResult) aiResult = tempAiResult
      
      // Apply fingerprint info but DON'T boost authenticity for matches
      if (aiResult) {
        if (bestMatch.similarity >= 85) {
          aiResult.faceMatchStatus = 'matched'
        } else if (bestMatch.similarity >= 70) {
          aiResult.faceMatchStatus = 'matched'
        } else {
          aiResult.faceMatchStatus = 'no_match'
          aiResult.warningMessage = 'Face does not match any registered face'
        }
        aiResult.fingerprintSimilarity = Math.round(bestMatch.similarity)
        aiResult.confidence = Math.min(95, aiResult.confidence + 10)
      }
    } else {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-url`, { url }, { timeout: 60000 })
        if (response.data) aiResult = convertKeysToCamelCase(response.data)
      } catch (e) {
        console.error('URL analysis failed:', e.message)
      }
    }
    
    if (!aiResult) {
      aiResult = { authenticityScore: 50, isDeepfake: false, confidence: 50, faceDetected: false, available: false }
    } else {
      aiResult.available = true
    }
    
    analysis.result = aiResult
    analysis.status = 'completed'
    await analysis.save()
    
    const newCase = new Case({
      caseId: analysis.caseId,
      user: analysis.user,
      title: 'URL Analysis: ' + (url.split('/').pop() || 'url-scan'),
      description: description || 'No description provided',
      reportingMode: reportingMode || 'anonymous',
      isAnonymous: reportingMode === 'anonymous',
      status: 'pending',
      priority: 'medium',
      analysis: analysis._id,
    })
    await newCase.save()

    res.status(201).json({
      message: 'Analysis completed',
      analysis,
      case: newCase,
      fingerprintMatch,
      aiAvailable: !!aiResult,
    })
  } catch (error) {
    console.error('URL scan error:', error)
    res.status(500).json({ message: 'URL scan failed' })
  }
})

router.get('/history', authenticate, async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email')

    const analysesArray = analyses.map(a => {
      const obj = a.toObject()
      if (obj.result) {
        obj.result = convertKeysToCamelCase(obj.result)
      }
      return obj
    })

    res.json({ analyses: analysesArray })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' })
    }

    if (analysis.user && analysis.user.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    await Case.deleteMany({ analysis: req.params.id })
    await ImageStore.deleteMany({ caseId: analysis.caseId })
    await Analysis.findByIdAndDelete(req.params.id)

    res.json({ message: 'Analysis deleted successfully' })
  } catch (error) {
    console.error('Delete analysis error:', error)
    res.status(500).json({ message: 'Failed to delete analysis' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('user', 'name email')

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' })
    }

    if (analysis.user && analysis.user._id.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const analysisObj = analysis.toObject()
    if (analysisObj.result) {
      analysisObj.result = convertKeysToCamelCase(analysisObj.result)
    }

    res.json({ analysis: analysisObj })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analysis' })
  }
})

router.get('/:id/report', authenticate, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' })
    }

    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({ size: 'A4', margin: 40 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=deepfake-analysis-${analysis._id}.pdf`)

    doc.pipe(res)
    
    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 80

    // Header
    doc.rect(0, 0, pageWidth, 50).fill('#1a365d')
    doc.fillColor('#ffffff')
    doc.fontSize(18).text('NAARI SHOURY A', 0, 12, { align: 'center', width: pageWidth })
    doc.fontSize(9).text('AI Media Protection & Rapid Response Platform', 0, 32, { align: 'center', width: pageWidth })
    doc.fillColor('#000000')
    
    doc.moveDown(1.5)
    
    const reportDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    doc.fontSize(14).text('Deepfake Analysis Report', { align: 'center' })
    doc.fontSize(8).fillColor('#64748b').text(`${reportDate} | Case: ${analysis.caseId || 'N/A'}`, { align: 'center' })
    doc.fillColor('#000000')
    
    doc.moveDown(1)
    
    // Score
    const score = analysis.result?.authenticityScore || 0
    const isDeepfake = analysis.result?.isDeepfake
    const scoreColor = isDeepfake ? '#dc2626' : '#16a34a'
    const bgColor = isDeepfake ? '#fef2f2' : '#f0fdf4'
    
    doc.rect(40, doc.y, contentWidth, 50).fill(bgColor)
    doc.fontSize(8).fillColor('#64748b').text('AUTHENTICITY SCORE', 40, doc.y + 5, { align: 'center', width: contentWidth })
    doc.fontSize(30).fillColor(scoreColor).text(`${score}%`, 40, doc.y + 15, { align: 'center', width: contentWidth })
    doc.fontSize(10).fillColor(scoreColor).text(isDeepfake ? 'LIKELY MANIPULATED' : 'CONTENT AUTHENTIC', 40, doc.y + 42, { align: 'center', width: contentWidth })
    doc.fillColor('#000000')
    
    doc.moveDown(1)
    
    // File Info
    doc.fontSize(10).text('File Information')
    doc.fontSize(8).text(`Name: ${analysis.fileName || 'N/A'} | Type: ${(analysis.fileType || 'N/A').toUpperCase()} | Size: ${analysis.fileSize ? formatBytes(analysis.fileSize) : 'N/A'}`)
    
    doc.moveDown(0.8)
    
    // Evidence
    doc.fontSize(10).text('Digital Evidence')
    doc.fontSize(7).fillColor('#64748b')
    doc.text(`pHash: ${analysis.result?.technicalDetails?.phash || 'N/A'}`, 40, doc.y)
    doc.moveDown(0.25)
    doc.text(`SHA-256: ${analysis.fileHash || 'N/A'}`, 40, doc.y)
    doc.fillColor('#000000')
    
    doc.moveDown(0.8)
    
    // Face Detection
    doc.fontSize(10).text('Face Analysis')
    let faceInfo = `Detected: ${analysis.result?.faceDetected ? 'Yes' : 'No'}`
    if (analysis.result?.faceMatchStatus) {
      const matchLabels = { 'exact_match': 'Exact Match', 'matched': 'Match Found', 'partial': 'Partial Match', 'no_match': 'No Match' }
      faceInfo += ` | Status: ${matchLabels[analysis.result.faceMatchStatus] || analysis.result.faceMatchStatus}`
    }
    doc.fontSize(8).text(faceInfo)
    
    doc.moveDown(0.8)
    
    // Technical Metrics
    doc.fontSize(10).text('Technical Metrics')
    const metrics = []
    if (analysis.result?.ganFingerprintAnalysis) {
      const gan = analysis.result.ganFingerprintAnalysis
      metrics.push({ label: 'GAN', value: `${gan.score?.toFixed(1) || 'N/A'}%` })
      metrics.push({ label: 'Frequency', value: `${gan.frequencyAnalysis?.toFixed(1) || 'N/A'}%` })
      metrics.push({ label: 'Noise', value: `${gan.noiseAnalysis?.toFixed(1) || 'N/A'}%` })
    }
    if (analysis.result?.lightingAnalysis) {
      metrics.push({ label: 'Lighting', value: `${analysis.result.lightingAnalysis.score?.toFixed(1) || 'N/A'}%` })
    }
    if (metrics.length > 0) {
      doc.fontSize(8).text(metrics.map(m => `${m.label}: ${m.value}`).join(' | '))
    }
    
    doc.moveDown(0.8)
    
    // AI Analysis
    if (analysis.result?.aiAnalysis) {
      const ai = analysis.result.aiAnalysis
      doc.fontSize(10).text('AI Analysis (Claude)')
      
      if (ai.manipulation_type || ai.severity) {
        const manipLabels = { 'face_swap': 'Face Swap', 'gan_generated': 'AI Generated', 'face_morph': 'Face Morph', 'none': 'None', 'unknown': 'Unknown' }
        const severityColors = { 'high': '#dc2626', 'medium': '#f59e0b', 'low': '#3b82f6', 'none': '#16a34a', 'unknown': '#6b7280' }
        const sevColor = severityColors[ai.severity] || '#000000'
        doc.fontSize(8).fillColor('#64748b').text('Type: ', 40, doc.y, { continued: true })
        doc.fillColor(sevColor).text(manipLabels[ai.manipulation_type] || ai.manipulation_type || 'Unknown')
        doc.fillColor('#64748b').text(' | Severity: ', 0, doc.y, { continued: true })
        doc.fillColor(sevColor).text((ai.severity || 'unknown').charAt(0).toUpperCase() + (ai.severity || 'unknown').slice(1))
        doc.fillColor('#000000')
        doc.moveDown(0.3)
      }
      
      if (ai.key_findings) {
        doc.fontSize(8).text(ai.key_findings)
      }
      
      if (ai.red_flags?.length > 0) {
        doc.moveDown(0.2)
        doc.rect(40, doc.y, contentWidth, 12 + (ai.red_flags.length * 10)).fill('#fef2f2')
        doc.rect(40, doc.y, 3, 12 + (ai.red_flags.length * 10)).fill('#dc2626')
        doc.fontSize(8).fillColor('#dc2626').text('Red Flags:', 48, doc.y + 3)
        ai.red_flags.forEach((flag, i) => {
          doc.fillColor('#7f1d1d').text(`• ${flag}`, 48, doc.y + 12 + (i * 10))
        })
        doc.moveDown(0.6)
        doc.fillColor('#000000')
      }
      
      if (ai.recommendation) {
        doc.moveDown(0.2)
        doc.rect(40, doc.y, contentWidth, 18).fill('#eff6ff')
        doc.rect(40, doc.y, 3, 18).fill('#3b82f6')
        doc.fontSize(8).fillColor('#1e40af').text(`Recommendation: ${ai.recommendation}`, 48, doc.y + 5)
        doc.moveDown(0.5)
        doc.fillColor('#000000')
      }
    }
    
    // Warning
    if (analysis.result?.warningMessage) {
      doc.rect(40, doc.y, contentWidth, 20).fill('#fef3c7')
      doc.rect(40, doc.y, 3, 20).fill('#f59e0b')
      doc.fontSize(8).fillColor('#b45309').text(`Warning: ${analysis.result.warningMessage}`, 48, doc.y + 5)
      doc.moveDown(0.6)
      doc.fillColor('#000000')
    }
    
    // Recommendations
    doc.fontSize(10).text('Recommendations')
    doc.fontSize(8)
    if (isDeepfake) {
      doc.text('• Content flagged as potentially manipulated - Do not share or distribute')
      doc.text('• Preserve original evidence with hash for legal purposes')
      doc.text('• Report to platform and file complaint at cybercrime.gov.in')
    } else {
      doc.text('• Content appears authentic based on current AI analysis')
      doc.text('• Verify through multiple sources for critical decisions')
    }
    
    doc.moveDown(1)
    
    // Legal Notice
    doc.rect(40, doc.y, contentWidth, 35).stroke('#d1d5db')
    doc.fontSize(7).fillColor('#6b7280').text(
      'Legal Notice: This AI-generated report is for preliminary assessment only. Not legal advice. Consult professionals.',
      45, doc.y + 5, { align: 'center', width: contentWidth - 10 }
    )
    
    // Footer
    doc.rect(40, doc.page.height - 30, contentWidth, 22).fill('#f1f5f9')
    doc.fontSize(7).fillColor('#64748b')
    doc.text('Naari Kavach | she-shield.naarikavach.in | v3.0', { align: 'center' })
    doc.text(`Report: ${analysis._id}`, { align: 'center' })
    doc.fillColor('#000000')

    doc.end()
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

module.exports = router
