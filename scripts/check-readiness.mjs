import "dotenv/config";

const required = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["OAUTH_SERVER_URL", process.env.OAUTH_SERVER_URL],
  [
    "BUILT_IN_FORGE_API_KEY / OPENAI_API_KEY",
    process.env.BUILT_IN_FORGE_API_KEY || process.env.OPENAI_API_KEY,
  ],
];

const missing = required.filter(([, value]) => !value).map(([name]) => name);

console.log("=== FangClaw Readiness (Env) ===");
for (const [name, value] of required) {
  console.log(`${value ? "OK   " : "MISS "} ${name}`);
}

if (missing.length === 0) {
  console.log("\nEnvironment: READY");
} else {
  console.log(`\nEnvironment: NOT READY (${missing.join(", ")})`);
}

const endpoint = "http://127.0.0.1:3100/api/trpc/system.readiness";
try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const text = await response.text();
  console.log(`\nEndpoint: ${response.status}`);
  console.log(text);
} catch (error) {
  console.log("\nEndpoint: UNREACHABLE");
  console.log(String(error));
}
