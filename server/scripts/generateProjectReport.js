require('dotenv').config()
const mongoose = require('mongoose')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/she-shield'

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'user' },
  college: String,
  isActive: Boolean,
}, { timestamps: true, collection: 'users' })

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caseId: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  fileHash: String,
  url: String,
  description: String,
  reportingMode: String,
  isAnonymous: Boolean,
  result: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: String,
}, { timestamps: true, collection: 'analyses' })

const caseSchema = new mongoose.Schema({
  caseId: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  status: String,
}, { timestamps: true, collection: 'cases' })

const fingerprintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  originalFileName: String,
  fileHash: String,
  pHash: String,
  isActive: Boolean,
}, { timestamps: true, collection: 'fingerprints' })

const User = mongoose.model('User', userSchema)
const Analysis = mongoose.model('Analysis', analysisSchema)
const Case = mongoose.model('Case', caseSchema)
const Fingerprint = mongoose.model('Fingerprint', fingerprintSchema)

async function generateReport() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  
  const stats = {
    users: await User.countDocuments(),
    analyses: await Analysis.countDocuments(),
    completedAnalyses: await Analysis.countDocuments({ status: 'completed' }),
    deepfakesDetected: (await Analysis.find({ 'result.isDeepfake': true })).length,
    cases: await Case.countDocuments(),
    fingerprints: await Fingerprint.countDocuments(),
  }
  
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: 'Naari Kavach Project Report' } })
  
  const outputPath = path.join(__dirname, '../../naari-kavach-project-report.pdf')
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)
  
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const contentWidth = pageWidth - 80
  
  const primaryColor = '#6366f1'
  const secondaryColor = '#1e1b4b'
  const accentPink = '#ec4899'
  const accentCyan = '#06b6d4'
  const successGreen = '#10b981'
  const warningYellow = '#f59e0b'
  const dangerRed = '#ef4444'
  
  doc.rect(0, 0, pageWidth, 160).fill('#0f172a')
  const gradient = doc.linearGradient(0, 0, pageWidth, 160)
  gradient.stop(0, '#1e1b4b')
  gradient.stop(1, '#312e81')
  doc.rect(0, 0, pageWidth, 160).fill(gradient)
  
  doc.fillColor('#ffffff')
  doc.fontSize(32).text('NAARI KAVACH', 0, 40, { align: 'center', width: pageWidth })
  doc.fontSize(14).fillColor('#a5b4fc').text('AI Media Protection & Rapid Response Platform', 0, 75, { align: 'center', width: pageWidth })
  doc.fontSize(11).fillColor('#94a3b8').text('Women Safety & Deepfake Detection System', 0, 95, { align: 'center', width: pageWidth })
  
  doc.moveDown(4)
  doc.fillColor('#fbbf24').fontSize(24).text('PROJECT STATUS REPORT', { align: 'center' })
  doc.moveDown(0.5)
  doc.fillColor('#94a3b8').fontSize(12).text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' })}`, { align: 'center' })
  
  doc.moveDown(2)
  doc.fillColor(secondaryColor).fontSize(14).text('Executive Summary', { underline: true })
  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#475569')
  doc.text('Naari Kavach (She Shield) is a comprehensive women safety platform that combines advanced AI-powered deepfake detection with reverse image search capabilities. The system enables users to analyze images for AI manipulation, search for similar images in a personal fingerprint database, and securely report incidents.', { align: 'justify', lineGap: 4 })
  
  doc.moveDown(1)
  
  const statsData = [
    { label: 'Total Users', value: stats.users, color: primaryColor },
    { label: 'Total Analyses', value: stats.analyses, color: accentCyan },
    { label: 'Deepfakes Detected', value: stats.deepfakesDetected, color: dangerRed },
    { label: 'Fingerprints', value: stats.fingerprints, color: accentPink },
  ]
  
  doc.moveDown(1)
  doc.fillColor(secondaryColor).fontSize(14).text('Platform Statistics', { underline: true })
  doc.moveDown(0.8)
  
  const statBoxWidth = (contentWidth - 30) / 4
  statsData.forEach((stat, i) => {
    const x = 40 + (i * (statBoxWidth + 10))
    doc.rect(x, doc.y, statBoxWidth, 55).fill('#f8fafc')
    doc.rect(x, doc.y, statBoxWidth, 4).fill(stat.color)
    doc.fillColor(secondaryColor).fontSize(9).text(stat.label.toUpperCase(), x, doc.y + 10, { align: 'center', width: statBoxWidth })
    doc.fillColor(stat.color).fontSize(22).text(stat.value.toString(), x, doc.y + 22, { align: 'center', width: statBoxWidth })
    doc.moveTo(x + 10, doc.y + 45).lineTo(x + statBoxWidth - 10, doc.y + 45).stroke('#e2e8f0')
  })
  
  doc.moveDown(4)
  doc.fillColor(secondaryColor).fontSize(14).text('Core Features Implemented', { underline: true })
  doc.moveDown(0.8)
  
  const features = [
    { name: 'AI-Powered Deepfake Detection', status: 'Active', desc: 'Multi-layer analysis including GAN fingerprint, face warping, lighting consistency, and metadata analysis' },
    { name: 'Reverse Image Search', status: 'Active', desc: 'Perceptual hash (pHash) based similarity matching with user fingerprint database' },
    { name: 'URL Analysis', status: 'Active', desc: 'Direct URL scanning capability for images hosted externally' },
    { name: 'Face Recognition & Fingerprinting', status: 'Active', desc: 'Personal photo registry for comparison against analyzed images' },
    { name: 'Secure Case Management', status: 'Active', desc: 'Anonymous and confidential reporting modes with case tracking' },
    { name: 'Emergency Alert System', status: 'Active', desc: 'Quick SOS with trusted contacts and location sharing capabilities' },
  ]
  
  features.forEach((feat) => {
    const yPos = doc.y
    doc.rect(40, yPos, 8, 8).fill(primaryColor)
    doc.fillColor(secondaryColor).fontSize(11).text(feat.name, 55, yPos - 2)
    
    const statusColor = feat.status === 'Active' ? successGreen : warningYellow
    doc.rect(contentWidth - 10, yPos - 3, 6, 6).fill(statusColor)
    doc.fillColor('#64748b').fontSize(8).text(feat.status, contentWidth + 2, yPos - 2)
    
    doc.moveDown(0.3)
    doc.fillColor('#64748b').fontSize(9).text(feat.desc)
    doc.moveDown(0.8)
  })
  
  doc.moveDown(1)
  doc.fillColor(secondaryColor).fontSize(14).text('Security & Hardening', { underline: true })
  doc.moveDown(0.8)
  
  const securityItems = [
    'File Magic Byte Validation - Validates actual file content vs extension',
    'Input Sanitization - XSS, SQL/NoSQL injection protection on all routes',
    'Rate Limiting - Upload (20/hr), Auth (20/15min), Emergency alerts',
    'JWT Security - Secret validation with error throw (no insecure fallback)',
    'CORS Configuration - Whitelist based origin validation, returns 403 on rejection',
    'Malicious Content Detection - Hex dump analysis for embedded threats',
  ]
  
  securityItems.forEach((item) => {
    doc.fillColor(successGreen).fontSize(10).text('✓', 40, doc.y)
    doc.fillColor('#334155').fontSize(10).text(item, 55, doc.y - 2)
    doc.moveDown(0.5)
  })
  
  if (doc.y > pageHeight - 200) {
    doc.addPage()
  }
  
  doc.moveDown(1)
  doc.fillColor(secondaryColor).fontSize(14).text('Technical Architecture', { underline: true })
  doc.moveDown(0.8)
  
  const techData = [
    { layer: 'Frontend', tech: 'React + Vite + Tailwind', port: '3000/5173' },
    { layer: 'Backend', tech: 'Node.js + Express + MongoDB', port: '5001' },
    { layer: 'AI Service', tech: 'Python + PyTorch + OpenCV', port: '8001' },
    { layer: 'AI Models', tech: 'CLAUDE (Anthropic) + Custom ML', port: 'N/A' },
  ]
  
  const archBoxWidth = (contentWidth - 30) / 4
  techData.forEach((t, i) => {
    const x = 40 + (i * (archBoxWidth + 10))
    doc.rect(x, doc.y, archBoxWidth, 60).fill('#f1f5f9')
    doc.rect(x, doc.y, archBoxWidth, 3).fill(primaryColor)
    doc.fillColor(primaryColor).fontSize(9).text(t.layer.toUpperCase(), x, doc.y + 8, { align: 'center', width: archBoxWidth })
    doc.fillColor(secondaryColor).fontSize(10).text(t.tech, x, doc.y + 22, { align: 'center', width: archBoxWidth })
    doc.fillColor('#64748b').fontSize(8).text(`Port: ${t.port}`, x, doc.y + 45, { align: 'center', width: archBoxWidth })
  })
  
  doc.moveDown(4)
  doc.fillColor(secondaryColor).fontSize(14).text('Bug Fixes & Improvements', { underline: true })
  doc.moveDown(0.8)
  
  const bugFixes = [
    { fix: 'MongoDB Schema Fix', desc: 'Changed Analysis.result to Mixed type to preserve aiDetection, verdict, similarImages fields' },
    { fix: 'AI False Positives', desc: 'Added quality validation override - high Laplacian variance images get authenticity boost' },
    { fix: 'Threshold Adjustment', desc: 'Lowered deepfake threshold from <65 to <50 to reduce false positives' },
    { fix: 'Dashboard Display', desc: 'Fixed authenticity score showing 0% - now correctly reads from result.aiDetection.authenticityScore' },
    { fix: 'CORS Response', desc: 'Changed CORS rejection from 500 to 403 Forbidden' },
    { fix: 'URL Scan Mode', desc: 'Added URL toggle to Upload page with mode state and validation' },
    { fix: 'Legacy Migration', desc: 'Created migration script - fixed 24 of 35 legacy records with missing fields' },
  ]
  
  doc.fillColor(secondaryColor).fontSize(10)
  bugFixes.forEach((bf, i) => {
    doc.text(`${i + 1}. ${bf.fix}:`, { continued: true })
    doc.fillColor('#64748b').text(` ${bf.desc}`)
    doc.fillColor(secondaryColor)
    doc.moveDown(0.4)
  })
  
  if (doc.y > pageHeight - 150) {
    doc.addPage()
  }
  
  doc.moveDown(1)
  doc.fillColor(secondaryColor).fontSize(14).text('UI/UX Enhancements', { underline: true })
  doc.moveDown(0.8)
  
  const uiEnhancements = [
    'Complete AnalysisResult.jsx redesign with dark premium theme',
    'Animated score circle with gradient stroke and glow effect',
    'AI Generated badge with manipulation type display',
    'Red flags section for manipulated image indicators',
    'Upload.jsx file/URL mode toggle with validation',
    'Premium gradient backgrounds and glass-morphism effects',
    'Responsive design with mobile-friendly layouts',
  ]
  
  uiEnhancements.forEach((ui) => {
    doc.fillColor(accentPink).fontSize(10).text('◆', 40, doc.y)
    doc.fillColor('#334155').fontSize(10).text(` ${ui}`)
    doc.moveDown(0.4)
  })
  
  doc.moveDown(1.5)
  doc.fillColor(secondaryColor).fontSize(14).text('API Endpoints Overview', { underline: true })
  doc.moveDown(0.8)
  
  const endpoints = [
    { method: 'POST', path: '/api/auth/register', desc: 'User registration' },
    { method: 'POST', path: '/api/auth/login', desc: 'User authentication' },
    { method: 'POST', path: '/api/analysis/upload', desc: 'File-based deepfake analysis' },
    { method: 'POST', path: '/api/analysis/upload-url', desc: 'URL-based deepfake analysis' },
    { method: 'POST', path: '/api/search/search', desc: 'Reverse image search' },
    { method: 'POST', path: '/api/fingerprint/upload', desc: 'Register face photo' },
    { method: 'POST', path: '/api/safety/emergency-alert', desc: 'Send SOS alert' },
    { method: 'GET', path: '/api/admin/project-report', desc: 'Generate this report' },
  ]
  
  const methodColors = { 'POST': primaryColor, 'GET': successGreen, 'PUT': warningYellow, 'DELETE': dangerRed }
  doc.fontSize(9)
  endpoints.forEach((ep) => {
    const mc = methodColors[ep.method] || '#64748b'
    doc.rect(40, doc.y, 50, 14).fill(mc)
    doc.fillColor('#ffffff').fontSize(8).text(ep.method, 40, doc.y + 3, { width: 50, align: 'center' })
    doc.fillColor(secondaryColor).text(` ${ep.path}`, 95, doc.y + 3)
    doc.fillColor('#64748b').text(` - ${ep.desc}`, { continued: false })
    doc.moveDown(0.3)
  })
  
  doc.moveDown(1.5)
  doc.rect(40, doc.y, contentWidth, 80).fill('#f8fafc')
  doc.rect(40, doc.y, 4, 80).fill(primaryColor)
  doc.fillColor(secondaryColor).fontSize(11).text('Project Roadmap', 55, doc.y + 10)
  doc.moveDown(0.8)
  doc.fontSize(9).fillColor('#475569')
  doc.text('• Phase 1 (Completed): Core platform with AI detection, search, and reporting', 55, doc.y)
  doc.text('• Phase 2 (In Progress): Security hardening and bug fixes', 55, doc.y + 12)
  doc.text('• Phase 3 (Planned): Web search integration, CAPTCHA for registration', 55, doc.y + 24)
  doc.text('• Phase 4 (Planned): Mobile app, real-time video analysis, blockchain evidence', 55, doc.y + 36)
  
  doc.moveDown(3)
  doc.fillColor('#94a3b8').fontSize(8).text('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
  doc.moveDown(0.5)
  doc.fillColor('#64748b').fontSize(8).text('Naari Kavach | she-shield.naarikavach.in | © 2026 All Rights Reserved', { align: 'center' })
  doc.text('This is an automated system-generated report. For technical support, contact the development team.', { align: 'center' })
  
  doc.end()
  
  stream.on('finish', async () => {
    console.log(`\n✅ Report generated successfully!`)
    console.log(`📄 Location: ${outputPath}`)
    await mongoose.disconnect()
    process.exit(0)
  })
}

generateReport().catch(err => {
  console.error('Report generation failed:', err)
  process.exit(1)
})