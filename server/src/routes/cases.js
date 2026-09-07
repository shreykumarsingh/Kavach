const express = require('express')
const router = express.Router()
const Case = require('../models/Case')
const { authenticate } = require('../middleware/auth')
const { sanitizeString } = require('../utils/security')

router.post('/create', authenticate, async (req, res) => {
  try {
    const { title, description, reportingMode, analysisId } = req.body

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters' })
    }

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ message: 'Description is required' })
    }

    if (!['anonymous', 'confidential'].includes(reportingMode)) {
      return res.status(400).json({ message: 'Invalid reporting mode' })
    }

    const sanitizedTitle = sanitizeString(title, 200)
    const sanitizedDescription = sanitizeString(description, 5000)

    const caseId = `CASE-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`

    const newCase = new Case({
      caseId,
      user: req.userId,
      analysis: analysisId,
      title: sanitizedTitle,
      description: sanitizedDescription,
      reportingMode,
      isAnonymous: reportingMode === 'anonymous',
    })

    await newCase.save()

    res.status(201).json({
      message: 'Case created successfully',
      case: newCase,
    })
  } catch (error) {
    console.error('Create case error:', error)
    res.status(500).json({ message: 'Failed to create case' })
  }
})

router.get('/list', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const query = { user: req.userId }
    if (status) query.status = status

    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('analysis')

    const total = await Case.countDocuments(query)

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cases' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('analysis')
      .populate('user', 'name email')

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' })
    }

    res.json({ case: caseItem })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch case' })
  }
})

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'investigating', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const caseItem = await Case.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' })
    }

    res.json({
      message: 'Status updated',
      case: caseItem,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' })
  }
})

router.post('/:id/response', authenticate, async (req, res) => {
  try {
    const { response } = req.body

    const caseItem = await Case.findById(req.params.id)
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' })
    }

    caseItem.responses.push({
      user: req.userId,
      message: response,
      isAdmin: req.user.role === 'admin',
    })

    await caseItem.save()

    res.json({
      message: 'Response added',
      case: caseItem,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to add response' })
  }
})

module.exports = router
