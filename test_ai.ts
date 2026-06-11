import { generateAIResponse } from './server/services/aiService';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Testing AI Service...");
  try {
    const reply = await generateAIResponse([
      { role: "user", content: "What is the capital of France?" }
    ]);
    console.log("AI Reply:", reply);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
