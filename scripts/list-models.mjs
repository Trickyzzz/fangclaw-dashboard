import "dotenv/config";

const base = (process.env.OPENAI_BASE_URL || "").replace(/\/$/, "");
const key = process.env.OPENAI_API_KEY;

if (!base || !key) {
  console.log("missing base/key");
  process.exit(1);
}

const response = await fetch(`${base}/v1/models`, {
  headers: {
    authorization: `Bearer ${key}`,
  },
});

console.log("status", response.status);
const text = await response.text();
console.log(text.slice(0, 12000));
