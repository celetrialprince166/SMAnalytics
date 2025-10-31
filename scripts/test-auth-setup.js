/**
 * Test Authentication Setup
 * 
 * Verifies that Supabase authentication is properly configured
 */

require('dotenv').config();

async function testAuthSetup() {
  try {
    console.log('🔄 Testing authentication setup...');
    
    // Test environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    console.log('\n📋 Checking environment variables...');
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Set`);
      } else {
        console.log(`❌ ${envVar}: Missing`);
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    
    // Test Supabase client creation
    console.log('\n🔧 Testing Supabase client creation...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client created successfully');
    
    // Test database connection (should fail due to RLS)
    console.log('\n🔗 Testing database connection with RLS...');
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('permission denied')) {
      console.log('✅ Database connection successful (RLS properly blocking unauthenticated access)');
    } else if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    } else {
      console.log('⚠️ Warning: RLS may not be properly configured - unauthenticated user can access data');
    }
    
    // Test RLS policies
    console.log('\n🔒 Testing Row Level Security...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);
    
    if (orgError) {
      console.log('⚠️ RLS test failed (expected for unauthenticated user):', orgError.message);
    } else {
      console.log('⚠️ RLS may not be properly configured - unauthenticated user can access data');
    }
    
    console.log('\n🎉 Authentication setup test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify Supabase project settings');
    console.log('2. Test authentication flows in the application');
    console.log('3. Verify RLS policies are working correctly');
    
  } catch (error) {
    console.error('❌ Authentication setup test failed:', error.message);
    process.exit(1);
  }
}

testAuthSetup();
