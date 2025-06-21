// services/ai/googleAiService.ts
import {
  GenerativeModel,
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Safety settings for AI model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export class GoogleAiService {
  private model: GenerativeModel | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize();
  }

  private initialize() {
    if (!this.apiKey) {
      console.error("No API key provided to Google AI Service");
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings,
      });
      // Google AI Service initialized successfully
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error initializing Google AI: ${errorMessage}`, error);
      this.model = null;
    }
  }

  // Improved test method with proper error handling
  async testApiKey(): Promise<boolean> {
    // Testing Google AI API key...

    if (!this.apiKey) {
      console.error("No API key provided");
      throw new Error("API key is required");
    }

    if (!this.model) {
      console.error("AI model not initialized");
      throw new Error("AI model not initialized");
    }

    // Simple prompt to test if the API key works - with timeout
    try {
      const testPrompt =
        "Respond with only the word 'verified' if you can read this message.";

      // Create a timeout promise that rejects after 5 seconds
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("API request timed out")), 5000),
      );

      // Race the actual API call against the timeout
      const resultPromise = this.model.generateContent(testPrompt);
      const result = await Promise.race([resultPromise, timeout]);

      const responseText = result.response.text().trim().toLowerCase();
      // API key test response

      // Check that we got a legitimate response
      return responseText.includes("verified");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`API key verification failed: ${errorMessage}`, error);
      throw new Error(`Invalid API key: ${errorMessage}`);
    }
  }

  async generateTaskSuggestions(tasks: any[], prompt: string): Promise<any> {
    if (!this.model) {
      throw new Error("AI model not initialized");
    }

    // Format tasks for the AI
    const tasksFormatted = tasks
      .map(
        (task) => `
      Task: ${task.title}
      Description: ${task.description || "No description"}
      Priority: ${task.priority}
      Status: ${task.status || "Unknown"}
      Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
    `,
      )
      .join("\n\n");

    // Create system prompt
    const systemPrompt = `
      You are a project management assistant. You will be provided with a list of tasks and asked to provide insights.
      When analyzing tasks, consider:
      1. Task priorities
      2. Due dates
      3. Dependencies
      4. Resource allocation
      5. Risk factors

      Format your suggestions as actionable insights with specific recommendations.
      For each suggestion, include a "type" (priority, scheduling, risk, dependency)
      and provide 1-2 specific actions the user could take.
    `;

    // User prompt
    const userPrompt = `
      Here are my current tasks:

      ${tasksFormatted}

      ${prompt}

      Provide your response as valid JSON with the following structure:
      {
        "suggestions": [
          {
            "title": "Brief title of suggestion",
            "description": "Detailed explanation",
            "type": "priority|risk|dependency|scheduling",
            "actions": ["Action 1", "Action 2"]
          }
        ]
      }
    `;

    try {
      // Generating task suggestions...
      const result = await this.model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          {
            role: "model",
            parts: [
              {
                text: "I understand. I'll help analyze the tasks and provide structured suggestions.",
              },
            ],
          },
          { role: "user", parts: [{ text: userPrompt }] },
        ],
      });

      const responseText = result.response.text();

      // Extract JSON from response
      const jsonMatch =
        responseText.match(/```json([\s\S]*?)```/) ||
        responseText.match(/{[\s\S]*}/);

      const jsonStr = jsonMatch
        ? jsonMatch[1]
          ? jsonMatch[1].trim()
          : jsonMatch[0].trim()
        : responseText;

      try {
        const parsedData = JSON.parse(jsonStr);
        return parsedData;
      } catch (parseError) {
        const errorMessage =
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error";
        console.error(`Error parsing AI response: ${errorMessage}`, parseError);
        throw new Error("Failed to parse AI response");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Error generating AI content: ${errorMessage}`, error);
      throw error;
    }
  }
}
