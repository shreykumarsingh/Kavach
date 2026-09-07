require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const path = require('path')

const authRoutes = require('./routes/auth')
const analysisRoutes = require('./routes/analysis')
const searchRoutes = require('./routes/search')
const casesRoutes = require('./routes/cases')
const fingerprintRoutes = require('./routes/fingerprint')
const adminRoutes = require('./routes/admin')
const safetyRoutes = require('./routes/safety')
const completeAnalysisRoutes = require('./routes/completeAnalysis')

const app = express()

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/she-shield', {
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err))

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many authentication attempts, please try again later' },
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { message: 'Too many registration attempts from this IP' },
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  message: { message: 'Upload limit exceeded. Please try again later.' },
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/analysis/upload', uploadLimiter)
app.use('/api/search/search', uploadLimiter)
app.use('/api/search/upload', uploadLimiter)
app.use('/api/fingerprint/upload', uploadLimiter)
app.use('/api', apiLimiter)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/cases', casesRoutes)
app.use('/api/fingerprint', fingerprintRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/safety', safetyRoutes)
app.use('/api/complete-analysis', completeAnalysisRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      message: 'Cross-origin request blocked',
    })
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
