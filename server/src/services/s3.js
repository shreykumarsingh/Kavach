const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
})

const uploadToS3 = async (filePath, key) => {
  try {
    const fileContent = require('fs').readFileSync(filePath)
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileContent,
      ServerSideEncryption: 'AES256',
    }

    const data = await s3.upload(params).promise()
    return data.Location
  } catch (error) {
    console.error('S3 upload error:', error)
    throw error
  }
}

const downloadFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    }

    const data = await s3.getObject(params).promise()
    return data.Body
  } catch (error) {
    console.error('S3 download error:', error)
    throw error
  }
}

const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    }

    await s3.deleteObject(params).promise()
  } catch (error) {
    console.error('S3 delete error:', error)
    throw error
  }
}

module.exports = {
  uploadToS3,
  downloadFromS3,
  deleteFromS3,
}
