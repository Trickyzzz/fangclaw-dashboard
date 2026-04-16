import fs from "node:fs";

const file = ".codex-runtime/prod.err.log";
if (!fs.existsSync(file)) {
  console.log("no log file");
  process.exit(0);
}

const text = fs.readFileSync(file, "utf8");
const lines = text.trim().split(/\r?\n/);
console.log(lines.slice(-120).join("\n"));
