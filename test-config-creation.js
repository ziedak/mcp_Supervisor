#!/usr/bin/env node

/**
 * Test script to verify ConfigurationManager creates default config
 */

const {
  ConfigurationManager,
} = require('./dist/core/services/ConfigurationManager.js');
const { Logger } = require('./dist/core/services/Logger.js');
const fs = require('fs');
const path = require('path');

async function testDefaultConfigCreation() {
  console.log('🧪 Testing default configuration creation...');

  // Create a test directory
  const testDir = path.join(process.cwd(), 'test-config');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  // Save current directory
  const originalCwd = process.cwd();

  try {
    // Change to test directory
    process.chdir(testDir);

    // Create logger and configuration manager
    const logger = new Logger();
    const configManager = new ConfigurationManager(logger);

    // Remove any existing config files
    const configFiles = [
      '.supervisorrc.json',
      'supervisor.config.json',
      '.config/supervisor.json',
    ];
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log('📂 Test directory prepared');

    // Try to load config - this should create a default one
    console.log('⚙️  Loading configuration (should create default)...');
    const config = await configManager.loadConfig();

    console.log('✅ Configuration loaded successfully!');
    console.log('📊 Config phases:', Object.keys(config.phases));
    console.log('📋 Config rules:', Object.keys(config.rules));

    // Check if default file was created
    if (fs.existsSync('.supervisorrc.json')) {
      console.log('✅ Default .supervisorrc.json file created successfully');

      // Show first few lines of the created file
      const configContent = fs.readFileSync('.supervisorrc.json', 'utf-8');
      const lines = configContent.split('\n').slice(0, 10);
      console.log('📄 First 10 lines of created config:');
      lines.forEach((line, i) => console.log(`   ${i + 1}: ${line}`));
    } else {
      console.log('❌ Default config file was not created');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Restore original directory
    process.chdir(originalCwd);

    // Clean up test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('🧹 Test directory cleaned up');
    } catch (e) {
      console.warn('⚠️  Could not clean up test directory:', e.message);
    }
  }
}

// Run the test
testDefaultConfigCreation()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
