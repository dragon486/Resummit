const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log('Gemini API Key loaded length:', key ? key.length : 0);
console.log('First 6 chars:', key ? key.substring(0, 6) : 'N/A');

if (!key) {
  console.error('Error: GEMINI_API_KEY is not defined in .env');
  process.exit(1);
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    
    console.log('Sending test prompt to Gemini...');
    const result = await model.generateContent('Return JSON: {"status": "ok"}');
    console.log('Gemini raw response text:', result.response.text());
    console.log('🎉 SUCCESS: Gemini API is working perfectly!');
  } catch (err) {
    console.error('❌ FAILURE: Gemini API returned an error:');
    console.error(err);
  }
}

testGemini();
