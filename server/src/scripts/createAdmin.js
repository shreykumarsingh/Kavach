const mongoose = require('mongoose')
const User = require('../models/User')

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/she-shield')
  
  const adminEmail = 'admin@she-shield.edu'
  
  const existingAdmin = await User.findOne({ email: adminEmail })
  
  if (existingAdmin) {
    existingAdmin.role = 'admin'
    await existingAdmin.save()
    console.log('Admin role updated for:', adminEmail)
  } else {
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: 'Admin@123456', // Change this immediately after first login!
      college: 'Administration',
      role: 'admin'
    })
    console.log('Admin user created:', adminEmail)
  }
  
  await mongoose.disconnect()
}

createAdmin()
