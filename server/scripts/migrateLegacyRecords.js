require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/she-shield'

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  caseId: { type: String },
  fileName: { type: String },
  originalFileName: { type: String },
  fileType: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  filePath: { type: String },
  fileHash: { type: String },
  url: { type: String },
  description: { type: String },
  reportingMode: { type: String },
  isAnonymous: { type: Boolean },
  result: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String },
  aiServiceId: { type: String },
}, { timestamps: true })

const Analysis = mongoose.model('Analysis', analysisSchema)

async function migrate() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  
  console.log('\n=== Running Legacy Record Migration ===\n')
  
  let fixed = 0
  let total = 0
  
  const analyses = await Analysis.find({ status: 'completed' }).lean()
  total = analyses.length
  console.log(`Found ${total} completed analyses`)
  
  for (const analysis of analyses) {
    let needsUpdate = false
    const updateObj = {}
    
    if (!analysis.result) {
      continue
    }
    
    if (analysis.result.aiDetection && !analysis.result.authenticityScore) {
      updateObj['result.authenticityScore'] = analysis.result.aiDetection.authenticityScore ?? 50
      updateObj['result.isDeepfake'] = analysis.result.aiDetection.isDeepfake ?? false
      updateObj['result.confidence'] = analysis.result.aiDetection.confidence ?? 50
      needsUpdate = true
      console.log(`  [${analysis._id}] Migrating aiDetection -> result fields`)
    }
    
    if (analysis.result.searchResult && !analysis.result.similarFound) {
      const sr = analysis.result.searchResult
      updateObj['result.similarFound'] = Array.isArray(sr.similarImages) ? sr.similarImages.length : 0
      needsUpdate = true
      console.log(`  [${analysis._id}] Setting similarFound: ${updateObj['result.similarFound']}`)
    }
    
    if (analysis.result.aiAnalysis && !analysis.result.aiAnalysis.redFlags) {
      updateObj['result.aiAnalysis.redFlags'] = []
      needsUpdate = true
      console.log(`  [${analysis._id}] Adding empty redFlags array`)
      
    }
    
    if (analysis.result.ganFingerprintAnalysis && typeof analysis.result.ganFingerprintAnalysis.suspicious === 'undefined') {
      const gan = analysis.result.ganFingerprintAnalysis
      updateObj['result.ganFingerprintAnalysis.suspicious'] = (gan.score ?? 0) > 200
      needsUpdate = true
      console.log(`  [${analysis._id}] Calculating ganFingerprintAnalysis.suspicious`)
    }
    
    if (analysis.result.lightingAnalysis && typeof analysis.result.lightingAnalysis.consistent === 'undefined') {
      updateObj['result.lightingAnalysis.consistent'] = true
      needsUpdate = true
      console.log(`  [${analysis._id}] Setting default lightingAnalysis.consistent`)
    }
    
    if (needsUpdate) {
      await Analysis.findByIdAndUpdate(analysis._id, { $set: updateObj })
      fixed++
    }
  }
  
  console.log(`\n=== Migration Complete ===`)
  console.log(`Total: ${total}, Fixed: ${fixed}`)
  
  const pendingCount = await Analysis.countDocuments({ status: 'processing' })
  if (pendingCount > 0) {
    console.log(`\nWarning: ${pendingCount} analyses still have 'processing' status`)
    console.log('These may be stuck. Consider running:')
    console.log('  db.analyses.updateMany({ status: "processing" }, { $set: { status: "failed" } })')
  }
  
  await mongoose.disconnect()
  console.log('\nDisconnected from MongoDB')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})