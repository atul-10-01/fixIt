/**
 * Google Gen AI client initialization and connection setup.
 */
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let ai: any = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("Successfully initialized GoogleGenAI client with key.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined or is placeholder. Falling back to high-fidelity AI simulator for demo.");
}

export { ai };
