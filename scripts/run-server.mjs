import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const mode = process.argv[2];

if (mode !== "development" && mode !== "production") {
  console.error('Usage: node scripts/run-server.mjs <development|production>');
  process.exit(1);
}

const command =
  mode === "development"
    ? [
        process.execPath,
        [
          path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs"),
          "watch",
          path.join(projectRoot, "server", "_core", "index.ts"),
        ],
      ]
    : [process.execPath, [path.join(projectRoot, "dist", "index.js")]];

const child = spawn(command[0], command[1], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: mode,
  },
});

child.on("exit", code => {
  process.exit(code ?? 0);
});

child.on("error", error => {
  console.error(error);
  process.exit(1);
});
