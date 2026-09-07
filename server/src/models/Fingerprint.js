const mongoose = require('mongoose')

const fingerprintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  pHash: {
    type: String,
  },
  imageHash: {
    type: String,
  },
  faceEmbeddings: {
    type: String,
  },
  fileHash: {
    type: String,
  },
  metadata: {
    width: Number,
    height: Number,
    format: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

fingerprintSchema.index({ user: 1 })
fingerprintSchema.index({ pHash: 1 })

module.exports = mongoose.model('Fingerprint', fingerprintSchema)
