import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const SAFE_VALUE_HINTS = [
  "your-",
  "replace-",
  "example",
  "placeholder",
  "changeme",
  "test",
];

const SECRET_PATTERNS = [
  {
    name: "OpenAI-style key",
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "Anthropic key",
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "Google API key",
    regex: /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  },
  {
    name: "Explicit API key assignment",
    regex: /\b(?:OPENAI|ANTHROPIC|GEMINI|DEEPSEEK|COHERE|MISTRAL|XAI)_[A-Z_]*KEY\s*=\s*(?!\s*$)([^\s#]+)/g,
    checkValue: true,
  },
];

const decode = buffer => buffer.toString("utf8");

const getStagedFiles = () => {
  const output = decode(
    execSync("git diff --cached --name-only --diff-filter=ACMRTUXB", {
      stdio: ["ignore", "pipe", "pipe"],
    })
  );
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(file => !file.startsWith("pnpm-lock.yaml"));
};

const shouldIgnoreFile = file =>
  file.endsWith(".png") ||
  file.endsWith(".jpg") ||
  file.endsWith(".jpeg") ||
  file.endsWith(".gif") ||
  file.endsWith(".pdf") ||
  file.endsWith(".lock");

const isLikelyPlaceholder = value => {
  const lower = String(value || "").toLowerCase();
  return SAFE_VALUE_HINTS.some(hint => lower.includes(hint));
};

const mask = value => {
  if (value.length <= 10) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const findings = [];

for (const relPath of getStagedFiles()) {
  if (shouldIgnoreFile(relPath)) continue;
  const absPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(absPath)) continue;
  const text = fs.readFileSync(absPath, "utf8");

  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const secretValue = pattern.checkValue ? match[1] : match[0];
      if (isLikelyPlaceholder(secretValue)) continue;
      findings.push({
        file: relPath,
        type: pattern.name,
        sample: mask(secretValue),
      });
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed. Potential credentials detected:");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.type} (${finding.sample})`);
  }
  console.error("Commit blocked. Remove or replace secrets before committing.");
  process.exit(1);
}

console.log("Secret scan passed: no staged credentials detected.");
