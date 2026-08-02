import { vectorStore } from "../rag/vectorStore";

export type ToolParameterSchema = {
  type: "object";
  properties: Record<string, { type: string; description: string }>;
  required: string[];
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (args: Record<string, any>) => Promise<any>;
};

// Mock Database Tables
const MOCK_DB = {
  users: [
    { id: 1, name: "Kai", email: "kai@example.com", role: "admin", status: "active" },
    { id: 2, name: "Alice", email: "alice@example.com", role: "developer", status: "active" },
    { id: 3, name: "Bob", email: "bob@example.com", role: "analyst", status: "suspended" },
  ],
  orders: [
    { id: 101, user_id: 1, user_name: "Kai", product: "AI Pro Plan", total_usd: 99.0, status: "completed" },
    { id: 102, user_id: 1, user_name: "Kai", product: "Vector Store Credits", total_usd: 49.5, status: "completed" },
    { id: 103, user_id: 2, user_name: "Alice", product: "Basic Plan", total_usd: 29.0, status: "completed" },
    { id: 104, user_id: 3, user_name: "Bob", product: "Enterprise Trial", total_usd: 0.0, status: "cancelled" },
  ],
  products: [
    { id: "p1", name: "AI Pro Plan", price_usd: 99.0, stock: 999 },
    { id: "p2", name: "Vector Store Credits", price_usd: 49.5, stock: 5000 },
    { id: "p3", name: "Basic Plan", price_usd: 29.0, stock: 9999 },
  ],
};

export const tools: Record<string, ToolDefinition> = {
  sql_query: {
    name: "sql_query",
    description: "Query the application database. Supports querying tables: 'users', 'orders', or 'products'. Accepts a SQL-like string or table name.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "SQL-like query string (e.g. 'SELECT * FROM orders WHERE user_name = Kai' or table name 'users')",
        },
      },
      required: ["query"],
    },
    execute: async (args: { query?: string }): Promise<any> => {
      const q = (args.query ?? "").trim();
      const lower = q.toLowerCase();

      if (lower.includes("user") || lower.includes("users")) {
        if (lower.includes("kai")) return MOCK_DB.users.filter((u) => u.name.toLowerCase() === "kai");
        if (lower.includes("alice")) return MOCK_DB.users.filter((u) => u.name.toLowerCase() === "alice");
        if (lower.includes("bob")) return MOCK_DB.users.filter((u) => u.name.toLowerCase() === "bob");
        return MOCK_DB.users;
      }

      if (lower.includes("order") || lower.includes("orders")) {
        if (lower.includes("kai")) return MOCK_DB.orders.filter((o) => o.user_name.toLowerCase() === "kai");
        if (lower.includes("alice")) return MOCK_DB.orders.filter((o) => o.user_name.toLowerCase() === "alice");
        if (lower.includes("bob")) return MOCK_DB.orders.filter((o) => o.user_name.toLowerCase() === "bob");
        return MOCK_DB.orders;
      }

      if (lower.includes("product") || lower.includes("products")) {
        return MOCK_DB.products;
      }

      return {
        error: `Unknown table or unparseable query '${q}'. Available tables: users, orders, products.`,
      };
    },
  },

  doc_search: {
    name: "doc_search",
    description: "Search internal knowledge base documentation via vector semantic search. Returns relevant documentation chunks and source filenames.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The topic, question, or keyword to search in internal documentation.",
        },
      },
      required: ["query"],
    },
    execute: async (args: { query?: string }): Promise<any> => {
      const query = (args.query ?? "").trim();
      if (!query) return { error: "Query parameter is required." };

      const results = await vectorStore.search(query, 3, 0.35);
      if (results.length === 0) {
        return { message: `No documentation matches found for '${query}'.` };
      }

      return results.map((r) => ({
        source: r.chunk.filename,
        title: r.chunk.title,
        content: r.chunk.content,
        score: Number(r.score.toFixed(4)),
      }));
    },
  },

  calculator: {
    name: "calculator",
    description: "Perform safe mathematical calculations. Supports arithmetic operations (+, -, *, /, %, parenthesis).",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Mathematical expression to evaluate (e.g., '99.0 + 49.5' or '148.5 * 0.92')",
        },
      },
      required: ["expression"],
    },
    execute: async (args: { expression?: string }): Promise<any> => {
      const expr = (args.expression ?? "").trim();
      if (!expr) return { error: "Expression is required." };

      // Sanitize: allow only digits, decimal point, operators, parentheses, spaces
      if (!/^[0-9\s\.\+\-\*\/\%\(\)]+$/.test(expr)) {
        return { error: `Invalid characters in math expression: '${expr}'` };
      }

      try {
        // Safe evaluation
        const result = Function(`"use strict"; return (${expr})`)();
        return { expression: expr, result: typeof result === "number" ? Number(result.toFixed(4)) : result };
      } catch (err) {
        return { error: `Failed to evaluate expression '${expr}': ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },

  get_system_time: {
    name: "get_system_time",
    description: "Get the current system timestamp, date, time zone, and server runtime environment info.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async (): Promise<any> => {
      const now = new Date();
      return {
        timestamp: now.toISOString(),
        formattedDate: now.toUTCString(),
        environment: process.env.NODE_ENV ?? "development",
        uptimeSeconds: Math.floor(process.uptime()),
      };
    },
  },
};

export function getToolDefinitionsText(): string {
  return Object.values(tools)
    .map((t) => `- Tool '${t.name}': ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`)
    .join("\n\n");
}
