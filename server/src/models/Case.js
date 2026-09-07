const mongoose = require('mongoose')

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  analysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
  },
  title: {
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
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'closed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  notes: {
    type: String,
  },
  resolution: {
    type: String,
  },
}, {
  timestamps: true,
})

caseSchema.index({ status: 1 })
caseSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Case', caseSchema)
