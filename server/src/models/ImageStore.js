const mongoose = require('mongoose')

const imageStoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  caseId: {
    type: String,
  },
  fileName: {
    type: String,
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
  fileHash: {
    type: String,
    required: true,
  },
  pHash: {
    type: String,
  },
  mimeType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

imageStoreSchema.index({ fileHash: 1 })
imageStoreSchema.index({ pHash: 1 })
imageStoreSchema.index({ createdAt: -1 })

module.exports = mongoose.model('ImageStore', imageStoreSchema)
