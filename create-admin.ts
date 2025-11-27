// Create default admin user
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users } from './shared/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function createAdminUser() {
  try {
    console.log('👤 Creating default admin user...\n');
    
    const adminUser = await db.insert(users).values({
      email: 'ariikmathiang@gmail.com',
      firstName: 'Ariik',
      lastName: 'Mathiang',
      role: 'admin',
    }).returning();
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Email: ariikmathiang@gmail.com');
    console.log('🔑 Password: Mathiang211@');
    console.log('👨‍💼 Role: Admin');
    console.log('\n⚠️  IMPORTANT: You need to create this account in Firebase Auth first!');
    console.log('\nSteps:');
    console.log('1. Go to: http://localhost:3000');
    console.log('2. Click "Sign up"');
    console.log('3. Use the email and password above');
    console.log('4. Firebase will create the account');
    console.log('5. The system will sync with this database entry\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
