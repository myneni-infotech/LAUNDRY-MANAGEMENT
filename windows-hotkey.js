const robot = require('robotjs');

// Function to open Windows Start menu and then Settings
function openWindowsSettings() {
  try {
    console.log('Opening Windows Start menu...');
    
    // Press Windows key to open Start menu
    robot.keyTap('cmd');
    
    // Wait a moment for Start menu to open
    robot.setDelay(500);
    
    console.log('Typing "settings" in Start menu...');
    
    // Type "settings" to search for Settings app
    robot.typeString('settings');
    
    // Wait for search results
    robot.setDelay(1000);
    
    console.log('Opening Settings app...');
    
    // Press Enter to open Settings
    robot.keyTap('enter');
    
    console.log('Windows Settings should now be open!');
    
  } catch (error) {
    console.error('Error opening Windows Settings:', error);
  }
}

// Alternative method using direct Windows+I shortcut
function openSettingsDirectly() {
  try {
    console.log('Opening Windows Settings directly with Win+I...');
    
    // Press Windows+I to directly open Settings
    robot.keyTap('i', 'cmd');
    
    console.log('Windows Settings should now be open!');
    
  } catch (error) {
    console.error('Error opening Windows Settings:', error);
  }
}

// Method using Windows Run dialog
function openSettingsViaRun() {
  try {
    console.log('Opening Settings via Run dialog...');
    
    // Press Windows+R to open Run dialog
    robot.keyTap('r', 'cmd');
    
    // Wait for Run dialog to open
    robot.setDelay(500);
    
    // Type the Settings command
    robot.typeString('ms-settings:');
    
    // Wait briefly
    robot.setDelay(300);
    
    // Press Enter to execute
    robot.keyTap('enter');
    
    console.log('Windows Settings should now be open!');
    
  } catch (error) {
    console.error('Error opening Windows Settings:', error);
  }
}

// Export functions for use
module.exports = {
  openWindowsSettings,
  openSettingsDirectly,
  openSettingsViaRun
};

// If running this file directly, execute the direct method
if (require.main === module) {
  console.log('Choose a method:');
  console.log('1. Via Start menu search');
  console.log('2. Direct Win+I shortcut (recommended)');
  console.log('3. Via Run dialog');
  
  const method = process.argv[2] || '2';
  
  switch (method) {
    case '1':
      openWindowsSettings();
      break;
    case '2':
      openSettingsDirectly();
      break;
    case '3':
      openSettingsViaRun();
      break;
    default:
      openSettingsDirectly();
  }
}