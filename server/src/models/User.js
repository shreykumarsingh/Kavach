const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const trustedContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  relation: { type: String, enum: ['family', 'friend', 'guardian', 'other'], default: 'friend' },
  isVerified: { type: Boolean, default: false },
  notifyOnEmergency: { type: Boolean, default: true },
})

const emergencySettingsSchema = new mongoose.Schema({
  enableQuickSOS: { type: Boolean, default: true },
  shareLocationOnSOS: { type: Boolean, default: true },
  autoAlertAfterMinutes: { type: Number, default: 5 },
})

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  phone: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
  },
  studentId: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  fingerprints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fingerprint',
  }],
  trustedContacts: [trustedContactSchema],
  emergencySettings: {
    type: emergencySettingsSchema,
    default: () => ({}),
  },
  safetyScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
