const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const User = require('../models/User')
const Analysis = require('../models/Analysis')
const { authenticate } = require('../middleware/auth')
const { sendEmergencyAlert, sendAnalysisReport } = require('../services/email')
const { sanitizeString, sanitizePhone, sanitizeEmail } = require('../utils/security')

const emergencyAlertLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Too many emergency alerts. Please wait before sending another.' },
})

router.get('/trusted-contacts', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    res.json({ contacts: user.trustedContacts || [] })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts' })
  }
})

router.post('/trusted-contacts', authenticate, async (req, res) => {
  try {
    const { name, phone, email, relation } = req.body
    
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' })
    }

    const sanitizedName = sanitizeString(name, 100)
    const sanitizedPhone = sanitizePhone(phone)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedRelation = sanitizeString(relation, 20)

    if (sanitizedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' })
    }

    const user = await User.findById(req.userId)
    
    if (!user.trustedContacts) user.trustedContacts = []
    
    if (user.trustedContacts.length >= 10) {
      return res.status(400).json({ message: 'Maximum 10 trusted contacts allowed' })
    }

    const newContact = {
      name: sanitizedName,
      phone: sanitizedPhone,
      email: sanitizedEmail || undefined,
      relation: sanitizedRelation || 'friend',
      isVerified: false,
      notifyOnEmergency: true,
    }

    user.trustedContacts.push(newContact)
    await user.save()

    res.status(201).json({
      message: 'Contact added successfully',
      contact: newContact,
    })
  } catch (error) {
    console.error('Add contact error:', error)
    res.status(500).json({ message: 'Failed to add contact' })
  }
})

router.put('/trusted-contacts/:index', authenticate, async (req, res) => {
  try {
    const { index } = req.params
    const { name, phone, email, relation, notifyOnEmergency } = req.body

    const user = await User.findById(req.userId)
    
    if (!user.trustedContacts || !user.trustedContacts[index]) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    user.trustedContacts[index] = {
      ...user.trustedContacts[index].toObject(),
      name: name ? sanitizeString(name, 100) : user.trustedContacts[index].name,
      phone: phone ? sanitizePhone(phone) : user.trustedContacts[index].phone,
      email: email ? sanitizeEmail(email) : user.trustedContacts[index].email,
      relation: relation ? sanitizeString(relation, 20) : user.trustedContacts[index].relation,
      notifyOnEmergency: notifyOnEmergency !== undefined ? !!notifyOnEmergency : user.trustedContacts[index].notifyOnEmergency,
    }

    await user.save()

    res.json({
      message: 'Contact updated',
      contact: user.trustedContacts[index],
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact' })
  }
})

router.delete('/trusted-contacts/:index', authenticate, async (req, res) => {
  try {
    const { index } = req.params

    const user = await User.findById(req.userId)
    
    if (!user.trustedContacts || !user.trustedContacts[index]) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    user.trustedContacts.splice(index, 1)
    await user.save()

    res.json({ message: 'Contact removed' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove contact' })
  }
})

router.post('/emergency-alert', authenticate, emergencyAlertLimiter, async (req, res) => {
  try {
    const { message, location, analysisId } = req.body

    const user = await User.findById(req.userId)
    
    if (!user.trustedContacts || user.trustedContacts.length === 0) {
      return res.status(400).json({ message: 'No trusted contacts configured' })
    }

    let analysis = null
    if (analysisId) {
      analysis = await Analysis.findById(analysisId)
    }

    const alertsSent = []
    const sanitizedMessage = sanitizeString(message, 500)
    const sanitizedLocation = sanitizeString(location, 200)
    
    for (const contact of user.trustedContacts) {
      if (contact.notifyOnEmergency) {
        try {
          if (contact.email) {
            await sendEmergencyAlert(contact.email, {
              userName: user.name,
              userPhone: user.phone,
              message: sanitizedMessage || 'Emergency alert triggered',
              location: sanitizedLocation,
              analysis: analysis ? {
                caseId: analysis.caseId,
                fileName: analysis.fileName,
                authenticityScore: analysis.result?.authenticityScore,
              } : null,
            })
            alertsSent.push(contact.email)
          }
        } catch (error) {
          console.error('Failed to send alert:', error)
        }
      }
    }

    res.json({
      message: 'Emergency alerts sent',
      alertsSent,
      contactsNotified: alertsSent.length,
    })
  } catch (error) {
    console.error('Emergency alert error:', error)
    res.status(500).json({ message: 'Failed to send emergency alert' })
  }
})

router.get('/safety-resources', async (req, res) => {
  try {
    const resources = {
      helplines: [
        { name: 'Women Helpline', number: '181', description: '24/7 Women Helpline', type: 'phone' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Number', type: 'phone' },
        { name: 'Women in Distress', number: '1091', description: 'Delhi Women Helpline', type: 'phone' },
        { name: 'Cyber Crime Reporting', number: '1930', description: 'Cyber Crime Helpline', type: 'phone' },
        { name: 'NCRB', number: '', url: 'https://cybercrime.gov.in', description: 'National Cyber Crime Reporting Portal', type: 'web' },
      ],
      legalRights: [
        {
          title: 'IT Act Section 66E',
          description: 'Punishment for violation of privacy - imprisonment up to 3 years or fine up to 2 lakhs',
        },
        {
          title: 'IT Act Section 66D',
          description: 'Punishment for cheating by personation by using computer resource',
        },
        {
          title: 'IPC Section 509',
          description: 'Word, gesture or act intended to insult the modesty of a woman',
        },
        {
          title: 'DGP Act',
          description: 'Digital Personal Data Protection Act 2023 for data privacy',
        },
      ],
      steps: [
        { step: 1, title: 'Document Everything', description: 'Screenshot, save URLs, record dates and times' },
        { step: 2, title: 'Report to Platform', description: 'Report the content on the platform where it appeared' },
        { step: 3, title: 'File Cyber Crime Complaint', description: 'Report at cybercrime.gov.in or visit local police station' },
        { step: 4, title: 'Get Medical Help', description: 'Seek counseling if emotional support is needed' },
        { step: 5, title: 'Legal Consultation', description: 'Consult with a lawyer specializing in cyber law' },
      ],
      mentalHealth: [
        { name: 'iCall', phone: '9152987821', description: 'Psychosocial helpline (Mon-Sat, 8am-10pm)' },
        { name: 'Vandrevala Foundation', phone: '1860-2662-357', description: '24/7 Mental health support' },
        { name: 'NIMHANS', phone: '+91-80-4611 0007', description: 'National Institute of Mental Health' },
      ],
    }

    res.json({ resources })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resources' })
  }
})

router.get('/safety-score', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    
    const analyses = await Analysis.find({ user: req.userId })
    
    let score = 100
    let factors = []

    if (analyses.length === 0) {
      factors.push({ factor: 'No analyses yet', impact: 0 })
    }

    const suspiciousCount = analyses.filter(a => a.result?.isDeepfake).length
    if (suspiciousCount > 0) {
      const deduction = Math.min(suspiciousCount * 5, 30)
      score -= deduction
      factors.push({ factor: `${suspiciousCount} suspicious content detected`, impact: -deduction })
    }

    const fingerprintCount = user.fingerprints?.length || 0
    if (fingerprintCount === 0) {
      score -= 10
      factors.push({ factor: 'No face protection registered', impact: -10 })
    } else if (fingerprintCount >= 3) {
      score += 5
      factors.push({ factor: 'Strong face protection', impact: +5 })
    }

    const contactCount = user.trustedContacts?.length || 0
    if (contactCount === 0) {
      score -= 5
      factors.push({ factor: 'No emergency contacts', impact: -5 })
    } else {
      score += 5
      factors.push({ factor: 'Emergency contacts configured', impact: +5 })
    }

    score = Math.max(0, Math.min(100, score))

    res.json({
      score,
      factors,
      recommendations: [
        score < 50 ? 'Register your face for enhanced protection' : null,
        contactCount === 0 ? 'Add trusted emergency contacts' : null,
        fingerprintCount < 3 ? 'Register at least 3 photos for better matching' : null,
      ].filter(Boolean),
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate safety score' })
  }
})

router.post('/update-activity', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { lastActive: new Date() })
    res.json({ message: 'Activity updated' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update activity' })
  }
})

module.exports = router
