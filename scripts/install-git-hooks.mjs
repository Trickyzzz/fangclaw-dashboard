import { execSync } from "node:child_process";

try {
  execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
  console.log("Git hooks installed. core.hooksPath=.githooks");
  console.log("Pre-commit will now run: pnpm run security:scan-secrets");
} catch (error) {
  console.error("Failed to install git hooks:", error instanceof Error ? error.message : error);
  process.exit(1);
}
