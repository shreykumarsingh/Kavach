const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const crypto = require('crypto')
const User = require('../models/User')
const { authenticate } = require('../middleware/auth')

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.error('⚠️  FATAL: JWT_SECRET not set in environment!')
    console.error('   Set JWT_SECRET env variable before production deployment!')
    throw new Error('JWT_SECRET environment variable is required')
  }
  return process.env.JWT_SECRET
}

const generateToken = (userId) => {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { expiresIn: '24h' }
  )
}

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh', iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { expiresIn: '7d' }
  )
}

router.post('/register', [
  body('name').trim().escape().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('college').trim().escape().notEmpty().withMessage('College is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { name, email, password, phone, college, studentId, adminCode } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    let isAdmin = false
    if (!process.env.ADMIN_SECRET_CODE) {
      console.error('⚠️  WARNING: ADMIN_SECRET_CODE not set! Admin registration disabled.')
    } else {
      isAdmin = adminCode === process.env.ADMIN_SECRET_CODE
    }
    
    const user = new User({
      name,
      email,
      password,
      phone: phone || undefined,
      college,
      studentId: studentId || undefined,
      role: isAdmin ? 'admin' : 'user',
    })

    await user.save()

    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    res.status(201).json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: user.toJSON(),
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: user.toJSON(),
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' })
    }

    const decoded = jwt.verify(refreshToken, getJwtSecret())
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' })
    }

    const newToken = generateToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
})

router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' })
  }
})

module.exports = router
