export type SubAgentRole = "researcher" | "coder" | "auditor";

export type SubAgentExecutionTrace = {
  role: SubAgentRole;
  title: string;
  input: string;
  output: string;
  latencyMs: number;
};

export type MultiAgentRunResult = {
  goal: string;
  plan: string[];
  subAgentTraces: SubAgentExecutionTrace[];
  finalAuditedReport: string;
  model: string;
  latencyMs: number;
};
