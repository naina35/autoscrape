import { ExecutionEnviornment } from "@/lib/types";
import { ExtractDataWithAiTask } from "../task/ExtractDataWithAi";
import prisma from "@/lib/prisma";
import { symmetricDecrypt } from "@/lib/credential";
import { GoogleGenAI } from "@google/genai";

export async function ExtractDataWithAiExecutor(
  enviornment: ExecutionEnviornment<typeof ExtractDataWithAiTask>
): Promise<boolean> {
  try {
    const credentialId = enviornment.getInput("Credentials");
    if (!credentialId) {
      enviornment.log.error("input -> credentials is not defined");
      return false;
    }
    const content = enviornment.getInput("Content");
    if (!content) {
      enviornment.log.error("input -> content is not defined");
      return false;
    }
    const prompt = enviornment.getInput("Prompt");
    if (!prompt) {
      enviornment.log.error("input -> prompt is not defined");
      return false;
    }

    const credential = await prisma.credential.findUnique({
      where: {
        id: credentialId,
      },
    });

    if (!credential) {
      enviornment.log.error("Credential not found");
      return false;
    }

    const plainCredentialValue = symmetricDecrypt(credential.value);

    if (!plainCredentialValue) {
      enviornment.log.error("Cannot decrypt credential");
      return false;
    }

    // Initialize the new Google GenAI client :cite[1]:cite[3]
    const ai = new GoogleGenAI({
      apiKey: plainCredentialValue,
    });

    const systemPrompt = "You are a webscraper helper that extracts data from HTML or text. You will be given a piece of text or HTML content as input and also the prompt with the data you have to extract. The response should always be only the extracted data as a JSON array or object, without any additional words or explanations. Analyze the input carefully and extract data precisely based on the prompt. If no data is found, return an empty JSON array. Work only with the provided content and ensure the output is always a valid JSON array without any surrounding text";

    // Use the latest Gemini 2.5 Flash model :cite[1]:cite[6]
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Current recommended model
      contents: `${systemPrompt}\n\nContent to analyze:\n${content}\n\nExtraction prompt:\n${prompt}\n\nExtracted data (JSON only):`,
      config: {
        temperature: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // Request structured JSON output :cite[1]
      },
    });

    const result = response.text;

    if (!result) {
      enviornment.log.error("Empty response from AI");
      return false;
    }

    enviornment.setOutput("Extracted Data", result);
    return true;

  } catch (error: any) {
    enviornment.log.error(`Gemini API Error: ${error.message}`);
    
    // Provide more specific error information
    if (error.message.includes("404") || error.message.includes("not found")) {
      enviornment.log.error("Model not found. Please check if you're using a valid model name like 'gemini-2.5-flash'");
    } else if (error.message.includes("API key") || error.message.includes("authentication")) {
      enviornment.log.error("Invalid API key. Please check your Google AI Studio API key");
    }
    
    return false;
  }
}