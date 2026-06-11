import fs from 'fs';
import path from 'path';
import prisma from '../db';

export const openAITools = [
  {
    type: "function",
    function: {
      name: "get_database_schema",
      description: "Returns the database schema to understand available models and fields.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_database_query",
      description: "Executes a generic database query using Prisma ORM. Allows you to deeply understand and manipulate application data. Use this tool cautiously.",
      parameters: {
        type: "object",
        properties: {
          modelName: {
            type: "string",
            description: "The name of the Prisma model (e.g., 'transaction', 'account', 'user'). Must be lowercase/camelCase as defined in Prisma Client."
          },
          operation: {
            type: "string",
            description: "The Prisma operation to execute (e.g., 'findMany', 'findUnique', 'create', 'update', 'delete', 'aggregate', 'groupBy', 'count')."
          },
          args: {
            type: "string",
            description: "A JSON string representing the arguments to pass to the Prisma operation. E.g., '{\"where\": {\"id\": \"...\"}}' or '{\"data\": {\"amount\": 100}}'."
          }
        },
        required: ["modelName", "operation", "args"]
      }
    }
  }
];

export async function executeTool(toolCall: any): Promise<any> {
  const functionName = toolCall.function.name;
  const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};

  if (functionName === 'get_database_schema') {
    try {
      const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // We truncate the schema if it's too long, but usually it's fine for gpt-4
      // Alternatively, we could parse it, but raw text is fine for LLM.
      return { success: true, schema: schemaContent };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  if (functionName === 'execute_database_query') {
    try {
      const { modelName, operation, args: queryArgsStr } = args;
      
      if (!modelName || !operation) {
        throw new Error("Missing modelName or operation.");
      }

      // Check if the model exists on the prisma instance
      const dbModel = (prisma as any)[modelName];
      if (!dbModel || typeof dbModel[operation] !== 'function') {
        throw new Error(`Invalid model '${modelName}' or operation '${operation}'.`);
      }

      let queryArgs = {};
      if (queryArgsStr) {
        queryArgs = JSON.parse(queryArgsStr);
      }

      // Execute the query
      const result = await dbModel[operation](queryArgs);
      
      // Log the execution to console for debugging
      console.log(`[AI Tool] executed db.${modelName}.${operation}`, JSON.stringify(queryArgs));

      return { success: true, result };
    } catch (e: any) {
      console.error("[AI Tool Error] execute_database_query:", e.message);
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: `Unknown tool: ${functionName}` };
}
