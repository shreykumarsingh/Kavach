const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const router = express.Router()

const { authenticate } = require('../middleware/auth')
const Analysis = require('../models/Analysis')
const Fingerprint = require('../models/Fingerprint')
const ImageStore = require('../models/ImageStore')
const { generateSecureFilename, validateFileMagicBytes } = require('../utils/security')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

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
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
  const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase()
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`), false)
  }
  
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

// ============================================
// COMPLETE ANALYSIS API
// Follows EXACT decision logic from requirements
// ============================================

router.post('/analyze', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileData = fs.readFileSync(req.file.path)
    const magicValidation = validateFileMagicBytes(fileData, req.file.mimetype)
    if (!magicValidation.valid) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: 'Invalid file content' })
    }

    // Generate case ID
    const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // ============================================
    // STEP 1: Get user's registered reference image
    // ============================================
    const userFingerprints = await Fingerprint.find({ 
      user: req.userId, 
      isActive: true 
    }).sort({ createdAt: -1 }).limit(1)

    let referenceImagePath = null
    if (userFingerprints.length > 0 && userFingerprints[0].filePath) {
      referenceImagePath = userFingerprints[0].filePath
    }

    // ============================================
    // STEP 2: Call AI Service for Complete Analysis
    // ============================================
    const formData = new FormData()
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    // If we have a reference image, append it
    if (referenceImagePath && fs.existsSync(referenceImagePath)) {
      formData.append('referenceImage', fs.createReadStream(referenceImagePath), {
        filename: 'reference.jpg',
        contentType: 'image/jpeg'
      })
    }

    let aiResult = null
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/complete-analysis`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000,
        }
      )
      aiResult = aiResponse.data
    } catch (aiError) {
      console.log('AI service error:', aiError.message)
      // Fallback: do basic analysis without AI
      aiResult = {
        matchScore: 0,
        isMatch: false,
        aiConfidence: 50,
        isAI: false,
        authenticityScore: 50,
        finalResult: '⚠️ Analysis unavailable',
        resultType: 'warning'
      }
    }

    // ============================================
    // STEP 3: Apply FINAL DECISION LOGIC
    // (Backend also validates the logic)
    // ============================================
    const { matchScore, isMatch, aiConfidence, isAI, authenticityScore } = aiResult

    // EXACT LOGIC FROM REQUIREMENTS:
    // CASE 1: Match (≥60%) AND Real (isAI=false) → "✅ Content Appears Authentic"
    // CASE 2: Match (≥60%) AND AI (isAI=true) → "⚠️ Image May Be AI Generated"
    // CASE 3: Not Match (<60%) → "❌ Image Does Not Match Registered Identity"

    let finalResult = ''
    let resultType = 'safe'

    if (isMatch && !isAI) {
      // CASE 1
      finalResult = '✅ Content Appears Authentic'
      resultType = 'safe'
    } else if (isMatch && isAI) {
      // CASE 2
      finalResult = '⚠️ Image May Be AI Generated (Deepfake Detected)'
      resultType = 'warning'
    } else if (!isMatch) {
      // CASE 3
      finalResult = '❌ Image Does Not Match Registered Identity'
      resultType = 'danger'
    } else {
      finalResult = '⚠️ Unable to determine'
      resultType = 'warning'
    }

    // Save to database
    const analysis = new Analysis({
      user: req.userId,
      caseId,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'completed',
      result: {
        matchScore,
        isMatch,
        aiConfidence,
        isAI,
        authenticityScore,
        finalResult,
        resultType,
        hasReferenceImage: !!referenceImagePath,
        referenceImageUsed: !!referenceImagePath
      }
    })

    await analysis.save()

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path)
    } catch (e) {}

    res.status(201).json({
      message: 'Analysis completed',
      caseId,
      analysis: {
        matchScore,
        isMatch,
        aiConfidence,
        isAI,
        authenticityScore,
        finalResult,
        resultType,
        hasReferenceImage: !!referenceImagePath,
        referenceImageUsed: !!referenceImagePath
      }
    })

  } catch (error) {
    console.error('Analysis error:', error)
    
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    
    res.status(500).json({ message: 'Analysis failed: ' + error.message })
  }
})

// ============================================
// SEPARATE AI DETECTION ENDPOINT
// ============================================

router.post('/detect-ai', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/detect-ai`,
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    )

    try {
      fs.unlinkSync(req.file.path)
    } catch (e) {}

    res.json(aiResponse.data)

  } catch (error) {
    console.error('AI detection error:', error)
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    res.status(500).json({ message: 'Detection failed' })
  }
})

// ============================================
// SEPARATE FACE MATCH ENDPOINT
// ============================================

router.post('/face-match', authenticate, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'referenceImage', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(req.files.file[0].path), {
      filename: req.files.file[0].originalname,
      contentType: req.files.file[0].mimetype
    })

    if (req.files?.referenceImage) {
      formData.append('referenceImage', fs.createReadStream(req.files.referenceImage[0].path), {
        filename: req.files.referenceImage[0].originalname,
        contentType: req.files.referenceImage[0].mimetype
      })
    }

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/face-match`,
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    )

    // Cleanup
    try {
      fs.unlinkSync(req.files.file[0].path)
      if (req.files.referenceImage) {
        fs.unlinkSync(req.files.referenceImage[0].path)
      }
    } catch (e) {}

    res.json(aiResponse.data)

  } catch (error) {
    console.error('Face match error:', error)
    res.status(500).json({ message: 'Face matching failed' })
  }
})

module.exports = router
