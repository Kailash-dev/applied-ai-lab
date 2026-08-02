import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const DATASET_PATH = path.join(process.cwd(), "evals", "dataset.json");

type TestCase = {
  id: string;
  category: "chat" | "extract" | "rag";
  name: string;
  endpoint: string;
  payload: Record<string, unknown>;
  assertions: {
    expectedStatus?: number;
    containsAny?: string[];
    requireJsonFields?: string[];
    minSources?: number;
    maxSources?: number;
  };
};

type TestResult = {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  latencyMs: number;
  errorDetail?: string;
};

async function runEvals() {
  console.log("=================================================");
  console.log(" 🧪 Applied AI Lab — Evaluation & Benchmark Suite");
  console.log(` Target Server: ${BASE_URL}`);
  console.log("=================================================\n");

  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`❌ Evaluation dataset not found at ${DATASET_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DATASET_PATH, "utf-8");
  const testCases: TestCase[] = JSON.parse(rawData);

  const results: TestResult[] = [];
  const suiteStarted = Date.now();

  for (const testCase of testCases) {
    const started = Date.now();
    let passed = true;
    let errorDetail = "";

    try {
      const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCase.payload),
      });

      const latencyMs = Date.now() - started;
      const expectedStatus = testCase.assertions.expectedStatus ?? 200;

      if (response.status !== expectedStatus) {
        passed = false;
        errorDetail = `Expected HTTP ${expectedStatus}, got HTTP ${response.status}`;
      } else {
        const body = (await response.json()) as Record<string, unknown>;

        // Check containsAny assertion
        if (testCase.assertions.containsAny) {
          const replyText = String(body.reply ?? body.error ?? JSON.stringify(body)).toLowerCase();
          const matched = testCase.assertions.containsAny.some((keyword) =>
            replyText.includes(keyword.toLowerCase()),
          );
          if (!matched) {
            passed = false;
            errorDetail = `Response did not contain any of: [${testCase.assertions.containsAny.join(", ")}]`;
          }
        }

        // Check required JSON fields assertion for extraction
        if (passed && testCase.assertions.requireJsonFields) {
          const dataObj = body.data as Record<string, unknown> | undefined;
          if (!dataObj || typeof dataObj !== "object") {
            passed = false;
            errorDetail = `Response missing "data" object`;
          } else {
            for (const field of testCase.assertions.requireJsonFields) {
              if (!(field in dataObj)) {
                passed = false;
                errorDetail = `Extracted data missing required field "${field}"`;
                break;
              }
            }
          }
        }

        // Check RAG minSources assertion
        if (passed && typeof testCase.assertions.minSources === "number") {
          const sources = (body.sources as unknown[]) ?? [];
          if (sources.length < testCase.assertions.minSources) {
            passed = false;
            errorDetail = `Expected at least ${testCase.assertions.minSources} sources, got ${sources.length}`;
          }
        }

        // Check RAG maxSources assertion (for abstention)
        if (passed && typeof testCase.assertions.maxSources === "number") {
          const sources = (body.sources as unknown[]) ?? [];
          if (sources.length > testCase.assertions.maxSources) {
            passed = false;
            errorDetail = `Expected at most ${testCase.assertions.maxSources} sources (abstention test), got ${sources.length}`;
          }
        }

        // Check Agent requireTool assertion
        if (passed && (testCase.assertions as any).requireTool) {
          const requiredTool = (testCase.assertions as any).requireTool;
          const steps = (body.steps as Array<{ toolCall?: { name: string } }>) ?? [];
          const executedTools = steps.map((s) => s.toolCall?.name).filter(Boolean);
          if (!executedTools.includes(requiredTool)) {
            passed = false;
            errorDetail = `Expected agent step trace to include tool '${requiredTool}', but executed: [${executedTools.join(", ")}]`;
          }
        }

        // Check Multi-Agent requireSubAgents assertion
        if (passed && (testCase.assertions as any).requireSubAgents) {
          const requiredAgents: string[] = (testCase.assertions as any).requireSubAgents;
          const traces = (body.subAgentTraces as Array<{ role: string }>) ?? [];
          const executedRoles = traces.map((t) => t.role);
          for (const reqRole of requiredAgents) {
            if (!executedRoles.includes(reqRole)) {
              passed = false;
              errorDetail = `Expected multi-agent trace to include sub-agent '${reqRole}', but executed: [${executedRoles.join(", ")}]`;
              break;
            }
          }
        }

      }


      results.push({
        id: testCase.id,
        name: testCase.name,
        category: testCase.category,
        passed,
        latencyMs,
        errorDetail,
      });

      const icon = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${icon} [${testCase.category.toUpperCase()}] ${testCase.name} (${latencyMs}ms)`);
      if (!passed && errorDetail) {
        console.log(`     ↳ Reason: ${errorDetail}`);
      }
    } catch (err) {
      const latencyMs = Date.now() - started;
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: testCase.id,
        name: testCase.name,
        category: testCase.category,
        passed: false,
        latencyMs,
        errorDetail: `Network/Fetch Error: ${msg}`,
      });
      console.log(`❌ FAIL [${testCase.category.toUpperCase()}] ${testCase.name} (${latencyMs}ms)`);
      console.log(`     ↳ Reason: Network Error: ${msg}`);
    }
  }

  const totalTime = Date.now() - suiteStarted;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const passRate = ((passedCount / results.length) * 100).toFixed(1);
  const avgLatency = Math.round(
    results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length,
  );

  console.log("\n=================================================");
  console.log(" 📊 Evaluation Benchmark Results Summary");
  console.log("=================================================");
  console.log(` Total Test Cases: ${results.length}`);
  console.log(` Passed:           ${passedCount} ✅`);
  console.log(` Failed:           ${failedCount} ❌`);
  console.log(` Pass Rate:        ${passRate}%`);
  console.log(` Average Latency:  ${avgLatency} ms`);
  console.log(` Suite Duration:   ${totalTime} ms`);
  console.log("=================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runEvals();
