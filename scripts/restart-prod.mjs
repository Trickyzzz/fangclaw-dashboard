import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const port = process.env.PORT || "3100";

function findListeningPids(targetPort) {
  const output = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(`:${targetPort}`) || !line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts.at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== "0") {
      pids.add(pid);
    }
  }

  return Array.from(pids);
}

for (const pid of findListeningPids(port)) {
  console.log(`Stopping existing production process on port ${port}: PID ${pid}`);
  execFileSync("taskkill", ["/PID", pid, "/T", "/F"], { stdio: "inherit" });
}

console.log(`Starting production server on port ${port}...`);
execFileSync(process.execPath, [path.join(projectRoot, "scripts", "start-prod-detached.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
  },
});
