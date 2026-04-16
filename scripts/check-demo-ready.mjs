import "dotenv/config";

const baseUrl = process.env.DEMO_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3100}`;
const trpcUrl = `${baseUrl}/api/trpc/system.readiness`;

function print(label, value) {
  console.log(`${label.padEnd(26)} ${value}`);
}

async function checkHome() {
  const res = await fetch(baseUrl, { method: "GET" });
  return res.status;
}

async function checkReadiness() {
  const res = await fetch(trpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`readiness request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json?.result?.data?.json ?? null;
}

async function main() {
  console.log("=== FangClaw Demo Readiness ===");
  print("Base URL", baseUrl);

  const status = await checkHome();
  print("Home status", String(status));

  const readiness = await checkReadiness();
  if (!readiness) {
    throw new Error("empty readiness payload");
  }

  print("Mode", readiness.mode);
  print("DB connected", String(readiness.databaseConnected));
  print("LLM configured", String(readiness.llmConfigured));
  print("Routing enabled", String((process.env.OPENAI_MODEL_ROUTING_ENABLED ?? "true")));
  print("Mini model", process.env.OPENAI_MODEL_MINI || process.env.BUILT_IN_FORGE_MODEL_MINI || "-");
  print("Pro model", process.env.OPENAI_MODEL_PRO || process.env.BUILT_IN_FORGE_MODEL_PRO || "-");
  print("Missing items", readiness.missing?.length ? readiness.missing.join(", ") : "none");

  const pass =
    status === 200 &&
    readiness.databaseConnected &&
    readiness.llmConfigured &&
    readiness.mode === "realtime";

  console.log("");
  console.log(pass ? "DEMO READY: PASS" : "DEMO READY: CHECK REQUIRED");
  process.exitCode = pass ? 0 : 1;
  await new Promise(resolve => setTimeout(resolve, 80));
}

main().catch(err => {
  console.error("DEMO READY: FAIL");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
