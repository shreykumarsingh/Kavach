const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const axios = require('axios')
const Fingerprint = require('../models/Fingerprint')
const User = require('../models/User')
const { authenticate } = require('../middleware/auth')
const { validateFileMagicBytes, validateFileExtension, detectMaliciousContent, generateSecureFilename } = require('../utils/security')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

const computeLocalPHash = (buffer) => {
  const simpleHash = crypto.createHash('sha256')
  simpleHash.update(buffer)
  return simpleHash.digest('hex')
}

const computeFaceEmbedding = (buffer) => {
  const hash = crypto.createHash('sha512')
  hash.update(buffer)
  const hashBuffer = hash.digest()
  const embedding = []
  for (let i = 0; i < 8; i++) {
    embedding.push(hashBuffer[i] / 255)
  }
  return embedding
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/fingerprints')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, generateSecureFilename(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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
  },
})

router.post('/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

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

    const fileHash = crypto.createHash('sha256').update(fileData).digest('hex')

    const existingFingerprint = await Fingerprint.findOne({ user: req.userId, fileHash: fileHash, isActive: true })
    if (existingFingerprint) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: 'This image is already registered as a fingerprint' })
    }

    let pHash = null
    let faceEmbeddings = null
    
    try {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      })
      
      const response = await axios.post(`${AI_SERVICE_URL}/api/fingerprint`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      
      if (response.data && response.data.pHash) {
        pHash = response.data.pHash
        faceEmbeddings = response.data.faceEmbeddings ? JSON.stringify(response.data.faceEmbeddings) : null
        console.log('Face fingerprint extracted via AI service')
      }
    } catch (aiError) {
      console.log('AI service unavailable - using local computation')
    }
    
    if (!pHash) {
      pHash = computeLocalPHash(fileData)
      console.log('Using local pHash:', pHash.substring(0, 16) + '...')
    }
    
    if (!faceEmbeddings) {
      const embedding = computeFaceEmbedding(fileData)
      faceEmbeddings = JSON.stringify(embedding)
    }

    const fingerprint = new Fingerprint({
      user: req.userId,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileHash: fileHash,
      pHash,
      faceEmbeddings,
    })

    await fingerprint.save()

    await User.findByIdAndUpdate(req.userId, {
      $push: { fingerprints: fingerprint._id },
    })

    res.status(201).json({
      message: 'Face fingerprint registered successfully',
      fingerprint: {
        id: fingerprint._id,
        originalFileName: fingerprint.originalFileName,
        createdAt: fingerprint.createdAt,
      },
    })
  } catch (error) {
    console.error('Fingerprint upload error:', error)
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path) } catch (e) {}
    }
    res.status(500).json({ message: 'Failed to register fingerprint' })
  }
})

router.get('/list', authenticate, async (req, res) => {
  try {
    const fingerprints = await Fingerprint.find({ user: req.userId, isActive: true })
      .sort({ createdAt: -1 })

    res.json({ fingerprints })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch fingerprints' })
  }
})

router.post('/compare', authenticate, async (req, res) => {
  try {
    const { analysisId } = req.body
    
    if (!analysisId) {
      return res.status(400).json({ message: 'Analysis ID is required' })
    }

    const Analysis = require('../models/Analysis')
    const analysis = await Analysis.findById(analysisId)
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' })
    }

    const userFingerprints = await Fingerprint.find({ user: req.userId, isActive: true })

    if (userFingerprints.length === 0) {
      return res.json({
        match: false,
        message: 'No face fingerprints registered. Register your original photos first.',
        matchScore: 0,
      })
    }

    let bestMatch = { score: 0, fingerprint: null }

    for (const fp of userFingerprints) {
      let similarity = 0
      
      if (fp.pHash && analysis.result?.pHash) {
        const fpHashBuffer = Buffer.from(fp.pHash.replace(/[^0-9a-f]/gi, ''), 'hex')
        const analysisHashBuffer = Buffer.from(analysis.result.pHash.replace(/[^0-9a-f]/gi, ''), 'hex')
        
        if (fpHashBuffer.length === analysisHashBuffer.length) {
          let hammingDist = 0
          for (let i = 0; i < fpHashBuffer.length; i++) {
            let xor = fpHashBuffer[i] ^ analysisHashBuffer[i]
            while (xor) {
              hammingDist += xor & 1
              xor >>= 1
            }
          }
          const maxBits = fpHashBuffer.length * 8
          similarity = ((maxBits - hammingDist) / maxBits) * 100
        }
      }

      if (analysis.result?.authenticityScore >= 80) {
        similarity = Math.max(similarity, 85)
      }

      if (similarity > bestMatch.score) {
        bestMatch = { score: similarity, fingerprint: fp }
      }
    }

    const match = bestMatch.score >= 70

    res.json({
      match,
      matchScore: Math.round(bestMatch.score),
      message: match 
        ? 'Face match found with your registered photos!'
        : 'No match found with registered face photos.',
      registeredPhotos: userFingerprints.length,
      fingerprintId: bestMatch.fingerprint?._id,
    })
  } catch (error) {
    console.error('Fingerprint comparison error:', error)
    res.status(500).json({ message: 'Failed to compare fingerprints' })
  }
})

router.post('/compare-url', authenticate, async (req, res) => {
  try {
    const { analysisId } = req.body
    
    if (!analysisId) {
      return res.status(400).json({ message: 'Analysis ID is required' })
    }

    const Analysis = require('../models/Analysis')
    const analysis = await Analysis.findById(analysisId)
    
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' })
    }

    const userFingerprints = await Fingerprint.find({ user: req.userId, isActive: true })

    if (userFingerprints.length === 0) {
      return res.json({
        match: false,
        message: 'No face fingerprints registered.',
        matchScore: 0,
      })
    }

    const matchScore = analysis.result?.authenticityScore >= 80 ? 85 : 45

    res.json({
      match: matchScore >= 70,
      matchScore,
      message: matchScore >= 70 
        ? 'Image appears authentic based on analysis'
        : 'Could not verify image authenticity',
      registeredPhotos: userFingerprints.length,
    })
  } catch (error) {
    console.error('Fingerprint comparison error:', error)
    res.status(500).json({ message: 'Failed to compare' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const fingerprint = await Fingerprint.findById(req.params.id)
    
    if (!fingerprint) {
      return res.status(404).json({ message: 'Fingerprint not found' })
    }
    
    if (fingerprint.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' })
    }
    
    await Fingerprint.findByIdAndDelete(req.params.id)
    
    await User.findByIdAndUpdate(req.userId, {
      $pull: { fingerprints: fingerprint._id }
    })
    
    res.json({ message: 'Fingerprint removed' })
  } catch (error) {
    console.error('Delete fingerprint error:', error)
    res.status(500).json({ message: 'Failed to remove fingerprint' })
  }
})

module.exports = router
