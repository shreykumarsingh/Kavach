const axios = require('axios')
const crypto = require('crypto')
const fs = require('fs')
const FormData = require('form-data')

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

const callAIService = async (filePath, analysisId, isUrl = false) => {
  let axiosError = null
  
  try {
    if (isUrl) {
      const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-url`, {
        url: filePath,
        analysisId,
      }, {
        timeout: 120000,
        validateStatus: (status) => status < 500,
      })
      
      if (response.status >= 400 || !response.data) {
        throw new Error(`AI service returned ${response.status}`)
      }
      return response.data
    } else {
      const formData = new FormData()
      
      formData.append('file', fs.createReadStream(filePath), {
        filename: filePath.split('/').pop(),
        contentType: 'application/octet-stream'
      })
      formData.append('analysisId', analysisId)

      const response = await axios.post(`${AI_SERVICE_URL}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
        validateStatus: (status) => status < 500,
      })

      if (response.status >= 400 || !response.data) {
        throw new Error(`AI service returned ${response.status}`)
      }
      
      return response.data
    }
  } catch (error) {
    console.error('AI Service Error:', error.message)
    axiosError = error
  }
  
  throw new Error(`AI service unavailable: ${axiosError?.message || 'Connection failed'}`)
}

const generateHash = (filePath) => {
  const hash = crypto.createHash('sha256')
  const fileData = fs.readFileSync(filePath)
  hash.update(fileData)
  return hash.digest('hex')
}

module.exports = {
  callAIService,
  generateHash,
}
