/**
 * This script helps set up the production environment variables
 * Run with: node setup-production-env.js
 */

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaultValues = {
  REACT_APP_API_URL: 'https://presken-gft-api.onrender.com/api',
  SKIP_PREFLIGHT_CHECK: 'true'
};

console.log('\n=== Presken GFT Production Environment Setup ===\n');
console.log('This script will help you set up your production environment variables.');
console.log('Press Enter to accept the default values or type a new value.\n');

const questions = Object.keys(defaultValues).map(key => {
  return {
    name: key,
    default: defaultValues[key],
    message: `${key} [${defaultValues[key]}]: `
  };
});

const answers = {};

const askQuestion = (index) => {
  if (index >= questions.length) {
    writeEnvFile();
    return;
  }

  const question = questions[index];
  rl.question(question.message, (answer) => {
    answers[question.name] = answer || question.default;
    askQuestion(index + 1);
  });
};

const writeEnvFile = () => {
  let envContent = '';
  
  for (const [key, value] of Object.entries(answers)) {
    envContent += `${key}=${value}\n`;
  }

  fs.writeFileSync('.env.production', envContent);
  
  console.log('\n✅ Production environment variables have been set up successfully!');
  console.log('File created: .env.production');
  console.log('\nYou can now deploy your application to Vercel.');
  
  rl.close();
};

// Start asking questions
askQuestion(0);