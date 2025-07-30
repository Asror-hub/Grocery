const { Admin } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email: 'admin@test.com' } });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await Admin.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '+1234567890',
      password: hashedPassword,
      status: 'active'
    });

    console.log('Admin user created successfully:', {
      id: admin.id,
      email: admin.email,
      name: admin.name
    });
    
    console.log('Login credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 