import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  const MAX_RETRIES = 3; // number of retry attempts
  const RETRY_DELAY = 1000; // 1 second delay between retries

  const apiKey = process.env.GEMINI_API_KEY; 
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

  const { weatherData, city } = await request.json();

  const prompt = `
    Act as a solar energy expert. Analyze the following weather forecast for ${city} and estimate the daily solar panel output efficiency as a single percentage (0-100%) compared to a perfectly clear, sunny day.
    - Morning contributes 25% of the day
    - Afternoon contributes 35%
    - Evening contributes 25%
    - Night contributes 15%

    Weather condition modifiers (approximate ranges):
    - Tiada hujan = 90-100%
    - Berjerebu = 70-80%
    - Hujan = 20-50%
    - Hujan di beberapa tempat = 50-70%
    - Hujan di satu dua tempat = 60-75%
    - Ribut petir = 0-10%

    Use these modifiers to calculate a realistic **single integer percentage** for the whole day.  

    Respond ONLY with JSON:
    {
      "estimate_text": "Estimated Solar Output: XX% of a clear-day potential",
      "reasoning": "Brief 5-word reason"
    }

    Weather Data:
    - Morning: ${weatherData.morning_forecast}
    - Afternoon: ${weatherData.afternoon_forecast}
    - Evening: ${weatherData.summary_forecast}
    - Night: ${weatherData.night_forecast}
  `;


  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const result = await model.generateContent(prompt);
      console.log(result);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanedText);

      return NextResponse.json(data);
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      attempt++;

      if (attempt >= MAX_RETRIES) {
        console.error("Gemini API failed after retries:", error);
        return NextResponse.json(
          { estimate_text: "Estimated Solar Output: Calculation Unavailable" },
          { status: 500 }
        );
      }

      // wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}
