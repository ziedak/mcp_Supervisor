#!/usr/bin/env node

/**
 * Demo script showing the system works out of the box with default configuration
 */

const {
  ConfigurationManager,
} = require('./dist/core/services/ConfigurationManager.js');
const { Logger } = require('./dist/core/services/Logger.js');

async function demonstrateOutOfTheBox() {
  console.log('🚀 MCP Supervisor - Out of the Box Demo');
  console.log('=====================================\n');

  try {
    // Create services
    const logger = new Logger();
    const configManager = new ConfigurationManager(logger);

    console.log('📦 Loading configuration...');
    const config = await configManager.loadConfig();

    console.log('✅ Configuration loaded successfully!\n');

    console.log('📊 System Summary:');
    console.log(`   Phases: ${Object.keys(config.phases).length}`);
    console.log(`   Rules: ${Object.keys(config.rules).length}`);
    console.log(`   Rule Groups: ${Object.keys(config.ruleGroups).length}`);
    console.log(
      `   Required Plan Sections: ${config.plan.requiredSections.length}\n`
    );

    console.log('🎯 Available Phases:');
    Object.entries(config.phases).forEach(([phase, phaseConfig]) => {
      const rules = phaseConfig.enforce || [];
      const planRequired = phaseConfig.requirePlan ? '📋' : '  ';
      const approvalRequired = phaseConfig.requireHumanApproval ? '👤' : '  ';
      console.log(
        `   ${planRequired}${approvalRequired} ${phase.padEnd(12)} (${rules.length} rules)`
      );
    });

    console.log('\n📋 Plan Requirements:');
    config.plan.requiredSections.forEach(section => {
      console.log(`   • ${section}`);
    });

    console.log('\n⚙️  Active Rules:');
    Object.entries(config.rules).forEach(([ruleId, rule]) => {
      const enforcement = rule.enforcement === 'hard' ? '🔴' : '🟡';
      console.log(`   ${enforcement} ${ruleId.padEnd(20)} (${rule.type})`);
    });

    console.log('\n🎉 System is ready to use!');
    console.log('   The supervisor is configured with sensible defaults');
    console.log('   and will enforce quality standards throughout your');
    console.log('   development workflow.\n');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
demonstrateOutOfTheBox()
  .then(() => {
    console.log('✨ Demo completed successfully!');
  })
  .catch(error => {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  });
