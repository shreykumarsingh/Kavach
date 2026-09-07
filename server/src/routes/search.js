const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const ImageStore = require('../models/ImageStore')
const Analysis = require('../models/Analysis')
const Fingerprint = require('../models/Fingerprint')
const Case = require('../models/Case')
const { authenticate } = require('../middleware/auth')
const FormData = require('form-data')
const { validateFileMagicBytes, validateFileExtension, detectMaliciousContent, generateSecureFilename, isValidURL, sanitizeString } = require('../utils/security')

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

function calculateSimilarity(hash1, hash2) {
  try {
    const h1 = hash1.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
    const h2 = hash2.replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(16, '0').substring(0, 16)
    const xorResult = BigInt('0x' + h1) ^ BigInt('0x' + h2)
    const hammingDist = countSetBits(xorResult)
    return ((64 - hammingDist) / 64) * 100
  } catch (e) {
    return 0
  }
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
  // Allow common image extensions (case insensitive)
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
  const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase()
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`), false)
  }
  
  // Allow common image MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
  if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
    return cb(new Error('Invalid MIME type'), false)
  }
  
  cb(null, true)
}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
})

async function callAnalyzeWithRetry(formData, retries = 1) {
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000,
      })
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }
  throw lastError
}

router.post('/search', authenticate, upload.single('file'), async (req, res) => {
  let analysis = null
  let analysisSaved = false
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileData = fs.readFileSync(req.file.path)
    const fileSize = fileData.length

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

    let uploadedPHash = null
    let uploadedFileHash = null
    
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      })
      const response = await axios.post(`${AI_SERVICE_URL}/api/phash`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      })
      if (response.data) {
        uploadedPHash = response.data.phash
        uploadedFileHash = response.data.fileHash
      }
    } catch (e) {
      console.log('AI phash extraction failed:', e.message)
    }

    const caseId = `CASE-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
    const fileHash = crypto.createHash('sha256')
    fileHash.update(fileData)
    const hash = fileHash.digest('hex')

    if (!uploadedFileHash) {
      uploadedFileHash = hash
    }

    analysis = new Analysis({
      user: req.userId,
      caseId,
      fileName: req.file.originalname,
      originalFileName: req.file.originalname,
      fileType: 'image',
      mimeType: req.file.mimetype,
      fileSize: fileSize,
      filePath: req.file.path,
      fileHash: hash,
      status: 'processing',
    })
    await analysis.save()

    const SIMILARITY_THRESHOLD = 70
    
    const userFingerprints = await Fingerprint.find({ 
      user: req.userId,
      isActive: true
    })

    const similarImages = []
    
    for (const fp of userFingerprints) {
      let similarity = 0
      
      if (fp.fileHash === hash) {
        similarity = 100
      } else if (uploadedPHash && fp.pHash) {
        similarity = calculateSimilarity(uploadedPHash, fp.pHash)
      }
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        similarImages.push({
          _id: fp._id,
          originalFileName: fp.originalFileName,
          fileHash: fp.fileHash,
          pHash: fp.pHash,
          similarity: Math.round(similarity),
          uploadedBy: 'Your Registered Photo',
          uploadedAt: fp.createdAt,
          source: 'fingerprints',
        })
      }
    }

    similarImages.sort((a, b) => b.similarity - a.similarity)

    const imageStore = new ImageStore({
      user: req.userId,
      caseId,
      fileName: req.file.filename || req.file.originalname,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileHash: hash,
      pHash: uploadedPHash,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    })
    await imageStore.save()

    let aiDetection = null
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      })
      
      // Pass fingerprint data to AI service if we found matches
      if (similarImages.length > 0) {
        const similarity = similarImages[0].similarity
        // Map similarity to correct status
        let fpStatus = 'matched'
        if (similarity >= 95) {
          fpStatus = 'exact_match'
        } else if (similarity >= 70) {
          fpStatus = 'matched'
        } else {
          fpStatus = 'partial'
        }
        formData.append('fingerprintStatus', fpStatus)
        formData.append('fingerprintSimilarity', similarity.toString())
        formData.append('fingerprintMessage', `Face matched with ${similarity}% similarity to your registered photo`)
      }
      
      const aiResponse = await callAnalyzeWithRetry(formData, 1)
      console.log('AI Response status:', aiResponse.status)
      console.log('AI Response data:', JSON.stringify(aiResponse.data, null, 2))
      
      if (aiResponse.data) {
        const data = aiResponse.data
        console.log('AI Response data:', JSON.stringify(data))
        const isDeepfake = data.is_deepfake === true
        const authenticityScore = data.authenticity_score || data.authenticityScore || 50
        const confidence = data.confidence || 50
        
        aiDetection = {
          available: true,
          authenticityScore: authenticityScore,
          isDeepfake: isDeepfake,
          isUncertain: false,
          confidence: confidence,
          verdict: isDeepfake ? 'AI Generated / Deepfake' : 'Real / Authentic',
          confidenceLevel: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low',
          keyFindings: data.key_findings || null,
          manipulationType: isDeepfake ? 'ai_generated' : 'none',
          severity: isDeepfake ? 'high' : 'low',
          redFlags: data.red_flags || [],
          detailedAnalysis: data.detailedAnalysis || null,
          detailMetrics: data.detailMetrics || null,
          technicalDetails: data.technicalDetails || null,
          decisionState: isDeepfake ? 'deepfake_detected' : 'authentic',
          aiScore: data.aiScore || authenticityScore,
          rawResponse: data,
        }
      } else {
        console.log('AI Response has no data')
      }
    } catch (e) {
      console.log('AI detection failed:', e.message)
      // Default to uncertain when AI fails
      aiDetection = {
        available: true,
        authenticityScore: 50,
        isDeepfake: false,
        isUncertain: true,
        confidence: 30,
        verdict: 'Analysis Unavailable',
        confidenceLevel: 'Low',
        keyFindings: ['AI detection service unavailable'],
        manipulationType: null,
        severity: 'low',
        redFlags: [],
        detailedAnalysis: null,
        detailMetrics: null,
        technicalDetails: null,
        decisionState: 'uncertain',
        aiScore: 30,
      }
    }

    const fingerprintCount = await Fingerprint.countDocuments({ user: req.userId, isActive: true })
    
    // SIMPLE BINARY: Use AI service's is_deepfake directly
    const hasFaceMatch = similarImages.length > 0
    const isDeepfake = aiDetection?.isDeepfake === true
    const aiScore = aiDetection?.authenticityScore || aiDetection?.aiScore || 50
    
    let finalResult = {
      searchComplete: true,
      totalFingerprints: fingerprintCount,
      similarFound: similarImages.length,
      threshold: SIMILARITY_THRESHOLD,
      uploadedImageHash: hash,
      uploadedPHash: uploadedPHash,
      similarImages: similarImages.slice(0, 20),
      aiDetection: aiDetection,
      detailedAnalysis: aiDetection?.detailedAnalysis || null,
      detailMetrics: aiDetection?.detailMetrics || null,
    }
    
    // DIRECT BINARY DECISION - Trust AI service
    if (hasFaceMatch) {
      finalResult.authenticityScore = 100
      finalResult.verdict = 'Real / Authentic Photo'
      finalResult.verdictType = 'success'
      finalResult.isReal = true
      finalResult.isFaceMatch = true
      finalResult.message = 'Your photo verified - Face matched!'
    } else if (isDeepfake) {
      finalResult.authenticityScore = aiScore
      finalResult.verdict = 'Deepfake Detected'
      finalResult.verdictType = 'danger'
      finalResult.isReal = false
      finalResult.isFaceMatch = false
      finalResult.message = 'AI-generated or manipulated content detected by AI analysis.'
    } else {
      finalResult.authenticityScore = Math.max(50, aiScore)
      finalResult.verdict = 'Real / Authentic Photo'
      finalResult.verdictType = 'success'
      finalResult.isReal = true
      finalResult.isFaceMatch = false
      finalResult.message = 'No AI generation or manipulation detected.'
    }
    
    const result = finalResult

    console.log('Search POST - Saving result with keys:', Object.keys(result))
    console.log('Search POST - aiDetection:', result.aiDetection ? Object.keys(result.aiDetection) : 'none')
    
    analysis.result = result
    analysis.status = 'completed'
    await analysis.save()
    analysisSaved = true

    console.log('Search POST - Saved analysis with result:', analysis.result ? 'yes' : 'no')
    
    res.status(201).json({
      message: 'Search completed',
      analysis,
      searchResult: result,
    })
  } catch (error) {
    console.error('Search error:', error)
    
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    
    if (analysis && !analysisSaved) {
      try {
        analysis.result = { searchComplete: true, verdict: 'Search completed with warnings', verdictType: 'safe', error: error.message }
        analysis.status = 'completed'
        await analysis.save()
        return res.status(201).json({
          message: 'Search completed with warnings',
          analysis,
          searchResult: analysis.result,
        })
      } catch (saveError) {
        console.error('Failed to save fallback result:', saveError)
      }
    }
    
    res.status(500).json({ message: 'Search failed: ' + error.message })
  }
})

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { description, reportingMode } = req.body
    
    const fileData = fs.readFileSync(req.file.path)
    
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
      fileType: 'image',
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

    let uploadedPHash = null
    
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      })
      const response = await axios.post(`${AI_SERVICE_URL}/api/phash`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      })
      if (response.data) {
        uploadedPHash = response.data.phash
      }
    } catch (e) {
      console.log('AI phash extraction failed:', e.message)
    }

    const imageStore = new ImageStore({
      user: req.userId,
      caseId,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileHash: hash,
      pHash: uploadedPHash,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      isAnonymous: reportingMode === 'anonymous',
    })
    await imageStore.save()

    analysis.status = 'completed'
    await analysis.save()

    const newCase = new Case({
      caseId: analysis.caseId,
      user: analysis.user,
      title: 'Image: ' + analysis.originalFileName,
      description: description || 'No description provided',
      reportingMode: reportingMode || 'anonymous',
      isAnonymous: reportingMode === 'anonymous',
      status: 'pending',
      priority: 'medium',
      analysis: analysis._id,
    })
    await newCase.save()

    res.status(201).json({
      message: 'Upload completed',
      analysis,
      case: newCase,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Upload failed' })
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
    console.log('Search GET - result keys before conversion:', analysisObj.result ? Object.keys(analysisObj.result) : 'no result')
    console.log('Search GET - aiDetection keys:', analysisObj.result?.aiDetection ? Object.keys(analysisObj.result.aiDetection) : 'no aiDetection')
    
    if (analysisObj.result) {
      analysisObj.result = convertKeysToCamelCase(analysisObj.result)
    }
    
    console.log('Search GET - result keys after conversion:', analysisObj.result ? Object.keys(analysisObj.result) : 'no result')
    console.log('Search GET - aiDetection keys after:', analysisObj.result?.aiDetection ? Object.keys(analysisObj.result.aiDetection) : 'no aiDetection')

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
    res.setHeader('Content-Disposition', `attachment; filename=image-search-${analysis._id}.pdf`)

    doc.pipe(res)
    
    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 80

    doc.rect(0, 0, pageWidth, 50).fill('#1a365d')
    doc.fillColor('#ffffff')
    doc.fontSize(18).text('NAARI KAVACH', 0, 12, { align: 'center', width: pageWidth })
    doc.fontSize(9).text('AI Media Protection & Rapid Response Platform', 0, 32, { align: 'center', width: pageWidth })
    doc.fillColor('#000000')
    
    doc.moveDown(1.5)
    
    const reportDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    doc.fontSize(14).text('Reverse Image Search Report', { align: 'center' })
    doc.fontSize(8).fillColor('#64748b').text(`${reportDate} | Case: ${analysis.caseId || 'N/A'}`, { align: 'center' })
    doc.fillColor('#000000')
    
    doc.moveDown(1)

    const result = analysis.result || {}
    const similarCount = result.similarFound || 0
    const aiDetection = result.aiDetection
    
    const verdictColor = result.verdictType === 'danger' ? '#dc2626' : result.verdictType === 'warning' ? '#f59e0b' : '#16a34a'
    const bgColor = result.verdictType === 'danger' ? '#fef2f2' : result.verdictType === 'warning' ? '#fffbeb' : '#f0fdf4'
    
    doc.rect(40, doc.y, contentWidth, 60).fill(bgColor)
    doc.fontSize(10).fillColor(verdictColor).text(result.verdict || 'Analysis Complete', 40, doc.y + 15, { align: 'center', width: contentWidth })
    doc.fontSize(8).fillColor('#64748b').text(`Found ${similarCount} similar image(s)`, 40, doc.y + 35, { align: 'center', width: contentWidth })
    doc.fillColor('#000000')
    
    doc.moveDown(1.5)
    
    // AI Detection Section
    if (aiDetection) {
      doc.fontSize(10).text('AI Detection Analysis (Real vs Generated)')
      
      const aiColor = aiDetection.isDeepfake ? '#dc2626' : '#16a34a'
      const aiBgColor = aiDetection.isDeepfake ? '#fef2f2' : '#f0fdf4'
      
      doc.rect(40, doc.y, contentWidth, 70).fill(aiBgColor)
      doc.fontSize(9).fillColor(aiColor).text(aiDetection.verdict || (aiDetection.isDeepfake ? 'AI Generated / Manipulated' : 'Real / Authentic'), 50, doc.y + 8)
      doc.fontSize(14).text(`${aiDetection.authenticityScore || 0}% Authenticity`, 50, doc.y + 22)
      doc.fontSize(8).fillColor('#64748b').text(`Confidence: ${aiDetection.confidence || 0}% | Severity: ${aiDetection.severity || 'unknown'}`, 50, doc.y + 38)
      doc.fillColor('#000000')
      
      if (aiDetection.keyFindings) {
        doc.moveDown(0.5)
        doc.fontSize(8).text(`Findings: ${aiDetection.keyFindings}`)
      }
      
      // doc.moveDown(1)
    }
    
    doc.fontSize(10).text('File Information')
    doc.fontSize(8).text(`Name: ${analysis.fileName || 'N/A'} | Type: ${(analysis.fileType || 'N/A').toUpperCase()} | Size: ${analysis.fileSize ? formatBytes(analysis.fileSize) : 'N/A'}`)
    
    doc.moveDown(0.8)
    
    doc.fontSize(10).text('Image Fingerprint')
    doc.fontSize(7).fillColor('#64748b')
    doc.text(`SHA-256: ${analysis.fileHash || 'N/A'}`, 40, doc.y)
    doc.text(`pHash: ${result.uploadedPHash || 'N/A'}`, 40, doc.y + 12)
    doc.fillColor('#000000')
    
    if (result.similarImages?.length > 0) {
      doc.moveDown(1)
      doc.fontSize(10).text('Similar Images Found')
      
      result.similarImages.forEach((img, i) => {
        doc.fontSize(8)
        doc.text(`${i + 1}. ${img.originalFileName} - ${img.similarity}% match`, 40, doc.y)
        doc.fontSize(7).fillColor('#64748b')
        doc.text(`   Uploaded: ${new Date(img.uploadedAt).toLocaleDateString()} | By: ${img.uploadedBy}`, 40, doc.y)
        doc.fillColor('#000000')
      })
    }
    
    doc.moveDown(1)
    
    doc.rect(40, doc.y, contentWidth, 35).stroke('#d1d5db')
    doc.fontSize(7).fillColor('#6b7280').text(
      'Legal Notice: This report is for preliminary assessment only. Not legal advice. Consult professionals.',
      45, doc.y + 5, { align: 'center', width: contentWidth - 10 }
    )
    
    doc.rect(40, doc.page.height - 30, contentWidth, 22).fill('#f1f5f9')
    doc.fontSize(7).fillColor('#64748b')
    doc.text('Naari Kavach | she-shield.naarikavach.in', { align: 'center' })
    doc.text(`Report: ${analysis._id}`, { align: 'center' })
    doc.fillColor('#000000')

    doc.end()
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

module.exports = router
