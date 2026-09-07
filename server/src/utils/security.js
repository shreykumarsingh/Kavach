const crypto = require('crypto')

const FILE_SIGNATURES = {
  'image/jpeg': {
    signatures: [
      { bytes: [0xFF, 0xD8, 0xFF, 0xDB], offset: 0 },
      { bytes: [0xFF, 0xD8, 0xFF, 0xE0], offset: 0 },
      { bytes: [0xFF, 0xD8, 0xFF, 0xE1], offset: 0 },
      { bytes: [0xFF, 0xD8, 0xFF, 0xE2], offset: 0 },
      { bytes: [0xFF, 0xD8, 0xFF, 0xE3], offset: 0 },
      { bytes: [0xFF, 0xD8, 0xFF, 0xE8], offset: 0 },
    ],
    extensions: ['.jpg', '.jpeg']
  },
  'image/png': {
    signatures: [
      { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
    ],
    extensions: ['.png']
  },
  'image/webp': {
    signatures: [
      { bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50], offset: 0, pattern: 'RIFF....WEBP' },
    ],
    extensions: ['.webp']
  }
}

const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return ''
  
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"&]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/<script/gi, '')
    .replace(/<iframe/gi, '')
}

const validateFileMagicBytes = (buffer, mimeType) => {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File too small to validate' }
  }

  const signature = FILE_SIGNATURES[mimeType]
  if (!signature) {
    return { valid: false, error: 'Unsupported file type' }
  }

  for (const sig of signature.signatures) {
    let match = true
    
    if (sig.pattern) {
      const patternBytes = Buffer.from(sig.pattern.replace(/\./g, ''), 'ascii')
      for (let i = 0; i < patternBytes.length; i++) {
        if (sig.bytes[i] !== null && buffer[i + sig.offset] !== sig.bytes[i]) {
          match = false
          break
        }
      }
    } else {
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[i + sig.offset] !== sig.bytes[i]) {
          match = false
          break
        }
      }
    }
    
    if (match) {
      return { valid: true }
    }
  }

  return { valid: false, error: 'File magic bytes do not match declared type' }
}

const validateFileExtension = (filename, allowedExtensions) => {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Invalid filename' }
  }

  const ext = '.' + filename.split('.').pop().toLowerCase()
  const normalizedExtensions = allowedExtensions.map(e => e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase())

  if (!normalizedExtensions.includes(ext)) {
    return { valid: false, error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` }
  }

  return { valid: true }
}

const validateMIMEType = (mimeType, allowedTypes) => {
  if (!mimeType || typeof mimeType !== 'string') {
    return { valid: false, error: 'Invalid MIME type' }
  }

  const normalizedAllowed = allowedTypes.map(t => t.toLowerCase())
  const normalizedMime = mimeType.toLowerCase()

  if (!normalizedAllowed.includes(normalizedMime)) {
    return { valid: false, error: `Invalid MIME type. Allowed: ${allowedTypes.join(', ')}` }
  }

  return { valid: true }
}

const generateSecureFilename = (originalName) => {
  const ext = '.' + originalName.split('.').pop().toLowerCase()
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(8).toString('hex')
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50)
  return `${timestamp}-${randomBytes}-${sanitizedName}${ext}`
}

const isValidURL = (url) => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/[^0-9+()-]/g, '').slice(0, 20)
}

const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase().slice(0, 254)
}

const validateFileSize = (size, maxSizeMB) => {
  const maxBytes = maxSizeMB * 1024 * 1024
  if (size > maxBytes) {
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed (${maxSizeMB}MB)`,
      actual: `${(size / 1024 / 1024).toFixed(2)}MB`,
      max: `${maxSizeMB}MB`
    }
  }
  return { valid: true }
}

const detectMaliciousContent = (buffer) => {
  const patterns = [
    { pattern: '<script', name: 'Script tag' },
    { pattern: 'javascript:', name: 'JavaScript protocol' },
    { pattern: '<iframe', name: 'Iframe tag' },
    { pattern: 'onerror=', name: 'Error handler' },
    { pattern: 'onload=', name: 'Load handler' },
    { pattern: 'eval(', name: 'Eval function' },
    { pattern: 'base64', name: 'Base64 encoded content' },
  ]

  try {
    const str = buffer.toString('utf8', 0, Math.min(buffer.length, 100000))
    
    for (const { pattern, name } of patterns) {
      if (str.toLowerCase().includes(pattern.toLowerCase())) {
        return { malicious: true, reason: `Potential ${name} injection` }
      }
    }
  } catch (e) {
    return { malicious: false }
  }

  return { malicious: false }
}

module.exports = {
  FILE_SIGNATURES,
  sanitizeString,
  validateFileMagicBytes,
  validateFileExtension,
  validateMIMEType,
  generateSecureFilename,
  isValidURL,
  sanitizePhone,
  sanitizeEmail,
  validateFileSize,
  detectMaliciousContent,
}
