const mongoose = require('mongoose')

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  caseId: {
    type: String,
    unique: true,
    sparse: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String,
  },
  fileType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  mimeType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  filePath: {
    type: String,
  },
  fileHash: {
    type: String,
  },
  url: {
    type: String,
  },
  description: {
    type: String,
  },
  reportingMode: {
    type: String,
    enum: ['anonymous', 'confidential'],
    default: 'anonymous',
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'processing',
  },
  aiServiceId: {
    type: String,
  },
}, {
  timestamps: true,
})

analysisSchema.index({ user: 1, createdAt: -1 })
analysisSchema.index({ fileHash: 1 })
analysisSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Analysis', analysisSchema)
