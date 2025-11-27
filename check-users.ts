import 'dotenv/config';
import { db } from './server/storage';
import { users } from './shared/schema';

async function checkUsers() {
  try {
    console.log("\n🔍 Fetching all users from database...\n");
    
    const allUsers = await db.select().from(users);
    
    console.log(`📊 Total users: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log("⚠️ No users found in database!");
      console.log("\n💡 To create a mentor account:");
      console.log("1. Go to http://localhost:3000");
      console.log("2. Click 'Get Started' or Login button");
      console.log("3. Click 'Create Account'");
      console.log("4. Fill in details and select 'Mentor' from the 'I am a...' dropdown");
      console.log("5. Click 'Create Account'\n");
      return;
    }
    
    // Group by role
    const byRole = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("👥 Users by role:");
    Object.entries(byRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    
    console.log("\n📋 All users:");
    console.log("─".repeat(80));
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || ''}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log("─".repeat(80));
    });
    
    const mentors = allUsers.filter(u => u.role === 'mentor');
    
    if (mentors.length > 0) {
      console.log(`\n✅ Found ${mentors.length} mentor(s):`);
      mentors.forEach(m => {
        console.log(`   - ${m.firstName || m.email} (${m.email})`);
      });
    } else {
      console.log("\n⚠️ No mentors found!");
      console.log("\n💡 To convert an existing user to mentor:");
      console.log(`npm run update-role <email> mentor\n`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
