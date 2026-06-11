import OpenAI from 'openai';
import '../config'; // Ensure dotenv is loaded

let client: OpenAI | null = null;
let deploymentName: string = "gpt-5.4";

function getClient() {
  if (!client) {
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT || "https://gorgeous-ai-2.services.ai.azure.com/openai/v1";
    const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
    deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5.4";

    client = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: { 
        "api-key": apiKey 
      }
    });
  }
  return client;
}

import { openAITools, executeTool } from './aiTools';

const SYSTEM_PROMPT = `
You are a highly intelligent financial assistant and database agent for the WorkSpace application.
You have the ability to deeply understand and manipulate the application's data via function calling.
If the user asks questions about data, statistics, or metrics, you MUST use the execute_database_query tool to fetch real data from the database.
If you don't know the exact schema, use the get_database_schema tool first to understand the available models and their relations.
If the user asks you to add, edit, or delete data, use the execute_database_query tool with the appropriate operation (create, update, delete).
Always be careful with data manipulations.
Respond to the user in a helpful and clear manner.
If a query results in too much data, summarize it.
IMPORTANT: The primary default currency of this application is UZS (Узбекский сум), regardless of what the schema defaults might say. Always represent financial values in UZS unless specified otherwise.
IMPORTANT: When calling execute_database_query, ensure the arguments are passed as a valid JSON string inside the 'args' parameter.
`;

/**
 * Generate a response from the Azure OpenAI endpoint.
 * Handles tool calling (Function Calling) iteratively.
 */
export async function generateAIResponse(messages: any[]): Promise<string> {
  try {
    const aiClient = getClient();
    
    // Filter and map the messages
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system' || msg.role === 'tool' ? msg.role : 'user',
      content: msg.content || msg.text || '', // handle both content and text fields
      ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
      ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {})
    }));

    // Prepend the system prompt if not present
    if (!formattedMessages.find(m => m.role === 'system')) {
      formattedMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
    }

    // Keep querying while the model wants to call tools
    while (true) {
      const completion = await aiClient.chat.completions.create({
        model: deploymentName,
        messages: formattedMessages as any,
        tools: openAITools as any,
        tool_choice: "auto",
      });

      const responseMessage = completion.choices?.[0]?.message;
      if (!responseMessage) {
        return "No response received";
      }

      // If there are tool calls, execute them and append to the message list
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        formattedMessages.push(responseMessage as any);

        for (const toolCall of responseMessage.tool_calls) {
          console.log(`[AI] Invoking tool: ${(toolCall as any).function.name}`);
          const toolResult = await executeTool(toolCall as any);
          
          formattedMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult, null, 2)
          });
        }
        // Continue the while loop so the model sees the tool results
      } else {
        // Model provided a standard text response
        return responseMessage.content || "No response received";
      }
    }
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
}

/**
 * Translates text using Azure OpenAI
 */
export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  try {
    const aiClient = getClient();
    const prompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional explanations or quotes.\n\nText: ${text}`;
    
    const completion = await aiClient.chat.completions.create({
      model: deploymentName,
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
    });

    return completion.choices?.[0]?.message?.content || text;
  } catch (error) {
    console.error("Error translating text:", error);
    return text; // Fallback to original text if translation fails
  }
}
