import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const logDir = path.join(projectRoot, ".codex-runtime");
fs.mkdirSync(logDir, { recursive: true });

const out = fs.openSync(path.join(logDir, "prod.out.log"), "a");
const err = fs.openSync(path.join(logDir, "prod.err.log"), "a");

const child = spawn(process.execPath, [path.join(projectRoot, "dist", "index.js")], {
  cwd: projectRoot,
  detached: true,
  windowsHide: true,
  stdio: ["ignore", out, err],
  env: {
    ...process.env,
    NODE_ENV: "production",
  },
});

child.unref();

console.log(child.pid);
